"""Phase flow routes."""

import logging
import json
import asyncio
import time
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from models.user import User
from routes.auth import get_current_user
from services.phase_flow_service import PhaseFlowService, PHASE_ORDER, PHASE_TITLES
from services.project_service import ProjectService
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
phase_service = PhaseFlowService()
project_service = ProjectService()


class PhaseGenerateRequest(BaseModel):
    prompt: str = ""


class PhaseGenerateResponse(BaseModel):
    phase_status: dict
    content: dict
    raw_markdown: Optional[str] = None
    formatted_markdown: Optional[str] = None


@router.get("/projects/{project_id}/phases/")
async def get_phase_status(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    status = await phase_service.get_status(project_id, project.organization)
    return {"phases": status, "order": PHASE_ORDER}


@router.post("/projects/{project_id}/phases/{phase}/generate/", response_model=PhaseGenerateResponse)
async def generate_phase_output(
    project_id: str,
    phase: str,
    payload: PhaseGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    project = await project_service.get_project(project_id, current_user)
    try:
        phase_status, artifact = await phase_service.generate_phase(
            project_id,
            project.organization,
            phase,
            payload.prompt,
            current_user.id,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    raw_markdown = artifact.get("raw_markdown")
    formatted_markdown = artifact.get("formatted_markdown")
    
    # Simple debug - this will show in basic server logs
    print(f"[DEBUG] AI Generation Response for {phase}:")
    print(f"[DEBUG] Artifact keys: {list(artifact.keys())}")
    print(f"[DEBUG] Raw markdown length: {len(raw_markdown) if raw_markdown else 0}")
    print(f"[DEBUG] Content keys: {list(artifact.get('content', {}).keys()) if artifact.get('content') else 'No content key'}")
    
    response = PhaseGenerateResponse(
        phase_status=phase_status,
        content=artifact,
        raw_markdown=raw_markdown,
        formatted_markdown=formatted_markdown,
    )
    
    print(f"[DEBUG] Response created successfully for phase {phase}")
    return response


@router.get("/projects/{project_id}/phases/{phase}/generate/stream/")
async def stream_phase_generation(
    project_id: str,
    phase: str,
    prompt: str = Query(default=""),
    token: str = Query(default=""),
    current_user: User = Depends(get_current_user),
):
    """
    Stream phase generation using Server-Sent Events.
    Returns text/event-stream with 'token', 'done', and 'error' event types.
    """
    project = await project_service.get_project(project_id, current_user)

    async def event_generator():
        try:
            # Send start event
            yield f"event: start\ndata: {json.dumps({'phase': phase, 'status': 'generating'})}\n\n"

            # Build the prompt the same way PhaseFlowService does
            phase_instructions = {
                "planning": "Craft the Planning Brief: summarize the problem, vision, guardrails, business goals, key stakeholders, and success metrics.",
                "feasibility_study": "Produce a comprehensive Feasibility Study: market opportunity, technical feasibility, economic viability, operational readiness, and go/no-go recommendation.",
                "requirements_gathering": "Design the Requirements Document: personas, user stories, functional requirements, non-functional requirements, acceptance criteria, and priority scores.",
                "validation": "Provide the Validation Checklist: stakeholder sign-off criteria, prototype validation steps, risk confirmation, and traceability matrix.",
                "design": "Deliver the Design Document: system architecture, component diagrams, data models, API specifications, UX wireframe descriptions.",
                "development": "Produce a complete Development Plan with Tech Stack, Flow, Folder Structure, and key Components.",
                "tasks": "Author the Execution Map: epics, stories, tasks with time estimates, dependencies, milestones, and Gantt data.",
                "cost_benefit": "Produce a concise Cost & Benefit analysis: cost drivers, estimated benefits, ROI, and budget hotspots.",
                "risks": "Compile an actionable Risk Register with Risk Overview, Risk Register table, Before/After mitigation comparison, and Recommended Actions checklist.",
                "summary": "Compile the Project Summary: achievements, final metrics, lessons learned, outstanding risks, and recommendations.",
            }

            system_message = (
                "You are Athena, an expert AI program manager inside the Acorn platform. "
                "Help users through sequential software planning phases. "
                "Provide concise, actionable, well-structured Markdown output."
            )
            phase_text = phase_instructions.get(phase, "Produce a detailed analysis.")
            full_prompt = (
                f"Project: {project.name}\n"
                f"Phase: {PHASE_TITLES.get(phase, phase)}\n"
                f"Instructions: {phase_text}\n"
                f"User request: {prompt.strip() or 'Use available project context.'}\n\n"
                "Produce a structured Markdown response with headings, bullet lists, and clear action items."
            )

            model = genai.GenerativeModel(
                model_name=settings.gemini_pro_model,
                system_instruction=system_message,
            )

            collected_text = ""
            async for chunk in await model.generate_content_async(
                full_prompt,
                generation_config=genai.GenerationConfig(max_output_tokens=4000, temperature=0.7),
                stream=True,
            ):
                if chunk.text:
                    collected_text += chunk.text
                    yield f"event: token\ndata: {json.dumps({'text': chunk.text})}\n\n"
                    await asyncio.sleep(0)  # yield control

            # Persist the result in the background
            try:
                await phase_service.generate_phase(
                    project_id,
                    project.organization,
                    phase,
                    prompt,
                    current_user.id,
                )
            except Exception:
                pass  # streaming already delivered content; persistence failure is non-critical

            yield f"event: done\ndata: {json.dumps({'phase': phase, 'status': 'completed', 'total_chars': len(collected_text)})}\n\n"

        except Exception as exc:
            logger.error(f"Streaming phase generation error: {exc}")
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/projects/{project_id}/phases/unlock-all/")
async def unlock_all_phases(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    """Unlock all phases for development/testing."""
    project = await project_service.get_project(project_id, current_user)
    phase_status = await phase_service.unlock_all(project_id, project.organization)
    return {"phases": phase_status, "order": PHASE_ORDER}


@router.post("/projects/{project_id}/phases/{phase}/unlock/")
async def unlock_phase(
    project_id: str,
    phase: str,
    current_user: User = Depends(get_current_user),
):
    """Unlock a specific phase for generation."""
    project = await project_service.get_project(project_id, current_user)
    try:
        phase_status = await phase_service.unlock_phase(project_id, project.organization, phase)
        return {"phases": phase_status, "order": PHASE_ORDER}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


