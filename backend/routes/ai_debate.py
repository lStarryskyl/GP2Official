"""AI Debate endpoint — two agents argue a topic, moderator concludes."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import logging

from routes.auth import get_current_user
from services.ai_pipeline_service import ai_pipeline, TaskType

logger = logging.getLogger(__name__)
router = APIRouter()


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
    topic = req.topic
    context = req.context or ""
    rounds: List[DebateRound] = []

    ctx_block = f"\n\nProject context:\n{context}" if context else ""

    # --- Round 1: Advocate (FOR) ---
    advocate_prompt = f"""You are the Advocate agent in a structured technical debate.
Argue STRONGLY IN FAVOUR of the following proposal. Be specific, practical, and cite real tradeoffs.
Keep your argument under 150 words.

Proposal: {topic}{ctx_block}"""

    advocate_result = await ai_pipeline.generate_with_best_model(
        task_type=TaskType.GENERAL,
        prompt=advocate_prompt,
        context={"role": "advocate"},
    )
    advocate_text = (
        str(advocate_result.content)
        if advocate_result.content and not advocate_result.error
        else "The proposal is sound. It reduces complexity and accelerates delivery by leveraging well-understood patterns with strong community support."
    )
    rounds.append(DebateRound(agent="Advocate", argument=advocate_text))

    # --- Round 2: Critic (AGAINST) ---
    critic_prompt = f"""You are the Critic agent in a structured technical debate.
Argue STRONGLY AGAINST the following proposal. Identify real risks, edge cases, and alternatives.
Keep your argument under 150 words.

Proposal: {topic}{ctx_block}"""

    critic_result = await ai_pipeline.generate_with_best_model(
        task_type=TaskType.GENERAL,
        prompt=critic_prompt,
        context={"role": "critic"},
    )
    critic_text = (
        str(critic_result.content)
        if critic_result.content and not critic_result.error
        else "This approach introduces significant operational overhead and tight coupling that will hurt maintainability as the system scales beyond initial requirements."
    )
    rounds.append(DebateRound(agent="Critic", argument=critic_text))

    # --- Round 3: Moderator verdict ---
    moderator_prompt = f"""You are a neutral technical Moderator. Two agents have debated the following proposal.

Proposal: {topic}

Advocate said: {advocate_text}

Critic said: {critic_text}

Give a balanced, actionable verdict in under 100 words. Acknowledge the strongest point from each side and recommend a concrete path forward."""

    moderator_result = await ai_pipeline.generate_with_best_model(
        task_type=TaskType.GENERAL,
        prompt=moderator_prompt,
        context={"role": "moderator"},
    )
    verdict = (
        str(moderator_result.content)
        if moderator_result.content and not moderator_result.error
        else "Both sides raise valid points. The recommended path is to prototype the proposal in a bounded context, measure the key metrics both agents cited, then make a data-driven decision before full commitment."
    )

    return DebateResponse(topic=topic, rounds=rounds, verdict=verdict)
