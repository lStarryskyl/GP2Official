"""Models for the Code Scaffolding Service."""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ScaffoldFile(BaseModel):
    """A single scaffolded file."""
    path: str
    content: str
    language: str
    description: Optional[str] = None

class ScaffoldResult(BaseModel):
    """The complete result of a scaffolding operation."""
    id: str
    project_id: str
    target_stack: str
    files: List[ScaffoldFile] = []
    setup_instructions: str
    tree_visualization: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    duration_ms: int = 0
    tokens_used: int = 0

class ScaffoldRequest(BaseModel):
    """Request to generate code scaffolding."""
    target_stack: Optional[str] = None  # e.g., "FastAPI + React", "Next.js", etc.
    include_tests: bool = True
    include_docker: bool = True
    project_tier: str = "mvp"  # mvp, startup, enterprise

class ScaffoldResponse(BaseModel):
    """API response containing scaffolding results."""
    success: bool = True
    scaffold: Optional[ScaffoldResult] = None
    message: str = ""

class ScaffoldListResponse(BaseModel):
    """API response containing a list of past scaffolds."""
    success: bool = True
    scaffolds: List[ScaffoldResult] = []
    total: int = 0
