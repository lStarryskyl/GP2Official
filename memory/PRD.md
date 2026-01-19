# Acorn - AI Project Planning Platform

## Overview
Acorn is an AI-powered project planning platform that transforms ideas into actionable project plans. It generates comprehensive documentation, roadmaps, and feasibility studies automatically.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase PostgreSQL (primary) with MongoDB fallback
- **Deployment**: Frontend on Netlify, Backend on Render

## Core Requirements

### User Authentication
- JWT-based authentication with refresh tokens
- User registration and login
- Profile management

### Project Management
- Create, read, update, delete projects
- Multiple project templates (Web App, Mobile App, SaaS, etc.)
- Project status tracking (draft, planning, active, completed)

### AI-Powered Generation
- Planning phase generation
- Requirements extraction
- Feasibility studies
- Roadmap generation
- Task breakdown

### Documentation
- Markdown-based artifact storage
- Version history
- Export capabilities

## What's Been Implemented

### Jan 19, 2025
- **Database Migration to Supabase**
  - Fixed UUID column type error (changed to TEXT for custom IDs)
  - Updated all repositories: Artifact, Task, Requirement, AiRun
  - Added automatic table creation on startup
  - Proper fallback to MongoDB/in-memory when Supabase unavailable

- **Complete UI Overhaul**
  - New premium design system with Outfit font
  - Custom CSS animations (fade-in, scale, slide, float, pulse)
  - Professional color scheme (amber/orange gradients)
  - Glass-morphism effects
  - Responsive sidebar with collapse functionality
  - Enhanced landing page with animated features
  - Premium login/register pages with split-screen design
  - Projects page with grid/list views and search

### Testing Results (Jan 19, 2025)
- Backend: 87.5% success rate
- Frontend: 100% success rate
- Integration: 95% success rate

## Prioritized Backlog

### P0 (Critical)
- [ ] Verify Supabase production connection
- [ ] Test AI generation with persistent storage

### P1 (High Priority)
- [ ] Fix PUT /api/projects/{id}/ routing
- [ ] Add project update UI
- [ ] Implement artifact editing

### P2 (Medium Priority)
- [ ] Add collaborative features (team members)
- [ ] Implement notification system
- [ ] Add export to PDF/Word

### P3 (Nice to Have)
- [ ] Dark/light theme toggle
- [ ] Custom branding
- [ ] API rate limiting

## Next Tasks
1. Push code to GitHub for deployment
2. Test Supabase connection in production
3. Verify AI generation flow end-to-end
4. Test phase navigation and content display

## User Personas
1. **Project Manager**: Needs quick project setup and documentation
2. **Product Owner**: Needs feasibility analysis and roadmaps
3. **Developer**: Needs technical requirements and task breakdowns
4. **Stakeholder**: Needs executive summaries and status updates
