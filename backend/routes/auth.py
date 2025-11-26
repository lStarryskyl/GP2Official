"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.user import UserCreate, UserLogin, TokenResponse, UserResponse
from models.user import User
from services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency to get current user from JWT token."""
    return await auth_service.get_current_user(credentials.credentials)


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user."""
    return await auth_service.register(user_data)


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """Login user."""
    return await auth_service.login(login_data)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        organization=current_user.organization,
        role=current_user.role,
        created_at=current_user.created_at,
    )
