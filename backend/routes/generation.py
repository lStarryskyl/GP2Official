"""AI generation routes."""

from fastapi import APIRouter, Depends
from typing import List

from models.generation import GenerationRequest, GenerationResponse
from models.requirement import RequirementResponse
from models.user import User
from services.generation_service import GenerationService
from services.plan_limits import enforce_ai_run_quota
from repositories.requirement_repository import RequirementRepository
from repositories.ai_run_repository import AiRunRepository
from routes.auth import get_current_user

router = APIRouter()
jobs_router = APIRouter()
generation_service = GenerationService()
requirement_repo = RequirementRepository()
ai_run_repo = AiRunRepository()


@router.post("/start", response_model=GenerationResponse)
async def start_generation(
    request: GenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Start AI generation process."""
    await enforce_ai_run_quota(current_user, ai_run_repo)
    return await generation_service.start_generation(request, current_user)


@router.get("/job/{job_id}", response_model=GenerationResponse)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get generation job status."""
    return await generation_service.get_job_status(job_id, current_user)


@router.get("/requirements/{project_id}", response_model=List[RequirementResponse])
async def get_project_requirements(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get generated requirements for a project."""
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


@jobs_router.get("/{job_id}/", response_model=GenerationResponse)
async def get_generation_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get generation job status via /generation-jobs path."""
    return await generation_service.get_job_status(job_id, current_user)
