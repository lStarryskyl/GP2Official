"""Task routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from models.task import TaskResponse, TaskUpdate
from models.user import User
from repositories.task_repository import TaskRepository
from services.project_service import ProjectService
from routes.auth import get_current_user

router = APIRouter()
task_repo = TaskRepository()
project_service = ProjectService()


@router.patch("/tasks/{task_id}/", response_model=TaskResponse)
async def update_task(
    task_id: str,
    updates: TaskUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a task."""
    existing = await task_repo.get_by_id(task_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    await project_service.get_project(existing.project_id, current_user)
    updated = await task_repo.update_task(task_id, updates.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return TaskResponse(
        id=updated.id,
        task_id=updated.id,
        project_id=updated.project_id,
        requirement_id=updated.requirement_id,
        title=updated.title,
        description=updated.description,
        estimate_hours=updated.estimate_hours,
        actual_hours=updated.actual_hours,
        status=updated.status,
        priority=updated.priority,
        dependencies=updated.dependencies,
        tags=updated.tags,
        phase=updated.phase,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )
