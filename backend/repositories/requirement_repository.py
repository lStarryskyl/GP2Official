"""Requirement repository."""

import json
from typing import List, Optional
from database import get_db
from models.requirement import Requirement
from datetime import datetime
from config import settings


def _get_repository():
    """Get the appropriate repository based on settings and actual pool availability."""
    if settings.use_supabase:
        try:
            from database_supabase import pool
            if pool is not None:
                return _SupabaseRequirementRepository()
        except ImportError:
            pass
    return _MongoRequirementRepository()


class RequirementRepository:
    """Repository for requirement data access - delegates to appropriate backend."""
    
    def __init__(self):
        self._cached_repo = None
    
    @property
    def _repo(self):
        """Lazy repository getter - checks pool availability at call time."""
        if self._cached_repo is None:
            self._cached_repo = _get_repository()
        return self._cached_repo
    
    async def create_bulk(self, requirements_data: List[dict]) -> List[Requirement]:
        return await self._repo.create_bulk(requirements_data)
    
    async def list_by_project(self, project_id: str) -> List[Requirement]:
        return await self._repo.list_by_project(project_id)

    async def replace_project_requirements(self, project_id: str, requirements_data: List[dict]) -> List[Requirement]:
        return await self._repo.replace_project_requirements(project_id, requirements_data)

    async def get_by_id(self, requirement_id: str) -> Optional[Requirement]:
        return await self._repo.get_by_id(requirement_id)

    async def update_requirement(self, requirement_id: str, updates: dict) -> Optional[Requirement]:
        return await self._repo.update_requirement(requirement_id, updates)

    async def clone_project_requirements(self, source_project_id: str, target_project_id: str) -> List[Requirement]:
        return await self._repo.clone_project_requirements(source_project_id, target_project_id)


class _SupabaseRequirementRepository:
    """Supabase PostgreSQL implementation."""
    
    def _get_pool(self):
        from database_supabase import pool
        if pool is None:
            raise Exception("Supabase database pool not initialized.")
        return pool
    
    def _row_to_requirement(self, row) -> Requirement:
        """Convert database row to Requirement model."""
        data = dict(row)
        return Requirement(**data)
    
    async def create_bulk(self, requirements_data: List[dict]) -> List[Requirement]:
        """Create multiple requirements."""
        pool = self._get_pool()
        now = datetime.utcnow()
        created = []
        
        async with pool.acquire() as conn:
            for i, req in enumerate(requirements_data):
                req_id = f"req_{str(now.timestamp()).replace('.', '')}_{i}"
                
                row = await conn.fetchrow('''
                    INSERT INTO requirements (id, project_id, type, title, description, priority, status, confidence_score, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                    RETURNING *
                ''', req_id, req.get('project_id'), req.get('type'), req.get('title', 'Requirement'),
                   req.get('description'), req.get('priority', 'medium'), req.get('status', 'draft'),
                   req.get('confidence_score'), now)
                
                created.append(self._row_to_requirement(row))
        
        return created
    
    async def list_by_project(self, project_id: str) -> List[Requirement]:
        """List requirements by project."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at DESC',
                project_id
            )
        
        return [self._row_to_requirement(row) for row in rows]

    async def replace_project_requirements(self, project_id: str, requirements_data: List[dict]) -> List[Requirement]:
        """Replace all requirements for a project."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            # Delete existing requirements
            await conn.execute('DELETE FROM requirements WHERE project_id = $1', project_id)
        
        # Ensure each requirement is associated with this project
        for req in requirements_data:
            req["project_id"] = project_id
        
        return await self.create_bulk(requirements_data)

    async def get_by_id(self, requirement_id: str) -> Optional[Requirement]:
        """Fetch a single requirement."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM requirements WHERE id = $1', requirement_id)
        
        if row:
            return self._row_to_requirement(row)
        return None

    async def update_requirement(self, requirement_id: str, updates: dict) -> Optional[Requirement]:
        """Update a single requirement."""
        pool = self._get_pool()
        updates["updated_at"] = datetime.utcnow()
        
        set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(updates.keys())])
        query = f"UPDATE requirements SET {set_clause} WHERE id = $1 RETURNING *"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, requirement_id, *updates.values())
        
        if row:
            return self._row_to_requirement(row)
        return None

    async def clone_project_requirements(self, source_project_id: str, target_project_id: str) -> List[Requirement]:
        """Duplicate all requirements from one project to another."""
        pool = self._get_pool()
        now = datetime.utcnow()
        cloned = []
        
        async with pool.acquire() as conn:
            source_rows = await conn.fetch(
                'SELECT * FROM requirements WHERE project_id = $1',
                source_project_id
            )
            
            for i, row in enumerate(source_rows):
                data = dict(row)
                new_id = f"req_{str(now.timestamp()).replace('.', '')}_{i}"
                
                new_row = await conn.fetchrow('''
                    INSERT INTO requirements (id, project_id, type, title, description, priority, status, confidence_score, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                    RETURNING *
                ''', new_id, target_project_id, data.get('type'), data.get('title'),
                   data.get('description'), data.get('priority'), data.get('status'),
                   data.get('confidence_score'), now)
                
                cloned.append(self._row_to_requirement(new_row))
        
        return cloned


class _MongoRequirementRepository:
    """MongoDB/Memory implementation."""
    
    def __init__(self):
        self.collection_name = "requirements"
    
    async def create_bulk(self, requirements_data: List[dict]) -> List[Requirement]:
        """Create multiple requirements."""
        db = get_db()
        
        # Add IDs and timestamps
        for i, req in enumerate(requirements_data):
            req["_id"] = f"req_{str(datetime.utcnow().timestamp()).replace('.', '')}_{i}"
            timestamp = datetime.utcnow()
            req["created_at"] = timestamp
            req["updated_at"] = timestamp
        
        await db[self.collection_name].insert_many(requirements_data)
        return [Requirement(**req) for req in requirements_data]
    
    async def list_by_project(self, project_id: str) -> List[Requirement]:
        """List requirements by project."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": project_id}).sort("created_at", -1)
        
        requirements = []
        async for doc in cursor:
            requirements.append(Requirement(**doc))
        return requirements

    async def replace_project_requirements(self, project_id: str, requirements_data: List[dict]) -> List[Requirement]:
        """Replace all requirements for a project."""
        db = get_db()
        await db[self.collection_name].delete_many({"project_id": project_id})

        # Ensure each requirement is associated with this project
        for req in requirements_data:
            req["project_id"] = project_id

        return await self.create_bulk(requirements_data)

    async def get_by_id(self, requirement_id: str) -> Optional[Requirement]:
        """Fetch a single requirement."""
        db = get_db()
        doc = await db[self.collection_name].find_one({"_id": requirement_id})
        if doc:
            return Requirement(**doc)
        return None

    async def update_requirement(self, requirement_id: str, updates: dict) -> Optional[Requirement]:
        """Update a single requirement."""
        db = get_db()
        updates["updated_at"] = datetime.utcnow()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": requirement_id},
            {"$set": updates},
            return_document=True
        )
        if result:
            return Requirement(**result)
        return None

    async def clone_project_requirements(self, source_project_id: str, target_project_id: str) -> List[Requirement]:
        """Duplicate all requirements from one project to another."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": source_project_id})
        docs: List[dict] = []
        async for doc in cursor:
            new_doc = doc.copy()
            new_doc["_id"] = f"req_{str(datetime.utcnow().timestamp()).replace('.', '')}"
            new_doc["project_id"] = target_project_id
            timestamp = datetime.utcnow()
            new_doc["created_at"] = timestamp
            new_doc["updated_at"] = timestamp
            docs.append(new_doc)
        if docs:
            await db[self.collection_name].insert_many(docs)
        return [Requirement(**doc) for doc in docs]
