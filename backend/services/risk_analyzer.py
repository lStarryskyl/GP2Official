"""Risk analysis and mitigation service."""

from typing import List, Dict, Any
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
from config import settings

logger = logging.getLogger(__name__)


class RiskAnalyzer:
    """AI-powered risk analysis for projects."""
    
    def __init__(self):
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name
    
    async def analyze_project_risks(self, project_data: Dict, requirements: List[Dict]) -> Dict[str, Any]:
        """Analyze potential risks for the project."""
        
        logger.info(f"Analyzing risks for project: {project_data.get('name')}")
        
        # Build context
        context = f"""Project: {project_data.get('name')}
Type: {project_data.get('template_type')}
Description: {project_data.get('description')}

Key Requirements: {len(requirements)}
Functional: {sum(1 for r in requirements if r.get('type') == 'functional')}
Non-Functional: {sum(1 for r in requirements if r.get('type') == 'non_functional')}
"""
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id="risk_analysis",
            system_message="""You are a senior software architect and risk management expert.
Identify potential risks, their impact, probability, and mitigation strategies."""
        ).with_model("openai", self.model)
        
        prompt = f"""{context}

Analyze potential risks for this project and return as JSON:

{{
  "risks": [
    {{
      "category": "technical|schedule|resource|business",
      "title": "Risk name",
      "description": "What could go wrong",
      "probability": "low|medium|high",
      "impact": "low|medium|high|critical",
      "mitigation": "How to prevent or reduce this risk"
    }}
  ],
  "overall_risk_level": "low|medium|high",
  "recommendations": ["Key recommendation 1", "Key recommendation 2"]
}}

Identify 5-8 key risks covering technical complexity, timeline, resources, and business factors."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        try:
            import json
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            risk_data = json.loads(response_text)
            return risk_data
        except Exception as e:
            logger.error(f"Failed to parse risk analysis: {e}")
            return self._generate_basic_risks(project_data, requirements)
    
    def _generate_basic_risks(self, project_data: Dict, requirements: List[Dict]) -> Dict:
        """Generate basic risk assessment as fallback."""
        req_count = len(requirements)
        complexity = "high" if req_count > 20 else "medium" if req_count > 10 else "low"
        
        return {
            "risks": [
                {
                    "category": "technical",
                    "title": "Technical Complexity",
                    "description": f"Project has {req_count} requirements which may increase implementation complexity",
                    "probability": complexity,
                    "impact": "high",
                    "mitigation": "Break down complex features into smaller, manageable tasks. Conduct technical spikes for unknowns."
                },
                {
                    "category": "schedule",
                    "title": "Timeline Risks",
                    "description": "Project timeline may be affected by requirement changes or unforeseen challenges",
                    "probability": "medium",
                    "impact": "medium",
                    "mitigation": "Build buffer time into schedule. Use agile methodology for flexibility."
                },
                {
                    "category": "resource",
                    "title": "Resource Availability",
                    "description": "Team availability and skill set match may impact delivery",
                    "probability": "medium",
                    "impact": "high",
                    "mitigation": "Ensure team has required skills. Plan for knowledge transfer and documentation."
                }
            ],
            "overall_risk_level": complexity,
            "recommendations": [
                "Start with high-priority, high-risk features first",
                "Implement continuous testing and integration",
                "Regular stakeholder communication and demos"
            ]
        }
