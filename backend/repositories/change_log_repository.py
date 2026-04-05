"""Repository for change log entries."""

from datetime import datetime
from typing import List, Optional
import json
import uuid

from database import get_pool
from models.change_log import ChangeLogEntry


class ChangeLogRepository:
    """Persistence layer for change logs (Postgres)."""

    def __init__(self) -> None:
        self.table_name = "change_logs"

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_row(self, row) -> ChangeLogEntry:
        data = dict(row)
        for field, fallback in (
            ("files", []),
            ("task_ids", []),
            ("requirement_ids", []),
            ("metadata", {}),
        ):
            if isinstance(data.get(field), str):
                try:
                    data[field] = json.loads(data[field])
                except json.JSONDecodeError:
                    data[field] = fallback
        return ChangeLogEntry(**data)

    async def create_entry(self, payload: dict) -> ChangeLogEntry:
        entry_id = payload.get("_id") or payload.get("id") or f"chg_{uuid.uuid4().hex}"
        now = datetime.utcnow()
        payload = payload.copy()
        payload.setdefault("created_at", now)
        payload.setdefault("updated_at", now)
        payload["_id"] = entry_id

        files = payload.get("files") or []
        task_ids = payload.get("task_ids") or []
        requirement_ids = payload.get("requirement_ids") or []
        metadata = payload.get("metadata") or {}

        query = f"""
            INSERT INTO {self.table_name} (
                id, project_id, organization, author_id, description,
                files, task_ids, requirement_ids, entry_type,
                ai_summary, diagram_url, metadata, created_at, updated_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                entry_id,
                payload.get("project_id"),
                payload.get("organization"),
                payload.get("author_id"),
                payload.get("description"),
                json.dumps(files),
                json.dumps(task_ids),
                json.dumps(requirement_ids),
                payload.get("entry_type", "manual"),
                payload.get("ai_summary"),
                payload.get("diagram_url"),
                json.dumps(metadata),
                payload.get("created_at"),
                payload.get("updated_at"),
            )
        return self._decode_row(row)

    async def list_by_project(self, project_id: str, limit: int = 50) -> List[ChangeLogEntry]:
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE project_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, project_id, limit)
        return [self._decode_row(row) for row in rows]

    async def get_entry(self, entry_id: str) -> Optional[ChangeLogEntry]:
        query = f"SELECT * FROM {self.table_name} WHERE id = $1"
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, entry_id)
        if row:
            return self._decode_row(row)
        return None
