"""AI Plan Validation service.

Orchestrates multi-dimensional LLM reviews of project plan outputs
(from phase_flow_service) and produces structured validation reports.
"""

import uuid
import json
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from database import get_db
from models.validation import (
    ValidationReport,
    ValidationFinding,
    ValidationCategory,
    FindingSeverity,
)
from services.ai_pipeline_service import ai_pipeline, TaskType
from services.validation_prompts import PROMPT_BUILDERS

logger = logging.getLogger(__name__)

# Weights for computing the overall score
CATEGORY_WEIGHTS = {
    "feasibility": 0.30,
    "completeness": 0.25,
    "consistency": 0.25,
    "risk": 0.20,
}

# Phase keys as used by PhaseFlowService
ALL_PHASES = [
    "planning",
    "feasibility",
    "requirements",
    "validation",
    "design",
    "development",
    "tasks",
    "cost_benefit",
    "risks",
    "summary",
]


class ValidationService:
    """Service for validating project plans via multi-dimensional AI review."""

    def __init__(self):
        self.model_name = "gpt-4"  # default, updated after first call

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def validate_project(
        self,
        project_id: str,
        organization: str,
        user_id: str,
        phases_to_review: Optional[List[str]] = None,
    ) -> ValidationReport:
        """Run a full validation on a project's plan outputs.

        1. Collect phase data from the project document.
        2. Run 4 review passes (feasibility, completeness, consistency, risk).
        3. Aggregate scores and findings into a ValidationReport.
        4. Persist the report to the project document.
        """
        start = time.time()
        report_id = str(uuid.uuid4())

        # 1 — Collect phase data
        phases_data = await self._collect_phase_data(
            project_id, organization, phases_to_review
        )

        if not phases_data:
            return ValidationReport(
                id=report_id,
                project_id=project_id,
                status="failed",
                created_at=datetime.utcnow(),
                created_by=user_id,
                recommendations=["No completed phases found to validate. Complete at least 2 SDLC phases first."],
            )

        # 2 — Run the 4 review passes
        review_results: Dict[str, Dict[str, Any]] = {}
        all_findings: List[ValidationFinding] = []

        for category, prompt_builder in PROMPT_BUILDERS.items():
            result = await self._run_review_pass(category, prompt_builder, phases_data)
            review_results[category] = result

            # Convert raw findings dicts into ValidationFinding models
            for raw in result.get("findings", []):
                all_findings.append(
                    ValidationFinding(
                        id=str(uuid.uuid4()),
                        severity=self._parse_severity(raw.get("severity", "info")),
                        category=ValidationCategory(category),
                        title=raw.get("title", "Untitled Finding"),
                        description=raw.get("description", ""),
                        affected_phase=raw.get("affected_phase", "general"),
                        recommendation=raw.get("recommendation", ""),
                        confidence=self._clamp(raw.get("confidence", 0.75), 0.0, 1.0),
                        reasoning=raw.get("reasoning", ""),
                    )
                )

        # 3 — Compute scores
        feasibility_score = self._clamp(review_results.get("feasibility", {}).get("score", 0), 0, 100)
        completeness_score = self._clamp(review_results.get("completeness", {}).get("score", 0), 0, 100)
        consistency_score = self._clamp(review_results.get("consistency", {}).get("score", 0), 0, 100)
        risk_score = self._clamp(review_results.get("risk", {}).get("score", 0), 0, 100)

        overall_score = (
            feasibility_score * CATEGORY_WEIGHTS["feasibility"]
            + completeness_score * CATEGORY_WEIGHTS["completeness"]
            + consistency_score * CATEGORY_WEIGHTS["consistency"]
            + risk_score * CATEGORY_WEIGHTS["risk"]
        )

        # 4 — Build top-level recommendations from critical findings
        recommendations = self._generate_recommendations(all_findings)

        duration_ms = int((time.time() - start) * 1000)

        report = ValidationReport(
            id=report_id,
            project_id=project_id,
            overall_score=round(overall_score, 1),
            feasibility_score=round(feasibility_score, 1),
            completeness_score=round(completeness_score, 1),
            consistency_score=round(consistency_score, 1),
            risk_score=round(risk_score, 1),
            findings=all_findings,
            recommendations=recommendations,
            phases_reviewed=list(phases_data.keys()),
            model_used=self.model_name,
            tokens_used=0,  # aggregate from pipeline if available
            duration_ms=duration_ms,
            created_at=datetime.utcnow(),
            created_by=user_id,
            status="completed",
        )

        # 5 — Persist
        await self._persist_report(project_id, organization, report)

        return report

    async def get_reports(
        self, project_id: str, organization: str
    ) -> List[ValidationReport]:
        """Retrieve all validation reports for a project."""
        db = get_db()
        project = await db["projects"].find_one(
            {"_id": project_id, "organization": organization}
        )
        if not project:
            return []
        raw_reports = (project.get("validation_reports") or [])
        reports = []
        for r in raw_reports:
            try:
                reports.append(ValidationReport(**r))
            except Exception:
                continue
        # newest first
        reports.sort(key=lambda r: r.created_at or datetime.min, reverse=True)
        return reports

    async def get_report_by_id(
        self, project_id: str, organization: str, report_id: str
    ) -> Optional[ValidationReport]:
        """Retrieve a specific validation report."""
        reports = await self.get_reports(project_id, organization)
        for r in reports:
            if r.id == report_id:
                return r
        return None

    async def submit_feedback(
        self,
        project_id: str,
        organization: str,
        report_id: str,
        finding_id: str,
        helpful: bool,
        comment: Optional[str] = None,
    ) -> bool:
        """Record user feedback on a finding (for future AI learning)."""
        db = get_db()
        result = await db["projects"].update_one(
            {"_id": project_id, "organization": organization},
            {
                "$push": {
                    "validation_feedbacks": {
                        "report_id": report_id,
                        "finding_id": finding_id,
                        "helpful": helpful,
                        "comment": comment,
                        "created_at": datetime.utcnow().isoformat(),
                    }
                }
            },
        )
        return result.modified_count > 0

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _collect_phase_data(
        self,
        project_id: str,
        organization: str,
        phases_to_review: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Pull completed phase outputs from the project document."""
        db = get_db()
        project = await db["projects"].find_one(
            {"_id": project_id, "organization": organization}
        )
        if not project:
            return {}

        phases_data: Dict[str, Any] = {}
        target_phases = phases_to_review or ALL_PHASES

        # Phase data lives under project["phases"][phase_key]
        stored_phases = project.get("phases") or {}
        for phase_key in target_phases:
            phase_content = stored_phases.get(phase_key)
            if phase_content:
                phases_data[phase_key] = phase_content

        # Also pull top-level fields that contain relevant plan info
        for field in ("brief", "project_brief", "description", "name", "tech_stack"):
            val = project.get(field)
            if val:
                phases_data.setdefault("project_info", {})
                phases_data["project_info"][field] = val

        return phases_data

    async def _run_review_pass(
        self,
        category: str,
        prompt_builder,
        phases_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute one review pass and return parsed results."""
        prompt = prompt_builder(phases_data)

        try:
            gen_result = await ai_pipeline.generate_with_best_model(
                task_type=TaskType.PLAN_VALIDATION,
                prompt=prompt,
                context={"category": category},
            )

            # Track which model was actually used
            if gen_result.model_name:
                self.model_name = gen_result.model_name

            if gen_result.error:
                logger.warning(f"Validation pass '{category}' LLM error: {gen_result.error}")
                return self._placeholder_result(category)

            # Extract string content from the response
            raw_response = gen_result.content
            if isinstance(raw_response, dict):
                raw_response = json.dumps(raw_response)
            elif raw_response is not None:
                raw_response = str(raw_response)
            else:
                raw_response = ""

            result = self._parse_json_response(raw_response)

            if result and "score" in result:
                logger.info(
                    f"Validation pass '{category}' completed: score={result['score']}, "
                    f"findings={len(result.get('findings', []))}"
                )
                return result
            else:
                logger.warning(f"Validation pass '{category}' returned unexpected format")
                return self._placeholder_result(category)

        except Exception as e:
            logger.error(f"Validation pass '{category}' failed: {e}")
            return self._placeholder_result(category)

    def _parse_json_response(self, raw: str) -> Optional[Dict[str, Any]]:
        """Attempt to parse JSON from LLM response, handling markdown fences."""
        if not raw:
            return None
        text = raw.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last fence lines
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON object in the text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start:end])
                except json.JSONDecodeError:
                    pass
        return None

    def _placeholder_result(self, category: str) -> Dict[str, Any]:
        """Return a safe fallback result when LLM fails."""
        return {
            "score": 50,
            "findings": [
                {
                    "severity": "info",
                    "title": f"{category.title()} review could not be completed",
                    "description": (
                        "The AI model was unable to complete this review pass. "
                        "This may be due to API limits or connectivity issues."
                    ),
                    "affected_phase": "general",
                    "recommendation": "Try re-running the validation.",
                    "confidence": 0.3,
                    "reasoning": "Placeholder result due to LLM failure.",
                }
            ],
        }

    def _generate_recommendations(self, findings: List[ValidationFinding]) -> List[str]:
        """Generate top-level recommendations from the most severe findings."""
        recs = []
        critical = [f for f in findings if f.severity == FindingSeverity.CRITICAL]
        warnings = [f for f in findings if f.severity == FindingSeverity.WARNING]

        if critical:
            recs.append(
                f"⚠️ {len(critical)} critical issue(s) found — address these before proceeding to development."
            )
            for c in critical[:3]:
                recs.append(f"  → {c.title}: {c.recommendation}")

        if warnings:
            recs.append(
                f"⚡ {len(warnings)} warning(s) found — review and resolve where possible."
            )

        if not critical and not warnings:
            recs.append("✅ No critical or warning-level issues found. The plan looks solid!")

        total = len(findings)
        if total > 10:
            recs.append(
                f"📋 {total} total findings generated. Review all findings in the detailed report."
            )

        return recs

    @staticmethod
    def _parse_severity(val: str) -> FindingSeverity:
        val_lower = val.lower().strip()
        if val_lower in ("critical", "error", "high"):
            return FindingSeverity.CRITICAL
        if val_lower in ("warning", "warn", "medium"):
            return FindingSeverity.WARNING
        return FindingSeverity.INFO

    @staticmethod
    def _clamp(value, min_val, max_val):
        try:
            v = float(value)
        except (TypeError, ValueError):
            v = min_val
        return max(min_val, min(max_val, v))

    async def _persist_report(
        self, project_id: str, organization: str, report: ValidationReport
    ) -> None:
        """Append the validation report to the project document."""
        db = get_db()
        await db["projects"].update_one(
            {"_id": project_id, "organization": organization},
            {"$push": {"validation_reports": report.model_dump(mode="json")}},
        )
