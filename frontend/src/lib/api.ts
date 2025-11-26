import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  RegisterRequest,
  Project,
  Requirement,
  Task,
  Artifact,
  GenerationJob,
  ActivityLog,
  DiagramWorkspace,
  DiagramChatResponse,
  DiagramNode,
  DiagramEdge,
  UxFlowArtifact,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
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
                `${API_URL}/api/auth/token/refresh/`,
                { refresh: refreshToken }
              );
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
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

  // Auth
  async register(data: RegisterRequest): Promise<any> {
    const response = await this.client.post('/auth/register/', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.client.post('/auth/login/', { email, password });
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get('/auth/me/');
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

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await this.client.post('/projects/', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.client.patch(`/projects/${id}/`, data);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}/`);
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

  async updateRequirement(id: string, data: Partial<Requirement>): Promise<Requirement> {
    const response = await this.client.patch(`/requirements/${id}/`, data);
    return response.data;
  }

  // Tasks
  async getTasks(projectId: string, filters?: Record<string, any>): Promise<Task[]> {
    const response = await this.client.get(`/projects/${projectId}/tasks/`, { params: filters });
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
    payload: { nodes: DiagramNode[]; edges: DiagramEdge[]; title?: string }
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
  ): Promise<{ phase_status: Record<string, string>; content: { content: { markdown: string } } }> {
    const response = await this.client.post(`/projects/${projectId}/phases/${phase}/generate/`, { prompt });
    return response.data;
  }

  async unlockPhases(projectId: string): Promise<Record<string, string>> {
    const response = await this.client.post(`/projects/${projectId}/phases/unlock-all/`);
    return response.data.phases;
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
}

export const api = new ApiClient();
