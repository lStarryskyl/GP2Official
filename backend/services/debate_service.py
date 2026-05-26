"""Service for orchestrating multi-agent debates over software project plans."""

import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from models.debate import (
    DebateSession, DebateRound, DebateArgument, ArgumentStance,
    ConsensusReport, ConsensusPoint, AgentRole, DebateRequest
)
from services.agent_personas import get_personas
from services.debate_prompts import build_debate_prompt, build_consensus_prompt
from services.ai_pipeline_service import ai_pipeline, TaskType
from services.websocket_service import connection_manager, WebSocketMessage
from database import get_db

logger = logging.getLogger(__name__)

class DebateService:
    def __init__(self, db: AsyncIOMotorClient = get_db):
        self.db = db()
    
    async def _collect_phase_data(self, project_id: str) -> dict:
        """Collect all available project context for the debate agents."""
        phases_data = {}
        
        # 0. Project-level context (name, description, brief, tech stack, stored phases)
        project = await self.db.projects.find_one({"_id": project_id})
        if project:
            project_info = {}
            for field in ("name", "description", "brief", "project_brief", "tech_stack"):
                val = project.get(field)
                if val:
                    project_info[field] = val
            if project_info:
                phases_data["0_project_overview"] = project_info
            
            # Include any stored phase content (from AI generation results)
            stored_phases = project.get("phases") or {}
            for phase_key, phase_content in stored_phases.items():
                if phase_content:
                    phases_data[f"phase_{phase_key}"] = phase_content
        
        # 1. PRD / Requirements Phase
        reqs_cursor = self.db.requirements.find({"project_id": project_id})
        reqs = await reqs_cursor.to_list(length=100)
        if reqs:
            phases_data["1_requirements"] = [
                {"title": r.get("title"), "desc": r.get("description"), "type": r.get("type")} 
                for r in reqs
            ]
            
        # 2. Tech Stack / System Design Phase
        dev_doc = await self.db.workspace_elements.find_one({
            "project_id": project_id,
            "type": "development"
        })
        if dev_doc:
            phases_data["2_system_design"] = dev_doc.get("data", {})
            
        # 3. Task Breakdown Phase
        tasks_cursor = self.db.tasks.find({"project_id": project_id})
        tasks = await tasks_cursor.to_list(length=100)
        if tasks:
            phases_data["3_tasks"] = [
                {"title": t.get("title"), "desc": t.get("description"), "est": t.get("estimate_hours")} 
                for t in tasks
            ]
            
        return phases_data

    async def _broadcast_update(self, project_id: str, session: DebateSession):
        """Broadcast the current debate state via WebSockets."""
        msg = WebSocketMessage(
            type="debate_update",
            project_id=project_id,
            data=session.dict()
        )
        await connection_manager.broadcast_to_project(project_id, msg)

    async def start_debate(self, project_id: str, user_id: str, request: DebateRequest) -> DebateSession:
        """Initialize and run a multi-agent debate session."""
        
        # Load project
        project = await self.db.projects.find_one({"_id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Collect phases to debate
        phases_data = await self._collect_phase_data(project_id)
        if not phases_data:
            raise HTTPException(status_code=400, detail="Not enough project data to debate. Please complete planning phases first.")

        # Initialize Session
        personas = get_personas(request.participating_roles)
        session = DebateSession(
            id=str(uuid.uuid4()),
            project_id=project_id,
            topic=request.topic,
            status="running",
            participating_agents=personas,
            created_by=user_id
        )
        
        start_time = time.time()
        
        try:
            # Broadcast initial state
            await self._broadcast_update(project_id, session)
            
            all_arguments = []
            
            # --- OVERALL DEBATE LOOP ---
            for round_num in range(1, request.max_rounds + 1):
                round_start = time.time()
                current_round = DebateRound(
                    round_number=round_num,
                    topic=f"Round {round_num} Reviews" if round_num == 1 else "Rebuttals"
                )
                
                # --- AGENT LOOP (Sequential for now to emulate thinking, could be parallelized) ---
                for persona in personas:
                    # Update state to show who is thinking
                    session.active_agent_id = persona.id
                    await self._broadcast_update(project_id, session)
                    
                    # Formatting previous arguments for context
                    prev_args_context = [
                        {
                            "id": arg.id,
                            "agent_name": next((p.name for p in personas if p.id == arg.agent_id), "Unknown"),
                            "agent_role": next((p.role for p in personas if p.id == arg.agent_id), "Unknown"),
                            "stance": arg.stance.value,
                            "title": arg.title,
                            "content": arg.content,
                            "round_number": arg.round_number
                        }
                        for arg in all_arguments
                    ] if round_num > 1 else None

                    # Build prompt
                    prompt = build_debate_prompt(
                        persona=persona,
                        phases_data=phases_data,
                        round_number=round_num,
                        previous_arguments=prev_args_context
                    )
                    
                    # Call LLM
                    logger.info(f"Generating argument for {persona.name} (Round {round_num})")
                    result = await ai_pipeline.generate_with_best_model(
                        prompt=prompt,
                        task_type=TaskType.MULTI_AGENT_DEBATE
                    )
                    
                    # Track metrics
                    session.tokens_used += result.tokens_used
                    
                    # Parse response
                    try:
                        if isinstance(result.content, dict):
                            resp_json = result.content
                        else:
                            import json
                            import re
                            raw_text = str(result.content or "{}")
                            clean_text = re.sub(r'```(?:json)?|```', '', raw_text).strip()
                            resp_json = json.loads(clean_text)
                        
                        argument = DebateArgument(
                            id=str(uuid.uuid4()),
                            agent_id=persona.id,
                            round_number=round_num,
                            stance=ArgumentStance(resp_json.get("stance", "neutral").lower()),
                            title=resp_json.get("title", f"{persona.name}'s Argument"),
                            content=resp_json.get("content", "No content provided."),
                            evidence=resp_json.get("evidence"),
                            confidence=resp_json.get("confidence", 0.8),
                            target_argument_id=resp_json.get("target_argument_id")
                        )
                    except Exception as parse_e:
                        logger.error(f"Failed to parse agent response: {parse_e}")
                        logger.error(f"Raw content: {getattr(result, 'content', 'Unknown')}")
                        argument = DebateArgument(
                            id=str(uuid.uuid4()),
                            agent_id=persona.id,
                            round_number=round_num,
                            stance=ArgumentStance.NEUTRAL,
                            title="Failed to parse argument",
                            content="The agent generated an invalid response format."
                        )

                    current_round.arguments.append(argument)
                    all_arguments.append(argument)
                    
                    # Update UI
                    session.rounds = session.rounds + [] # trigger reactivity if needed
                    if len(session.rounds) < round_num:
                        session.rounds.append(current_round)
                    else:
                        session.rounds[round_num - 1] = current_round
                        
                    await self._broadcast_update(project_id, session)
                    
                # End of round
                current_round.duration_ms = int((time.time() - round_start) * 1000)
                if len(session.rounds) < round_num:
                    session.rounds.append(current_round)
                else:
                    session.rounds[round_num - 1] = current_round

            # --- SYNTHESIS PHASE ---
            session.status = "synthesizing"
            session.active_agent_id = "moderator" # Virtual ID for UI
            await self._broadcast_update(project_id, session)
            
            # Format arguments for moderator
            all_args_context = [
                {
                    "id": arg.id,
                    "agent_name": next((p.name for p in personas if p.id == arg.agent_id), "Unknown"),
                    "agent_role": next((p.role for p in personas if p.id == arg.agent_id), "Unknown"),
                    "stance": arg.stance.value,
                    "title": arg.title,
                    "content": arg.content,
                    "round_number": arg.round_number
                }
                for arg in all_arguments
            ]
            
            consensus_prompt = build_consensus_prompt(phases_data, all_args_context)
            
            logger.info("Generating consensus report")
            consensus_result = await ai_pipeline.generate_with_best_model(
                prompt=consensus_prompt,
                task_type=TaskType.MULTI_AGENT_DEBATE
            )
            
            session.tokens_used += consensus_result.tokens_used
            
            # Parse consensus
            try:
                if isinstance(consensus_result.content, dict):
                    cons_json = consensus_result.content
                else:
                    import json
                    import re
                    raw_text = str(consensus_result.content or "{}")
                    clean_text = re.sub(r'```(?:json)?|```', '', raw_text).strip()
                    cons_json = json.loads(clean_text)
                
                points = [
                    ConsensusPoint(
                        topic=p.get("topic", "General"),
                        agreed_position=p.get("agreed_position", ""),
                        dissenting_views=p.get("dissenting_views", []),
                        confidence=p.get("confidence", 0.8),
                        action_items=p.get("action_items", [])
                    )
                    for p in cons_json.get("points", [])
                ]
                
                session.consensus = ConsensusReport(
                    overall_summary=cons_json.get("overall_summary", ""),
                    points=points,
                    final_verdict=cons_json.get("final_verdict", ""),
                    readiness_score=cons_json.get("readiness_score", 0)
                )
                
            except Exception as e:
                logger.error(f"Failed to parse consensus: {e}")
                session.consensus = ConsensusReport(
                    overall_summary="Failed to parse consensus report.",
                    final_verdict="Error during synthesis."
                )

            # --- FINALIZE ---
            session.status = "completed"
            session.active_agent_id = None
            session.completed_at = datetime.utcnow()
            session.duration_ms = int((time.time() - start_time) * 1000)
            
            # Save to DB
            session_dict = session.dict()
            # Convert datetime objects to ISO strings for MongoDB
            if 'created_at' in session_dict and isinstance(session_dict['created_at'], datetime):
                session_dict['created_at'] = session_dict['created_at'].isoformat()
            if 'completed_at' in session_dict and isinstance(session_dict['completed_at'], datetime):
                session_dict['completed_at'] = session_dict['completed_at'].isoformat()
                
            await self.db.projects.update_one(
                {"_id": project_id},
                {"$push": {"debate_sessions": session_dict}}
            )
            
            await self._broadcast_update(project_id, session)
            return session
            
        except Exception as e:
            logger.error(f"Debate session failed: {e}")
            session.status = "failed"
            session.active_agent_id = None
            session.completed_at = datetime.utcnow()
            session.duration_ms = int((time.time() - start_time) * 1000)
            await self._broadcast_update(project_id, session)
            raise e

    async def get_debates(self, project_id: str) -> List[DebateSession]:
        """Get all debate sessions for a project."""
        project = await self.db.projects.find_one(
            {"_id": project_id},
            {"debate_sessions": 1}
        )
        if not project or "debate_sessions" not in project:
            return []
            
        # Parse stored dictionaries back into DebateSession objects
        sessions = []
        for s_dict in project["debate_sessions"]:
            try:
                # Handle potential string dates in DB
                for date_field in ['created_at', 'completed_at']:
                    if date_field in s_dict and isinstance(s_dict[date_field], str):
                        try:
                            s_dict[date_field] = datetime.fromisoformat(s_dict[date_field].replace('Z', '+00:00'))
                        except ValueError:
                            pass # Let Pydantic try to handle it or fallback
                
                # Convert role strings back to AgentRole enum in participating_agents
                if 'participating_agents' in s_dict:
                    for agent in s_dict['participating_agents']:
                        if isinstance(agent, dict) and 'role' in agent and isinstance(agent['role'], str):
                            try:
                                agent['role'] = AgentRole(agent['role'])
                            except ValueError:
                                pass # Ignore invalid roles here, pydantic might complain later though if it cares
                sessions.append(DebateSession(**s_dict))
            except Exception as e:
                logger.error(f"Error parsing stored debate session {s_dict.get('id')}: {e}")
                
        # Sort by created_at descending (newest first)
        sessions.sort(key=lambda x: x.created_at, reverse=True)
        return sessions

    async def get_debate(self, project_id: str, session_id: str) -> DebateSession:
        """Get a specific debate session."""
        sessions = await self.get_debates(project_id)
        for s in sessions:
            if s.id == session_id:
                return s
                
        raise HTTPException(status_code=404, detail="Debate session not found")
