"""Requirement repository."""

from typing import List, Optional
from database import get_db
from models.requirement import Requirement
from datetime import datetime


class RequirementRepository:
    """Repository for requirement data access."""
    
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
