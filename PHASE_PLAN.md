# Architect AI - Phased Development Plan

## Overview
Building a production-ready SaaS platform for automating software planning with Django REST + React/TypeScript, following clean architecture and SOLID principles.

---

## Phase 1: Foundation & Core Infrastructure ⭐ [STARTING NOW]
**Goal:** Set up the complete backend architecture with authentication and project management

### Backend Deliverables:
1. ✅ Django project structure with clean architecture:
   ```
   backend/
   ├── domain/          # Domain models (entities)
   ├── interfaces/      # Repository interfaces & ports
   ├── infrastructure/  # Concrete implementations (Django ORM repos)
   ├── application/     # Application services (use cases)
   ├── api/            # DRF views, serializers, URLs
   └── config/         # Settings, WSGI, URLs
   ```

2. ✅ PostgreSQL models:
   - Organization
   - User (extends Django User)
   - Project
   - Requirement
   - Task
   - Artifact
   - DiagramModel
   - GenerationJob
   - IntegrationConfig
   - ActivityLog
   - ProjectFile

3. ✅ Repository pattern:
   - Interface definitions (IProjectRepository, IRequirementRepository, etc.)
   - Django ORM implementations
   - Multi-tenant scoping (all queries filtered by organization_id)

4. ✅ JWT Authentication:
   - Register endpoint (creates Organization + User)
   - Login endpoint (returns JWT tokens)
   - Middleware for authentication
   - Permission classes for authorization

5. ✅ Project Management API:
   - ProjectService (create, update, change_status)
   - REST endpoints: GET/POST/PATCH /projects
   - ActivityLog integration

### Frontend Deliverables:
1. ✅ React + TypeScript setup with Vite
2. ✅ Authentication pages (Login, Register)
3. ✅ Protected routes with JWT storage
4. ✅ Project list page
5. ✅ Project creation form
6. ✅ Basic layout with navigation

### Infrastructure:
1. ✅ Docker Compose (PostgreSQL, Redis for future)
2. ✅ Environment variables setup
3. ✅ Requirements.txt with all dependencies
4. ✅ Package.json with React dependencies

### Testing:
- Unit tests for ProjectService
- Integration tests for auth endpoints

**Estimated Time:** 1 week  
**Success Criteria:** Can register, login, create/view projects

---

## Phase 2: AI Core - LLM Integration & Requirements Extraction
**Goal:** Implement the GenerationService with LLM integration for requirement extraction

### Backend Deliverables:
1. ILLMClient interface:
   - `extract_requirements(prompt) -> List[RequirementDTO]`
   - `generate_srs(prompt) -> SrsDTO`
   - `generate_uml(prompt) -> UmlDTO`
   - `generate_tasks(prompt) -> List[TaskDTO]`

2. Stub LLM implementation (for testing without API costs)

3. Real LLM implementation (OpenAI/Anthropic/HuggingFace):
   - Configurable via environment variables
   - Error handling and retries
   - Token usage tracking

4. GenerationService:
   - `start_full_generation(cmd)` with complete workflow
   - Job status management
   - Atomic transactions for data consistency

5. RequirementService:
   - CRUD operations for requirements
   - Filtering and searching

### Frontend Deliverables:
1. Project workspace with tabs
2. "Generate Architecture & Plan" button
3. Generation job status polling
4. Requirements list view with filters
5. Requirement detail/edit modal

### Testing:
- Unit tests for GenerationService with mocked LLM
- Integration tests with stub LLM

**Estimated Time:** 1-1.5 weeks  
**Success Criteria:** Can generate requirements from project brief

---

## Phase 3: SRS Generation & Document Management
**Goal:** Generate IEEE-style SRS documents and allow editing

### Backend Deliverables:
1. SRS generation prompts and templates
2. SrsService:
   - `get_current_srs(project_id)`
   - `update_srs(artifact_id, changes)`
   - `approve_srs(artifact_id, user_id)`
3. Artifact versioning system
4. SRS content_json structure (IEEE 830 sections)

### Frontend Deliverables:
1. SRS viewer component:
   - Render JSON sections as formatted HTML
   - Section navigation
2. SRS editor (basic text editing for sections)
3. Approve SRS button with confirmation
4. Version history viewer

### Testing:
- SRS generation quality tests
- Version management tests

**Estimated Time:** 1 week  
**Success Criteria:** Can generate, view, edit, and approve SRS

---

## Phase 4: UML Diagram Generation
**Goal:** Generate basic UML models (Use Case, Class, Sequence)

### Backend Deliverables:
1. UML generation prompts
2. DiagramModel storage with JSON structure
3. UML artifact generation in GenerationService
4. Support for multiple diagram types

### Frontend Deliverables:
1. UML viewer component (render JSON as visual diagram using library like react-flow or mermaid)
2. Diagram type selector
3. Zoom/pan controls
4. Export diagram as PNG/SVG

### Testing:
- UML generation tests
- Diagram rendering tests

**Estimated Time:** 1 week  
**Success Criteria:** Can generate and view UML diagrams

---

## Phase 5: Task Planning & Scheduling
**Goal:** Generate task breakdown and basic scheduling

### Backend Deliverables:
1. Task generation in GenerationService
2. PlanningService:
   - `auto_schedule(project_id)`
   - Simple sequential scheduling algorithm
   - Task dependency support (basic)
3. Task update endpoints

### Frontend Deliverables:
1. Task list with filters and sorting
2. Task detail/edit modal
3. Status update (drag-and-drop or dropdown)
4. Basic Gantt chart view (library: react-gantt-chart)
5. Timeline visualization

### Testing:
- Task generation tests
- Scheduling algorithm tests

**Estimated Time:** 1 week  
**Success Criteria:** Can generate tasks with dates and update status

---

## Phase 6: Proposal & Cost Calculation
**Goal:** Generate cost proposals based on tasks

### Backend Deliverables:
1. ProposalService:
   - `generate_proposal(project_id, hourly_rate)`
   - Cost calculation from task estimates
2. Proposal artifact generation
3. Hourly rate storage per project

### Frontend Deliverables:
1. Proposal settings form (set hourly rate)
2. Generate proposal button
3. Proposal viewer (formatted document)
4. Export proposal as PDF

### Testing:
- Cost calculation tests
- Proposal generation tests

**Estimated Time:** 3-4 days  
**Success Criteria:** Can generate cost proposal from tasks

---

## Phase 7: Integrations Framework
**Goal:** Set up integration framework with Trello export

### Backend Deliverables:
1. ITaskExporter interface
2. IntegrationService:
   - `configure_integration(cmd)`
   - `export_project_tasks(project_id)`
3. Stub Trello exporter
4. IntegrationConfig storage with encryption

### Frontend Deliverables:
1. Integrations settings page
2. Configure Trello integration form
3. Export tasks button
4. Export status display

### Testing:
- Integration configuration tests
- Export functionality tests (with stub)

**Estimated Time:** 4-5 days  
**Success Criteria:** Can configure and trigger task export (stub)

---

## Phase 8: Polish & Production Readiness
**Goal:** Complete testing, documentation, deployment setup

### Deliverables:
1. Comprehensive test suite:
   - Unit tests (80%+ coverage)
   - Integration tests
   - E2E tests (Playwright)
2. API documentation (OpenAPI/Swagger)
3. User documentation
4. Production deployment:
   - Docker multi-stage builds
   - Kubernetes manifests (optional)
   - CI/CD pipeline (GitHub Actions)
5. Performance optimization:
   - Database indexing
   - Query optimization
   - Frontend code splitting
6. Security audit:
   - OWASP checklist
   - Dependency scanning
   - Rate limiting

**Estimated Time:** 1 week  
**Success Criteria:** Production-ready application

---

## Total Timeline
- **Phase 1:** 1 week
- **Phase 2:** 1-1.5 weeks
- **Phase 3:** 1 week
- **Phase 4:** 1 week
- **Phase 5:** 1 week
- **Phase 6:** 3-4 days
- **Phase 7:** 4-5 days
- **Phase 8:** 1 week

**Total: 7-8 weeks for complete system**

---

## Technology Stack (Confirmed)

### Backend
- **Framework:** Django 4.2+ with Django REST Framework 3.14+
- **Database:** PostgreSQL 15+
- **ORM:** Django ORM
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Task Queue:** Celery + Redis (Phase 2+)
- **LLM:** OpenAI/Anthropic/HuggingFace (configurable)
- **Testing:** pytest, pytest-django, factory-boy

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State:** React Query + Context API
- **UI:** Tailwind CSS + Shadcn/ui
- **Forms:** React Hook Form + Zod
- **Testing:** Vitest + React Testing Library

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Database:** PostgreSQL (containerized)
- **Cache/Queue:** Redis (containerized)
- **Reverse Proxy:** Nginx (production)

---

## Architecture Principles

1. **Clean Architecture:**
   - Domain → Interfaces → Application → API/Web
   - Dependency Inversion: services depend on interfaces

2. **SOLID Principles:**
   - Single Responsibility
   - Open/Closed
   - Liskov Substitution
   - Interface Segregation
   - Dependency Inversion

3. **Multi-Tenant:**
   - All data scoped by organization_id
   - Row-level security via authenticated user

4. **Testability:**
   - All services unit-testable with mocked dependencies
   - Repository pattern enables easy testing

5. **Extensibility:**
   - Interfaces for LLM, exporters allow swapping implementations
   - Plugin architecture for future integrations

---

## Current Status
✅ Design documents created  
✅ Master specification received  
✅ Reference diagrams analyzed  
🚀 **Starting Phase 1 implementation now**

---

## Phase 1 Implementation Checklist

### Backend Setup
- [ ] Django project structure
- [ ] PostgreSQL Docker setup
- [ ] Domain models (all entities)
- [ ] Repository interfaces
- [ ] Repository implementations
- [ ] JWT authentication
- [ ] ProjectService with CRUD
- [ ] ActivityLogRepository
- [ ] REST API endpoints
- [ ] Unit tests

### Frontend Setup
- [ ] React + TypeScript + Vite
- [ ] Tailwind CSS + Shadcn/ui
- [ ] Auth pages (Login, Register)
- [ ] Protected routes
- [ ] Project list page
- [ ] Project creation
- [ ] API client setup

### Infrastructure
- [ ] Docker Compose
- [ ] Environment variables
- [ ] Database migrations
- [ ] README with setup instructions

Let's build this! 🚀
