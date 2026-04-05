"""FastAPI main application."""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import init_db, close_db
from routes import (
    auth, projects, generation, requirements, tasks, diagrams, ux_flow, phase_flow,
    sandbox, users, change_log, websocket, ai_pipeline, personas, srs_audit, billing, export,
    negotiation, payment, version, notifications, traceability, templates, explainability, utils
)
from routes import ai_chat
from routes import ai_debate
from routes import ai_suggestions
from config import settings

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address)
    SLOWAPI_AVAILABLE = True
except ImportError:
    SLOWAPI_AVAILABLE = False
    limiter = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    await init_db()
    
    # Initialize Redis cache
    from utils.cache import init_redis
    await init_redis()
    
    yield
    
    # Shutdown
    await close_db()
    
    # Close Redis connection
    from utils.cache import close_redis
    await close_redis()


app = FastAPI(
    title="Acorn - AI Planning Platform",
    description="Plant the seeds of perfect projects with AI-powered software planning",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiting
if SLOWAPI_AVAILABLE and limiter:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using wildcard
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight for 24 hours
)


@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle all OPTIONS preflight requests."""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
        }
    )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(generation.router, prefix="/api/generation", tags=["AI Generation"])
app.include_router(generation.jobs_router, prefix="/api/generation-jobs", tags=["AI Generation"])
app.include_router(requirements.router, prefix="/api", tags=["Requirements"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(diagrams.router, prefix="/api", tags=["Diagrams"])
app.include_router(ux_flow.router, prefix="/api", tags=["UX Flow"])
app.include_router(phase_flow.router, prefix="/api", tags=["Phases"])
app.include_router(sandbox.router, prefix="/api/sandbox", tags=["Sandbox"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(change_log.router, prefix="/api", tags=["ChangeLog"])
app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])
app.include_router(ai_pipeline.router, prefix="/api/ai", tags=["AI Pipeline"])
app.include_router(personas.router, prefix="/api", tags=["Personas"])
app.include_router(srs_audit.router, prefix="/api", tags=["SRS Audit"])
app.include_router(billing.router, prefix="/api", tags=["Billing"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(negotiation.router, prefix="/api", tags=["Negotiation"])
app.include_router(payment.router, prefix="/api", tags=["Payment"])
app.include_router(version.router, prefix="/api", tags=["Version History"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])
app.include_router(traceability.router, prefix="/api", tags=["Traceability"])
app.include_router(templates.router, prefix="/api", tags=["Templates"])
app.include_router(explainability.router, prefix="/api", tags=["AI Explainability"])
app.include_router(utils.router, prefix="/api/utils", tags=["Utilities"])
app.include_router(ai_chat.router, prefix="/api/ai-chat", tags=["AI Chat"])
app.include_router(ai_debate.router, prefix="/api", tags=["AI Debate"])
app.include_router(ai_suggestions.router, prefix="/api", tags=["AI Suggestions"])


@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Acorn - AI Planning Platform",
        "version": "1.0.0",
        "status": "running",
        "message": "Plant the seeds of perfect projects with AI-powered software planning 🌰",
        "endpoints": {
            "health": "/api/health",
            "docs": "/docs",
            "api": "/api"
        }
    }


@app.get("/api")
async def api_info():
    """API information endpoint."""
    return {
        "service": "Acorn API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth",
            "projects": "/api/projects",
            "generation": "/api/generation",
            "users": "/api/users",
            "health": "/api/health"
        }
    }


@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Acorn Backend", "message": "Growing strong! 🌰"}


@app.head("/api/health")
async def health_check_head():
    """Explicit HEAD handler for health probes."""
    return Response(status_code=200)
