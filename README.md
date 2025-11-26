# Architect AI - Software Planning Automation

An intelligent platform that automates the software planning lifecycle from project brief to comprehensive SRS, UML diagrams, and task plans.

## 🏗️ Architecture

**Clean Architecture with SOLID Principles:**

```
API Layer (Django REST Framework)
    ↓
Application Services (Use Cases)
    ↓
Repository Interfaces (Ports)
    ↓
Infrastructure (Django ORM, LLM Clients)
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (for frontend)
- Docker & Docker Compose (optional)

### Backend Setup

**1. Start Database (Docker):**
```bash
docker-compose up -d postgres redis
```

**2. Install Dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

**3. Setup Environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

**4. Run Migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**5. Create Superuser:**
```bash
python manage.py createsuperuser
```

**6. Run Development Server:**
```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### API Documentation

- **Swagger UI:** http://localhost:8000/swagger/
- **ReDoc:** http://localhost:8000/redoc/
- **Admin Panel:** http://localhost:8000/admin/

## 📡 API Endpoints

### Authentication

```bash
# Register
POST /api/auth/register/
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "organization_name": "Acme Corp"
}

# Login
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Get Current User
GET /api/auth/me/
Authorization: Bearer <access_token>
```

### Projects

```bash
# List Projects
GET /api/projects/

# Create Project
POST /api/projects/
{
  "name": "My Project",
  "description": "Project description",
  "template_type": "WEB_APP",
  "brief_text": "Build a web application for..."
}

# Get Project
GET /api/projects/{id}/

# Update Project
PATCH /api/projects/{id}/

# Delete Project
DELETE /api/projects/{id}/

# Start AI Generation
POST /api/projects/{id}/generate/
{
  "detail_level": "STANDARD",
  "include_uml": true,
  "include_tasks": true
}

# Get Requirements
GET /api/projects/{id}/requirements/

# Get Tasks
GET /api/projects/{id}/tasks/

# Get Artifacts (SRS, UML)
GET /api/projects/{id}/artifacts/

# Get Activity Log
GET /api/projects/{id}/activity/
```

### Generation Jobs

```bash
# Get Job Status
GET /api/generation-jobs/{job_id}/
```

### Requirements

```bash
# Update Requirement
PATCH /api/requirements/{id}/
{
  "status": "APPROVED",
  "priority": "HIGH"
}
```

### Tasks

```bash
# Update Task
PATCH /api/tasks/{id}/
{
  "status": "IN_PROGRESS",
  "estimate_hours": 8.0
}
```

## 🧪 Testing

### Test with cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "first_name": "Test",
    "last_name": "User",
    "organization_name": "Test Org"
  }'

# Login (save the access token)
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}'

# Create Project (use token from login)
curl -X POST http://localhost:8000/api/projects/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{
    "name": "My First Project",
    "description": "Test project",
    "template_type": "WEB_APP",
    "brief_text": "Build a todo list web application with user authentication"
  }'

# Generate (use project_id from create response)
curl -X POST http://localhost:8000/api/projects/<PROJECT_ID>/generate/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -d '{"detail_level": "STANDARD", "include_uml": true, "include_tasks": true}'
```

## 🏛️ Domain Models

- **Organization** - Multi-tenant container
- **User** - with roles (Owner, Admin, Member)
- **Project** - Software project
- **Requirement** - FR/NFR/Constraints
- **Artifact** - SRS, UML, Proposals
- **Task** - Work items with estimates
- **GenerationJob** - AI processing jobs
- **ActivityLog** - Audit trail

## 🤖 AI Generation

Currently using **Stub LLM** for testing. Returns realistic mock data.

**To use real LLM:**
1. Implement `ILLMClient` for your provider (OpenAI, HuggingFace, etc.)
2. Update `api/dependencies.py` to use real client
3. Configure API keys in `.env`

## 🔒 Security

- JWT authentication with short-lived tokens
- Multi-tenant data isolation (organization scoping)
- Role-based access control
- Password hashing with Django's PBKDF2
- CORS configured for frontend origins

## 📁 Project Structure

```
backend/
├── domain/              # Domain models (entities)
├── interfaces/          # Repository & service interfaces
├── infrastructure/      # Implementations (Django ORM, LLM)
├── application/         # Application services (use cases)
├── api/                 # REST API (DRF views, serializers)
└── config/              # Django settings
```

## 🛠️ Development

### Run Tests
```bash
pytest
```

### Code Quality
```bash
# Format
black .

# Lint
flake8

# Type Check
mypy .
```

## 📝 License

Proprietary - All Rights Reserved
