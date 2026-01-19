"""Workspace invite repository."""

from typing import List, Optional
from datetime import datetime
import secrets
import uuid

from config import settings
from database import get_db
from models.invite import WorkspaceInvite


def _get_repository():
    if settings.use_supabase:
        return _SupabaseWorkspaceInviteRepository()
    return _MongoWorkspaceInviteRepository()


class WorkspaceInviteRepository:
    """Manage workspace invite persistence - delegates to appropriate backend."""

    def __init__(self):
        self._repo = _get_repository()

    async def create_invite(self, organization: str, email: str, role: str, invited_by: str, message: Optional[str] = None) -> WorkspaceInvite:
        return await self._repo.create_invite(organization, email, role, invited_by, message)

    async def list_org_invites(self, organization: str) -> List[WorkspaceInvite]:
        return await self._repo.list_org_invites(organization)

    async def find_pending_for_email(self, email: str) -> Optional[WorkspaceInvite]:
        return await self._repo.find_pending_for_email(email)

    async def mark_accepted(self, invite_id: str, user_id: str) -> None:
        return await self._repo.mark_accepted(invite_id, user_id)

    async def revoke_invite(self, invite_id: str, organization: str) -> bool:
        return await self._repo.revoke_invite(invite_id, organization)


class _SupabaseWorkspaceInviteRepository:
    """Supabase PostgreSQL implementation."""
    
    def _get_pool(self):
        from database_supabase import pool
        if pool is None:
            raise Exception("Supabase database pool not initialized.")
        return pool

    async def create_invite(self, organization: str, email: str, role: str, invited_by: str, message: Optional[str] = None) -> WorkspaceInvite:
        pool = self._get_pool()
        token = secrets.token_urlsafe(24)
        invite_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        async with pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO workspace_invites (id, organization, email, role, status, invited_by, message, token, created_at, accepted_at, accepted_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ''', invite_id, organization, email.lower(), role, "pending", invited_by, message, token, now, None, None)
        
        return WorkspaceInvite(id=invite_id, organization=organization, email=email.lower(), role=role,
                              status="pending", invited_by=invited_by, message=message, token=token,
                              created_at=now, accepted_at=None, accepted_by=None)

    async def list_org_invites(self, organization: str) -> List[WorkspaceInvite]:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM workspace_invites WHERE organization = $1 ORDER BY created_at DESC', organization)
        invites = []
        for row in rows:
            data = dict(row)
            data['id'] = str(data['id'])
            data['invited_by'] = str(data['invited_by'])
            if data.get('accepted_by'):
                data['accepted_by'] = str(data['accepted_by'])
            invites.append(WorkspaceInvite(**data))
        return invites

    async def find_pending_for_email(self, email: str) -> Optional[WorkspaceInvite]:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM workspace_invites WHERE email = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1', email.lower(), "pending")
        if row:
            data = dict(row)
            data['id'] = str(data['id'])
            data['invited_by'] = str(data['invited_by'])
            if data.get('accepted_by'):
                data['accepted_by'] = str(data['accepted_by'])
            return WorkspaceInvite(**data)
        return None

    async def mark_accepted(self, invite_id: str, user_id: str) -> None:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute('UPDATE workspace_invites SET status = $2, accepted_at = $3, accepted_by = $4 WHERE id = $1',
                              invite_id, "accepted", datetime.utcnow(), user_id)

    async def revoke_invite(self, invite_id: str, organization: str) -> bool:
        pool = self._get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute('DELETE FROM workspace_invites WHERE id = $1 AND organization = $2', invite_id, organization)
        return "DELETE 1" in result


class _MongoWorkspaceInviteRepository:
    """MongoDB implementation."""

    def __init__(self):
        self.collection_name = "workspace_invites"

    async def create_invite(
        self,
        organization: str,
        email: str,
        role: str,
        invited_by: str,
        message: Optional[str] = None,
    ) -> WorkspaceInvite:
        """Create and store a new invite."""
        db = get_db()
        token = secrets.token_urlsafe(24)
        doc = {
            "_id": f"invite_{str(datetime.utcnow().timestamp()).replace('.', '')}",
            "organization": organization,
            "email": email.lower(),
            "role": role,
            "status": "pending",
            "invited_by": invited_by,
            "message": message,
            "token": token,
            "created_at": datetime.utcnow(),
            "accepted_at": None,
            "accepted_by": None,
        }
        await db[self.collection_name].insert_one(doc)
        return WorkspaceInvite(**doc)

    async def list_org_invites(self, organization: str) -> List[WorkspaceInvite]:
        """List workspace invites for an organization."""
        db = get_db()
        invites: List[WorkspaceInvite] = []
        cursor = db[self.collection_name].find({"organization": organization}).sort("created_at", -1)
        async for doc in cursor:
            invites.append(WorkspaceInvite(**doc))
        return invites

    async def find_pending_for_email(self, email: str) -> Optional[WorkspaceInvite]:
        """Return the newest pending invite for an email."""
        db = get_db()
        doc = await db[self.collection_name].find_one(
            {"email": email.lower(), "status": "pending"},
            sort=[("created_at", -1)],
        )
        if doc:
            return WorkspaceInvite(**doc)
        return None

    async def mark_accepted(self, invite_id: str, user_id: str) -> None:
        """Mark invite as accepted."""
        db = get_db()
        await db[self.collection_name].update_one(
            {"_id": invite_id},
            {
                "$set": {
                    "status": "accepted",
                    "accepted_at": datetime.utcnow(),
                    "accepted_by": user_id,
                }
            },
        )

    async def revoke_invite(self, invite_id: str, organization: str) -> bool:
        """Delete/revoke an invite."""
        db = get_db()
        result = await db[self.collection_name].delete_one({"_id": invite_id, "organization": organization})
        return result.deleted_count > 0
