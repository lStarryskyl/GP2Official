"""WebSocket routes for real-time collaboration."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from typing import Optional
import logging

from services.websocket_service import connection_manager, authenticate_websocket
from services.project_service import ProjectService
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()
project_service = ProjectService()
security = HTTPBearer()
auth_service = AuthService()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token."""
    return await auth_service.get_current_user(credentials.credentials)


@router.websocket("/projects/{project_id}/collaborate")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: str,
    token: Optional[str] = Query(None)
):
    """WebSocket endpoint for real-time collaboration."""
    await websocket.accept()
    
    # Authenticate user
    if not token:
        await websocket.close(code=4001, reason="Authentication required")
        return
        
    user = await authenticate_websocket(token)
    if not user:
        await websocket.close(code=4001, reason="Invalid authentication")
        return
    
    # Verify project access
    try:
        project = await project_service.get_project(project_id, user)
        if not project:
            await websocket.close(code=4004, reason="Project not found")
            return
    except Exception as e:
        logger.error(f"Error verifying project access: {e}")
        await websocket.close(code=4003, reason="Access denied")
        return
    
    # Connect to collaboration session
    await connection_manager.connect(websocket, project_id, user)
    
    try:
        while True:
            # Wait for messages
            data = await websocket.receive_text()
            await connection_manager.handle_message(websocket, data)
            
    except WebSocketDisconnect:
        await connection_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await connection_manager.disconnect(websocket)


@router.get("/projects/{project_id}/collaborators")
async def get_active_collaborators(
    project_id: str,
    current_user = get_current_user
):
    """Get list of active collaborators in a project."""
    
    # Verify project access
    project = await project_service.get_project(project_id, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get active users
    active_users = connection_manager.get_project_users(project_id)
    
    return {
        "project_id": project_id,
        "active_users": active_users,
        "total_count": len(active_users)
    }


@router.post("/projects/{project_id}/broadcast")
async def broadcast_message(
    project_id: str,
    message_data: dict,
    current_user = get_current_user
):
    """Broadcast a message to all collaborators in a project."""
    
    # Verify project access
    project = await project_service.get_project(project_id, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Create broadcast message
    from services.websocket_service import WebSocketMessage
    from datetime import datetime
    
    message = WebSocketMessage(
        type=message_data.get("type", "broadcast"),
        project_id=project_id,
        user_id=current_user.id,
        data={
            **message_data.get("data", {}),
            "user_name": current_user.full_name,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    # Broadcast to all users in project
    await connection_manager.broadcast_to_project(project_id, message)
    
    return {"success": True, "message": "Message broadcasted"}


@router.get("/projects/{project_id}/collaboration-stats")
async def get_collaboration_stats(
    project_id: str,
    current_user = get_current_user
):
    """Get collaboration statistics for a project."""
    
    # Verify project access
    project = await project_service.get_project(project_id, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get stats from connection manager
    active_users = connection_manager.get_project_users(project_id)
    
    # Get recent changes from cache
    from utils.cache import get_cached
    cache_key = f"recent_changes:{project_id}"
    recent_changes = await get_cached(cache_key) or []
    
    # Calculate activity metrics
    unique_contributors = len(set(change.get("user_id") for change in recent_changes))
    changes_last_hour = len([
        change for change in recent_changes
        if change.get("timestamp") and 
        (datetime.utcnow() - datetime.fromisoformat(change["timestamp"])).seconds < 3600
    ])
    
    return {
        "project_id": project_id,
        "active_users_count": len(active_users),
        "active_users": active_users,
        "recent_changes_count": len(recent_changes),
        "unique_contributors": unique_contributors,
        "changes_last_hour": changes_last_hour,
        "is_active": len(active_users) > 0
    }
