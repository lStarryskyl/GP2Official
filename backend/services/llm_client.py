"""LLM client for AI generation with multi-model pipeline support."""

from typing import List, Dict, Any
import logging
import json
from config import settings
from services.ai_pipeline_service import ai_pipeline, TaskType

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for LLM integration."""
    
    def __init__(self):
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model_name = settings.llm_model_name
    
    async def generate(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Generic text generation using AI pipeline."""
        logger.info(f"Generating text with AI pipeline")
        
        result = await ai_pipeline.generate_with_best_model(
            task_type=TaskType.GENERAL,
            prompt=prompt,
            context=context or {}
        )
        
        if result.error:
            logger.error(f"Text generation failed: {result.error}")
            return "{}"
        
        # Return content as string
        if isinstance(result.content, dict):
            return json.dumps(result.content)
        return str(result.content) if result.content else "{}"
    
    async def extract_requirements(self, prompt: str, context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Extract requirements from project brief using AI pipeline."""
        logger.info(f"Extracting requirements with AI pipeline")
        
        result = await ai_pipeline.generate_with_best_model(
            task_type=TaskType.REQUIREMENTS_EXTRACTION,
            prompt=prompt,
            context=context or {}
        )
        
        if result.error:
            logger.error(f"Requirements extraction failed: {result.error}")
            return [
                {
                    "type": "functional",
                    "title": "Requirements Analysis Needed",
                    "description": f"Based on the project brief: {prompt[:200]}...",
                    "priority": "high",
                    "confidence_score": 0.5,
                }
            ]
        
        # Ensure result is a list
        content = result.content
        if isinstance(content, dict) and "requirements" in content:
            content = content["requirements"]
        elif not isinstance(content, list):
            content = [content] if content else []
            
        return content
    
    async def generate_srs(self, prompt: str, requirements: List[Dict], detail_level: str) -> Dict[str, Any]:
        """Generate SRS document using AI pipeline."""
        logger.info(f"Generating SRS with AI pipeline")
        
        # Format requirements for context
        context = {
            "requirements": requirements,
            "detail_level": detail_level,
            "requirement_count": len(requirements)
        }
        
        # Build enhanced prompt
        reqs_text = "\n".join([
            f"{i+1}. {req['title']}: {req['description']}"
            for i, req in enumerate(requirements)
        ])
        
        enhanced_prompt = f"""{prompt}

Requirements:
{reqs_text}

Please generate a comprehensive SRS document following IEEE 830 standards.
Detail level: {detail_level}"""

        result = await ai_pipeline.generate_with_best_model(
            task_type=TaskType.SRS_GENERATION,
            prompt=enhanced_prompt,
            context=context
        )
        
        if result.error:
            logger.error(f"SRS generation failed: {result.error}")
            return {
                "title": "Software Requirements Specification",
                "sections": {"content": f"SRS generation failed: {result.error}"},
                "metadata": {"detail_level": detail_level, "error": True}
            }
        
        # Return structured result
        if isinstance(result.content, dict):
            return result.content
        else:
            return {
                "title": "Software Requirements Specification",
                "sections": {"content": result.content},
                "metadata": {
                    "detail_level": detail_level,
                    "model_used": result.model_name,
                    "tokens_used": result.tokens_used,
                    "cost_usd": result.cost_usd
                }
            }
