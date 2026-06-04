"""AI Chat Assistant routes — per-phase conversational AI."""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from routes.auth import get_current_user
from models.user import User
from services.gemini_orchestrator import gemini_orchestrator
from services.openai_client import call_openai
from services.plan_limits import enforce_ai_run_quota, enforce_and_record_ai_run
from repositories.artifact_repository import ArtifactRepository
from repositories.ai_run_repository import AiRunRepository

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMIT_AVAILABLE = True
except ImportError:
    RATE_LIMIT_AVAILABLE = False

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMIT_AVAILABLE = True
except ImportError:
    RATE_LIMIT_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter()
ai_run_repo = AiRunRepository()


# ── Request / Response models ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    project_id: str
    project_name: str
    phase: str
    message: str
    chat_history: Optional[List[ChatMessage]] = []


class AgentTaskRequest(BaseModel):
    project_id: str
    project_name: str
    description: str
    task_type: str   # conflict_detection | tech_stack_recommendation | security_audit | api_design | database_schema | user_story_generation
    requirements: Optional[List[Dict[str, Any]]] = []
    system_design: Optional[Dict[str, Any]] = {}
    personas: Optional[List[Dict[str, Any]]] = []
    questionnaire_data: Optional[Dict[str, Any]] = {}


# ── Helpers ───────────────────────────────────────────────────────────────

async def _get_phase_content(project_id: str, phase: str) -> str:
    """Fetch the latest AI-generated content for a phase from artifacts."""
    try:
        artifact_repo = ArtifactRepository()
        artifact_type = f"PHASE_{phase.upper()}"
        artifact = await artifact_repo.get_latest_by_type(project_id, artifact_type)
        if artifact and artifact.content_json:
            return artifact.content_json.get("markdown", "") or artifact.content_json.get("raw_markdown", "")
    except Exception as e:
        logger.warning(f"Could not fetch phase content for {phase}: {e}")
    return ""


# ── Routes ────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat_with_phase_ai(
    request: ChatRequest,
    req: Request = None,
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI Chat Assistant for a specific phase."""
    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=request.project_id,
        job_type="ai_chat",
        provider="openai",
        model="gpt-4o-mini",
        phase=request.phase,
    )
    try:
        # Get the current phase content for context
        phase_content = await _get_phase_content(request.project_id, request.phase)

        history_text = ""
        for m in (request.chat_history or []):
            role = "User" if m.role == "user" else "Athena"
            history_text += f"{role}: {m.content}\n"

        system_prompt = f"""You are Athena, an expert AI assistant for software development projects.
You are helping with the {request.phase} phase of the project "{request.project_name}".
Be concise, actionable, and specific. Format responses in markdown when helpful.

{f'Current phase content:{chr(10)}{phase_content[:2000]}' if phase_content else ''}"""

        user_prompt = f"""{f'Conversation so far:{chr(10)}{history_text}{chr(10)}' if history_text else ''}User: {request.message}"""

        response_text = await call_openai(user_prompt, system=system_prompt)

        return {
            "success": True,
            "response": response_text,
            "agent": "AIChatAgent",
            "model": "gpt-4o-mini",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent-task")
async def run_agent_task(
    request: AgentTaskRequest,
    req: Request = None,
    current_user: User = Depends(get_current_user),
):
    """Run a specialized AI agent task (conflict detection, tech stack, security audit, etc.)."""
    valid_tasks = [
        "conflict_detection",
        "tech_stack_recommendation",
        "security_audit",
        "user_story_generation",
        "api_design",
        "database_schema",
    ]
    if request.task_type not in valid_tasks:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task_type. Must be one of: {valid_tasks}"
        )

    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=request.project_id,
        job_type=f"agent_task:{request.task_type}",
        provider="gemini",
        model="gemini-orchestrator",
    )
    try:
        context = {
            "project_name": request.project_name,
            "description": request.description,
            "requirements": request.requirements or [],
            "system_design": request.system_design or {},
            "personas": request.personas or [],
            "questionnaire_data": request.questionnaire_data or {},
        }

        result = await gemini_orchestrator.run(request.task_type, context)

        if not result["success"]:
            err = result.get("error", "Agent task failed")
            if "429" in str(err) or "quota" in str(err).lower():
                raise HTTPException(status_code=429, detail="Gemini API daily quota reached. Your quota resets at midnight Pacific time. Check https://ai.dev/rate-limit for details.")
            raise HTTPException(status_code=500, detail=err)

        return {
            "success": True,
            "task_type": request.task_type,
            "content": result["content"],
            "agent": result["agent"],
            "model": result["model"],
        }

    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e)
        logger.error(f"Agent task error ({request.task_type}): {err_str}")
        if "429" in err_str or "quota" in err_str.lower():
            raise HTTPException(status_code=429, detail="Gemini API daily quota reached. Your quota resets at midnight Pacific time.")
        raise HTTPException(status_code=500, detail=err_str)


@router.get("/supported-tasks")
async def get_supported_tasks(current_user: User = Depends(get_current_user)):
    """List all supported AI agent task types."""
    return {
        "supported_tasks": gemini_orchestrator.supported_task_types,
        "chat_enabled": True,
        "new_agents": [
            {"type": "conflict_detection",       "name": "Conflict Detection Agent",       "model": "gemini-2.5-pro"},
            {"type": "tech_stack_recommendation", "name": "Tech Stack Recommender Agent",   "model": "gemini-2.5-pro"},
            {"type": "security_audit",            "name": "Security Audit Agent",            "model": "gemini-2.5-pro"},
            {"type": "user_story_generation",     "name": "User Story Generator Agent",      "model": "gemini-2.0-flash"},
            {"type": "api_design",                "name": "API Design Agent",                "model": "gemini-2.5-pro"},
            {"type": "database_schema",           "name": "Database Schema Agent",           "model": "gemini-2.5-pro"},
            {"type": "ai_chat",                   "name": "AI Chat Assistant (Athena)",      "model": "gemini-2.0-flash"},
        ]
    }
