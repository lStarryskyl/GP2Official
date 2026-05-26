"""Validation models for AI Plan Validator."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class ValidationCategory(str, Enum):
    FEASIBILITY = "feasibility"
    COMPLETENESS = "completeness"
    CONSISTENCY = "consistency"
    RISK = "risk"


class ValidationFinding(BaseModel):
    """Individual finding from a validation review pass."""
    id: str = ""
    severity: FindingSeverity = FindingSeverity.INFO
    category: ValidationCategory = ValidationCategory.FEASIBILITY
    title: str = ""
    description: str = ""
    affected_phase: str = ""
    recommendation: str = ""
    confidence: float = Field(default=0.75, ge=0.0, le=1.0)
    reasoning: str = ""


class ValidationReport(BaseModel):
    """Complete validation report for a project plan."""
    id: str = ""
    project_id: str = ""
    overall_score: float = Field(default=0.0, ge=0.0, le=100.0)
    feasibility_score: float = Field(default=0.0, ge=0.0, le=100.0)
    completeness_score: float = Field(default=0.0, ge=0.0, le=100.0)
    consistency_score: float = Field(default=0.0, ge=0.0, le=100.0)
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    findings: List[ValidationFinding] = []
    recommendations: List[str] = []
    phases_reviewed: List[str] = []
    model_used: str = ""
    tokens_used: int = 0
    duration_ms: int = 0
    created_at: Optional[datetime] = None
    created_by: str = ""
    status: str = "pending"  # pending | running | completed | failed


class ValidationRequest(BaseModel):
    """Request to trigger a new validation run."""
    phases_to_review: Optional[List[str]] = None  # None = all available


class ValidationFeedback(BaseModel):
    """User feedback on a specific finding."""
    finding_id: str
    helpful: bool
    comment: Optional[str] = None


class ValidationResponse(BaseModel):
    """API response wrapping a validation report."""
    success: bool = True
    report: Optional[ValidationReport] = None
    message: str = ""


class ValidationListResponse(BaseModel):
    """API response for listing validation reports."""
    success: bool = True
    reports: List[ValidationReport] = []
    total: int = 0
