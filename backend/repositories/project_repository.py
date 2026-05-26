"""Project repository."""

import json
import uuid
from typing import List, Optional, Dict, Any
from database import get_db
from models.project import Project, ProjectCreate, ProjectUpdate
from datetime import datetime


def _get_repository():
    """Get the appropriate repository based on pool availability."""
    try:
        from database import pool
        if pool is not None:
            return _SupabaseProjectRepository()
    except ImportError:
        pass
    return _MongoProjectRepository()


class ProjectRepository:
    """Repository for project data access - delegates to appropriate backend."""
    
    def __init__(self):
        self._cached_repo = None
    
    @property
    def _repo(self):
        """Lazy repository getter - checks pool availability at call time."""
        if self._cached_repo is None:
            self._cached_repo = _get_repository()
        return self._cached_repo
    
    async def create(self, project_data: ProjectCreate, user_id: str, organization: str, owner_member: Optional[Dict[str, Any]] = None) -> Project:
        return await self._repo.create(project_data, user_id, organization, owner_member)
    
    async def get_by_id(self, project_id: str, organization: str) -> Optional[Project]:
        return await self._repo.get_by_id(project_id, organization)
    
    async def list_by_organization(self, organization: str, user_id: str) -> List[Project]:
        return await self._repo.list_by_organization(organization, user_id)
    
    async def update(self, project_id: str, organization: str, update_data: ProjectUpdate) -> Optional[Project]:
        return await self._repo.update(project_id, organization, update_data)
    
    async def delete(self, project_id: str, organization: str) -> bool:
        return await self._repo.delete(project_id, organization)
    
    async def update_phase_status(self, project_id: str, organization: str, phase_status: Dict[str, str]) -> Optional[Project]:
        return await self._repo.update_phase_status(project_id, organization, phase_status)

    async def update_phase_completion(
        self,
        project_id: str,
        organization: str,
        phase_status: Dict[str, str],
        phase_completion_meta: Dict[str, Any],
    ) -> Optional[Project]:
        return await self._repo.update_phase_completion(project_id, organization, phase_status, phase_completion_meta)

    async def set_team_members(self, project_id: str, organization: str, members: List[Dict[str, Any]]) -> Optional[Project]:
        return await self._repo.set_team_members(project_id, organization, members)


class _SupabaseProjectRepository:
    """PostgreSQL implementation."""

    def _get_pool(self):
        from database import pool
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool
    
    async def create(self, project_data: ProjectCreate, user_id: str, organization: str, owner_member: Optional[Dict[str, Any]] = None) -> Project:
        """Create a new project."""
        pool = self._get_pool()
        
        project_id = f"proj_{str(uuid.uuid4()).replace('-', '')[:16]}"
        now = datetime.utcnow()
        
        team_members = []
        provided_team = getattr(project_data, "team_members", None) or []
        
        # Normalize any datetime objects in provided team data
        normalized_provided = []
        for member in provided_team:
            normalized_member = dict(member)
            if 'assigned_at' in normalized_member and isinstance(normalized_member['assigned_at'], datetime):
                normalized_member['assigned_at'] = normalized_member['assigned_at'].isoformat()
            normalized_provided.append(normalized_member)
        
        if owner_member:
            existing = [m for m in normalized_provided if m.get("user_id") != owner_member.get("user_id")]
            team_members = [owner_member, *existing]
        else:
            team_members = normalized_provided
        
        async with pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO projects (
                    id, name, description, template_type, brief_text, questionnaire_data,
                    owner_id, organization, status, feature_tier, phase_status,
                    roadmap, roadmap_summary, feasibility_studies, feasibility_sections,
                    parent_project_id, scenario_label, scenario_metadata, ui_preferences,
                    team_members, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                )
            ''',
                project_id,
                project_data.name,
                project_data.description,
                project_data.template_type,
                project_data.brief_text,
                json.dumps(project_data.questionnaire_data or {}),
                user_id,
                organization,
                "draft",
                project_data.feature_tier or "pro",
                json.dumps(project_data.phase_status or {}),
                json.dumps(getattr(project_data, 'roadmap', None)),
                json.dumps(getattr(project_data, 'roadmap_summary', None)),
                json.dumps(getattr(project_data, 'feasibility_studies', None)),
                json.dumps(getattr(project_data, 'feasibility_sections', None)),
                getattr(project_data, "parent_project_id", None),
                getattr(project_data, "scenario_label", None),
                json.dumps(getattr(project_data, "scenario_metadata", None)),
                json.dumps(getattr(project_data, "ui_preferences", None)),
                json.dumps(team_members),
                now,
                now
            )
        
        return Project(
            id=project_id,
            name=project_data.name,
            description=project_data.description,
            template_type=project_data.template_type,
            brief_text=project_data.brief_text,
            questionnaire_data=project_data.questionnaire_data or {},
            owner_id=user_id,
            organization=organization,
            status="draft",
            feature_tier=project_data.feature_tier or "pro",
            phase_status=project_data.phase_status or {},
            roadmap=getattr(project_data, 'roadmap', None),
            roadmap_summary=getattr(project_data, 'roadmap_summary', None),
            feasibility_studies=getattr(project_data, 'feasibility_studies', None),
            feasibility_sections=getattr(project_data, 'feasibility_sections', None),
            parent_project_id=getattr(project_data, "parent_project_id", None),
            scenario_label=getattr(project_data, "scenario_label", None),
            scenario_metadata=getattr(project_data, "scenario_metadata", None),
            ui_preferences=getattr(project_data, "ui_preferences", None),
            team_members=team_members,
            created_at=now,
            updated_at=now
        )
    
    def _row_to_project(self, row) -> Project:
        """Convert database row to Project model."""
        data = dict(row)
        # Parse JSON fields
        for field in ['questionnaire_data', 'phase_status', 'phase_completion_meta', 'roadmap', 'roadmap_summary', 
                       'feasibility_studies', 'feasibility_sections', 'scenario_metadata', 
                       'ui_preferences', 'team_members', 'development_stack', 'development_notes']:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = json.loads(data[field]) if data[field] else None
                except:
                    data[field] = None
        return Project(**data)
    
    async def get_by_id(self, project_id: str, organization: str) -> Optional[Project]:
        """Get project by ID."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                'SELECT * FROM projects WHERE id = $1 AND organization = $2',
                project_id, organization
            )
        if row:
            return self._row_to_project(row)
        return None
    
    async def list_by_organization(self, organization: str, user_id: str) -> List[Project]:
        """List all projects for an organization."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM projects WHERE organization = $1 ORDER BY created_at DESC',
                organization
            )
        return [self._row_to_project(row) for row in rows]
    
    async def update(self, project_id: str, organization: str, update_data: ProjectUpdate) -> Optional[Project]:
        """Update a project."""
        pool = self._get_pool()
        
        updates = {"updated_at": datetime.utcnow()}
        if update_data.name is not None:
            updates["name"] = update_data.name
        if update_data.description is not None:
            updates["description"] = update_data.description
        if update_data.status is not None:
            updates["status"] = update_data.status
        if update_data.brief_text is not None:
            updates["brief_text"] = update_data.brief_text
        if update_data.questionnaire_data is not None:
            updates["questionnaire_data"] = json.dumps(update_data.questionnaire_data)
        if update_data.feature_tier is not None:
            updates["feature_tier"] = update_data.feature_tier
        if getattr(update_data, 'roadmap', None) is not None:
            updates["roadmap"] = json.dumps(update_data.roadmap)
        if getattr(update_data, 'roadmap_summary', None) is not None:
            updates["roadmap_summary"] = json.dumps(update_data.roadmap_summary)
        if getattr(update_data, 'feasibility_studies', None) is not None:
            updates["feasibility_studies"] = json.dumps(update_data.feasibility_studies)
        if getattr(update_data, 'feasibility_sections', None) is not None:
            updates["feasibility_sections"] = json.dumps(update_data.feasibility_sections)
        if getattr(update_data, 'development_stack', None) is not None:
            updates["development_stack"] = json.dumps(update_data.development_stack)
        if getattr(update_data, 'development_notes', None) is not None:
            updates["development_notes"] = json.dumps(update_data.development_notes)
        if getattr(update_data, "parent_project_id", None) is not None:
            updates["parent_project_id"] = update_data.parent_project_id
        if getattr(update_data, "scenario_label", None) is not None:
            updates["scenario_label"] = update_data.scenario_label
        if getattr(update_data, "scenario_metadata", None) is not None:
            updates["scenario_metadata"] = json.dumps(update_data.scenario_metadata)
        if getattr(update_data, "ui_preferences", None) is not None:
            updates["ui_preferences"] = json.dumps(update_data.ui_preferences)
        
        set_clause = ", ".join([f"{k} = ${i+3}" for i, k in enumerate(updates.keys())])
        query = f"UPDATE projects SET {set_clause} WHERE id = $1 AND organization = $2 RETURNING *"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, project_id, organization, *updates.values())
        
        if row:
            return self._row_to_project(row)
        return None
    
    async def delete(self, project_id: str, organization: str) -> bool:
        """Delete a project."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute(
                'DELETE FROM projects WHERE id = $1 AND organization = $2',
                project_id, organization
            )
        return result == "DELETE 1"
    
    async def update_phase_status(self, project_id: str, organization: str, phase_status: Dict[str, str]) -> Optional[Project]:
        """Update the phase status progression for a project."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                'UPDATE projects SET phase_status = $3, updated_at = $4 WHERE id = $1 AND organization = $2 RETURNING *',
                project_id, organization, json.dumps(phase_status), datetime.utcnow()
            )
        if row:
            return self._row_to_project(row)
        return None

    async def update_phase_completion(
        self,
        project_id: str,
        organization: str,
        phase_status: Dict[str, str],
        phase_completion_meta: Dict[str, Any],
    ) -> Optional[Project]:
        """Update phase status and completion metadata together."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                'UPDATE projects SET phase_status = $3, phase_completion_meta = $4, updated_at = $5 '
                'WHERE id = $1 AND organization = $2 RETURNING *',
                project_id,
                organization,
                json.dumps(phase_status),
                json.dumps(phase_completion_meta or dict()),
                datetime.utcnow(),
            )
        if row:
            return self._row_to_project(row)
        return None

    async def set_team_members(self, project_id: str, organization: str, members: List[Dict[str, Any]]) -> Optional[Project]:
        """Replace the team member list for a project."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                'UPDATE projects SET team_members = $3, updated_at = $4 WHERE id = $1 AND organization = $2 RETURNING *',
                project_id, organization, json.dumps(members), datetime.utcnow()
            )
        if row:
            return self._row_to_project(row)
        return None


class _MongoProjectRepository:
    """MongoDB implementation."""
    
    def __init__(self):
        self.collection_name = "projects"
    
    async def create(self, project_data: ProjectCreate, user_id: str, organization: str, owner_member: Optional[Dict[str, Any]] = None) -> Project:
        """Create a new project."""
        db = get_db()
        
        project_doc = {
            "_id": f"proj_{str(datetime.utcnow().timestamp()).replace('.', '')}",
            "name": project_data.name,
            "description": project_data.description,
            "template_type": project_data.template_type,
            "brief_text": project_data.brief_text,
            "questionnaire_data": project_data.questionnaire_data or {},
            "owner_id": user_id,
            "organization": organization,
            "status": "draft",
            "feature_tier": project_data.feature_tier or "pro",
            "phase_status": project_data.phase_status,
            "roadmap": project_data.__dict__.get('roadmap') if hasattr(project_data, 'roadmap') else None,
            "roadmap_summary": project_data.__dict__.get('roadmap_summary') if hasattr(project_data, 'roadmap_summary') else None,
            "feasibility_studies": project_data.__dict__.get('feasibility_studies') if hasattr(project_data, 'feasibility_studies') else None,
            "feasibility_sections": project_data.__dict__.get('feasibility_sections') if hasattr(project_data, 'feasibility_sections') else None,
            "parent_project_id": getattr(project_data, "parent_project_id", None),
            "scenario_label": getattr(project_data, "scenario_label", None),
            "scenario_metadata": getattr(project_data, "scenario_metadata", None),
            "ui_preferences": getattr(project_data, "ui_preferences", None),
            "team_members": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        provided_team = getattr(project_data, "team_members", None) or []
        if owner_member:
            existing = [m for m in provided_team if m.get("user_id") != owner_member.get("user_id")]
            project_doc["team_members"] = [owner_member, *existing]
        else:
            project_doc["team_members"] = provided_team
        
        await db[self.collection_name].insert_one(project_doc)
        return Project(**project_doc)
    
    async def get_by_id(self, project_id: str, organization: str) -> Optional[Project]:
        """Get project by ID."""
        db = get_db()
        project_doc = await db[self.collection_name].find_one({
            "_id": project_id,
            "organization": organization
        })
        if project_doc:
            return Project(**project_doc)
        return None
    
    async def list_by_organization(self, organization: str, user_id: str) -> List[Project]:
        """List all projects for an organization."""
        db = get_db()
        cursor = db[self.collection_name].find({
            "organization": organization
        }).sort("created_at", -1)
        
        projects = []
        async for doc in cursor:
            projects.append(Project(**doc))
        return projects
    
    async def update(self, project_id: str, organization: str, update_data: ProjectUpdate) -> Optional[Project]:
        """Update a project."""
        db = get_db()
        
        update_doc = {"updated_at": datetime.utcnow()}
        if update_data.name is not None:
            update_doc["name"] = update_data.name
        if update_data.description is not None:
            update_doc["description"] = update_data.description
        if update_data.status is not None:
            update_doc["status"] = update_data.status
        if update_data.brief_text is not None:
            update_doc["brief_text"] = update_data.brief_text
        if update_data.questionnaire_data is not None:
            update_doc["questionnaire_data"] = update_data.questionnaire_data
        if update_data.feature_tier is not None:
            update_doc["feature_tier"] = update_data.feature_tier
        if getattr(update_data, 'roadmap', None) is not None:
            update_doc["roadmap"] = update_data.roadmap
        if getattr(update_data, 'roadmap_summary', None) is not None:
            update_doc["roadmap_summary"] = update_data.roadmap_summary
        if getattr(update_data, 'feasibility_studies', None) is not None:
            update_doc["feasibility_studies"] = update_data.feasibility_studies
        if getattr(update_data, 'feasibility_sections', None) is not None:
            update_doc["feasibility_sections"] = update_data.feasibility_sections
        if getattr(update_data, 'development_stack', None) is not None:
            update_doc["development_stack"] = update_data.development_stack
        if getattr(update_data, 'development_notes', None) is not None:
            update_doc["development_notes"] = update_data.development_notes
        if getattr(update_data, "parent_project_id", None) is not None:
            update_doc["parent_project_id"] = update_data.parent_project_id
        if getattr(update_data, "scenario_label", None) is not None:
            update_doc["scenario_label"] = update_data.scenario_label
        if getattr(update_data, "scenario_metadata", None) is not None:
            update_doc["scenario_metadata"] = update_data.scenario_metadata
        if getattr(update_data, "ui_preferences", None) is not None:
            update_doc["ui_preferences"] = update_data.ui_preferences
        
        result = await db[self.collection_name].find_one_and_update(
            {"_id": project_id, "organization": organization},
            {"$set": update_doc},
            return_document=True
        )
        
        if result:
            return Project(**result)
        return None
    
    async def delete(self, project_id: str, organization: str) -> bool:
        """Delete a project."""
        db = get_db()
        result = await db[self.collection_name].delete_one({
            "_id": project_id,
            "organization": organization
        })
        return result.deleted_count > 0
    
    async def update_phase_status(self, project_id: str, organization: str, phase_status: Dict[str, str]) -> Optional[Project]:
        """Update the phase status progression for a project."""
        db = get_db()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": project_id, "organization": organization},
            {"$set": {"phase_status": phase_status, "updated_at": datetime.utcnow()}},
            return_document=True
        )
        if result:
            return Project(**result)
        return None

    async def update_phase_completion(
        self,
        project_id: str,
        organization: str,
        phase_status: Dict[str, str],
        phase_completion_meta: Dict[str, Any],
    ) -> Optional[Project]:
        """Update phase status and completion metadata together."""
        db = get_db()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": project_id, "organization": organization},
            {"$set": {
                "phase_status": phase_status,
                "phase_completion_meta": phase_completion_meta or {},
                "updated_at": datetime.utcnow(),
            }},
            return_document=True,
        )
        if result:
            return Project(**result)
        return None
    
    async def set_team_members(self, project_id: str, organization: str, members: List[Dict[str, Any]]) -> Optional[Project]:
        """Replace the team member list for a project."""
        db = get_db()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": project_id, "organization": organization},
            {
                "$set": {
                    "team_members": members,
                    "updated_at": datetime.utcnow(),
                }
            },
            return_document=True,
        )
        if result:
            return Project(**result)
        return None
