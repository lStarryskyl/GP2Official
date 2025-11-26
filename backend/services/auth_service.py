"""Authentication service."""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status

from config import settings
from models.user import User, UserCreate, UserLogin, UserResponse, TokenResponse
from repositories.user_repository import UserRepository


class AuthService:
    """Service for authentication logic."""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    async def register(self, user_data: UserCreate) -> TokenResponse:
        """Register a new user."""
        # Check if user exists
        existing_user = await self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user = await self.user_repo.create(user_data)
        
        # Generate token
        access_token = self._create_access_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                organization=user.organization,
                role=user.role,
                created_at=user.created_at,
            )
        )
    
    async def login(self, login_data: UserLogin) -> TokenResponse:
        """Login user."""
        # Get user
        user = await self.user_repo.get_by_email(login_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password
        if not self.user_repo.verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Generate token
        access_token = self._create_access_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                organization=user.organization,
                role=user.role,
                created_at=user.created_at,
            )
        )
    
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
        if user is None:
            raise credentials_exception
        
        return user
