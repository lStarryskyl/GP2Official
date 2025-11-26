"""Project routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict
from pydantic import BaseModel

from models.project import ProjectCreate, ProjectUpdate, ProjectResponse
from models.user import User
from services.project_service import ProjectService
from routes.auth import get_current_user
from models.generation import GenerationRequest, GenerationResponse
from models.requirement import RequirementResponse
from models.task import TaskResponse
from models.artifact import ArtifactResponse
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from repositories.artifact_repository import ArtifactRepository
from services.generation_service import GenerationService

router = APIRouter()
project_service = ProjectService()
requirement_repo = RequirementRepository()
task_repo = TaskRepository()
artifact_repo = ArtifactRepository()
generation_service = GenerationService()


class GenerationConfig(BaseModel):
    """Project generation settings from frontend."""
    detail_level: str = "standard"
    include_uml: bool = True
    include_tasks: bool = True
    regenerate_requirements: bool = True
    generate_srs: bool = True
    generate_risks: bool = True
    generate_costs: bool = True
    uml_types: Optional[List[str]] = None
    style_palette: Optional[Dict[str, str]] = None


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new project."""
    return await project_service.create_project(project_data, current_user)


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(current_user: User = Depends(get_current_user)):
    """List all projects for user's organization."""
    return await project_service.list_projects(current_user)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific project."""
    return await project_service.get_project(project_id, current_user)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a project."""
    return await project_service.update_project(project_id, update_data, current_user)


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a project."""
    return await project_service.delete_project(project_id, current_user)


@router.post("/{project_id}/generate/", response_model=GenerationResponse)
async def trigger_project_generation(
    project_id: str,
    config: GenerationConfig,
    current_user: User = Depends(get_current_user)
):
    """Start AI generation for a project."""
    payload = config.dict(exclude_unset=True)
    payload["project_id"] = project_id
    request = GenerationRequest(**payload)
    return await generation_service.start_generation(request, current_user)


@router.get("/{project_id}/requirements/", response_model=List[RequirementResponse])
async def project_requirements(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """List requirements for a project."""
    await project_service.get_project(project_id, current_user)
    requirements = await requirement_repo.list_by_project(project_id)
    return [
        RequirementResponse(
            id=req.id,
            requirement_id=req.id,
            project_id=req.project_id,
            type=req.type,
            title=req.title,
            description=req.description,
            priority=req.priority,
            status=req.status,
            confidence_score=req.confidence_score,
            created_at=req.created_at,
            updated_at=req.updated_at,
        )
        for req in requirements
    ]


@router.get("/{project_id}/requirements/export/")
async def export_requirements(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Export requirements as JSON."""
    await project_service.get_project(project_id, current_user)
    requirements = await requirement_repo.list_by_project(project_id)
    return {
        "project_id": project_id,
        "count": len(requirements),
        "requirements": [
            {
                "id": req.id,
                "type": req.type,
                "title": req.title,
                "description": req.description,
                "priority": req.priority,
                "status": req.status,
                "confidence_score": req.confidence_score,
                "created_at": req.created_at,
                "updated_at": req.updated_at,
            }
            for req in requirements
        ],
    }


@router.get("/{project_id}/tasks/", response_model=List[TaskResponse])
async def project_tasks(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """List generated tasks for a project."""
    await project_service.get_project(project_id, current_user)
    tasks = await task_repo.list_by_project(project_id)
    return [
        TaskResponse(
            id=task.id,
            task_id=task.id,
            project_id=task.project_id,
            requirement_id=task.requirement_id,
            title=task.title,
            description=task.description,
            estimate_hours=task.estimate_hours,
            actual_hours=task.actual_hours,
            status=task.status,
            priority=task.priority,
            dependencies=task.dependencies,
            tags=task.tags,
            phase=task.phase,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
        for task in tasks
    ]


@router.get("/{project_id}/artifacts/", response_model=List[ArtifactResponse])
async def project_artifacts(
    project_id: str,
    artifact_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List artifacts for a project."""
    await project_service.get_project(project_id, current_user)
    artifacts = await artifact_repo.list_by_project(project_id, artifact_type)
    return [
        ArtifactResponse(
            id=artifact.id,
            artifact_id=artifact.id,
            project_id=artifact.project_id,
            type=artifact.type,
            title=artifact.title,
            content_json=artifact.content_json,
            version=artifact.version,
            is_approved=artifact.is_approved,
            metadata=artifact.metadata,
            created_at=artifact.created_at,
            updated_at=artifact.updated_at,
        )
        for artifact in artifacts
    ]


@router.get("/{project_id}/srs/export/")
async def export_srs(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Export the latest SRS artifact."""
    await project_service.get_project(project_id, current_user)
    artifacts = await artifact_repo.list_by_project(project_id, "SRS")
    if not artifacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No SRS generated yet",
        )
    artifact = artifacts[0]
    return {
        "project_id": project_id,
        "title": artifact.title,
        "content": artifact.content_json,
        "metadata": artifact.metadata,
        "updated_at": artifact.updated_at,
    }
