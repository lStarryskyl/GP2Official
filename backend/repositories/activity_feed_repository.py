"""Activity feed repository (Postgres)."""

from datetime import datetime
from typing import List
import json
import uuid

from database import get_pool
from models.notification import ActivityFeedItem


class ActivityFeedRepository:
    """Persistence for rich activity feed items."""

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_row(self, row) -> ActivityFeedItem:
        data = dict(row)
        if isinstance(data.get("metadata"), str):
            try:
                data["metadata"] = json.loads(data["metadata"])
            except json.JSONDecodeError:
                data["metadata"] = {}
        return ActivityFeedItem(**data)

    async def create_item(self, payload: dict) -> ActivityFeedItem:
        item_id = payload.get("_id") or payload.get("id") or f"feed_{uuid.uuid4().hex}"
        created_at = payload.get("created_at") or datetime.utcnow()
        query = """
            INSERT INTO activity_feed (
                id, project_id, user_id, user_name, action,
                entity_type, entity_id, entity_name, description,
                metadata, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                item_id,
                payload.get("project_id"),
                payload.get("user_id"),
                payload.get("user_name"),
                payload.get("action"),
                payload.get("entity_type"),
                payload.get("entity_id"),
                payload.get("entity_name"),
                payload.get("description"),
                json.dumps(payload.get("metadata") or {}),
                created_at,
            )
        return self._decode_row(row)

    async def list_by_project(self, project_id: str, limit: int = 50) -> List[ActivityFeedItem]:
        query = """
            SELECT * FROM activity_feed
            WHERE project_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, project_id, limit)
        return [self._decode_row(row) for row in rows]
