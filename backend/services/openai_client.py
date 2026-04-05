"""Thin async wrapper around OpenAI chat completions."""

import logging
from typing import Optional

from openai import AsyncOpenAI

from config import settings

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def call_openai(
    prompt: str,
    system: str = "",
    model: Optional[str] = None,
    max_tokens: int = 4096,
) -> str:
    """Call OpenAI chat completions and return the text content."""
    client = _get_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = await client.chat.completions.create(
        model=model or settings.openai_model,
        messages=messages,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""
