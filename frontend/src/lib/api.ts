import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  RegisterRequest,
  UserProfileUpdatePayload,
  WorkspaceInvite,
  ChangeLogEntry,
  Project,
  Requirement,
  Task,
  Artifact,
  ArtifactContent,
  GenerationJob,
  ActivityLog,
  DiagramWorkspace,
  DiagramChatResponse,
  DiagramNode,
  DiagramEdge,
  UxFlowArtifact,
  AiRun,
  VersionHistoryEntry,
  VersionDiffResult,
  TraceabilityLink,
  TraceabilityMatrixData,
  NegotiationThread,
  NegotiationComment,
  ScenarioDiff,
  GuidedWorkspaceConfig,
  SandboxRunResult,
} from '@/types';

const normalizeId = <T extends Record<string, any>>(item: T): T => {
  if (!item) return item;
  if (item.id || !item._id) return item;
  return { ...item, id: item._id };
};

const normalizeNegotiationComment = (comment: any): NegotiationComment =>
  normalizeId(comment) as NegotiationComment;

const normalizeNegotiationThread = (thread: any): NegotiationThread =>
  normalizeId(thread) as NegotiationThread;

const normalizeVersionEntry = (entry: any): VersionHistoryEntry =>
  normalizeId(entry) as VersionHistoryEntry;

const normalizeTraceabilityLink = (link: any): TraceabilityLink =>
  normalizeId(link) as TraceabilityLink;

const API_URL = import.meta.env.VITE_API_URL || '';

type ArtifactUpdatePayload = {
  title?: string;
  content_json?: Record<string, any>;
  metadata?: Record<string, any>;
  is_approved?: boolean;
};

type PhaseGenerateResponse = {
  phase_status: Record<string, string>;
  content: {
    artifact_id?: string;
    content?: ArtifactContent;
    raw_markdown?: string;
    formatted_markdown?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  };
  raw_markdown?: string;
  formatted_markdown?: string;
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout for cold starts on Render free tier
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(
                `${API_URL}/api/auth/token/refresh`,
                { refresh_token: refreshToken }
              );
              const { access_token, refresh_token: newRefreshToken } = response.data;
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              if (access_token) {
                localStorage.setItem('access_token', access_token);
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }
              if (newRefreshToken) {
                localStorage.setItem('refresh_token', newRefreshToken);
              }
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request helpers (used by components that aren't covered by typed methods)
  async post(path: string, data?: any): Promise<any> {
    return this.client.post(path, data);
  }

  async get(path: string, params?: any): Promise<any> {
    return this.client.get(path, { params });
  }

  // Health check to warm up server
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async register(data: RegisterRequest): Promise<any> {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.client.post('/auth/logout', { refresh_token: refreshToken });
  }

  async getMe(): Promise<User> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }
  
  async getProfile(): Promise<User> {
    const response = await this.client.get('/users/me/profile');
    return response.data;
  }

  async updateProfile(payload: UserProfileUpdatePayload): Promise<User> {
    const response = await this.client.patch('/users/me/profile', payload);
    return response.data;
  }

  async getWorkspaceInvites(): Promise<WorkspaceInvite[]> {
    const response = await this.client.get('/users/invites/');
    return response.data;
  }

  async createWorkspaceInvite(payload: { email: string; role: string; message?: string }): Promise<WorkspaceInvite> {
    const response = await this.client.post('/users/invites/', payload);
    return response.data;
  }

  async deleteWorkspaceInvite(inviteId: string): Promise<void> {
    await this.client.delete(`/users/invites/${inviteId}`);
  }

  async getChangeLog(projectId: string): Promise<ChangeLogEntry[]> {
    const response = await this.client.get(`/projects/${projectId}/changelog/`);
    return response.data;
  }

  async createChangeLog(
    projectId: string,
    payload: { description: string; files: string[]; task_ids: string[]; requirement_ids: string[]; entry_type?: string; generate_diagram?: boolean }
  ): Promise<ChangeLogEntry> {
    const response = await this.client.post(`/projects/${projectId}/changelog/`, payload);
    return response.data;
  }

  async uploadChangeLog(
    projectId: string,
    data: { file: File; description?: string; task_ids?: string[]; requirement_ids?: string[]; generate_diagram?: boolean }
  ): Promise<ChangeLogEntry> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.description) formData.append('description', data.description);
    formData.append('task_ids', (data.task_ids || []).join(','));
    formData.append('requirement_ids', (data.requirement_ids || []).join(','));
    if (data.generate_diagram) formData.append('generate_diagram', 'true');
    const response = await this.client.post(`/projects/${projectId}/changelog/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Projects
  async getProjects(filters?: Record<string, any>): Promise<Project[]> {
    const response = await this.client.get('/projects/', { params: filters });
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get(`/projects/${id}/`);
    return response.data;
  }

  async getScenarioBranches(projectId: string): Promise<Project[]> {
    const response = await this.client.get(`/projects/${projectId}/branches/`);
    return response.data;
  }

  async createScenarioBranch(
    projectId: string,
    data: {
      label: string;
      description?: string;
      overrides?: Record<string, any>;
      include_tasks?: boolean;
      include_requirements?: boolean;
      include_artifacts?: boolean;
    }
  ): Promise<Project> {
    const response = await this.client.post(`/projects/${projectId}/branches/`, data);
    return response.data;
  }

  async getScenarioBranchDiff(projectId: string, branchId: string): Promise<ScenarioDiff> {
    const response = await this.client.get(`/projects/${projectId}/branches/${branchId}/diff/`);
    return response.data;
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await this.client.post('/projects/', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.client.put(`/projects/${id}/`, data);
    return response.data;
  }

  async resolveWorkspaceTemplate(config: {
    industry: string;
    team_size: string;
    compliance: string[];
    ai_provider: string;
    delivery_model: string;
    collaboration_focus: string;
  }): Promise<GuidedWorkspaceConfig> {
    const response = await this.client.post('/projects/templates/resolve/', config);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  async generateProject(
    id: string,
    config: Record<string, any>
  ): Promise<{ job_id: string; status: string; result_summary: Record<string, any> }> {
    const response = await this.client.post(`/projects/${id}/generate/`, config);
    return response.data;
  }

  // Requirements
  async getRequirements(projectId: string, filters?: Record<string, any>): Promise<Requirement[]> {
    const response = await this.client.get(`/projects/${projectId}/requirements/`, {
      params: filters,
    });
    return response.data;
  }

  async createRequirement(projectId: string, data: Partial<Requirement>): Promise<Requirement> {
    const response = await this.client.post(`/projects/${projectId}/requirements/`, data);
    return response.data;
  }

  async updateRequirement(id: string, data: Partial<Requirement>): Promise<Requirement> {
    const response = await this.client.patch(`/requirements/${id}/`, data);
    return response.data;
  }

  async replaceRequirements(
    projectId: string,
    data: { requirements: Partial<Requirement>[] }
  ): Promise<Requirement[]> {
    const response = await this.client.put(`/projects/${projectId}/requirements/bulk/`, data);
    return response.data;
  }

  // Tasks
  async getTasks(projectId: string, filters?: Record<string, any>): Promise<Task[]> {
    const response = await this.client.get(`/projects/${projectId}/tasks/`, { params: filters });
    return response.data;
  }

  async createTask(projectId: string, data: Partial<Task>): Promise<Task> {
    const response = await this.client.post(`/projects/${projectId}/tasks/`, data);
    return response.data;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await this.client.patch(`/tasks/${id}/`, data);
    return response.data;
  }

  // Artifacts
  async getArtifacts(projectId: string, type?: string): Promise<Artifact[]> {
    const response = await this.client.get(`/projects/${projectId}/artifacts/`, {
      params: type ? { type } : {},
    });
    return response.data;
  }

  async updateArtifact(
    projectId: string,
    artifactId: string,
    data: ArtifactUpdatePayload
  ): Promise<Artifact> {
    const response = await this.client.patch(`/projects/${projectId}/artifacts/${artifactId}/`, data);
    return response.data;
  }

  async getAiRuns(projectId: string, limit = 25): Promise<AiRun[]> {
    const response = await this.client.get(`/projects/${projectId}/ai-runs/`, {
      params: { limit },
    });
    return response.data;
  }

  async chatAssistant(
    projectId: string,
    payload: { prompt: string; phase_id?: string }
  ): Promise<{ reply: string }> {
    const response = await this.client.post(`/projects/${projectId}/assistant/chat/`, payload);
    return response.data;
  }

  // Generation Jobs
  async getGenerationJob(id: string): Promise<GenerationJob> {
    const response = await this.client.get(`/generation-jobs/${id}/`);
    return response.data;
  }

  // Activity
  async getActivity(projectId: string, limit = 50): Promise<ActivityLog[]> {
    const response = await this.client.get(`/projects/${projectId}/activity/`, {
      params: { limit },
    });
    return response.data;
  }

  // Diagram workspaces
  async getDiagramWorkspace(projectId: string, stage: string): Promise<DiagramWorkspace> {
    const response = await this.client.get(`/projects/${projectId}/sdlc-diagrams/${stage}/`);
    return response.data;
  }

  async saveDiagramWorkspace(
    projectId: string,
    stage: string,
    payload: {
      nodes: DiagramNode[];
      edges: DiagramEdge[];
      title?: string;
      metadata?: Record<string, any>;
      frames?: any[];
    }
  ): Promise<DiagramWorkspace> {
    const response = await this.client.put(`/projects/${projectId}/sdlc-diagrams/${stage}/`, payload);
    return response.data;
  }

  async chatDiagramWorkspace(
    projectId: string,
    stage: string,
    message: string
  ): Promise<DiagramChatResponse> {
    const response = await this.client.post(`/projects/${projectId}/sdlc-diagrams/${stage}/chat/`, {
      message,
    });
    return response.data;
  }

  // UX Flow document
  async getUxFlow(projectId: string): Promise<UxFlowArtifact> {
    const response = await this.client.get(`/projects/${projectId}/ux-flow/`);
    return response.data;
  }

  async generateUxFlow(projectId: string): Promise<UxFlowArtifact> {
    const response = await this.client.post(`/projects/${projectId}/ux-flow/generate/`);
    return response.data;
  }

  async syncUxFlowToDiagram(projectId: string): Promise<void> {
    await this.client.post(`/projects/${projectId}/ux-flow/sync-diagram/`);
  }

  async syncDiagramCanvas(projectId: string, mode: string): Promise<void> {
    await this.client.post(`/projects/${projectId}/diagrams/sync/`, { mode });
  }

  async runSandbox(payload: {
    language: string;
    code: string;
    input_text?: string;
  }): Promise<SandboxRunResult> {
    const response = await this.client.post('/sandbox/run', payload);
    return response.data;
  }

  async exportRequirements(projectId: string): Promise<any> {
    const response = await this.client.get(`/projects/${projectId}/requirements/export/`);
    return response.data;
  }

  async exportSrs(projectId: string): Promise<any> {
    const response = await this.client.get(`/projects/${projectId}/srs/export/`);
    return response.data;
  }

  // Phase workflow
  async getPhaseStatus(projectId: string): Promise<{ phases: Record<string, string>; order: string[] }> {
    const response = await this.client.get(`/projects/${projectId}/phases/`);
    return response.data;
  }

  async generatePhase(
    projectId: string,
    phase: string,
    prompt: string
  ): Promise<PhaseGenerateResponse> {
    const response = await this.client.post(`/projects/${projectId}/phases/${phase}/generate/`, { prompt });
    return response.data;
  }

  async unlockPhases(projectId: string): Promise<Record<string, string>> {
    const response = await this.client.post(`/projects/${projectId}/phases/unlock-all/`);
    return response.data.phases;
  }

  async getRoadmap(projectId: string): Promise<{ milestones: any[]; summary?: any[] }> {
    const response = await this.client.get(`/projects/${projectId}/roadmap/`);
    return response.data;
  }

  async saveRoadmap(projectId: string, data: { milestones: any[]; summary?: any[] }): Promise<any> {
    const response = await this.client.put(`/projects/${projectId}/roadmap/`, data);
    return response.data;
  }

  async addTeamMember(
    projectId: string,
    payload: { email: string; project_role?: string; notes?: string }
  ): Promise<Project> {
    const response = await this.client.post(`/projects/${projectId}/team/`, payload);
    return response.data;
  }

  async removeTeamMember(projectId: string, memberId: string): Promise<Project> {
    const response = await this.client.delete(`/projects/${projectId}/team/${memberId}`);
    return response.data;
  }

  async getFeasibilityStudies(projectId: string): Promise<{ studies: any[] }> {
    const response = await this.client.get(`/projects/${projectId}/feasibility-studies/`);
    return response.data;
  }

  async saveFeasibilityStudies(projectId: string, data: { studies: any[] }): Promise<any> {
    const response = await this.client.put(`/projects/${projectId}/feasibility-studies/`, data);
    return response.data;
  }

  async getFeasibilitySections(projectId: string): Promise<{ sections: any[] }> {
    const response = await this.client.get(`/projects/${projectId}/feasibility-sections/`);
    return response.data;
  }

  async saveFeasibilitySections(projectId: string, data: { sections: any[] }): Promise<any> {
    const response = await this.client.put(`/projects/${projectId}/feasibility-sections/`, data);
    return response.data;
  }

  async getDevelopment(projectId: string): Promise<{ stack: any[]; notes?: Record<string, any> }> {
    const response = await this.client.get(`/projects/${projectId}/development/`);
    return response.data;
  }

  async saveDevelopment(
    projectId: string,
    data: { stack: any[]; notes?: Record<string, any> }
  ): Promise<any> {
    const response = await this.client.put(`/projects/${projectId}/development/`, data);
    return response.data;
  }

  // UML PlantUML diagrams (generated use case / class / sequence)
  async getUmlDiagram(projectId: string, type: string): Promise<Artifact> {
    const response = await this.client.get(`/projects/${projectId}/uml/${type}/`);
    return response.data;
  }

  async saveUmlDiagram(projectId: string, type: string, plantuml: string): Promise<Artifact> {
    const response = await this.client.put(`/projects/${projectId}/uml/${type}/`, { plantuml });
    return response.data;
  }

  async chatUmlDiagram(projectId: string, type: string, message: string): Promise<Artifact> {
    const response = await this.client.post(`/projects/${projectId}/uml/${type}/chat/`, { message });
    return response.data;
  }

  // Billing
  async getBillingPlans(): Promise<any[]> {
    const response = await this.client.get('/billing/plans');
    return response.data;
  }

  async subscribeToPlan(planId: string, paymentMethodId?: string): Promise<any> {
    const response = await this.client.post('/billing/subscribe', { plan_id: planId, payment_method_id: paymentMethodId });
    return response.data;
  }

  // Version History
  async getVersionHistory(projectId: string, entityType: string, entityId: string, limit = 20): Promise<VersionHistoryEntry[]> {
    const response = await this.client.post(`/projects/${projectId}/version/history`, {
      entity_type: entityType,
      entity_id: entityId,
      limit,
    });
    return (response.data.versions || []).map(normalizeVersionEntry);
  }

  async compareVersions(
    projectId: string,
    entityType: string,
    entityId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionDiffResult> {
    const response = await this.client.post(`/projects/${projectId}/version/compare`, {
      entity_type: entityType,
      entity_id: entityId,
      from_version: fromVersion,
      to_version: toVersion,
    });
    return response.data;
  }

  async restoreVersion(projectId: string, entityType: string, entityId: string, versionNumber: number): Promise<any> {
    const response = await this.client.post(`/projects/${projectId}/version/restore`, null, {
      params: {
        entity_type: entityType,
        entity_id: entityId,
        version_number: versionNumber,
      },
    });
    return response.data;
  }

  // Traceability
  async getTraceabilityMatrix(projectId: string): Promise<TraceabilityMatrixData> {
    const response = await this.client.get(`/projects/${projectId}/traceability/matrix`);
    return {
      ...response.data,
      links: (response.data.links || []).map(normalizeTraceabilityLink),
    };
  }

  async createTraceabilityLink(
    projectId: string,
    payload: {
      source_type: string;
      source_id: string;
      source_name: string;
      target_type: string;
      target_id: string;
      target_name: string;
      link_type?: string;
      rationale?: string;
    }
  ): Promise<any> {
    const response = await this.client.post(`/projects/${projectId}/traceability/link`, payload);
    return normalizeTraceabilityLink(response.data);
  }

  // Negotiation
  async getNegotiationThreads(projectId: string): Promise<NegotiationThread[]> {
    const response = await this.client.get(`/projects/${projectId}/negotiation/threads`);
    return (response.data || []).map(normalizeNegotiationThread);
  }

  async getNegotiationThread(projectId: string, threadId: string): Promise<{ thread: NegotiationThread; comments: NegotiationComment[] }> {
    const response = await this.client.get(`/projects/${projectId}/negotiation/threads/${threadId}`);
    return {
      thread: normalizeNegotiationThread(response.data.thread),
      comments: (response.data.comments || []).map(normalizeNegotiationComment),
    };
  }

  async createNegotiationThread(
    projectId: string,
    payload: {
      title: string;
      description: string;
      status?: string;
      priority?: string;
      requirement_id?: string;
      stakeholder_ids?: string[];
    }
  ): Promise<NegotiationThread> {
    const response = await this.client.post(`/projects/${projectId}/negotiation/threads`, {
      project_id: projectId,
      stakeholder_ids: [],
      ...payload,
    });
    return normalizeNegotiationThread(response.data);
  }

  async addNegotiationComment(
    projectId: string,
    threadId: string,
    payload: { content: string; parent_id?: string; requirement_id?: string }
  ): Promise<NegotiationComment> {
    const response = await this.client.post(`/projects/${projectId}/negotiation/threads/${threadId}/comments`, payload);
    return normalizeNegotiationComment(response.data);
  }

  async resolveNegotiationThread(projectId: string, threadId: string, resolution: string): Promise<NegotiationThread> {
    const response = await this.client.post(`/projects/${projectId}/negotiation/threads/${threadId}/resolve`, { resolution });
    return normalizeNegotiationThread(response.data);
  }

  // Personas
  async generatePersonas(projectId: string, count: number = 3): Promise<any[]> {
    const response = await this.client.post(`/projects/${projectId}/personas/generate`, { count });
    return response.data;
  }

  async generateUserStories(projectId: string, personaIds?: string[]): Promise<any[]> {
    const response = await this.client.post(`/projects/${projectId}/user-stories/generate`, { persona_ids: personaIds || [] });
    return response.data;
  }

  // SRS Audit
  async runSrsAudit(projectId: string): Promise<any> {
    const response = await this.client.post(`/projects/${projectId}/srs-audit`);
    return response.data;
  }

  // Export
  async exportProjectPdf(projectId: string): Promise<Blob> {
    const response = await this.client.get(`/projects/${projectId}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportProjectDocx(projectId: string): Promise<Blob> {
    const response = await this.client.get(`/projects/${projectId}/export/docx`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportProjectMarkdown(projectId: string): Promise<Blob> {
    const response = await this.client.get(`/projects/${projectId}/export/markdown`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Testing
  async generateTestData(projectId: string, options?: any): Promise<any> {
    const response = await this.client.post(`/projects/${projectId}/testing/generate-test-data`, options || {});
    return response.data;
  }

  async runCoverageAudit(projectId: string, options?: any): Promise<any> {
    const response = await this.client.post(`/projects/${projectId}/testing/coverage-audit`, options || {});
    return response.data;
  }

  async getTestingResults(projectId: string): Promise<any> {
    const response = await this.client.get(`/projects/${projectId}/testing/results`);
    return response.data;
  }
}

export const api = new ApiClient();
