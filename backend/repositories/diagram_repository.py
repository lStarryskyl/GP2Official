"""Diagram workspace repository."""

from datetime import datetime
from typing import Dict, List, Optional

from database import get_db
from models.diagram import DiagramState, get_stage_label


class DiagramRepository:
    """Persistence helper for SDLC diagram workspaces."""

    def __init__(self):
        self.collection_name = "diagram_workspaces"

    async def get_stage(self, project_id: str, stage: str) -> Optional[DiagramState]:
        """Fetch a workspace for a specific stage."""
        db = get_db()
        doc = await db[self.collection_name].find_one(
            {"project_id": project_id, "stage": stage}
        )
        if doc:
            return DiagramState(**doc)
        return None

    async def list_by_project(self, project_id: str) -> List[DiagramState]:
        """List all workspaces for a project."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": project_id}).sort("stage", 1)
        diagrams: List[DiagramState] = []
        async for doc in cursor:
            diagrams.append(DiagramState(**doc))
        return diagrams

    async def upsert_stage(
        self,
        project_id: str,
        stage: str,
        nodes: List[Dict],
        edges: List[Dict],
        title: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> DiagramState:
        """Create or update a workspace for a stage."""
        db = get_db()
        now = datetime.utcnow()
        metadata = metadata or {}
        title = title or f"{get_stage_label(stage)} Diagram"
        result = await db[self.collection_name].find_one_and_update(
            {"project_id": project_id, "stage": stage},
            {
                "$set": {
                    "title": title,
                    "nodes": nodes,
                    "edges": edges,
                    "metadata": metadata,
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "_id": f"diagram_{str(now.timestamp()).replace('.', '')}",
                    "project_id": project_id,
                    "stage": stage,
                    "created_at": now,
                },
            },
            upsert=True,
            return_document=True,
        )
        return DiagramState(**result)
