import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WS';
  path: string;
  description: string;
  auth?: boolean;
  body?: string;
  response?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET:    '#22c55e',
  POST:   '#1A6FD4',
  PUT:    '#F97316',
  PATCH:  '#a855f7',
  DELETE: '#ef4444',
  WS:     '#06b6d4',
};

const Endpoint: React.FC<EndpointProps> = ({ method, path, description, auth = true, body, response }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid rgba(26,111,212,0.2)',
      borderRadius: '8px',
      marginBottom: '8px',
      overflow: 'hidden',
      background: '#111f30',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', padding: '12px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          background: `${METHOD_COLORS[method]}22`,
          color: METHOD_COLORS[method],
          minWidth: '52px',
          textAlign: 'center',
        }}>{method}</span>
        <code style={{ fontSize: '13px', color: '#E8EDF5', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>{path}</code>
        {auth && <span style={{ fontSize: '10px', color: '#F97316', border: '1px solid rgba(249,115,22,0.4)', borderRadius: '4px', padding: '1px 6px', flexShrink: 0 }}>Auth</span>}
        {open ? <ChevronUp size={14} color="#8899AA" /> : <ChevronDown size={14} color="#8899AA" />}
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(26,111,212,0.15)' }}>
          <p style={{ color: '#8899AA', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', margin: '12px 0 0' }}>{description}</p>
          {body && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '11px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Request Body</p>
              <pre style={{ background: '#0D1B2A', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#70b3ee', fontFamily: 'JetBrains Mono, monospace', overflow: 'auto', margin: 0 }}>{body}</pre>
            </div>
          )}
          {response && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '11px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response</p>
              <pre style={{ background: '#0D1B2A', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', overflow: 'auto', margin: 0 }}>{response}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Section { id: string; label: string; }

const SECTIONS: Section[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'auth', label: 'Authentication' },
  { id: 'projects', label: 'Projects' },
  { id: 'phases', label: 'Phase Generation' },
  { id: 'ai', label: 'AI & Chat' },
  { id: 'diagrams', label: 'Diagrams' },
  { id: 'export', label: 'Export' },
  { id: 'websocket', label: 'WebSocket' },
];

const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: '#E8EDF5', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        height: '56px',
        background: '#111f30',
        borderBottom: '1px solid rgba(26,111,212,0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={18} color="#1A6FD4" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', color: '#E8EDF5' }}>
            Acorn API Documentation
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px',
              background: 'rgba(26,111,212,0.15)',
              border: '1px solid rgba(26,111,212,0.3)',
              borderRadius: '8px',
              color: '#3d8fe0',
              fontSize: '12px',
              textDecoration: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <ExternalLink size={12} />
            Interactive API (Swagger)
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Sidebar nav */}
        <aside style={{
          width: '200px',
          flexShrink: 0,
          padding: '24px 16px',
          position: 'sticky',
          top: '56px',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
        }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(s.id);
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeSection === s.id ? 'rgba(26,111,212,0.15)' : 'transparent',
                borderLeft: activeSection === s.id ? '3px solid #1A6FD4' : '3px solid transparent',
                color: activeSection === s.id ? '#E8EDF5' : '#8899AA',
                fontSize: '13px',
                fontFamily: activeSection === s.id ? 'Syne, sans-serif' : 'DM Sans, sans-serif',
                fontWeight: activeSection === s.id ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '2px',
              }}
            >
              {s.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '32px 24px', maxWidth: '900px' }}>

          {/* Overview */}
          <section id="overview" style={{ marginBottom: '48px' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '32px', color: '#E8EDF5', margin: '0 0 8px' }}>
              Acorn API
            </h1>
            <p style={{ color: '#8899AA', fontSize: '16px', fontFamily: 'DM Sans, sans-serif', lineHeight: '1.7', margin: '0 0 24px' }}>
              Acorn is an AI-powered SDLC planning platform. The REST API lets you create projects, generate full phase documentation with Gemini AI, export artifacts, and collaborate in real-time.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Base URL', value: 'http://localhost:8000/api' },
                { label: 'Auth', value: 'Bearer JWT token' },
                { label: 'AI Model', value: 'Gemini 2.5 Pro / 2.0 Flash' },
              ].map(item => (
                <div key={item.label} style={{ padding: '16px', background: '#111f30', borderRadius: '10px', border: '1px solid rgba(26,111,212,0.2)' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                  <code style={{ fontSize: '13px', color: '#3d8fe0', fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</code>
                </div>
              ))}
            </div>
          </section>

          {/* Auth */}
          <section id="auth" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>Authentication</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px', lineHeight: '1.6' }}>
              Acorn uses JWT access tokens with SHA-256 hashed refresh tokens. Include the access token in every authenticated request as <code style={{ color: '#3d8fe0' }}>Authorization: Bearer &lt;token&gt;</code>.
            </p>
            <Endpoint method="POST" path="/auth/register" description="Register a new user account. Returns access_token and refresh_token." auth={false}
              body={`{\n  "email": "you@example.com",\n  "password": "SecurePass1",\n  "full_name": "Jane Smith",\n  "organization": "Acme Corp",\n  "role": "product_manager"\n}`}
              response={`{\n  "access_token": "eyJ...",\n  "refresh_token": "...",\n  "token_type": "bearer",\n  "user": { "id": "uuid", "email": "...", "role": "product_manager" }\n}`}
            />
            <Endpoint method="POST" path="/auth/login" description="Login with email and password." auth={false}
              body={`{ "email": "you@example.com", "password": "SecurePass1" }`}
              response={`{ "access_token": "eyJ...", "refresh_token": "...", "token_type": "bearer" }`}
            />
            <Endpoint method="POST" path="/auth/token/refresh/" description="Exchange a refresh token for a new access token." auth={false}
              body={`{ "refresh_token": "..." }`}
            />
            <Endpoint method="GET" path="/auth/me" description="Returns the currently authenticated user's profile." />
            <Endpoint method="POST" path="/auth/logout" description="Revoke the current refresh token." />
          </section>

          {/* Projects */}
          <section id="projects" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>Projects</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px' }}>
              Projects are the top-level container. Each project has 10 SDLC phases, requirements, tasks, artifacts, and team members.
            </p>
            <Endpoint method="GET" path="/projects/" description="List all projects owned by the current user." />
            <Endpoint method="POST" path="/projects/" description="Create a new project from a brief."
              body={`{\n  "name": "My App",\n  "description": "A marketplace for...",\n  "template_type": "web_app"\n}`}
            />
            <Endpoint method="GET" path="/projects/{id}" description="Get full project details including phases, team, and metadata." />
            <Endpoint method="PUT" path="/projects/{id}" description="Update project name, description, or metadata." />
            <Endpoint method="DELETE" path="/projects/{id}" description="Delete a project and all associated data." />
            <Endpoint method="POST" path="/projects/{id}/generate/" description="Start AI generation of requirements, SRS, tasks, diagrams, risk, and cost estimate in a single background job." />
            <Endpoint method="GET" path="/projects/{id}/requirements/" description="List all requirements for the project." />
            <Endpoint method="GET" path="/projects/{id}/tasks/" description="List all tasks for the project." />
            <Endpoint method="GET" path="/projects/{id}/artifacts/" description="List all generated artifacts (SRS, phase outputs, diagrams, etc.)." />
            <Endpoint method="GET" path="/projects/{id}/activity/" description="List recent project activity events." />
          </section>

          {/* Phase Generation */}
          <section id="phases" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>Phase Generation</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 8px' }}>
              10 SDLC phases: <code style={{ color: '#3d8fe0' }}>planning</code>, <code style={{ color: '#3d8fe0' }}>feasibility_study</code>, <code style={{ color: '#3d8fe0' }}>requirements_gathering</code>, <code style={{ color: '#3d8fe0' }}>validation</code>, <code style={{ color: '#3d8fe0' }}>design</code>, <code style={{ color: '#3d8fe0' }}>development</code>, <code style={{ color: '#3d8fe0' }}>tasks</code>, <code style={{ color: '#3d8fe0' }}>cost_benefit</code>, <code style={{ color: '#3d8fe0' }}>risks</code>, <code style={{ color: '#3d8fe0' }}>summary</code>
            </p>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px' }}>
              Each phase stores its output as a <code style={{ color: '#3d8fe0' }}>PHASE_*</code> artifact with markdown content.
            </p>
            <Endpoint method="GET" path="/projects/{id}/phases/" description="Get status of all 10 phases (locked/active/completed)." />
            <Endpoint method="POST" path="/projects/{id}/phases/{phase}/generate/" description="Generate content for a specific phase using Gemini AI. Returns structured markdown."
              body={`{ "custom_prompt": "Focus on mobile-first architecture" }`}
              response={`{ "phase": "design", "content": "# System Design\\n\\n...", "status": "completed" }`}
            />
            <Endpoint method="GET" path="/projects/{id}/phases/{phase}/generate/stream/" description="Server-Sent Events (SSE) stream — yields tokens in real-time as Gemini generates. Connect with EventSource." />
            <Endpoint method="POST" path="/projects/{id}/phases/unlock-all/" description="Unlock all phases simultaneously (bypasses linear progression)." />
          </section>

          {/* AI & Chat */}
          <section id="ai" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>AI & Chat</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px' }}>
              Athena is the per-phase AI chat assistant. Specialized agents handle Conflict Detection, Security Audit, Tech Stack Recommendation, and more. The AI Debate arena pits two agents against each other on any topic.
            </p>
            <Endpoint method="POST" path="/ai-chat/chat" description="Send a message to the Athena AI assistant with phase context. Returns conversational response."
              body={`{\n  "project_id": "uuid",\n  "phase": "requirements_gathering",\n  "message": "What are the highest risk requirements?",\n  "history": []\n}`}
            />
            <Endpoint method="POST" path="/ai-chat/agent-task" description="Run a specialized AI agent task."
              body={`{\n  "project_id": "uuid",\n  "task_type": "conflict_detection",\n  "content": "..requirements text.."\n}`}
              response={`{ "task_type": "conflict_detection", "result": { "conflicts": [...], "summary": "..." } }`}
            />
            <Endpoint method="GET" path="/ai-chat/supported-tasks" description="List all available agent task types." auth={false} />
            <Endpoint method="POST" path="/projects/{id}/debate" description="Start an AI debate between Advocate and Critic agents on a design topic. Returns structured debate with moderator verdict."
              body={`{ "topic": "Microservices vs monolith", "context": "..." }`}
            />
            <Endpoint method="POST" path="/ai/generate" description="Generate content via the full AI pipeline (requirements → SRS → diagrams → tasks → risk → cost)." />
          </section>

          {/* Diagrams */}
          <section id="diagrams" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>Diagrams</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px' }}>
              SDLC stage canvases (freeform), UML diagrams (PlantUML), and AI-assisted diagram editing via chat.
            </p>
            <Endpoint method="GET" path="/projects/{id}/sdlc-diagrams/" description="List all stage canvases for this project." />
            <Endpoint method="PUT" path="/projects/{id}/sdlc-diagrams/{stage}/" description="Save a canvas state." />
            <Endpoint method="POST" path="/projects/{id}/sdlc-diagrams/{stage}/chat/" description="Edit a diagram by describing changes in natural language." />
            <Endpoint method="GET" path="/projects/{id}/uml/{diagram_type}/" description="Fetch a UML artifact. Types: use_case, class_diagram, sequence, entity_relationship." />
            <Endpoint method="POST" path="/projects/{id}/uml/{diagram_type}/chat/" description="Edit a UML diagram via conversational AI." />
          </section>

          {/* Export */}
          <section id="export" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>Export</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px' }}>
              Export a complete project plan in PDF, DOCX, or Markdown. All exports include project description, requirements, tasks, and phase outputs.
            </p>
            <Endpoint method="GET" path="/projects/{id}/export/pdf" description="Download the full project as a PDF file. Returns binary PDF with Content-Disposition: attachment." />
            <Endpoint method="GET" path="/projects/{id}/export/docx" description="Download the full project as a Microsoft Word DOCX file." />
            <Endpoint method="GET" path="/projects/{id}/export/markdown" description="Download all phase outputs and requirements as a single Markdown file. Ideal for developers." />
          </section>

          {/* WebSocket */}
          <section id="websocket" style={{ marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#E8EDF5', margin: '0 0 8px', paddingBottom: '8px', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>WebSocket Collaboration</h2>
            <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', margin: '0 0 16px' }}>
              Real-time collaboration infrastructure. Track active users, cursor positions, and broadcast changes across a project.
            </p>
            <Endpoint method="WS" path="/ws/projects/{id}/collaborate" description="WebSocket connection for real-time collaboration on a project. Send JSON messages with type: cursor_move | edit | presence." />
            <Endpoint method="GET" path="/ws/projects/{id}/collaborators" description="List all users currently active in a project session." />
            <Endpoint method="POST" path="/ws/projects/{id}/broadcast" description="Broadcast a message to all connected collaborators." />
          </section>

        </main>
      </div>
    </div>
  );
};

export default DocsPage;
