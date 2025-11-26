"""Diagram workspace service."""

from datetime import datetime
from typing import Dict, List, Any

from fastapi import HTTPException, status

from models.diagram import (
    DiagramChatResponse,
    DiagramState,
    DiagramStateResponse,
    DiagramUpdateRequest,
    SDLC_STAGE_ORDER,
    get_stage_label,
)
from repositories.diagram_repository import DiagramRepository
from repositories.requirement_repository import RequirementRepository
from repositories.artifact_repository import ArtifactRepository
from repositories.task_repository import TaskRepository
from services.diagram_assistant import DiagramAssistant


class DiagramService:
    """Business logic for SDLC diagram workspaces."""
    
    def __init__(self):
        self.repo = DiagramRepository()
        self.requirement_repo = RequirementRepository()
        self.artifact_repo = ArtifactRepository()
        self.task_repo = TaskRepository()
        self.assistant = DiagramAssistant()

    async def ensure_stage(self, project_id: str, stage: str) -> DiagramState:
        """Get an existing stage or create a default workspace.

        For known SDLC stages we seed a thematic blueprint.
        For arbitrary stages (e.g. freeform canvases) we start from an empty canvas.
        """
        normalized = stage.lower()

        diagram = await self.repo.get_stage(project_id, normalized)
        if diagram:
            return diagram

        if normalized in SDLC_STAGE_ORDER:
            defaults = self._default_blueprint(normalized)
        else:
            defaults = {
                "title": f"{get_stage_label(normalized)} Canvas",
                "nodes": [],
                "edges": [],
                "metadata": {
                    "stage_label": get_stage_label(normalized),
                    "generated_at": datetime.utcnow().isoformat(),
                },
            }
        return await self.repo.upsert_stage(
            project_id,
            normalized,
            defaults["nodes"],
            defaults["edges"],
            defaults["title"],
            defaults["metadata"],
        )

    async def list_or_seed(self, project_id: str) -> List[DiagramState]:
        """Return workspaces for all stages (creating defaults if missing)."""
        stages: List[DiagramState] = []
        for stage in SDLC_STAGE_ORDER:
            workspace = await self.ensure_stage(project_id, stage)
            stages.append(workspace)
        return stages

    async def save_stage(self, project_id: str, stage: str, payload: DiagramUpdateRequest) -> DiagramState:
        """Persist nodes/edges for a stage."""
        await self.ensure_stage(project_id, stage)  # validates stage/project
        return await self.repo.upsert_stage(
            project_id,
            stage.lower(),
            payload.nodes,
            payload.edges,
            payload.title or f"{get_stage_label(stage)} Diagram",
        )

    async def chat(self, project_id: str, stage: str, message: str) -> DiagramChatResponse:
        """Apply an AI-style instruction to a workspace."""
        diagram = await self.ensure_stage(project_id, stage)
        nodes, edges, response_text = self.assistant.apply_instruction(
            diagram.nodes,
            diagram.edges,
            message,
        )
        updated = await self.repo.upsert_stage(
            project_id,
            diagram.stage,
            nodes,
            edges,
            diagram.title,
            diagram.metadata,
        )
        return DiagramChatResponse(
            message=response_text,
            nodes=updated.nodes,
            edges=updated.edges,
            stage=updated.stage,
        )

    def to_response(self, diagram: DiagramState) -> DiagramStateResponse:
        """Serialize workspace into API response."""
        return DiagramStateResponse(
            id=diagram.id,
            diagram_id=diagram.id,
            project_id=diagram.project_id,
            stage=diagram.stage,
            title=diagram.title,
            nodes=diagram.nodes,
            edges=diagram.edges,
            metadata=diagram.metadata,
            created_at=diagram.created_at,
            updated_at=diagram.updated_at,
        )

    def _default_blueprint(self, stage: str) -> Dict:
        """Build seed nodes/edges for a new stage."""
        stage_label = get_stage_label(stage)
        theme_nodes = self._stage_focus(stage)
        nodes = []
        edges = []
        for idx, label in enumerate(theme_nodes):
            nodes.append(
                {
                    "id": f"{stage}_{idx}",
                    "type": "default",
                    "position": {"x": 160 * idx, "y": 120 * (idx % 2)},
                    "data": {"label": label},
                }
            )
            if idx > 0:
                edges.append(
                    {
                        "id": f"{stage}_edge_{idx}",
                        "source": f"{stage}_{idx - 1}",
                        "target": f"{stage}_{idx}",
                        "type": "smoothstep",
                        "label": f"{theme_nodes[idx - 1]} → {label}",
                    }
                )

        metadata = {
            "stage_label": stage_label,
            "generated_at": datetime.utcnow().isoformat(),
        }
        return {
            "title": f"{stage_label} Diagram",
            "nodes": nodes,
            "edges": edges,
            "metadata": metadata,
        }

    def _stage_focus(self, stage: str) -> List[str]:
        """Return themed nodes per stage."""
        focus_map = {
            "planning": ["Vision", "Stakeholders", "Roadmap"],
            "requirements": ["Elicitation", "Specification", "Validation"],
            "design": ["Architecture", "Components", "Interfaces"],
            "implementation": ["Services", "APIs", "Data Store"],
            "testing": ["Test Plan", "Test Cases", "Bug Tracker"],
            "deployment": ["CI/CD", "Environments", "Monitoring"],
            "maintenance": ["Feedback", "Backlog", "Iterations"],
        }
        return focus_map.get(stage, ["Input", "Process", "Output"])

    async def seed_mode(self, project_id: str, organization: str, mode: str) -> DiagramState:
        """Seed a canvas mode from existing project data."""
        normalized = mode.lower()
        if normalized not in {"requirements", "srs", "costs", "freeform"}:
            raise ValueError("Unsupported diagram mode")

        stage = "canvas" if normalized == "freeform" else f"{normalized}_canvas"
        if normalized == "requirements":
            nodes, edges = await self._build_requirements_nodes(project_id)
            title = "Requirements Canvas"
        elif normalized == "srs":
            nodes, edges = await self._build_srs_nodes(project_id)
            title = "SRS Canvas"
        elif normalized == "costs":
            nodes, edges = await self._build_cost_nodes(project_id)
            title = "Costs Canvas"
        else:
            nodes, edges = [], []
            title = "Freeform Canvas"

        metadata = {"seeded_from": normalized}
        return await self.repo.upsert_stage(project_id, stage, nodes, edges, title, metadata)

    async def _build_requirements_nodes(self, project_id: str):
        requirements = await self.requirement_repo.list_by_project(project_id)
        nodes = []
        edges = []
        for idx, req in enumerate(requirements[:30]):
            nodes.append(
                {
                    "id": f"req_{req.id}",
                    "type": "default",
                    "position": {"x": 260 * (idx % 4), "y": 160 * (idx // 4)},
                    "data": {
                        "label": req.title,
                        "description": req.description[:140],
                        "type": req.type,
                    },
                }
            )
            if idx > 0:
                edges.append(
                    {
                        "id": f"req_edge_{idx}",
                        "source": f"req_{requirements[idx - 1].id}",
                        "target": f"req_{req.id}",
                        "type": "smoothstep",
                        "data": {"type": "sequence"},
                    }
                )
        return nodes, edges

    async def _build_srs_nodes(self, project_id: str):
        artifacts = await self.artifact_repo.list_by_project(project_id, "SRS")
        nodes = []
        edges = []
        if not artifacts:
            return nodes, edges
        content = artifacts[0].content_json or {}
        sections = self._flatten_srs_sections(content)
        for idx, section in enumerate(sections):
            nodes.append(
                {
                    "id": f"srs_{idx}",
                    "type": "default",
                    "position": {"x": 280 * (idx % 3), "y": 170 * (idx // 3)},
                    "data": {"label": section},
                }
            )
            if idx > 0:
                edges.append(
                    {
                        "id": f"srs_edge_{idx}",
                        "source": f"srs_{idx - 1}",
                        "target": f"srs_{idx}",
                        "type": "smoothstep",
                    }
                )
        return nodes, edges

    async def _build_cost_nodes(self, project_id: str):
        tasks = await self.task_repo.list_by_project(project_id)
        buckets: Dict[str, Dict[str, Any]] = {}
        for task in tasks:
            key = (task.phase or task.status or "other").title()
            bucket = buckets.setdefault(key, {"hours": 0.0, "count": 0})
            bucket["hours"] += float(task.estimate_hours or 0)
            bucket["count"] += 1

        nodes = []
        edges = []
        for idx, (label, info) in enumerate(buckets.items()):
            nodes.append(
                {
                    "id": f"cost_{idx}",
                    "type": "default",
                    "position": {"x": 300 * (idx % 3), "y": 180 * (idx // 3)},
                    "data": {
                        "label": label,
                        "description": f"{info['count']} tasks • {info['hours']:.1f}h",
                    },
                }
            )
            if idx > 0:
                edges.append(
                    {
                        "id": f"cost_edge_{idx}",
                        "source": f"cost_{idx - 1}",
                        "target": f"cost_{idx}",
                        "type": "smoothstep",
                    }
                )
        return nodes, edges

    def _flatten_srs_sections(self, content: Dict[str, Any]) -> List[str]:
        sections: List[str] = []
        for key, value in content.items():
            title = key.replace("_", " ").title()
            sections.append(title)
            if isinstance(value, dict):
                for subkey in value.keys():
                    sections.append(f"{title} → {subkey.replace('_', ' ').title()}")
        return sections[:20]
