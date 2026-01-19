"""Export routes for PDF and DOCX."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from services.export_service import ExportService
from routes.auth import get_current_user

router = APIRouter()
export_service = ExportService()


@router.get("/projects/{project_id}/export/pdf")
async def export_pdf(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Export project as PDF."""
    try:
        # TODO: Fetch project, requirements, tasks from repository
        project = {"name": "Sample Project", "description": "Description", "owner": current_user.email}
        requirements = []
        tasks = []
        
        pdf_buffer = await export_service.export_project_pdf(project, requirements, tasks)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=project_{project_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/export/docx")
async def export_docx(
    project_id: str,
    current_user = Depends(get_current_user)
):
    """Export project as DOCX."""
    try:
        # TODO: Fetch project, requirements, tasks from repository
        project = {"name": "Sample Project", "description": "Description", "owner": current_user.email}
        requirements = []
        tasks = []
        
        docx_buffer = await export_service.export_project_docx(project, requirements, tasks)
        
        return StreamingResponse(
            docx_buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=project_{project_id}.docx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
