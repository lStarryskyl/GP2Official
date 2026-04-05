"""Activity repository (Postgres)."""

from typing import List, Optional
from datetime import datetime
import json
import uuid

from database import get_pool
from models.activity import ActivityLog


class ActivityRepository:
    """Persistence for activity logs."""

    def __init__(self):
        self.table_name = "activity_logs"

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_row(self, row) -> ActivityLog:
        data = dict(row)
        if isinstance(data.get("details_json"), str):
            try:
                data["details_json"] = json.loads(data["details_json"])
            except json.JSONDecodeError:
                data["details_json"] = {}
        return ActivityLog(**data)

    async def list_by_project(self, project_id: str, limit: int = 50) -> List[ActivityLog]:
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE project_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, project_id, limit)
        return [self._decode_row(row) for row in rows]

    async def record(
        self,
        project_id: str,
        event_type: str,
        user_id: str = None,
        details_json: Optional[dict] = None,
    ) -> ActivityLog:
        entry_id = f"act_{uuid.uuid4().hex}"
        now = datetime.utcnow()
        query = f"""
            INSERT INTO {self.table_name} (
                id, project_id, user_id, event_type, details_json, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                entry_id,
                project_id,
                user_id,
                event_type,
                json.dumps(details_json or {}),
                now,
            )
        return self._decode_row(row)
