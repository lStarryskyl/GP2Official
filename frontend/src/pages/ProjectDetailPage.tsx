import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { ScaffoldPanel } from '@/components/ScaffoldPanel';
import { ExportButtons } from '@/components/ExportButtons';
import { api } from '@/lib/api';
import type { Artifact, PhaseCompletionMeta, Project, Requirement, Task } from '@/types';
import type { ScaffoldResult } from '@/lib/api';
import { phaseConfigs, phaseHexColors } from '@/constants/phases';
import { AlertCircle, ArrowLeft, Loader2, CheckCircle2, Circle, ChevronRight, Terminal } from 'lucide-react';
import { PhaseActivityTimeline, type PhaseActivityEntry } from '@/components/PhaseActivityTimeline';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import { formatDate } from '@/lib/utils';
import { AIAgentsPanel } from '@/components/AIAgentsPanel';
import { ProjectProgressBar } from '@/components/ProjectProgressBar';
import { exportFullProjectPdf } from '@/lib/exportFullProjectPdf';

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
  const row1 = phases.slice(0, 6);
  const row2 = phases.slice(6);

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
   PROJECT ACTIVITY TIMELINE
   Consolidated, chronological list of every phase completion
   ========================================================= */
const ProjectActivityTimeline: React.FC<{
  phaseCompletionMeta: Record<string, PhaseCompletionMeta>;
  phaseStatus: Record<string, string>;
  onPhaseClick: (phaseId: string) => void;
}> = ({ phaseCompletionMeta, phaseStatus, onPhaseClick }) => {
  const entries = useMemo<PhaseActivityEntry[]>(() => {
    return phaseConfigs
      .map<PhaseActivityEntry | null>((phase) => {
        const meta: PhaseCompletionMeta = phaseCompletionMeta[phase.id] || {};
        const status = (phaseStatus[phase.id] || '').toLowerCase();
        if (status !== 'completed' && !meta.completed_at) return null;
        return {
          key: phase.id,
          phaseId: phase.id,
          phaseTitle: phase.title,
          stepNumber: phase.stepNumber,
          completedAt: meta.completed_at ?? null,
          confirmer: meta.completed_by_name || meta.completed_by || null,
          note: meta.notes ?? null,
        };
      })
      .filter((entry): entry is PhaseActivityEntry => entry !== null)
      .sort((a, b) => {
        const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return tb - ta;
      });
  }, [phaseCompletionMeta, phaseStatus]);

  return (
    <PhaseActivityTimeline
      entries={entries}
      showFilters
      onEntryClick={(entry) => onPhaseClick(entry.phaseId)}
    />
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
  const [phaseCompletionMeta, setPhaseCompletionMeta] = useState<Record<string, PhaseCompletionMeta>>({});
  const [tourRun, setTourRun]         = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [updatingPreset, setUpdatingPreset] = useState(false);
  const [treeView, setTreeView]       = useState(true); // Toggle between tree and list view

  // Scaffolding state
  const [scaffoldingTarget, setScaffoldingTarget] = useState<string | null>(null);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldResult, setScaffoldResult] = useState<ScaffoldResult | null>(null);

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

  const handleTourCallback = (data: any) => {
    const { status } = data;
    if ([JoyrideStatus.FINISHED, JoyrideStatus.SKIPPED].includes(status)) {
      setTourRun(false);
      localStorage.setItem('acorn_phase_tour', 'seen');
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
      setPhaseCompletionMeta(projectData.phase_completion_meta ?? {});

      const [reqData, taskData, artifactData] = await Promise.all([
        api.getRequirements(id),
        api.getTasks(id),
        api.getArtifacts(id),
      ]);
      setRequirements(reqData);
      setTasks(taskData);
      setArtifacts(artifactData);

      const scaffolds = await api.getScaffolds(id);
      if (scaffolds?.scaffolds?.length > 0) {
        setScaffoldResult(scaffolds.scaffolds[0]); // Most recent
      }

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

  const handleGenerateScaffold = async () => {
    if (!id || !project) return;
    try {
      setIsScaffolding(true);
      const targetStack = project?.template_type === 'web_app' ? 'React + Node.js' : 
                         project?.template_type === 'mobile_app' ? 'React Native + Node.js' : 
                         'Python FastAPI + React';

      const targetInput = window.prompt("Target Stack (e.g. React + FastAPI):", targetStack);
      if (!targetInput) {
        setIsScaffolding(false);
        return; // Cancelled
      }

      setScaffoldingTarget(targetInput);
      
      const res = await api.generateScaffold(id, {
        target_stack: targetInput,
        include_tests: true,
        include_docker: true,
        project_tier: 'mvp'
      });
      
      if (res.success && res.scaffold) {
        setScaffoldResult(res.scaffold);
      }
    } catch (err: any) {
      console.error('Failed to generate scaffold', err);
      alert('Failed to generate scaffold: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsScaffolding(false);
      setScaffoldingTarget(null);
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

  const handleExportFullProjectPdf = () => {
    if (!project) return;
    const ok = exportFullProjectPdf({ project, phaseOutputs, phaseStatus });
    if (!ok) {
      setError(
        Object.keys(phaseOutputs).length
          ? 'Could not open the print window. Please allow popups for this site.'
          : 'No phase content available to export yet.'
      );
    }
  };

  const handlePhaseClick = (phaseId: string) => {
    if (!project) return;
    navigate(`/projects/${project.project_id || project.id}/phases/${phaseId}`);
  };

  const statusPillStyles: Record<string, string> = {
    completed:   'bg-blue-900/20 text-blue-400 border border-blue-500/30',
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

  const phaseKeys = ['planning','feasibility_study','requirements_gathering','validation','design','development','tasks','cost_benefit','risks','summary'];
  const doneCount = phaseKeys.filter(k => (phaseStatus[k] || '').toLowerCase() === 'completed').length;
  const healthScore = Math.round((doneCount / phaseKeys.length) * 100);
  const healthColor = healthScore >= 70 ? '#1A6FD4' : healthScore >= 40 ? '#F97316' : '#4a6070';

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-900)]" />
              </div>
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
        styles={{ options: { primaryColor: 'var(--blue-400)' } }}
      />
      <div className="max-w-7xl mx-auto space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Header Card ── */}
        <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)]" />
          <div className="p-4 sm:p-6 space-y-4">

            {/* Top row: back + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--blue-400)] transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Projects
              </button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => goToDraft('overview')}
                  className="text-xs px-3 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  Draft
                </Button>
                <Button variant="outline"
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/governance`)}
                  className="text-xs px-3 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  Governance
                </Button>
                <Button variant="outline"
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/updates`)}
                  className="text-xs px-3 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  Updates
                </Button>
                <Button
                  className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)] font-semibold text-xs px-4 shadow-lg shadow-[var(--blue-400)]/20"
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phaseConfigs[0]?.id}`)}
                >
                  Continue Planning
                </Button>
              </div>
            </div>

            {/* Project name + description */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--blue-400)]/20 text-[var(--blue-400)] border border-[var(--blue-400)]/30 text-xs font-semibold uppercase tracking-wide">
                  {project.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--brand-700)]/50 text-[var(--text-muted)] border border-[var(--brand-700)] text-xs font-medium">
                  {project.template_type.replace('_', ' ')}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-[var(--text-muted)] max-w-3xl">{project.description}</p>
              )}
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-stretch gap-3">
              {[
                { label: 'Requirements', value: requirements.length, phase: 'requirements_gathering' },
                { label: 'Tasks',         value: tasks.length,        phase: 'tasks' },
                { label: 'Artifacts',     value: artifacts.length,    phase: 'summary' },
                { label: 'Est. Hours',    value: totalHours > 0 ? `${totalHours.toFixed(0)}h` : '—', phase: 'tasks' },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${m.phase}`)}
                  className="flex flex-col items-center justify-center min-w-[80px] px-4 py-3 rounded-xl bg-[var(--brand-800)] border border-[var(--brand-700)] hover:border-[var(--blue-400)]/50 hover:bg-[var(--brand-750)] transition-all group"
                >
                  <span className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors leading-tight">{m.value}</span>
                  <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--blue-400)]/70 transition-colors">{m.label}</span>
                </button>
              ))}

              {/* Health score */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', borderRadius:'12px', background:'var(--brand-800)', border:`1px solid ${healthColor}33` }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:`2px solid ${healthColor}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:'10px', fontWeight:800, color:healthColor }}>{healthScore}%</span>
                </div>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:healthColor, lineHeight:1 }}>Health</div>
                  <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{doneCount}/10 phases</div>
                </div>
              </div>

              {/* Owner pill */}
              <div className="flex items-center px-4 py-3 rounded-xl bg-[var(--brand-800)] border border-[var(--brand-700)]">
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Owner</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{project.owner_name || 'Unassigned'}</div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[var(--brand-800)] border border-[var(--brand-700)]">
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Created</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{formatDate(project.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)]">Updated</div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{formatDate(project.updated_at)}</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <ProjectProgressBar
              projectId={project.project_id || project.id || ''}
              phaseStatus={phaseStatus}
            />
          </div>
        </div>

        {/* ── Phase Board ── */}
        <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg phase-board">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Project Phases</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Click any phase to open it. Complete them in order for best results.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleUnlockPhases}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)] transition-all"
              >
                Unlock all
              </button>
              <Button variant="outline" size="sm" onClick={handleExportAllPhases} disabled={!Object.keys(phaseOutputs).length}
                className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)] text-xs">
                Export MD
              </Button>
              <Button size="sm" onClick={handleExportFullProjectPdf} disabled={!Object.keys(phaseOutputs).length}
                className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)] font-semibold text-xs disabled:opacity-50">
                Export PDF
              </Button>
            </div>
          </div>

          <PhaseKanban
            phases={phaseConfigs}
            phaseStatus={phaseStatus}
            phaseOutputs={phaseOutputs}
            onPhaseClick={handlePhaseClick}
          />

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--brand-700)]/30">
            {[
              { color: '#1A6FD4', label: 'Completed' },
              { color: '#F97316', label: 'In Progress' },
              { color: '#3d8fe0', label: 'Ready' },
              { color: '#4a6070', label: 'Locked' },
              { color: '#F97316', label: '● Output ready', dot: true },
            ].map(({ color, label, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                {dot
                  ? <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:color }} />
                  : <div style={{ width:'12px', height:'12px', borderRadius:'3px', background:color, opacity:0.7 }} />
                }
                <span className="text-xs text-[var(--text-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scaffold quick-action (shown once requirements/tasks exist) ── */}
        {(requirements.length > 0 || tasks.length > 0) && (
          <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Code Scaffold</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Generate a starter folder structure and boilerplate from your project plan.</p>
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateScaffold}
              disabled={isScaffolding}
              className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)] text-sm"
            >
              {isScaffolding
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                : <><Terminal className="w-4 h-4 mr-2" />Generate Scaffold</>
              }
            </Button>
          </div>
        )}

        {/* ── Activity Timeline ── */}
        <ProjectActivityTimeline
          phaseCompletionMeta={phaseCompletionMeta}
          phaseStatus={phaseStatus}
          onPhaseClick={handlePhaseClick}
        />
      </div>

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
