"""Project routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any

from pydantic import BaseModel

from models.project import ProjectCreate, ProjectUpdate, ProjectResponse

from models.user import User
from services.project_service import ProjectService
from routes.auth import get_current_user
from models.generation import GenerationRequest, GenerationResponse
from models.requirement import RequirementResponse
from models.task import TaskResponse, TaskCreate
from models.artifact import ArtifactResponse
from models.activity import ActivityLogResponse
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from repositories.artifact_repository import ArtifactRepository
from repositories.activity_repository import ActivityRepository
from services.generation_service import GenerationService

router = APIRouter()
project_service = ProjectService()
requirement_repo = RequirementRepository()
task_repo = TaskRepository()
artifact_repo = ArtifactRepository()
activity_repo = ActivityRepository()
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


class RoadmapSubItem(BaseModel):
    id: str
    title: str
    status: str
    notes: Optional[str] = None
    children: Optional[List["RoadmapSubItem"]] = None


RoadmapSubItem.model_rebuild()


class RoadmapMilestone(BaseModel):
    id: str
    name: str
    phase: str
    startMonth: float
    endMonth: float
    progress: float
    status: str
    color: str
    dependencies: Optional[List[str]] = None
    subItems: Optional[List[RoadmapSubItem]] = None


class RoadmapPayload(BaseModel):
    milestones: List[RoadmapMilestone]
    summary: Optional[List[Dict[str, Any]]] = None


class FeasibilityStudy(BaseModel):
    id: str
    title: str
    body: str
    tags: Optional[List[str]] = None
    source: Optional[str] = None


class FeasibilityStudiesPayload(BaseModel):
    studies: List[FeasibilityStudy]


class FeasibilitySectionsPayload(BaseModel):
    sections: List[Dict[str, Any]]


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


@router.get("/{project_id}/roadmap/", response_model=RoadmapPayload)
async def get_project_roadmap(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    await project_service.get_project(project_id, current_user)
    project = await project_service.get_project(project_id, current_user)
    return {
        "milestones": project.roadmap or [],
        "summary": project.roadmap_summary or [],
    }


@router.put("/{project_id}/roadmap/", response_model=ProjectResponse)
async def update_project_roadmap(
    project_id: str,
    payload: RoadmapPayload,
    current_user: User = Depends(get_current_user)
):
    await project_service.get_project(project_id, current_user)
    update = ProjectUpdate(
        roadmap=[m.dict() for m in payload.milestones],
        roadmap_summary=payload.summary,
    )
    return await project_service.update_project(project_id, update, current_user)


@router.get("/{project_id}/feasibility-studies/", response_model=FeasibilityStudiesPayload)
async def get_feasibility_studies(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    project = await project_service.get_project(project_id, current_user)
    return {"studies": project.feasibility_studies or []}


@router.put("/{project_id}/feasibility-studies/", response_model=ProjectResponse)
async def update_feasibility_studies(
    project_id: str,
    payload: FeasibilityStudiesPayload,
    current_user: User = Depends(get_current_user)
):
    await project_service.get_project(project_id, current_user)
    update = ProjectUpdate(feasibility_studies=[study.dict() for study in payload.studies])
    return await project_service.update_project(project_id, update, current_user)


@router.get("/{project_id}/feasibility-sections/", response_model=FeasibilitySectionsPayload)
async def get_feasibility_sections(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    project = await project_service.get_project(project_id, current_user)
    return {"sections": project.feasibility_sections or []}


@router.put("/{project_id}/feasibility-sections/", response_model=ProjectResponse)
async def update_feasibility_sections(
    project_id: str,
    payload: FeasibilitySectionsPayload,
    current_user: User = Depends(get_current_user)
):
    await project_service.get_project(project_id, current_user)
    update = ProjectUpdate(feasibility_sections=payload.sections)
    return await project_service.update_project(project_id, update, current_user)


class DevelopmentNotesPayload(BaseModel):
    """Development notes payload for best practices and watch-outs."""
    notes: Dict[str, Any]


class DevelopmentStackItem(BaseModel):
    """Single development stack entry."""
    name: str
    category: str
    description: str
    icon: str
    recommended: bool = False


class DevelopmentPayload(BaseModel):
    """Development stack and notes payload."""
    stack: List[Dict[str, Any]]
    notes: Optional[Dict[str, Any]] = None


@router.get("/{project_id}/development/", response_model=DevelopmentPayload)
async def get_development_data(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    return DevelopmentPayload(
        stack=project.development_stack or [],
        notes=project.development_notes or {},
    )


@router.put("/{project_id}/development/", response_model=ProjectResponse)
async def update_development_data(
    project_id: str,
    payload: DevelopmentPayload,
    current_user: User = Depends(get_current_user),
):
    await project_service.get_project(project_id, current_user)
    update = ProjectUpdate(
        development_stack=payload.stack,
        development_notes=payload.notes,
    )
    return await project_service.update_project(project_id, update, current_user)


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
            start_date=task.start_date,
            due_date=task.due_date,
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


@router.post("/{project_id}/tasks/", response_model=TaskResponse, status_code=201)
async def create_project_task(
    project_id: str,
    payload: TaskCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a task for a project."""
    await project_service.get_project(project_id, current_user)
    created = await task_repo.create_task(project_id, payload.dict(exclude_unset=True))
    return TaskResponse(
        id=created.id,
        task_id=created.id,
        project_id=created.project_id,
        requirement_id=created.requirement_id,
        title=created.title,
        description=created.description,
        estimate_hours=created.estimate_hours,
        actual_hours=created.actual_hours,
        status=created.status,
        priority=created.priority,
        start_date=created.start_date,
        due_date=created.due_date,
        dependencies=created.dependencies,
        tags=created.tags,
        phase=created.phase,
        created_at=created.created_at,
        updated_at=created.updated_at,
    )


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


@router.get("/{project_id}/activity/", response_model=List[ActivityLogResponse])
async def project_activity(
    project_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Return recent activity for a project. Currently returns empty if none recorded."""
    await project_service.get_project(project_id, current_user)
    logs = await activity_repo.list_by_project(project_id, limit=limit)
    return [ActivityLogResponse(**log.dict()) for log in logs]


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
