"""SRS Audit routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from services.srs_audit_service import SRSAuditService
from repositories.requirement_repository import RequirementRepository
from repositories.artifact_repository import ArtifactRepository
from routes.auth import get_current_user

router = APIRouter()
audit_service = SRSAuditService()
requirement_repo = RequirementRepository()
artifact_repo = ArtifactRepository()


@router.post("/projects/{project_id}/srs-audit")
async def run_srs_audit(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Run SRS audit on project requirements."""
    try:
        requirement_objs = await requirement_repo.list_by_project(project_id)
        requirements = [
            {
                "id": r.id or r.requirement_id or "",
                "title": r.title or "",
                "description": r.description or "",
                "type": r.type or "",
                "priority": r.priority or "",
                "status": r.status or "",
            }
            for r in requirement_objs
        ]

        audit_report = await audit_service.audit_requirements(project_id, requirements)
        return audit_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/srs-audit/latest")
async def get_latest_audit(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Get latest SRS audit report."""
    try:
        audit_artifact = await artifact_repo.get_latest_by_type(project_id, "srs_audit")
        if audit_artifact:
            return audit_artifact.content_json or {"message": "Audit found but no content"}
        return {"message": "No audit report found for this project", "project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=404, detail="No audit found")
