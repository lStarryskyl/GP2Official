"""Repository for AI run audit trail."""

import json
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from database import get_db
from models.ai_run import AiRun

AI_RUN_TRACKING_ENABLED = False


def _get_repository():
    """Get the appropriate repository based on pool availability."""
    try:
        from database import pool
        if pool is not None:
            return _SupabaseAiRunRepository()
    except ImportError:
        pass
    return _MongoAiRunRepository()


class AiRunRepository:
    """Persist and query AI execution records - delegates to appropriate backend."""

    def __init__(self) -> None:
        self._cached_repo = None

    @property
    def _repo(self):
        """Lazy repository getter - checks pool availability at call time."""
        if self._cached_repo is None:
            self._cached_repo = _get_repository()
        return self._cached_repo

    async def create_run(
        self,
        *,
        project_id: str,
        user_id: Optional[str],
        job_type: str,
        phase: Optional[str],
        provider: Optional[str],
        model: Optional[str],
        prompt: Optional[str],
        metadata: Optional[Dict] = None,
    ) -> AiRun:
        if not AI_RUN_TRACKING_ENABLED:
            now = datetime.utcnow()
            return AiRun(
                _id=f"ai_run_disabled_{uuid4().hex}",
                project_id=project_id,
                user_id=user_id,
                job_type=job_type,
                phase=phase,
                provider=provider,
                model=model,
                status="disabled",
                prompt=prompt,
                metadata=metadata or {},
                created_at=now,
                updated_at=now,
            )
        return await self._repo.create_run(
            project_id=project_id,
            user_id=user_id,
            job_type=job_type,
            phase=phase,
            provider=provider,
            model=model,
            prompt=prompt,
            metadata=metadata,
        )

    async def complete_run(
        self,
        run_id: str,
        *,
        status: str,
        response: Optional[str] = None,
        duration_ms: Optional[int] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Optional[AiRun]:
        if not AI_RUN_TRACKING_ENABLED:
            return None
        return await self._repo.complete_run(
            run_id,
            status=status,
            response=response,
            duration_ms=duration_ms,
            error_message=error_message,
            metadata=metadata,
        )

    async def list_by_project(self, project_id: str, limit: int = 25) -> List[AiRun]:
        if not AI_RUN_TRACKING_ENABLED:
            return []
        return await self._repo.list_by_project(project_id, limit)

    async def list_by_projects(self, project_ids: List[str], limit: int = 200) -> List[AiRun]:
        if not AI_RUN_TRACKING_ENABLED:
            return []
        return await self._repo.list_by_projects(project_ids, limit)

    async def count_user_runs_since(self, user_id: str, since: datetime) -> int:
        if not AI_RUN_TRACKING_ENABLED:
            return 0
        return await self._repo.count_user_runs_since(user_id, since)


class _SupabaseAiRunRepository:
    """PostgreSQL implementation."""

    def _get_pool(self):
        from database import pool
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _row_to_ai_run(self, row) -> AiRun:
        """Convert database row to AiRun model."""
        data = dict(row)
        # Parse JSON fields
        if isinstance(data.get('metadata'), str):
            try:
                data['metadata'] = json.loads(data['metadata'])
            except:
                data['metadata'] = {}
        return AiRun(**data)

    async def create_run(
        self,
        *,
        project_id: str,
        user_id: Optional[str],
        job_type: str,
        phase: Optional[str],
        provider: Optional[str],
        model: Optional[str],
        prompt: Optional[str],
        metadata: Optional[Dict] = None,
    ) -> AiRun:
        """Create an audit entry for a new AI call."""
        pool = self._get_pool()
        now = datetime.utcnow()
        run_id = f"ai_run_{str(now.timestamp()).replace('.', '')}"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow('''
                INSERT INTO ai_runs (id, project_id, user_id, job_type, phase, provider, model, status, 
                                    prompt, response_excerpt, duration_ms, error_message, metadata, created_at, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'running', $8, NULL, NULL, NULL, $9, $10, NULL)
                RETURNING *
            ''', run_id, project_id, user_id, job_type, phase, provider, model,
               (prompt or "")[:2000] if prompt else None, json.dumps(metadata or {}), now)
        
        return self._row_to_ai_run(row)

    async def complete_run(
        self,
        run_id: str,
        *,
        status: str,
        response: Optional[str] = None,
        duration_ms: Optional[int] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Optional[AiRun]:
        """Mark a run as completed."""
        pool = self._get_pool()
        now = datetime.utcnow()
        
        async with pool.acquire() as conn:
            # First get existing metadata to merge
            existing = await conn.fetchrow('SELECT metadata FROM ai_runs WHERE id = $1', run_id)
            
            existing_metadata = {}
            if existing and existing['metadata']:
                if isinstance(existing['metadata'], str):
                    try:
                        existing_metadata = json.loads(existing['metadata'])
                    except:
                        pass
                else:
                    existing_metadata = existing['metadata']
            
            if metadata:
                existing_metadata.update(metadata)
            
            row = await conn.fetchrow('''
                UPDATE ai_runs 
                SET status = $2, completed_at = $3, response_excerpt = $4, duration_ms = $5, 
                    error_message = $6, metadata = $7
                WHERE id = $1
                RETURNING *
            ''', run_id, status, now, 
               response[:2000] if response else None,
               duration_ms,
               error_message[:500] if error_message else None,
               json.dumps(existing_metadata))
        
        if row:
            return self._row_to_ai_run(row)
        return None

    async def list_by_project(self, project_id: str, limit: int = 25) -> List[AiRun]:
        """Return the most recent runs for a project."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM ai_runs WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2',
                project_id, limit
            )
        
        return [self._row_to_ai_run(row) for row in rows]

    async def list_by_projects(self, project_ids: List[str], limit: int = 200) -> List[AiRun]:
        """Return recent runs for multiple projects."""
        if not project_ids:
            return []
        
        pool = self._get_pool()
        
        placeholders = ", ".join([f"${i+1}" for i in range(len(project_ids))])
        query = f"SELECT * FROM ai_runs WHERE project_id IN ({placeholders}) ORDER BY created_at DESC LIMIT ${len(project_ids)+1}"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *project_ids, limit)
        
        return [self._row_to_ai_run(row) for row in rows]

    async def count_user_runs_since(self, user_id: str, since: datetime) -> int:
        if not user_id:
            return 0
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT COUNT(*) AS n FROM ai_runs WHERE user_id = $1 AND created_at >= $2',
                user_id, since,
            )
        return int(row["n"]) if row else 0


class _MongoAiRunRepository:
    """MongoDB/Memory implementation."""

    def __init__(self) -> None:
        self.collection_name = "ai_runs"

    async def create_run(
        self,
        *,
        project_id: str,
        user_id: Optional[str],
        job_type: str,
        phase: Optional[str],
        provider: Optional[str],
        model: Optional[str],
        prompt: Optional[str],
        metadata: Optional[Dict] = None,
    ) -> AiRun:
        """Create an audit entry for a new AI call."""
        db = get_db()
        now = datetime.utcnow()
        doc = {
            "_id": f"ai_run_{str(now.timestamp()).replace('.', '')}",
            "project_id": project_id,
            "user_id": user_id,
            "job_type": job_type,
            "phase": phase,
            "provider": provider,
            "model": model,
            "status": "running",
            "prompt": (prompt or "")[:2000] if prompt else None,
            "response_excerpt": None,
            "duration_ms": None,
            "error_message": None,
            "metadata": metadata or {},
            "created_at": now,
            "completed_at": None,
            "updated_at": now,
        }
        await db[self.collection_name].insert_one(doc)
        return AiRun(**doc)

    async def complete_run(
        self,
        run_id: str,
        *,
        status: str,
        response: Optional[str] = None,
        duration_ms: Optional[int] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict] = None,
    ) -> Optional[AiRun]:
        """Mark a run as completed."""
        db = get_db()
        now = datetime.utcnow()
        updates: Dict = {
            "status": status,
            "completed_at": now,
            "updated_at": now,
        }
        if response is not None:
            updates["response_excerpt"] = response[:2000]
        if duration_ms is not None:
            updates["duration_ms"] = duration_ms
        if error_message is not None:
            updates["error_message"] = error_message[:500]
        if metadata:
            updates.setdefault("metadata", {}).update(metadata)
        result = await db[self.collection_name].find_one_and_update(
            {"_id": run_id},
            {"$set": updates},
            return_document=True,
        )
        if not result:
            return None
        return AiRun(**result)

    async def list_by_project(self, project_id: str, limit: int = 25) -> List[AiRun]:
        """Return the most recent runs for a project."""
        db = get_db()
        cursor = (
            db[self.collection_name]
            .find({"project_id": project_id})
            .sort("created_at", -1)
        )
        runs: List[AiRun] = []
        count = 0
        async for doc in cursor:
            if count >= limit:
                break
            runs.append(AiRun(**doc))
            count += 1
        return runs

    async def list_by_projects(self, project_ids: List[str], limit: int = 200) -> List[AiRun]:
        """Return recent runs for multiple projects."""
        if not project_ids:
            return []
        db = get_db()
        cursor = (
            db[self.collection_name]
            .find({"project_id": {"$in": project_ids}})
            .sort("created_at", -1)
        )
        runs: List[AiRun] = []
        count = 0
        async for doc in cursor:
            if count >= limit:
                break
            runs.append(AiRun(**doc))
            count += 1
        return runs

    async def count_user_runs_since(self, user_id: str, since: datetime) -> int:
        if not user_id:
            return 0
        db = get_db()
        return await db[self.collection_name].count_documents(
            {"user_id": user_id, "created_at": {"$gte": since}}
        )
