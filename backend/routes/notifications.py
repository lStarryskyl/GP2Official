"""Notification routes."""

from fastapi import APIRouter, HTTPException, Depends

from models.notification import NotificationCreate
from services.notification_service import NotificationService
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
notification_service = NotificationService()


@router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get notifications for current user."""
    notifications = await notification_service.get_user_notifications(
        current_user.id,
        unread_only,
        limit
    )
    return {"notifications": notifications}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    result = await notification_service.mark_as_read(notification_id)
    return result


@router.post("/notifications/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read."""
    result = await notification_service.mark_all_as_read(current_user.id)
    return result


@router.get("/projects/{project_id}/activity")
async def get_project_activity(
    project_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get activity feed for a project."""
    activities = await notification_service.get_project_activity(project_id, limit)
    return {"activities": activities}
