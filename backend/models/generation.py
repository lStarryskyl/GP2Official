"""AI generation models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class JobStatus(str, Enum):
    """Generation job status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationRequest(BaseModel):
    """Generation request model."""
    project_id: str
    include_uml: bool = True
    include_tasks: bool = True
    detail_level: str = "standard"  # basic, standard, detailed
    regenerate_requirements: bool = True
    generate_srs: bool = True
    generate_risks: bool = True
    generate_costs: bool = True
    uml_types: Optional[List[str]] = None
    style_palette: Optional[Dict[str, str]] = None


class GenerationJob(BaseModel):
    """Generation job model."""
    id: str = Field(..., alias="_id")
    project_id: str
    user_id: str
    status: JobStatus = JobStatus.PENDING
    progress: float = 0.0
    result_summary: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class GenerationResponse(BaseModel):
    """Generation response model."""
    job_id: str
    status: str
    progress: float
    result_summary: Optional[Dict[str, Any]]
    error_message: Optional[str]
