"""Notification and activity feed service."""

import uuid
from typing import List, Dict, Any
from datetime import datetime

from models.notification import (
    Notification, NotificationCreate, ActivityFeedItem, NotificationPreferences
)


class NotificationService:
    """Service for notifications and activity feeds."""
    
    async def create_notification(
        self,
        notification_data: NotificationCreate
    ) -> Dict[str, Any]:
        """Create a new notification."""
        
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": notification_data.user_id,
            "project_id": notification_data.project_id,
            "type": notification_data.type,
            "title": notification_data.title,
            "message": notification_data.message,
            "priority": notification_data.priority,
            "entity_type": notification_data.entity_type,
            "entity_id": notification_data.entity_id,
            "action_url": notification_data.action_url,
            "metadata": notification_data.metadata,
            "read": False,
            "read_at": None,
            "created_at": datetime.utcnow()
        }
        
        return notification
    
    async def mark_as_read(
        self,
        notification_id: str
    ) -> Dict[str, Any]:
        """Mark notification as read."""
        
        return {
            "notification_id": notification_id,
            "read": True,
            "read_at": datetime.utcnow()
        }
    
    async def mark_all_as_read(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Mark all notifications as read for a user."""
        
        return {
            "user_id": user_id,
            "marked_read_at": datetime.utcnow()
        }
    
    async def create_activity(
        self,
        project_id: str,
        user_id: str,
        user_name: str,
        action: str,
        entity_type: str,
        entity_id: str,
        entity_name: str,
        description: str,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create an activity feed item."""
        
        activity = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "user_id": user_id,
            "user_name": user_name,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "entity_name": entity_name,
            "description": description,
            "metadata": metadata or {},
            "created_at": datetime.utcnow()
        }
        
        return activity
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user."""
        
        # This would query the database
        return []
    
    async def get_project_activity(
        self,
        project_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get activity feed for a project."""
        
        # This would query the database
        return []
    
    async def notify_mention(
        self,
        mentioned_user_id: str,
        mentioning_user_name: str,
        project_id: str,
        entity_type: str,
        entity_id: str,
        comment_content: str
    ) -> Dict[str, Any]:
        """Send notification for @mention."""
        
        notification_data = NotificationCreate(
            user_id=mentioned_user_id,
            project_id=project_id,
            type="mention",
            title=f"{mentioning_user_name} mentioned you",
            message=f"in a comment: {comment_content[:100]}...",
            priority="normal",
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=f"/projects/{project_id}/{entity_type}/{entity_id}"
        )
        
        return await self.create_notification(notification_data)
    
    async def notify_requirement_change(
        self,
        user_id: str,
        project_id: str,
        requirement_id: str,
        requirement_title: str,
        change_type: str
    ) -> Dict[str, Any]:
        """Send notification for requirement change."""
        
        notification_data = NotificationCreate(
            user_id=user_id,
            project_id=project_id,
            type="requirement_change",
            title=f"Requirement {change_type}",
            message=f"{requirement_title}",
            priority="normal",
            entity_type="requirement",
            entity_id=requirement_id,
            action_url=f"/projects/{project_id}/requirements/{requirement_id}"
        )
        
        return await self.create_notification(notification_data)
    
    async def notify_task_assignment(
        self,
        user_id: str,
        project_id: str,
        task_id: str,
        task_title: str,
        assigned_by: str
    ) -> Dict[str, Any]:
        """Send notification for task assignment."""
        
        notification_data = NotificationCreate(
            user_id=user_id,
            project_id=project_id,
            type="task_assignment",
            title=f"New task assigned by {assigned_by}",
            message=task_title,
            priority="high",
            entity_type="task",
            entity_id=task_id,
            action_url=f"/projects/{project_id}/tasks/{task_id}"
        )
        
        return await self.create_notification(notification_data)
