"""Persona and User Story generation service."""

import json
import uuid
from typing import List, Dict, Any
from datetime import datetime

from models.persona import Persona, PersonaCreate, UserStory, UserStoryCreate, GeneratePersonasRequest
from services.llm_client import LLMClient


class PersonaService:
    """Service for persona and user story generation."""
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def generate_personas(
        self, 
        project_id: str, 
        request: GeneratePersonasRequest
    ) -> List[Dict[str, Any]]:
        """Generate user personas using AI."""
        
        prompt = f"""
Generate {request.num_personas} detailed user personas for a software project with the following context:

Industry: {request.industry or 'General Software'}
Target Users: {request.target_users or 'General users'}
Project Goals: {request.project_goals or 'Improve user experience'}

For each persona, provide:
1. Name (realistic)
2. Role/Job Title
3. Age Range (e.g., "25-35")
4. Background (2-3 sentences)
5. Goals (3-5 specific goals)
6. Pain Points (3-5 specific frustrations)
7. Tech Savviness (beginner/intermediate/advanced)
8. Motivations (3-5 items)
9. Frustrations (3-5 items)
10. Preferred Channels (e.g., mobile app, web, email)
11. A memorable quote that represents them

Respond with a JSON array of personas.
"""
        
        try:
            response = await self.llm_client.generate(prompt)
            
            # Parse JSON response
            personas_data = json.loads(response)
            
            # Ensure it's a list
            if isinstance(personas_data, dict):
                personas_data = [personas_data]
            
            # Add project_id and IDs
            personas = []
            for persona_data in personas_data[:request.num_personas]:
                persona = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "name": persona_data.get("name", "Unknown User"),
                    "role": persona_data.get("role", "User"),
                    "age_range": persona_data.get("age_range", "25-45"),
                    "background": persona_data.get("background", ""),
                    "goals": persona_data.get("goals", []),
                    "pain_points": persona_data.get("pain_points", []),
                    "tech_savviness": persona_data.get("tech_savviness", "intermediate"),
                    "motivations": persona_data.get("motivations", []),
                    "frustrations": persona_data.get("frustrations", []),
                    "preferred_channels": persona_data.get("preferred_channels", ["web"]),
                    "quote": persona_data.get("quote", ""),
                    "avatar_url": None,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                personas.append(persona)
            
            return personas
            
        except json.JSONDecodeError:
            # Fallback: create a default persona
            return [{
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": "Default User",
                "role": "End User",
                "age_range": "25-45",
                "background": "A typical user of the system",
                "goals": ["Complete tasks efficiently", "Easy to use interface"],
                "pain_points": ["Complex workflows", "Slow performance"],
                "tech_savviness": "intermediate",
                "motivations": ["Productivity", "Ease of use"],
                "frustrations": ["Technical issues", "Poor documentation"],
                "preferred_channels": ["web", "mobile"],
                "quote": "I just want it to work!",
                "avatar_url": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }]
    
    async def generate_user_stories(
        self,
        project_id: str,
        personas: List[Dict[str, Any]],
        num_stories_per_persona: int = 5
    ) -> List[Dict[str, Any]]:
        """Generate user stories from personas."""
        
        all_stories = []
        
        for persona in personas:
            prompt = f"""
Generate {num_stories_per_persona} user stories for this persona:

Name: {persona['name']}
Role: {persona['role']}
Goals: {', '.join(persona.get('goals', []))}
Pain Points: {', '.join(persona.get('pain_points', []))}

For each user story, provide:
1. Title (concise, action-oriented)
2. As a (role)
3. I want (action/feature)
4. So that (benefit/value)
5. Acceptance Criteria (3-5 specific, testable criteria)
6. Priority (low/medium/high/critical)
7. Story Points (1, 2, 3, 5, 8, 13)

Respond with a JSON array of user stories.
"""
            
            try:
                response = await self.llm_client.generate(prompt)
                stories_data = json.loads(response)
                
                if isinstance(stories_data, dict):
                    stories_data = [stories_data]
                
                for story_data in stories_data[:num_stories_per_persona]:
                    story = {
                        "id": str(uuid.uuid4()),
                        "project_id": project_id,
                        "persona_id": persona['id'],
                        "title": story_data.get("title", "User Story"),
                        "as_a": story_data.get("as_a", persona['role']),
                        "i_want": story_data.get("i_want", ""),
                        "so_that": story_data.get("so_that", ""),
                        "acceptance_criteria": story_data.get("acceptance_criteria", []),
                        "priority": story_data.get("priority", "medium"),
                        "story_points": story_data.get("story_points", 3),
                        "status": "draft",
                        "linked_requirements": [],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    all_stories.append(story)
                    
            except json.JSONDecodeError:
                # Create default story
                story = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "persona_id": persona['id'],
                    "title": f"Story for {persona['name']}",
                    "as_a": persona['role'],
                    "i_want": "to accomplish my goals",
                    "so_that": "I can be more productive",
                    "acceptance_criteria": ["Feature works as expected"],
                    "priority": "medium",
                    "story_points": 3,
                    "status": "draft",
                    "linked_requirements": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                all_stories.append(story)
        
        return all_stories
