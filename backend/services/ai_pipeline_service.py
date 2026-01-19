"""Multi-model AI pipeline for enhanced generation capabilities."""

import asyncio
import time
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import logging
from dataclasses import dataclass
from datetime import datetime
import openai

from config import settings
from utils.cache import cached, get_cached, set_cached

logger = logging.getLogger(__name__)


class ModelProvider(str, Enum):
    """Supported AI model providers."""
    STUB = "stub"
    GEMINI = "gemini"
    HUGGINGFACE = "huggingface"
    GPT = "openai"  # Use "openai" for emergentintegrations compatibility
    CLAUDE = "anthropic"  # Use "anthropic" for emergentintegrations compatibility


class TaskType(str, Enum):
    """Types of AI generation tasks."""
    REQUIREMENTS_EXTRACTION = "requirements_extraction"
    SRS_GENERATION = "srs_generation"
    RISK_ANALYSIS = "risk_analysis"
    CODE_GENERATION = "code_generation"
    DIAGRAM_GENERATION = "diagram_generation"
    COST_ESTIMATION = "cost_estimation"


@dataclass
class ModelConfig:
    """Configuration for a specific model."""
    provider: ModelProvider
    model_name: str
    api_key: Optional[str] = None
    max_tokens: int = 4000
    temperature: float = 0.7
    timeout: int = 30
    cost_per_token: float = 0.0001
    quality_score: float = 0.8  # Historical performance score
    specialties: List[TaskType] = None  # Tasks this model excels at


@dataclass
class GenerationResult:
    """Result from AI generation."""
    provider: ModelProvider
    model_name: str
    content: Any
    tokens_used: int
    duration_ms: int
    cost_usd: float
    quality_score: float
    error: Optional[str] = None
    metadata: Dict[str, Any] = None


class AIModelPipeline:
    """Multi-model AI pipeline with intelligent routing and fallbacks."""
    
    def __init__(self):
        self.models = self._initialize_models()
        self.task_routing = self._setup_task_routing()
        self.performance_cache = {}
        
    def _initialize_models(self) -> Dict[str, ModelConfig]:
        """Initialize available AI models."""
        models = {}
        
        # Always include stub model
        models["stub"] = ModelConfig(
            provider=ModelProvider.STUB,
            model_name="stub",
            cost_per_token=0.0,
            quality_score=0.5,
            specialties=[TaskType.REQUIREMENTS_EXTRACTION, TaskType.SRS_GENERATION]
        )
        
        # Add Gemini if configured
        if settings.gemini_api_key:
            models["gemini-pro"] = ModelConfig(
                provider=ModelProvider.GEMINI,
                model_name="gemini-pro",
                api_key=settings.gemini_api_key,
                cost_per_token=0.00025,
                quality_score=0.85,
                specialties=[TaskType.REQUIREMENTS_EXTRACTION, TaskType.RISK_ANALYSIS, TaskType.CODE_GENERATION]
            )
            
        # Add HuggingFace if configured
        if settings.huggingface_api_key:
            models["huggingface-default"] = ModelConfig(
                provider=ModelProvider.HUGGINGFACE,
                model_name="microsoft/DialoGPT-large",
                api_key=settings.huggingface_api_key,
                cost_per_token=0.0001,
                quality_score=0.75,
                specialties=[TaskType.REQUIREMENTS_EXTRACTION, TaskType.SRS_GENERATION]
            )
        
        # Add OpenAI GPT if configured with a real API key
        if settings.llm_api_key:  # Only add if we have a valid key (not placeholder)
            models["gpt-4"] = ModelConfig(
                provider=ModelProvider.GPT,
                model_name=settings.llm_model_name or "gpt-4",
                api_key=settings.llm_api_key,
                cost_per_token=0.00003,
                quality_score=0.95,
                specialties=[
                    TaskType.REQUIREMENTS_EXTRACTION,
                    TaskType.SRS_GENERATION,
                    TaskType.RISK_ANALYSIS,
                    TaskType.CODE_GENERATION,
                    TaskType.DIAGRAM_GENERATION,
                    TaskType.COST_ESTIMATION
                ]
            )
            logger.info(f"OpenAI GPT model configured: {settings.llm_model_name or 'gpt-4'}")
        else:
            logger.info("No LLM API key configured - using stub model only")
            
        return models
    
    def _setup_task_routing(self) -> Dict[TaskType, List[str]]:
        """Setup routing preferences for different tasks."""
        routing = {
            TaskType.REQUIREMENTS_EXTRACTION: [],
            TaskType.SRS_GENERATION: [],
            TaskType.RISK_ANALYSIS: [],
            TaskType.CODE_GENERATION: [],
            TaskType.DIAGRAM_GENERATION: [],
            TaskType.COST_ESTIMATION: [],
        }
        
        # Prioritize models based on their specialties and quality
        for model_key, config in self.models.items():
            if config.specialties:
                for task_type in config.specialties:
                    if task_type in routing:
                        routing[task_type].append(model_key)
                        
        # Sort by quality score for each task
        for task_type in routing:
            routing[task_type].sort(
                key=lambda model_key: self.models[model_key].quality_score,
                reverse=True
            )
            
        return routing
    
    async def generate_with_best_model(
        self, 
        task_type: TaskType, 
        prompt: str, 
        context: Dict[str, Any] = None,
        fallback: bool = True
    ) -> GenerationResult:
        """Generate content using the best available model for the task."""
        
        preferred_models = self.task_routing.get(task_type, ["stub"])
        
        for model_key in preferred_models:
            try:
                result = await self._generate_with_model(model_key, task_type, prompt, context)
                if result.error is None:
                    # Update performance metrics
                    await self._update_model_performance(model_key, task_type, result)
                    return result
                    
            except Exception as e:
                logger.warning(f"Model {model_key} failed for {task_type}: {e}")
                continue
                
        # If all preferred models fail and fallback is enabled
        if fallback:
            logger.warning(f"All preferred models failed for {task_type}, using stub")
            return await self._generate_with_model("stub", task_type, prompt, context)
            
        # Return error result
        return GenerationResult(
            provider=ModelProvider.STUB,
            model_name="none",
            content=None,
            tokens_used=0,
            duration_ms=0,
            cost_usd=0.0,
            quality_score=0.0,
            error="All models failed and fallback disabled"
        )
    
    async def _generate_with_model(
        self,
        model_key: str,
        task_type: TaskType,
        prompt: str,
        context: Dict[str, Any] = None
    ) -> GenerationResult:
        """Generate content with a specific model."""
        
        model_config = self.models.get(model_key)
        if not model_config:
            raise ValueError(f"Model {model_key} not found")
            
        start_time = time.time()
        
        try:
            # Handle stub model
            if model_config.provider == ModelProvider.STUB:
                content = await self._generate_stub_content(task_type, prompt, context)
                return GenerationResult(
                    provider=model_config.provider,
                    model_name=model_config.model_name,
                    content=content,
                    tokens_used=len(prompt.split()) * 2,  # Estimate
                    duration_ms=int((time.time() - start_time) * 1000),
                    cost_usd=0.0,
                    quality_score=0.5
                )
                
            # Handle real AI models using OpenAI SDK
            client = openai.AsyncOpenAI(api_key=model_config.api_key)
            system_message = self._get_system_message(task_type)
            full_prompt = self._build_contextual_prompt(prompt, context, task_type)
            
            logger.info(f"Calling OpenAI API: model={model_config.model_name}")
            completion = await client.chat.completions.create(
                model=model_config.model_name,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": full_prompt}
                ],
                max_tokens=model_config.max_tokens,
                temperature=model_config.temperature,
            )
            response = completion.choices[0].message.content
            
            # Process response based on task type
            processed_content = await self._process_response(response, task_type)
            
            # Calculate metrics
            tokens_used = completion.usage.total_tokens if completion.usage else len(full_prompt.split()) + len(response.split())
            duration_ms = int((time.time() - start_time) * 1000)
            cost_usd = tokens_used * model_config.cost_per_token
            
            logger.info(f"OpenAI response: {len(response)} chars, {tokens_used} tokens, {duration_ms}ms")
            
            return GenerationResult(
                provider=model_config.provider,
                model_name=model_config.model_name,
                content=processed_content,
                tokens_used=tokens_used,
                duration_ms=duration_ms,
                cost_usd=cost_usd,
                quality_score=model_config.quality_score
            )
            
        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return GenerationResult(
                provider=model_config.provider,
                model_name=model_config.model_name,
                content=None,
                tokens_used=0,
                duration_ms=int((time.time() - start_time) * 1000),
                cost_usd=0.0,
                quality_score=0.0,
                error=str(e)
            )
    
    async def compare_models(
        self,
        task_type: TaskType,
        prompt: str,
        context: Dict[str, Any] = None,
        models_to_compare: List[str] = None
    ) -> Dict[str, GenerationResult]:
        """Compare multiple models on the same task."""
        
        if not models_to_compare:
            models_to_compare = self.task_routing.get(task_type, ["stub"])[:3]  # Top 3
            
        results = {}
        
        # Run models in parallel
        tasks = []
        for model_key in models_to_compare:
            if model_key in self.models:
                task = self._generate_with_model(model_key, task_type, prompt, context)
                tasks.append((model_key, task))
                
        # Wait for all results
        for model_key, task in tasks:
            try:
                result = await task
                results[model_key] = result
            except Exception as e:
                logger.error(f"Model comparison failed for {model_key}: {e}")
                
        return results
    
    def _get_system_message(self, task_type: TaskType) -> str:
        """Get system message based on task type."""
        
        messages = {
            TaskType.REQUIREMENTS_EXTRACTION: """You are an expert software requirements analyst. 
                Extract clear, actionable requirements from project descriptions. 
                Return structured JSON with type, title, description, priority, and confidence.""",
                
            TaskType.SRS_GENERATION: """You are a technical writer specializing in IEEE 830-compliant 
                Software Requirements Specifications. Generate comprehensive, well-structured documents.""",
                
            TaskType.RISK_ANALYSIS: """You are a senior software project risk analyst. 
                Identify potential risks, assess their impact and probability, and suggest mitigation strategies.""",
                
            TaskType.CODE_GENERATION: """You are a senior software developer. 
                Generate clean, efficient, well-documented code following best practices.""",
                
            TaskType.DIAGRAM_GENERATION: """You are a software architect specializing in system design. 
                Generate PlantUML diagrams that clearly represent system architecture and relationships.""",
                
            TaskType.COST_ESTIMATION: """You are a software project manager with expertise in cost estimation. 
                Provide realistic cost estimates based on project scope and complexity."""
        }
        
        return messages.get(task_type, "You are a helpful AI assistant.")
    
    def _build_contextual_prompt(
        self, 
        prompt: str, 
        context: Dict[str, Any], 
        task_type: TaskType
    ) -> str:
        """Build contextual prompt with relevant information."""
        
        context_parts = [prompt]
        
        if context:
            if context.get("project_name"):
                context_parts.append(f"Project: {context['project_name']}")
                
            if context.get("project_type"):
                context_parts.append(f"Type: {context['project_type']}")
                
            if context.get("existing_requirements"):
                context_parts.append(f"Existing requirements: {len(context['existing_requirements'])} items")
                
            if context.get("technology_stack"):
                context_parts.append(f"Tech stack: {', '.join(context['technology_stack'])}")
                
        return "\n\n".join(context_parts)
    
    async def _process_response(self, response: str, task_type: TaskType) -> Any:
        """Process AI response based on task type."""
        
        if task_type == TaskType.REQUIREMENTS_EXTRACTION:
            # Try to parse JSON response
            import json
            try:
                # Handle markdown code blocks
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0].strip()
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0].strip()
                    
                return json.loads(response)
            except json.JSONDecodeError:
                # Return as structured text if JSON parsing fails
                return [{"type": "functional", "title": "Generated Requirement", 
                        "description": response, "priority": "medium", "confidence_score": 0.7}]
                        
        elif task_type == TaskType.DIAGRAM_GENERATION:
            # Extract PlantUML code
            if "@startuml" in response and "@enduml" in response:
                start = response.find("@startuml")
                end = response.find("@enduml") + 8
                return response[start:end]
            else:
                # Wrap response in PlantUML format
                return f"@startuml\n{response}\n@enduml"
                
        return response
    
    async def _generate_stub_content(
        self, 
        task_type: TaskType, 
        prompt: str, 
        context: Dict[str, Any] = None
    ) -> Any:
        """Generate stub content for testing/fallback."""
        
        await asyncio.sleep(0.1)  # Simulate processing time
        
        if task_type == TaskType.REQUIREMENTS_EXTRACTION:
            return [{
                "type": "functional",
                "title": "Mock Requirement",
                "description": f"Generated from: {prompt[:100]}...",
                "priority": "medium",
                "confidence_score": 0.7
            }]
            
        elif task_type == TaskType.SRS_GENERATION:
            return {
                "title": "Mock Software Requirements Specification",
                "sections": {"content": f"Mock SRS content based on: {prompt[:200]}..."},
                "metadata": {"generated": True}
            }
            
        elif task_type == TaskType.RISK_ANALYSIS:
            return [{
                "risk_id": "MOCK_001",
                "title": "Mock Risk",
                "description": "This is a mock risk for testing purposes",
                "impact": "medium",
                "probability": "low",
                "mitigation": "Mock mitigation strategy"
            }]
            
        return f"Mock response for {task_type}: {prompt[:200]}..."
    
    async def _update_model_performance(
        self,
        model_key: str,
        task_type: TaskType,
        result: GenerationResult
    ):
        """Update model performance metrics."""
        
        cache_key = f"model_performance:{model_key}:{task_type}"
        
        # Get existing metrics
        metrics = await get_cached(cache_key) or {
            "total_requests": 0,
            "successful_requests": 0,
            "average_duration": 0,
            "average_cost": 0,
            "quality_scores": []
        }
        
        # Update metrics
        metrics["total_requests"] += 1
        if result.error is None:
            metrics["successful_requests"] += 1
            
        # Running averages
        metrics["average_duration"] = (
            (metrics["average_duration"] * (metrics["total_requests"] - 1) + result.duration_ms) 
            / metrics["total_requests"]
        )
        
        metrics["average_cost"] = (
            (metrics["average_cost"] * (metrics["total_requests"] - 1) + result.cost_usd)
            / metrics["total_requests"]
        )
        
        # Keep last 100 quality scores
        metrics["quality_scores"].append(result.quality_score)
        if len(metrics["quality_scores"]) > 100:
            metrics["quality_scores"] = metrics["quality_scores"][-100:]
            
        # Cache updated metrics
        await set_cached(cache_key, metrics, ttl=86400)  # 24 hours
    
    async def get_model_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics for all models."""
        
        stats = {}
        
        for model_key in self.models:
            model_stats = {"tasks": {}}
            
            for task_type in TaskType:
                cache_key = f"model_performance:{model_key}:{task_type}"
                metrics = await get_cached(cache_key)
                
                if metrics:
                    success_rate = metrics["successful_requests"] / metrics["total_requests"]
                    avg_quality = sum(metrics["quality_scores"]) / len(metrics["quality_scores"])
                    
                    model_stats["tasks"][task_type.value] = {
                        "success_rate": success_rate,
                        "average_duration_ms": metrics["average_duration"],
                        "average_cost_usd": metrics["average_cost"],
                        "average_quality": avg_quality,
                        "total_requests": metrics["total_requests"]
                    }
                    
            stats[model_key] = model_stats
            
        return stats


# Global pipeline instance
ai_pipeline = AIModelPipeline()
