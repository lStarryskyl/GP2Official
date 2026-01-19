"""Notification and activity feed models."""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationBase(BaseModel):
    """Base notification model."""
    type: str
    title: str
    message: str
    priority: str = "normal"


class NotificationCreate(NotificationBase):
    """Notification creation model."""
    user_id: str
    project_id: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Notification(NotificationBase):
    """Notification model."""
    id: str = Field(..., alias="_id")
    user_id: str
    project_id: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ActivityFeedItem(BaseModel):
    """Activity feed item."""
    id: str = Field(..., alias="_id")
    project_id: str
    user_id: str
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    entity_name: str
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class NotificationPreferences(BaseModel):
    """User notification preferences."""
    id: str = Field(..., alias="_id")
    user_id: str
    email_notifications: bool = True
    push_notifications: bool = True
    comment_mentions: bool = True
    requirement_changes: bool = True
    task_assignments: bool = True
    project_updates: bool = True
    weekly_digest: bool = True

    class Config:
        populate_by_name = True
