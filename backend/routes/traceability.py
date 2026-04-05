"""Traceability routes."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from services.traceability_service import TraceabilityService
from services.project_service import ProjectService
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
traceability_service = TraceabilityService()
project_service = ProjectService()
requirement_repo = RequirementRepository()
task_repo = TaskRepository()


class TraceabilityLinkRequest(BaseModel):
    source_type: str
    source_id: str
    source_name: str
    target_type: str
    target_id: str
    target_name: str
    link_type: str = "implements"
    rationale: str | None = None


@router.get("/projects/{project_id}/traceability/matrix")
async def get_traceability_matrix(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get traceability matrix for a project."""
    await project_service.get_project(project_id, current_user)
    requirements = [req.model_dump(by_alias=False) for req in await requirement_repo.list_by_project(project_id)]
    tasks = [task.model_dump(by_alias=False) for task in await task_repo.list_by_project(project_id)]
    links = await traceability_service.list_links(project_id)

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
    await project_service.get_project(project_id, current_user)
    requirements = [req.model_dump(by_alias=False) for req in await requirement_repo.list_by_project(project_id)]
    tasks = [task.model_dump(by_alias=False) for task in await task_repo.list_by_project(project_id)]
    links = await traceability_service.list_links(project_id)

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
    payload: TraceabilityLinkRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a traceability link."""
    await project_service.get_project(project_id, current_user)
    link = await traceability_service.create_link(
        project_id,
        payload.source_type,
        payload.source_id,
        payload.source_name,
        payload.target_type,
        payload.target_id,
        payload.target_name,
        payload.link_type,
        current_user.id,
        payload.rationale
    )
    return link


@router.post("/projects/{project_id}/traceability/auto-link")
async def auto_link_requirements(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Auto-suggest traceability links."""
    await project_service.get_project(project_id, current_user)
    requirements = [req.model_dump(by_alias=False) for req in await requirement_repo.list_by_project(project_id)]
    tasks = [task.model_dump(by_alias=False) for task in await task_repo.list_by_project(project_id)]

    suggested_links = await traceability_service.auto_link_requirements_to_tasks(
        project_id,
        requirements,
        tasks,
        current_user.id
    )
    return {"suggested_links": suggested_links}
