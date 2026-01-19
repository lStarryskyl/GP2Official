"""Phase flow routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from models.user import User
from routes.auth import get_current_user
from services.phase_flow_service import PhaseFlowService, PHASE_ORDER
from services.project_service import ProjectService

router = APIRouter()
phase_service = PhaseFlowService()
project_service = ProjectService()


class PhaseGenerateRequest(BaseModel):
    prompt: str = ""


class PhaseGenerateResponse(BaseModel):
    phase_status: dict
    content: dict
    raw_markdown: Optional[str] = None
    formatted_markdown: Optional[str] = None


@router.get("/projects/{project_id}/phases/")
async def get_phase_status(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    status = await phase_service.get_status(project_id, project.organization)
    return {"phases": status, "order": PHASE_ORDER}


@router.post("/projects/{project_id}/phases/{phase}/generate/", response_model=PhaseGenerateResponse)
async def generate_phase_output(
    project_id: str,
    phase: str,
    payload: PhaseGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    try:
        phase_status, artifact = await phase_service.generate_phase(
            project_id,
            project.organization,
            phase,
            payload.prompt,
            current_user.id,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    raw_markdown = artifact.get("raw_markdown")
    formatted_markdown = artifact.get("formatted_markdown")
    
    # Debug the response being sent
    logger.info(f"API Response - Phase: {phase}, Project: {project_id}")
    logger.info(f"Artifact keys: {list(artifact.keys())}")
    logger.info(f"Raw markdown length: {len(raw_markdown) if raw_markdown else 0}")
    logger.info(f"Formatted markdown length: {len(formatted_markdown) if formatted_markdown else 0}")
    logger.info(f"Raw markdown preview: {raw_markdown[:200] if raw_markdown else 'None'}...")
    
    response = PhaseGenerateResponse(
        phase_status=phase_status,
        content=artifact,
        raw_markdown=raw_markdown,
        formatted_markdown=formatted_markdown,
    )
    
    logger.info(f"Final response content length: {len(str(response.content)) if response.content else 0}")
    return response


@router.post("/projects/{project_id}/phases/unlock-all/")
async def unlock_all_phases(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Unlock all phases for development/testing."""
    project = await project_service.get_project(project_id, current_user)
    phase_status = await phase_service.unlock_all(project_id, project.organization)
    return {"phases": phase_status, "order": PHASE_ORDER}


@router.post("/projects/{project_id}/phases/{phase}/unlock/")
async def unlock_phase(
    project_id: str,
    phase: str,
    current_user: User = Depends(get_current_user),
):
    """Unlock a specific phase for generation."""
    project = await project_service.get_project(project_id, current_user)
    try:
        phase_status = await phase_service.unlock_phase(project_id, project.organization, phase)
        return {"phases": phase_status, "order": PHASE_ORDER}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


