-- GP2Official Database Schema
-- Copy this entire block and run it in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create types
CREATE TYPE project_status AS ENUM ('draft', 'planning', 'active', 'archived');
CREATE TYPE user_role AS ENUM ('portfolio_admin', 'program_manager', 'product_manager', 'business_analyst', 'developer', 'qa');
CREATE TYPE requirement_type AS ENUM ('functional', 'non_functional', 'business', 'technical');
CREATE TYPE requirement_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name VARCHAR(255),
    organization VARCHAR(255),
    role user_role DEFAULT 'program_manager',
    avatar_url TEXT,
    bio TEXT,
    job_title VARCHAR(255),
    skills TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table  
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'draft',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    brief_text TEXT,
    questionnaire_data JSONB DEFAULT '{}',
    phase_status JSONB DEFAULT '{"planning": "ready"}',
    roadmap JSONB DEFAULT '[]',
    team_members JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirements table
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type requirement_type DEFAULT 'functional',
    priority requirement_priority DEFAULT 'medium',
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    tags TEXT[],
    estimated_effort INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority requirement_priority DEFAULT 'medium',
    estimated_hours DECIMAL(5,2),
    assigned_to UUID REFERENCES users(id),
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    diagram_type VARCHAR(100),
    plantuml_code TEXT,
    canvas_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI runs table
CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    request_type VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    provider VARCHAR(50),
    model_name VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization);
CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_project_id ON diagrams(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_project_id ON ai_runs(project_id);

-- Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_requirements_updated_at ON requirements;
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample users and data
INSERT INTO users (email, hashed_password, full_name, organization, role) 
VALUES 
    ('admin@gp2official.com', crypt('admin123', gen_salt('bf')), 'System Admin', 'GP2Official', 'portfolio_admin'),
    ('demo@gp2official.com', crypt('demo123', gen_salt('bf')), 'Demo User', 'GP2Official', 'program_manager')
ON CONFLICT (email) DO NOTHING;

-- Sample project
INSERT INTO projects (name, description, owner_id, organization) 
SELECT 
    'AI Project Planner',
    'Intelligent project planning with AI assistance',
    id,
    'GP2Official'
FROM users WHERE email = 'demo@gp2official.com'
AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'AI Project Planner');