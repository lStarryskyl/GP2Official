export interface User {
  user_id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  organization_id: string;
  organization_name: string;
  is_active: boolean;
}

export interface Organization {
  org_id: string;
  name: string;
  billing_email?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_name: string;
}

export interface Project {
  id?: string;
  project_id?: string;
  organization?: string;
  organization_id?: string;
  owner_id?: string;
  owner_name?: string;
  name: string;
  description?: string;
  template_type: string;
  status: string;
  visibility?: string;
  feature_tier?: string;
  brief_text?: string;
  questionnaire_data?: Record<string, any>;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  phase_status?: Record<string, string>;
}

export interface Requirement {
  requirement_id: string;
  project_id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  version?: number;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  task_id: string;
  project_id: string;
  requirement_id?: string;
  title: string;
  description: string;
  estimate_hours: number;
  actual_hours: number;
  start_date?: string;
  due_date?: string;
  status: string;
  priority: string;
  assignee_id?: string;
  dependencies: string[];
  tags: string[];
  phase?: string;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  artifact_id: string;
  project_id: string;
  type: string;
  title: string;
  content_json: Record<string, any>;
  version: number;
  is_approved: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GenerationJob {
  job_id: string;
  project_id: string;
  job_type: string;
  status: string;
  config: Record<string, any>;
  result_summary: Record<string, any>;
  error_message?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface ActivityLog {
  log_id: string;
  project_id?: string;
  user_id?: string;
  event_type: string;
  details_json: Record<string, any>;
  created_at: string;
}

export interface UxFlowArtifact {
  artifact_id: string;
  project_id: string;
  type: string;
  title: string;
  content_json: {
    markdown: string;
    [key: string]: any;
  };
  version: number;
  is_approved: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiagramNodeData {
  label: string;
  description?: string;
  shape?: string;
  color?: string;
  fill?: string;
}

export interface DiagramNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: DiagramNodeData;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: Record<string, any>;
}

export interface DiagramWorkspace {
  diagram_id: string;
  project_id: string;
  stage: string;
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DiagramChatResponse {
  message: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  stage: string;
}
