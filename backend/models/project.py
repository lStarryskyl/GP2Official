"""Project models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
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
        "feasibility_study": "locked",
        "requirements_gathering": "locked",
        "validation": "locked",
        "design": "locked",
        "development": "locked",
        "tasks": "locked",
        "cost_benefit": "locked",
        "risks": "locked",
        "testing": "locked",
        "summary": "locked",
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
    roadmap: Optional[List[Dict[str, Any]]] = None
    roadmap_summary: Optional[List[Dict[str, Any]]] = None
    feasibility_studies: Optional[List[Dict[str, Any]]] = None
    development_stack: Optional[List[Dict[str, Any]]] = None
    development_notes: Optional[Dict[str, Any]] = None
    feasibility_sections: Optional[List[Dict[str, Any]]] = None
    parent_project_id: Optional[str] = None
    scenario_label: Optional[str] = None
    scenario_metadata: Optional[Dict[str, Any]] = None
    ui_preferences: Optional[Dict[str, Any]] = None
    team_members: List[Dict[str, Any]] = Field(default_factory=list)


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
    roadmap: Optional[List[Dict[str, Any]]] = None
    roadmap_summary: Optional[List[Dict[str, Any]]] = None
    feasibility_studies: Optional[List[Dict[str, Any]]] = None
    feasibility_sections: Optional[List[Dict[str, Any]]] = None
    development_stack: Optional[List[Dict[str, Any]]] = None
    development_notes: Optional[Dict[str, Any]] = None
    parent_project_id: Optional[str] = None
    scenario_label: Optional[str] = None
    scenario_metadata: Optional[Dict[str, Any]] = None
    ui_preferences: Optional[Dict[str, Any]] = None


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
    roadmap: Optional[List[Dict[str, Any]]] = None
    roadmap_summary: Optional[List[Dict[str, Any]]] = None
    feasibility_studies: Optional[List[Dict[str, Any]]] = None
    feasibility_sections: Optional[List[Dict[str, Any]]] = None
    development_stack: Optional[List[Dict[str, Any]]] = None
    development_notes: Optional[Dict[str, Any]] = None
    parent_project_id: Optional[str] = None
    scenario_label: Optional[str] = None
    scenario_metadata: Optional[Dict[str, Any]] = None
    ui_preferences: Optional[Dict[str, Any]] = None
    team_members: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ScenarioBranchRequest(BaseModel):
    """Request payload for scenario branching."""

    label: str
    description: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None
    include_tasks: bool = True
    include_requirements: bool = True
    include_artifacts: bool = True


class ScenarioSnapshot(BaseModel):
    """Snapshot of a scenario for comparison."""

    project_id: str
    name: str
    status: str
    phase_status: Dict[str, str]
    requirements: int
    tasks: int
    risk_artifacts: int
    cost_estimate: float


class ScenarioDiffResponse(BaseModel):
    """Response describing deltas between main and branch scenarios."""

    baseline: ScenarioSnapshot
    branch: ScenarioSnapshot
    summary: Dict[str, Any]
    phase_deltas: List[Dict[str, Any]]


class GuidedWorkspaceRequest(BaseModel):
    """Wizard questionnaire inputs."""

    industry: str
    team_size: str
    compliance: List[str] = Field(default_factory=list)
    ai_provider: str
    delivery_model: str
    collaboration_focus: str


class GuidedWorkspaceResponse(BaseModel):
    """Resolved template configuration."""

    preset: str
    recommended_phases: List[str]
    required_artifacts: List[str]
    ai_prompts: Dict[str, str]
    risk_library: List[str]
    integrations: List[str]
    notes: List[str]
