"""
Gemini Multi-Agent Orchestrator
================================
A production-ready multi-agent system where each specialized agent uses the
most appropriate Gemini model for its task.  The top-level GeminiOrchestrator
class routes task_type strings to the correct agent and returns a uniform
response envelope.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional

import google.generativeai as genai

from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SDK initialisation – done once at import time
# ---------------------------------------------------------------------------
genai.configure(api_key=settings.gemini_api_key)

_MAX_RETRIES = 3


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> Any:
    """
    Try several strategies to pull valid JSON out of a Gemini response.
    Returns the parsed Python object, or raises ValueError if nothing works.
    """
    # 1. Markdown fenced block:  ```json ... ```
    m = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))

    # 2. Largest {...} block in the text
    m = re.search(r"(\{.*\})", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))

    # 3. Largest [...] block
    m = re.search(r"(\[.*\])", text, re.DOTALL)
    if m:
        return json.loads(m.group(1))

    raise ValueError("No valid JSON found in response")


def _extract_plantuml(text: str) -> str:
    """Return the PlantUML block from the response, or wrap the whole text."""
    if "@startuml" in text and "@enduml" in text:
        start = text.find("@startuml")
        end = text.find("@enduml") + len("@enduml")
        return text[start:end]
    return f"@startuml\n{text.strip()}\n@enduml"


def _build_envelope(
    success: bool,
    content: Any,
    agent: str,
    model: str,
    error: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "success": success,
        "content": content,
        "agent": agent,
        "model": model,
        "error": error,
    }


# ---------------------------------------------------------------------------
# Base agent
# ---------------------------------------------------------------------------

class _BaseAgent:
    """
    Common retry loop shared by all specialized agents.
    Sub-classes must set:
      self.agent_name   – string identifier
      self.model_name   – Gemini model string
      self.model        – genai.GenerativeModel instance
    and implement:
      self._build_prompt(context) -> str
      self._parse_response(text)  -> Any
    """

    agent_name: str = "BaseAgent"
    model_name: str = settings.gemini_flash_model

    async def run(self, context: dict) -> dict:
        from services.openai_client import call_openai
        prompt = self._build_prompt(context)
        last_error: Optional[str] = None

        for attempt in range(_MAX_RETRIES):
            try:
                raw_text = await call_openai(prompt)
                parsed = self._parse_response(raw_text)
                return _build_envelope(
                    success=True,
                    content=parsed,
                    agent=self.agent_name,
                    model=settings.openai_model,
                )
            except Exception as exc:
                last_error = str(exc)
                wait = 2 ** attempt  # exponential back-off: 1s, 2s, 4s
                logger.warning(
                    "[%s] attempt %d/%d failed: %s – retrying in %ds",
                    self.agent_name,
                    attempt + 1,
                    _MAX_RETRIES,
                    last_error,
                    wait,
                )
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(wait)

        return _build_envelope(
            success=False,
            content=None,
            agent=self.agent_name,
            model=settings.openai_model,
            error=f"All {_MAX_RETRIES} attempts failed. Last error: {last_error}",
        )

    # Subclasses override these two
    def _build_prompt(self, context: dict) -> str:  # pragma: no cover
        raise NotImplementedError

    def _parse_response(self, text: str) -> Any:  # pragma: no cover
        raise NotImplementedError


# ---------------------------------------------------------------------------
# 1. RequirementsAgent
# ---------------------------------------------------------------------------

class RequirementsAgent(_BaseAgent):
    agent_name = "RequirementsAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are an expert software requirements analyst with 15+ years of experience.
Your task is to extract clear, actionable, testable requirements from project descriptions.

ALWAYS return valid JSON in this EXACT format (no extra text before or after):
{
  "requirements": [
    {
      "type": "functional|non_functional|constraint",
      "title": "Short descriptive title",
      "description": "Detailed description of the requirement",
      "priority": "critical|high|medium|low",
      "acceptance_criteria": ["criterion 1", "criterion 2", "criterion 3"],
      "confidence": 0.95
    }
  ],
  "summary": "Brief 2-3 sentence summary of the main requirements themes"
}

Rules:
- Extract a MINIMUM of 10 requirements for any real project description.
- Distinguish functional (what the system does), non_functional (quality attributes like performance,
  security, scalability), and constraints (technology, budget, regulatory limits).
- Acceptance criteria must be specific and testable (Given/When/Then style preferred).
- confidence is a float 0.0–1.0 indicating how certain you are the requirement is intentional.
- Do NOT include commentary outside the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        questionnaire = context.get("questionnaire_data", {})

        return f"""Analyze the following software project and extract comprehensive requirements.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}

ADDITIONAL CONTEXT FROM QUESTIONNAIRE:
{json.dumps(questionnaire, indent=2) if questionnaire else "None provided"}

Extract ALL functional requirements, non-functional requirements, and constraints.
Return ONLY valid JSON as specified in your system instructions."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 2. SRSAgent
# ---------------------------------------------------------------------------

class SRSAgent(_BaseAgent):
    agent_name = "SRSAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a senior technical writer specialising in IEEE 830-compliant
Software Requirements Specifications (SRS).

Generate a COMPLETE, professional SRS document in Markdown.  The document MUST include these sections:

# [Project Name] – Software Requirements Specification

## 1. Introduction
### 1.1 Purpose
### 1.2 Scope
### 1.3 Definitions, Acronyms and Abbreviations
### 1.4 References
### 1.5 Overview

## 2. Overall Description
### 2.1 Product Perspective
### 2.2 Product Functions (high-level summary)
### 2.3 User Classes and Characteristics
### 2.4 Operating Environment
### 2.5 Design and Implementation Constraints
### 2.6 Assumptions and Dependencies

## 3. Specific Requirements
### 3.1 Functional Requirements
(FR-001, FR-002 … numbered list with description and rationale)
### 3.2 Non-Functional Requirements
#### 3.2.1 Performance
#### 3.2.2 Security
#### 3.2.3 Reliability
#### 3.2.4 Maintainability
#### 3.2.5 Scalability
### 3.3 System Constraints

## 4. External Interface Requirements
### 4.1 User Interfaces
### 4.2 Hardware Interfaces
### 4.3 Software Interfaces
### 4.4 Communication Interfaces

## 5. Other Non-functional Requirements
### 5.1 Compliance
### 5.2 Documentation

## 6. Appendix

Write in formal, precise language.  Use numbered lists for all requirements.
Do NOT truncate – every section must be substantive.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])
        questionnaire = context.get("questionnaire_data", {})

        req_block = ""
        if requirements:
            req_block = "\n\nEXTRACTED REQUIREMENTS:\n" + json.dumps(requirements, indent=2)

        return f"""Generate a complete IEEE 830-compliant SRS document for the following project.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}
{req_block}

QUESTIONNAIRE DATA:
{json.dumps(questionnaire, indent=2) if questionnaire else "None provided"}

Produce the full SRS document in Markdown.  All sections must be populated with real content."""

    def _parse_response(self, text: str) -> str:
        # SRS is returned as a Markdown string directly
        return text.strip()


# ---------------------------------------------------------------------------
# 3. RiskAgent
# ---------------------------------------------------------------------------

class RiskAgent(_BaseAgent):
    agent_name = "RiskAgent"
    model_name = settings.gemini_flash_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a senior software project risk analyst with expertise in
ISO 31000 risk management.

ALWAYS return valid JSON in this EXACT format:
{
  "risks": [
    {
      "risk_id": "RISK-001",
      "title": "Short risk title",
      "description": "Detailed description of the risk event and its cause",
      "category": "technical|schedule|budget|resource|security|compliance|operational|external",
      "impact": "critical|high|medium|low",
      "probability": "very_high|high|medium|low|very_low",
      "risk_score": 8,
      "mitigation": "Specific, actionable mitigation strategy",
      "contingency": "What to do if the risk materialises",
      "owner": "Suggested role responsible for this risk"
    }
  ],
  "overall_risk_level": "critical|high|medium|low",
  "risk_summary": "2-3 sentence executive summary of the risk profile"
}

risk_score = impact_value * probability_value  (scale 1-25, where critical=5, high=4, medium=3, low=2, very_low=1)
Return a MINIMUM of 8 risks for any real project.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])

        return f"""Perform a comprehensive risk analysis for the following software project.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}

REQUIREMENTS SUMMARY:
{json.dumps(requirements[:10], indent=2) if requirements else "Not yet extracted"}

Identify ALL significant risks across technical, schedule, budget, resource, security,
compliance, operational, and external categories.  Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 4. DiagramAgent
# ---------------------------------------------------------------------------

class DiagramAgent(_BaseAgent):
    agent_name = "DiagramAgent"
    model_name = settings.gemini_flash_model

    _DIAGRAM_TYPES = {
        "use_case": "Use Case diagram showing actors and system use cases",
        "class": "Class diagram showing main entities and their relationships",
        "sequence": "Sequence diagram showing the main user workflow",
        "component": "Component diagram showing system architecture",
        "er": "Entity Relationship diagram for the data model",
        "activity": "Activity diagram for the primary business process",
        "deployment": "Deployment diagram showing infrastructure",
    }

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a software architect specialising in UML diagram design.

Generate PlantUML diagram code.  The code MUST:
- Start exactly with @startuml
- End exactly with @enduml
- Be syntactically valid PlantUML
- Include meaningful labels, notes, and styling (skinparam or !theme)
- Be detailed enough to communicate the architecture clearly

Return ONLY the PlantUML code block – no explanation, no markdown fencing.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        diagram_type = context.get("diagram_type", "use_case")
        requirements = context.get("requirements", [])

        diagram_desc = self._DIAGRAM_TYPES.get(
            diagram_type,
            f"{diagram_type} diagram",
        )

        return f"""Generate a {diagram_desc} in PlantUML for the following project.

PROJECT NAME: {project_name}
DESCRIPTION:
{description}

REQUIREMENTS CONTEXT:
{json.dumps(requirements[:8], indent=2) if requirements else "Not provided"}

Create a detailed, accurate PlantUML diagram.  Start with @startuml and end with @enduml."""

    def _parse_response(self, text: str) -> str:
        return _extract_plantuml(text)


# ---------------------------------------------------------------------------
# 5. CostAgent
# ---------------------------------------------------------------------------

class CostAgent(_BaseAgent):
    agent_name = "CostAgent"
    model_name = settings.gemini_flash_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are an experienced software project manager and cost estimator.
Use industry-standard techniques (Function Point Analysis, COCOMO II, expert judgement).

ALWAYS return valid JSON in this EXACT format:
{
  "total_hours": 1200,
  "total_cost": 120000,
  "currency": "USD",
  "hourly_rate_assumption": 100,
  "team_size_recommendation": 4,
  "duration_weeks": 26,
  "breakdown_by_phase": [
    {
      "phase": "Requirements & Analysis",
      "hours": 80,
      "cost": 8000,
      "percentage": 6.7,
      "deliverables": ["SRS document", "Stakeholder sign-off"]
    },
    {
      "phase": "System Design",
      "hours": 120,
      "cost": 12000,
      "percentage": 10,
      "deliverables": ["Architecture document", "DB schema", "API spec"]
    },
    {
      "phase": "Frontend Development",
      "hours": 300,
      "cost": 30000,
      "percentage": 25,
      "deliverables": ["UI components", "Integration with APIs"]
    },
    {
      "phase": "Backend Development",
      "hours": 400,
      "cost": 40000,
      "percentage": 33.3,
      "deliverables": ["REST APIs", "Business logic", "Database layer"]
    },
    {
      "phase": "Testing & QA",
      "hours": 180,
      "cost": 18000,
      "percentage": 15,
      "deliverables": ["Test plans", "Test cases", "Bug fixes"]
    },
    {
      "phase": "Deployment & DevOps",
      "hours": 60,
      "cost": 6000,
      "percentage": 5,
      "deliverables": ["CI/CD pipeline", "Infrastructure setup"]
    },
    {
      "phase": "Documentation & Training",
      "hours": 60,
      "cost": 6000,
      "percentage": 5,
      "deliverables": ["User manual", "API docs", "Training sessions"]
    }
  ],
  "assumptions": [
    "Mid-level developers at $100/hr blended rate",
    "Agile methodology with 2-week sprints"
  ],
  "risk_contingency_percentage": 15,
  "total_cost_with_contingency": 138000,
  "confidence_level": "medium",
  "confidence_notes": "Estimate based on project description; detailed scope may alter by ±30%"
}

Adjust all numbers to fit the actual project scope.  Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])
        questionnaire = context.get("questionnaire_data", {})

        return f"""Estimate development cost and effort for the following software project.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}

REQUIREMENTS ({len(requirements)} extracted):
{json.dumps(requirements[:12], indent=2) if requirements else "Not yet extracted"}

QUESTIONNAIRE DATA:
{json.dumps(questionnaire, indent=2) if questionnaire else "None provided"}

Provide a detailed, realistic cost and effort estimate.  Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 6. PersonaAgent
# ---------------------------------------------------------------------------

class PersonaAgent(_BaseAgent):
    agent_name = "PersonaAgent"
    model_name = settings.gemini_flash_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a UX researcher and product designer specialising in persona creation.

ALWAYS return valid JSON in this EXACT format:
{
  "personas": [
    {
      "id": "persona-1",
      "name": "Full Name",
      "age": 32,
      "occupation": "Job Title",
      "education": "Highest qualification",
      "technical_proficiency": "expert|intermediate|beginner",
      "location": "City, Country",
      "bio": "2-3 sentence background description",
      "goals": [
        "Primary goal they want to achieve with the system",
        "Secondary goal"
      ],
      "frustrations": [
        "Main pain point with current solutions",
        "Another frustration"
      ],
      "motivations": ["What drives them to use the product"],
      "behaviours": ["How they typically interact with similar systems"],
      "devices": ["smartphone", "laptop"],
      "preferred_channels": ["mobile app", "email"],
      "quote": "A representative quote this persona might say",
      "usage_frequency": "daily|weekly|monthly|occasional",
      "key_tasks": ["Task 1 they perform in the system", "Task 2"]
    }
  ],
  "persona_summary": "Brief description of the overall user landscape"
}

Create 3-5 distinct, realistic personas that cover the full spectrum of users.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])

        return f"""Create detailed user personas for the following software product.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}

REQUIREMENTS CONTEXT:
{json.dumps(requirements[:8], indent=2) if requirements else "Not provided"}

Generate 3-5 realistic, distinct personas that represent the key user groups.
Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 7. FeasibilityAgent
# ---------------------------------------------------------------------------

class FeasibilityAgent(_BaseAgent):
    agent_name = "FeasibilityAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a senior technology consultant specialising in project feasibility analysis.

ALWAYS return valid JSON in this EXACT format:
{
  "overall_feasibility": "highly_feasible|feasible|marginally_feasible|not_feasible",
  "overall_score": 78,
  "recommendation": "Concise go/no-go recommendation with rationale",
  "technical": {
    "score": 80,
    "verdict": "feasible",
    "strengths": ["Point 1", "Point 2"],
    "challenges": ["Challenge 1", "Challenge 2"],
    "required_technologies": ["Tech 1", "Tech 2"],
    "technology_maturity": "mature|emerging|experimental",
    "technical_risks": ["Risk 1", "Risk 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "financial": {
    "score": 75,
    "verdict": "feasible",
    "estimated_budget_range": {"min": 50000, "max": 150000, "currency": "USD"},
    "roi_timeline_months": 18,
    "funding_considerations": ["Point 1"],
    "cost_risks": ["Risk 1"],
    "recommendations": ["Recommendation 1"]
  },
  "operational": {
    "score": 82,
    "verdict": "feasible",
    "team_requirements": ["Skill 1", "Skill 2"],
    "organisational_readiness": "high|medium|low",
    "change_management_needs": ["Need 1"],
    "support_requirements": ["Requirement 1"],
    "recommendations": ["Recommendation 1"]
  },
  "schedule": {
    "score": 70,
    "verdict": "marginally_feasible",
    "estimated_duration_months": 9,
    "critical_milestones": [
      {"milestone": "MVP", "month": 4},
      {"milestone": "Beta launch", "month": 7},
      {"milestone": "Production launch", "month": 9}
    ],
    "schedule_risks": ["Risk 1"],
    "recommendations": ["Recommendation 1"]
  }
}

Scores are 0-100.  Be realistic and evidence-based.  Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])
        questionnaire = context.get("questionnaire_data", {})

        return f"""Perform a comprehensive feasibility analysis for the following project.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}

REQUIREMENTS ({len(requirements)} extracted):
{json.dumps(requirements[:10], indent=2) if requirements else "Not yet extracted"}

QUESTIONNAIRE DATA:
{json.dumps(questionnaire, indent=2) if questionnaire else "None provided"}

Analyse technical, financial, operational, and schedule feasibility.
Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 8. SystemDesignAgent
# ---------------------------------------------------------------------------

class SystemDesignAgent(_BaseAgent):
    agent_name = "SystemDesignAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a principal software architect with 20 years of experience
designing scalable, maintainable systems.

ALWAYS return valid JSON in this EXACT format:
{
  "architecture_style": "microservices|monolith|serverless|event_driven|layered|hexagonal",
  "architecture_rationale": "Why this style suits the project",
  "frontend": {
    "framework": "React / Next.js",
    "state_management": "Zustand",
    "ui_library": "Tailwind CSS + shadcn/ui",
    "key_libraries": ["react-query", "axios", "zod"],
    "rationale": "Why these choices"
  },
  "backend": {
    "framework": "FastAPI (Python)",
    "language": "Python 3.12",
    "api_style": "REST",
    "authentication": "JWT with refresh tokens",
    "key_libraries": ["SQLAlchemy", "Pydantic", "asyncpg"],
    "rationale": "Why these choices"
  },
  "database": {
    "primary": "PostgreSQL",
    "caching": "Redis",
    "search": "None",
    "rationale": "Why these choices"
  },
  "infrastructure": {
    "hosting": "Railway / Vercel",
    "ci_cd": "GitHub Actions",
    "containerisation": "Docker",
    "monitoring": "Sentry + Railway metrics",
    "rationale": "Why these choices"
  },
  "security": {
    "authentication": "JWT + bcrypt",
    "authorisation": "RBAC",
    "data_protection": ["HTTPS/TLS", "Encrypted secrets"],
    "compliance_notes": "GDPR considerations"
  },
  "scalability": {
    "expected_users": "1000-10000",
    "scaling_strategy": "Horizontal scaling via Railway",
    "bottlenecks": ["Database connections", "File storage"],
    "solutions": ["Connection pooling", "CDN for static assets"]
  },
  "key_components": [
    {
      "name": "API Gateway",
      "responsibility": "Routes requests, handles auth middleware",
      "technology": "FastAPI"
    }
  ],
  "data_flow": "Brief description of how data moves through the system",
  "integration_points": [
    {
      "service": "Gemini AI API",
      "purpose": "AI-powered content generation",
      "integration_method": "REST / SDK"
    }
  ],
  "development_phases": [
    {
      "phase": 1,
      "name": "Foundation",
      "duration_weeks": 4,
      "deliverables": ["Auth system", "Core data models", "Basic API"]
    }
  ],
  "technical_risks": ["Risk 1", "Risk 2"],
  "architecture_diagram_hint": "Brief description for generating a PlantUML component diagram"
}

Tailor ALL recommendations to the actual project.  Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])
        questionnaire = context.get("questionnaire_data", {})

        return f"""Create a detailed system architecture and design recommendation for the following project.

PROJECT NAME: {project_name}
PROJECT TYPE: {project_type}
DESCRIPTION:
{description}

REQUIREMENTS ({len(requirements)} extracted):
{json.dumps(requirements[:12], indent=2) if requirements else "Not yet extracted"}

QUESTIONNAIRE DATA:
{json.dumps(questionnaire, indent=2) if questionnaire else "None provided"}

Provide a comprehensive, production-ready system design.  Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 9. ConflictDetectionAgent
# ---------------------------------------------------------------------------

class ConflictDetectionAgent(_BaseAgent):
    agent_name = "ConflictDetectionAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are an expert requirements analyst specialising in detecting conflicts,
contradictions, and ambiguities in software requirements documents.

ALWAYS return valid JSON in this EXACT format:
{
  "conflicts": [
    {
      "conflict_id": "CONF-001",
      "severity": "critical|high|medium|low",
      "type": "direct_contradiction|implicit_conflict|ambiguity|duplication|missing_dependency",
      "title": "Short conflict title",
      "description": "Detailed description of the conflict",
      "requirements_involved": ["REQ-001", "REQ-002"],
      "explanation": "Why these conflict with each other",
      "suggested_resolution": "Concrete recommendation to resolve the conflict",
      "resolution_effort": "low|medium|high"
    }
  ],
  "summary": {
    "total_conflicts": 3,
    "critical_count": 1,
    "high_count": 1,
    "medium_count": 1,
    "low_count": 0,
    "overall_quality_score": 72,
    "recommendation": "Brief overall recommendation"
  }
}

Be thorough — scan for: direct contradictions, scope creep, missing non-functional requirements,
circular dependencies, tech stack conflicts, regulatory conflicts, and ambiguous terms.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        requirements = context.get("requirements", [])
        project_name = context.get("project_name", "Unnamed Project")
        return f"""Analyze the following requirements for conflicts, contradictions, and ambiguities.

PROJECT: {project_name}

REQUIREMENTS TO ANALYZE:
{json.dumps(requirements, indent=2) if requirements else "No requirements provided"}

Scan carefully for ALL types of conflicts. Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 10. TechStackRecommenderAgent
# ---------------------------------------------------------------------------

class TechStackRecommenderAgent(_BaseAgent):
    agent_name = "TechStackRecommenderAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a principal software architect and CTO advisor.
Your job is to recommend the optimal technology stack for a given project.

ALWAYS return valid JSON in this EXACT format:
{
  "recommended_stack": {
    "frontend": {
      "framework": "React 18 + TypeScript",
      "ui_library": "Tailwind CSS + shadcn/ui",
      "state_management": "Zustand",
      "build_tool": "Vite",
      "testing": "Vitest + Playwright",
      "rationale": "Why this frontend stack"
    },
    "backend": {
      "language": "Python 3.12",
      "framework": "FastAPI",
      "api_style": "REST + WebSocket",
      "testing": "pytest + httpx",
      "rationale": "Why this backend stack"
    },
    "database": {
      "primary": "PostgreSQL 16",
      "orm": "SQLAlchemy 2.0",
      "caching": "Redis",
      "search": "None",
      "rationale": "Why this database stack"
    },
    "infrastructure": {
      "hosting": "Railway",
      "cdn": "Cloudflare",
      "storage": "Cloudflare R2",
      "ci_cd": "GitHub Actions",
      "monitoring": "Sentry + Grafana",
      "rationale": "Why this infrastructure"
    }
  },
  "alternatives": [
    {
      "category": "frontend",
      "alternative": "Next.js 14",
      "when_to_choose": "If SEO is critical or you need SSR",
      "trade_offs": "More complex setup, but better SEO"
    }
  ],
  "tradeoff_matrix": [
    {
      "criterion": "Developer Experience",
      "recommended_score": 9,
      "alternative_score": 7,
      "notes": "React+Vite has faster HMR"
    }
  ],
  "estimated_setup_time_days": 3,
  "learning_curve": "low|medium|high",
  "scalability_rating": 8,
  "cost_rating": 7,
  "community_support": "excellent|good|moderate|limited",
  "summary": "2-3 sentence summary of the recommendation"
}

Base recommendations on: team size, project type, scalability needs, timeline, and budget.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        project_type = context.get("template_type", "web_app")
        requirements = context.get("requirements", [])
        questionnaire = context.get("questionnaire_data", {})
        return f"""Recommend the optimal technology stack for this project.

PROJECT: {project_name} ({project_type})
DESCRIPTION: {description}

REQUIREMENTS SUMMARY:
{json.dumps(requirements[:10], indent=2) if requirements else "Not provided"}

QUESTIONNAIRE DATA:
{json.dumps(questionnaire, indent=2) if questionnaire else "None provided"}

Return ONLY valid JSON with your stack recommendation."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 11. SecurityAuditAgent
# ---------------------------------------------------------------------------

class SecurityAuditAgent(_BaseAgent):
    agent_name = "SecurityAuditAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a senior application security architect and OWASP expert.
Your job is to audit project requirements and design for security gaps.

ALWAYS return valid JSON in this EXACT format:
{
  "security_score": 65,
  "risk_level": "critical|high|medium|low",
  "findings": [
    {
      "finding_id": "SEC-001",
      "severity": "critical|high|medium|low|info",
      "category": "authentication|authorization|injection|xss|csrf|data_exposure|cryptography|logging|dependencies|configuration",
      "title": "Short finding title",
      "description": "What the gap is and why it matters",
      "affected_requirements": ["REQ-001"],
      "owasp_category": "A01:2021 – Broken Access Control",
      "recommendation": "Specific remediation steps",
      "implementation_effort": "low|medium|high"
    }
  ],
  "security_checklist": [
    {"item": "Implement HTTPS/TLS everywhere", "status": "missing|present|partial", "priority": "critical"}
  ],
  "compliance_considerations": ["GDPR", "SOC 2"],
  "recommended_security_tools": ["OWASP ZAP", "Snyk", "Dependabot"],
  "executive_summary": "3-4 sentence security posture summary"
}

Cover: OWASP Top 10, authentication flows, data encryption, API security, input validation,
secrets management, logging/monitoring, and dependency vulnerabilities.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        requirements = context.get("requirements", [])
        system_design = context.get("system_design", {})
        return f"""Perform a security audit of the following project's requirements and design.

PROJECT: {project_name}
DESCRIPTION: {description}

REQUIREMENTS:
{json.dumps(requirements[:15], indent=2) if requirements else "Not provided"}

SYSTEM DESIGN:
{json.dumps(system_design, indent=2) if system_design else "Not provided"}

Identify ALL security gaps and vulnerabilities. Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 12. UserStoryGeneratorAgent
# ---------------------------------------------------------------------------

class UserStoryGeneratorAgent(_BaseAgent):
    agent_name = "UserStoryGeneratorAgent"
    model_name = settings.gemini_flash_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are an experienced Agile product manager and scrum master.
Convert requirements into properly formatted user stories with acceptance criteria.

ALWAYS return valid JSON in this EXACT format:
{
  "user_stories": [
    {
      "story_id": "US-001",
      "epic": "User Authentication",
      "title": "User login with email",
      "user_role": "registered user",
      "goal": "log in with my email and password",
      "benefit": "access my personalised dashboard securely",
      "full_story": "As a registered user, I want to log in with my email and password, so that I can access my personalised dashboard securely.",
      "acceptance_criteria": [
        "GIVEN I am on the login page WHEN I enter valid credentials THEN I am redirected to my dashboard",
        "GIVEN I enter invalid credentials WHEN I click login THEN I see an error message",
        "GIVEN I am logged in WHEN I close the browser THEN my session expires after 24 hours"
      ],
      "story_points": 5,
      "complexity": "simple|moderate|complex",
      "priority": "must_have|should_have|could_have|wont_have",
      "dependencies": ["US-002"],
      "technical_notes": "Use JWT with refresh tokens; store tokens in httpOnly cookies"
    }
  ],
  "epic_summary": [
    {"epic": "User Authentication", "story_count": 4, "total_points": 18}
  ],
  "total_story_points": 120,
  "estimated_sprints": 6,
  "velocity_assumption": 20
}

Generate user stories for ALL key features. Use Gherkin syntax for acceptance criteria.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        requirements = context.get("requirements", [])
        project_name = context.get("project_name", "Unnamed Project")
        personas = context.get("personas", [])
        return f"""Generate comprehensive user stories for the following project requirements.

PROJECT: {project_name}

USER PERSONAS:
{json.dumps(personas[:3], indent=2) if personas else "No personas provided"}

REQUIREMENTS TO CONVERT:
{json.dumps(requirements, indent=2) if requirements else "No requirements provided"}

Generate user stories for all requirements, grouped into epics. Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 13. ApiDesignAgent
# ---------------------------------------------------------------------------

class ApiDesignAgent(_BaseAgent):
    agent_name = "ApiDesignAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a senior API architect specialising in RESTful API design
and OpenAPI 3.0 specification.

ALWAYS return valid JSON in this EXACT format:
{
  "api_version": "1.0.0",
  "base_url": "/api/v1",
  "authentication": "Bearer JWT",
  "endpoints": [
    {
      "method": "POST",
      "path": "/auth/login",
      "summary": "User authentication",
      "description": "Authenticate with email/password, returns JWT tokens",
      "tags": ["Authentication"],
      "request_body": {
        "email": "string (required)",
        "password": "string (required, min 8 chars)"
      },
      "responses": {
        "200": {"access_token": "string", "refresh_token": "string", "expires_in": 3600},
        "401": {"error": "Invalid credentials"},
        "422": {"error": "Validation error", "details": "object"}
      },
      "auth_required": false,
      "rate_limit": "10/minute"
    }
  ],
  "data_models": [
    {
      "name": "User",
      "fields": [
        {"name": "id", "type": "string (UUID)", "required": true},
        {"name": "email", "type": "string", "required": true}
      ]
    }
  ],
  "websocket_endpoints": [],
  "api_conventions": {
    "pagination": "cursor-based with limit/cursor params",
    "error_format": "{ error: string, code: string, details: object }",
    "date_format": "ISO 8601",
    "versioning": "URL path versioning /api/v1"
  },
  "estimated_endpoints": 24
}

Design a complete, production-ready API. Cover all CRUD operations and business logic endpoints.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        requirements = context.get("requirements", [])
        system_design = context.get("system_design", {})
        return f"""Design a complete REST API specification for this project.

PROJECT: {project_name}
DESCRIPTION: {description}

REQUIREMENTS:
{json.dumps(requirements[:15], indent=2) if requirements else "Not provided"}

SYSTEM DESIGN:
{json.dumps(system_design, indent=2) if system_design else "Not provided"}

Design all endpoints needed. Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 14. DatabaseSchemaAgent
# ---------------------------------------------------------------------------

class DatabaseSchemaAgent(_BaseAgent):
    agent_name = "DatabaseSchemaAgent"
    model_name = settings.gemini_pro_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are a senior database architect specialising in PostgreSQL schema design,
normalization, and performance optimization.

ALWAYS return valid JSON in this EXACT format:
{
  "database_type": "PostgreSQL 16",
  "tables": [
    {
      "table_name": "users",
      "description": "Stores user account information",
      "columns": [
        {
          "name": "id",
          "type": "TEXT",
          "primary_key": true,
          "nullable": false,
          "default": null,
          "description": "UUID as text primary key"
        },
        {
          "name": "email",
          "type": "TEXT",
          "primary_key": false,
          "nullable": false,
          "unique": true,
          "description": "User email address"
        }
      ],
      "indexes": [
        {"name": "idx_users_email", "columns": ["email"], "unique": true}
      ],
      "foreign_keys": [],
      "estimated_row_count": "10000-100000"
    }
  ],
  "relationships": [
    {
      "from_table": "projects",
      "from_column": "owner_id",
      "to_table": "users",
      "to_column": "id",
      "relationship_type": "many_to_one",
      "on_delete": "CASCADE"
    }
  ],
  "normalization_level": "3NF",
  "plantuml_erd": "@startuml\\n' ERD here\\n@enduml",
  "migration_notes": ["Run migrations in order", "Add indexes after bulk inserts"],
  "performance_recommendations": ["Use connection pooling", "Add composite indexes for frequent queries"]
}

Design a fully normalized, production-ready schema. Include ALL tables needed.
Return ONLY the JSON block.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "Unnamed Project")
        description = context.get("description", "")
        requirements = context.get("requirements", [])
        system_design = context.get("system_design", {})
        return f"""Design a complete database schema for this project.

PROJECT: {project_name}
DESCRIPTION: {description}

REQUIREMENTS:
{json.dumps(requirements[:15], indent=2) if requirements else "Not provided"}

SYSTEM DESIGN:
{json.dumps(system_design, indent=2) if system_design else "Not provided"}

Design all tables, relationships, and indexes. Return ONLY valid JSON."""

    def _parse_response(self, text: str) -> Any:
        return _extract_json(text)


# ---------------------------------------------------------------------------
# 15. AIChatAgent — per-phase conversational assistant
# ---------------------------------------------------------------------------

class AIChatAgent(_BaseAgent):
    agent_name = "AIChatAgent"
    model_name = settings.gemini_flash_model

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction="""You are Athena, an expert AI assistant inside the Acorn project planning platform.
You help users understand, improve, and expand upon their project phase outputs.

Your personality: concise, expert, friendly. You speak like a senior consultant, not a chatbot.
Always give actionable, specific advice relevant to the project phase context provided.
Keep responses under 300 words unless the user asks for more detail.
Format responses in Markdown for readability.""",
        )

    def _build_prompt(self, context: dict) -> str:
        project_name = context.get("project_name", "")
        phase = context.get("phase", "")
        phase_content = context.get("phase_content", "")
        user_message = context.get("user_message", "")
        chat_history = context.get("chat_history", [])

        history_text = ""
        if chat_history:
            history_text = "\n\nCHAT HISTORY (most recent last):\n"
            for msg in chat_history[-6:]:  # last 6 messages for context
                role = "User" if msg.get("role") == "user" else "Athena"
                history_text += f"{role}: {msg.get('content', '')}\n"

        return f"""PROJECT: {project_name}
CURRENT PHASE: {phase}

PHASE CONTENT (AI-generated output the user is reviewing):
{phase_content[:2000] if phase_content else "No content generated yet for this phase."}
{history_text}

USER'S QUESTION/REQUEST:
{user_message}

Respond as Athena, the Acorn AI assistant. Be specific, expert, and actionable."""

    def _parse_response(self, text: str) -> str:
        return text.strip()


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

_TASK_AGENT_MAP: Dict[str, type] = {
    "requirements_extraction": RequirementsAgent,
    "srs_generation": SRSAgent,
    "risk_analysis": RiskAgent,
    "diagram_generation": DiagramAgent,
    "cost_estimation": CostAgent,
    "persona_generation": PersonaAgent,
    "feasibility_analysis": FeasibilityAgent,
    "system_design": SystemDesignAgent,
    # New agents
    "conflict_detection": ConflictDetectionAgent,
    "tech_stack_recommendation": TechStackRecommenderAgent,
    "security_audit": SecurityAuditAgent,
    "user_story_generation": UserStoryGeneratorAgent,
    "api_design": ApiDesignAgent,
    "database_schema": DatabaseSchemaAgent,
    "ai_chat": AIChatAgent,
}


class GeminiOrchestrator:
    """
    Routes task_type strings to the appropriate specialized Gemini agent.

    Usage
    -----
    orchestrator = GeminiOrchestrator()
    result = await orchestrator.run(
        task_type="requirements_extraction",
        context={"project_name": "...", "description": "..."}
    )
    # result = {"success": True, "content": {...}, "agent": "RequirementsAgent",
    #           "model": "gemini-2.5-pro-latest", "error": None}
    """

    def __init__(self):
        # Lazily instantiate agents on first use to avoid cold-start overhead
        self._agents: Dict[str, _BaseAgent] = {}

    def _get_agent(self, task_type: str) -> _BaseAgent:
        if task_type not in self._agents:
            agent_cls = _TASK_AGENT_MAP.get(task_type)
            if agent_cls is None:
                raise ValueError(
                    f"Unknown task_type '{task_type}'. "
                    f"Valid types: {list(_TASK_AGENT_MAP.keys())}"
                )
            self._agents[task_type] = agent_cls()
        return self._agents[task_type]

    async def run(self, task_type: str, context: dict) -> dict:
        """
        Execute the agent corresponding to task_type with the given context.

        Parameters
        ----------
        task_type : str
            One of the supported task type keys (see _TASK_AGENT_MAP).
        context : dict
            Arbitrary key-value context passed to the agent's prompt builder.
            Common keys: project_name, description, template_type,
                         requirements, questionnaire_data, diagram_type.

        Returns
        -------
        dict with keys: success, content, agent, model, error
        """
        logger.info("[GeminiOrchestrator] Running task_type=%s", task_type)
        try:
            agent = self._get_agent(task_type)
        except ValueError as exc:
            return _build_envelope(
                success=False,
                content=None,
                agent="GeminiOrchestrator",
                model="none",
                error=str(exc),
            )
        return await agent.run(context)

    async def run_pipeline(
        self,
        context: dict,
        tasks: list,
    ) -> Dict[str, dict]:
        """
        Run multiple agents in sequence, feeding each result back into the
        context so downstream agents benefit from earlier work.

        Parameters
        ----------
        context : dict  – initial context (project_name, description, …)
        tasks   : list  – ordered list of task_type strings

        Returns
        -------
        Dict[task_type -> result_envelope]
        """
        results: Dict[str, dict] = {}
        running_context = dict(context)

        for task_type in tasks:
            result = await self.run(task_type, running_context)
            results[task_type] = result

            # Propagate structured results into context for downstream agents
            if result["success"] and result["content"]:
                if task_type == "requirements_extraction":
                    reqs = result["content"]
                    if isinstance(reqs, dict):
                        reqs = reqs.get("requirements", reqs)
                    running_context["requirements"] = reqs

                elif task_type == "system_design":
                    running_context["system_design"] = result["content"]

                elif task_type == "feasibility_analysis":
                    running_context["feasibility"] = result["content"]

        return results

    @property
    def supported_task_types(self) -> list:
        return list(_TASK_AGENT_MAP.keys())


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
gemini_orchestrator = GeminiOrchestrator()
