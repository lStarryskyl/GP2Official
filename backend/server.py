"""FastAPI main application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import init_db, close_db
from routes import auth, projects, generation, requirements, tasks, diagrams, ux_flow, phase_flow, sandbox, users, change_log, websocket, ai_pipeline
from config import settings


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

# CORS middleware - allow all origins for now to debug
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using wildcard
    allow_methods=["*"],
    allow_headers=["*"],
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
