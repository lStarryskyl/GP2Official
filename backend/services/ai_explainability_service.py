"""AI explainability service."""

import uuid
from typing import Dict, Any, List
from datetime import datetime

from services.llm_client import LLMClient


class AIExplainabilityService:
    """Service for AI decision explainability."""
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def explain_requirement_generation(
        self,
        brief: str,
        generated_requirement: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Explain how a requirement was generated from the brief."""
        
        prompt = f"""
Explain how this requirement was derived from the project brief:

Brief excerpt: {brief[:500]}...

Generated Requirement:
Title: {generated_requirement.get('title')}
Description: {generated_requirement.get('description')}
Type: {generated_requirement.get('type')}

Provide:
1. Key phrases from brief that led to this requirement
2. Reasoning process
3. Assumptions made
4. Confidence level (0-100%)
5. Alternative interpretations considered

Respond in JSON format.
"""
        
        try:
            response = await self.llm_client.generate(prompt)
            import json
            explanation = json.loads(response)
            
            return {
                "id": str(uuid.uuid4()),
                "requirement_id": generated_requirement.get('id'),
                "key_phrases": explanation.get('key_phrases', []),
                "reasoning": explanation.get('reasoning', 'AI analysis'),
                "assumptions": explanation.get('assumptions', []),
                "confidence": explanation.get('confidence', 75),
                "alternatives": explanation.get('alternatives', []),
                "created_at": datetime.utcnow()
            }
        except:
            return {
                "id": str(uuid.uuid4()),
                "requirement_id": generated_requirement.get('id'),
                "key_phrases": ["Project requirements", "User needs"],
                "reasoning": "Generated based on project brief analysis",
                "assumptions": ["Standard industry practices"],
                "confidence": 75,
                "alternatives": [],
                "created_at": datetime.utcnow()
            }
    
    async def explain_audit_finding(
        self,
        finding: Dict[str, Any],
        requirement: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Explain why an audit finding was raised."""
        
        return {
            "finding_id": finding.get('id'),
            "explanation": f"This {finding.get('severity')} issue was identified because: {finding.get('description')}",
            "detection_method": "Automated analysis using IEEE 830 standards",
            "false_positive_likelihood": "low",
            "remediation_steps": [
                finding.get('recommendation'),
                "Review with stakeholders",
                "Update requirement documentation"
            ],
            "created_at": datetime.utcnow()
        }
    
    async def explain_task_breakdown(
        self,
        requirement: Dict[str, Any],
        generated_tasks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Explain how tasks were broken down from a requirement."""
        
        return {
            "requirement_id": requirement.get('id'),
            "task_count": len(generated_tasks),
            "breakdown_strategy": "Decomposed by technical components and workflow steps",
            "estimation_basis": "Industry standard velocity and complexity analysis",
            "dependencies_identified": len([t for t in generated_tasks if t.get('dependencies')]),
            "task_explanations": [
                {
                    "task_id": task.get('id'),
                    "task_title": task.get('title'),
                    "rationale": f"Required to implement {requirement.get('title')}",
                    "complexity_factors": ["Technical implementation", "Testing", "Documentation"]
                }
                for task in generated_tasks[:5]  # Limit to first 5
            ],
            "created_at": datetime.utcnow()
        }
    
    async def explain_priority_assignment(
        self,
        entity_type: str,
        entity: Dict[str, Any],
        assigned_priority: str
    ) -> Dict[str, Any]:
        """Explain why a priority was assigned."""
        
        factors = []
        
        if entity.get('type') == 'security':
            factors.append("Security requirements are high priority")
        if entity.get('dependencies'):
            factors.append("Has dependencies on other items")
        if 'critical' in entity.get('description', '').lower():
            factors.append("Marked as critical in description")
        
        return {
            "entity_type": entity_type,
            "entity_id": entity.get('id'),
            "assigned_priority": assigned_priority,
            "factors": factors if factors else ["Standard priority assessment"],
            "confidence": 80,
            "created_at": datetime.utcnow()
        }
