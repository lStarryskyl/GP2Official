"""Authentication service."""

import re
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status

from config import settings
from models.user import User, UserCreate, UserLogin, TokenResponse, build_user_response
from repositories.user_repository import UserRepository
from repositories.refresh_token_repository import RefreshTokenRepository
from repositories.workspace_invite_repository import WorkspaceInviteRepository


class AuthService:
    """Service for authentication logic."""
    
    def __init__(self):
        self.user_repo = UserRepository()
        self.refresh_repo = RefreshTokenRepository()
        self.invite_repo = WorkspaceInviteRepository()
    
    async def register(self, user_data: UserCreate, ip_address: Optional[str], user_agent: Optional[str]) -> TokenResponse:
        """Register a new user."""
        self._validate_password_strength(user_data.password)
        existing_user = await self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        user = await self.user_repo.create(user_data)
        user = await self._apply_workspace_invite(user)
        return await self._build_token_response(user, user_agent, ip_address)
    
    async def login(self, login_data: UserLogin, ip_address: Optional[str], user_agent: Optional[str]) -> TokenResponse:
        """Login user."""
        user = await self.user_repo.get_by_email(login_data.email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not self.user_repo.verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return await self._build_token_response(user, user_agent, ip_address)
    
    async def refresh_access_token(self, refresh_token: str, ip_address: Optional[str], user_agent: Optional[str]) -> TokenResponse:
        """Rotate refresh token and issue new access token."""
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token missing"
            )
        token_hash = self._hash_token(refresh_token)
        stored = await self.refresh_repo.get_active_token(token_hash)
        if not stored:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        await self.refresh_repo.revoke_token(stored.id)
        user = await self.user_repo.get_by_id(stored.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive"
            )
        return await self._build_token_response(user, user_agent, ip_address)
    
    async def logout(self, refresh_token: str) -> None:
        """Revoke refresh token on logout."""
        if not refresh_token:
            return
        token_hash = self._hash_token(refresh_token)
        await self.refresh_repo.revoke_by_hash(token_hash)
    
    def _validate_password_strength(self, password: str) -> None:
        """Enforce minimum password complexity."""
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
        if not re.search(r"[A-Z]", password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must include an uppercase letter")
        if not re.search(r"[a-z]", password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must include a lowercase letter")
        if not re.search(r"[0-9]", password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must include a number")
    
    async def _build_token_response(self, user: User, user_agent: Optional[str], ip_address: Optional[str]) -> TokenResponse:
        access_token = self._create_access_token(user.id)
        refresh_token = await self._issue_refresh_token(user.id, user_agent, ip_address)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=build_user_response(user),
        )
    
    async def _issue_refresh_token(self, user_id: str, user_agent: Optional[str], ip_address: Optional[str]) -> str:
        raw_token = secrets.token_urlsafe(48)
        token_hash = self._hash_token(raw_token)
        expires = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
        await self.refresh_repo.create_token(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        return raw_token
    
    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
    
    def _create_access_token(self, user_id: str) -> str:
        """Create JWT access token."""
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        to_encode = {
            "sub": user_id,
            "exp": expire,
        }
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    async def get_current_user(self, token: str) -> User:
        """Get current user from token."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        user = await self.user_repo.get_by_id(user_id)
        if user is None or not user.is_active:
            raise credentials_exception
    
        return user

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        """Verify current password and set a new one."""
        if not self.user_repo.verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        self._validate_password_strength(new_password)
        if current_password == new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        import bcrypt
        password_bytes = new_password.encode("utf-8")[:72]
        new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode()
        await self.user_repo.update_password(user.id, new_hash)

    async def _apply_workspace_invite(self, user: User) -> User:
        """If an invite exists for this email, join the associated workspace."""
        invite = await self.invite_repo.find_pending_for_email(user.email)
        if not invite:
            return user
        updated = await self.user_repo.update_workspace(user.id, invite.organization, invite.role)
        await self.invite_repo.mark_accepted(invite.id, user.id)
        return updated or user
