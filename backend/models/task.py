"""Task models."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Task(BaseModel):
    """Task document."""
    id: str = Field(..., alias="_id")
    project_id: str
    requirement_id: Optional[str] = None
    title: str
    description: str
    estimate_hours: float = 0
    actual_hours: float = 0
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: str = "planned"
    priority: str = "medium"
    assignee_id: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    phase: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class TaskResponse(BaseModel):
    """Task response payload."""
    id: str
    task_id: str
    project_id: str
    requirement_id: Optional[str]
    title: str
    description: str
    estimate_hours: float
    actual_hours: float
    status: str
    priority: str
    dependencies: List[str]
    tags: List[str]
    phase: Optional[str]
    created_at: datetime
    updated_at: datetime


class TaskUpdate(BaseModel):
    """Task update payload."""
    title: Optional[str] = None
    description: Optional[str] = None
    estimate_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dependencies: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    phase: Optional[str] = None
