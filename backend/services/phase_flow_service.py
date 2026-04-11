"""Phase flow generation service."""

from typing import Dict, Tuple, Optional
import logging
import time

from config import settings
from repositories.project_repository import ProjectRepository
from models.project import default_phase_status
from repositories.artifact_repository import ArtifactRepository
from repositories.ai_run_repository import AiRunRepository
from repositories.activity_repository import ActivityRepository
from services.markdown_formatter import MarkdownFormatter
from services.openai_client import call_openai
from services.version_service import VersionService
from models.version import VersionCreate

logger = logging.getLogger(__name__)

PHASE_ORDER = [
    "planning",
    "feasibility_study",
    "requirements_gathering",
    "validation",
    "design",
    "development",
    "tasks",
    "cost_benefit",
    "risks",
    "testing",
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
    "cost_benefit": "Costs & Benefits",
    "risks": "Risks & Mitigations",
    "testing": "Testing",
    "summary": "Summary",
}


class PhaseFlowService:
    """Manage sequential phase generation and storage."""

    def __init__(self):
        self.project_repo = ProjectRepository()
        self.artifact_repo = ArtifactRepository()
        self.ai_run_repo = AiRunRepository()
        self.activity_repo = ActivityRepository()
        self.version_service = VersionService()
        self.markdown_formatter = MarkdownFormatter()
        logger.info(f"PhaseFlowService initialized - Provider: OpenAI, Model: {settings.openai_model}")
        logger.info(f"OpenAI API key configured: {'Yes' if settings.openai_api_key else 'No'}")

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

    async def unlock_phase(self, project_id: str, organization: str, phase: str) -> Dict[str, str]:
        """Unlock a specific phase for AI generation."""
        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")
        
        normalized_status = default_phase_status()
        normalized_status.update(project.phase_status or {})
        status = dict(normalized_status)
        
        if phase in PHASE_ORDER:
            status[phase] = "ready"
            project = await self.project_repo.update_phase_status(project_id, organization, status)
            return project.phase_status
        
        raise ValueError("Invalid phase")

    async def generate_phase(
        self,
        project_id: str,
        organization: str,
        phase: str,
        prompt: str,
        user_id: Optional[str] = None,
    ) -> Tuple[Dict[str, str], Dict]:
        phase = phase.lower()
        if phase not in PHASE_ORDER:
            raise ValueError("Invalid phase")

        project = await self.project_repo.get_by_id(project_id, organization)
        if not project:
            raise ValueError("Project not found")

        # Normalize status to ensure every phase is present
        normalized_status = default_phase_status()
        normalized_status.update(project.phase_status or {})
        status = dict(normalized_status)
        current_state = status.get(phase)
        
        # Auto-unlock phases for better user experience
        if current_state == "locked":
            # Auto-unlock the requested phase if user wants to generate it
            current_state = "ready"
            status[phase] = "ready"
            logger.info(f"Auto-unlocked phase {phase} for generation")
            
        if current_state == "completed":
            # Allow regenerating completed phases by resetting to ready
            current_state = "ready"
            status[phase] = "ready"
            
        if current_state not in {"ready", "in_progress"}:
            raise PermissionError(f"Phase {phase} is in state {current_state}. Unable to generate.")

        status[phase] = "in_progress"
        await self.project_repo.update_phase_status(project_id, organization, status)

        # Build prior context from completed phases
        prior_context = await self._build_prior_context(project_id, phase)

        logger.info(f"Starting content generation for phase {phase}, project {project_id}")
        raw_content = await self._run_phase_prompt(project.id, project.name, phase, prompt, user_id, prior_context)
        
        # Debug logging to track content generation
        logger.info(f"Generated content for phase {phase}: {len(raw_content)} characters")
        logger.info(f"Raw content preview: {raw_content[:200]}...")
        
        if not raw_content or raw_content.strip() == "":
            logger.error(f"Empty content generated for phase {phase}")
            raw_content = f"# {PHASE_TITLES[phase]}\n\nError: No content was generated for this phase."
            
        formatted_content = self.markdown_formatter.format(raw_content, artifact_type=f"phase:{phase}")
        logger.info(f"Formatted content length: {len(formatted_content)} characters")

        artifact_type = f"PHASE_{phase.upper()}"
        metadata = {"phase": phase}
        payload = {
            "markdown": formatted_content,
            "raw_markdown": raw_content,
        }
        
        logger.info(f"Creating artifact with type: {artifact_type}")
        logger.info(f"Payload keys: {list(payload.keys())}")
        logger.info(f"Payload markdown length: {len(payload.get('markdown', ''))}")
        
        artifact = await self.artifact_repo.upsert_artifact(
            project_id,
            artifact_type,
            f"{PHASE_TITLES[phase]} Output",
            payload,
            metadata=metadata,
        )
        
        logger.info(f"Created artifact with ID: {artifact.id}")
        logger.info(f"Artifact content_json keys: {list(artifact.content_json.keys()) if artifact.content_json else 'None'}")
        if user_id:
            await self.version_service.create_version(
                VersionCreate(
                    project_id=project_id,
                    entity_type="artifact",
                    entity_id=artifact.id,
                    version_number=artifact.version,
                    changes=payload,
                    change_summary=f"Generated {PHASE_TITLES[phase]} phase output",
                    changed_by=user_id,
                ),
                changed_by_name=user_id,
            )
            await self.activity_repo.record(
                project_id=project_id,
                user_id=user_id,
                event_type="phase_generated",
                details_json={
                    "phase": phase,
                    "artifact_id": artifact.id,
                    "artifact_type": artifact_type,
                    "version": artifact.version,
                },
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
            "raw_markdown": raw_content,
            "formatted_markdown": formatted_content,
            "metadata": artifact.metadata,
        }

    async def _build_prior_context(self, project_id: str, current_phase: str) -> str:
        """Fetch previously completed phase artifacts and build a context string."""
        try:
            current_index = PHASE_ORDER.index(current_phase)
        except ValueError:
            return ""

        context_parts = []
        for phase_id in PHASE_ORDER[:current_index]:
            artifact_type = f"PHASE_{phase_id.upper()}"
            try:
                artifact = await self.artifact_repo.get_latest_by_type(project_id, artifact_type)
                if artifact and artifact.content_json:
                    markdown = (
                        artifact.content_json.get("markdown")
                        or artifact.content_json.get("raw_markdown")
                        or ""
                    )
                    if markdown:
                        title = PHASE_TITLES.get(phase_id, phase_id)
                        # Limit each phase to 2000 chars to avoid token limits
                        snippet = markdown[:2000]
                        if len(markdown) > 2000:
                            snippet += "\n...[truncated]"
                        context_parts.append(f"[{title.upper()}]:\n{snippet}")
            except Exception as exc:
                logger.warning(f"Could not fetch prior context for phase {phase_id}: {exc}")

        if not context_parts:
            return ""

        return (
            "=== PREVIOUS PHASE OUTPUTS (for context) ===\n"
            + "\n\n".join(context_parts)
            + "\n=== END CONTEXT ===\n\n"
        )

    async def _run_phase_prompt(
        self,
        project_id: str,
        project_name: str,
        phase: str,
        user_prompt: str,
        user_id: Optional[str] = None,
        prior_context: str = "",
    ) -> str:
        # Use placeholder content if no OpenAI API key is configured
        if not settings.openai_api_key:
            logger.info(f"No OpenAI API key configured, using placeholder content for phase {phase}")
            return await self._generate_placeholder_content(phase, user_prompt)
            
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
                "Regenerate a complete Development Plan using all available project context (planning, feasibility, "
                "requirements, validation, and design outputs). Use this exact section layout so the UI can parse it: \n"
                "\n## Tech Stack\n"
                "- Group technologies by area (Frontend, Backend, Database, Infrastructure, Tooling).\n"
                "- For each item, use the format `Name: short description`.\n"
                "\n## Flow\n"
                "- Provide 5–10 high-level steps showing the request/response flow end-to-end.\n"
                "- Use a simple bulleted or numbered list with the format `Step name: short description`.\n"
                "- Keep each step on a single line so it can be turned into a diagram node.\n"
                "\n## Folder Structure\n"
                "```\n"
                "<tree-style directory structure for the project, using indents and ├── / └── where helpful>\n"
                "```\n"
                "\n## Components (optional)\n"
                "- If helpful, list key controllers, services, repositories, models, and frontend components.\n"
                "- Use bullets with the format `ComponentName: short responsibility description`.\n"
                "\nKeep the response concise and in clean Markdown so it maps cleanly onto the Stack, Flow, and Folder Structure tabs."
            ),
            "tasks": (
                "Author the Execution Map: break work into epics, stories, and tasks with time estimates. "
                "Define dependencies, milestones, and owner assignments for Gantt visualization."
            ),
            "cost_benefit": (
                "Produce a concise Cost & Benefit analysis using the latest project context (requirements, tasks, and any custom items). "
                "Summarize the main cost drivers, estimated benefits, and ROI. Highlight budget hotspots and high-ROI opportunities. "
                "If the user provided a scenario (team size, role mix, custom ROI, or what-if prompt), reflect that scenario explicitly in the analysis."
            ),
            "risks": (
                "Compile a clear, actionable Risk Register for the project in Markdown. Use this exact structure: \n"
                "\n# Risk Overview\n"
                "Provide 2–3 bullet points summarizing overall risk posture (e.g., main themes, confidence level).\n"
                "\n## Risk Register\n"
                "Create a Markdown table with columns: `Risk`, `Impact`, `Likelihood`, `Mitigation`, `Owner`.\n"
                "- Include at least 8–12 distinct risks covering delivery, technical, security, data, UX, organizational, and dependency risks.\n"
                "- Use simple values like High/Medium/Low for Impact and Likelihood.\n"
                "\n## Before vs After Mitigation\n"
                "Create a small comparison table that shows how the overall risk posture changes if mitigations are applied, e.g.:\n"
                "| Aspect | Before | After |\n"
                "|--------|--------|-------|\n"
                "| Delivery risk | High | Medium |\n"
                "| Technical risk | High | Medium |\n"
                "| ... | ... | ... |\n"
                "\n## Recommended Actions (Checklist)\n"
                "List 5–10 concrete next actions as a Markdown checklist (using - [ ]), each referencing one or more risks and owners.\n"
                "Keep the entire response in clean Markdown so the UI can render tables and sections side-by-side."
            ),
            "testing": (
                "Produce a Testing Plan for the project: identify key test categories (unit, integration, "
                "end-to-end, performance), list critical test scenarios for the functional requirements, "
                "highlight edge cases and boundary conditions, and recommend a test data strategy. "
                "Include a coverage checklist mapping requirements to test scenarios."
            ),
            "summary": (
                "Compile the Project Summary: key achievements, final metrics, lessons learned, "
                "outstanding risks, recommendations for future work, and stakeholder acknowledgments."
            ),
        }
        user_prompt = user_prompt.strip() or "Use available project context."
        phase_text = phase_instructions.get(phase, "")
        prompt = (
            f"{prior_context}"
            f"Project: {project_name}\n"
            f"Phase: {PHASE_TITLES[phase]}\n"
            f"System expectations: {phase_text}\n"
            f"User request: {user_prompt}\n\n"
            "Produce a structured Markdown response with headings, bullet lists, and clear action items."
        )

        run_entry = await self.ai_run_repo.create_run(
            project_id=project_id,
            user_id=user_id,
            job_type="phase",
            phase=phase,
            provider="openai",
            model=settings.openai_model,
            prompt=prompt,
            metadata={"phase_title": PHASE_TITLES.get(phase)},
        )

        # Call OpenAI API
        started_at = time.perf_counter()
        try:
            logger.info(f"Calling OpenAI API with model: {settings.openai_model} for phase: {phase}")
            full_prompt = f"{prompt}\n\nProduce a structured Markdown response with clear headings, bullet lists, and actionable items."
            response = await call_openai(full_prompt, system=system_message, max_tokens=4000)
            duration = int((time.perf_counter() - started_at) * 1000)
            logger.info(f"OpenAI response received: {len(response)} characters in {duration}ms")
            await self.ai_run_repo.complete_run(
                run_entry.id,
                status="completed",
                response=response,
                duration_ms=duration,
            )
            return response
        except Exception as exc:
            logger.error("Failed to generate phase output: %s", exc)
            duration = int((time.perf_counter() - started_at) * 1000)
            await self.ai_run_repo.complete_run(
                run_entry.id,
                status="failed",
                error_message=str(exc),
                duration_ms=duration,
            )
            # Fall back to placeholder content so the UI never breaks
            logger.info(f"Falling back to placeholder content for phase {phase}")
            return await self._generate_placeholder_content(phase, user_prompt)

    async def _generate_placeholder_content(self, phase: str, user_prompt: str) -> str:
        """Generate useful placeholder content when LLM is not available."""
        logger.info(f"Generating placeholder content for phase: {phase}")
        logger.info(f"User prompt: {user_prompt[:100] if user_prompt else 'None'}...")
        
        phase_templates = {
            "planning": """# Planning Brief

## Project Vision
{user_prompt}

## Key Objectives
- Define project scope and boundaries
- Identify core stakeholders and their needs  
- Establish success criteria and metrics
- Outline major constraints and assumptions

## Business Goals
- Primary goal: [To be defined based on project requirements]
- Secondary goals: [Supporting objectives]
- Success metrics: [Measurable outcomes]

## Risk Considerations
- Technical feasibility needs assessment
- Resource availability and constraints
- Timeline and budget considerations
- Stakeholder alignment requirements

## Next Steps
1. Stakeholder interviews and requirements gathering
2. Technical feasibility assessment  
3. Resource planning and timeline estimation
4. Risk mitigation strategy development

*Note: This is placeholder content. Configure LLM API keys for AI-generated analysis.*""",

            "feasibility_study": """# Feasibility Study

## Executive Summary
Based on the project brief: {user_prompt}

## Market Analysis
- **Market Opportunity**: [Assess market size and demand]
- **Competitive Landscape**: [Key competitors and differentiators]
- **Target Audience**: [Primary user segments]

## Technical Feasibility
- **Technology Stack**: [Recommended technologies]
- **Development Complexity**: Medium to High
- **Infrastructure Requirements**: [Server, database, third-party services]
- **Security Considerations**: [Data protection, compliance needs]

## Economic Viability  
- **Development Costs**: [Estimated development effort]
- **Operational Costs**: [Hosting, maintenance, support]
- **Revenue Potential**: [Business model considerations]
- **ROI Timeline**: [Expected return on investment]

## Recommendation
**GO/NO-GO**: Proceed with caution - conduct detailed requirements gathering

*Note: This is placeholder content. Configure LLM API keys for detailed analysis.*""",

            "requirements_gathering": """# Requirements Document

## User Stories
Based on: {user_prompt}

### Core User Stories
1. **As a user**, I want to [core functionality] so that [benefit]
2. **As an admin**, I want to [management capability] so that [control]
3. **As a stakeholder**, I want to [visibility feature] so that [insight]

## Functional Requirements
- **F1**: Core feature implementation
- **F2**: User authentication and authorization  
- **F3**: Data management and persistence
- **F4**: User interface and experience
- **F5**: Integration capabilities

## Non-Functional Requirements
- **Performance**: System should handle [X] concurrent users
- **Security**: Data encryption and secure authentication
- **Scalability**: Architecture should support growth
- **Usability**: Intuitive interface with minimal learning curve
- **Reliability**: 99.9% uptime with proper error handling

## Acceptance Criteria
- All core features function as specified
- Security requirements are met
- Performance benchmarks are achieved
- User experience is validated through testing

*Note: This is placeholder content. Configure LLM API keys for detailed requirements.*""",

            "validation": """# Validation Checklist

## Stakeholder Sign-off Criteria
- [ ] Requirements reviewed and approved by product owner
- [ ] Technical architecture validated by engineering team
- [ ] Security requirements approved by security team
- [ ] UI/UX mockups reviewed by design stakeholders

## Prototype Validation Steps
1. **Functional Validation**
   - [ ] Core features demonstrate expected behavior
   - [ ] User workflows are intuitive and complete
   - [ ] Integration points are verified

2. **Technical Validation**
   - [ ] Architecture supports scalability requirements
   - [ ] Security measures are properly implemented
   - [ ] Performance meets defined benchmarks

3. **User Validation**
   - [ ] User testing sessions completed
   - [ ] Feedback incorporated into requirements
   - [ ] Accessibility requirements validated

## Risk Confirmation Matrix
| Risk Area | Identified | Mitigation Plan | Validated |
|-----------|------------|----------------|-----------|
| Technical | ✓ | [Strategy] | [ ] |
| Security | ✓ | [Strategy] | [ ] |  
| Performance | ✓ | [Strategy] | [ ] |
| User Adoption | ✓ | [Strategy] | [ ] |

*Note: This is placeholder content. Configure LLM API keys for comprehensive validation.*""",

            "design": """# Design Document

## System Architecture Overview
High-level architecture for: {user_prompt}

### Component Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Backend API   │◄──►│   Database      │
│   (React/Vue)   │    │   (Node/Python) │    │   (SQL/NoSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Models
### Core Entities
- **Users**: Authentication and profile management
- **Content**: Primary data entities
- **Metadata**: System configuration and settings

## API Specifications
### Core Endpoints
- `GET /api/v1/[resource]` - List resources
- `POST /api/v1/[resource]` - Create resource
- `PUT /api/v1/[resource]/{id}` - Update resource
- `DELETE /api/v1/[resource]/{id}` - Delete resource

## UX Wireframe Descriptions
- **Dashboard**: Main interface with key metrics and navigation
- **Detail Views**: Focused interfaces for specific operations
- **Settings**: Configuration and user preferences

## Integration Touchpoints
- Authentication system integration
- Third-party API connections
- Database synchronization points

*Note: This is placeholder content. Configure LLM API keys for detailed design.*""",

            "development": """# Development Plan

## Tech Stack

### Frontend
- React: Modern UI framework with component-based architecture
- TypeScript: Type safety and better development experience
- Tailwind CSS: Utility-first styling framework
- React Router: Client-side routing

### Backend  
- Node.js: Server runtime environment
- Express: Web application framework
- TypeScript: Type safety for backend code
- JWT: Authentication and authorization

### Database
- PostgreSQL: Primary relational database
- Redis: Caching and session storage

### Infrastructure
- Docker: Containerization platform
- AWS/Vercel: Cloud hosting and deployment
- GitHub Actions: CI/CD pipeline

## Development Flow
1. User authentication: Login/signup with JWT tokens
2. Request routing: Frontend makes API calls to backend
3. Business logic: Backend processes requests and validates data
4. Database operations: CRUD operations on data entities
5. Response formatting: API returns structured JSON responses
6. UI updates: Frontend updates interface based on responses

## Implementation Steps
1. Set up development environment
2. Create database schema and models
3. Implement authentication system
4. Build core API endpoints
5. Develop frontend components
6. Add testing and deployment

*Note: This is placeholder content. Configure LLM API keys for detailed development guidance.*""",

            "tasks": """# Task Planning

## Development Tasks
Based on project requirements: {user_prompt}

### Phase 1: Foundation
- [ ] Project setup and environment configuration
- [ ] Database design and setup
- [ ] Authentication system implementation
- [ ] Basic API structure

### Phase 2: Core Features
- [ ] Core functionality implementation
- [ ] User interface development  
- [ ] Data management systems
- [ ] Integration points

### Phase 3: Enhancement
- [ ] Advanced features
- [ ] Performance optimization
- [ ] Security hardening
- [ ] User experience improvements

### Phase 4: Deployment
- [ ] Testing and quality assurance
- [ ] Production deployment setup
- [ ] Monitoring and logging
- [ ] Documentation completion

## Resource Allocation
- **Development**: 60% of effort
- **Testing**: 20% of effort
- **Documentation**: 10% of effort
- **Deployment**: 10% of effort

*Note: This is placeholder content. Configure LLM API keys for detailed task planning.*""",

            "cost_benefit": """# Cost-Benefit Analysis

## Development Costs
Based on project scope: {user_prompt}

### Initial Development
- **Development Team**: 3-6 months
- **Infrastructure Setup**: Initial setup costs
- **Third-party Services**: API integrations and licenses
- **Total Estimated Cost**: $XX,XXX - $XX,XXX

### Ongoing Costs
- **Hosting and Infrastructure**: Monthly operational costs
- **Maintenance**: Bug fixes and updates
- **Support**: User support and documentation
- **Scaling**: Growth-related infrastructure costs

## Expected Benefits
- **Efficiency Gains**: Estimated time savings
- **Revenue Opportunities**: Potential income streams  
- **User Value**: Improved experience and satisfaction
- **Competitive Advantage**: Market positioning benefits

## ROI Analysis
- **Break-even Point**: X-X months
- **Expected ROI**: XX% over X years
- **Risk Assessment**: Medium risk, high reward potential

*Note: This is placeholder content. Configure LLM API keys for detailed analysis.*""",

            "risks": """# Risk Analysis and Mitigation

## Technical Risks
- **Scalability**: System may not handle expected load
  - *Mitigation*: Performance testing and scalable architecture
- **Security**: Data breaches or unauthorized access
  - *Mitigation*: Security audits and best practices implementation
- **Integration**: Third-party service dependencies
  - *Mitigation*: Fallback systems and multiple provider options

## Business Risks  
- **Market Competition**: Similar solutions entering market
  - *Mitigation*: Unique value proposition and rapid iteration
- **User Adoption**: Low engagement or retention
  - *Mitigation*: User research and iterative improvements
- **Budget Overrun**: Development costs exceeding estimates
  - *Mitigation*: Phased development and regular budget reviews

## Operational Risks
- **Team Changes**: Key personnel leaving project
  - *Mitigation*: Documentation and knowledge sharing
- **Timeline Delays**: Development taking longer than expected
  - *Mitigation*: Buffer time and parallel development tracks

*Note: This is placeholder content. Configure LLM API keys for comprehensive risk analysis.*"""
        }
        
        template = phase_templates.get(phase, f"""# {PHASE_TITLES.get(phase, phase.title())}

User Request: {user_prompt}

This phase requires detailed analysis and planning. 

## Key Considerations
- Project context and requirements
- Technical feasibility and constraints  
- Resource availability and timeline
- Risk assessment and mitigation
- Stakeholder needs and expectations

## Recommendations
1. Review project requirements and constraints
2. Conduct stakeholder interviews for clarity
3. Assess technical options and trade-offs
4. Develop detailed implementation plan
5. Validate approach with key stakeholders

*Note: This is placeholder content. Configure LLM API keys for AI-generated analysis.*""")
        
        result = template.format(user_prompt=user_prompt[:200] if user_prompt else "No specific prompt provided")
        logger.info(f"Placeholder template result length: {len(result)} characters")
        logger.info(f"Using template for phase: {phase}, found: {phase in phase_templates}")
        return result
