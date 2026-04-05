"""Negotiation repository (Postgres)."""

from datetime import datetime
from typing import List, Optional
import json
import uuid

from database import get_pool
from models.negotiation import Comment, NegotiationThread


class NegotiationRepository:
    """Persistence for negotiation threads and comments."""

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_thread_row(self, row) -> dict:
        data = dict(row)
        if isinstance(data.get("stakeholder_ids"), str):
            try:
                data["stakeholder_ids"] = json.loads(data["stakeholder_ids"])
            except json.JSONDecodeError:
                data["stakeholder_ids"] = []
        return data

    def _decode_comment_row(self, row) -> dict:
        data = dict(row)
        for field, fallback in (("mentions", []), ("reactions", {})):
            if isinstance(data.get(field), str):
                try:
                    data[field] = json.loads(data[field])
                except json.JSONDecodeError:
                    data[field] = fallback
        return data

    async def create_thread(self, payload: dict) -> NegotiationThread:
        thread_id = payload.get("_id") or payload.get("id") or f"thread_{uuid.uuid4().hex}"
        now = datetime.utcnow()
        query = """
            INSERT INTO negotiation_threads (
                id, project_id, requirement_id, title, description, status,
                priority, stakeholder_ids, created_by, resolution, resolved_at,
                created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                thread_id,
                payload.get("project_id"),
                payload.get("requirement_id"),
                payload.get("title"),
                payload.get("description"),
                payload.get("status", "open"),
                payload.get("priority", "medium"),
                json.dumps(payload.get("stakeholder_ids") or []),
                payload.get("created_by"),
                payload.get("resolution"),
                payload.get("resolved_at"),
                now,
            )
        data = self._decode_thread_row(row)
        data["comments"] = []
        data["decisions"] = []
        data["impact_analysis_id"] = None
        return NegotiationThread(**data)

    async def list_threads_by_project(self, project_id: str) -> List[NegotiationThread]:
        query = """
            SELECT * FROM negotiation_threads
            WHERE project_id = $1
            ORDER BY updated_at DESC, created_at DESC
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, project_id)

        threads: List[NegotiationThread] = []
        for row in rows:
            data = self._decode_thread_row(row)
            data["comments"] = [comment.id for comment in await self.list_comments(data["id"])]
            data["decisions"] = []
            data["impact_analysis_id"] = None
            threads.append(NegotiationThread(**data))
        return threads

    async def get_thread(self, thread_id: str) -> Optional[NegotiationThread]:
        query = "SELECT * FROM negotiation_threads WHERE id = $1"
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, thread_id)
        if not row:
            return None
        data = self._decode_thread_row(row)
        data["comments"] = [comment.id for comment in await self.list_comments(thread_id)]
        data["decisions"] = []
        data["impact_analysis_id"] = None
        return NegotiationThread(**data)

    async def add_comment(self, payload: dict) -> Comment:
        comment_id = payload.get("_id") or payload.get("id") or f"comment_{uuid.uuid4().hex}"
        now = datetime.utcnow()
        query = """
            INSERT INTO negotiation_comments (
                id, thread_id, project_id, requirement_id, parent_id,
                content, author_id, author_name, mentions, reactions,
                edited, created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                comment_id,
                payload.get("thread_id"),
                payload.get("project_id"),
                payload.get("requirement_id"),
                payload.get("parent_id"),
                payload.get("content"),
                payload.get("author_id"),
                payload.get("author_name"),
                json.dumps(payload.get("mentions") or []),
                json.dumps(payload.get("reactions") or {}),
                payload.get("edited", False),
                now,
            )
        data = self._decode_comment_row(row)
        data["replies"] = []
        return Comment(**data)

    async def list_comments(self, thread_id: str) -> List[Comment]:
        query = """
            SELECT * FROM negotiation_comments
            WHERE thread_id = $1
            ORDER BY created_at ASC
        """
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, thread_id)

        rows_by_id = {row["id"]: dict(row) for row in rows}
        children: dict[str, list[str]] = {}
        for row in rows:
            parent_id = row["parent_id"]
            if parent_id:
                children.setdefault(parent_id, []).append(row["id"])

        comments: List[Comment] = []
        for row in rows:
            data = self._decode_comment_row(rows_by_id[row["id"]])
            data["replies"] = children.get(row["id"], [])
            comments.append(Comment(**data))
        return comments

    async def resolve_thread(self, thread_id: str, resolution: str) -> Optional[NegotiationThread]:
        now = datetime.utcnow()
        query = """
            UPDATE negotiation_threads
            SET resolution = $2, resolved_at = $3, status = 'resolved', updated_at = $3
            WHERE id = $1
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, thread_id, resolution, now)
        if not row:
            return None
        data = self._decode_thread_row(row)
        data["comments"] = [comment.id for comment in await self.list_comments(thread_id)]
        data["decisions"] = []
        data["impact_analysis_id"] = None
        return NegotiationThread(**data)
