"""UX Flow routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from models.artifact import ArtifactResponse
from models.diagram import DiagramStateResponse
from models.user import User
from repositories.artifact_repository import ArtifactRepository
from routes.auth import get_current_user
from services.project_service import ProjectService
from services.ux_flow_service import UxFlowService

router = APIRouter()
project_service = ProjectService()
artifact_repo = ArtifactRepository()
ux_flow_service = UxFlowService()


@router.post("/projects/{project_id}/ux-flow/generate/", response_model=ArtifactResponse)
async def generate_ux_flow(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generate and store a UX flow document for the project."""
    project = await project_service.get_project(project_id, current_user)
    result = await ux_flow_service.generate_ux_flow(project_id, project.organization)
    artifact_id = result["artifact_id"]
    artifact = (await artifact_repo.list_by_project(project_id, "UX_FLOW_SPEC"))[0]
    return ArtifactResponse(
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


@router.get("/projects/{project_id}/ux-flow/", response_model=ArtifactResponse)
async def get_ux_flow(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Fetch the latest UX flow document for the project."""
    await project_service.get_project(project_id, current_user)
    artifacts = await artifact_repo.list_by_project(project_id, "UX_FLOW_SPEC")
    if not artifacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="UX flow not generated yet",
        )
    artifact = artifacts[0]
    return ArtifactResponse(
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


@router.post("/projects/{project_id}/ux-flow/sync-diagram/", response_model=DiagramStateResponse)
async def sync_ux_flow_to_diagram(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Populate the freeform Diagram Studio canvas from the UX Flow spec."""
    project = await project_service.get_project(project_id, current_user)
    try:
        diagram = await ux_flow_service.seed_diagram_from_ux_flow(project_id, project.organization)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return DiagramStateResponse(
        id=diagram.id,
        diagram_id=diagram.id,
        project_id=diagram.project_id,
        stage=diagram.stage,
        title=diagram.title,
        nodes=diagram.nodes,
        edges=diagram.edges,
        metadata=diagram.metadata,
        created_at=diagram.created_at,
        updated_at=diagram.updated_at,
    )
