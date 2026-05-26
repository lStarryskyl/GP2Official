"""Prompt templates for the Multi-Agent Debate Engine."""

from typing import List, Dict, Any
from models.debate import AgentPersona

def _format_phase_data(phases_data: dict) -> str:
    """Format collected phase data into a readable text block for prompts."""
    sections = []
    for phase_name, phase_content in phases_data.items():
        if not phase_content:
            continue
        if isinstance(phase_content, dict):
            import json
            content_str = json.dumps(phase_content, indent=2, default=str)
        else:
            content_str = str(phase_content)
        # Truncate very long phase outputs
        if len(content_str) > 4000:
            content_str = content_str[:4000] + "\n... [truncated]"
        sections.append(f"### Phase: {phase_name}\n{content_str}")
    return "\n\n".join(sections)

def _format_previous_arguments(arguments_data: List[Dict[str, Any]]) -> str:
    """Format previous arguments for the rebuttal phase."""
    if not arguments_data:
        return ""
    
    sections = ["\n## Previous Arguments from Other Agents:"]
    for arg in arguments_data:
        sections.append(
            f"--- Argument ID: {arg['id']} ---\n"
            f"Agent: {arg['agent_name']} ({arg['agent_role']})\n"
            f"Stance: {arg['stance']}\n"
            f"Title: {arg['title']}\n"
            f"Content: {arg['content']}\n"
        )
    return "\n".join(sections)

def build_debate_prompt(
    persona: AgentPersona, 
    phases_data: dict, 
    round_number: int,
    previous_arguments: List[Dict[str, Any]] = None
) -> str:
    """Build the prompt for an individual agent in a specific debate round."""
    plan_text = _format_phase_data(phases_data)
    
    # Base system prompt from the persona
    prompt = f"{persona.system_prompt}\n\n"
    
    # Task context
    prompt += "You are participating in a multi-agent debate to evaluate the following software project plan:\n\n"
    prompt += f"{plan_text}\n\n"
    
    # Round specific instructions
    if round_number == 1:
        prompt += f"This is ROUND 1. Provide your independent analysis based ONLY on your persona's focus areas ({', '.join(persona.focus_areas)}).\n"
    else:
        prompt += f"This is ROUND {round_number} (Rebuttal).\n"
        prompt += "Review the arguments made by other agents and provide your counter-arguments, agreements, or further insights.\n"
        prompt += "Address specific constraints or oversights highlighted by the others from the perspective of your role.\n"
        if previous_arguments:
            prompt += _format_previous_arguments(previous_arguments)
    
    # Response schema instruction
    prompt += """
Respond with ONLY valid JSON in this exact structure (no markdown borders or extra text):
{
  "stance": "<support|concern|neutral>",
  "title": "<short, punchy title for your argument>",
  "content": "<detailed explanation of your viewpoint>",
  "evidence": "<specific quotes or references from the plan supporting your view>",
  "confidence": <float 0.0-1.0>,
  "target_argument_id": "<null if round 1, or string ID of the argument you are responding to>"
}
"""
    return prompt

def build_consensus_prompt(
    phases_data: dict,
    all_arguments: List[Dict[str, Any]]
) -> str:
    """Build the prompt for the moderator to synthesize the debate into a consensus."""
    plan_text = _format_phase_data(phases_data)
    
    prompt = """You are the LEAD MODERATOR for a multi-agent architectural review session.
Your job is to synthesize the arguments made by various specialized AI agents into a cohesive consensus report.

Project Plan:
"""
    prompt += f"{plan_text}\n\n"
    
    prompt += "## Agent Debate History:\n"
    for arg in all_arguments:
        prompt += (
            f"--- Round {arg['round_number']} | {arg['agent_name']} ({arg['agent_role']}) ---\n"
            f"Stance: {arg['stance']}\n"
            f"Title: {arg['title']}\n"
            f"Content: {arg['content']}\n\n"
        )

    prompt += """
Synthesize the above debate into a structured consensus report.
Identify areas where agents completely agreed, areas of compromise, and remaining unresolved risks.

Respond with ONLY valid JSON in this exact structure (no markdown borders or extra text):
{
  "overall_summary": "<high-level summary of the debate outcome>",
  "points": [
    {
      "topic": "<e.g., Database Choice, Security Model, Timeline>",
      "agreed_position": "<what the final consensus is>",
      "dissenting_views": ["<any remaining concerns from specific agents>"],
      "confidence": <float 0.0-1.0>,
      "action_items": ["<concrete steps the engineering team must take>"]
    }
  ],
  "final_verdict": "<short paragraph with the final go/no-go or restructure recommendation>",
  "readiness_score": <integer 0-100 indicating how ready the plan is for execution>
}
"""
    return prompt
