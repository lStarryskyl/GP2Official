# GP2 Official - AI-Powered Project Planning Platform

A comprehensive software project planning platform with AI assistance. Guide your projects through 8 structured phases from initial planning to final summary.

## Features

- **8-Phase Project Workflow**: Planning → Feasibility → Requirements → Validation → Design → Development → Tasks → Summary
- **AI-Powered Generation**: Supports multiple LLM providers (or runs without AI in mock mode)
- **PlantUML Diagrams**: Architecture, ERD, Class, Sequence, State, and Activity diagrams
- **Interactive Canvas**: Miro-like diagram editing with drag-and-drop
- **Real-time Collaboration**: Multi-user project support with role-based access
- **Export Options**: Download diagrams, requirements, and documentation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Flow** for diagram canvas
- **Zustand** for state management

### Backend
- **FastAPI** (Python 3.11+)
- **MongoDB** database (with in-memory fallback for development)
- **JWT Authentication**
- **Optional AI**: Supports Gemini, HuggingFace, or mock mode

## Running Locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (optional - app works with in-memory storage)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/GP2Official.git
cd GP2Official
```

### Step 2: Backend Setup

```bash
cd backend

# Create & activate the virtual environment (choose your OS)
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
py -3 -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies once the venv is active
pip install -r requirements.txt
```

### Step 3: Configure Environment

Create a `.env` file in the `backend` folder:

```env
# Required
SECRET_KEY=your-secret-key-here-change-this

# Database (optional - uses in-memory if MongoDB unavailable)
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=architect_ai
REFRESH_TOKEN_EXPIRE_DAYS=14

# Or use in-memory database (no MongoDB needed)
USE_IN_MEMORY_DB=true

# Frontend URL for CORS
FRONTEND_ORIGIN=http://localhost:5173

# AI Provider (optional - defaults to mock/stub mode)
LLM_PROVIDER=stub
```

### Step 4: Run Backend

```bash
# From backend folder (after activating the venv)
# macOS / Linux
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Windows PowerShell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Tip: need a single command? Use `python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`

Backend API runs at: `http://localhost:8000`

### Step 5: Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`. If you need to bind to another interface/port:

```bash
# macOS / Linux / Windows
npm run dev -- --host 0.0.0.0 --port 5173
```

### Step 6: Access the App

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Create your first project
4. Start working through the 8 phases!

## Quick Start (No Database Required)

For the fastest setup without MongoDB:

```bash
# Terminal 1 - Backend
cd backend

# macOS / Linux
python3 -m venv venv && source venv/bin/activate

# Windows (PowerShell)
py -3 -m venv venv ; .\venv\Scripts\Activate.ps1

pip install -r requirements.txt
echo USE_IN_MEMORY_DB=true > .env
echo SECRET_KEY=dev-secret-key >> .env
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Note: In-memory mode means data is lost when the server restarts.

## Everyday Developer Commands

| Task | macOS / Linux | Windows PowerShell |
|------|---------------|--------------------|
| Activate backend venv | `source backend/venv/bin/activate` | `.\backend\venv\Scripts\Activate.ps1` |
| Install backend deps | `pip install -r backend/requirements.txt` | `pip install -r backend/requirements.txt` |
| Start backend | `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000` | `cd backend; uvicorn main:app --reload --host 0.0.0.0 --port 8000` |
| Install frontend deps | `cd frontend && npm install` | same |
| Start frontend dev server | `cd frontend && npm run dev` | same |
| Production build check | `cd frontend && npm run build` | same |

> Before pushing, run `npm run build` (frontend) and ensure the backend boots without errors so CI and teammates have a smooth experience.

## Project Phases

The platform guides users through 8 sequential phases:

| Step | Phase | Description |
|------|-------|-------------|
| 1 | **Planning** | Project vision, objectives, stakeholders, and success metrics |
| 2 | **Feasibility Study** | Market, technical, economic, and legal analysis |
| 3 | **Requirements Gathering** | User stories, functional/non-functional requirements |
| 4 | **Validation** | Stakeholder sign-off, prototype validation, risk confirmation |
| 5 | **Design** | Architecture diagrams, ERD, class diagrams, API specs |
| 6 | **Development** | Tech stack, implementation plan, coding standards |
| 7 | **Tasks** | Epic breakdown, Gantt visualization, dependencies |
| 8 | **Summary** | Final metrics, lessons learned, recommendations |

## API Endpoints

### Authentication
```
POST /api/auth/register/    - Register new user
POST /api/auth/login/       - Login and get JWT
GET  /api/auth/me/          - Get current user
```

### Projects
```
GET    /api/projects/                    - List projects
POST   /api/projects/                    - Create project
GET    /api/projects/{id}/               - Get project details
PATCH  /api/projects/{id}/               - Update project
DELETE /api/projects/{id}/               - Delete project
```

### Phase Workflow
```
GET  /api/projects/{id}/phases/                    - Get phase status
POST /api/projects/{id}/phases/{phase}/generate/   - Generate phase content
POST /api/projects/{id}/phases/unlock-all/         - Unlock all phases
```

### Diagrams
```
GET  /api/projects/{id}/sdlc-diagrams/{stage}/        - Get diagram workspace
PUT  /api/projects/{id}/sdlc-diagrams/{stage}/        - Save diagram
POST /api/projects/{id}/sdlc-diagrams/{stage}/chat/   - AI diagram assistant
POST /api/projects/{id}/diagrams/sync/                - Sync canvas with data
```

## Project Structure

```
GP2Official/
├── backend/
│   ├── emergentintegrations/   # LLM client (Gemini, HuggingFace)
│   ├── models/                 # Data models
│   ├── repositories/           # Data access layer
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   ├── config.py               # App configuration
│   └── main.py                 # FastAPI app entry
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── phases/         # Phase-specific components
│   │   │   ├── canvas/         # Diagram canvas (MiroCanvas)
│   │   │   └── ui/             # Shared UI components
│   │   ├── constants/          # Design system, phase configs
│   │   ├── lib/                # API client, utilities
│   │   ├── pages/              # Route pages
│   │   ├── store/              # Zustand state stores
│   │   └── types/              # TypeScript definitions
│   └── package.json
│
└── README.md
```

## Environment Variables

All environment variables are optional. The app runs with sensible defaults.

### Backend (.env)
```env
# Required for production
SECRET_KEY=your-secret-key-change-this

# Database
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=architect_ai
USE_IN_MEMORY_DB=true  # Set to true to skip MongoDB

# CORS
FRONTEND_ORIGIN=http://localhost:5173

# AI (optional - defaults to stub/mock mode)
LLM_PROVIDER=stub  # Options: stub, gemini, huggingface
LLM_API_KEY=       # Only needed if using gemini/huggingface
LLM_MODEL_NAME=    # Model name for the provider
```

## AI Integration (Optional)

The platform works without any AI configuration using **stub/mock mode**. Each phase has a dedicated AI assistant that returns placeholder content when no AI is configured.

To enable real AI:
1. Set `LLM_PROVIDER` to `gemini` or `huggingface`
2. Add your `LLM_API_KEY`
3. Optionally set `LLM_MODEL_NAME`

Supported providers:
- **stub/mock** - Default, no API key needed
- **gemini** - Google Gemini API
- **huggingface** - HuggingFace Inference API

## PlantUML Diagrams

Diagrams use PlantUML with proper encoding (deflate + custom base64).

Supported diagram types:
- Architecture diagrams
- Entity Relationship Diagrams (ERD)
- Class diagrams
- Sequence diagrams
- State machine diagrams
- Activity diagrams

## Development

### Run Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Run Frontend
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## License

MIT License
