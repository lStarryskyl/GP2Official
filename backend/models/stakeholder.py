"""Stakeholder management models."""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime


class StakeholderBase(BaseModel):
    """Base stakeholder model."""
    name: str
    role: Optional[str] = None
    organization: Optional[str] = None
    influence_level: str = "medium"
    interest_level: str = "medium"
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    preferences: List[str] = Field(default_factory=list)
    concerns: List[str] = Field(default_factory=list)


class StakeholderCreate(StakeholderBase):
    """Stakeholder creation model."""
    project_id: str


class Stakeholder(StakeholderBase):
    """Stakeholder model."""
    id: str = Field(..., alias="_id")
    project_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class StakeholderFeedbackBase(BaseModel):
    """Base stakeholder feedback model."""
    feedback_type: str
    priority: str = "medium"
    description: str
    proposed_change: Optional[str] = None
    status: str = "pending"
    resolution: Optional[str] = None


class StakeholderFeedbackCreate(StakeholderFeedbackBase):
    """Stakeholder feedback creation model."""
    project_id: str
    stakeholder_id: str
    requirement_id: Optional[str] = None


class StakeholderFeedback(StakeholderFeedbackBase):
    """Stakeholder feedback model."""
    id: str = Field(..., alias="_id")
    project_id: str
    stakeholder_id: str
    requirement_id: Optional[str] = None
    impact_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ImpactAnalysis(BaseModel):
    """Impact analysis for change requests."""
    id: str = Field(..., alias="_id")
    change_request_id: str
    affected_requirements: List[str] = Field(default_factory=list)
    affected_tasks: List[str] = Field(default_factory=list)
    effort_estimate: str
    cost_impact: str
    schedule_impact: str
    risk_level: str
    benefits: List[str] = Field(default_factory=list)
    drawbacks: List[str] = Field(default_factory=list)
    recommendation: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
