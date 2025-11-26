"""Requirement CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from models.requirement import RequirementResponse, RequirementUpdate
from models.user import User
from repositories.requirement_repository import RequirementRepository
from routes.auth import get_current_user
from services.project_service import ProjectService

router = APIRouter()
requirement_repo = RequirementRepository()
project_service = ProjectService()


@router.patch("/requirements/{requirement_id}/", response_model=RequirementResponse)
async def update_requirement(
    requirement_id: str,
    updates: RequirementUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a single requirement."""
    existing = await requirement_repo.get_by_id(requirement_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found"
        )
    await project_service.get_project(existing.project_id, current_user)
    updated = await requirement_repo.update_requirement(requirement_id, updates.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found"
        )
    return RequirementResponse(
        id=updated.id,
        requirement_id=updated.id,
        project_id=updated.project_id,
        type=updated.type,
        title=updated.title,
        description=updated.description,
        priority=updated.priority,
        status=updated.status,
        confidence_score=updated.confidence_score,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )
