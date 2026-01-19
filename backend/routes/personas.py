"""Persona and User Story routes."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.persona import GeneratePersonasRequest, GenerateUserStoriesRequest
from services.persona_service import PersonaService
from routes.auth import get_current_user

router = APIRouter()
persona_service = PersonaService()


@router.post("/projects/{project_id}/personas/generate")
async def generate_personas(
    project_id: str,
    request: GeneratePersonasRequest,
    current_user = Depends(get_current_user)
):
    """Generate user personas for a project."""
    try:
        personas = await persona_service.generate_personas(project_id, request)
        return {"personas": personas, "count": len(personas)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/user-stories/generate")
async def generate_user_stories(
    project_id: str,
    request: GenerateUserStoriesRequest,
    current_user = Depends(get_current_user)
):
    """Generate user stories from personas."""
    try:
        # Get personas (would normally fetch from DB)
        personas = []  # TODO: Fetch from repository
        
        stories = await persona_service.generate_user_stories(
            project_id,
            personas,
            request.num_stories_per_persona
        )
        return {"user_stories": stories, "count": len(stories)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
