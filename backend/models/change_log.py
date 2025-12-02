"""Change log models."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from pydantic.config import ConfigDict


class ChangeLogMetadata(BaseModel):
    """Flexible metadata blob for manual + upload entries."""

    upload_filename: Optional[str] = None
    snippet_preview: Optional[str] = None
    generate_diagram: Optional[bool] = None
    diagram_job_id: Optional[str] = None
    file_details: Optional[List[Dict[str, Any]]] = None
    additional_info: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")


class ChangeLogEntry(BaseModel):
    """A recorded development update."""

    id: str = Field(..., alias="_id")
    project_id: str
    organization: Optional[str] = None
    author_id: str
    description: str
    files: List[str] = Field(default_factory=list)
    task_ids: List[str] = Field(default_factory=list)
    requirement_ids: List[str] = Field(default_factory=list)
    entry_type: str = "manual"
    ai_summary: Optional[str] = None
    diagram_url: Optional[str] = None
    metadata: ChangeLogMetadata = Field(default_factory=ChangeLogMetadata)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ChangeLogEntryResponse(BaseModel):
    """Serialized response for change log entries."""

    id: str
    project_id: str
    organization: Optional[str]
    author_id: str
    description: str
    files: List[str]
    task_ids: List[str]
    requirement_ids: List[str]
    entry_type: str
    ai_summary: Optional[str]
    diagram_url: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ChangeLogCreateRequest(BaseModel):
    """Payload when creating an entry."""

    description: str
    files: List[str] = Field(default_factory=list)
    task_ids: List[str] = Field(default_factory=list)
    requirement_ids: List[str] = Field(default_factory=list)
    entry_type: str = "manual"
    generate_diagram: bool = False


class ChangeLogUploadMetadata(BaseModel):
    filename: str
    file_count: int
    preview: Optional[str] = None
