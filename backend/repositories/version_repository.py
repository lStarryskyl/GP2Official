"""Version history repository (Postgres)."""

from typing import List, Optional
from datetime import datetime
import json
import uuid

from database import get_pool
from models.version import Version


class VersionRepository:
    def __init__(self):
        self.table_name = "version_history"

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_row(self, row) -> Version:
        data = dict(row)
        if isinstance(data.get("changes"), str):
            try:
                data["changes"] = json.loads(data["changes"])
            except json.JSONDecodeError:
                data["changes"] = {}
        return Version(**data)

    async def create_version(self, payload: dict) -> Version:
        version_id = payload.get("_id") or payload.get("id") or f"ver_{uuid.uuid4().hex}"
        now = payload.get("created_at") or datetime.utcnow()
        query = f"""
            INSERT INTO {self.table_name} (
                id, project_id, entity_type, entity_id, version_number,
                changes, change_summary, changed_by, changed_by_name,
                previous_version_id, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                version_id,
                payload.get("project_id"),
                payload.get("entity_type"),
                payload.get("entity_id"),
                payload.get("version_number"),
                json.dumps(payload.get("changes") or {}),
                payload.get("change_summary"),
                payload.get("changed_by"),
                payload.get("changed_by_name"),
                payload.get("previous_version_id"),
                now,
            )
        return self._decode_row(row)

    async def list_by_entity(self, entity_type: str, entity_id: str, limit: int = 20) -> List[Version]:
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY version_number DESC
            LIMIT $3
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, entity_type, entity_id, limit)
        return [self._decode_row(row) for row in rows]

    async def get_by_entity_version(self, entity_type: str, entity_id: str, version_number: int) -> Optional[Version]:
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE entity_type = $1 AND entity_id = $2 AND version_number = $3
            LIMIT 1
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, entity_type, entity_id, version_number)
        if row:
            return self._decode_row(row)
        return None

    async def get_latest_version_number(self, entity_type: str, entity_id: str) -> int:
        query = f"""
            SELECT COALESCE(MAX(version_number), 0) AS max_version
            FROM {self.table_name}
            WHERE entity_type = $1 AND entity_id = $2
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, entity_type, entity_id)
        return int(row["max_version"] or 0)
