"""LLM client for AI generation."""

from typing import List, Dict, Any
import logging
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
from config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for LLM integration."""
    
    def __init__(self):
        self.provider = settings.llm_provider
        self.api_key = settings.llm_api_key
        self.model_name = settings.llm_model_name
    
    async def extract_requirements(self, prompt: str) -> List[Dict[str, Any]]:
        """Extract requirements from project brief."""
        logger.info(f"Extracting requirements with LLM ({self.provider}/{self.model_name})")
        
        # Create chat instance
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"req_extract_{hash(prompt)}",
            system_message="""You are an expert software requirements analyst. 
Your task is to extract clear, actionable software requirements from project briefs.
Return requirements as a JSON array with the following structure:
[
  {
    "type": "functional" or "non_functional",
    "title": "Brief requirement title",
    "description": "Detailed requirement description",
    "priority": "low", "medium", "high", or "critical",
    "confidence_score": 0.0 to 1.0
  }
]"""
        ).with_model(self.provider, self.model_name)
        
        # Create user message
        user_message = UserMessage(
            text=f"""{prompt}

Please extract and return software requirements in JSON format."""
        )
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Try to extract JSON from the response
            response_text = response.strip()
            
            # Handle markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            requirements = json.loads(response_text)
            
            # Ensure it's a list
            if isinstance(requirements, dict) and "requirements" in requirements:
                requirements = requirements["requirements"]
            
            return requirements
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Response: {response}")
            # Return a default requirement if parsing fails
            return [
                {
                    "type": "functional",
                    "title": "Requirements Analysis Needed",
                    "description": f"Based on the project brief: {prompt[:200]}...",
                    "priority": "high",
                    "confidence_score": 0.5,
                }
            ]
    
    async def generate_srs(self, prompt: str, requirements: List[Dict], detail_level: str) -> Dict[str, Any]:
        """Generate SRS document."""
        logger.info(f"Generating SRS with LLM ({self.provider}/{self.model_name})")
        
        # Create chat instance
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"srs_gen_{hash(prompt)}",
            system_message="You are an expert technical writer specializing in IEEE 830-compliant Software Requirements Specifications."
        ).with_model(self.provider, self.model_name)
        
        # Format requirements for the prompt
        reqs_text = "\n".join([
            f"{i+1}. {req['title']}: {req['description']}"
            for i, req in enumerate(requirements)
        ])
        
        user_message = UserMessage(
            text=f"""{prompt}

Requirements:
{reqs_text}

Please generate a comprehensive SRS document following IEEE 830 standards.
Detail level: {detail_level}"""
        )
        
        response = await chat.send_message(user_message)
        
        return {
            "title": "Software Requirements Specification",
            "sections": {"content": response},
            "metadata": {"detail_level": detail_level}
        }
