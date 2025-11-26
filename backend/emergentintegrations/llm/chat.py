"""Light-weight abstraction over different LLM providers."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Literal, Optional

import httpx

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

logger = logging.getLogger(__name__)


@dataclass
class UserMessage:
    """Minimal representation of a chat message sent by the user."""

    text: str
    role: Literal["user", "assistant", "system"] = "user"

    @property
    def content(self) -> str:
        return self.text


@dataclass
class AssistantMessage:
    """Minimal representation of a model response."""

    text: str
    role: Literal["assistant"] = "assistant"

    @property
    def content(self) -> str:
        return self.text


class LlmChat:
    """Wrapper that allows the rest of the codebase to call different providers."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        session_id: Optional[str] = None,
        system_message: Optional[str] = None,
    ) -> None:
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message or ""
        self.provider = "mock"
        self.model = "mock-model"
        self.http_timeout = 60.0

    def with_model(self, provider: str, model_name: str) -> "LlmChat":
        """Configure provider/model and return self for chaining."""
        self.provider = (provider or "mock").lower()
        self.model = model_name or "mock-model"
        return self

    async def send_message(self, message: UserMessage) -> str:
        """Dispatch the prompt to the configured provider."""
        prompt = self._compose_prompt(message.text if isinstance(message, UserMessage) else str(message))
        if self.provider in {"gemini", "google", "google_gemini"}:
            return await self._send_via_gemini(prompt)
        if self.provider in {"huggingface", "hf"}:
            return await self._send_via_huggingface(prompt)
        if self.provider in {"openai", "mock", "stub"}:
            return await self._send_via_mock(prompt)
        logger.warning("Unknown LLM provider '%s', using mock response", self.provider)
        return await self._send_via_mock(prompt)

    def _compose_prompt(self, user_text: str) -> str:
        if self.system_message:
            return f"{self.system_message.strip()}\n\n{user_text.strip()}"
        return user_text

    async def _send_via_mock(self, prompt: str) -> str:
        """Return a deterministic mock response for local development."""
        logger.debug("Using mock LLM response for provider=%s", self.provider)
        return f"[Mock {self.provider}:{self.model}] {prompt}"

    async def _send_via_gemini(self, prompt: str) -> str:
        if not self.api_key or genai is None:
            logger.warning("Gemini provider selected but API key or dependency missing, falling back to mock")
            return await self._send_via_mock(prompt)

        def _run_request() -> str:
            try:
                genai.configure(api_key=self.api_key)
                model_name = self.model or "gemini-1.5-flash"
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if hasattr(response, "text") and response.text:
                    return response.text
                # Fallback through candidates/parts
                for candidate in getattr(response, "candidates", []) or []:
                    content = getattr(candidate, "content", None)
                    if not content:
                        continue
                    parts = getattr(content, "parts", None)
                    if not parts:
                        continue
                    texts = [getattr(part, "text", "") for part in parts if getattr(part, "text", "")]
                    if texts:
                        return "\n".join(texts)
                return ""
            except Exception as exc:  # pragma: no cover - network call
                logger.error("Gemini request failed: %s", exc)
                return ""

        text = await asyncio.to_thread(_run_request)
        if text:
            return text
        return await self._send_via_mock(prompt)

    async def _send_via_huggingface(self, prompt: str) -> str:
        if not self.api_key or not self.model:
            logger.warning("Hugging Face configuration incomplete, falling back to mock")
            return await self._send_via_mock(prompt)

        url = f"https://api-inference.huggingface.co/models/{self.model}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "inputs": prompt,
            "options": {"wait_for_model": True},
        }

        try:
            async with httpx.AsyncClient(timeout=self.http_timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
        except Exception as exc:  # pragma: no cover - network call
            logger.error("Hugging Face request failed: %s", exc)
            return await self._send_via_mock(prompt)

        # Common HF response shapes
        if isinstance(data, list) and data:
            candidate = data[0]
            if isinstance(candidate, dict):
                if "generated_text" in candidate:
                    return candidate["generated_text"]
                if "summary_text" in candidate:
                    return candidate["summary_text"]
        if isinstance(data, dict):
            if "generated_text" in data:
                return data["generated_text"]
            if "token" in data and "generated_text" in data["token"]:
                return data["token"]["generated_text"]

        logger.warning("Unexpected Hugging Face response format, using mock fallback")
        return await self._send_via_mock(prompt)
