"""Models for the Multi-Agent Debate Engine."""

from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class AgentRole(str, Enum):
    ARCHITECT = "architect"
    SECURITY_AUDITOR = "security_auditor"
    DEVEX_ADVOCATE = "devex_advocate"
    PRODUCT_STRATEGIST = "product_strategist"

class AgentPersona(BaseModel):
    """Configuration for an AI agent persona."""
    id: str
    role: AgentRole
    name: str
    emoji: str
    avatar_color: str  # Hex color or tailwind class
    system_prompt: str
    focus_areas: List[str]

class ArgumentStance(str, Enum):
    SUPPORT = "support"
    CONCERN = "concern"
    NEUTRAL = "neutral"

class DebateArgument(BaseModel):
    """A single argument made by an agent in a debate."""
    id: str
    agent_id: str
    round_number: int
    stance: ArgumentStance
    title: str
    content: str
    evidence: Optional[str] = None
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    target_argument_id: Optional[str] = None  # If this is a rebuttal

class DebateRound(BaseModel):
    """A single round of debate containing arguments from multiple agents."""
    round_number: int
    topic: str
    arguments: List[DebateArgument] = []
    duration_ms: int = 0

class ConsensusPoint(BaseModel):
    """A synthesized point of consensus or remaining disagreement."""
    topic: str
    agreed_position: str
    dissenting_views: List[str] = []
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    action_items: List[str] = []

class ConsensusReport(BaseModel):
    """The final synthesized report from the moderator."""
    overall_summary: str
    points: List[ConsensusPoint] = []
    final_verdict: str
    readiness_score: float = Field(default=0.0, ge=0.0, le=100.0)

class DebateSession(BaseModel):
    """A complete multi-agent debate session for a project."""
    id: str
    project_id: str
    topic: str = "Project Plan Architecture Review"
    status: str = "pending"  # pending | running | synthesizing | completed | failed
    active_agent_id: Optional[str] = None  # Which agent is currently "thinking"
    participating_agents: List[AgentPersona] = []
    rounds: List[DebateRound] = []
    consensus: Optional[ConsensusReport] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    created_by: str
    duration_ms: int = 0
    tokens_used: int = 0

class DebateRequest(BaseModel):
    """Request to start a new debate."""
    topic: Optional[str] = "Project Plan Architecture Review"
    participating_roles: Optional[List[AgentRole]] = None  # None = use all defaults
    max_rounds: int = 2

class DebateResponse(BaseModel):
    """Response containing a debate session state."""
    success: bool = True
    session: Optional[DebateSession] = None
    message: str = ""

class DebateListResponse(BaseModel):
    """Response containing a list of debate sessions."""
    success: bool = True
    sessions: List[DebateSession] = []
    total: int = 0
