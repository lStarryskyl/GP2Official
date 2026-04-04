# GP2Official (Architect AI / Acorn) - Deep Repo Context

Last updated: 2026-04-04

**What This Repo Is**
GP2Official is a full-stack AI-assisted SDLC planning platform. Branding alternates between "Architect AI" and "Acorn" across the codebase. The platform turns project briefs into structured artifacts: requirements, SRS, tasks, diagrams, risk analysis, cost estimates, and phase-by-phase planning outputs.

**Top-Level Structure**
- `backend/` FastAPI backend, AI services, repositories, routes, and DB access
- `frontend/` React + TypeScript UI (Vite, Tailwind, Zustand)
- `diagrams/` PlantUML source files and diagram README
- `supabase/` SQL and auth table scripts
- `tests/`, `backend/tests/`, `test_reports/` tests and test artifacts
- `docker-compose.yml`, `Dockerfile`, `Dockerfile.frontend` container setup
- `PLATFORM_TRANSFORMATION_SUMMARY.md`, `STRATEGIC_ROADMAP.md`, `WINDOWS_SETUP.md` product and setup context

**Backend Stack**
FastAPI 0.115+, asyncpg (PostgreSQL), Redis cache, Gemini for AI generation with a stub fallback. JWT authentication, AI pipeline and generation services, PlantUML support, and optional WebSocket collaboration.

**Backend Entry and Configuration**
- `backend/server.py` main FastAPI app, CORS, router registration
- `backend/main.py` ASGI entrypoint (`app`)
- `backend/config.py` settings via `pydantic-settings` and `.env`
- `backend/.env.template` list of required env vars

**Backend Environment Variables**
- `DATABASE_URL` PostgreSQL connection string
- `GEMINI_API_KEY`
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
- `ENVIRONMENT`, `DEBUG`, `APP_NAME`
- `FRONTEND_ORIGIN`
- `REDIS_URL`
- `PLANTUML_API_HOST`, `PLANTUML_API_KEY`

**Database Layer**
- Schema creation and migrations are embedded in `backend/database.py`.
- The Postgres tables created in code include:
- `users` with profile fields, role, avatar, banner, skills, social_links
- `refresh_tokens` with token_hash, expires_at, revoked flags
- `projects` with JSON fields for phases, roadmap, feasibility, stack, team_members
- `artifacts` with `type`, `content_json`, `metadata`
- `requirements` linked to `project_id`
- `tasks` linked to `project_id` and optional `requirement_id`
- `ai_runs` for AI execution logs
- `workspace_invites` for org invite flow

**Repository Pattern**
- Repositories switch between `_Supabase*` and `_Mongo*` implementations based on `database.pool`.
- `backend/repositories/project_repository.py` is the canonical example and contains both PostgreSQL and Mongo-style logic.
- In practice, the project is using asyncpg/PostgreSQL but still carries legacy Mongo code paths.

**Authentication Flow**
- Routes: `backend/routes/auth.py`
- Logic: `backend/services/auth_service.py`
- JWT access tokens with SHA-256 hashed refresh tokens stored in `refresh_tokens`.
- `frontend/src/store/authStore.ts` stores tokens in `localStorage` and refreshes on 401 via `frontend/src/lib/api.ts`.

**AI and LLM Stack**
- Central pipeline: `backend/services/ai_pipeline_service.py`
- Gemini orchestration: `backend/services/gemini_orchestrator.py`
- Simple LLM wrapper: `backend/emergentintegrations/llm/chat.py`
- LLM client used by services: `backend/services/llm_client.py`
- Task types: general, requirements, SRS, risk, cost, diagrams, personas, feasibility, system design

**Generation Workflow (Project-Level)**
- Service: `backend/services/generation_service.py`
- Starts an async job and updates `generation_repository` status
- Steps: requirements extraction, SRS, UML diagrams, task plan, risk analysis, cost estimate
- Artifacts written via `artifact_repository`

**Phase Flow System**
- Service: `backend/services/phase_flow_service.py`
- Phases: planning, feasibility_study, requirements_gathering, validation, design, development, tasks, cost_benefit, risks, summary
- Each phase stores an artifact `PHASE_<PHASE>` with raw and formatted markdown
- Uses Gemini for generation, with placeholder fallback content

**Artifacts and Document Types**
- SRS: `SRS`
- UX Flow: `UX_FLOW_SPEC`
- UML: `uml_use_case`, `uml_class_diagram`, `uml_sequence`, `uml_entity_relationship`
- Phases: `PHASE_PLANNING`, `PHASE_FEASIBILITY_STUDY`, etc
- `content_json` includes structured data and markdown, `metadata` includes PlantUML URLs

**Diagram System**
- Backend service: `backend/services/diagram_service.py`
- Routes: `backend/routes/diagrams.py`
- Supports SDLC stage canvases and seeded canvases (requirements, SRS, costs)
- Uses a rule-based assistant in `backend/services/diagram_assistant.py` for chat edits
- PlantUML encoding on backend in `backend/services/plantuml_service.py`

**UX Flow System**
- Service: `backend/services/ux_flow_service.py`
- Generates multi-section UX flow spec via LLM, stores as artifact
- Can seed a freeform canvas based on headings from the UX spec

**Negotiation, Notifications, Templates, Traceability**
- Negotiation: `backend/services/negotiation_service.py`
- Notifications: `backend/services/notification_service.py`
- Templates: `backend/services/template_service.py`
- Traceability: `backend/services/traceability_service.py`
- These are largely demo implementations that return generated data without persistence.

**Change Log and Export**
- Change logs: `backend/services/change_log_service.py`
- Export: `backend/services/export_service.py` and `backend/routes/export.py`
- Export data combines project fields, requirements, and parsed task lists from phase artifacts

**WebSocket Collaboration**
- Service: `backend/services/websocket_service.py`
- Route: `backend/routes/websocket.py`
- Tracks active users, cursors, and recent changes in Redis cache

**Utilities**
- `backend/utils/cache.py` Redis cache helpers
- `backend/utils/validation.py` sanitization, password rules, email checks
- Cache is optional if `REDIS_URL` is unset

**Backend API Map**

**Auth**
- `POST /api/auth/register` register user
- `POST /api/auth/login` login user
- `POST /api/auth/token/refresh/` refresh access token
- `POST /api/auth/logout` revoke refresh token
- `GET /api/auth/me` current user profile

**Projects**
- `GET /api/projects/` list projects
- `POST /api/projects/` create project
- `GET /api/projects/{id}` get project
- `PUT /api/projects/{id}` update project
- `DELETE /api/projects/{id}` delete project
- `POST /api/projects/{id}/generate/` start AI generation
- `GET /api/projects/{id}/requirements/` list requirements
- `POST /api/projects/{id}/requirements/` create requirement
- `PUT /api/projects/{id}/requirements/bulk/` replace all requirements
- `GET /api/projects/{id}/tasks/` list tasks
- `POST /api/projects/{id}/tasks/` create task
- `GET /api/projects/{id}/artifacts/` list artifacts
- `PATCH /api/projects/{id}/artifacts/{artifact_id}/` update artifact
- `GET /api/projects/{id}/ai-runs/` list AI runs
- `POST /api/projects/{id}/assistant/chat/` project-aware chat
- `GET /api/projects/{id}/roadmap/` get roadmap
- `PUT /api/projects/{id}/roadmap/` update roadmap
- `GET /api/projects/{id}/feasibility-studies/` get feasibility studies
- `PUT /api/projects/{id}/feasibility-studies/` update feasibility studies
- `GET /api/projects/{id}/feasibility-sections/` get feasibility sections
- `PUT /api/projects/{id}/feasibility-sections/` update feasibility sections
- `GET /api/projects/{id}/development/` get dev stack + notes
- `PUT /api/projects/{id}/development/` update dev stack + notes
- `POST /api/projects/{id}/team/` add or update team member
- `DELETE /api/projects/{id}/team/{member_id}` remove team member
- `GET /api/projects/{id}/activity/` list recent activity
- `GET /api/projects/{id}/srs/export/` export SRS artifact
- `POST /api/projects/templates/resolve/` wizard preset resolution
- `POST /api/projects/{id}/branches/` create scenario branch
- `GET /api/projects/{id}/branches/` list branches
- `GET /api/projects/{id}/branches/{branch_id}/diff/` branch diff

**Generation Jobs**
- `POST /api/generation/start` start job
- `GET /api/generation/job/{job_id}` job status
- `GET /api/generation/requirements/{project_id}` list generated requirements
- `GET /api/generation-jobs/{job_id}/` job status (alt)

**Phase Flow**
- `GET /api/projects/{id}/phases/` get phase statuses
- `POST /api/projects/{id}/phases/{phase}/generate/` generate phase output
- `GET /api/projects/{id}/phases/{phase}/generate/stream/` SSE stream
- `POST /api/projects/{id}/phases/unlock-all/` unlock all phases
- `POST /api/projects/{id}/phases/{phase}/unlock/` unlock a phase

**Requirements and Tasks**
- `PATCH /api/requirements/{id}/` update requirement
- `PATCH /api/tasks/{id}/` update task

**Diagram and UML**
- `GET /api/projects/{id}/sdlc-diagrams/` list stage canvases
- `GET /api/projects/{id}/sdlc-diagrams/{stage}/` get canvas
- `PUT /api/projects/{id}/sdlc-diagrams/{stage}/` save canvas
- `POST /api/projects/{id}/sdlc-diagrams/{stage}/chat/` diagram assistant
- `POST /api/projects/{id}/diagrams/sync/` seed canvas from data
- `GET /api/projects/{id}/uml/{diagram_type}/` fetch UML artifact
- `PUT /api/projects/{id}/uml/{diagram_type}/` save UML artifact
- `POST /api/projects/{id}/uml/{diagram_type}/chat/` edit UML via LLM

**UX Flow**
- `POST /api/projects/{id}/ux-flow/generate/` generate UX flow
- `GET /api/projects/{id}/ux-flow/` get UX flow
- `POST /api/projects/{id}/ux-flow/sync-diagram/` seed canvas from UX flow

**AI Chat and Pipeline**
- `POST /api/ai-chat/chat` chat for a phase
- `POST /api/ai-chat/agent-task` run specialized agent task
- `GET /api/ai-chat/supported-tasks` list supported tasks
- `POST /api/ai/generate` generate via pipeline
- `POST /api/ai/compare-models` compare models
- `GET /api/ai/models` list models
- `GET /api/ai/performance-stats` model stats
- `GET /api/ai/task-routing` routing info
- `POST /api/ai/tasks/{task_type}/generate` generate for task
- `GET /api/ai/health` AI pipeline health

**SRS Audit**
- `POST /api/projects/{id}/srs-audit` run audit
- `GET /api/projects/{id}/srs-audit/latest` get latest report

**Personas**
- `POST /api/projects/{id}/personas/generate` generate personas
- `POST /api/projects/{id}/user-stories/generate` generate user stories

**Templates**
- `GET /api/templates` list templates
- `POST /api/templates` create template
- `POST /api/templates/{id}/use` apply template
- `POST /api/templates/{id}/rate` rate template
- `GET /api/templates/briefs` brief templates

**Traceability**
- `GET /api/projects/{id}/traceability/matrix` traceability matrix
- `GET /api/projects/{id}/traceability/coverage` coverage report
- `POST /api/projects/{id}/traceability/link` create link
- `POST /api/projects/{id}/traceability/auto-link` auto link

**Negotiation**
- `POST /api/projects/{id}/negotiation/threads` create thread
- `POST /api/projects/{id}/negotiation/comments` add comment
- `POST /api/projects/{id}/negotiation/threads/{thread_id}/impact-analysis` analyze impact
- `POST /api/projects/{id}/negotiation/threads/{thread_id}/resolve` resolve thread

**Notifications and Activity**
- `GET /api/notifications` list notifications
- `POST /api/notifications/{id}/read` mark read
- `POST /api/notifications/read-all` mark all read
- `GET /api/projects/{id}/activity` project activity

**Users and Workspace**
- `GET /api/users/me/profile` profile
- `PATCH /api/users/me/profile` update profile
- `GET /api/users/invites/` list invites
- `POST /api/users/invites/` create invite
- `DELETE /api/users/invites/{id}` revoke invite

**Billing and Payments**
- `GET /api/billing/plans` list plans
- `POST /api/billing/subscribe` create subscription
- `POST /api/billing/payment-methods` add payment method
- `POST /api/billing/process-payment` process payment
- `DELETE /api/billing/subscription/{id}` cancel subscription
- `POST /api/payment/create-intent` create payment intent
- `POST /api/payment/confirm` confirm payment
- `POST /api/payment/subscription/checkout` checkout
- `POST /api/payment/subscription/{id}/cancel` cancel subscription
- `GET /api/payment/methods` list payment methods
- `GET /api/payment/test-cards` test cards list

**Change Log and Export**
- `GET /api/projects/{id}/changelog/` list changelog
- `POST /api/projects/{id}/changelog/` create changelog
- `POST /api/projects/{id}/changelog/upload/` create from file upload
- `GET /api/projects/{id}/export/pdf` PDF export
- `GET /api/projects/{id}/export/docx` DOCX export
- `GET /api/projects/{id}/export/markdown` Markdown export

**Sandbox and Utilities**
- `POST /api/sandbox/run` run code sandbox
- `GET /api/utils/redis/status` Redis status
- `GET /api/utils/cache/stats` cache stats
- `GET /api/utils/config/status` config status

**WebSocket Collaboration**
- `WS /api/ws/projects/{id}/collaborate` connect to collaboration
- `GET /api/ws/projects/{id}/collaborators` active collaborators
- `POST /api/ws/projects/{id}/broadcast` broadcast message
- `GET /api/ws/projects/{id}/collaboration-stats` collaboration stats

**Frontend Stack**
React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, Axios. Styling and layout are driven by a forest-themed Acorn design system.

**Frontend Entry and Routing**
- Entry: `frontend/src/main.tsx`
- Routes: `frontend/src/App.tsx`
- Auth guard: `PrivateRoute` in `frontend/src/App.tsx` with `useAuthStore`

**Frontend Routing Map**
- `/` landing page
- `/login` login
- `/register` registration
- `/projects` list
- `/projects/new` create project
- `/projects/new/wizard` guided builder
- `/projects/:id` project details
- `/projects/:id/summary` project summary
- `/projects/:id/governance` governance
- `/projects/:id/updates` dev updates
- `/projects/:id/diagram-studio` diagram workspace
- `/projects/:id/uml/:type/edit` UML editor
- `/projects/:id/phases/:phaseId` phase detail
- `/projects/:id/personas` personas
- `/projects/:id/srs-audit` SRS audit
- `/projects/:id/export` export center
- `/projects/:id/analytics` analytics
- `/profile` user profile
- `/billing` billing page

**Frontend State and API**
- Auth state: `frontend/src/store/authStore.ts`
- API client: `frontend/src/lib/api.ts` with token injection and refresh flow
- Theme: `frontend/src/contexts/ThemeContext.tsx`

**Frontend Design System**
- Tokens: `frontend/src/design-system/tokens.ts` defines forest palette, gradients, typography, spacing, shadows
- Phase metadata: `frontend/src/constants/phases.ts`
- Roles: `frontend/src/constants/roles.ts`
- Theme utilities: `frontend/src/constants/theme.ts`

**Key UI Components**
- `frontend/src/components/Layout.tsx` sidebar + top layout shell
- `frontend/src/components/AppSidebar.tsx` secondary navigation patterns
- `frontend/src/components/AIChatAssistant.tsx` AI chat dock
- `frontend/src/components/AIAgentsPanel.tsx` specialized agent tasks
- `frontend/src/components/AIExplainabilityPanel.tsx` explainability UI
- `frontend/src/components/TemplateLibrary.tsx` templates catalog UI
- `frontend/src/components/TraceabilityMatrix.tsx` requirement-task matrix view
- `frontend/src/components/VersionHistory.tsx` version timeline
- `frontend/src/components/PaymentCheckout.tsx` sandbox payment UI
- `frontend/src/components/NotificationCenter.tsx` activity/notification feed
- `frontend/src/components/NegotiationThread.tsx` negotiation threads

**Phase UI Components**
- `frontend/src/components/phases/PlanningRoadmapPhase.tsx`
- `frontend/src/components/phases/FeasibilityStudyPhase.tsx`
- `frontend/src/components/phases/DevelopmentPhase.tsx`
- `frontend/src/components/phases/SystemDesignPhase.tsx`
- `frontend/src/components/phases/DesignPhase.tsx`
- `frontend/src/components/phases/GanttChartPhase.tsx`
- `frontend/src/components/phases/ValidationPhase.tsx`
- `frontend/src/components/phases/FinalSummaryPhase.tsx`

**Diagram and Canvas UI**
- `frontend/src/components/canvas/MiroCanvas.tsx` React Flow canvas with shape library, tools, and node editing
- `frontend/src/pages/DiagramWorkspacePage.tsx` main diagram workspace page
- `frontend/src/pages/UmlDiagramEditorPage.tsx` PlantUML editing UI
- `frontend/src/lib/plantuml.ts` client-side PlantUML encoding and templates

**Primary Pages**
- `frontend/src/pages/LandingPage.tsx` marketing landing
- `frontend/src/pages/LoginPage.tsx` auth UI with forest-themed branding
- `frontend/src/pages/RegisterPage.tsx` signup UI
- `frontend/src/pages/ProjectsPage.tsx` project list and CTA
- `frontend/src/pages/NewProjectPage.tsx` create project form
- `frontend/src/pages/ProjectDetailPage.tsx` project overview and AI actions
- `frontend/src/pages/PhaseDetailPage.tsx` phase-specific UI and generation panels
- `frontend/src/pages/ProjectSummaryPage.tsx` consolidated summary
- `frontend/src/pages/ProjectGovernancePage.tsx` governance and approvals
- `frontend/src/pages/DevelopmentUpdatesPage.tsx` change log and updates
- `frontend/src/pages/ExportCenterPage.tsx` export downloads
- `frontend/src/pages/AnalyticsDashboardPage.tsx` analytics UI
- `frontend/src/pages/ProfilePage.tsx` profile editor
- `frontend/src/pages/PricingPage.tsx` plan display and CTA

**Testing and Tooling**
- Backend: `backend/tests/` and root `test_all_endpoints.py`, `backend_test.py`, `run_tests.py`
- Frontend: `frontend/src/tests` and `vitest.config.ts`

**Deployment and Hosting**
- Backend: Render (per `PLATFORM_TRANSFORMATION_SUMMARY.md`)
- Frontend: Netlify (per `PLATFORM_TRANSFORMATION_SUMMARY.md`)
- Docker: `docker-compose.yml` provides MongoDB + Redis + backend + frontend containers

**Known Mismatches and Risks**
- Docker uses MongoDB, but backend runtime uses asyncpg/PostgreSQL.
- Legacy repository code still contains Mongo-style paths alongside PostgreSQL logic.
- `backend/config.py` includes a default Gemini API key; rotate in production.
- Branding is mixed between "Architect AI" and "Acorn".

**Local Run (Manual)**
- Backend
- `cd backend`
- `pip install -r requirements.txt`
- `uvicorn main:app --reload --port 8000`
- Frontend
- `cd frontend`
- `yarn install`
- `yarn dev`

**Quick Jump List**
- Backend entry: `backend/server.py`
- Config: `backend/config.py`
- AI pipeline: `backend/services/ai_pipeline_service.py`
- Phase flow: `backend/services/phase_flow_service.py`
- Generation: `backend/services/generation_service.py`
- Diagrams: `backend/services/diagram_service.py`
- Auth: `backend/routes/auth.py`
- Projects: `backend/routes/projects.py`
- Frontend routing: `frontend/src/App.tsx`
- Frontend API client: `frontend/src/lib/api.ts`
- Frontend auth store: `frontend/src/store/authStore.ts`
