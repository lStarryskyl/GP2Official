# Acorn - AI Planning Platform

An AI-powered software planning platform that helps teams plan projects through structured phases, requirement gathering, feasibility studies, system design, and more. Features a warm bark-brown/amber acorn forest theme throughout.

## Project Structure

- **frontend/** - React + Vite + TypeScript SPA running on port 5000
- **backend/** - FastAPI Python backend running on port 8000

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (dev server on port 5000, `allowedHosts: true`)
- Tailwind CSS with custom bark-brown/amber theme
- React Router DOM
- Zustand (state management)
- ReactFlow (diagram editor)
- Axios for API calls

### Backend
- FastAPI (Python)
- PostgreSQL via AsyncPG
- JWT authentication
- Google Gemini AI (primary LLM provider)
- Redis (optional caching, disabled if not configured)

## Workflows

- **Start application** - Runs `cd frontend && npm run dev` on port 5000 (webview)
- **Backend** - Runs `cd backend && uvicorn main:app --host localhost --port 8000 --reload` (console)

## Database

Uses Replit's built-in PostgreSQL database. The backend auto-creates all tables on startup via `database.py:ensure_tables_exist()`.

Key tables: `users`, `projects`, `artifacts`, `requirements`, `tasks`, `ai_runs`, `workspace_invites`, `refresh_tokens`

## Theme / Design System

Bark-brown/amber acorn forest theme (replaced previous neon green):

- **Primary (acorn gold)**: `#D4A017`
- **Background darkest (bark 900)**: `#130c07`
- **Background dark (bark 800)**: `#1a1008`
- **Background medium (bark 700)**: `#221508`
- **Border**: `#3d2412`
- **Text (parchment)**: `#f0e4c8`
- **Muted text**: `#8a7055` / `#9a7a55`
- **Nature accent (leaves only)**: `#5a9e6a`

Key design features:
- LandingPage: Cracked-acorn drop intro animation (sessionStorage-gated), then interactive SVG oak tree with 10 hanging acorn nodes, each linking to a phase. Breeze sound via Web Audio API.
- ProjectsPage: Living tree SVG with project nodes as 🌿/🍂/🌰 by status
- ProjectDetailPage: Phase tree with acorn SVG cap on completed phases, leaf-green for active
- ArchitectureDiagram: `frontend/src/components/ArchitectureDiagram.tsx` — Renders an interactive SVG system architecture diagram from AI-generated JSON. Parses JSON from markdown code blocks, places components in columns by type (frontend/backend/database/external/cache/queue), draws bezier connections with amber arrows. Hover highlights connected nodes.
- Design phase: Updated AI prompt to include structured JSON architecture block + ArchitectureDiagram rendered inline
- Phase accent colors: All amber/bark-brown. No purple or non-theme greens.
- Gantt task bar colors: completed=#D4A017, in_progress=#c8870f, planned=#5c3820
- google-genai package installed; backend uses `from google import genai` syntax
- Animations: `acornDrop`, `leafGrow`, `leafSway` in `index.css`
- CSS classes: `glow-orb-amber`, `glow-orb-bark`, `bg-grid`, `card-glass`, `text-gradient-forest` (outputs amber)

## Configuration

- `backend/config.py` - All app settings via Pydantic Settings (reads from env vars)
- `frontend/vite.config.ts` - Vite config with proxy to backend at `/api`, `allowedHosts: true`
- `DATABASE_URL` env var is set automatically by Replit

## API Structure

All backend routes are under `/api/`. The frontend proxies `/api` requests to `http://localhost:8000`.

Key route groups: auth, projects, generation, requirements, tasks, diagrams, users, billing, export

## AI Integration

Uses Google Gemini as primary AI provider:
- `gemini-2.5-pro` for complex tasks
- `gemini-2.0-flash` for fast tasks
- API key stored in `config.py` (should be moved to env var for production)
