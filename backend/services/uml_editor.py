"""LLM-powered editor for existing PlantUML diagrams."""

from typing import Tuple

import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage

from config import settings

logger = logging.getLogger(__name__)


class UmlEditorService:
    """Service that refines existing PlantUML code based on natural language instructions."""

    def __init__(self) -> None:
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name

    async def apply_instruction(self, plantuml: str, instruction: str) -> str:
        """Return updated PlantUML after applying a user instruction."""
        if not self.api_key:
            logger.warning("LLM API key not configured; returning original PlantUML")
            return plantuml

        chat = LlmChat(
            api_key=self.api_key,
            session_id="uml_edit",
            system_message=(
                "You are a UML and PlantUML expert.\n"
                "You are given existing PlantUML code for a diagram and an editing instruction.\n"
                "Update the PlantUML so that the diagram reflects the requested change.\n"
                "Return ONLY valid PlantUML code starting with '@startuml' and ending with '@enduml'. "
                "Do not include explanations, markdown, or any surrounding prose."
            ),
        ).with_model(self.provider, self.model)

        prompt = (
            "Here is the current PlantUML diagram:\n\n"
            f"```plantuml\n{plantuml}\n```\n\n"
            "User instruction:\n"
            f"{instruction}\n\n"
            "Respond with only the updated PlantUML code."
        )

        try:
            response = await chat.send_message(UserMessage(text=prompt))
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("UML editor LLM call failed: %s", exc)
            return plantuml

        cleaned = self._extract_plantuml(response.strip())
        if not cleaned:
            logger.warning("Failed to extract PlantUML from LLM response; keeping original diagram")
            return plantuml
        return cleaned

    def _extract_plantuml(self, text: str) -> str:
        """Strip markdown fences and keep only the PlantUML block."""
        # Remove common markdown fences
        if "```" in text:
            parts = text.split("```")
            # Heuristic: last non-empty fenced block
            for block in reversed(parts):
                candidate = block.strip()
                if candidate and candidate.lower().startswith("@startuml"):
                    return candidate

        if text.lower().startswith("@startuml") and "@enduml" in text.lower():
            return text

        return ""
