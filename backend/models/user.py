"""User models."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    full_name: Optional[str] = None
    organization: Optional[str] = None


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
    role: str = "member"
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
    created_at: datetime


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
