"""Project service."""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status

from models.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ScenarioBranchRequest,
    ScenarioDiffResponse,
    ScenarioSnapshot,
    GuidedWorkspaceRequest,
    GuidedWorkspaceResponse,
    default_phase_status,
)
from models.user import User, resolve_role, MIN_PROJECT_ADMIN_AUTHORITY
from repositories.project_repository import ProjectRepository
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from repositories.artifact_repository import ArtifactRepository
from repositories.ai_run_repository import AiRunRepository
from repositories.user_repository import UserRepository
from services.phase_flow_service import PhaseFlowService, PHASE_ORDER


logger = logging.getLogger(__name__)


class ProjectService:
    """Service for project business logic."""
    
    def __init__(self):
        self.project_repo = ProjectRepository()
        self.phase_flow_service = PhaseFlowService()
        self.requirement_repo = RequirementRepository()
        self.task_repo = TaskRepository()
        self.artifact_repo = ArtifactRepository()
        self.ai_run_repo = AiRunRepository()
        self.user_repo = UserRepository()

    def _normalize_team_members(self, members: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        for member in members or []:
            entry = dict(member)
            assigned = entry.get("assigned_at")
            if isinstance(assigned, datetime):
                entry["assigned_at"] = assigned.isoformat()
            normalized.append(entry)
        return normalized

    def _has_team_admin_rights(self, user: User) -> bool:
        _, meta = resolve_role(user.role)
        return int(meta.get("authority", 1)) >= MIN_PROJECT_ADMIN_AUTHORITY

    def _build_member_entry(
        self,
        user: User,
        project_role: Optional[str],
        assigned_by: Optional[str],
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        role_key, meta = resolve_role(project_role or user.role)
        return {
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "project_role": role_key,
            "role_label": meta.get("label"),
            "authority": int(meta.get("authority", 1)),
            "assigned_by": assigned_by,
            "assigned_at": datetime.utcnow().isoformat(),
            "status": "active",
            "notes": notes,
        }

    def _build_response(self, project: Project) -> ProjectResponse:
        """Convert persistence model to API response."""
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
            parent_project_id=getattr(project, "parent_project_id", None),
            scenario_label=getattr(project, "scenario_label", None),
            scenario_metadata=getattr(project, "scenario_metadata", None),
            ui_preferences=getattr(project, "ui_preferences", None),
            team_members=self._normalize_team_members(getattr(project, "team_members", [])),
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    async def create_project(self, project_data: ProjectCreate, current_user: User) -> ProjectResponse:
        """Create a new project."""
        owner_member = self._build_member_entry(current_user, current_user.role, current_user.id)
        owner_member["status"] = "owner"

        project = await self.project_repo.create(
            project_data,
            current_user.id,
            current_user.organization,
            owner_member=owner_member,
        )

        response = self._build_response(project)

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
                        current_user.id,
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

        return self._build_response(project)

    async def list_projects(
        self,
        current_user: User,
        include_archived: bool = False,
        only_archived: bool = False,
    ) -> List[ProjectResponse]:
        """List projects for user's organization. By default excludes archived."""
        projects = await self.project_repo.list_by_organization(
            current_user.organization,
            current_user.id,
        )

        if only_archived:
            projects = [p for p in projects if p.status == "archived"]
        elif not include_archived:
            projects = [p for p in projects if p.status != "archived"]

        return [self._build_response(p) for p in projects]

    async def archive_project(self, project_id: str, current_user: User) -> ProjectResponse:
        """Soft-delete: set project status to archived."""
        project = await self.project_repo.update(
            project_id,
            current_user.organization,
            ProjectUpdate(status="archived"),
        )
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return self._build_response(project)

    async def restore_project(self, project_id: str, current_user: User) -> ProjectResponse:
        """Restore an archived project to active status."""
        project = await self.project_repo.update(
            project_id,
            current_user.organization,
            ProjectUpdate(status="active"),
        )
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return self._build_response(project)
    
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

        response = self._build_response(project)

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

    async def add_team_member(
        self,
        project_id: str,
        payload: Dict[str, Any],
        current_user: User,
    ) -> ProjectResponse:
        """Add or update a project team member."""
        if not self._has_team_admin_rights(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You need Program Manager access or higher to manage the team.",
            )

        project = await self.project_repo.get_by_id(project_id, current_user.organization)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        target = await self.user_repo.get_by_email(payload["email"])
        if not target or target.organization != current_user.organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in your organization",
            )

        if target.id == project.owner_id and target.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project owners are already part of the team.",
            )

        members = list(getattr(project, "team_members", []) or [])
        new_entry = self._build_member_entry(
            target,
            payload.get("project_role"),
            assigned_by=current_user.id,
            notes=payload.get("notes"),
        )

        existing_idx = next(
            (idx for idx, member in enumerate(members) if member.get("user_id") == target.id),
            None,
        )
        if existing_idx is not None:
            preserved_assigned_at = members[existing_idx].get("assigned_at", new_entry["assigned_at"])
            new_entry["assigned_at"] = preserved_assigned_at
            members[existing_idx] = new_entry
        else:
            members.append(new_entry)

        updated = await self.project_repo.set_team_members(project_id, current_user.organization, members)
        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to update team.")
        return self._build_response(updated)

    async def remove_team_member(
        self,
        project_id: str,
        member_id: str,
        current_user: User,
    ) -> ProjectResponse:
        """Remove a project team member."""
        project = await self.project_repo.get_by_id(project_id, current_user.organization)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        if member_id == project.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the project owner.",
            )

        can_manage = self._has_team_admin_rights(current_user)
        if not can_manage and current_user.id != member_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this team.",
            )

        members = [m for m in getattr(project, "team_members", []) if m.get("user_id") != member_id]
        if len(members) == len(getattr(project, "team_members", [])):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

        updated = await self.project_repo.set_team_members(project_id, current_user.organization, members)
        if not updated:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to update team.")
        return self._build_response(updated)

    async def create_scenario_branch(
        self,
        project_id: str,
        payload: ScenarioBranchRequest,
        current_user: User,
    ) -> ProjectResponse:
        """Clone a project into a scenario branch."""
        base_project = await self.project_repo.get_by_id(project_id, current_user.organization)
        if not base_project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        branch_data = ProjectCreate(
            name=f"{base_project.name} · {payload.label}",
            description=payload.description or base_project.description,
            template_type=base_project.template_type,
            brief_text=base_project.brief_text,
            questionnaire_data=base_project.questionnaire_data,
            feature_tier=base_project.feature_tier,
            phase_status=base_project.phase_status,
            roadmap=base_project.roadmap,
            roadmap_summary=base_project.roadmap_summary,
            feasibility_studies=base_project.feasibility_studies,
            feasibility_sections=getattr(base_project, "feasibility_sections", None),
            development_stack=getattr(base_project, "development_stack", None),
            development_notes=getattr(base_project, "development_notes", None),
            parent_project_id=base_project.id,
            scenario_label=payload.label,
            scenario_metadata=payload.overrides or {},
        )
        branch_owner = self._build_member_entry(current_user, current_user.role, current_user.id)
        branch_owner["status"] = "owner"
        branch_project = await self.project_repo.create(
            branch_data,
            current_user.id,
            current_user.organization,
            owner_member=branch_owner,
        )

        clone_jobs = []
        if payload.include_requirements:
            clone_jobs.append(
                self.requirement_repo.clone_project_requirements(project_id, branch_project.id)
            )
        if payload.include_tasks:
            clone_jobs.append(
                self.task_repo.clone_project_tasks(project_id, branch_project.id)
            )
        if payload.include_artifacts:
            clone_jobs.append(
                self.artifact_repo.clone_project_artifacts(project_id, branch_project.id)
            )
        if clone_jobs:
            await asyncio.gather(*clone_jobs)

        return self._build_response(branch_project)

    async def list_scenario_branches(
        self, project_id: str, current_user: User
    ) -> List[ProjectResponse]:
        """Return all branches derived from a project."""
        base_project = await self.project_repo.get_by_id(project_id, current_user.organization)
        if not base_project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        projects = await self.project_repo.list_by_organization(
            current_user.organization,
            current_user.id,
        )
        branches = [
            project
            for project in projects
            if project.parent_project_id == project_id
        ]
        return [self._build_response(branch) for branch in branches]

    async def get_branch_diff(
        self,
        project_id: str,
        branch_id: str,
        current_user: User,
    ) -> ScenarioDiffResponse:
        """Provide a comparison between baseline and branch."""
        base_project = await self.project_repo.get_by_id(project_id, current_user.organization)
        branch_project = await self.project_repo.get_by_id(branch_id, current_user.organization)
        if not base_project or not branch_project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        if branch_project.parent_project_id != base_project.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Branch is not linked to this project",
            )

        base_requirements = await self.requirement_repo.list_by_project(project_id)
        branch_requirements = await self.requirement_repo.list_by_project(branch_id)
        base_tasks = await self.task_repo.list_by_project(project_id)
        branch_tasks = await self.task_repo.list_by_project(branch_id)
        base_artifacts = await self.artifact_repo.list_by_project(project_id)
        branch_artifacts = await self.artifact_repo.list_by_project(branch_id)

        def snapshot(project: Project, reqs: List[Any], tasks: List[Any], artifacts: List[Any]) -> ScenarioSnapshot:
            risk_count = sum(1 for artifact in artifacts if artifact.type == "PHASE_RISKS")
            cost = sum((task.estimate_hours or 0) for task in tasks) * 100
            return ScenarioSnapshot(
                project_id=project.id,
                name=project.name,
                status=project.status,
                phase_status=project.phase_status or {},
                requirements=len(reqs),
                tasks=len(tasks),
                risk_artifacts=risk_count,
                cost_estimate=cost,
            )

        baseline_snapshot = snapshot(base_project, base_requirements, base_tasks, base_artifacts)
        branch_snapshot = snapshot(branch_project, branch_requirements, branch_tasks, branch_artifacts)

        summary = {
            "requirements_delta": branch_snapshot.requirements - baseline_snapshot.requirements,
            "tasks_delta": branch_snapshot.tasks - baseline_snapshot.tasks,
            "risk_delta": branch_snapshot.risk_artifacts - baseline_snapshot.risk_artifacts,
            "cost_delta": round(branch_snapshot.cost_estimate - baseline_snapshot.cost_estimate, 2),
        }

        phase_deltas = []
        for phase in PHASE_ORDER:
            base_status = baseline_snapshot.phase_status.get(phase, "locked")
            branch_status = branch_snapshot.phase_status.get(phase, "locked")
            if base_status != branch_status:
                phase_deltas.append(
                    {
                        "phase": phase,
                        "baseline": base_status,
                        "branch": branch_status,
                    }
                )

        return ScenarioDiffResponse(
            baseline=baseline_snapshot,
            branch=branch_snapshot,
            summary=summary,
            phase_deltas=phase_deltas,
        )

    async def resolve_workspace_template(
        self, payload: GuidedWorkspaceRequest
    ) -> GuidedWorkspaceResponse:
        """Map wizard answers to concrete workspace settings."""
        industry = payload.industry.lower()
        compliance = [c.lower() for c in payload.compliance]
        base_phases = ["planning", "requirements_gathering", "design", "development", "validation", "summary"]
        if industry in {"fintech", "finance"}:
            base_phases.insert(2, "risks")
        elif industry in {"health", "healthcare"}:
            base_phases.insert(2, "compliance")

        artifacts = ["SRS", "Architecture Deck", "Risk Register"]
        if "iso27001" in compliance or "soc2" in compliance:
            artifacts.append("Security Controls Checklist")
        if "hipaa" in compliance:
            artifacts.append("HIPAA Safeguards Matrix")

        prompts = {
            "planning": "Draft the charter with stakeholders, business goals, and KPIs.",
            "requirements_gathering": "Generate functional and non-functional requirements that reflect the wizard inputs.",
            "design": "Produce architecture plus integration views that respect regulatory constraints.",
        }
        if industry in {"fintech", "finance"}:
            prompts["risks"] = "Outline AML/KYC risks, payment rail dependencies, and required mitigations."
        if industry in {"health", "healthcare"}:
            prompts["compliance"] = "List PHI flows and controls needed for HIPAA alignment."

        risk_library = []
        if industry in {"fintech", "finance"}:
            risk_library.extend(["Regulatory fines", "Fraud detection drift", "Payment partner outages"])
        if industry in {"health", "healthcare"}:
            risk_library.extend(["PHI data breach", "Clinical workflow disruption"])
        if not risk_library:
            risk_library = ["Scope creep", "Integration delays", "Vendor lock-in"]

        integrations = []
        if payload.collaboration_focus == "engineering":
            integrations.append("Jira")
        if payload.collaboration_focus == "operations":
            integrations.append("Slack")
        if "iso27001" in compliance or "soc2" in compliance:
            integrations.append("Vanta")

        preset = "focus" if payload.delivery_model == "agile" else "review"
        notes = [
            f"AI provider preference: {payload.ai_provider}",
            f"Team size: {payload.team_size}",
        ]

        return GuidedWorkspaceResponse(
            preset=preset,
            recommended_phases=base_phases,
            required_artifacts=artifacts,
            ai_prompts=prompts,
            risk_library=risk_library,
            integrations=integrations,
            notes=notes,
        )
