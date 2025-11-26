"""User repository."""

from typing import Optional
from database import get_db
from models.user import User, UserCreate
from datetime import datetime
import bcrypt


class UserRepository:
    """Repository for user data access."""
    
    def __init__(self):
        self.collection_name = "users"
    
    async def create(self, user_data: UserCreate) -> User:
        """Create a new user."""
        db = get_db()
        
        # Hash password (truncate to 72 bytes for bcrypt)
        password_bytes = user_data.password.encode("utf-8")
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode()
        
        # Create user document
        user_doc = {
            "_id": str(datetime.utcnow().timestamp()).replace('.', '') + user_data.email[:5],
            "email": user_data.email,
            "full_name": user_data.full_name,
            "organization": user_data.organization or "Default Org",
            "hashed_password": hashed_password,
            "is_active": True,
            "role": "member",
            "created_at": datetime.utcnow(),
        }
        
        await db[self.collection_name].insert_one(user_doc)
        return User(**user_doc)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        db = get_db()
        user_doc = await db[self.collection_name].find_one({"email": email})
        if user_doc:
            return User(**user_doc)
        return None
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        db = get_db()
        user_doc = await db[self.collection_name].find_one({"_id": user_id})
        if user_doc:
            return User(**user_doc)
        return None
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password."""
        password_bytes = plain_password.encode("utf-8")
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode())
