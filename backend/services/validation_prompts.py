"""Prompt templates for AI Plan Validation review passes."""


def _format_phase_data(phases_data: dict) -> str:
    """Format collected phase data into a readable text block for prompts."""
    sections = []
    for phase_name, phase_content in phases_data.items():
        if not phase_content:
            continue
        # phase_content may be a dict or a string
        if isinstance(phase_content, dict):
            import json
            content_str = json.dumps(phase_content, indent=2, default=str)
        else:
            content_str = str(phase_content)
        # Truncate very long phase outputs to stay within token limits
        if len(content_str) > 4000:
            content_str = content_str[:4000] + "\n... [truncated]"
        sections.append(f"### Phase: {phase_name}\n{content_str}")
    return "\n\n".join(sections)


REVIEW_SYSTEM_MESSAGE = (
    "You are a Senior Technical Architect and Software Engineering expert. "
    "You are reviewing a software project plan produced by an AI-powered SDLC tool. "
    "Your reviews must be specific, actionable, and grounded in real engineering principles. "
    "Always respond with valid JSON matching the requested schema exactly."
)


RESPONSE_SCHEMA_INSTRUCTION = """
Respond with ONLY valid JSON in this exact structure (no markdown, no extra text):
{
  "score": <integer 0-100>,
  "findings": [
    {
      "severity": "<critical|warning|info>",
      "title": "<short title>",
      "description": "<detailed description of the issue>",
      "affected_phase": "<which phase this relates to>",
      "recommendation": "<specific actionable recommendation>",
      "confidence": <float 0.0-1.0>,
      "reasoning": "<why this was flagged>"
    }
  ]
}
"""


def build_feasibility_prompt(phases_data: dict) -> str:
    """Build the feasibility review prompt."""
    plan_text = _format_phase_data(phases_data)
    return f"""{REVIEW_SYSTEM_MESSAGE}

You are performing a FEASIBILITY REVIEW of the following software project plan.

{plan_text}

Evaluate the plan on these criteria:
1. Are the chosen technologies appropriate for the stated goals?
2. Is the implied timeline realistic given the scope and complexity?
3. Are resource requirements (team size, infrastructure, budget) reasonable?
4. Are there any technically impossible or severely impractical aspects?
5. Are external dependencies and third-party integrations realistic?
6. Is the proposed architecture achievable with the described tech stack?

Score 0-100 where:
- 90-100: Highly feasible, well-planned
- 70-89: Feasible with minor concerns
- 50-69: Feasible but significant concerns exist
- 30-49: Questionable feasibility, major rework needed
- 0-29: Not feasible as described

{RESPONSE_SCHEMA_INSTRUCTION}
"""


def build_completeness_prompt(phases_data: dict) -> str:
    """Build the completeness review prompt."""
    plan_text = _format_phase_data(phases_data)
    return f"""{REVIEW_SYSTEM_MESSAGE}

You are performing a COMPLETENESS REVIEW of the following software project plan.

{plan_text}

Evaluate the plan on these criteria:
1. Are all functional requirements covered by the design and task breakdown?
2. Are non-functional requirements (performance, security, scalability, accessibility) addressed?
3. Is there a testing strategy or test plan mentioned?
4. Are deployment, monitoring, and maintenance considerations included?
5. Are error handling, logging, and observability planned?
6. Are user roles, permissions, and authentication flows defined?
7. Is there documentation or API specification planning?
8. Are data migration and backup strategies considered?

Score 0-100 where:
- 90-100: Comprehensive, covers all critical areas
- 70-89: Good coverage, minor gaps
- 50-69: Moderate gaps in coverage
- 30-49: Significant components missing
- 0-29: Severely incomplete

{RESPONSE_SCHEMA_INSTRUCTION}
"""


def build_consistency_prompt(phases_data: dict) -> str:
    """Build the consistency review prompt."""
    plan_text = _format_phase_data(phases_data)
    return f"""{REVIEW_SYSTEM_MESSAGE}

You are performing a CONSISTENCY REVIEW of the following software project plan.

{plan_text}

Evaluate the plan on these criteria:
1. Do requirements contradict each other?
2. Does the design/architecture align with the stated requirements?
3. Do the development tasks map correctly to the design components?
4. Are naming conventions and terminology consistent across phases?
5. Are priority levels consistent between requirements and their tasks?
6. Do estimates align with the stated complexity levels?
7. Are technology choices consistent across all phases (no conflicting stacks)?
8. Do user stories/personas align with the functional requirements?

Score 0-100 where:
- 90-100: Highly consistent, well-aligned phases
- 70-89: Mostly consistent, minor misalignments
- 50-69: Some inconsistencies that need attention
- 30-49: Significant contradictions or misalignments
- 0-29: Severely inconsistent, phases don't align

{RESPONSE_SCHEMA_INSTRUCTION}
"""


def build_risk_prompt(phases_data: dict) -> str:
    """Build the risk review prompt."""
    plan_text = _format_phase_data(phases_data)
    return f"""{REVIEW_SYSTEM_MESSAGE}

You are performing a RISK REVIEW of the following software project plan.

{plan_text}

Evaluate the plan for these risk categories:
1. **Technical Debt Risk**: Are there shortcuts or anti-patterns that will accumulate debt?
2. **Scalability Risk**: Will the architecture handle 10x or 100x growth?
3. **Security Risk**: Are there authentication, authorization, data protection, or input validation gaps?
4. **Dependency Risk**: Are there risky third-party dependencies, single points of failure, or vendor lock-in?
5. **Integration Risk**: Are API contracts, data formats, and communication protocols well-defined?
6. **Performance Risk**: Are there potential bottlenecks, N+1 queries, or missing caching strategies?
7. **Operational Risk**: Are deployment, rollback, monitoring, and incident response planned?
8. **Team Risk**: Does the plan require skills or expertise that may be hard to find?

Score 0-100 where:
- 90-100: Very low risk, well-mitigated
- 70-89: Low risk with minor concerns
- 50-69: Moderate risk, some mitigation needed
- 30-49: High risk, significant mitigation required
- 0-29: Very high risk, plan needs major revision

{RESPONSE_SCHEMA_INSTRUCTION}
"""


PROMPT_BUILDERS = {
    "feasibility": build_feasibility_prompt,
    "completeness": build_completeness_prompt,
    "consistency": build_consistency_prompt,
    "risk": build_risk_prompt,
}
