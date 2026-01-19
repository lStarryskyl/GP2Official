"""SRS Audit models."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AuditFinding(BaseModel):
    """Individual audit finding."""
    id: Optional[str] = None
    category: str
    severity: str
    requirement_id: Optional[str] = None
    title: str
    description: str
    recommendation: str
    status: str = "open"


class SRSAuditReport(BaseModel):
    """SRS Audit report."""
    id: str = Field(..., alias="_id")
    project_id: str
    audit_date: datetime = Field(default_factory=datetime.utcnow)
    overall_score: float
    completeness_score: float
    consistency_score: float
    clarity_score: float
    testability_score: float
    findings: List[AuditFinding] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class AuditFindingDB(BaseModel):
    """Audit finding database model."""
    id: str = Field(..., alias="_id")
    audit_id: str
    category: str
    severity: str
    requirement_id: Optional[str] = None
    title: str
    description: str
    recommendation: str
    status: str = "open"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
