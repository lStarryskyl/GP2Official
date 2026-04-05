"""Diagram workspace repository — PostgreSQL implementation."""

import json
from datetime import datetime
from typing import Dict, List, Optional

from models.diagram import DiagramState


def _get_pool():
    from database import pool
    if pool is None:
        raise Exception("Database pool not initialized.")
    return pool


def _row_to_state(row) -> DiagramState:
    data = dict(row)
    for field in ("nodes", "edges", "metadata", "frames"):
        if isinstance(data.get(field), str):
            try:
                data[field] = json.loads(data[field])
            except (json.JSONDecodeError, TypeError):
                data[field] = [] if field in ("nodes", "edges", "frames") else {}
    # DiagramState uses _id alias
    data["_id"] = data.pop("id", data.get("id", ""))
    return DiagramState(**data)


class DiagramRepository:
    """Persistence helper for SDLC diagram workspaces."""

    async def _ensure_table(self, conn):
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS diagram_workspaces (
                id          TEXT PRIMARY KEY,
                project_id  TEXT NOT NULL,
                stage       TEXT NOT NULL,
                title       TEXT NOT NULL DEFAULT '',
                nodes       TEXT NOT NULL DEFAULT '[]',
                edges       TEXT NOT NULL DEFAULT '[]',
                metadata    TEXT NOT NULL DEFAULT '{}',
                frames      TEXT NOT NULL DEFAULT '[]',
                created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                UNIQUE (project_id, stage)
            )
        ''')

    async def get_stage(self, project_id: str, stage: str) -> Optional[DiagramState]:
        pool = _get_pool()
        async with pool.acquire() as conn:
            await self._ensure_table(conn)
            row = await conn.fetchrow(
                'SELECT * FROM diagram_workspaces WHERE project_id = $1 AND stage = $2',
                project_id, stage
            )
        if row:
            return _row_to_state(row)
        return None

    async def list_by_project(self, project_id: str) -> List[DiagramState]:
        pool = _get_pool()
        async with pool.acquire() as conn:
            await self._ensure_table(conn)
            rows = await conn.fetch(
                'SELECT * FROM diagram_workspaces WHERE project_id = $1 ORDER BY stage',
                project_id
            )
        return [_row_to_state(r) for r in rows]

    async def upsert_stage(
        self,
        project_id: str,
        stage: str,
        nodes: List[Dict],
        edges: List[Dict],
        title: Optional[str] = None,
        metadata: Optional[Dict] = None,
        frames: Optional[List[Dict]] = None,
    ) -> DiagramState:
        from models.diagram import get_stage_label
        pool = _get_pool()
        now = datetime.utcnow()
        title = title or f"{get_stage_label(stage)} Diagram"
        metadata = metadata or {}
        frames = frames or []
        diagram_id = f"diagram_{project_id}_{stage}"

        async with pool.acquire() as conn:
            await self._ensure_table(conn)
            row = await conn.fetchrow('''
                INSERT INTO diagram_workspaces
                    (id, project_id, stage, title, nodes, edges, metadata, frames, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                ON CONFLICT (project_id, stage) DO UPDATE SET
                    title      = EXCLUDED.title,
                    nodes      = EXCLUDED.nodes,
                    edges      = EXCLUDED.edges,
                    metadata   = EXCLUDED.metadata,
                    frames     = EXCLUDED.frames,
                    updated_at = EXCLUDED.updated_at
                RETURNING *
            ''',
                diagram_id, project_id, stage, title,
                json.dumps(nodes), json.dumps(edges),
                json.dumps(metadata), json.dumps(frames),
                now
            )
        return _row_to_state(row)
