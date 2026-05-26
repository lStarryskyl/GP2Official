"""API routes for project code scaffolding."""

from fastapi import APIRouter, Depends, HTTPException

from models.user import User
from models.scaffolding import ScaffoldRequest, ScaffoldResponse, ScaffoldListResponse
from services.scaffolding_service import ScaffoldingService
from routes.auth import get_current_user

router = APIRouter()

def get_scaffolding_service() -> ScaffoldingService:
    return ScaffoldingService()

@router.post("/projects/{project_id}/scaffold", response_model=ScaffoldResponse)
async def generate_scaffold(
    project_id: str,
    request: ScaffoldRequest,
    current_user: User = Depends(get_current_user),
    scaffolding_service: ScaffoldingService = Depends(get_scaffolding_service)
):
    """Generate professional code scaffolding based on a project's technical plan."""
    # Since this is a very long running operation, ideally it would be backgrounded.
    # For now, we perform it synchronously but with a very high timeout.
    scaffold_result = await scaffolding_service.generate_scaffold(
        project_id,
        current_user.id,
        request
    )
    
    return ScaffoldResponse(
        success=True,
        scaffold=scaffold_result,
        message="Scaffolding generated successfully."
    )

@router.get("/projects/{project_id}/scaffolds", response_model=ScaffoldListResponse)
async def list_scaffolds(
    project_id: str,
    current_user: User = Depends(get_current_user),
    scaffolding_service: ScaffoldingService = Depends(get_scaffolding_service)
):
    """Get all past generated code scaffolds for a project."""
    scaffolds = await scaffolding_service.get_scaffolds(project_id)
    return ScaffoldListResponse(
        success=True,
        scaffolds=scaffolds,
        total=len(scaffolds)
    )
