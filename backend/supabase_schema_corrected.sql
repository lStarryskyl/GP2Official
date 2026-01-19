-- CORRECTED Supabase Schema for GP2Official
-- Drop existing tables and recreate with correct structure
-- Run this in Supabase SQL Editor

-- Drop existing tables (cascade to handle references)
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS workspace_invites CASCADE;
DROP TABLE IF EXISTS requirements CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS artifacts CASCADE;
DROP TABLE IF EXISTS ai_runs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    organization TEXT DEFAULT 'Private Workspace',
    hashed_password TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'viewer',
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    job_title TEXT,
    location TEXT,
    timezone TEXT,
    pronouns TEXT,
    skills JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '[]',
    availability TEXT,
    contact_email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT,
    brief_text TEXT,
    questionnaire_data JSONB DEFAULT '{}',
    owner_id TEXT NOT NULL,
    organization TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    feature_tier TEXT DEFAULT 'pro',
    phase_status JSONB DEFAULT '{}',
    roadmap JSONB,
    roadmap_summary JSONB,
    feasibility_studies JSONB,
    feasibility_sections JSONB,
    development_stack JSONB,
    development_notes JSONB,
    parent_project_id TEXT,
    scenario_label TEXT,
    scenario_metadata JSONB,
    ui_preferences JSONB,
    team_members JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMPTZ
);

-- Workspace invites table  
CREATE TABLE workspace_invites (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    status TEXT DEFAULT 'pending',
    invited_by TEXT,
    message TEXT,
    token TEXT UNIQUE NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requirements table
CREATE TABLE requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'draft',
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requirement_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    estimate_hours FLOAT,
    actual_hours FLOAT,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    dependencies JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    phase TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifacts table
CREATE TABLE artifacts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT,
    content_json JSONB,
    version INTEGER DEFAULT 1,
    is_approved BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Runs table
CREATE TABLE ai_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT,
    job_type TEXT,
    phase TEXT,
    provider TEXT,
    model TEXT,
    status TEXT DEFAULT 'pending',
    prompt TEXT,
    response_excerpt TEXT,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Activity logs table
CREATE TABLE activity_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_organization ON projects(organization);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_ai_runs_project ON ai_runs(project_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_workspace_invites_email ON workspace_invites(email);
