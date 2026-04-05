"""Generation job repository (Postgres)."""

from typing import Optional, List
from datetime import datetime
import json
import uuid

from database import get_pool
from models.generation import GenerationJob, JobStatus


class GenerationRepository:
    """Repository for generation job data access."""

    def __init__(self):
        self.table_name = "generation_jobs"

    def _get_pool(self):
        pool = get_pool()
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _decode_row(self, row) -> GenerationJob:
        data = dict(row)
        if isinstance(data.get("result_summary"), str):
            try:
                data["result_summary"] = json.loads(data["result_summary"])
            except json.JSONDecodeError:
                data["result_summary"] = None
        return GenerationJob(**data)

    async def create(self, project_id: str, user_id: str) -> GenerationJob:
        job_id = f"job_{uuid.uuid4().hex}"
        now = datetime.utcnow()
        query = f"""
            INSERT INTO {self.table_name} (
                id, project_id, user_id, status, progress,
                result_summary, error_message, created_at, completed_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *
        """
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(
                query,
                job_id,
                project_id,
                user_id,
                JobStatus.PENDING,
                0.0,
                None,
                None,
                now,
                None,
            )
        return self._decode_row(row)

    async def get_by_id(self, job_id: str) -> Optional[GenerationJob]:
        query = f"SELECT * FROM {self.table_name} WHERE id = $1"
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, job_id)
        if row:
            return self._decode_row(row)
        return None

    async def update_status(
        self,
        job_id: str,
        status: JobStatus,
        progress: float = None,
        error_message: str = None,
        result_summary: dict = None,
    ) -> Optional[GenerationJob]:
        updates = ["status = $2"]
        values = [job_id, status]
        idx = 3

        if progress is not None:
            updates.append(f"progress = ${idx}")
            values.append(progress)
            idx += 1
        if error_message is not None:
            updates.append(f"error_message = ${idx}")
            values.append(error_message)
            idx += 1
        if result_summary is not None:
            updates.append(f"result_summary = ${idx}")
            values.append(json.dumps(result_summary))
            idx += 1
        if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
            updates.append(f"completed_at = ${idx}")
            values.append(datetime.utcnow())
            idx += 1

        query = f"UPDATE {self.table_name} SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        async with self._get_pool().acquire() as conn:
            row = await conn.fetchrow(query, *values)
        if row:
            return self._decode_row(row)
        return None

    async def list_by_project(self, project_id: str) -> List[GenerationJob]:
        query = f"SELECT * FROM {self.table_name} WHERE project_id = $1 ORDER BY created_at DESC"
        async with self._get_pool().acquire() as conn:
            rows = await conn.fetch(query, project_id)
        return [self._decode_row(row) for row in rows]
