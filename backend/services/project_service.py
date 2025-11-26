"""Project service."""

from typing import List
from fastapi import HTTPException, status

from models.project import Project, ProjectCreate, ProjectUpdate, ProjectResponse
from models.user import User
from repositories.project_repository import ProjectRepository


class ProjectService:
    """Service for project business logic."""
    
    def __init__(self):
        self.project_repo = ProjectRepository()
    
    async def create_project(self, project_data: ProjectCreate, current_user: User) -> ProjectResponse:
        """Create a new project."""
        project = await self.project_repo.create(
            project_data,
            current_user.id,
            current_user.organization
        )
        
        return ProjectResponse(
            id=project.id,
            project_id=project.id,
            name=project.name,
            description=project.description,
            template_type=project.template_type,
            status=project.status,
            owner_id=project.owner_id,
            organization=project.organization,
            feature_tier=project.feature_tier,
            phase_status=project.phase_status,
            brief_text=project.brief_text,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
    
    async def get_project(self, project_id: str, current_user: User) -> ProjectResponse:
        """Get a project by ID."""
        project = await self.project_repo.get_by_id(project_id, current_user.organization)
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return ProjectResponse(
            id=project.id,
            project_id=project.id,
            name=project.name,
            description=project.description,
            template_type=project.template_type,
            status=project.status,
            owner_id=project.owner_id,
            organization=project.organization,
            feature_tier=project.feature_tier,
            phase_status=project.phase_status,
            brief_text=project.brief_text,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
    
    async def list_projects(self, current_user: User) -> List[ProjectResponse]:
        """List all projects for user's organization."""
        projects = await self.project_repo.list_by_organization(
            current_user.organization,
            current_user.id
        )
        
        return [
            ProjectResponse(
                id=p.id,
                project_id=p.id,
                name=p.name,
                description=p.description,
                template_type=p.template_type,
                status=p.status,
                owner_id=p.owner_id,
                organization=p.organization,
                feature_tier=p.feature_tier,
                phase_status=p.phase_status,
                brief_text=p.brief_text,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in projects
        ]
    
    async def update_project(self, project_id: str, update_data: ProjectUpdate, 
                           current_user: User) -> ProjectResponse:
        """Update a project."""
        project = await self.project_repo.update(
            project_id,
            current_user.organization,
            update_data
        )
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return ProjectResponse(
            id=project.id,
            project_id=project.id,
            name=project.name,
            description=project.description,
            template_type=project.template_type,
            status=project.status,
            owner_id=project.owner_id,
            organization=project.organization,
            feature_tier=project.feature_tier,
            phase_status=project.phase_status,
            brief_text=project.brief_text,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )
    
    async def delete_project(self, project_id: str, current_user: User) -> dict:
        """Delete a project."""
        deleted = await self.project_repo.delete(project_id, current_user.organization)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        return {"message": "Project deleted successfully"}
