"""Plan Validation routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from models.validation import (
    ValidationRequest,
    ValidationFeedback,
    ValidationReport,
    ValidationResponse,
    ValidationListResponse,
)
from models.user import User
from services.validation_service import ValidationService
from routes.auth import get_current_user

router = APIRouter()
validation_service = ValidationService()


@router.post("/projects/{project_id}/validate", response_model=ValidationResponse)
async def trigger_validation(
    project_id: str,
    request: Optional[ValidationRequest] = None,
    current_user: User = Depends(get_current_user),
):
    """Trigger a new AI plan validation run for a project."""
    try:
        org = current_user.organization or "default"
        req = request or ValidationRequest()

        report = await validation_service.validate_project(
            project_id=project_id,
            organization=org,
            user_id=current_user.id,
            phases_to_review=req.phases_to_review,
        )

        return ValidationResponse(success=True, report=report, message="Validation completed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/projects/{project_id}/validations", response_model=ValidationListResponse)
async def list_validations(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """List all validation reports for a project."""
    try:
        org = current_user.organization or "default"
        reports = await validation_service.get_reports(project_id, org)
        return ValidationListResponse(
            success=True, reports=reports, total=len(reports)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/projects/{project_id}/validations/{report_id}",
    response_model=ValidationResponse,
)
async def get_validation_report(
    project_id: str,
    report_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a specific validation report."""
    org = current_user.organization or "default"
    report = await validation_service.get_report_by_id(project_id, org, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Validation report not found")
    return ValidationResponse(success=True, report=report)


@router.post("/projects/{project_id}/validations/{report_id}/feedback")
async def submit_finding_feedback(
    project_id: str,
    report_id: str,
    feedback: ValidationFeedback,
    current_user: User = Depends(get_current_user),
):
    """Submit feedback on a specific finding."""
    org = current_user.organization or "default"
    ok = await validation_service.submit_feedback(
        project_id=project_id,
        organization=org,
        report_id=report_id,
        finding_id=feedback.finding_id,
        helpful=feedback.helpful,
        comment=feedback.comment,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Project or report not found")
    return {"success": True, "message": "Feedback recorded"}
