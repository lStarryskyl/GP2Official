# Architect AI - Frontend

React + TypeScript frontend for Architect AI software planning automation platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Yarn
- Backend API running on http://localhost:8000

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

Frontend will be available at: `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   └── Layout.tsx       # Main layout with header
├── pages/
│   ├── LoginPage.tsx    # Login page
│   ├── RegisterPage.tsx # Registration page
│   ├── ProjectsPage.tsx # Project list
│   ├── NewProjectPage.tsx # Create project
│   └── ProjectDetailPage.tsx # Project details with AI generation
├── store/
│   └── authStore.ts     # Zustand auth state management
├── lib/
│   ├── api.ts           # API client with axios
│   └── utils.ts         # Utility functions
├── types/
│   └── index.ts         # TypeScript types
├── App.tsx              # Main app with routing
└── main.tsx             # Entry point
```

## 🎨 Features

### ✅ Authentication
- User registration with organization creation
- JWT-based login
- Token refresh on expiry
- Protected routes
- Automatic redirect to login

### ✅ Project Management
- List all projects
- Create new projects with template selection
- View project details
- Real-time project stats

### ✅ AI Generation
- One-click AI generation
- Real-time job status polling
- View generated requirements
- View SRS document (IEEE 830)
- View task breakdown with estimates

### ✅ UI Components
- Modern, responsive design
- Tailwind CSS styling
- Reusable UI components
- Loading states
- Error handling

## 🔧 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📡 API Integration

The frontend connects to the Django backend via the API client (`src/lib/api.ts`).

### Authentication Flow

1. User registers/logs in
2. JWT tokens stored in localStorage
3. Access token added to all requests
4. Automatic token refresh on 401

### API Endpoints Used

```typescript
// Auth
POST /api/auth/register/
POST /api/auth/login/
GET /api/auth/me/
POST /api/auth/token/refresh/

// Projects
GET /api/projects/
POST /api/projects/
GET /api/projects/{id}/
POST /api/projects/{id}/generate/
GET /api/projects/{id}/requirements/
GET /api/projects/{id}/tasks/
GET /api/projects/{id}/artifacts/

// Jobs
GET /api/generation-jobs/{id}/
```

## 🎯 Usage

### 1. Register

- Navigate to `/register`
- Fill in user details and organization name
- Automatically logs in after registration

### 2. Create Project

- Click "New Project" on projects page
- Fill in project name, type, and brief
- Submit to create project

### 3. Generate with AI

- Open project detail page
- Click "Generate with AI" button
- Wait for processing (real-time status updates)
- View generated requirements, SRS, and tasks

### 4. View Results

- **Overview Tab**: Project details and brief
- **Requirements Tab**: Extracted requirements with priorities
- **SRS Tab**: IEEE 830-compliant document
- **Tasks Tab**: Work breakdown with estimates

## 🔐 Security

- JWT authentication with refresh
- Protected routes
- Automatic logout on token expiry
- No sensitive data in localStorage (only tokens)

## 🎨 Customization

### Styling

Edit `tailwind.config.js` and `src/index.css` for theme customization.

### API URL

Edit `.env` file:
```
VITE_API_URL=http://localhost:8000
```

## 🧪 Development

```bash
# Install dependencies
yarn install

# Run dev server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Lint code
yarn lint
```

## 📦 Build

```bash
yarn build
```

Output will be in `dist/` directory.

## 🚢 Deployment

1. Build the app: `yarn build`
2. Deploy `dist/` folder to any static hosting (Vercel, Netlify, S3, etc.)
3. Set environment variable `VITE_API_URL` to production backend URL

## 🐛 Troubleshooting

**CORS errors:**
- Ensure backend `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check backend is running

**Authentication issues:**
- Clear localStorage
- Check backend JWT configuration
- Verify token expiry settings

**API connection:**
- Verify `VITE_API_URL` in `.env`
- Check network tab in browser DevTools
- Ensure backend is accessible

## 📝 License

Proprietary - All Rights Reserved
