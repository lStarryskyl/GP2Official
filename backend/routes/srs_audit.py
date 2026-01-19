"""SRS Audit routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from services.srs_audit_service import SRSAuditService
from routes.auth import get_current_user

router = APIRouter()
audit_service = SRSAuditService()


@router.post("/projects/{project_id}/srs-audit")
async def run_srs_audit(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Run SRS audit on project requirements."""
    try:
        # TODO: Fetch requirements from repository
        requirements = []  # Would fetch from DB
        
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
        # TODO: Fetch from repository
        return {"message": "Latest audit report"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="No audit found")
