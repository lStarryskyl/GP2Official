"""Diagram workspace models."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SDLCStage(str, Enum):
    """Supported SDLC stages."""

    PLANNING = "planning"
    REQUIREMENTS = "requirements"
    DESIGN = "design"
    IMPLEMENTATION = "implementation"
    TESTING = "testing"
    DEPLOYMENT = "deployment"
    MAINTENANCE = "maintenance"


STAGE_LABELS = {
    SDLCStage.PLANNING.value: "Planning",
    SDLCStage.REQUIREMENTS.value: "Requirements",
    SDLCStage.DESIGN.value: "Design",
    SDLCStage.IMPLEMENTATION.value: "Implementation",
    SDLCStage.TESTING.value: "Testing",
    SDLCStage.DEPLOYMENT.value: "Deployment",
    SDLCStage.MAINTENANCE.value: "Maintenance",
}

SDLC_STAGE_ORDER = [
    SDLCStage.PLANNING.value,
    SDLCStage.REQUIREMENTS.value,
    SDLCStage.DESIGN.value,
    SDLCStage.IMPLEMENTATION.value,
    SDLCStage.TESTING.value,
    SDLCStage.DEPLOYMENT.value,
    SDLCStage.MAINTENANCE.value,
]


def get_stage_label(stage: str) -> str:
    """Return human label for a stage."""
    return STAGE_LABELS.get(stage, stage.replace("_", " ").title())


class DiagramNode(BaseModel):
    """Node payload stored for a workspace."""

    id: str
    type: Optional[str] = "default"
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    data: Dict[str, Any] = Field(default_factory=dict)


class DiagramEdge(BaseModel):
    """Edge payload stored for a workspace."""

    id: str
    source: str
    target: str
    label: Optional[str] = None
    type: Optional[str] = "smoothstep"
    data: Dict[str, Any] = Field(default_factory=dict)


class DiagramState(BaseModel):
    """Diagram workspace document."""

    id: str = Field(..., alias="_id")
    project_id: str
    stage: str
    title: str
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class DiagramStateResponse(BaseModel):
    """Response payload for a workspace."""

    id: str
    diagram_id: str
    project_id: str
    stage: str
    title: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class DiagramUpdateRequest(BaseModel):
    """Request body for saving a workspace."""

    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    title: Optional[str] = None


class DiagramChatRequest(BaseModel):
    """Chat instruction for the diagram assistant."""

    message: str


class DiagramChatResponse(BaseModel):
    """Assistant response with updated diagram."""

    message: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    stage: str
