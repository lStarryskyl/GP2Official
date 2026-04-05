"""Stakeholder negotiation routes."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models.negotiation import NegotiationThreadCreate, CommentCreate
from services.negotiation_service import NegotiationService
from services.project_service import ProjectService
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
negotiation_service = NegotiationService()
project_service = ProjectService()
requirement_repo = RequirementRepository()
task_repo = TaskRepository()


class NegotiationCommentRequest(BaseModel):
    content: str
    parent_id: str | None = None
    requirement_id: str | None = None


class ResolveThreadRequest(BaseModel):
    resolution: str


@router.get("/projects/{project_id}/negotiation/threads")
async def list_negotiation_threads(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """List negotiation threads for a project."""
    await project_service.get_project(project_id, current_user)
    return await negotiation_service.list_threads(project_id)


@router.get("/projects/{project_id}/negotiation/threads/{thread_id}")
async def get_negotiation_thread(
    project_id: str,
    thread_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a single negotiation thread and its comments."""
    await project_service.get_project(project_id, current_user)
    thread = await negotiation_service.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Negotiation thread not found")
    comments = await negotiation_service.list_comments(thread_id)
    return {"thread": thread, "comments": comments}


@router.post("/projects/{project_id}/negotiation/threads")
async def create_negotiation_thread(
    project_id: str,
    thread_data: NegotiationThreadCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new negotiation thread."""
    thread_data.project_id = project_id
    await project_service.get_project(project_id, current_user)
    thread = await negotiation_service.create_thread(thread_data, current_user.id)
    return thread


@router.post("/projects/{project_id}/negotiation/threads/{thread_id}/comments")
async def add_comment(
    project_id: str,
    thread_id: str,
    comment_data: NegotiationCommentRequest,
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a negotiation thread."""
    await project_service.get_project(project_id, current_user)
    payload = CommentCreate(
        project_id=project_id,
        requirement_id=comment_data.requirement_id,
        parent_id=comment_data.parent_id,
        content=comment_data.content,
        author_id=current_user.id,
        author_name=current_user.full_name or current_user.email,
    )
    comment = await negotiation_service.add_comment(thread_id, payload)
    return comment


@router.post("/projects/{project_id}/negotiation/threads/{thread_id}/impact-analysis")
async def analyze_impact(
    project_id: str,
    thread_id: str,
    current_user: User = Depends(get_current_user)
):
    """Perform impact analysis for a change request."""
    await project_service.get_project(project_id, current_user)
    thread = await negotiation_service.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Negotiation thread not found")

    requirements = [req.model_dump(by_alias=False) for req in await requirement_repo.list_by_project(project_id)]
    tasks = [task.model_dump(by_alias=False) for task in await task_repo.list_by_project(project_id)]
    change_request = {
        "id": thread["id"],
        "title": thread["title"],
        "description": thread["description"],
    }

    analysis = await negotiation_service.analyze_impact(change_request, requirements, tasks)
    return analysis


@router.post("/projects/{project_id}/negotiation/threads/{thread_id}/resolve")
async def resolve_thread(
    project_id: str,
    thread_id: str,
    payload: ResolveThreadRequest,
    current_user: User = Depends(get_current_user)
):
    """Resolve a negotiation thread."""
    await project_service.get_project(project_id, current_user)
    result = await negotiation_service.resolve_thread(thread_id, payload.resolution)
    return result
