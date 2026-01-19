"""Persona and User Story models."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PersonaBase(BaseModel):
    """Base persona model."""
    name: str
    role: str
    age_range: Optional[str] = None
    background: Optional[str] = None
    goals: List[str] = Field(default_factory=list)
    pain_points: List[str] = Field(default_factory=list)
    tech_savviness: Optional[str] = None
    motivations: List[str] = Field(default_factory=list)
    frustrations: List[str] = Field(default_factory=list)
    preferred_channels: List[str] = Field(default_factory=list)
    quote: Optional[str] = None
    avatar_url: Optional[str] = None


class PersonaCreate(PersonaBase):
    """Persona creation model."""
    project_id: str


class Persona(PersonaBase):
    """Persona model."""
    id: str = Field(..., alias="_id")
    project_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserStoryBase(BaseModel):
    """Base user story model."""
    title: str
    as_a: str
    i_want: str
    so_that: str
    acceptance_criteria: List[str] = Field(default_factory=list)
    priority: str = "medium"
    story_points: Optional[int] = None
    status: str = "draft"
    linked_requirements: List[str] = Field(default_factory=list)


class UserStoryCreate(UserStoryBase):
    """User story creation model."""
    project_id: str
    persona_id: Optional[str] = None


class UserStory(UserStoryBase):
    """User story model."""
    id: str = Field(..., alias="_id")
    project_id: str
    persona_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class GeneratePersonasRequest(BaseModel):
    """Request to generate personas."""
    industry: Optional[str] = None
    target_users: Optional[str] = None
    project_goals: Optional[str] = None
    num_personas: int = Field(default=3, ge=1, le=10)


class GenerateUserStoriesRequest(BaseModel):
    """Request to generate user stories."""
    persona_ids: Optional[List[str]] = None
    num_stories_per_persona: int = Field(default=5, ge=1, le=20)
