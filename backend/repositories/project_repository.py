"""Project repository."""

from typing import List, Optional, Dict
from database import get_db
from models.project import Project, ProjectCreate, ProjectUpdate
from datetime import datetime


class ProjectRepository:
    """Repository for project data access."""
    
    def __init__(self):
        self.collection_name = "projects"
    
    async def create(self, project_data: ProjectCreate, user_id: str, organization: str) -> Project:
        """Create a new project."""
        db = get_db()
        
        project_doc = {
            "_id": f"proj_{str(datetime.utcnow().timestamp()).replace('.', '')}",
            "name": project_data.name,
            "description": project_data.description,
            "template_type": project_data.template_type,
            "brief_text": project_data.brief_text,
            "questionnaire_data": project_data.questionnaire_data or {},
            "owner_id": user_id,
            "organization": organization,
            "status": "draft",
            "feature_tier": project_data.feature_tier or "pro",
            "phase_status": project_data.phase_status,
            "roadmap": project_data.__dict__.get('roadmap') if hasattr(project_data, 'roadmap') else None,
            "roadmap_summary": project_data.__dict__.get('roadmap_summary') if hasattr(project_data, 'roadmap_summary') else None,
            "feasibility_studies": project_data.__dict__.get('feasibility_studies') if hasattr(project_data, 'feasibility_studies') else None,
            "feasibility_sections": project_data.__dict__.get('feasibility_sections') if hasattr(project_data, 'feasibility_sections') else None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        await db[self.collection_name].insert_one(project_doc)
        return Project(**project_doc)
    
    async def get_by_id(self, project_id: str, organization: str) -> Optional[Project]:
        """Get project by ID."""
        db = get_db()
        project_doc = await db[self.collection_name].find_one({
            "_id": project_id,
            "organization": organization
        })
        if project_doc:
            return Project(**project_doc)
        return None
    
    async def list_by_organization(self, organization: str, user_id: str) -> List[Project]:
        """List all projects for an organization."""
        db = get_db()
        cursor = db[self.collection_name].find({
            "organization": organization
        }).sort("created_at", -1)
        
        projects = []
        async for doc in cursor:
            projects.append(Project(**doc))
        return projects
    
    async def update(self, project_id: str, organization: str, update_data: ProjectUpdate) -> Optional[Project]:
        """Update a project."""
        db = get_db()
        
        # Build update document
        update_doc = {"updated_at": datetime.utcnow()}
        if update_data.name is not None:
            update_doc["name"] = update_data.name
        if update_data.description is not None:
            update_doc["description"] = update_data.description
        if update_data.status is not None:
            update_doc["status"] = update_data.status
        if update_data.brief_text is not None:
            update_doc["brief_text"] = update_data.brief_text
        if update_data.questionnaire_data is not None:
            update_doc["questionnaire_data"] = update_data.questionnaire_data
        if update_data.feature_tier is not None:
            update_doc["feature_tier"] = update_data.feature_tier
        if getattr(update_data, 'roadmap', None) is not None:
            update_doc["roadmap"] = update_data.roadmap
        if getattr(update_data, 'roadmap_summary', None) is not None:
            update_doc["roadmap_summary"] = update_data.roadmap_summary
        if getattr(update_data, 'feasibility_studies', None) is not None:
            update_doc["feasibility_studies"] = update_data.feasibility_studies
        if getattr(update_data, 'feasibility_sections', None) is not None:
            update_doc["feasibility_sections"] = update_data.feasibility_sections
        if getattr(update_data, 'development_stack', None) is not None:
            update_doc["development_stack"] = update_data.development_stack
        if getattr(update_data, 'development_notes', None) is not None:
            update_doc["development_notes"] = update_data.development_notes
        
        result = await db[self.collection_name].find_one_and_update(
            {"_id": project_id, "organization": organization},
            {"$set": update_doc},
            return_document=True
        )
        
        if result:
            return Project(**result)
        return None
    
    async def delete(self, project_id: str, organization: str) -> bool:
        """Delete a project."""
        db = get_db()
        result = await db[self.collection_name].delete_one({
            "_id": project_id,
            "organization": organization
        })
        return result.deleted_count > 0

    async def update_phase_status(self, project_id: str, organization: str, phase_status: Dict[str, str]) -> Optional[Project]:
        """Update the phase status progression for a project."""
        db = get_db()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": project_id, "organization": organization},
            {"$set": {"phase_status": phase_status, "updated_at": datetime.utcnow()}},
            return_document=True
        )
        if result:
            return Project(**result)
        return None
