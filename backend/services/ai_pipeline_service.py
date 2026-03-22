"""
AI Pipeline Service
===================
Thin orchestration layer that delegates all AI generation to the
GeminiOrchestrator.  The public interface (AIModelPipeline / ai_pipeline) is
preserved so that existing callers don't need to change.
"""

import asyncio
import time
import logging
from typing import Any, Dict, List, Optional
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime

from config import settings
from utils.cache import cached, get_cached, set_cached
from services.gemini_orchestrator import gemini_orchestrator

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public enums / dataclasses (kept for backward compatibility)
# ---------------------------------------------------------------------------

class ModelProvider(str, Enum):
    STUB = "stub"
    GEMINI = "gemini"
    HUGGINGFACE = "huggingface"
    GPT = "openai"
    CLAUDE = "anthropic"


class TaskType(str, Enum):
    GENERAL = "general"
    REQUIREMENTS_EXTRACTION = "requirements_extraction"
    SRS_GENERATION = "srs_generation"
    RISK_ANALYSIS = "risk_analysis"
    CODE_GENERATION = "code_generation"
    DIAGRAM_GENERATION = "diagram_generation"
    COST_ESTIMATION = "cost_estimation"
    PERSONA_GENERATION = "persona_generation"
    FEASIBILITY_ANALYSIS = "feasibility_analysis"
    SYSTEM_DESIGN = "system_design"


@dataclass
class ModelConfig:
    provider: ModelProvider
    model_name: str
    api_key: Optional[str] = None
    max_tokens: int = 4000
    temperature: float = 0.7
    timeout: int = 60
    cost_per_token: float = 0.0001
    quality_score: float = 0.9
    specialties: List[TaskType] = field(default_factory=list)


@dataclass
class GenerationResult:
    provider: ModelProvider
    model_name: str
    content: Any
    tokens_used: int
    duration_ms: int
    cost_usd: float
    quality_score: float
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Mapping from TaskType enum values to orchestrator task_type strings
# ---------------------------------------------------------------------------
_TASK_TYPE_MAP: Dict[str, str] = {
    TaskType.REQUIREMENTS_EXTRACTION: "requirements_extraction",
    TaskType.SRS_GENERATION: "srs_generation",
    TaskType.RISK_ANALYSIS: "risk_analysis",
    TaskType.DIAGRAM_GENERATION: "diagram_generation",
    TaskType.COST_ESTIMATION: "cost_estimation",
    TaskType.PERSONA_GENERATION: "persona_generation",
    TaskType.FEASIBILITY_ANALYSIS: "feasibility_analysis",
    TaskType.SYSTEM_DESIGN: "system_design",
}


# ---------------------------------------------------------------------------
# Stub content generator (fallback when Gemini is unavailable)
# ---------------------------------------------------------------------------

async def _stub_content(task_type: TaskType, prompt: str, context: Dict[str, Any]) -> Any:
    await asyncio.sleep(0.05)
    project_name = (context or {}).get("project_name", "Unknown Project")
    if task_type == TaskType.REQUIREMENTS_EXTRACTION:
        return {
            "requirements": [
                {
                    "type": "functional",
                    "title": "Stub Requirement",
                    "description": f"Stub requirement generated for: {project_name}",
                    "priority": "medium",
                    "acceptance_criteria": ["System behaves as described"],
                    "confidence": 0.5,
                }
            ],
            "summary": "Stub content – Gemini API not available.",
        }
    if task_type == TaskType.SRS_GENERATION:
        return f"# {project_name} – SRS\n\nStub SRS generated.  Gemini API not available."
    if task_type == TaskType.RISK_ANALYSIS:
        return {
            "risks": [
                {
                    "risk_id": "STUB-001",
                    "title": "Stub Risk",
                    "description": "Stub risk entry – Gemini API not available.",
                    "category": "technical",
                    "impact": "low",
                    "probability": "low",
                    "risk_score": 1,
                    "mitigation": "Enable Gemini API.",
                    "contingency": "Use manual analysis.",
                    "owner": "Project Manager",
                }
            ],
            "overall_risk_level": "low",
            "risk_summary": "Stub content.",
        }
    if task_type == TaskType.DIAGRAM_GENERATION:
        return "@startuml\nactor User\nUser -> System : request\n@enduml"
    return f"Stub response for {task_type.value}: {prompt[:200]}"


# ---------------------------------------------------------------------------
# Main pipeline class
# ---------------------------------------------------------------------------

class AIModelPipeline:
    """
    Wraps GeminiOrchestrator behind the same interface that the rest of the
    application already uses.  Adds stub fallback, performance metric caching,
    and the compare_models helper.
    """

    def __init__(self):
        self.orchestrator = gemini_orchestrator
        self._gemini_model_config = ModelConfig(
            provider=ModelProvider.GEMINI,
            model_name=settings.gemini_pro_model,
            api_key=settings.gemini_api_key,
            quality_score=0.95,
            specialties=list(TaskType),
        )
        self._stub_config = ModelConfig(
            provider=ModelProvider.STUB,
            model_name="stub",
            quality_score=0.5,
            specialties=list(TaskType),
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_with_best_model(
        self,
        task_type: TaskType,
        prompt: str,
        context: Dict[str, Any] = None,
        fallback: bool = True,
    ) -> GenerationResult:
        """
        Generate content using the GeminiOrchestrator.
        Falls back to stub content if Gemini is unavailable and fallback=True.
        """
        context = context or {}
        # Merge the raw prompt into context so agents can use it if needed
        if prompt and "description" not in context:
            context["description"] = prompt

        orchestrator_task = _TASK_TYPE_MAP.get(task_type)
        start = time.time()

        if orchestrator_task:
            result = await self.orchestrator.run(orchestrator_task, context)
            duration_ms = int((time.time() - start) * 1000)

            if result["success"]:
                gen_result = GenerationResult(
                    provider=ModelProvider.GEMINI,
                    model_name=result.get("model", settings.gemini_pro_model),
                    content=result["content"],
                    tokens_used=0,   # Gemini SDK doesn't expose token count easily
                    duration_ms=duration_ms,
                    cost_usd=0.0,
                    quality_score=0.95,
                    metadata={"agent": result.get("agent")},
                )
                await self._update_model_performance("gemini", task_type, gen_result)
                return gen_result

            # Orchestrator failed
            error_msg = result.get("error", "Unknown Gemini error")
            logger.warning("[AIModelPipeline] Orchestrator failed for %s: %s", task_type, error_msg)

            if fallback:
                content = await _stub_content(task_type, prompt, context)
                return GenerationResult(
                    provider=ModelProvider.STUB,
                    model_name="stub",
                    content=content,
                    tokens_used=0,
                    duration_ms=int((time.time() - start) * 1000),
                    cost_usd=0.0,
                    quality_score=0.5,
                    error=error_msg,
                )

            return GenerationResult(
                provider=ModelProvider.GEMINI,
                model_name=result.get("model", "unknown"),
                content=None,
                tokens_used=0,
                duration_ms=duration_ms,
                cost_usd=0.0,
                quality_score=0.0,
                error=error_msg,
            )

        # task_type has no orchestrator mapping (e.g. GENERAL, CODE_GENERATION)
        # Fall through to stub
        logger.info("[AIModelPipeline] No orchestrator agent for %s – using stub", task_type)
        content = await _stub_content(task_type, prompt, context)
        return GenerationResult(
            provider=ModelProvider.STUB,
            model_name="stub",
            content=content,
            tokens_used=0,
            duration_ms=int((time.time() - start) * 1000),
            cost_usd=0.0,
            quality_score=0.5,
        )

    async def compare_models(
        self,
        task_type: TaskType,
        prompt: str,
        context: Dict[str, Any] = None,
        models_to_compare: List[str] = None,
    ) -> Dict[str, GenerationResult]:
        """
        Compare models on the same task.  With Gemini-only setup this simply
        returns the single Gemini result keyed by model name.
        """
        result = await self.generate_with_best_model(task_type, prompt, context)
        return {result.model_name: result}

    async def get_model_performance_stats(self) -> Dict[str, Any]:
        """Return cached performance statistics."""
        stats: Dict[str, Any] = {}
        for model_key in ("gemini", "stub"):
            model_stats: Dict[str, Any] = {"tasks": {}}
            for task_type in TaskType:
                cache_key = f"model_performance:{model_key}:{task_type}"
                metrics = await get_cached(cache_key)
                if metrics and metrics.get("total_requests", 0) > 0:
                    total = metrics["total_requests"]
                    success = metrics["successful_requests"]
                    scores = metrics.get("quality_scores", [1.0])
                    model_stats["tasks"][task_type.value] = {
                        "success_rate": success / total,
                        "average_duration_ms": metrics.get("average_duration", 0),
                        "average_cost_usd": metrics.get("average_cost", 0),
                        "average_quality": sum(scores) / len(scores),
                        "total_requests": total,
                    }
            stats[model_key] = model_stats
        return stats

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _update_model_performance(
        self,
        model_key: str,
        task_type: TaskType,
        result: GenerationResult,
    ) -> None:
        cache_key = f"model_performance:{model_key}:{task_type}"
        metrics = await get_cached(cache_key) or {
            "total_requests": 0,
            "successful_requests": 0,
            "average_duration": 0.0,
            "average_cost": 0.0,
            "quality_scores": [],
        }

        n = metrics["total_requests"] + 1
        metrics["total_requests"] = n
        if result.error is None:
            metrics["successful_requests"] += 1

        metrics["average_duration"] = (
            (metrics["average_duration"] * (n - 1) + result.duration_ms) / n
        )
        metrics["average_cost"] = (
            (metrics["average_cost"] * (n - 1) + result.cost_usd) / n
        )
        scores = metrics["quality_scores"]
        scores.append(result.quality_score)
        if len(scores) > 100:
            metrics["quality_scores"] = scores[-100:]

        await set_cached(cache_key, metrics, ttl=86400)


# ---------------------------------------------------------------------------
# Module-level singleton (same name as before)
# ---------------------------------------------------------------------------
ai_pipeline = AIModelPipeline()
