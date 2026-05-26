"""AI Suggestions endpoint — proactive phase improvement tips."""

import logging
<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException
=======
import json
import re
from fastapi import APIRouter, Depends
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
from pydantic import BaseModel
from typing import List

from routes.auth import get_current_user
<<<<<<< HEAD
from services.openai_client import call_openai

logger = logging.getLogger(__name__)
router = APIRouter()
=======
from services.plan_limits import enforce_and_record_ai_run
from repositories.ai_run_repository import AiRunRepository
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
ai_run_repo = AiRunRepository()
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1


class SuggestionsRequest(BaseModel):
    phase: str
    phase_content: str = ""
    project_name: str = ""
    project_description: str = ""


class Suggestion(BaseModel):
    title: str
    description: str
<<<<<<< HEAD
    priority: str  # "high" | "medium" | "low"
    category: str  # "missing" | "improve" | "risk" | "next"
=======
    priority: str
    category: str
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1


class SuggestionsResponse(BaseModel):
    suggestions: List[Suggestion]


@router.post("/projects/{project_id}/suggestions", response_model=SuggestionsResponse)
async def get_phase_suggestions(
    project_id: str,
    req: SuggestionsRequest,
    current_user=Depends(get_current_user),
):
    """Return 3–5 proactive improvement suggestions for the current phase."""
<<<<<<< HEAD
=======
    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=project_id,
        job_type="ai_suggestions",
        provider="gemini",
        phase=req.phase,
    )
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
    content_snippet = req.phase_content[:3000] if req.phase_content else "No content yet."

    prompt = f"""You are Athena, an expert AI assistant for software project planning.

Project: {req.project_name}
Current phase: {req.phase}
Phase content (excerpt):
{content_snippet}

Generate exactly 4 concise, actionable improvement suggestions for this phase.
Return ONLY valid JSON in this format, no extra text:
{{
  "suggestions": [
    {{
      "title": "Short action title (max 8 words)",
      "description": "One sentence explaining what to add or improve.",
      "priority": "high|medium|low",
      "category": "missing|improve|risk|next"
    }}
  ]
}}

Categories:
- "missing": important content that should be added
- "improve": existing content that could be stronger
- "risk": a risk or gap the user should be aware of
- "next": a logical next step after completing this phase

Be specific to the project context. Vary priorities."""

    try:
<<<<<<< HEAD
        raw = await call_openai(prompt, system="You are a concise project planning AI. Always respond with valid JSON only.")
        import json, re
        # Extract JSON from response
=======
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_flash_model)
        response = model.generate_content(prompt)
        raw = response.text or ""
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if not m:
            raise ValueError("No JSON in response")
        data = json.loads(m.group(0))
        suggestions = [Suggestion(**s) for s in data.get("suggestions", [])]
        return SuggestionsResponse(suggestions=suggestions[:5])
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
<<<<<<< HEAD
        # Fallback suggestions
=======
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
        return SuggestionsResponse(suggestions=[
            Suggestion(title="Add acceptance criteria", description="Define clear acceptance criteria for each requirement in this phase.", priority="high", category="missing"),
            Suggestion(title="Link to next phase", description="Ensure outputs from this phase feed directly into the next phase's inputs.", priority="medium", category="next"),
            Suggestion(title="Review for completeness", description="Check that all stakeholder perspectives are represented.", priority="medium", category="improve"),
            Suggestion(title="Identify dependencies", description="Document any external dependencies that could block progress.", priority="high", category="risk"),
        ])
