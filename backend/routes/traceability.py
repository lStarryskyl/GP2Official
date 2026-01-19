"""Traceability routes."""

from fastapi import APIRouter, HTTPException, Depends

from services.traceability_service import TraceabilityService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
traceability_service = TraceabilityService()


@router.get("/projects/{project_id}/traceability/matrix")
async def get_traceability_matrix(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get traceability matrix for a project."""
    # This would fetch from database
    requirements = []
    tasks = []
    links = []
    
    matrix = await traceability_service.generate_matrix(
        project_id,
        requirements,
        tasks,
        links
    )
    return matrix


@router.get("/projects/{project_id}/traceability/coverage")
async def get_coverage_report(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get coverage report for a project."""
    # This would fetch from database
    requirements = []
    tasks = []
    links = []
    
    report = await traceability_service.generate_coverage_report(
        project_id,
        requirements,
        tasks,
        links
    )
    return report


@router.post("/projects/{project_id}/traceability/link")
async def create_traceability_link(
    project_id: str,
    source_type: str,
    source_id: str,
    source_name: str,
    target_type: str,
    target_id: str,
    target_name: str,
    link_type: str,
    rationale: str = None,
    current_user: User = Depends(get_current_user)
):
    """Create a traceability link."""
    link = await traceability_service.create_link(
        project_id,
        source_type,
        source_id,
        source_name,
        target_type,
        target_id,
        target_name,
        link_type,
        current_user.id,
        rationale
    )
    return link


@router.post("/projects/{project_id}/traceability/auto-link")
async def auto_link_requirements(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Auto-suggest traceability links."""
    # This would fetch from database
    requirements = []
    tasks = []
    
    suggested_links = await traceability_service.auto_link_requirements_to_tasks(
        project_id,
        requirements,
        tasks,
        current_user.id
    )
    return {"suggested_links": suggested_links}
