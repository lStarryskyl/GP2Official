"""Template library models."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class TemplateBase(BaseModel):
    """Base template model."""
    name: str
    description: str
    category: str
    industry: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class TemplateCreate(TemplateBase):
    """Template creation model."""
    created_by: str
    content: Dict[str, Any]
    is_public: bool = False


class Template(TemplateBase):
    """Template model."""
    id: str = Field(..., alias="_id")
    created_by: str
    created_by_name: str
    content: Dict[str, Any]
    is_public: bool = False
    usage_count: int = 0
    rating: float = 0.0
    rating_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class BriefTemplate(BaseModel):
    """Brief builder template."""
    id: str = Field(..., alias="_id")
    name: str
    description: str
    sections: List[Dict[str, Any]] = Field(default_factory=list)
    prompts: List[str] = Field(default_factory=list)
    example_content: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class TemplateRating(BaseModel):
    """Template rating."""
    template_id: str
    user_id: str
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
