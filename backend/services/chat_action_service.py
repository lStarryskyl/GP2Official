"""Service to apply assistant actions to project data."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import uuid4
import random
import logging
from datetime import datetime

from repositories.diagram_repository import DiagramRepository
from repositories.task_repository import TaskRepository

logger = logging.getLogger(__name__)


class ChatActionService:
    """Interprets structured chat actions and mutates project assets."""

    def __init__(self):
        self.diagram_repo = DiagramRepository()
        self.task_repo = TaskRepository()

    async def apply_actions(self, project_id: Optional[str], actions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply each action and return a status payload."""
        if not project_id or not actions:
            return []

        applied: List[Dict[str, Any]] = []
        for action in actions:
            action_type = (action or {}).get("type")
            if not action_type:
                continue
            handler = getattr(self, f"_handle_{action_type}", None)
            if not handler:
                logger.debug("Unknown chat action type %s", action_type)
                continue
            try:
                result = await handler(project_id, action)
                if result:
                    applied.append(result)
            except Exception as exc:
                logger.error("Failed to apply %s action: %s", action_type, exc)
        return applied

    async def _handle_diagram_suggestion(self, project_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        diagram_type = action.get("diagram_type") or action.get("target") or "use_case"
        doc = await self.diagram_repo.get(project_id, diagram_type)
        state = doc.get("state") if doc else {}
        nodes = list(state.get("nodes", []))
        annotations = dict(state.get("_annotations", {}))
        highlight_ids = set(annotations.get("highlighted_node_ids", []))

        additions = action.get("nodes") or []
        if not additions and action.get("description"):
            additions = [{"label": action["description"]}]

        created_ids: List[str] = []
        for node in additions:
            label = node.get("label") or node.get("title")
            if not label:
                continue
            node_id = node.get("id") or f"ai_node_{uuid4().hex[:6]}"
            created_ids.append(node_id)
            payload = {
                "id": node_id,
                "data": {
                    "label": label,
                    "helper": node.get("helper") or "Assistant suggestion",
                    "accent": node.get("accent") or "ai",
                },
                "position": node.get("position") or self._random_position(nodes),
                "style": node.get("style") or {
                    "border": "2px solid #f97316",
                    "borderRadius": 12,
                    "padding": 8,
                    "background": "#fffaf3",
                    "boxShadow": "0 10px 25px rgba(249,115,22,0.25)",
                },
            }
            nodes.append(payload)

        highlight_ids.update(created_ids)
        annotations["highlighted_node_ids"] = list(highlight_ids)
        annotations["last_action_at"] = datetime.utcnow().isoformat()
        if action.get("description"):
            annotations.setdefault("notes", []).append(action["description"])

        state["nodes"] = nodes
        state["_annotations"] = annotations
        await self.diagram_repo.upsert(project_id, diagram_type, state)
        return {
            "type": "diagram",
            "diagram_type": diagram_type,
            "highlighted": list(created_ids),
        }

    async def _handle_task_update(self, project_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a suggested task."""
        return await self._create_task_from_action(project_id, action)

    async def _handle_task_create(self, project_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        return await self._create_task_from_action(project_id, action)

    async def _create_task_from_action(self, project_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
        task_payload = dict(action.get("task") or {})
        if not task_payload and action.get("description"):
            task_payload = {"title": action["description"], "description": action["description"]}
        if not task_payload.get("title"):
            task_payload["title"] = "AI Task Suggestion"
        task_payload.setdefault("priority", "medium")
        task_payload.setdefault("estimate_hours", 4)
        task_payload.setdefault("status", "suggested")
        task_payload.setdefault("phase", action.get("phase"))
        task_payload["source"] = "assistant"

        doc = await self.task_repo.upsert_single(project_id, task_payload)
        return {"type": "task", "task_id": doc.get("_id"), "title": doc.get("title")}

    @staticmethod
    def _random_position(existing_nodes: List[Dict[str, Any]]):
        """Pick a scattered position based on how many nodes exist."""
        count = max(len(existing_nodes), 1)
        radius = min(200, 80 + count * 10)
        return {
            "x": random.randint(50, 350) + random.randint(-radius, radius),
            "y": random.randint(50, 250) + random.randint(-radius, radius),
        }
