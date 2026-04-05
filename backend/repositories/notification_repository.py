"""Notification repository (Postgres)."""

from typing import List
from datetime import datetime
import json
import uuid

from database import get_pool
from models.notification import Notification


class NotificationRepository:
    def __init__(self):
        self.table_name = "notifications"

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_row(self, row) -> Notification:
        data = dict(row)
        if isinstance(data.get("metadata"), str):
            try:
                data["metadata"] = json.loads(data["metadata"])
            except json.JSONDecodeError:
                data["metadata"] = {}
        return Notification(**data)

    async def create_notification(self, payload: dict) -> Notification:
        notif_id = payload.get("_id") or payload.get("id") or f"not_{uuid.uuid4().hex}"
        now = payload.get("created_at") or datetime.utcnow()
        query = f"""
            INSERT INTO {self.table_name} (
                id, user_id, project_id, type, title, message, priority,
                entity_type, entity_id, action_url, metadata, read, read_at, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                notif_id,
                payload.get("user_id"),
                payload.get("project_id"),
                payload.get("type"),
                payload.get("title"),
                payload.get("message"),
                payload.get("priority", "normal"),
                payload.get("entity_type"),
                payload.get("entity_id"),
                payload.get("action_url"),
                json.dumps(payload.get("metadata") or {}),
                payload.get("read", False),
                payload.get("read_at"),
                now,
            )
        return self._decode_row(row)

    async def list_by_user(self, user_id: str, unread_only: bool = False, limit: int = 50) -> List[Notification]:
        condition = "AND read = false" if unread_only else ""
        query = f"""
            SELECT * FROM {self.table_name}
            WHERE user_id = $1 {condition}
            ORDER BY created_at DESC
            LIMIT $2
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, user_id, limit)
        return [self._decode_row(row) for row in rows]

    async def mark_as_read(self, notification_id: str) -> Notification:
        query = f"""
            UPDATE {self.table_name}
            SET read = true, read_at = $2
            WHERE id = $1
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, notification_id, datetime.utcnow())
        return self._decode_row(row) if row else None

    async def mark_all_as_read(self, user_id: str) -> int:
        query = f"""
            UPDATE {self.table_name}
            SET read = true, read_at = $2
            WHERE user_id = $1 AND read = false
        """
        async with self._get_pool().acquire() as conn:
            result = await conn.execute(query, user_id, datetime.utcnow())
        return int(result.split()[-1]) if result else 0
