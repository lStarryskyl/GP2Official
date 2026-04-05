"""Stakeholder negotiation and comment threading service."""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json

from models.negotiation import CommentCreate, NegotiationThreadCreate
from repositories.negotiation_repository import NegotiationRepository
from services.llm_client import LLMClient


class NegotiationService:
    """Service for stakeholder negotiation and threading."""

    def __init__(self):
        self.llm_client = LLMClient()
        self.repo = NegotiationRepository()

    async def create_thread(
        self,
        thread_data: NegotiationThreadCreate,
        created_by: str
    ) -> Dict[str, Any]:
        """Create a new negotiation thread."""

        thread = {
            "project_id": thread_data.project_id,
            "requirement_id": thread_data.requirement_id,
            "title": thread_data.title,
            "description": thread_data.description,
            "status": thread_data.status,
            "priority": thread_data.priority,
            "stakeholder_ids": thread_data.stakeholder_ids,
            "created_by": created_by,
        }

        saved = await self.repo.create_thread(thread)
        return saved.model_dump(by_alias=False)

    async def list_threads(self, project_id: str) -> List[Dict[str, Any]]:
        threads = await self.repo.list_threads_by_project(project_id)
        return [thread.model_dump(by_alias=False) for thread in threads]

    async def get_thread(self, thread_id: str) -> Optional[Dict[str, Any]]:
        thread = await self.repo.get_thread(thread_id)
        return thread.model_dump(by_alias=False) if thread else None

    async def list_comments(self, thread_id: str) -> List[Dict[str, Any]]:
        comments = await self.repo.list_comments(thread_id)
        return [comment.model_dump(by_alias=False) for comment in comments]

    async def add_comment(
        self,
        thread_id: str,
        comment_data: CommentCreate
    ) -> Dict[str, Any]:
        """Add a comment to a thread."""

        comment = {
            "thread_id": thread_id,
            "project_id": comment_data.project_id,
            "requirement_id": comment_data.requirement_id,
            "parent_id": comment_data.parent_id,
            "content": comment_data.content,
            "author_id": comment_data.author_id,
            "author_name": comment_data.author_name,
            "mentions": self._extract_mentions(comment_data.content),
            "reactions": {},
            "edited": False,
        }

        saved = await self.repo.add_comment(comment)
        return saved.model_dump(by_alias=False)

    def _extract_mentions(self, content: str) -> List[str]:
        """Extract @mentions from content."""
        import re

        return re.findall(r"@(\w+)", content)

    async def analyze_impact(
        self,
        change_request: Dict[str, Any],
        requirements: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform AI-driven impact analysis."""

        prompt = f"""
Analyze the impact of this change request:

Title: {change_request.get('title')}
Description: {change_request.get('description')}

Current Requirements: {len(requirements)} total
Current Tasks: {len(tasks)} total

Provide impact analysis with:
1. Affected requirements (list IDs and titles)
2. Affected tasks (list IDs and titles)
3. Effort estimate (hours/days)
4. Cost impact (low/medium/high)
5. Schedule impact (days delay)
6. Risk level (low/medium/high/critical)
7. Benefits (list 3-5)
8. Drawbacks (list 3-5)
9. Recommendation (approve/reject/modify)

Respond in JSON format.
"""

        try:
            response = await self.llm_client.generate(prompt)
            analysis_data = json.loads(response)
            return {
                "id": f"impact_{datetime.utcnow().timestamp()}",
                "change_request_id": change_request.get("id"),
                "affected_requirements": analysis_data.get("affected_requirements", []),
                "affected_tasks": analysis_data.get("affected_tasks", []),
                "effort_estimate": analysis_data.get("effort_estimate", "Unknown"),
                "cost_impact": analysis_data.get("cost_impact", "medium"),
                "schedule_impact": analysis_data.get("schedule_impact", "Unknown"),
                "risk_level": analysis_data.get("risk_level", "medium"),
                "benefits": analysis_data.get("benefits", []),
                "drawbacks": analysis_data.get("drawbacks", []),
                "recommendation": analysis_data.get("recommendation", "Review required"),
                "created_at": datetime.utcnow(),
            }
        except Exception:
            return {
                "id": f"impact_{datetime.utcnow().timestamp()}",
                "change_request_id": change_request.get("id"),
                "affected_requirements": [],
                "affected_tasks": [],
                "effort_estimate": "To be determined",
                "cost_impact": "medium",
                "schedule_impact": "To be determined",
                "risk_level": "medium",
                "benefits": ["Improved functionality"],
                "drawbacks": ["Requires additional effort"],
                "recommendation": "Further analysis required",
                "created_at": datetime.utcnow(),
            }

    async def record_decision(
        self,
        thread_id: str,
        decision: str,
        rationale: str,
        decided_by: str,
        approved_by: List[str]
    ) -> Dict[str, Any]:
        """Record a negotiation decision."""

        return {
            "id": f"decision_{datetime.utcnow().timestamp()}",
            "thread_id": thread_id,
            "decision": decision,
            "rationale": rationale,
            "decided_by": decided_by,
            "approved_by": approved_by,
            "impact_summary": None,
            "created_at": datetime.utcnow(),
        }

    async def resolve_thread(
        self,
        thread_id: str,
        resolution: str
    ) -> Dict[str, Any]:
        """Resolve a negotiation thread."""

        resolved = await self.repo.resolve_thread(thread_id, resolution)
        if not resolved:
            return {
                "thread_id": thread_id,
                "resolution": resolution,
                "resolved_at": datetime.utcnow(),
                "status": "resolved",
            }
        return resolved.model_dump(by_alias=False)
