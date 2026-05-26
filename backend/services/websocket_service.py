"""WebSocket service for real-time collaboration."""

import json
import asyncio
from typing import Dict, Set, List, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import logging
from datetime import datetime

from models.user import User
from services.auth_service import AuthService
from utils.cache import get_cached, set_cached

logger = logging.getLogger(__name__)


class WebSocketMessage(BaseModel):
    """WebSocket message structure."""
    type: str
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    data: Dict[str, Any] = {}
    timestamp: datetime = datetime.utcnow()


class ConnectionManager:
    """Manages WebSocket connections for real-time collaboration."""
    
    def __init__(self):
        # Active connections: {project_id: {user_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # User sessions: {websocket: user_data}
        self.user_sessions: Dict[WebSocket, Dict[str, Any]] = {}
        # Project cursors: {project_id: {user_id: cursor_data}}
        self.project_cursors: Dict[str, Dict[str, Dict[str, Any]]] = {}
        
    async def connect(self, websocket: WebSocket, project_id: str, user: User):
        """Register a new WebSocket connection."""
        
        # Initialize project connections if not exists
        if project_id not in self.active_connections:
            self.active_connections[project_id] = {}
            
        # Store connection
        self.active_connections[project_id][user.id] = websocket
        self.user_sessions[websocket] = {
            "user_id": user.id,
            "project_id": project_id,
            "email": user.email,
            "full_name": user.full_name,
            "joined_at": datetime.utcnow()
        }
        
        # Initialize cursor tracking
        if project_id not in self.project_cursors:
            self.project_cursors[project_id] = {}
            
        # Notify other users in project
        await self.broadcast_to_project(
            project_id, 
            WebSocketMessage(
                type="user_joined",
                project_id=project_id,
                user_id=user.id,
                data={
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "full_name": user.full_name
                    }
                }
            ),
            exclude_user=user.id
        )
        
        # Send current project state to new user
        await self.send_project_state(websocket, project_id)
        
        logger.info(f"User {user.email} connected to project {project_id}")
        
    async def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection."""
        if websocket not in self.user_sessions:
            return
            
        session = self.user_sessions[websocket]
        project_id = session["project_id"]
        user_id = session["user_id"]
        
        # Remove from active connections
        if project_id in self.active_connections:
            self.active_connections[project_id].pop(user_id, None)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
                
        # Remove cursor data
        if project_id in self.project_cursors:
            self.project_cursors[project_id].pop(user_id, None)
            
        # Remove session
        del self.user_sessions[websocket]
        
        # Notify other users
        await self.broadcast_to_project(
            project_id,
            WebSocketMessage(
                type="user_left",
                project_id=project_id,
                user_id=user_id,
                data={"user_id": user_id}
            ),
            exclude_user=user_id
        )
        
        logger.info(f"User {session['email']} disconnected from project {project_id}")
        
    async def send_personal_message(self, message: WebSocketMessage, websocket: WebSocket):
        """Send message to specific connection."""
        try:
            await websocket.send_text(message.json())
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            
    async def broadcast_to_project(self, project_id: str, message: WebSocketMessage, exclude_user: str = None):
        """Broadcast message to all users in a project."""
        if project_id not in self.active_connections:
            return
            
        connections = self.active_connections[project_id]
        disconnected = []
        
        for user_id, websocket in connections.items():
            if exclude_user and user_id == exclude_user:
                continue
                
            try:
                await websocket.send_text(message.json())
            except WebSocketDisconnect:
                disconnected.append((user_id, websocket))
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected.append((user_id, websocket))
                
        # Clean up disconnected clients
        for user_id, websocket in disconnected:
            await self.disconnect(websocket)
            
    async def handle_cursor_update(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle cursor position updates."""
        session = self.user_sessions.get(websocket)
        if not session:
            return
            
        project_id = session["project_id"]
        user_id = session["user_id"]
        
        # Update cursor data
        cursor_data = {
            "user_id": user_id,
            "user_name": session["full_name"],
            "phase": data.get("phase"),
            "element_id": data.get("element_id"),
            "position": data.get("position", {}),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.project_cursors[project_id][user_id] = cursor_data
        
        # Broadcast cursor update
        await self.broadcast_to_project(
            project_id,
            WebSocketMessage(
                type="cursor_update",
                project_id=project_id,
                user_id=user_id,
                data=cursor_data
            ),
            exclude_user=user_id
        )
        
    async def handle_content_change(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle real-time content changes."""
        session = self.user_sessions.get(websocket)
        if not session:
            return
            
        project_id = session["project_id"]
        user_id = session["user_id"]
        
        # Create change event
        change_data = {
            "user_id": user_id,
            "user_name": session["full_name"],
            "change_type": data.get("change_type"),
            "element_id": data.get("element_id"),
            "content": data.get("content"),
            "phase": data.get("phase"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast content change
        await self.broadcast_to_project(
            project_id,
            WebSocketMessage(
                type="content_change",
                project_id=project_id,
                user_id=user_id,
                data=change_data
            ),
            exclude_user=user_id
        )
        
        # Cache recent changes for conflict resolution
        cache_key = f"recent_changes:{project_id}"
        recent_changes = await get_cached(cache_key) or []
        recent_changes.append(change_data)
        
        # Keep only last 50 changes
        if len(recent_changes) > 50:
            recent_changes = recent_changes[-50:]
            
        await set_cached(cache_key, recent_changes, ttl=3600)
        
    async def handle_comment_add(self, websocket: WebSocket, data: Dict[str, Any]):
        """Handle adding comments."""
        session = self.user_sessions.get(websocket)
        if not session:
            return
            
        project_id = session["project_id"]
        user_id = session["user_id"]
        
        comment_data = {
            "comment_id": data.get("comment_id"),
            "user_id": user_id,
            "user_name": session["full_name"],
            "content": data.get("content"),
            "element_id": data.get("element_id"),
            "phase": data.get("phase"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast new comment
        await self.broadcast_to_project(
            project_id,
            WebSocketMessage(
                type="comment_added",
                project_id=project_id,
                user_id=user_id,
                data=comment_data
            )
        )
        
    async def send_project_state(self, websocket: WebSocket, project_id: str):
        """Send current project state to newly connected user."""
        # Get active users in project
        active_users = []
        if project_id in self.active_connections:
            for user_id, _ in self.active_connections[project_id].items():
                for ws, session in self.user_sessions.items():
                    if session["user_id"] == user_id:
                        active_users.append({
                            "id": user_id,
                            "email": session["email"],
                            "full_name": session["full_name"],
                            "joined_at": session["joined_at"].isoformat()
                        })
                        break
                        
        # Get current cursors
        cursors = self.project_cursors.get(project_id, {})
        
        # Get recent changes
        cache_key = f"recent_changes:{project_id}"
        recent_changes = await get_cached(cache_key) or []
        
        state_message = WebSocketMessage(
            type="project_state",
            project_id=project_id,
            data={
                "active_users": active_users,
                "cursors": list(cursors.values()),
                "recent_changes": recent_changes[-10:]  # Last 10 changes
            }
        )
        
        await self.send_personal_message(state_message, websocket)
        
    async def handle_message(self, websocket: WebSocket, message_text: str):
        """Handle incoming WebSocket message."""
        try:
            message_data = json.loads(message_text)
            message_type = message_data.get("type")
            data = message_data.get("data", {})
            
            handlers = {
                "cursor_update": self.handle_cursor_update,
                "content_change": self.handle_content_change,
                "comment_add": self.handle_comment_add,
            }
            
            handler = handlers.get(message_type)
            if handler:
                await handler(websocket, data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON in WebSocket message")
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            
    def get_project_users(self, project_id: str) -> List[Dict[str, Any]]:
        """Get list of active users in a project."""
        if project_id not in self.active_connections:
            return []
            
        users = []
        for user_id, _ in self.active_connections[project_id].items():
            for ws, session in self.user_sessions.items():
                if session["user_id"] == user_id:
                    users.append({
                        "id": user_id,
                        "email": session["email"],
                        "full_name": session["full_name"],
                        "joined_at": session["joined_at"].isoformat()
                    })
                    break
                    
        return users


# Global connection manager instance
connection_manager = ConnectionManager()


async def authenticate_websocket(token: str) -> Optional[User]:
    """Authenticate WebSocket connection using JWT token."""
    try:
        auth_service = AuthService()
        
        # We need the direct jwt verify to handle secret_key vs jwt_secret mismatches if any,
        # but let's just use the REST API approach for safety.
        from fastapi import HTTPException
        try:
            user = await auth_service.get_current_user(token)
            return user
        except HTTPException:
            return None
        
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        return None
