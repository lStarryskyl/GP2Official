"""Export routes for PDF, DOCX, and Markdown."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, PlainTextResponse
from io import BytesIO

from services.export_service import ExportService
from services.project_service import ProjectService
from repositories.artifact_repository import ArtifactRepository
from repositories.requirement_repository import RequirementRepository
from routes.auth import get_current_user

router = APIRouter()
export_service = ExportService()
project_service = ProjectService()
artifact_repo = ArtifactRepository()
requirement_repo = RequirementRepository()


@router.get("/projects/{project_id}/export/pdf")
async def export_pdf(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Export project as PDF."""
    try:
        project = await project_service.get_project(project_id, current_user)
        project_dict = {
            "name": project.name,
            "description": project.description or "",
            "owner": project.owner_name or current_user.email,
            "status": project.status,
            "created_at": str(project.created_at),
            "current_phase": project.current_phase or "",
        }

        requirements_objs = await requirement_repo.list_by_project(project_id)
        requirements = [
            {
                "id": r.id or r.requirement_id or "",
                "title": r.title or "",
                "type": r.type or "",
                "priority": r.priority or "",
                "status": r.status or "",
            }
            for r in requirements_objs
        ]

        artifacts = await artifact_repo.list_by_project(project_id, "PHASE_TASKS")
        tasks: list = []
        for art in artifacts:
            content = art.content_json or {}
            raw = content.get("markdown", "") or content.get("raw_markdown", "")
            if raw:
                for line in raw.splitlines():
                    line = line.strip().lstrip("-*# ").strip()
                    if line and len(line) > 3:
                        tasks.append({
                            "title": line[:80],
                            "assignee": "Unassigned",
                            "priority": "medium",
                            "status": "planned",
                        })

        pdf_buffer = await export_service.export_project_pdf(project_dict, requirements, tasks)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{project.name.replace(" ", "_")}.pdf"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/export/docx")
async def export_docx(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Export project as DOCX."""
    try:
        project = await project_service.get_project(project_id, current_user)
        project_dict = {
            "name": project.name,
            "description": project.description or "",
            "owner": project.owner_name or current_user.email,
            "status": project.status,
            "created_at": str(project.created_at),
            "current_phase": project.current_phase or "",
        }

        requirements_objs = await requirement_repo.list_by_project(project_id)
        requirements = [
            {
                "id": r.id or r.requirement_id or "",
                "title": r.title or "",
                "type": r.type or "",
                "priority": r.priority or "",
                "status": r.status or "",
            }
            for r in requirements_objs
        ]

        artifacts = await artifact_repo.list_by_project(project_id, "PHASE_TASKS")
        tasks: list = []
        for art in artifacts:
            content = art.content_json or {}
            raw = content.get("markdown", "") or content.get("raw_markdown", "")
            if raw:
                for line in raw.splitlines():
                    line = line.strip().lstrip("-*# ").strip()
                    if line and len(line) > 3:
                        tasks.append({
                            "title": line[:80],
                            "assignee": "Unassigned",
                            "priority": "medium",
                            "status": "planned",
                        })

        docx_buffer = await export_service.export_project_docx(project_dict, requirements, tasks)

        return StreamingResponse(
            docx_buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{project.name.replace(" ", "_")}.docx"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/export/markdown")
async def export_markdown(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Export all phase artifacts as a single Markdown document."""
    try:
        project = await project_service.get_project(project_id, current_user)
        all_artifacts = await artifact_repo.list_by_project(project_id)

        phase_order = [
            "planning",
            "feasibility_study",
            "requirements_gathering",
            "validation",
            "design",
            "development",
            "tasks",
            "cost_benefit",
            "risks",
            "summary",
        ]
        phase_titles = {
            "planning": "Planning",
            "feasibility_study": "Feasibility Study",
            "requirements_gathering": "Requirements Gathering",
            "validation": "Validation",
            "design": "System Design",
            "development": "Development",
            "tasks": "Tasks",
            "cost_benefit": "Costs & Benefits",
            "risks": "Risks & Mitigations",
            "summary": "Summary",
        }

        sections = [f"# {project.name}\n\n{project.description or ''}\n"]

        for phase_id in phase_order:
            artifact_type = f"PHASE_{phase_id.upper()}"
            matching = [a for a in all_artifacts if a.type == artifact_type]
            if not matching:
                continue
            art = matching[0]
            content = art.content_json or {}
            markdown = content.get("markdown") or content.get("raw_markdown") or ""
            if markdown:
                title = phase_titles.get(phase_id, phase_id.replace("_", " ").title())
                sections.append(f"## {title}\n\n{markdown}")

        full_doc = "\n\n---\n\n".join(sections)
        safe_name = project.name.replace(" ", "_").replace("/", "-")
        filename = f"project_{safe_name}.md"

        return PlainTextResponse(
            content=full_doc,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
