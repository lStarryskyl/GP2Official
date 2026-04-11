"""Enhanced SRS generation service."""

from typing import List, Dict, Any
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
from config import settings
from services.markdown_formatter import MarkdownFormatter

logger = logging.getLogger(__name__)


class SRSGenerator:
    """Advanced SRS document generator."""
    
    def __init__(self):
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name
        self.formatter = MarkdownFormatter()
    
    async def generate_complete_srs(self, project_data: Dict, requirements: List[Dict]) -> Dict[str, Any]:
        """Generate a comprehensive IEEE 830-compliant SRS document."""
        
        logger.info(f"Generating comprehensive SRS for project: {project_data.get('name')}")
        
        # Build context
        context = self._build_context(project_data, requirements)
        
        # Generate each section
        sections = {}
        
        # 1. Introduction
        sections['introduction'] = await self._generate_introduction(context)
        
        # 2. Overall Description
        sections['overall_description'] = await self._generate_overall_description(context)
        
        # 3. Functional Requirements
        sections['functional_requirements'] = await self._generate_functional_requirements(requirements)
        
        # 4. Non-Functional Requirements
        sections['non_functional_requirements'] = await self._generate_non_functional_requirements(requirements)
        
        # 5. System Features
        sections['system_features'] = await self._generate_system_features(requirements)
        
        formatted_sections = {
            key: self.formatter.format(value, artifact_type=f"srs:{key}")
            for key, value in sections.items()
        }

        return {
            'title': f"Software Requirements Specification - {project_data.get('name')}",
            'version': '1.0',
            'sections': formatted_sections,
            'metadata': {
                'project_name': project_data.get('name'),
                'requirements_count': len(requirements),
                'standard': 'IEEE 830',
                'generated_by': 'Acorn AI'
            }
        }
    
    def _build_context(self, project_data: Dict, requirements: List[Dict]) -> str:
        """Build comprehensive context for SRS generation."""
        
        func_reqs = [r for r in requirements if r.get('type') == 'functional']
        non_func_reqs = [r for r in requirements if r.get('type') == 'non_functional']
        
        return f"""Project: {project_data.get('name')}
Description: {project_data.get('description', '')}
Template: {project_data.get('template_type', 'web_app')}

Brief:
{project_data.get('brief_text', 'Not provided')}

Total Requirements: {len(requirements)}
Functional: {len(func_reqs)}
Non-Functional: {len(non_func_reqs)}
"""
    
    async def _generate_introduction(self, context: str) -> str:
        """Generate introduction section."""
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id="srs_intro",
            system_message="""You are a technical writer specializing in IEEE 830 SRS documents. 
Generate clear, professional introductions that set the context for the software project."""
        ).with_model("openai", self.model)
        
        prompt = f"""Based on this project context, write an IEEE 830-compliant Introduction section including:
1. Purpose
2. Scope
3. Definitions and Acronymsss
4. References

{context}

Keep it concise but comprehensive."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    
    async def _generate_overall_description(self, context: str) -> str:
        """Generate overall description section."""
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id="srs_overview",
            system_message="You are a technical writer creating comprehensive software overviews."
        ).with_model("openai", self.model)
        
        prompt = f"""Write the Overall Description section including:
1. Product Perspective
2. Product Functions
3. User Characteristics
4. General Constraints
5. Assumptions and Dependencies

{context}"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    
    async def _generate_functional_requirements(self, requirements: List[Dict]) -> str:
        """Generate detailed functional requirements."""
        
        func_reqs = [r for r in requirements if r.get('type') == 'functional']
        if not func_reqs:
            return "No functional requirements specified."
        
        reqs_text = "\n".join([
            f"{i+1}. {req['title']}: {req['description']}"
            for i, req in enumerate(func_reqs)
        ])
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id="srs_func_reqs",
            system_message="You are a requirements analyst creating detailed functional specifications."
        ).with_model("openai", self.model)
        
        prompt = f"""Expand these functional requirements with:
- Detailed descriptions
- Input/Output specifications
- Processing rules
- Error handling

Requirements:
{reqs_text}"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    
    async def _generate_non_functional_requirements(self, requirements: List[Dict]) -> str:
        """Generate non-functional requirements."""
        
        non_func_reqs = [r for r in requirements if r.get('type') == 'non_functional']
        if not non_func_reqs:
            return "No non-functional requirements specified."
        
        reqs_text = "\n".join([
            f"{i+1}. {req['title']}: {req['description']}"
            for i, req in enumerate(non_func_reqs)
        ])
        
        return f"""## Non-Functional Requirements

{reqs_text}

These requirements define quality attributes, system constraints, and performance criteria."""
    
    async def _generate_system_features(self, requirements: List[Dict]) -> str:
        """Generate system features section."""
        
        func_reqs = [r for r in requirements if r.get('type') == 'functional']
        
        # Group requirements by feature area
        features = {}
        for req in func_reqs:
            # Simple grouping by first word of title
            feature_name = req['title'].split()[0]
            if feature_name not in features:
                features[feature_name] = []
            features[feature_name].append(req)
        
        feature_text = ""
        for feature_name, reqs in features.items():
            feature_text += f"\n### {feature_name} Features\n"
            for req in reqs:
                feature_text += f"- {req['title']}: {req['description']}\n"
        
        return feature_text
