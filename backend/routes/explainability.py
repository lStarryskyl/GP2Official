"""AI explainability routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from services.ai_explainability_service import AIExplainabilityService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
explainability_service = AIExplainabilityService()


@router.post("/projects/{project_id}/explain/requirement")
async def explain_requirement(
    project_id: str,
    brief: str,
    requirement: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Explain how a requirement was generated."""
    explanation = await explainability_service.explain_requirement_generation(
        brief,
        requirement
    )
    return explanation


@router.post("/projects/{project_id}/explain/audit-finding")
async def explain_audit_finding(
    project_id: str,
    finding: Dict[str, Any],
    requirement: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Explain why an audit finding was raised."""
    explanation = await explainability_service.explain_audit_finding(
        finding,
        requirement
    )
    return explanation


@router.post("/projects/{project_id}/explain/task-breakdown")
async def explain_task_breakdown(
    project_id: str,
    requirement: Dict[str, Any],
    tasks: list,
    current_user: User = Depends(get_current_user)
):
    """Explain how tasks were broken down."""
    explanation = await explainability_service.explain_task_breakdown(
        requirement,
        tasks
    )
    return explanation


@router.post("/projects/{project_id}/explain/priority")
async def explain_priority(
    project_id: str,
    entity_type: str,
    entity: Dict[str, Any],
    priority: str,
    current_user: User = Depends(get_current_user)
):
    """Explain why a priority was assigned."""
    explanation = await explainability_service.explain_priority_assignment(
        entity_type,
        entity,
        priority
    )
    return explanation
