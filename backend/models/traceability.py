"""Requirement traceability models."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class TraceabilityLink(BaseModel):
    """Traceability link between entities."""
    id: str = Field(..., alias="_id")
    project_id: str
    source_type: str
    source_id: str
    source_name: str
    target_type: str
    target_id: str
    target_name: str
    link_type: str
    rationale: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class TraceabilityMatrix(BaseModel):
    """Traceability matrix."""
    project_id: str
    requirements: List[Dict[str, Any]] = Field(default_factory=list)
    tasks: List[Dict[str, Any]] = Field(default_factory=list)
    test_cases: List[Dict[str, Any]] = Field(default_factory=list)
    links: List[TraceabilityLink] = Field(default_factory=list)
    coverage_percentage: float = 0.0
    orphaned_requirements: List[str] = Field(default_factory=list)
    orphaned_tasks: List[str] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class CoverageReport(BaseModel):
    """Coverage report for traceability."""
    project_id: str
    total_requirements: int
    covered_requirements: int
    coverage_percentage: float
    uncovered_requirements: List[Dict[str, Any]] = Field(default_factory=list)
    requirements_without_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    tasks_without_requirements: List[Dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
