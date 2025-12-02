"""Routes for development change logs."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form

from models.change_log import ChangeLogEntryResponse, ChangeLogCreateRequest
from models.user import User
from routes.auth import get_current_user
from services.change_log_service import ChangeLogService
from services.project_service import ProjectService

router = APIRouter()
service = ChangeLogService()
project_service = ProjectService()


@router.get(
    "/projects/{project_id}/changelog/",
    response_model=List[ChangeLogEntryResponse],
)
async def list_change_log(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    await project_service.get_project(project_id, current_user)
    return await service.list_entries(project_id)


@router.post(
    "/projects/{project_id}/changelog/",
    response_model=ChangeLogEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_change_log_entry(
    project_id: str,
    payload: ChangeLogCreateRequest,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await service.create_entry(project_id, project.organization, payload, current_user)


@router.post(
    "/projects/{project_id}/changelog/upload/",
    response_model=ChangeLogEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_change_log_from_upload(
    project_id: str,
    file: UploadFile = File(...),
    description: str = Form(""),
    task_ids: str = Form(""),
    requirement_ids: str = Form(""),
    generate_diagram: bool = Form(False),
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    content = await file.read()
    task_list = [tid.strip() for tid in task_ids.split(',') if tid.strip()]
    req_list = [rid.strip() for rid in requirement_ids.split(',') if rid.strip()]
    return await service.create_entry_from_upload(
        project_id,
        project.organization,
        filename=file.filename or 'upload.bin',
        content=content,
        description=description,
        task_ids=task_list,
        requirement_ids=req_list,
        current_user=current_user,
        generate_diagram=generate_diagram,
    )
