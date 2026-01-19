-- Migration: Add Persona, User Stories, SRS Audit, Stakeholder, and Subscription features
-- Created: 2026-01-19

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PERSONAS & USER STORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    age_range VARCHAR(50),
    background TEXT,
    goals JSONB DEFAULT '[]',
    pain_points JSONB DEFAULT '[]',
    tech_savviness VARCHAR(50),
    motivations JSONB DEFAULT '[]',
    frustrations JSONB DEFAULT '[]',
    preferred_channels JSONB DEFAULT '[]',
    quote TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    as_a VARCHAR(255),
    i_want TEXT,
    so_that TEXT,
    acceptance_criteria JSONB DEFAULT '[]',
    priority VARCHAR(50) DEFAULT 'medium',
    story_points INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    linked_requirements JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_personas_project ON personas(project_id);
CREATE INDEX idx_user_stories_project ON user_stories(project_id);
CREATE INDEX idx_user_stories_persona ON user_stories(persona_id);

-- ============================================================================
-- SRS AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS srs_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    audit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_score DECIMAL(5,2),
    completeness_score DECIMAL(5,2),
    consistency_score DECIMAL(5,2),
    clarity_score DECIMAL(5,2),
    testability_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'draft',
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES srs_audits(id) ON DELETE CASCADE,
    category VARCHAR(50),
    severity VARCHAR(50),
    requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
    title VARCHAR(500),
    description TEXT,
    recommendation TEXT,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_srs_audits_project ON srs_audits(project_id);
CREATE INDEX idx_audit_findings_audit ON audit_findings(audit_id);
CREATE INDEX idx_audit_findings_requirement ON audit_findings(requirement_id);

-- ============================================================================
-- STAKEHOLDER MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS stakeholders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    organization VARCHAR(255),
    influence_level VARCHAR(50),
    interest_level VARCHAR(50),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    preferences JSONB DEFAULT '[]',
    concerns JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stakeholder_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stakeholder_id UUID REFERENCES stakeholders(id) ON DELETE SET NULL,
    requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50),
    priority VARCHAR(50),
    description TEXT,
    proposed_change TEXT,
    impact_analysis JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impact_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID REFERENCES stakeholder_feedback(id) ON DELETE CASCADE,
    affected_requirements JSONB DEFAULT '[]',
    affected_tasks JSONB DEFAULT '[]',
    effort_estimate VARCHAR(100),
    cost_impact VARCHAR(100),
    schedule_impact VARCHAR(100),
    risk_level VARCHAR(50),
    benefits JSONB DEFAULT '[]',
    drawbacks JSONB DEFAULT '[]',
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stakeholders_project ON stakeholders(project_id);
CREATE INDEX idx_stakeholder_feedback_project ON stakeholder_feedback(project_id);
CREATE INDEX idx_stakeholder_feedback_stakeholder ON stakeholder_feedback(stakeholder_id);
CREATE INDEX idx_impact_analyses_change_request ON impact_analyses(change_request_id);

-- ============================================================================
-- SUBSCRIPTIONS & PAYMENTS (Fake Gateway)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization VARCHAR(255),
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    last4 VARCHAR(4),
    brand VARCHAR(50),
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'draft',
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_user ON invoices(user_id);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_user_stories_updated_at ON user_stories;
CREATE TRIGGER update_user_stories_updated_at BEFORE UPDATE ON user_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_srs_audits_updated_at ON srs_audits;
CREATE TRIGGER update_srs_audits_updated_at BEFORE UPDATE ON srs_audits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_stakeholders_updated_at ON stakeholders;
CREATE TRIGGER update_stakeholders_updated_at BEFORE UPDATE ON stakeholders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_stakeholder_feedback_updated_at ON stakeholder_feedback;
CREATE TRIGGER update_stakeholder_feedback_updated_at BEFORE UPDATE ON stakeholder_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
