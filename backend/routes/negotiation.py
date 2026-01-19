"""Stakeholder negotiation routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.negotiation import (
    NegotiationThreadCreate, CommentCreate, Comment, NegotiationThread
)
from services.negotiation_service import NegotiationService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
negotiation_service = NegotiationService()


@router.post("/projects/{project_id}/negotiation/threads")
async def create_negotiation_thread(
    project_id: str,
    thread_data: NegotiationThreadCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new negotiation thread."""
    thread_data.project_id = project_id
    thread = await negotiation_service.create_thread(thread_data, current_user.id)
    return thread


@router.post("/projects/{project_id}/negotiation/comments")
async def add_comment(
    project_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a comment to a negotiation thread."""
    comment_data.project_id = project_id
    comment_data.author_id = current_user.id
    comment_data.author_name = current_user.full_name or current_user.email
    comment = await negotiation_service.add_comment(comment_data)
    return comment


@router.post("/projects/{project_id}/negotiation/threads/{thread_id}/impact-analysis")
async def analyze_impact(
    project_id: str,
    thread_id: str,
    current_user: User = Depends(get_current_user)
):
    """Perform impact analysis for a change request."""
    # This would fetch requirements and tasks from database
    requirements = []
    tasks = []
    change_request = {"id": thread_id, "title": "Change Request", "description": ""}
    
    analysis = await negotiation_service.analyze_impact(change_request, requirements, tasks)
    return analysis


@router.post("/projects/{project_id}/negotiation/threads/{thread_id}/resolve")
async def resolve_thread(
    project_id: str,
    thread_id: str,
    resolution: str,
    current_user: User = Depends(get_current_user)
):
    """Resolve a negotiation thread."""
    result = await negotiation_service.resolve_thread(thread_id, resolution)
    return result
