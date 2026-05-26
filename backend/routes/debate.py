"""API routes for multi-agent debates."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from models.user import User
from models.debate import DebateRequest, DebateResponse, DebateListResponse, DebateSession
from services.debate_service import DebateService
from services.project_service import ProjectService
from routes.auth import get_current_user

router = APIRouter()

def get_debate_service() -> DebateService:
    return DebateService()

def get_project_service() -> ProjectService:
    return ProjectService()

@router.post("/projects/{project_id}/debate", response_model=DebateResponse)
async def start_debate(
    project_id: str,
    request: DebateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    debate_service: DebateService = Depends(get_debate_service),
    project_service: ProjectService = Depends(get_project_service)
):
    """Start a new multi-agent debate session for a project."""
    
    # 1. Validate project existence and ownership
    project = await project_service.get_project(project_id, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Validate that there is enough data for a debate to happen
    phases_data = await debate_service._collect_phase_data(project_id)
    if not phases_data:
        raise HTTPException(
            status_code=400, 
            detail="Not enough project data to debate. Please complete planning phases first."
        )

    # Start debate in the background since it can take a while (multiple LLM calls)
    # The client will subscribe via WebSocket to see the progress
    background_tasks.add_task(
        debate_service.start_debate,
        project_id,
        current_user.id,
        request
    )
    
    return DebateResponse(
        success=True,
        message="Debate session started in the background. Connect via WebSocket to track progress."
    )

@router.get("/projects/{project_id}/debates", response_model=DebateListResponse)
async def list_debates(
    project_id: str,
    current_user: User = Depends(get_current_user),
    debate_service: DebateService = Depends(get_debate_service)
):
    """List all debate sessions for a project."""
    sessions = await debate_service.get_debates(project_id)
    return DebateListResponse(
        success=True,
        sessions=sessions,
        total=len(sessions)
    )

@router.get("/projects/{project_id}/debates/{session_id}", response_model=DebateSession)
async def get_debate(
    project_id: str,
    session_id: str,
    current_user: User = Depends(get_current_user),
    debate_service: DebateService = Depends(get_debate_service)
):
    """Get details for a specific debate session."""
    session = await debate_service.get_debate(project_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Debate session not found")
    return session
