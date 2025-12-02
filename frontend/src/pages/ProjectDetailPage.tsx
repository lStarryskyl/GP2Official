import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Artifact, Project, Requirement, Task } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import { formatDate } from '@/lib/utils';
import { workspacePresets } from '@/constants/workspacePresets';

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
  const [updatingPreset, setUpdatingPreset] = useState(false);

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

  const activePreset = project?.ui_preferences?.preset || 'default';
  const presetConfig =
    workspacePresets.find((preset) => preset.id === activePreset) || workspacePresets[0];
  const showSummaryPanel = presetConfig.layout.showSummary !== false;
  const condensePhases = !!presetConfig.layout.condensePhases;
  const phaseRowPadding = condensePhases ? 'py-3 px-2' : 'py-4 px-2';

  const handleTourCallback = (data: any) => {
    const { status } = data;
    if ([JoyrideStatus.FINISHED, JoyrideStatus.SKIPPED].includes(status)) {
      setTourRun(false);
      localStorage.setItem('acorn_phase_tour', 'seen');
    }
  };

  const handlePresetChange = async (presetId: string) => {
    if (!project || updatingPreset || presetId === activePreset) return;
    const projectIdentifier = project.project_id || project.id;
    if (!projectIdentifier) return;
    const previousPreset = activePreset;
    setUpdatingPreset(true);
    setProject((prev) =>
      prev
        ? {
            ...prev,
            ui_preferences: { ...(prev.ui_preferences || {}), preset: presetId },
          }
        : prev
    );
    try {
      const updated = await api.updateProject(projectIdentifier, {
        ui_preferences: { ...(project.ui_preferences || {}), preset: presetId },
      } as any);
      setProject(updated);
    } catch (err) {
      console.error('Failed to update preset', err);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              ui_preferences: { ...(prev.ui_preferences || {}), preset: previousPreset },
            }
          : prev
      );
    } finally {
      setUpdatingPreset(false);
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

  const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);

  const handleExportPhase = (phaseId: string) => {
    const markdown = phaseOutputs[phaseId];
    if (!markdown || !project) return;
    const phaseTitle = phaseConfigs.find((p) => p.id === phaseId)?.title || phaseId;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-${phaseTitle}.md`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAllPhases = () => {
    if (!project) return;
    const sections = phaseConfigs
      .map((phase) => {
        const markdown = phaseOutputs[phase.id];
        if (!markdown) return null;
        return `# ${phase.title}\n\n${markdown}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
    if (!sections) return;
    const blob = new Blob([sections], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-phases.md`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusPillStyles: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700',
    ready: 'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-indigo-50 text-indigo-700',
    locked: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Content ready',
    ready: 'Ready',
    in_progress: 'In progress',
    locked: 'Locked',
  };

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
            primaryColor: '#4F46E5',
          },
        }}
      />
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5 sticky top-4 z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/projects')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/projects');
                  }
                }}
                className="inline-flex items-center text-sm font-medium text-[#4B5563] hover:text-[#111827] cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => goToDraft('overview')}>
                  Open Draft
                </Button>
                <Button
                  className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phaseConfigs[0]?.id}`)}
                >
                  Continue Planning
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-[#111827]">{project.name}</h1>
                {project.description && <p className="text-sm text-[#4B5563] max-w-2xl">{project.description}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E0E7FF] text-[#312E81] text-xs font-medium">
                  {project.status}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F3F4F6] text-[#374151] text-xs font-medium">
                  {project.template_type.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDF2F8] text-[#9D174D] text-xs font-medium">
                  {project.owner_name || 'Unassigned'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9CA3AF] mb-2">Workspace</p>
              <div className="flex flex-wrap items-center gap-2 bg-[#F3F4F6] rounded-full p-1">
                {workspacePresets.map((preset) => {
                  const isActive = preset.id === activePreset;
                  return (
                    <div
                      key={preset.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handlePresetChange(preset.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePresetChange(preset.id);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm transition ${
                        isActive ? 'bg-white shadow text-[#111827]' : 'text-[#6B7280]'
                      } ${updatingPreset ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {preset.label}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-[#6B7280] mt-2">{presetConfig.description}</p>
            </div>
          </div>

          <div className={`grid gap-6 ${showSummaryPanel ? 'lg:grid-cols-[320px_minmax(0,1fr)]' : ''}`}>
            {showSummaryPanel && (
            <aside className="space-y-6 side-summary">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Project Summary</h2>
                  <dl className="mt-4 space-y-3 text-sm text-[#4B5563]">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium text-[#111827]">{project.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-[#111827]">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-[#111827]">{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium text-[#111827]">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated</span>
                      <span className="font-medium text-[#111827]">{formatDate(project.updated_at)}</span>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#374151] mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Requirements', value: requirements.length },
                      { label: 'Tasks', value: tasks.length },
                      { label: 'Artifacts', value: artifacts.length },
                      { label: 'Total Hours', value: totalHours.toFixed(0) },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-[#E5E7EB] px-3 py-4 bg-[#F9FAFB] text-center">
                        <div className="text-2xl font-semibold text-[#111827]">{metric.value}</div>
                        <div className="text-xs text-[#6B7280]">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-[#4B5563]">
                  <p className="mb-2">Need to unlock future workstream?</p>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={handleUnlockPhases}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUnlockPhases();
                      }
                    }}
                    className="text-[#4F46E5] font-medium hover:text-[#4338CA] cursor-pointer"
                  >
                    Unlock all phases
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#111827]">Project Brief</h2>
                  <Button variant="outline" size="sm" onClick={() => goToDraft('overview')}>
                    Open Draft
                  </Button>
                </div>
                <p className="text-sm text-[#4B5563] whitespace-pre-wrap">
                  {project.brief_text || 'No brief provided.'}
                </p>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-semibold text-[#111827]">Governance &amp; Updates</h2>
                <p className="text-sm text-[#6B7280]">Manage membership, branching, and development logs.</p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate(`/projects/${project.project_id || project.id}/governance`)}>
                    Governance hub
                  </Button>
                  <Button onClick={() => navigate(`/projects/${project.project_id || project.id}/updates`)}>
                    Development updates
                  </Button>
                </div>
              </div>
            </aside>
            )}

            <div className="space-y-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm phase-board">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#111827]">Phases</h2>
                    <p className="text-sm text-[#6B7280]">Work through each phase sequentially and export deliverables whenever ready.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportAllPhases} disabled={!Object.keys(phaseOutputs).length}>
                    Export All
                  </Button>
                </div>
                <div className="divide-y divide-[#F3F4F6]">
                  {phaseConfigs.map((phase) => {
                    const status = (phaseStatus[phase.id] || 'locked').toLowerCase();
                    const pillClass =
                      status === 'completed'
                        ? 'bg-[#E9FCEB] text-[#166534]'
                        : status === 'active' || status === 'planning'
                        ? 'bg-[#E0EAFF] text-[#1D4ED8]'
                        : 'bg-[#E5E7EB] text-[#6B7280]';
                    const pillLabel = statusLabels[status] || status;
                    const hasOutput = Boolean(phaseOutputs[phase.id]);
                    return (
                      <div
                        key={phase.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`);
                          }
                        }}
                        className={`w-full text-left ${phaseRowPadding} hover:bg-[#F9FAFB] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] rounded-xl`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center text-sm font-semibold">
                            {phase.stepNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className={`font-semibold text-[#111827] ${condensePhases ? 'text-sm' : 'text-base'}`}>{phase.title}</p>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${pillClass}`}>
                                  {pillLabel}
                                </span>
                                {hasOutput && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportPhase(phase.id);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleExportPhase(phase.id);
                                      }
                                    }}
                                    className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA]"
                                  >
                                    Export
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`mt-1 text-[#6B7280] line-clamp-2 ${condensePhases ? 'text-xs' : 'text-sm'}`}>{phase.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-[#111827] mb-4">Project Details</h2>
                  <dl className="space-y-3 text-sm text-[#4B5563]">
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-[#111827]">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-[#111827]">{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium text-[#111827]">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span className="font-medium text-[#111827]">{formatDate(project.updated_at)}</span>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
