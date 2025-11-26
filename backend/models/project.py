"""Project models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    """Project status."""
    DRAFT = "draft"
    PLANNING = "planning"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ProjectTemplateType(str, Enum):
    """Project template types."""
    WEB_APP = "web_app"
    MOBILE_APP = "mobile_app"
    API = "api"
    DESKTOP = "desktop"
    OTHER = "other"


def default_phase_status() -> Dict[str, str]:
    return {
        "planning": "ready",
        "cost_benefit": "locked",
        "tasks": "locked",
        "requirements_gathering": "locked",
        "requirements_validation": "locked",
        "design_architecture": "locked",
        "development": "locked",
    }


class ProjectBase(BaseModel):
    """Base project model."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    template_type: ProjectTemplateType = ProjectTemplateType.WEB_APP
    brief_text: Optional[str] = None
    questionnaire_data: Optional[Dict[str, Any]] = None
    feature_tier: str = "pro"
    phase_status: Dict[str, str] = Field(default_factory=default_phase_status)


class ProjectCreate(ProjectBase):
    """Project creation model."""
    pass


class ProjectUpdate(BaseModel):
    """Project update model."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    brief_text: Optional[str] = None
    questionnaire_data: Optional[Dict[str, Any]] = None
    feature_tier: Optional[str] = None


class Project(ProjectBase):
    """Project model."""
    id: str = Field(..., alias="_id")
    owner_id: str
    organization: str
    status: ProjectStatus = ProjectStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class ProjectResponse(BaseModel):
    """Project response model."""
    id: str
    project_id: str
    name: str
    description: Optional[str]
    template_type: str
    status: str
    owner_id: str
    organization: str
    feature_tier: str
    phase_status: Dict[str, str] = Field(default_factory=default_phase_status)
    brief_text: Optional[str]
    created_at: datetime
    updated_at: datetime
