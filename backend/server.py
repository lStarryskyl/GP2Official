"""FastAPI main application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import init_db, close_db
from routes import auth, projects, generation, requirements, tasks, diagrams, ux_flow, phase_flow
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Acorn - AI Planning Platform",
    description="Plant the seeds of perfect projects with AI-powered software planning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
allowed_origins = {
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
}
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in allowed_origins if origin],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
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


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Acorn Backend", "message": "Growing strong! 🌰"}
