"""Stakeholder negotiation and comment threading models."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class CommentBase(BaseModel):
    """Base comment model for threading."""
    content: str
    author_id: str
    author_name: str


class CommentCreate(CommentBase):
    """Comment creation model."""
    parent_id: Optional[str] = None
    requirement_id: Optional[str] = None
    project_id: str


class Comment(CommentBase):
    """Comment model with threading."""
    id: str = Field(..., alias="_id")
    project_id: str
    requirement_id: Optional[str] = None
    parent_id: Optional[str] = None
    replies: List[str] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)
    reactions: Dict[str, List[str]] = Field(default_factory=dict)
    edited: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class NegotiationThreadBase(BaseModel):
    """Base negotiation thread model."""
    title: str
    description: str
    status: str = "open"
    priority: str = "medium"


class NegotiationThreadCreate(NegotiationThreadBase):
    """Negotiation thread creation model."""
    project_id: str
    requirement_id: Optional[str] = None
    stakeholder_ids: List[str] = Field(default_factory=list)


class NegotiationThread(NegotiationThreadBase):
    """Negotiation thread model."""
    id: str = Field(..., alias="_id")
    project_id: str
    requirement_id: Optional[str] = None
    stakeholder_ids: List[str] = Field(default_factory=list)
    created_by: str
    comments: List[str] = Field(default_factory=list)
    decisions: List[Dict[str, Any]] = Field(default_factory=list)
    impact_analysis_id: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class DecisionRecord(BaseModel):
    """Decision record for negotiation."""
    id: str = Field(..., alias="_id")
    thread_id: str
    decision: str
    rationale: str
    decided_by: str
    approved_by: List[str] = Field(default_factory=list)
    impact_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
