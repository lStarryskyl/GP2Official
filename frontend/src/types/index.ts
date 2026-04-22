export interface SocialLink {
  label: string;
  url: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  organization?: string;
  role: string;
  role_label: string;
  role_authority: number;
  subscription_tier?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  job_title?: string;
  location?: string;
  timezone?: string;
  pronouns?: string;
  availability?: string;
  contact_email?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
  social_links?: SocialLink[];
  created_at: string;
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
  full_name: string;
  organization: string;
  role: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  job_title?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  pronouns?: string;
  avatar_url?: string;
  banner_url?: string;
  availability?: string;
  contact_email?: string;
  phone?: string;
  skills?: string[];
  interests?: string[];
  social_links?: SocialLink[];
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
  phase_completion_meta?: Record<string, PhaseCompletionMeta>;
  parent_project_id?: string | null;
  scenario_label?: string | null;
  scenario_metadata?: Record<string, any> | null;
  ui_preferences?: Record<string, any> | null;
  team_members?: ProjectTeamMember[];
}

export interface PhaseCompletionMeta {
  completed_by?: string | null;
  completed_by_name?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  edited_by?: string | null;
  edited_by_name?: string | null;
  edited_at?: string | null;
}

export interface ProjectTeamMember {
  user_id: string;
  full_name?: string;
  email: string;
  project_role: string;
  role_label: string;
  authority: number;
  status?: string;
  assigned_by?: string;
  assigned_at?: string;
  notes?: string;
}

export interface ArtifactContent {
  markdown?: string;
  raw_markdown?: string;
  [key: string]: any;
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
  role?: string;
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
  content_json: ArtifactContent;
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
  content_json: ArtifactContent;
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
  frames?: { id: string; timestamp: string; nodes: DiagramNode[]; edges?: DiagramEdge[] }[];
  created_at: string;
  updated_at: string;
}

export interface DiagramChatResponse {
  message: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  stage: string;
}

export interface AiRun {
  run_id: string;
  project_id: string;
  user_id?: string | null;
  job_type: string;
  phase?: string | null;
  provider?: string | null;
  model?: string | null;
  status: string;
  prompt_preview?: string | null;
  response_preview?: string | null;
  duration_ms?: number | null;
  error_message?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  completed_at?: string | null;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_by: string;
  organization: string;
  message?: string | null;
  created_at: string;
  accepted_at?: string | null;
  accepted_by?: string | null;
}

export interface ChangeLogFileDetail {
  name: string;
  timestamp?: string;
  order?: number;
  [key: string]: any;
}

export interface ChangeLogEntry {
  id: string;
  project_id: string;
  organization?: string | null;
  author_id: string;
  description: string;
  files: string[];
  task_ids: string[];
  requirement_ids: string[];
  entry_type: string;
  ai_summary?: string | null;
  diagram_url?: string | null;
  metadata: Record<string, any> & {
    file_details?: ChangeLogFileDetail[];
  };
  created_at: string;
  updated_at: string;
}

export interface VersionHistoryEntry {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string;
  version_number: number;
  changes: Record<string, any>;
  change_summary: string;
  changed_by: string;
  changed_by_name: string;
  previous_version_id?: string | null;
  created_at: string;
}

export interface VersionDiffResult {
  entity_type: string;
  entity_id: string;
  from_version: number;
  to_version: number;
  added: Record<string, any>;
  removed: Record<string, any>;
  modified: Record<string, { from: any; to: any }>;
  summary: string;
}

export interface TraceabilityLink {
  id: string;
  project_id: string;
  source_type: string;
  source_id: string;
  source_name: string;
  target_type: string;
  target_id: string;
  target_name: string;
  link_type: string;
  rationale?: string | null;
  created_by: string;
  created_at: string;
}

export interface TraceabilityMatrixData {
  project_id: string;
  requirements: Array<{ id: string; title: string; type: string }>;
  tasks: Array<{ id: string; title: string; status: string }>;
  links: TraceabilityLink[];
  coverage_percentage: number;
  orphaned_requirements: string[];
  orphaned_tasks: string[];
  generated_at: string;
}

export interface NegotiationComment {
  id: string;
  project_id: string;
  requirement_id?: string | null;
  parent_id?: string | null;
  content: string;
  author_id: string;
  author_name: string;
  replies: string[];
  mentions: string[];
  reactions: Record<string, string[]>;
  edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface NegotiationThread {
  id: string;
  project_id: string;
  requirement_id?: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  stakeholder_ids: string[];
  created_by: string;
  comments: string[];
  decisions: Record<string, any>[];
  impact_analysis_id?: string | null;
  resolution?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioSnapshot {
  project_id: string;
  name: string;
  status: string;
  phase_status: Record<string, string>;
  requirements: number;
  tasks: number;
  risk_artifacts: number;
  cost_estimate: number;
}

export interface ScenarioDiff {
  baseline: ScenarioSnapshot;
  branch: ScenarioSnapshot;
  summary: Record<string, number>;
  phase_deltas: { phase: string; baseline: string; branch: string }[];
}

export interface GuidedWorkspaceConfig {
  preset: string;
  recommended_phases: string[];
  required_artifacts: string[];
  ai_prompts: Record<string, string>;
  risk_library: string[];
  integrations: string[];
  notes: string[];
}

export interface SandboxRunResult {
  language: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
}
