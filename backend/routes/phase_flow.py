"""Phase flow routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

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
        phase_status, artifact = await phase_service.generate_phase(project_id, project.organization, phase, payload.prompt)
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

    return PhaseGenerateResponse(phase_status=phase_status, content=artifact)


@router.post("/projects/{project_id}/phases/unlock-all/")
async def unlock_all_phases(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    status = await phase_service.unlock_all(project_id, project.organization)
    return {"phases": status}
