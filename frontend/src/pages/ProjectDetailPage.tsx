import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Artifact, Project, Requirement, Task } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '@/lib/utils';

type DraftSectionKey = 'overview';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tourRun, setTourRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tourSteps: Step[] = [
    {
      target: '.phase-board',
      content: 'Work through each phase sequentially. Unlock the next phase as you complete the current one.',
    },
    {
      target: '.side-summary',
      content: 'This panel keeps project summary, metrics, and AI workflow actions within reach.',
    },
  ];

  const handleTourCallback = (data: any) => {
    const { status } = data;
    if ([JoyrideStatus.FINISHED, JoyrideStatus.SKIPPED].includes(status)) {
      setTourRun(false);
      localStorage.setItem('acorn_phase_tour', 'seen');
    }
  };

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  useEffect(() => {
    const seenTour = localStorage.getItem('acorn_phase_tour');
    if (!seenTour) {
      setTourRun(true);
    }
  }, []);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const projectData = await api.getProject(id);
      setProject(projectData);
      if (projectData.phase_status) {
        setPhaseStatus(projectData.phase_status);
      }

      const [reqData, taskData, artifactData] = await Promise.all([
        api.getRequirements(id),
        api.getTasks(id),
        api.getArtifacts(id),
      ]);
      setRequirements(reqData);
      setTasks(taskData);
      setArtifacts(artifactData);

      try {
        const statusResponse = await api.getPhaseStatus(id);
        setPhaseStatus(statusResponse.phases);
      } catch (statusErr) {
        console.error('Failed to refresh phase status', statusErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'ACTIVE':
      case 'PLANNING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const projectDraftBase = project?.project_id || project?.id || '';

  const goToDraft = (sectionKey: DraftSectionKey) => {
    if (!projectDraftBase) return;
    navigate(`/projects/${projectDraftBase}/draft/${sectionKey}`);
  };

  const handleUnlockPhases = async () => {
    if (!id) return;
    try {
      const status = await api.unlockPhases(id);
      setPhaseStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to unlock phases');
    }
  };

  const phaseOutputs = artifacts.reduce<Record<string, string>>((acc, artifact) => {
    if (artifact.type?.startsWith('PHASE_')) {
      const phase = artifact.type.replace('PHASE_', '').toLowerCase();
      const markdown = (artifact.content_json as any)?.markdown;
      if (markdown) {
        acc[phase] = markdown;
      }
    }
    return acc;
  }, {});

  const completedTasks = useMemo(
    () => tasks.filter((task) => (task.status || '').toLowerCase() === 'completed'),
    [tasks]
  );

  const progressPct = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const requirementCoverage = useMemo(() => {
    if (!requirements.length) return 0;
    const covered = requirements.filter((req) =>
      tasks.some((task) => task.requirement_id === req.requirement_id)
    ).length;
    return Math.round((covered / requirements.length) * 100);
  }, [requirements, tasks]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous
        showSkipButton
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#F97316',
          },
        }}
      />
      <div className="space-y-6">
        <div>
          <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
              </div>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="lg:flex lg:gap-6">
          <aside className="lg:w-80 space-y-4 mb-6 lg:mb-0 side-summary">
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <dt>Status</dt>
                    <dd>
                      <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Type</dt>
                    <dd className="font-medium">{project.template_type.replace('_', ' ')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Owner</dt>
                    <dd>{project.owner_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Created</dt>
                    <dd>{formatDate(project.created_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Updated</dt>
                    <dd>{formatDate(project.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Requirements</span>
                  </div>
                  <span className="font-semibold">{requirements.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span>Tasks</span>
                  </div>
                  <span className="font-semibold">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-purple-600" />
                    <span>Artifacts</span>
                  </div>
                  <span className="font-semibold">{artifacts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-600" />
                    <span>Total Hours</span>
                  </div>
                  <span className="font-semibold">
                    {tasks.reduce((sum, t) => sum + t.estimate_hours, 0).toFixed(0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Workflows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>Use the phase cards to tell the AI what you need next.</p>
                <p>Each phase builds on the previous one. Unlock all phases if you want to jump ahead.</p>
                <Button variant="ghost" size="sm" onClick={handleUnlockPhases} className="w-full">
                  Unlock all phases
                </Button>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1 space-y-6">
            {/* Phase Navigation Grid - Professional Design */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 phase-board">
              {phaseConfigs.map((phase) => {
                const status = phaseStatus[phase.id] || 'locked';
                const output = phaseOutputs[phase.id];
                const isCompleted = status === 'completed';
                const isActive = status === 'in_progress';
                
                return (
                  <Card 
                    key={phase.id} 
                    className={`phase-card cursor-pointer transition-all duration-200 hover:shadow-md group ${
                      isCompleted 
                        ? 'bg-white border-l-4 border-l-green-500' 
                        : isActive 
                        ? 'bg-white border-l-4 border-l-amber-500 shadow-md' 
                        : 'bg-white border border-gray-100 hover:border-amber-200'
                    }`}
                    onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`)}
                  >
                    <CardContent className="p-5">
                      {/* Step Number + Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isActive 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-gray-100 text-gray-500 group-hover:bg-amber-50 group-hover:text-amber-600'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            phase.stepNumber
                          )}
                        </div>
                        {isActive && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            In Progress
                          </span>
                        )}
                      </div>
                      
                      {/* Title + Description */}
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
                        {phase.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {phase.description}
                      </p>
                      
                      {/* Generated indicator */}
                      {output && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-green-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Content ready
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle>Project Brief</CardTitle>
                <Button variant="outline" size="sm" onClick={() => goToDraft('overview')}>
                  Open Acorn Draft
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.brief_text || 'No brief provided'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.template_type.replace('_', ' ')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.owner_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(project.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(project.updated_at)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};
