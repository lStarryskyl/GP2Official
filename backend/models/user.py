"""User models."""

from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import Optional, Dict, List, Union
from datetime import datetime

ROLE_CATALOG: Dict[str, Dict[str, object]] = {
    "portfolio_admin": {
        "label": "Portfolio Admin",
        "description": "Owns the organization account, manages billing, and can invite anyone.",
        "authority": 5,
    },
    "program_manager": {
        "label": "Program Manager",
        "description": "Controls project templates, approves AI runs, and manages teams.",
        "authority": 4,
    },
    "product_manager": {
        "label": "Product Manager",
        "description": "Owns planning, feasibility, and requirements decisions.",
        "authority": 3,
    },
    "business_analyst": {
        "label": "Business Analyst",
        "description": "Documents analysis, risks, and supports sign-off workflows.",
        "authority": 2,
    },
    "developer": {
        "label": "Developer",
        "description": "Executes tasks, designs components, and delivers estimates.",
        "authority": 1,
    },
    "qa": {
        "label": "QA / Validation",
        "description": "Runs validation, testing, and approval checklists.",
        "authority": 1,
    },
}

DEFAULT_ROLE = "program_manager"
MIN_PROJECT_ADMIN_AUTHORITY = 4


def resolve_role(role: Optional[str]) -> tuple[str, Dict[str, object]]:
    """Return a supported role key and its metadata."""
    key = (role or "").lower()
    if key not in ROLE_CATALOG:
        key = DEFAULT_ROLE
    return key, ROLE_CATALOG[key]


class SocialLink(BaseModel):
    """External social/profile link."""
    label: str
    url: str


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: str = Field(default=DEFAULT_ROLE)


class UserCreate(UserBase):
    """User creation model."""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """User login model."""
    email: EmailStr
    password: str


class User(UserBase):
    """User model."""
    id: str = Field(..., alias="_id")
    hashed_password: str
    is_active: bool = True
    subscription_tier: Optional[str] = "free"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """User response model."""
    id: str
    email: EmailStr
    full_name: Optional[str]
    organization: Optional[str]
    role: str
    role_label: str
    role_authority: int
    subscription_tier: str = "free"
    avatar_url: Optional[Union[HttpUrl, str]] = None
    banner_url: Optional[Union[HttpUrl, str]] = None
    bio: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    pronouns: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    social_links: List[Dict[str, str]] = Field(default_factory=list)
    availability: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
    user: UserResponse


class UserProfileUpdate(BaseModel):
    """Payload for updating profile fields."""
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    pronouns: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    availability: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    social_links: Optional[List[SocialLink]] = None


def build_user_response(user: "User") -> UserResponse:
    """Convert persistence model to API response."""
    role_key, meta = resolve_role(getattr(user, "role", DEFAULT_ROLE))
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        organization=user.organization,
        role=role_key,
        role_label=str(meta.get("label")),
        role_authority=int(meta.get("authority", 1)),
        subscription_tier=(getattr(user, "subscription_tier", None) or "free"),
        avatar_url=getattr(user, "avatar_url", None),
        banner_url=getattr(user, "banner_url", None),
        bio=getattr(user, "bio", None),
        job_title=getattr(user, "job_title", None),
        location=getattr(user, "location", None),
        timezone=getattr(user, "timezone", None),
        pronouns=getattr(user, "pronouns", None),
        skills=list(getattr(user, "skills", []) or []),
        interests=list(getattr(user, "interests", []) or []),
        social_links=list(getattr(user, "social_links", []) or []),
        availability=getattr(user, "availability", None),
        contact_email=getattr(user, "contact_email", None),
        phone=getattr(user, "phone", None),
        created_at=user.created_at,
    )
