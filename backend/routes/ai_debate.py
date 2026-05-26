"""AI Debate endpoint — two agents argue a topic, moderator concludes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import logging

from routes.auth import get_current_user
from services.openai_client import call_openai
<<<<<<< HEAD

logger = logging.getLogger(__name__)
router = APIRouter()
=======
from services.plan_limits import enforce_and_record_ai_run
from repositories.ai_run_repository import AiRunRepository

logger = logging.getLogger(__name__)
router = APIRouter()
ai_run_repo = AiRunRepository()
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1


class DebateRequest(BaseModel):
    topic: str
    context: str = ""


class DebateRound(BaseModel):
    agent: str
    argument: str


class DebateResponse(BaseModel):
    topic: str
    rounds: List[DebateRound]
    verdict: str


@router.post("/projects/{project_id}/debate", response_model=DebateResponse)
async def run_debate(
    project_id: str,
    req: DebateRequest,
    current_user=Depends(get_current_user),
):
    """Run a structured 3-round AI debate on a design/architecture topic."""
<<<<<<< HEAD
=======
    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=project_id,
        job_type="ai_debate",
        provider="openai",
    )
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
    topic = req.topic
    context = req.context or ""
    rounds: List[DebateRound] = []

    ctx_block = f"\n\nProject context:\n{context}" if context else ""

    try:
        # --- Round 1: Advocate (FOR) ---
        advocate_prompt = f"""You are the Advocate agent in a structured technical debate.
Argue STRONGLY IN FAVOUR of the following proposal. Be specific, practical, and cite real tradeoffs.
Keep your argument under 150 words.

Proposal: {topic}{ctx_block}"""

        advocate_text = await call_openai(advocate_prompt, system="You are a sharp technical advocate. Be concise and persuasive.")
        rounds.append(DebateRound(agent="Advocate", argument=advocate_text))

        # --- Round 2: Critic (AGAINST) ---
        critic_prompt = f"""You are the Critic agent in a structured technical debate.
Argue STRONGLY AGAINST the following proposal. Identify real risks, edge cases, and alternatives.
Keep your argument under 150 words.

Proposal: {topic}{ctx_block}"""

        critic_text = await call_openai(critic_prompt, system="You are a sharp technical critic. Be concise and identify real risks.")
        rounds.append(DebateRound(agent="Critic", argument=critic_text))

        # --- Round 3: Moderator verdict ---
        moderator_prompt = f"""You are a neutral technical Moderator. Two agents have debated the following proposal.

Proposal: {topic}

Advocate said: {advocate_text}

Critic said: {critic_text}

Give a balanced, actionable verdict in under 100 words. Acknowledge the strongest point from each side and recommend a concrete path forward."""

        verdict = await call_openai(moderator_prompt, system="You are a balanced technical moderator. Be concise and decisive.")

    except Exception as e:
        logger.error(f"Debate error: {e}")
        raise HTTPException(status_code=500, detail=f"Debate failed: {str(e)}")

    return DebateResponse(topic=topic, rounds=rounds, verdict=verdict)
