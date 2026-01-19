"""Activity log models."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ActivityLog(BaseModel):
    """Activity log entry."""

    id: str = Field(..., alias="_id")
    project_id: str
    user_id: Optional[str] = None
    event_type: str
    details_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ActivityLogResponse(BaseModel):
    """API response for activity log."""

    id: str
    project_id: str
    user_id: Optional[str]
    event_type: str
    details_json: Dict[str, Any]
    created_at: datetime
