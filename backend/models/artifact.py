"""Artifact models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class Artifact(BaseModel):
    """Artifact document."""
    id: str = Field(..., alias="_id")
    project_id: str
    type: str
    title: str
    content_json: Dict[str, Any]
    version: int = 1
    is_approved: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ArtifactResponse(BaseModel):
    """Artifact response payload."""
    id: str
    artifact_id: str
    project_id: str
    type: str
    title: str
    content_json: Dict[str, Any]
    version: int
    is_approved: bool
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
