"""Project service."""

import asyncio
import logging
from typing import List
from fastapi import HTTPException, status

from models.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    default_phase_status,
)
from models.user import User
from repositories.project_repository import ProjectRepository
from services.phase_flow_service import PhaseFlowService, PHASE_ORDER


logger = logging.getLogger(__name__)


class ProjectService:
    """Service for project business logic."""
    
    def __init__(self):
        self.project_repo = ProjectRepository()
        self.phase_flow_service = PhaseFlowService()

    async def create_project(self, project_data: ProjectCreate, current_user: User) -> ProjectResponse:
        """Create a new project."""
        project = await self.project_repo.create(
            project_data,
            current_user.id,
            current_user.organization,
        )

        response = ProjectResponse(
            id=project.id,
            project_id=project.id,
            name=project.name,
            description=project.description,
            template_type=project.template_type,
            status=project.status,
            owner_id=project.owner_id,
            organization=project.organization,
            feature_tier=project.feature_tier,
            phase_status=project.phase_status,
            brief_text=project.brief_text,
            roadmap=project.roadmap,
            roadmap_summary=project.roadmap_summary,
            feasibility_studies=project.feasibility_studies,
            feasibility_sections=getattr(project, "feasibility_sections", None),
            development_stack=getattr(project, "development_stack", None),
            development_notes=getattr(project, "development_notes", None),
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

        # Kick off background phase sync if we have enough context
        self._schedule_phase_sync(project, current_user)

        return response

    def _schedule_phase_sync(self, project: Project, current_user: User) -> None:
        """Kick off background auto-sync when project description is provided."""
        if not project or not (project.description or project.brief_text):
            return

        normalized = default_phase_status()
        existing = default_phase_status()
        if project.phase_status:
            existing.update(project.phase_status)
        # Only auto-run if phases are still at default state (planning ready, others locked)
        if existing != normalized:
            return

        async def runner():
            context_snippet = (project.description or "").strip()
            if project.brief_text:
                context_snippet += f"\nBrief: {project.brief_text.strip()}"
            for phase in PHASE_ORDER:
                prompt = (
                    "Auto-sync this phase using the latest project description. "
                    "Reference the prior phase output and ensure continuity.\n\n"
                    f"Project: {project.name}\n"
                    f"Phase: {phase}\n"
                    f"Context:\n{context_snippet}"
                )
                try:
                    await self.phase_flow_service.generate_phase(
                        project.id,
                        current_user.organization,
                        phase,
                        prompt,
                    )
                except PermissionError:
                    break
                except Exception as exc:  # pragma: no cover
                    logger.warning("Auto phase sync failed for %s (%s phase): %s", project.id, phase, exc)
                    break

        try:
            asyncio.create_task(runner())
        except RuntimeError as exc:  # pragma: no cover
            logger.warning("Unable to schedule auto phase sync: %s", exc)
    
    async def get_project(self, project_id: str, current_user: User) -> ProjectResponse:
        """Get a project by ID."""
        project = await self.project_repo.get_by_id(project_id, current_user.organization)

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        return ProjectResponse(
            id=project.id,
            project_id=project.id,
            name=project.name,
            description=project.description,
            template_type=project.template_type,
            status=project.status,
            owner_id=project.owner_id,
            organization=project.organization,
            feature_tier=project.feature_tier,
            phase_status=project.phase_status,
            brief_text=project.brief_text,
            roadmap=project.roadmap,
            roadmap_summary=project.roadmap_summary,
            feasibility_studies=project.feasibility_studies,
            feasibility_sections=getattr(project, "feasibility_sections", None),
            development_stack=getattr(project, "development_stack", None),
            development_notes=getattr(project, "development_notes", None),
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    async def list_projects(self, current_user: User) -> List[ProjectResponse]:
        """List all projects for user's organization."""
        projects = await self.project_repo.list_by_organization(
            current_user.organization,
            current_user.id,
        )

        return [
            ProjectResponse(
                id=p.id,
                project_id=p.id,
                name=p.name,
                description=p.description,
                template_type=p.template_type,
                status=p.status,
                owner_id=p.owner_id,
                organization=p.organization,
                feature_tier=p.feature_tier,
                phase_status=p.phase_status,
                brief_text=p.brief_text,
                roadmap=p.roadmap,
                roadmap_summary=p.roadmap_summary,
                feasibility_studies=p.feasibility_studies,
                feasibility_sections=getattr(p, "feasibility_sections", None),
                development_stack=getattr(p, "development_stack", None),
                development_notes=getattr(p, "development_notes", None),
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in projects
        ]
    
    async def update_project(
        self,
        project_id: str,
        update_data: ProjectUpdate,
        current_user: User,
    ) -> ProjectResponse:
        """Update a project."""
        project = await self.project_repo.update(
            project_id,
            current_user.organization,
            update_data,
        )

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        response = ProjectResponse(
            id=project.id,
            project_id=project.id,
            name=project.name,
            description=project.description,
            template_type=project.template_type,
            status=project.status,
            owner_id=project.owner_id,
            organization=project.organization,
            feature_tier=project.feature_tier,
            phase_status=project.phase_status,
            brief_text=project.brief_text,
            roadmap=project.roadmap,
            roadmap_summary=project.roadmap_summary,
            feasibility_studies=project.feasibility_studies,
            feasibility_sections=getattr(project, "feasibility_sections", None),
            development_stack=getattr(project, "development_stack", None),
            development_notes=getattr(project, "development_notes", None),
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

        if update_data.description is not None or update_data.brief_text is not None:
            self._schedule_phase_sync(project, current_user)

        return response

    async def delete_project(self, project_id: str, current_user: User) -> dict:
        """Delete a project."""
        deleted = await self.project_repo.delete(project_id, current_user.organization)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        return {"message": "Project deleted successfully"}
