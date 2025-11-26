"""Phase flow generation service."""

from typing import Dict, Tuple
import logging

from config import settings
from emergentintegrations.llm.chat import LlmChat, UserMessage
from repositories.project_repository import ProjectRepository
from repositories.artifact_repository import ArtifactRepository

logger = logging.getLogger(__name__)

PHASE_ORDER = [
    "planning",
    "cost_benefit",
    "tasks",
    "requirements_gathering",
    "requirements_validation",
    "design_architecture",
    "development",
]

PHASE_TITLES = {
    "planning": "Planning",
    "cost_benefit": "Cost & Benefit",
    "tasks": "Tasks",
    "requirements_gathering": "Requirements Gathering",
    "requirements_validation": "Requirements Validation",
    "design_architecture": "Design Architecture",
    "development": "Development",
}


class PhaseFlowService:
    """Manage sequential phase generation and storage."""

    def __init__(self):
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name
        self.project_repo = ProjectRepository()
        self.artifact_repo = ArtifactRepository()

    async def get_status(self, project_id: str, organization: str) -> Dict[str, str]:
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")
        return project.phase_status

    async def unlock_all(self, project_id: str, organization: str) -> Dict[str, str]:
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")
        updated = {phase: "ready" for phase in PHASE_ORDER}
        project = await self.project_repo.update_phase_status(project_id, organization, updated)
        return project.phase_status

    async def generate_phase(self, project_id: str, organization: str, phase: str, prompt: str) -> Tuple[Dict[str, str], Dict]:
        phase = phase.lower()
        if phase not in PHASE_ORDER:
            raise ValueError("Invalid phase")

        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")

        status = dict(project.phase_status)
        if status.get(phase) not in {"ready", "in_progress"}:
            raise PermissionError("This phase is locked. Complete previous phases first.")

        status[phase] = "in_progress"
        await self.project_repo.update_phase_status(project_id, organization, status)

        content = await self._run_phase_prompt(project.name, phase, prompt)

        artifact_type = f"PHASE_{phase.upper()}"
        metadata = {"phase": phase}
        artifact = await self.artifact_repo.upsert_artifact(
            project_id,
            artifact_type,
            f"{PHASE_TITLES[phase]} Output",
            {"markdown": content},
            metadata=metadata,
        )

        status[phase] = "completed"
        next_index = PHASE_ORDER.index(phase) + 1
        if next_index < len(PHASE_ORDER):
            next_phase = PHASE_ORDER[next_index]
            if status.get(next_phase) == "locked":
                status[next_phase] = "ready"
        updated_project = await self.project_repo.update_phase_status(project_id, organization, status)

        return updated_project.phase_status, {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "metadata": artifact.metadata,
        }

    async def _run_phase_prompt(self, project_name: str, phase: str, user_prompt: str) -> str:
        if not self.api_key:
            logger.warning("LLM API key missing; returning placeholder content")
            return f"# {PHASE_TITLES[phase]}\n\nNo LLM configured. User prompt:\n{user_prompt}"

        system_message = (
            "You are Athena, an expert AI program manager inside the Acorn platform. "
            "You help users through sequential software planning phases. "
            "Provide concise, actionable outputs tailored to the requested phase."
        )
        phase_instructions = {
            "planning": "Create a focused project plan: goals, constraints, key stakeholders, success metrics.",
            "cost_benefit": "Analyze benefits, costs, ROI, and recommend go/no-go rationale.",
            "tasks": "Break work into actionable epics/tasks with rough sequencing and dependencies.",
            "requirements_gathering": "Outline requirement elicitation approach, personas, and sample questions.",
            "requirements_validation": "Describe validation techniques, acceptance criteria, and traceability approach.",
            "design_architecture": "Recommend high-level architecture, components, integrations, and tech considerations.",
            "development": "Suggest implementation strategy, tech stack guidance, and quality safeguards (no code).",
        }
        user_prompt = user_prompt.strip() or "Use available project context."
        phase_text = phase_instructions.get(phase, "")
        prompt = (
            f"Project: {project_name}\n"
            f"Phase: {PHASE_TITLES[phase]}\n"
            f"System expectations: {phase_text}\n"
            f"User request: {user_prompt}\n\n"
            "Produce a structured Markdown response with headings, bullet lists, and clear action items."
        )

        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"phase_{phase}",
            system_message=system_message,
        ).with_model(self.provider, self.model)

        try:
            response = await chat.send_message(UserMessage(text=prompt))
            return response
        except Exception as exc:  # pragma: no cover
            logger.error("Failed to generate phase output: %s", exc)
            return f"# {PHASE_TITLES[phase]}\n\nWe encountered an error generating this phase. Please try again later."
