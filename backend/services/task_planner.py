"""Task planning and scheduling service."""

from typing import List, Dict, Any
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
from config import settings

logger = logging.getLogger(__name__)


class TaskPlanner:
    """Intelligent task breakdown and planning service."""
    
    def __init__(self):
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model_name
    
    async def generate_task_breakdown(self, requirements: List[Dict], project_data: Dict) -> List[Dict[str, Any]]:
        """Generate detailed task breakdown from requirements."""
        
        logger.info(f"Generating task breakdown for {len(requirements)} requirements")
        
        # Build context
        reqs_text = "\n".join([
            f"{i+1}. [{req['type']}] {req['title']}: {req['description']}"
            for i, req in enumerate(requirements[:15])  # Limit to avoid token issues
        ])
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id="task_planning",
            system_message="""You are an expert project manager specializing in software development.
Break down requirements into actionable tasks with estimates, dependencies, and priorities.
Return tasks as a JSON array."""
        ).with_model("openai", self.model)
        
        prompt = f"""Generate a detailed task breakdown for this software project:

Project: {project_data.get('name')}
Type: {project_data.get('template_type', 'web_app')}

Requirements:
{reqs_text}

For each requirement, create 2-4 implementation tasks. Include:
- Task title and description
- Estimated hours (be realistic)
- Priority (critical/high/medium/low)
- Phase (design/development/testing/deployment)
- Dependencies (which tasks must be completed first)

Return as JSON array:
[
  {{
    "title": "Task name",
    "description": "What needs to be done",
    "requirement_title": "Related requirement",
    "estimate_hours": 8,
    "priority": "high",
    "phase": "development",
    "dependencies": []
  }}
]"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        try:
            import json
            response_text = response.strip()
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            tasks = json.loads(response_text)
            return tasks if isinstance(tasks, list) else tasks.get('tasks', [])
        except Exception as e:
            logger.error(f"Failed to parse task breakdown: {e}")
            # Return basic tasks if parsing fails
            return self._generate_basic_tasks(requirements)
    
    def _generate_basic_tasks(self, requirements: List[Dict]) -> List[Dict]:
        """Generate basic tasks as fallback."""
        tasks = []
        for req in requirements[:10]:
            tasks.extend([
                {
                    "title": f"Design {req['title']}",
                    "description": f"Create design and architecture for {req['title']}",
                    "requirement_title": req['title'],
                    "estimate_hours": 4,
                    "priority": req.get('priority', 'medium'),
                    "phase": "design",
                    "dependencies": []
                },
                {
                    "title": f"Implement {req['title']}",
                    "description": f"Develop and code {req['title']}",
                    "requirement_title": req['title'],
                    "estimate_hours": 12,
                    "priority": req.get('priority', 'medium'),
                    "phase": "development",
                    "dependencies": [f"Design {req['title']}"]
                },
                {
                    "title": f"Test {req['title']}",
                    "description": f"Unit and integration testing for {req['title']}",
                    "requirement_title": req['title'],
                    "estimate_hours": 6,
                    "priority": req.get('priority', 'medium'),
                    "phase": "testing",
                    "dependencies": [f"Implement {req['title']}"]
                }
            ])
        return tasks
    
    async def generate_project_schedule(self, tasks: List[Dict]) -> Dict[str, Any]:
        """Generate project timeline and schedule."""
        
        total_hours = sum(task.get('estimate_hours', 0) for task in tasks)
        total_days = total_hours / 8  # Assuming 8-hour workdays
        total_weeks = total_days / 5  # Assuming 5-day work weeks
        
        # Group by phase
        phases = {}
        for task in tasks:
            phase = task.get('phase', 'other')
            if phase not in phases:
                phases[phase] = []
            phases[phase].append(task)
        
        phase_estimates = {}
        for phase, phase_tasks in phases.items():
            phase_estimates[phase] = {
                'task_count': len(phase_tasks),
                'total_hours': sum(t.get('estimate_hours', 0) for t in phase_tasks),
                'tasks': phase_tasks
            }
        
        return {
            'total_hours': total_hours,
            'total_days': round(total_days, 1),
            'total_weeks': round(total_weeks, 1),
            'phases': phase_estimates,
            'recommended_team_size': max(2, min(8, int(total_weeks / 4)))
        }
