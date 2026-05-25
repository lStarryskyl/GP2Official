"""Authentication routes."""

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from models.user import UserCreate, UserLogin, TokenResponse, UserResponse, resolve_role, build_user_response
from models.user import User
from services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer()
auth_service = AuthService()


class RefreshRequest(BaseModel):
    refresh_token: str


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency to get current user from JWT token."""
    return await auth_service.get_current_user(credentials.credentials)


def _client_context(request: Request):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, request: Request):
    """Register a new user."""
    ip_address, user_agent = _client_context(request)
    return await auth_service.register(user_data, ip_address, user_agent)


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, request: Request):
    """Login user."""
    ip_address, user_agent = _client_context(request)
    return await auth_service.login(login_data, ip_address, user_agent)


@router.post("/token/refresh/", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, request: Request):
    """Refresh expired access token."""
    ip_address, user_agent = _client_context(request)
    return await auth_service.refresh_access_token(payload.refresh_token, ip_address, user_agent)


@router.post("/logout")
async def logout(payload: RefreshRequest):
    """Revoke refresh token."""
    await auth_service.logout(payload.refresh_token)
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info."""
    return build_user_response(current_user)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    """Change the authenticated user's password."""
    if payload.new_password != payload.confirm_password:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match"
        )
    await auth_service.change_password(current_user, payload.current_password, payload.new_password)
    return {"detail": "Password updated successfully"}
