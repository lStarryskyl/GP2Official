import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { ExportButtons } from '@/components/ExportButtons';
import { api } from '@/lib/api';
import type { Artifact, Project, Requirement, Task } from '@/types';
import { phaseConfigs, phaseHexColors } from '@/constants/phases';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import { formatDate } from '@/lib/utils';
import { workspacePresets } from '@/constants/workspacePresets';
import { AIAgentsPanel } from '@/components/AIAgentsPanel';

type DraftSectionKey = 'overview';

/* =========================================================
   PHASE KANBAN BOARD
   Sequential phase cards — click to navigate into any phase
   ========================================================= */
const PhaseKanban: React.FC<{
  phases: typeof phaseConfigs;
  phaseStatus: Record<string, string>;
  phaseOutputs: Record<string, string>;
  onPhaseClick: (phaseId: string) => void;
}> = ({ phases, phaseStatus, phaseOutputs, onPhaseClick }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const getStatusInfo = (phaseId: string) => {
    const s = (phaseStatus[phaseId] || 'locked').toLowerCase();
    if (s === 'completed')   return { label: 'Completed',   color: '#1A6FD4', bg: 'rgba(26,111,212,0.15)', border: 'rgba(26,111,212,0.4)' };
    if (s === 'in_progress') return { label: 'In Progress', color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)' };
    if (s === 'active')      return { label: 'Active',      color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.4)' };
    if (s === 'ready')       return { label: 'Ready',       color: '#3d8fe0', bg: 'rgba(61,143,224,0.12)', border: 'rgba(61,143,224,0.3)' };
    return { label: 'Locked', color: '#4a6070', bg: 'rgba(26,46,69,0.4)', border: 'rgba(30,53,82,0.5)' };
  };

  // Split into 2 rows of 5
  const row1 = phases.slice(0, 5);
  const row2 = phases.slice(5, 10);

  const PhaseCard = ({ phase, idx }: { phase: typeof phases[0]; idx: number }) => {
    const info    = getStatusInfo(phase.id);
    const isHov   = hovered === phase.id;
    const hasOut  = Boolean(phaseOutputs[phase.id]);
    const isDone  = (phaseStatus[phase.id] || '').toLowerCase() === 'completed';

    return (
      <div
        onClick={() => onPhaseClick(phase.id)}
        onMouseEnter={() => setHovered(phase.id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          background: isHov ? info.bg : 'var(--brand-800)',
          border: `1px solid ${isHov ? info.border : 'rgba(30,53,82,0.6)'}`,
          borderRadius: '14px',
          padding: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isHov ? 'translateY(-2px)' : 'none',
          boxShadow: isHov ? `0 8px 24px ${info.color}20` : '0 2px 8px rgba(0,0,0,0.2)',
          position: 'relative',
          flex: '1 1 0',
          minWidth: 0,
        }}
      >
        {/* Step badge */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          width: '22px', height: '22px', borderRadius: '50%',
          background: isDone ? '#1A6FD4' : 'var(--brand-700)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isDone
            ? <CheckCircle2 size={12} color="#fff" />
            : <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-faint)' }}>{phase.stepNumber}</span>
          }
        </div>

        {/* Output dot */}
        {hasOut && !isDone && (
          <div style={{
            position: 'absolute', top: '10px', right: '38px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#F97316',
          }} />
        )}

        <p style={{ fontSize: '11px', color: info.color, fontWeight: 700, marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Phase {phase.stepNumber}
        </p>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
          {phase.title}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {phase.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            background: info.bg, color: info.color, border: `1px solid ${info.border}`,
          }}>
            {info.label}
          </span>
          <ChevronRight size={14} color="var(--text-faint)" />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Row 1: phases 1-5 */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {row1.map((phase, i) => <PhaseCard key={phase.id} phase={phase} idx={i} />)}
      </div>
      {/* Connector arrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(26,111,212,0.3))' }} />
        <ChevronRight size={14} color="rgba(249,115,22,0.6)" style={{ transform: 'rotate(90deg)' }} />
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(249,115,22,0.3))' }} />
      </div>
      {/* Row 2: phases 6-10 (reversed to show flow) */}
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'row-reverse' }}>
        {row2.map((phase, i) => <PhaseCard key={phase.id} phase={phase} idx={i + 5} />)}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN PROJECT DETAIL PAGE
   ========================================================= */
export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject]         = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [artifacts, setArtifacts]     = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tourRun, setTourRun]         = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [updatingPreset, setUpdatingPreset] = useState(false);
  const [treeView, setTreeView]       = useState(true); // Toggle between tree and list view

  const tourSteps: Step[] = [
    {
      target: '.phase-board',
      content: 'Your project phases grow as leaves on the tree. Click any leaf to work on that phase.',
    },
    {
      target: '.side-summary',
      content: 'This panel keeps project summary, metrics, and AI workflow actions within reach.',
    },
  ];

  const activePreset   = project?.ui_preferences?.preset || 'default';
  const presetConfig   = workspacePresets.find((preset) => preset.id === activePreset) || workspacePresets[0];
  const showSummaryPanel = presetConfig.layout.showSummary !== false;
  const condensePhases   = !!presetConfig.layout.condensePhases;
  const phaseRowPadding  = condensePhases ? 'py-3 px-2' : 'py-4 px-2';

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
      prev ? { ...prev, ui_preferences: { ...(prev.ui_preferences || {}), preset: presetId } } : prev
    );
    try {
      const updated = await api.updateProject(projectIdentifier, {
        ui_preferences: { ...(project.ui_preferences || {}), preset: presetId },
      } as any);
      setProject(updated);
    } catch (err) {
      console.error('Failed to update preset', err);
      setProject((prev) =>
        prev ? { ...prev, ui_preferences: { ...(prev.ui_preferences || {}), preset: previousPreset } } : prev
      );
    } finally {
      setUpdatingPreset(false);
    }
  };

  useEffect(() => {
    if (id) loadProjectData();
  }, [id]);

  useEffect(() => {
    const seenTour = localStorage.getItem('acorn_phase_tour');
    if (!seenTour) setTourRun(true);
  }, []);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const projectData = await api.getProject(id);
      setProject(projectData);
      if (projectData.phase_status) setPhaseStatus(projectData.phase_status);

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
      case 'COMPLETED': return 'success';
      case 'ACTIVE':
      case 'PLANNING':  return 'warning';
      default:          return 'default';
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
      const phase    = artifact.type.replace('PHASE_', '').toLowerCase();
      const markdown = (artifact.content_json as any)?.markdown;
      if (markdown) acc[phase] = markdown;
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
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
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
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `${project.name}-phases.md`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePhaseClick = (phaseId: string) => {
    if (!project) return;
    navigate(`/projects/${project.project_id || project.id}/phases/${phaseId}`);
  };

  const statusPillStyles: Record<string, string> = {
    completed:   'bg-blue-900/200/20 text-blue-400 border border-blue-500/30',
    ready:       'bg-[var(--blue-400)]/20 text-[var(--blue-400)] border border-[var(--blue-400)]/30',
    in_progress: 'bg-[var(--orange-400)]/20 text-[var(--orange-400)] border border-[var(--orange-400)]/30',
    locked:      'bg-[var(--brand-700)]/30 text-[var(--text-muted)] border border-[var(--brand-700)]',
  };

  const statusLabels: Record<string, string> = {
    completed:   'Content ready',
    ready:       'Ready',
    in_progress: 'In progress',
    locked:      'Locked',
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-900)]" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-[var(--blue-400)]/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[var(--text-muted)]">Loading project...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')} className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)]">Back to Projects</Button>
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
            primaryColor: 'var(--blue-400)',
          },
        }}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Project Header Card */}
        <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl shadow-lg overflow-hidden">
          {/* Header gradient bar - forest green */}
          <div className="h-1.5 bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)]" />

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--blue-400)] transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => goToDraft('overview')} className="text-xs sm:text-sm px-2 sm:px-4 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  <span className="hidden sm:inline">Open </span>Draft
                </Button>
                <Button
                  className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] hover:from-[var(--blue-300)] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold shadow-lg shadow-[var(--blue-400)]/20 text-xs sm:text-sm px-2 sm:px-4"
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phaseConfigs[0]?.id}`)}
                >
                  <span className="hidden sm:inline">Continue </span>Planning
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
                {project.description && (
                  <p className="text-[var(--text-muted)] max-w-2xl">{project.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {/* Health Score Badge */}
                {(() => {
                  const phaseKeys = ['planning','feasibility_study','requirements_gathering','validation','design','development','tasks','cost_benefit','risks','summary'];
                  const done = phaseKeys.filter(k => (phaseStatus[k] || '').toLowerCase() === 'completed').length;
                  const score = Math.round((done / phaseKeys.length) * 100);
                  const scoreColor = score >= 70 ? '#1A6FD4' : score >= 40 ? '#F97316' : '#4a6070';
                  const scoreBg = score >= 70 ? 'rgba(26,111,212,0.15)' : score >= 40 ? 'rgba(249,115,22,0.12)' : 'rgba(74,96,112,0.15)';
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: scoreBg, border: `1px solid ${scoreColor}44` }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: scoreColor, fontFamily: 'Syne, sans-serif' }}>{score}%</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: scoreColor, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>Health Score</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>{done}/10 phases</div>
                      </div>
                    </div>
                  );
                })()}
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--blue-400)]/20 text-[var(--blue-400)] border border-[var(--blue-400)]/30 text-xs font-semibold uppercase tracking-wide">
                  {project.status}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--brand-700)]/50 text-[var(--text-muted)] border border-[var(--brand-700)] text-xs font-medium">
                  {project.template_type.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--blue-300)]/10 text-[var(--blue-300)] border border-[var(--blue-300)]/30 text-xs font-medium">
                  {project.owner_name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Workspace Preset Switcher */}
            <div className="pt-4 border-t border-[var(--brand-700)]/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Workspace Mode</p>
              <div className="flex flex-wrap items-center gap-2">
                {workspacePresets.map((preset) => {
                  const isActive = preset.id === activePreset;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      disabled={updatingPreset}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[var(--blue-400)] text-[var(--brand-900)] shadow-lg shadow-[var(--blue-400)]/20'
                          : 'bg-[var(--brand-750)] text-[var(--text-muted)] hover:bg-[var(--brand-700)] hover:text-[var(--text-primary)] border border-[var(--brand-700)]'
                      } ${updatingPreset ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{presetConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-4 sm:gap-6 ${showSummaryPanel ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : ''}`}>
          {showSummaryPanel && (
            <aside className="space-y-6 side-summary">
              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Project Summary</h2>
                  <dl className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium text-[var(--blue-400)]">{project.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-[var(--text-primary)]">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-[var(--text-primary)]">{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatDate(project.updated_at)}</span>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Requirements', value: requirements.length, phase: 'requirements_gathering' },
                      { label: 'Tasks',         value: tasks.length,        phase: 'tasks' },
                      { label: 'Artifacts',     value: artifacts.length,    phase: 'summary' },
                      { label: 'Total Hours',   value: totalHours.toFixed(0), phase: 'tasks' },
                    ].map((metric) => (
                      <button
                        key={metric.label}
                        onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${metric.phase}`)}
                        className="rounded-xl border border-[var(--brand-700)] px-3 py-4 bg-[var(--brand-800)] text-center hover:border-[var(--blue-400)]/50 hover:bg-[var(--brand-750)] transition-all cursor-pointer group"
                      >
                        <div className="text-2xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors">{metric.value}</div>
                        <div className="text-xs text-[var(--text-muted)] group-hover:text-[var(--blue-400)]/80 transition-colors">{metric.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-[var(--text-muted)]">
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
                    className="text-[var(--blue-400)] font-medium hover:text-[var(--blue-300)] cursor-pointer"
                  >
                    Unlock all phases
                  </span>
                </div>
              </div>

              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-6 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Project Brief</h2>
                  <Button variant="outline" size="sm" onClick={() => goToDraft('overview')} className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                    Open Draft
                  </Button>
                </div>
                <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                  {project.brief_text || 'No brief provided.'}
                </p>
              </div>

              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-6 shadow-lg space-y-4">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Governance &amp; Updates</h2>
                <p className="text-sm text-[var(--text-muted)]">Manage membership, branching, and development logs.</p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate(`/projects/${project.project_id || project.id}/governance`)} className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                    Governance hub
                  </Button>
                  <Button onClick={() => navigate(`/projects/${project.project_id || project.id}/updates`)} className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)] font-semibold">
                    Development updates
                  </Button>
                </div>
              </div>
            </aside>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Phases Section — Kanban Board */}
            <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg phase-board">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Project Phases</h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                    Select a phase to continue — complete them in order for best results.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportAllPhases} disabled={!Object.keys(phaseOutputs).length} className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  Export All
                </Button>
              </div>

              <PhaseKanban
                phases={phaseConfigs}
                phaseStatus={phaseStatus}
                phaseOutputs={phaseOutputs}
                onPhaseClick={handlePhaseClick}
              />

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[var(--brand-700)]/30">
                {[
                  { color: '#1A6FD4', label: 'Completed' },
                  { color: '#F97316', label: 'In Progress' },
                  { color: '#3d8fe0', label: 'Ready' },
                  { color: '#4a6070', label: 'Locked' },
                  { color: '#F97316', label: '● output ready', dot: true },
                ].map(({ color, label, dot }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {dot
                      ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                      : <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: color, opacity: 0.7 }} />
                    }
                    <span className="text-xs text-[var(--text-muted)]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-6 shadow-lg">
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Project Details</h2>
                <dl className="space-y-3 text-sm text-[var(--text-muted)]">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-[var(--text-primary)]">{project.template_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <span className="font-medium text-[var(--text-primary)]">{project.owner_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(project.updated_at)}</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agents floating panel */}
      {project && (
        <AIAgentsPanel
          projectId={(project.project_id || project.id) ?? ''}
          projectName={project.name}
          description={project.description}
          requirements={requirements.map(r => ({
            id: r.requirement_id || '',
            title: r.title || '',
            description: r.description || '',
            type: r.type || '',
            priority: r.priority || '',
            status: r.status || '',
          }))}
        />
      )}
    </Layout>
  );
};
