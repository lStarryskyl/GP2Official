"""Testing phase routes — test data generation and coverage audit."""

import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List

from models.user import User
from models.testing import GenerateTestDataRequest, RunCoverageAuditRequest
from routes.auth import get_current_user
from services.testing_service import generate_test_data, run_coverage_audit
from services.project_service import ProjectService
from repositories.requirement_repository import RequirementRepository
from repositories.artifact_repository import ArtifactRepository

router = APIRouter()
logger = logging.getLogger(__name__)

project_service = ProjectService()
requirement_repo = RequirementRepository()
artifact_repo = ArtifactRepository()


def _serialize_requirement(req) -> dict:
    """Convert a Requirement model instance to a plain dict."""
    raw_type = str(getattr(req, "type", "functional"))
    # Normalize enum strings like "RequirementType.FUNCTIONAL" to "functional"
    if "." in raw_type:
        raw_type = raw_type.split(".")[-1].lower()
    raw_priority = str(getattr(req, "priority", "medium"))
    if "." in raw_priority:
        raw_priority = raw_priority.split(".")[-1].lower()
    return {
        "id": getattr(req, "id", None),
        "requirement_id": getattr(req, "id", None),
        "title": getattr(req, "title", ""),
        "description": getattr(req, "description", ""),
        "type": raw_type,
        "priority": raw_priority,
        "status": getattr(req, "status", "proposed"),
    }


# ------------------------------------------------------------------
# POST  /api/projects/{project_id}/testing/generate-test-data
# ------------------------------------------------------------------
@router.post("/projects/{project_id}/testing/generate-test-data")
async def api_generate_test_data(
    project_id: str,
    payload: GenerateTestDataRequest = GenerateTestDataRequest(),
    current_user: User = Depends(get_current_user),
):
    """Generate AI-driven synthetic test data from the project's functional requirements."""

    project = await project_service.get_project(project_id, current_user)

    # Fetch requirements
    all_reqs = await requirement_repo.list_by_project(project_id)
    func_reqs = [r for r in all_reqs if "functional" in str(getattr(r, "type", "")).lower()]

    if not func_reqs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No functional requirements found. Generate requirements in the Requirements phase first.",
        )

    # Optional filter by IDs
    if payload.requirement_ids:
        id_set = set(payload.requirement_ids)
        func_reqs = [r for r in func_reqs if getattr(r, "id", None) in id_set]

    reqs_dicts = [_serialize_requirement(r) for r in func_reqs]

    result = await generate_test_data(
        project_id=project_id,
        requirements=reqs_dicts,
        include_edge_cases=payload.include_edge_cases,
        include_boundary=payload.include_boundary_values,
        max_rows=payload.max_rows_per_requirement,
        user_id=current_user.id,
    )

    return {
        "success": True,
        "data": result,
        "metadata": {
            "requirements_processed": len(reqs_dicts),
            "project_id": project_id,
        },
    }


# ------------------------------------------------------------------
# POST  /api/projects/{project_id}/testing/coverage-audit
# ------------------------------------------------------------------
@router.post("/projects/{project_id}/testing/coverage-audit")
async def api_run_coverage_audit(
    project_id: str,
    payload: RunCoverageAuditRequest = RunCoverageAuditRequest(),
    current_user: User = Depends(get_current_user),
):
    """Run a coverage audit comparing requirements to generated test scenarios."""

    project = await project_service.get_project(project_id, current_user)

    # Fetch requirements
    all_reqs = await requirement_repo.list_by_project(project_id)
    if not all_reqs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No requirements found. Generate requirements first.",
        )

    reqs_dicts = [_serialize_requirement(r) for r in all_reqs]

    # Fetch existing test scenarios from the artifact store
    test_scenarios = []
    try:
        test_artifact = await artifact_repo.get_latest_by_type(project_id, "PHASE_TESTING_DATA")
        if test_artifact and test_artifact.content_json:
            test_scenarios = test_artifact.content_json.get("scenarios", [])
    except Exception:
        pass

    result = await run_coverage_audit(
        project_id=project_id,
        requirements=reqs_dicts,
        test_scenarios=test_scenarios,
        include_non_functional=payload.include_non_functional,
        user_id=current_user.id,
    )

    # Persist as artifact
    await artifact_repo.upsert_artifact(
        project_id=project_id,
        artifact_type="PHASE_TESTING_COVERAGE",
        title="Requirement-to-Test Coverage Audit",
        content_json=result,
        metadata={
            "phase": "testing",
            "agent": "CoverageAuditor",
            "requirement_count": len(reqs_dicts),
            "scenario_count": len(test_scenarios),
        },
    )

    return {
        "success": True,
        "data": result,
        "metadata": {
            "requirements_audited": len(reqs_dicts),
            "scenarios_evaluated": len(test_scenarios),
            "project_id": project_id,
        },
    }


# ------------------------------------------------------------------
# GET  /api/projects/{project_id}/testing/results
# ------------------------------------------------------------------
@router.get("/projects/{project_id}/testing/results")
async def api_get_testing_results(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Retrieve stored test data and coverage audit artifacts."""

    project = await project_service.get_project(project_id, current_user)

    test_data = None
    coverage_audit = None

    try:
        td_artifact = await artifact_repo.get_latest_by_type(project_id, "PHASE_TESTING_DATA")
        if td_artifact:
            test_data = td_artifact.content_json
    except Exception:
        pass

    try:
        ca_artifact = await artifact_repo.get_latest_by_type(project_id, "PHASE_TESTING_COVERAGE")
        if ca_artifact:
            coverage_audit = ca_artifact.content_json
    except Exception:
        pass

    return {
        "success": True,
        "test_data": test_data,
        "coverage_audit": coverage_audit,
        "has_test_data": test_data is not None,
        "has_coverage_audit": coverage_audit is not None,
    }
