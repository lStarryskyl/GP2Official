"""Refresh token repository."""

from datetime import datetime
from typing import Optional
import uuid

from database import get_db
from models.token import RefreshToken


def _get_repository():
    """Get the appropriate repository based on pool availability."""
    try:
        from database import pool
        if pool is not None:
            return _SupabaseRefreshTokenRepository()
    except ImportError:
        pass
    return _MongoRefreshTokenRepository()


class RefreshTokenRepository:
    """Manage persistence of refresh tokens - delegates to appropriate backend."""

    def __init__(self) -> None:
        self._cached_repo = None

    @property
    def _repo(self):
        """Lazy repository getter - checks pool availability at call time."""
        if self._cached_repo is None:
            self._cached_repo = _get_repository()
        return self._cached_repo

    async def create_token(self, *, user_id: str, token_hash: str, expires_at: datetime,
                          user_agent: Optional[str], ip_address: Optional[str]) -> RefreshToken:
        return await self._repo.create_token(
            user_id=user_id, token_hash=token_hash, expires_at=expires_at,
            user_agent=user_agent, ip_address=ip_address
        )

    async def get_active_token(self, token_hash: str) -> Optional[RefreshToken]:
        return await self._repo.get_active_token(token_hash)

    async def revoke_token(self, token_id: str) -> None:
        return await self._repo.revoke_token(token_id)

    async def revoke_by_hash(self, token_hash: str) -> None:
        return await self._repo.revoke_by_hash(token_hash)

    async def revoke_user_tokens(self, user_id: str) -> None:
        return await self._repo.revoke_user_tokens(user_id)


class _SupabaseRefreshTokenRepository:
    """PostgreSQL implementation."""

    def _get_pool(self):
        from database import pool
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    async def create_token(self, *, user_id: str, token_hash: str, expires_at: datetime,
                          user_agent: Optional[str], ip_address: Optional[str]) -> RefreshToken:
        pool = self._get_pool()
        now = datetime.utcnow()
        token_id = str(uuid.uuid4())
        
        async with pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, ip_address, created_at, expires_at, revoked, revoked_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ''', token_id, user_id, token_hash, (user_agent or "")[:200], ip_address, now, expires_at, False, None)
        
        return RefreshToken(id=token_id, user_id=user_id, token_hash=token_hash,
                           user_agent=(user_agent or "")[:200], ip_address=ip_address,
                           created_at=now, expires_at=expires_at, revoked=False, revoked_at=None)

    async def get_active_token(self, token_hash: str) -> Optional[RefreshToken]:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow('''
                SELECT * FROM refresh_tokens 
                WHERE token_hash = $1 AND revoked = false AND expires_at > $2
            ''', token_hash, datetime.utcnow())
        if row:
            data = dict(row)
            data['id'] = str(data['id'])
            data['user_id'] = str(data['user_id'])
            return RefreshToken(**data)
        return None

    async def revoke_token(self, token_id: str) -> None:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute('''
                UPDATE refresh_tokens SET revoked = true, revoked_at = $2 WHERE id = $1
            ''', token_id, datetime.utcnow())

    async def revoke_by_hash(self, token_hash: str) -> None:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute('''
                UPDATE refresh_tokens SET revoked = true, revoked_at = $2 
                WHERE token_hash = $1 AND revoked = false
            ''', token_hash, datetime.utcnow())

    async def revoke_user_tokens(self, user_id: str) -> None:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute('''
                UPDATE refresh_tokens SET revoked = true, revoked_at = $2 
                WHERE user_id = $1 AND revoked = false
            ''', user_id, datetime.utcnow())


class _MongoRefreshTokenRepository:
    """MongoDB implementation."""

    def __init__(self) -> None:
        self.collection_name = "refresh_tokens"

    async def create_token(self, *, user_id: str, token_hash: str, expires_at: datetime,
                          user_agent: Optional[str], ip_address: Optional[str]) -> RefreshToken:
        db = get_db()
        now = datetime.utcnow()
        doc = {
            "_id": f"refresh_{str(now.timestamp()).replace('.', '')}",
            "user_id": user_id,
            "token_hash": token_hash,
            "user_agent": (user_agent or "")[:200],
            "ip_address": ip_address,
            "created_at": now,
            "expires_at": expires_at,
            "revoked": False,
            "revoked_at": None,
        }
        await db[self.collection_name].insert_one(doc)
        return RefreshToken(**doc)

    async def get_active_token(self, token_hash: str) -> Optional[RefreshToken]:
        db = get_db()
        doc = await db[self.collection_name].find_one({
            "token_hash": token_hash,
            "revoked": False,
            "expires_at": {"$gt": datetime.utcnow()},
        })
        if doc:
            return RefreshToken(**doc)
        return None

    async def revoke_token(self, token_id: str) -> None:
        db = get_db()
        await db[self.collection_name].update_one(
            {"_id": token_id},
            {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}},
        )

    async def revoke_by_hash(self, token_hash: str) -> None:
        db = get_db()
        await db[self.collection_name].update_many(
            {"token_hash": token_hash, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}},
        )

    async def revoke_user_tokens(self, user_id: str) -> None:
        db = get_db()
        await db[self.collection_name].update_many(
            {"user_id": user_id, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": datetime.utcnow()}},
        )
