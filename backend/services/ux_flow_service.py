"""UX Flow generation service."""

from __future__ import annotations

from typing import Any, Dict
import logging

from config import settings
from emergentintegrations.llm.chat import LlmChat, UserMessage
from repositories.artifact_repository import ArtifactRepository
from repositories.project_repository import ProjectRepository
from repositories.requirement_repository import RequirementRepository
from repositories.diagram_repository import DiagramRepository
from models.diagram import DiagramState

logger = logging.getLogger(__name__)


class UxFlowService:
    """Service to generate and store UX Flow specs for a project."""

    def __init__(self) -> None:
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name
        self.project_repo = ProjectRepository()
        self.requirement_repo = RequirementRepository()
        self.artifact_repo = ArtifactRepository()
        self.diagram_repo = DiagramRepository()

    async def generate_ux_flow(self, project_id: str, organization: str) -> Dict[str, Any]:
        """Generate a UX flow specification document for a project and persist it as an artifact."""
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")

        if not self.api_key:
            logger.warning("LLM API key not configured; returning basic placeholder UX flow")
            content = {
                "markdown": "# UX Flow\n\nLLM is not configured. Please set LLM_API_KEY to enable UX generation.",
            }
        else:
            content = await self._call_llm(project_id, project.name, project.description or "", project.brief_text or "")

        title = f"UX Flow – {project.name}"
        metadata = {
            "kind": "ux_flow",
        }
        artifact = await self.artifact_repo.upsert_artifact(
            project.id,
            "UX_FLOW_SPEC",
            title,
            content,
            metadata=metadata,
        )
        return {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "metadata": artifact.metadata,
        }

    async def _call_llm(
        self,
        project_id: str,
        project_name: str,
        description: str,
        brief_text: str,
    ) -> Dict[str, Any]:
        """Invoke LLM with the UX prompt and return structured content."""
        # Collect a small snapshot of requirements for context (best-effort).
        try:
            requirements = await self.requirement_repo.list_by_project(project_id)
        except Exception:
            requirements = []

        req_summary_lines = []
        for idx, req in enumerate(requirements[:12], start=1):
            req_summary_lines.append(f"{idx}. [{req.type}] {req.title}: {req.description}")
        req_summary = "\n".join(req_summary_lines) if req_summary_lines else "No structured requirements yet."

        system_prompt = (
            "You are an expert UX Architect, Senior Product Manager, and Software Architect.\n"
            "Your job is to generate a full, end-to-end User Flow for the Acorn platform.\n"
            "Respond in clear, professional English and structure the answer into the required sections."
        )

        user_prompt = f"""
Acorn — Tiny Input. Massive Engineering.
An AI-powered, multi-agent system that automates:
• requirements extraction
• SRS generation
• UML design
• task planning
• proposal generation
• Gantt creation
• clarification cycles
• integrations (Trello, etc.)

Target project:
- Name: {project_name}
- Description: {description}
- Brief: {brief_text}

Current high-level requirements:
{req_summary}

You MUST produce an output that is:
✔ UX-aligned
✔ Business-driven
✔ Technically correct
✔ Fully consistent with the system architecture
✔ Matching the use case, class, and sequence diagrams (conceptually)

Your output MUST contain the following sections in order, using markdown headings:

1. User Roles & Permission Matrix
2. Full Information Architecture (IA)
3. End-to-End User Flow (Very Detailed)
4. Screen-by-Screen UX Specification
5. Business Logic Embedded in UX
6. System Behavior & State Machine
7. Error, Edge Case, and Recovery UX
8. Complete User Journey Map
9. Wireframe Blueprint (rough textual outline)

Each section must be present and clearly headed. Be concise but complete enough for design & engineering teams to implement.
"""

        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"ux_flow_{project_id}",
            system_message=system_prompt,
        ).with_model(self.provider, self.model)

        try:
            response_text = await chat.send_message(UserMessage(text=user_prompt))
        except Exception as exc:  # pragma: no cover
            logger.error("Failed to generate UX flow: %s", exc)
            return {
                "markdown": "# UX Flow\n\nWe could not generate the UX flow at this time. Please try again later.",
            }

        return {
            "markdown": response_text,
        }

    async def seed_diagram_from_ux_flow(self, project_id: str, organization: str) -> DiagramState:
        """Create or update the freeform canvas from the UX flow spec."""
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")

        artifacts = await self.artifact_repo.list_by_project(project.id, "UX_FLOW_SPEC")
        if not artifacts:
            raise ValueError("UX flow has not been generated yet")

        markdown = artifacts[0].content_json.get("markdown", "")
        sections = self._extract_sections(markdown)

        nodes = []
        edges = []
        for idx, title in enumerate(sections):
            node_id = f"ux_{idx}"
            nodes.append(
                {
                    "id": node_id,
                    "type": "default",
                    "position": {"x": 220 * (idx % 3), "y": 140 * (idx // 3)},
                    "data": {"label": title},
                }
            )
            if idx > 0:
                edges.append(
                    {
                        "id": f"ux_edge_{idx}",
                        "source": f"ux_{idx - 1}",
                        "target": node_id,
                        "type": "smoothstep",
                        "label": "",
                    }
                )

        title = f"UX Flow Canvas – {project.name}"
        metadata = {"source": "ux_flow_spec"}
        # We use the generic 'canvas' stage as the freeform Diagram Studio surface.
        return await self.diagram_repo.upsert_stage(project.id, "canvas", nodes, edges, title, metadata)

    def _extract_sections(self, markdown: str) -> list[str]:
        """Heuristically extract key headings from UX flow markdown."""
        sections: list[str] = []
        for raw_line in markdown.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            # Markdown heading or numbered section, e.g. "1. User Roles & Permission Matrix"
            if line.startswith("#"):
                text = line.lstrip("#").strip()
            elif line[0].isdigit() and "." in line[:4]:
                text = line
            else:
                continue
            # Avoid duplicates
            if text not in sections:
                sections.append(text)
        # Limit to keep diagram readable
        return sections[:18]
