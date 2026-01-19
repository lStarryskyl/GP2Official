"""Requirement models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class RequirementType(str, Enum):
    """Requirement types."""
    FUNCTIONAL = "functional"
    NON_FUNCTIONAL = "non_functional"
    BUSINESS = "business"
    TECHNICAL = "technical"


class RequirementPriority(str, Enum):
    """Requirement priority."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Requirement(BaseModel):
    """Requirement model."""
    id: str = Field(..., alias="_id")
    project_id: str
    type: RequirementType
    title: str
    description: str
    priority: RequirementPriority = RequirementPriority.MEDIUM
    status: str = "proposed"
    confidence_score: Optional[float] = None
    source_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class RequirementResponse(BaseModel):
    """Requirement response model."""
    id: str
    requirement_id: str
    project_id: str
    type: str
    title: str
    description: str
    priority: str
    status: str
    confidence_score: Optional[float]
    created_at: datetime
    updated_at: datetime


class RequirementUpdate(BaseModel):
    """Requirement update payload."""
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class RequirementCreate(BaseModel):
    """Requirement creation payload."""
    type: RequirementType = RequirementType.FUNCTIONAL
    title: str
    description: str
    priority: RequirementPriority = RequirementPriority.MEDIUM
    status: str = "proposed"
    confidence_score: Optional[float] = None
