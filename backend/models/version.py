"""Version history and diffing models."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class VersionBase(BaseModel):
    """Base version model."""
    entity_type: str
    entity_id: str
    version_number: int
    changes: Dict[str, Any]
    change_summary: str


class VersionCreate(VersionBase):
    """Version creation model."""
    project_id: str
    changed_by: str


class Version(VersionBase):
    """Version model."""
    id: str = Field(..., alias="_id")
    project_id: str
    changed_by: str
    changed_by_name: str
    previous_version_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class DiffResult(BaseModel):
    """Diff result between two versions."""
    entity_type: str
    entity_id: str
    from_version: int
    to_version: int
    added: Dict[str, Any] = Field(default_factory=dict)
    removed: Dict[str, Any] = Field(default_factory=dict)
    modified: Dict[str, Any] = Field(default_factory=dict)
    summary: str


class VersionHistoryRequest(BaseModel):
    """Request for version history."""
    entity_type: str
    entity_id: str
    limit: int = Field(default=20, ge=1, le=100)


class CompareVersionsRequest(BaseModel):
    """Request to compare two versions."""
    entity_type: str
    entity_id: str
    from_version: int
    to_version: int
