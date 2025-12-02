"""Repository for change log entries."""

from datetime import datetime
from typing import List, Optional

from database import get_db
from models.change_log import ChangeLogEntry


class ChangeLogRepository:
    """Persistence layer for change logs."""

    def __init__(self) -> None:
        self.collection_name = "change_logs"

    async def create_entry(self, payload: dict) -> ChangeLogEntry:
        db = get_db()
        doc = payload.copy()
        doc.setdefault("_id", f"chg_{str(datetime.utcnow().timestamp()).replace('.', '')}")
        doc.setdefault("created_at", datetime.utcnow())
        doc.setdefault("updated_at", datetime.utcnow())
        await db[self.collection_name].insert_one(doc)
        return ChangeLogEntry(**doc)

    async def list_by_project(self, project_id: str, limit: int = 50) -> List[ChangeLogEntry]:
        db = get_db()
        cursor = (
            db[self.collection_name]
            .find({"project_id": project_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        entries: List[ChangeLogEntry] = []
        async for doc in cursor:
            entries.append(ChangeLogEntry(**doc))
        return entries

    async def get_entry(self, entry_id: str) -> Optional[ChangeLogEntry]:
        db = get_db()
        doc = await db[self.collection_name].find_one({"_id": entry_id})
        if doc:
            return ChangeLogEntry(**doc)
        return None
