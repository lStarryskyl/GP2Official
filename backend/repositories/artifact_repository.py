"""Artifact repository."""

import json
from typing import List, Optional
from datetime import datetime
from database import get_db
from models.artifact import Artifact


def _get_repository():
    """Get the appropriate repository based on pool availability."""
    try:
        from database import pool
        if pool is not None:
            return _SupabaseArtifactRepository()
    except ImportError:
        pass
    return _MongoArtifactRepository()


class ArtifactRepository:
    """Data access for project artifacts - delegates to appropriate backend."""

    def __init__(self):
        self._cached_repo = None

    @property
    def _repo(self):
        """Lazy repository getter - checks pool availability at call time."""
        if self._cached_repo is None:
            self._cached_repo = _get_repository()
        return self._cached_repo

    async def upsert_artifact(
        self,
        project_id: str,
        artifact_type: str,
        title: str,
        content_json: dict,
        metadata: Optional[dict] = None,
    ) -> Artifact:
        return await self._repo.upsert_artifact(project_id, artifact_type, title, content_json, metadata)

    async def list_by_project(self, project_id: str, artifact_type: Optional[str] = None) -> List[Artifact]:
        return await self._repo.list_by_project(project_id, artifact_type)

    async def update_artifact(self, project_id: str, artifact_id: str, updates: dict) -> Optional[Artifact]:
        return await self._repo.update_artifact(project_id, artifact_id, updates)

    async def clone_project_artifacts(self, source_project_id: str, target_project_id: str) -> List[Artifact]:
        return await self._repo.clone_project_artifacts(source_project_id, target_project_id)

    async def get_latest_by_type(self, project_id: str, artifact_type: str) -> Optional[Artifact]:
        """Return the most recent artifact matching the given type, or None."""
        artifacts = await self.list_by_project(project_id, artifact_type)
        if not artifacts:
            return None
        # Sort by updated_at descending and return the first
        try:
            return sorted(artifacts, key=lambda a: a.updated_at or a.created_at or "", reverse=True)[0]
        except Exception:
            return artifacts[0]


class _SupabaseArtifactRepository:
    """PostgreSQL implementation for artifacts."""

    def _get_pool(self):
        from database import pool
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    async def upsert_artifact(
        self,
        project_id: str,
        artifact_type: str,
        title: str,
        content_json: dict,
        metadata: Optional[dict] = None,
    ) -> Artifact:
        """Create or update an artifact for a project."""
        pool = self._get_pool()
        now = datetime.utcnow()
        
        async with pool.acquire() as conn:
            # Check if artifact exists
            existing = await conn.fetchrow(
                'SELECT * FROM artifacts WHERE project_id = $1 AND type = $2',
                project_id, artifact_type
            )
            
            if existing:
                # Update existing artifact
                row = await conn.fetchrow('''
                    UPDATE artifacts 
                    SET title = $3, content_json = $4, metadata = $5, updated_at = $6, version = version + 1
                    WHERE project_id = $1 AND type = $2
                    RETURNING *
                ''', project_id, artifact_type, title, json.dumps(content_json), 
                   json.dumps(metadata or {}), now)
            else:
                # Insert new artifact
                artifact_id = f"artifact_{str(now.timestamp()).replace('.', '')}"
                row = await conn.fetchrow('''
                    INSERT INTO artifacts (id, project_id, type, title, content_json, metadata, version, is_approved, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, 1, false, $7, $7)
                    RETURNING *
                ''', artifact_id, project_id, artifact_type, title, 
                   json.dumps(content_json), json.dumps(metadata or {}), now)
        
        return self._row_to_artifact(row)

    def _row_to_artifact(self, row) -> Artifact:
        """Convert database row to Artifact model."""
        data = dict(row)
        # Parse JSON fields
        if isinstance(data.get('content_json'), str):
            try:
                data['content_json'] = json.loads(data['content_json'])
            except (json.JSONDecodeError, TypeError):
                data['content_json'] = {}
        if isinstance(data.get('metadata'), str):
            try:
                data['metadata'] = json.loads(data['metadata'])
            except (json.JSONDecodeError, TypeError):
                data['metadata'] = {}
        return Artifact(**data)

    async def list_by_project(self, project_id: str, artifact_type: Optional[str] = None) -> List[Artifact]:
        """List artifacts for a project."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            if artifact_type:
                rows = await conn.fetch(
                    'SELECT * FROM artifacts WHERE project_id = $1 AND type = $2 ORDER BY created_at DESC',
                    project_id, artifact_type
                )
            else:
                rows = await conn.fetch(
                    'SELECT * FROM artifacts WHERE project_id = $1 ORDER BY created_at DESC',
                    project_id
                )
        
        return [self._row_to_artifact(row) for row in rows]

    async def update_artifact(self, project_id: str, artifact_id: str, updates: dict) -> Optional[Artifact]:
        """Update an artifact document by id."""
        if not updates:
            return None
        
        pool = self._get_pool()
        now = datetime.utcnow()
        
        # Handle JSON fields
        payload = {}
        for k, v in updates.items():
            if v is not None:
                if k in ('content_json', 'metadata'):
                    payload[k] = json.dumps(v)
                else:
                    payload[k] = v
        
        if not payload:
            return None
        
        payload['updated_at'] = now
        
        set_clause = ", ".join([f"{k} = ${i+3}" for i, k in enumerate(payload.keys())])
        query = f"UPDATE artifacts SET {set_clause}, version = version + 1 WHERE project_id = $1 AND id = $2 RETURNING *"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, project_id, artifact_id, *payload.values())
        
        if row:
            return self._row_to_artifact(row)
        return None

    async def clone_project_artifacts(self, source_project_id: str, target_project_id: str) -> List[Artifact]:
        """Duplicate artifacts from one project to another."""
        pool = self._get_pool()
        now = datetime.utcnow()
        
        async with pool.acquire() as conn:
            # Get source artifacts
            source_rows = await conn.fetch(
                'SELECT * FROM artifacts WHERE project_id = $1',
                source_project_id
            )
            
            cloned = []
            for row in source_rows:
                data = dict(row)
                new_id = f"artifact_{str(now.timestamp()).replace('.', '')}"
                
                new_row = await conn.fetchrow('''
                    INSERT INTO artifacts (id, project_id, type, title, content_json, metadata, version, is_approved, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, 1, false, $7, $7)
                    RETURNING *
                ''', new_id, target_project_id, data['type'], data['title'],
                   data['content_json'], data['metadata'], now)
                
                cloned.append(self._row_to_artifact(new_row))
        
        return cloned


class _MongoArtifactRepository:
    """MongoDB/Memory implementation for artifacts."""

    def __init__(self):
        self.collection_name = "artifacts"

    async def upsert_artifact(
        self,
        project_id: str,
        artifact_type: str,
        title: str,
        content_json: dict,
        metadata: Optional[dict] = None,
    ) -> Artifact:
        """Create or update an artifact for a project."""
        db = get_db()
        now = datetime.utcnow()
        result = await db[self.collection_name].find_one_and_update(
            {"project_id": project_id, "type": artifact_type},
            {
                "$set": {
                    "title": title,
                    "content_json": content_json,
                    "metadata": metadata or {},
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "_id": f"artifact_{str(now.timestamp()).replace('.', '')}",
                    "project_id": project_id,
                    "type": artifact_type,
                    "version": 1,
                    "is_approved": False,
                    "created_at": now,
                },
            },
            return_document=True,
            upsert=True,
        )
        return Artifact(**result)

    async def list_by_project(self, project_id: str, artifact_type: Optional[str] = None) -> List[Artifact]:
        """List artifacts for a project."""
        db = get_db()
        query: dict = {"project_id": project_id}
        if artifact_type:
            query["type"] = artifact_type
        cursor = db[self.collection_name].find(query).sort("created_at", -1)
        artifacts: List[Artifact] = []
        async for doc in cursor:
            artifacts.append(Artifact(**doc))
        return artifacts

    async def update_artifact(self, project_id: str, artifact_id: str, updates: dict) -> Optional[Artifact]:
        """Update an artifact document by id."""
        if not updates:
            return None
        db = get_db()
        now = datetime.utcnow()
        payload = {k: v for k, v in updates.items() if v is not None}
        if not payload:
            return None
        payload["updated_at"] = now
        result = await db[self.collection_name].find_one_and_update(
            {"project_id": project_id, "_id": artifact_id},
            {"$set": payload},
            return_document=True,
        )
        if not result:
            return None
        return Artifact(**result)

    async def clone_project_artifacts(self, source_project_id: str, target_project_id: str) -> List[Artifact]:
        """Duplicate artifacts from one project to another."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": source_project_id})
        docs: List[dict] = []
        async for doc in cursor:
            new_doc = doc.copy()
            new_doc["_id"] = f"artifact_{str(datetime.utcnow().timestamp()).replace('.', '')}"
            new_doc["project_id"] = target_project_id
            now = datetime.utcnow()
            new_doc["created_at"] = now
            new_doc["updated_at"] = now
            docs.append(new_doc)
        if docs:
            await db[self.collection_name].insert_many(docs)
        return [Artifact(**doc) for doc in docs]
