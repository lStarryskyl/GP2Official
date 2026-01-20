# Acorn - Enterprise AI Project Planning Platform

## Overview
Acorn is an enterprise-grade AI-powered project planning platform that transforms complex requirements into actionable project plans, comprehensive documentation, and compliance-ready specifications.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS (Navy & Gold Corporate Theme)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (in-memory for development) / Supabase PostgreSQL (production)
- **Deployment**: Frontend on Netlify, Backend on Render

## Design System
- **Theme**: Corporate Professional - Navy & Gold
- **Navy Palette**: #0a0f1a (deep), #0d1525 (main), #111b2e (card), #152238 (form), #1e3a5f (border)
- **Gold Palette**: #d4af37 (main), #b8962e (dark), #e6c358 (light)
- **Typography**: Inter (sans-serif), JetBrains Mono (code)
- **Animations**: Impressive page transitions, staggered reveals, floating effects

## Core Features

### Implemented ✓
- [x] User Authentication (JWT + refresh tokens)
- [x] Project CRUD operations (GET, POST, PUT, DELETE)
- [x] AI-powered phase generation (Planning, Requirements, Feasibility)
- [x] Requirements management (create, list, update, bulk replace)
- [x] Task management (create, list, update)
- [x] Artifact storage and versioning
- [x] Corporate Professional UI with Navy & Gold theme
- [x] Responsive sidebar with collapse functionality
- [x] Project search and filtering
- [x] Grid/List view toggle
- [x] Phase Navigation with dark theme
- [x] Roadmap Builder (Planning phase)
- [x] Feasibility Study form with viability assessment
- [x] **Persona Generation** - AI-generated user personas & user stories
- [x] **SRS Audit** - Requirements quality analysis with scoring
- [x] **Export Center** - PDF, DOCX, XLSX, PPTX export options
- [x] **Analytics Dashboard** - Project metrics, progress tracking, AI insights
- [x] **Register Page** - Redesigned with Navy & Gold theme

### Planned Features (P1)
- [ ] **Stakeholder Negotiation** - Impact analysis and tracking
- [ ] **Real Export Integration** - Backend PDF/DOCX generation

### Future Features (P2)
- [ ] **Analytics Dashboard** - Project progress, AI stats, time tracking
- [ ] **Team Collaboration** - Invite members, permissions, comments
- [ ] **Kanban Board** - Visual task management with drag-and-drop
- [ ] **Notifications System** - Real-time alerts for updates
- [ ] **Payment Gateway** - Subscription management
- [ ] **AI Chat Improvements** - Enhanced conversational interface
- [ ] **New AI Provider** - Alternative LLM integrations

## What's Been Implemented

### Jan 20, 2026 - UI Overhaul Complete + API Fixes
- **Complete Phase Pages UI Overhaul**
  - PhaseDetailPage.tsx - Full Navy & Gold theme with inline styles
  - PhaseNavigation.tsx - Dark sidebar with gold active states
  - PlanningRoadmapPhase.tsx - Roadmap Builder with dark inputs
  - All phase cards, forms, and buttons styled consistently
  
- **API Routing Fixes**
  - Fixed PUT /api/projects/{id}/ - Now supports both with/without trailing slash
  - Fixed POST /api/projects/{id}/requirements/ - New endpoint for single requirement creation
  - All 15 backend API tests passing (100%)

- **Testing Results**
  - Backend: 100% (15/15 tests passed)
  - Frontend: 100% (all UI components styled correctly)
  - Test report: /app/test_reports/iteration_2.json

### Jan 19, 2026 - Database Migration & Initial UI
- Database migration to Supabase (with MongoDB fallback)
- Added FORCE_RECREATE_TABLES option for production
- Initial UI overhaul for Landing, Login, Register, Projects pages

## API Endpoints

### Working Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Current user profile
- `POST /api/projects/` - Create project
- `GET /api/projects/` - List projects
- `GET /api/projects/{id}/` - Get project
- `PUT /api/projects/{id}/` - Update project (FIXED)
- `DELETE /api/projects/{id}/` - Delete project
- `GET /api/projects/{id}/requirements/` - List requirements
- `POST /api/projects/{id}/requirements/` - Create requirement (FIXED)
- `PUT /api/projects/{id}/requirements/bulk/` - Bulk replace requirements
- `GET /api/projects/{id}/tasks/` - List tasks
- `POST /api/projects/{id}/tasks/` - Create task
- `GET /api/projects/{id}/artifacts/` - List artifacts
- `GET /api/projects/{id}/roadmap/` - Get roadmap
- `POST /api/projects/{id}/roadmap/` - Save roadmap
- `GET /api/projects/{id}/feasibility-studies/` - Get feasibility studies
- `GET /api/projects/{id}/feasibility-sections/` - Get feasibility sections

## Database Fix for Production (Supabase)

To fix the UUID error on Render:
1. Add environment variable: `FORCE_RECREATE_TABLES=true`
2. Redeploy
3. After successful deploy, set `FORCE_RECREATE_TABLES=false`

⚠️ This will clear existing data. Contact support for migration script if data preservation needed.

## Next Steps
1. Deploy database fix to Render production
2. Implement Persona Generation feature
3. Implement SRS Audit feature
4. Add Export Center (PDF/Docx)
5. Configure real LLM API key for AI content generation

## Notes
- **AI Generation**: Uses OpenAI GPT-4 via official OpenAI SDK. Real AI content is now generated for all phases.
- **Database**: Preview environment uses MongoDB in-memory; production needs Supabase config
- **To push changes**: Use the "Save to Github" button in the Emergent platform chat input
