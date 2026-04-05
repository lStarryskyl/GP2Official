"""Service for development change logs."""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import io
import zipfile

from models.user import User
from models.change_log import ChangeLogEntryResponse, ChangeLogCreateRequest
from repositories.change_log_repository import ChangeLogRepository
from repositories.activity_repository import ActivityRepository
from repositories.task_repository import TaskRepository
from repositories.requirement_repository import RequirementRepository
from services.project_service import ProjectService
from services.plantuml_service import build_plantuml_image_url
from services.notification_service import NotificationService
from models.notification import NotificationCreate

logger = logging.getLogger(__name__)


class ChangeLogService:
    """Handle development update submissions and AI annotations."""

    def __init__(self) -> None:
        self.repo = ChangeLogRepository()
        self.activity_repo = ActivityRepository()
        self.task_repo = TaskRepository()
        self.requirement_repo = RequirementRepository()
        self.project_service = ProjectService()
        self.notification_service = NotificationService()

    async def list_entries(self, project_id: str) -> List[ChangeLogEntryResponse]:
        entries = await self.repo.list_by_project(project_id)
        return [self._as_response(entry) for entry in entries]

    async def create_entry(
        self,
        project_id: str,
        organization: str,
        payload: ChangeLogCreateRequest,
        current_user: User,
    ) -> ChangeLogEntryResponse:
        await self.project_service.get_project(project_id, current_user)
        valid_task_ids = await self._filter_valid_tasks(project_id, payload.task_ids)
        valid_requirement_ids = await self._filter_valid_requirements(project_id, payload.requirement_ids)

        ai_summary = self._generate_ai_summary(payload.description, payload.files, valid_task_ids)

        file_details = self._build_file_details(payload.files)
        diagram_url = self._maybe_generate_diagram_url(
            payload.generate_diagram,
            payload.description,
            payload.files,
            valid_task_ids,
            file_details,
        )

        entry = await self.repo.create_entry(
            {
                "project_id": project_id,
                "organization": organization,
                "author_id": current_user.id,
                "description": payload.description,
                "files": payload.files,
                "task_ids": valid_task_ids,
                "requirement_ids": valid_requirement_ids,
                "entry_type": payload.entry_type,
                "ai_summary": ai_summary,
                "diagram_url": diagram_url,
                "metadata": {
                    "generate_diagram": payload.generate_diagram,
                    "diagram_source": "plantuml" if diagram_url else None,
                    "file_details": file_details,
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )

        # Hook into diagram generation and timeline updates
        await self._trigger_diagram_updates(project_id, payload.entry_type, valid_task_ids)
        await self.activity_repo.record(
            project_id=project_id,
            user_id=current_user.id,
            event_type="change_log_created",
            details_json={
                "entry_id": entry.id,
                "entry_type": entry.entry_type,
                "files": entry.files,
                "task_ids": entry.task_ids,
                "requirement_ids": entry.requirement_ids,
            },
        )
        await self.notification_service.create_notification(
            NotificationCreate(
                user_id=current_user.id,
                project_id=project_id,
                type="project_update",
                title="Development update saved",
                message=payload.description[:140],
                priority="normal",
                entity_type="change_log",
                entity_id=entry.id,
                action_url=f"/projects/{project_id}/updates",
                metadata={"entry_id": entry.id, "entry_type": entry.entry_type},
            )
        )
        return self._as_response(entry)

    async def _filter_valid_tasks(self, project_id: str, task_ids: List[str]) -> List[str]:
        if not task_ids:
            return []
        valid: List[str] = []
        for task_id in task_ids:
            task = await self.task_repo.get_by_id(task_id)
            if task and task.project_id == project_id:
                valid.append(task_id)
        return valid

    async def _filter_valid_requirements(self, project_id: str, req_ids: List[str]) -> List[str]:
        if not req_ids:
            return []
        valid: List[str] = []
        for requirement_id in req_ids:
            requirement = await self.requirement_repo.get_by_id(requirement_id)
            if requirement and requirement.project_id == project_id:
                valid.append(requirement_id)
        return valid

    def _generate_ai_summary(self, description: str, files: List[str], task_ids: List[str]) -> str:
        summary_lines = [description.strip()]
        if files:
            summary_lines.append(f"Files touched: {', '.join(files[:6])}"
                                 + ("…" if len(files) > 6 else ""))
        if task_ids:
            summary_lines.append(f"Linked tasks: {', '.join(task_ids)}")
        return "\n".join(summary_lines)

    async def create_entry_from_upload(
        self,
        project_id: str,
        organization: str,
        *,
        filename: str,
        content: bytes,
        description: str,
        task_ids: List[str],
        requirement_ids: List[str],
        current_user: User,
        generate_diagram: bool = False,
    ) -> ChangeLogEntryResponse:
        valid_tasks = await self._filter_valid_tasks(project_id, task_ids)
        valid_requirements = await self._filter_valid_requirements(project_id, requirement_ids)
        extracted_files, snippet_preview, extracted_details = self._extract_file_metadata(filename, content)
        files = extracted_files or [filename]
        file_details = self._merge_file_details(files, extracted_details)
        ai_summary = self._generate_ai_summary(description or f"Uploaded {filename}", files, valid_tasks)

        diagram_url = self._maybe_generate_diagram_url(
            generate_diagram,
            description or f"Uploaded {filename}",
            files,
            valid_tasks,
            file_details,
        )

        entry = await self.repo.create_entry(
            {
                "project_id": project_id,
                "organization": organization,
                "author_id": current_user.id,
                "description": description or f"Uploaded {filename}",
                "files": files,
                "task_ids": valid_tasks,
                "requirement_ids": valid_requirements,
                "entry_type": "upload",
                "ai_summary": ai_summary,
                "diagram_url": diagram_url,
                "metadata": {
                    "upload_filename": filename,
                    "snippet_preview": snippet_preview,
                    "generate_diagram": generate_diagram,
                    "diagram_source": "plantuml" if diagram_url else None,
                    "file_details": file_details,
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        )
        await self.activity_repo.record(
            project_id=project_id,
            user_id=current_user.id,
            event_type="change_log_uploaded",
            details_json={
                "entry_id": entry.id,
                "filename": filename,
                "files": entry.files,
                "task_ids": entry.task_ids,
                "requirement_ids": entry.requirement_ids,
            },
        )
        await self.notification_service.create_notification(
            NotificationCreate(
                user_id=current_user.id,
                project_id=project_id,
                type="project_update",
                title="Development file uploaded",
                message=(description or f"Uploaded {filename}")[:140],
                priority="normal",
                entity_type="change_log",
                entity_id=entry.id,
                action_url=f"/projects/{project_id}/updates",
                metadata={"entry_id": entry.id, "filename": filename},
            )
        )
        return self._as_response(entry)

    def _extract_file_metadata(self, filename: str, content: bytes) -> tuple[List[str], Optional[str], List[Dict[str, Any]]]:
        names: List[str] = []
        snippet: Optional[str] = None
        file_details: List[Dict[str, Any]] = []
        lower = filename.lower()
        if lower.endswith('.zip'):
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as zf:
                    for info in zf.infolist():
                        names.append(info.filename)
                        try:
                            timestamp = datetime(*info.date_time).isoformat()
                        except Exception:
                            timestamp = None
                        file_details.append(
                            {
                                "name": info.filename,
                                "timestamp": timestamp,
                                "order": len(file_details),
                            }
                        )
                    if names:
                        snippet = f"Archive contains {len(names)} files. Showing first few: {', '.join(names[:5])}"
            except zipfile.BadZipFile:
                snippet = "Unable to parse ZIP archive."
        else:
            try:
                text = content.decode('utf-8', errors='ignore')
                snippet = text[:700]
                file_details.append(
                    {
                        "name": filename,
                        "timestamp": datetime.utcnow().isoformat(),
                        "order": 0,
                    }
                )
            except Exception:
                snippet = None
                file_details.append(
                    {
                        "name": filename,
                        "timestamp": datetime.utcnow().isoformat(),
                        "order": 0,
                    }
                )
        return names, snippet, file_details

    def _as_response(self, entry) -> ChangeLogEntryResponse:
        return ChangeLogEntryResponse(
            id=entry.id,
            project_id=entry.project_id,
            organization=entry.organization,
            author_id=entry.author_id,
            description=entry.description,
            files=entry.files,
            task_ids=entry.task_ids,
            requirement_ids=entry.requirement_ids,
            entry_type=entry.entry_type,
            ai_summary=entry.ai_summary,
            diagram_url=entry.diagram_url,
            metadata=entry.metadata.model_dump() if hasattr(entry.metadata, "model_dump") else entry.metadata,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
        )

    def _maybe_generate_diagram_url(
        self,
        should_generate: bool,
        description: str,
        files: List[str],
        task_ids: List[str],
        file_details: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[str]:
        if not should_generate:
            return None
        diagram_text = self._build_plantuml_flow(description, files, task_ids, file_details)
        if not diagram_text:
            return None
        try:
            return build_plantuml_image_url(diagram_text, fmt="svg")
        except Exception:
            return None

    def _build_plantuml_flow(
        self,
        description: str,
        files: List[str],
        task_ids: List[str],
        file_details: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        summary = (description or "").strip()
        if not summary:
            return ""
        safe_summary = summary.replace("@", "").replace(";", ",")
        lines = ["@startuml", "start", f":{safe_summary};"]
        if task_ids:
            lines.append(f":Linked tasks: {' ,'.join(task_ids[:4])};")
        ordered_files = self._order_files(files, file_details)
        for detail in ordered_files[:5]:
            name = detail.get("name") or ""
            safe_file = name.replace("@", "").replace(";", ",")
            timestamp = detail.get("timestamp")
            label = safe_file
            if timestamp:
                label = f"{safe_file} ({timestamp})"
            lines.append(f":Touch {label};")
        lines.append("stop")
        lines.append("@enduml")
        return "\n".join(lines)

    def _order_files(self, files: List[str], details: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        if not details:
            return [{"name": name, "order": idx} for idx, name in enumerate(files)]
        sorted_details = sorted(
            details,
            key=lambda d: (
                d.get("timestamp") or "",
                d.get("order") if d.get("order") is not None else 0,
            ),
        )
        seen = set()
        ordered: List[Dict[str, Any]] = []
        for detail in sorted_details:
            name = detail.get("name")
            if not name or name in seen:
                continue
            seen.add(name)
            ordered.append(detail)
        for idx, name in enumerate(files):
            if name not in seen:
                ordered.append({"name": name, "order": len(ordered), "fallback_index": idx})
        return ordered

    def _build_file_details(self, files: List[str]) -> List[Dict[str, Any]]:
        timestamp = datetime.utcnow().isoformat()
        return [
            {"name": name, "timestamp": timestamp, "order": idx}
            for idx, name in enumerate(files)
        ]

    def _merge_file_details(self, files: List[str], extracted: Optional[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        if extracted:
            extracted_map = {detail.get("name"): detail for detail in extracted if detail.get("name")}
        else:
            extracted_map = {}
        merged: List[Dict[str, Any]] = []
        for idx, name in enumerate(files):
            detail = extracted_map.get(name, {})
            merged.append(
                {
                    "name": name,
                    "timestamp": detail.get("timestamp") or datetime.utcnow().isoformat(),
                    "order": detail.get("order", idx),
                }
            )
        return merged
    
    async def _trigger_diagram_updates(self, project_id: str, change_type: str, task_ids: List[str]) -> None:
        """Trigger diagram generation and timeline updates based on change log entries."""
        try:
            from services.diagram_service import DiagramService
            from services.phase_flow_service import PhaseFlowService
            
            diagram_service = DiagramService()
            phase_service = PhaseFlowService()
            
            # Update timeline diagrams if tasks were modified
            if task_ids and change_type in ["task_completed", "task_created", "task_updated"]:
                # Generate or update Gantt chart diagram
                await diagram_service.auto_update_gantt_diagram(project_id, task_ids)
                
            # Update phase flow diagrams for major changes
            if change_type in ["phase_completed", "milestone_reached", "project_updated"]:
                await phase_service.update_phase_timeline(project_id)
                
        except Exception as e:
            # Log error but don't fail the change log creation
            logger.warning(f"Failed to trigger diagram updates for project {project_id}: {e}")
            pass
