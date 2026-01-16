-- GP2Official Database Schema for Supabase
-- This file contains the database schema and initial data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE project_status AS ENUM ('draft', 'planning', 'active', 'archived');
CREATE TYPE project_template AS ENUM ('web_app', 'mobile_app', 'api', 'desktop', 'other');
CREATE TYPE user_role AS ENUM ('portfolio_admin', 'program_manager', 'product_manager', 'business_analyst', 'developer', 'qa');
CREATE TYPE requirement_type AS ENUM ('functional', 'non_functional', 'business', 'technical');
CREATE TYPE requirement_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name VARCHAR(255),
    organization VARCHAR(255),
    role user_role DEFAULT 'program_manager',
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    job_title VARCHAR(255),
    location VARCHAR(255),
    timezone VARCHAR(100),
    pronouns VARCHAR(50),
    skills TEXT[], -- Array of skills
    interests TEXT[], -- Array of interests
    social_links JSONB DEFAULT '[]',
    availability VARCHAR(255),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type project_template DEFAULT 'web_app',
    status project_status DEFAULT 'draft',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    feature_tier VARCHAR(50) DEFAULT 'pro',
    brief_text TEXT,
    questionnaire_data JSONB DEFAULT '{}',
    phase_status JSONB DEFAULT '{"planning": "ready", "feasibility_study": "locked", "requirements_gathering": "locked", "validation": "locked", "design": "locked", "development": "locked", "tasks": "locked", "summary": "locked"}',
    roadmap JSONB DEFAULT '[]',
    roadmap_summary JSONB DEFAULT '[]',
    feasibility_studies JSONB DEFAULT '[]',
    feasibility_sections JSONB DEFAULT '[]',
    development_stack JSONB DEFAULT '[]',
    development_notes JSONB DEFAULT '{}',
    parent_project_id UUID REFERENCES projects(id),
    scenario_label VARCHAR(255),
    scenario_metadata JSONB DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}',
    team_members JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirements table
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type requirement_type DEFAULT 'functional',
    priority requirement_priority DEFAULT 'medium',
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    source VARCHAR(255),
    acceptance_criteria TEXT[],
    dependencies UUID[],
    tags TEXT[],
    estimated_effort INTEGER, -- in hours
    business_value INTEGER, -- 1-10 scale
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority requirement_priority DEFAULT 'medium',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    assigned_to UUID REFERENCES users(id),
    tags TEXT[],
    dependencies UUID[],
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diagrams table
CREATE TABLE diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    diagram_type VARCHAR(100), -- architecture, erd, class, sequence, etc.
    plantuml_code TEXT,
    canvas_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artifacts table (for storing generated documents, reports, etc.)
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- srs, risk_analysis, cost_estimate, etc.
    content TEXT,
    metadata JSONB DEFAULT '{}',
    file_url TEXT,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI runs tracking table
CREATE TABLE ai_runs (
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
    cost_usd DECIMAL(10,4),
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Activity log table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100), -- project, requirement, task, etc.
    entity_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_organization ON projects(organization);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_requirements_project_id ON requirements(project_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_diagrams_project_id ON diagrams(project_id);
CREATE INDEX idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX idx_ai_runs_project_id ON ai_runs(project_id);
CREATE INDEX idx_ai_runs_user_id ON ai_runs(user_id);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagrams_updated_at BEFORE UPDATE ON diagrams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for projects (users can only access projects in their organization)
CREATE POLICY "Users can view projects in their organization" ON projects
    FOR SELECT USING (auth.jwt() ->> 'organization' = organization);

CREATE POLICY "Users can create projects in their organization" ON projects
    FOR INSERT WITH CHECK (auth.jwt() ->> 'organization' = organization);

CREATE POLICY "Project owners and admins can update projects" ON projects
    FOR UPDATE USING (
        owner_id = auth.uid() OR 
        (auth.jwt() ->> 'role' IN ('portfolio_admin', 'program_manager') AND auth.jwt() ->> 'organization' = organization)
    );

-- Similar policies for other tables...
CREATE POLICY "Users can view requirements for their organization's projects" ON requirements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = requirements.project_id 
            AND projects.organization = auth.jwt() ->> 'organization'
        )
    );

-- Insert sample data
INSERT INTO users (email, hashed_password, full_name, organization, role) VALUES
    ('admin@gp2official.com', crypt('admin123', gen_salt('bf')), 'System Administrator', 'GP2Official', 'portfolio_admin'),
    ('demo@gp2official.com', crypt('demo123', gen_salt('bf')), 'Demo User', 'GP2Official', 'program_manager');

-- Sample project
INSERT INTO projects (name, description, owner_id, organization) 
SELECT 
    'Sample E-commerce Platform',
    'A modern e-commerce platform with AI-powered recommendations',
    id,
    'GP2Official'
FROM users WHERE email = 'demo@gp2official.com';
