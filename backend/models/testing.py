"""Testing phase models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class TestScenarioType(str, Enum):
    """Types of test scenarios."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    EDGE_CASE = "edge_case"
    BOUNDARY = "boundary"
    STRESS = "stress"


class CoverageStatus(str, Enum):
    """Coverage audit statuses for a requirement."""
    COVERED = "covered"
    PARTIALLY_COVERED = "partially_covered"
    ORPHANED = "orphaned"


class TestScenario(BaseModel):
    """A single test scenario generated from a requirement."""
    scenario_id: str
    requirement_id: str
    requirement_title: str
    scenario_type: str
    title: str
    description: str
    preconditions: List[str] = Field(default_factory=list)
    test_steps: List[str] = Field(default_factory=list)
    expected_result: str = ""
    test_data: List[Dict[str, Any]] = Field(default_factory=list)
    priority: str = "medium"


class TestDataSet(BaseModel):
    """A collection of synthetic test data rows for a requirement."""
    requirement_id: str
    requirement_title: str
    data_description: str = ""
    columns: List[str] = Field(default_factory=list)
    rows: List[Dict[str, Any]] = Field(default_factory=list)
    edge_cases: List[Dict[str, Any]] = Field(default_factory=list)
    notes: str = ""


class CoverageEntry(BaseModel):
    """Coverage audit result for a single requirement."""
    requirement_id: str
    requirement_title: str
    requirement_type: str
    priority: str
    status: str  # covered | partially_covered | orphaned
    test_scenario_count: int = 0
    matched_scenarios: List[str] = Field(default_factory=list)
    gap_reason: str = ""


class TestGenerationResult(BaseModel):
    """Complete result from the test data generation agent."""
    project_id: str
    total_requirements: int = 0
    total_scenarios: int = 0
    total_edge_cases: int = 0
    scenarios: List[TestScenario] = Field(default_factory=list)
    datasets: List[TestDataSet] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class CoverageAuditResult(BaseModel):
    """Complete result from the coverage auditor agent."""
    project_id: str
    total_requirements: int = 0
    covered_count: int = 0
    partially_covered_count: int = 0
    orphaned_count: int = 0
    coverage_percentage: float = 0.0
    entries: List[CoverageEntry] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    audited_at: datetime = Field(default_factory=datetime.utcnow)


class GenerateTestDataRequest(BaseModel):
    """Request payload for generating test data."""
    requirement_ids: Optional[List[str]] = None  # None = all functional requirements
    include_edge_cases: bool = True
    include_boundary_values: bool = True
    max_rows_per_requirement: int = 10


class RunCoverageAuditRequest(BaseModel):
    """Request payload for running a coverage audit."""
    include_non_functional: bool = False  # default: only functional reqs
