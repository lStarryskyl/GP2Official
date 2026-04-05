"""Traceability repository (Postgres)."""

from datetime import datetime
from typing import List
import uuid

from database import get_pool
from models.traceability import TraceabilityLink


class TraceabilityRepository:
    """Persistence for traceability links."""

    def __init__(self):
        self.table_name = "traceability_links"

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    async def create_link(self, payload: dict) -> TraceabilityLink:
        link_id = payload.get("_id") or payload.get("id") or f"trace_{uuid.uuid4().hex}"
        created_at = payload.get("created_at") or datetime.utcnow()
        query = f"""
            INSERT INTO {self.table_name} (
                id, project_id, source_type, source_id, source_name,
                target_type, target_id, target_name, link_type,
                rationale, created_by, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                link_id,
                payload.get("project_id"),
                payload.get("source_type"),
                payload.get("source_id"),
                payload.get("source_name"),
                payload.get("target_type"),
                payload.get("target_id"),
                payload.get("target_name"),
                payload.get("link_type"),
                payload.get("rationale"),
                payload.get("created_by"),
                created_at,
            )
        return TraceabilityLink(**row)

    async def list_by_project(self, project_id: str) -> List[TraceabilityLink]:
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE project_id = $1
            ORDER BY created_at DESC
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, project_id)
        return [TraceabilityLink(**row) for row in rows]
