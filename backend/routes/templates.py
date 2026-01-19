"""Template library routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List

from models.template import TemplateCreate
from services.template_service import TemplateService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
template_service = TemplateService()


@router.get("/templates")
async def get_templates(
    category: Optional[str] = None,
    industry: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get templates with optional filters."""
    tag_list = tags.split(",") if tags else None
    templates = await template_service.get_templates(
        category=category,
        industry=industry,
        tags=tag_list,
        user_id=current_user.id
    )
    return {"templates": templates}


@router.post("/templates")
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new template."""
    template_data.created_by = current_user.id
    template = await template_service.create_template(
        template_data,
        current_user.full_name or current_user.email
    )
    return template


@router.post("/templates/{template_id}/use")
async def use_template(
    template_id: str,
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Apply a template to a project."""
    result = await template_service.use_template(
        template_id,
        project_id,
        current_user.id
    )
    return result


@router.post("/templates/{template_id}/rate")
async def rate_template(
    template_id: str,
    rating: int,
    review: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Rate a template."""
    result = await template_service.rate_template(
        template_id,
        current_user.id,
        rating,
        review
    )
    return result


@router.get("/templates/briefs")
async def get_brief_templates(
    current_user: User = Depends(get_current_user)
):
    """Get brief builder templates."""
    templates = await template_service.get_brief_templates()
    return {"brief_templates": templates}
