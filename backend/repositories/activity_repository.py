"""Activity repository (minimal stub)."""

from typing import List, Optional
from database import get_db
from models.activity import ActivityLog
from datetime import datetime


class ActivityRepository:
    """Persistence for activity logs."""

    def __init__(self):
        self.collection_name = "activity_logs"

    async def list_by_project(self, project_id: str, limit: int = 50) -> List[ActivityLog]:
        """Return recent activity for a project (if any)."""
        db = get_db()
        cursor = (
            db[self.collection_name]
            .find({"project_id": project_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        items: List[ActivityLog] = []
        async for doc in cursor:
            items.append(ActivityLog(**doc))
        return items

    async def record(
        self,
        project_id: str,
        event_type: str,
        user_id: str = None,
        details_json: Optional[dict] = None,
    ) -> ActivityLog:
        """Insert a new activity log."""
        db = get_db()
        doc = {
            "_id": f"act_{str(datetime.utcnow().timestamp()).replace('.', '')}",
            "project_id": project_id,
            "user_id": user_id,
            "event_type": event_type,
            "details_json": details_json or {},
            "created_at": datetime.utcnow(),
        }
        await db[self.collection_name].insert_one(doc)
        return ActivityLog(**doc)
