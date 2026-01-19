"""Version history routes."""

from fastapi import APIRouter, HTTPException, Depends

from models.version import VersionHistoryRequest, CompareVersionsRequest, DiffResult
from services.version_service import VersionService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
version_service = VersionService()


@router.post("/projects/{project_id}/version/history")
async def get_version_history(
    project_id: str,
    request: VersionHistoryRequest,
    current_user: User = Depends(get_current_user)
):
    """Get version history for an entity."""
    history = await version_service.get_version_history(
        request.entity_type,
        request.entity_id,
        request.limit
    )
    return {"versions": history}


@router.post("/projects/{project_id}/version/compare")
async def compare_versions(
    project_id: str,
    request: CompareVersionsRequest,
    current_user: User = Depends(get_current_user)
):
    """Compare two versions."""
    # Fetch version history
    history = await version_service.get_version_history(
        request.entity_type,
        request.entity_id,
        100
    )
    
    diff = await version_service.compare_versions(
        request.entity_type,
        request.entity_id,
        request.from_version,
        request.to_version,
        history
    )
    return diff


@router.post("/projects/{project_id}/version/restore")
async def restore_version(
    project_id: str,
    entity_type: str,
    entity_id: str,
    version_number: int,
    current_user: User = Depends(get_current_user)
):
    """Restore an entity to a previous version."""
    result = await version_service.restore_version(
        entity_type,
        entity_id,
        version_number,
        current_user.id
    )
    return result
