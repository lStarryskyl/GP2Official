"""Phase flow generation service."""

from typing import Dict, Tuple
import logging

from config import settings
from emergentintegrations.llm.chat import LlmChat, UserMessage
from repositories.project_repository import ProjectRepository
from models.project import default_phase_status
from repositories.artifact_repository import ArtifactRepository

logger = logging.getLogger(__name__)

PHASE_ORDER = [
    "planning",
    "feasibility_study",
    "requirements_gathering",
    "validation",
    "design",
    "development",
    "tasks",
    "summary",
]

PHASE_TITLES = {
    "planning": "Planning",
    "feasibility_study": "Feasibility Study",
    "requirements_gathering": "Requirements Gathering",
    "validation": "Validation",
    "design": "Design",
    "development": "Development",
    "tasks": "Tasks",
    "summary": "Summary",
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

        # Normalize status to ensure every phase is present and planning is always startable
        normalized_status = default_phase_status()
        normalized_status.update(project.phase_status or {})
        status = dict(normalized_status)
        current_state = status.get(phase)
        if phase == "planning" and current_state == "locked":
            current_state = "ready"
            status[phase] = "ready"
        if current_state == "completed":
            # Allow regenerating completed phases by resetting to ready
            current_state = "ready"
            status[phase] = "ready"
        if current_state not in {"ready", "in_progress"}:
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
        llm_requires_key = self.provider not in {"stub", "mock"}
        if llm_requires_key and not self.api_key:
            logger.warning("LLM API key missing; returning placeholder content")
            return f"# {PHASE_TITLES[phase]}\n\nNo LLM configured. User prompt:\n{user_prompt}"

        system_message = (
            "You are Athena, an expert AI program manager inside the Acorn platform. "
            "You help users through sequential software planning phases. "
            "Provide concise, actionable outputs tailored to the requested phase."
        )
        phase_instructions = {
            "planning": (
                "Craft the Planning Brief: summarize the problem, vision, guardrails, business goals, "
                "key stakeholders, and success metrics. Highlight risks/assumptions and the next decision gates."
            ),
            "feasibility_study": (
                "Produce a comprehensive Feasibility Study: analyze market opportunity, technical feasibility, "
                "economic viability, operational readiness, legal/compliance considerations, and provide a go/no-go recommendation."
            ),
            "requirements_gathering": (
                "Design the Requirements Document: personas, user stories, functional requirements, non-functional requirements, "
                "acceptance criteria, and priority scores. Trace how findings map to downstream tasks."
            ),
            "validation": (
                "Provide the Validation Checklist: stakeholder sign-off criteria, prototype validation steps, risk confirmation, "
                "acceptance criteria verification, and traceability matrix for requirements."
            ),
            "design": (
                "Deliver the Design Document: system architecture overview, component diagrams, data models, "
                "API specifications, UX wireframe descriptions, and integration touchpoints."
            ),
            "development": (
                "Outline the Development Plan: implementation phases, tech stack rationale, quality safeguards, "
                "deployment strategy, coding standards, and handoff checkpoints."
            ),
            "tasks": (
                "Author the Execution Map: break work into epics, stories, and tasks with time estimates. "
                "Define dependencies, milestones, and owner assignments for Gantt visualization."
            ),
            "summary": (
                "Compile the Project Summary: key achievements, final metrics, lessons learned, "
                "outstanding risks, recommendations for future work, and stakeholder acknowledgments."
            ),
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
