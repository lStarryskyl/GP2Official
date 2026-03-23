import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { ExportButtons } from '@/components/ExportButtons';
import { api } from '@/lib/api';
import type { Artifact, Project, Requirement, Task } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import { formatDate } from '@/lib/utils';
import { workspacePresets } from '@/constants/workspacePresets';
import { AIAgentsPanel } from '@/components/AIAgentsPanel';

type DraftSectionKey = 'overview';

/* =========================================================
   PHASE TREE COMPONENT
   Renders an SVG tree with phases as interactive leaves
   ========================================================= */
const PhaseTree: React.FC<{
  phases: typeof phaseConfigs;
  phaseStatus: Record<string, string>;
  phaseOutputs: Record<string, string>;
  onPhaseClick: (phaseId: string) => void;
  projectId: string;
}> = ({ phases, phaseStatus, phaseOutputs, onPhaseClick }) => {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  // Tree layout: trunk center-bottom, branches spreading up
  // 9 phases arranged as a living tree
  const treeNodes = [
    { id: 'feasibility_study',      x: 400, y: 480, label: 'Feasibility',  level: 1 },
    { id: 'requirements_gathering', x: 250, y: 375, label: 'Requirements', level: 2 },
    { id: 'system_design',          x: 560, y: 375, label: 'System Design', level: 2 },
    { id: 'design',                 x: 140, y: 265, label: 'Design',       level: 3 },
    { id: 'planning_roadmap',       x: 355, y: 255, label: 'Roadmap',      level: 3 },
    { id: 'development',            x: 620, y: 265, label: 'Development',  level: 3 },
    { id: 'gantt_chart',            x: 215, y: 152, label: 'Timeline',     level: 4 },
    { id: 'validation',             x: 535, y: 152, label: 'Validation',   level: 4 },
    { id: 'summary',                x: 375, y: 62,  label: 'Summary',      level: 5 },
  ];

  // Branch connections (parent → child)
  const branches = [
    ['feasibility_study',      'requirements_gathering'],
    ['feasibility_study',      'system_design'],
    ['requirements_gathering', 'design'],
    ['requirements_gathering', 'planning_roadmap'],
    ['system_design',          'development'],
    ['planning_roadmap',       'gantt_chart'],
    ['development',            'validation'],
    ['gantt_chart',            'summary'],
    ['validation',             'summary'],
  ];

  const getNodeColor = (phaseId: string) => {
    const status = (phaseStatus[phaseId] || 'locked').toLowerCase();
    if (status === 'completed')                          return '#D4A017'; // acorn gold
    if (status === 'active' || status === 'in_progress') return '#3d7a4a'; // leaf green
    if (status === 'ready' || status === 'planning')     return '#5a9e6a'; // fresh leaf
    return '#2c1b0e'; // bark/locked
  };

  const getTextColor = (phaseId: string) => {
    const status = (phaseStatus[phaseId] || 'locked').toLowerCase();
    if (status === 'completed')                          return '#130c07';
    if (status === 'active' || status === 'in_progress') return '#f0e4c8';
    if (status === 'ready' || status === 'planning')     return '#0c0702';
    return '#8a7055';
  };

  const nodeMap = Object.fromEntries(treeNodes.map(n => [n.id, n]));

  return (
    <div className="relative w-full" style={{ height: '560px' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet">
        {/* Deep root glow */}
        <ellipse cx="400" cy="555" rx="80" ry="10" fill="#0c0702" fillOpacity="0.7" />

        {/* Roots */}
        <line x1="400" y1="555" x2="340" y2="558" stroke="#2c1b0e" strokeWidth="10" strokeLinecap="round" />
        <line x1="400" y1="555" x2="460" y2="558" stroke="#2c1b0e" strokeWidth="10" strokeLinecap="round" />
        <line x1="400" y1="555" x2="300" y2="558" stroke="#2c1b0e" strokeWidth="7" strokeLinecap="round" opacity="0.7" />
        <line x1="400" y1="555" x2="500" y2="558" stroke="#2c1b0e" strokeWidth="7" strokeLinecap="round" opacity="0.7" />

        {/* Tree trunk - bark brown */}
        <line x1="400" y1="558" x2="400" y2="480"
          stroke="#3d2412" strokeWidth="18" strokeLinecap="round" />
        <line x1="400" y1="558" x2="400" y2="490"
          stroke="#5c3820" strokeWidth="10" strokeLinecap="round" opacity="0.5" />

        {/* Ground shadow */}
        <ellipse cx="400" cy="558" rx="90" ry="6" fill="#130c07" fillOpacity="0.6" />

        {/* Branches */}
        {branches.map(([from, to], i) => {
          const fromNode = nodeMap[from];
          const toNode   = nodeMap[to];
          if (!fromNode || !toNode) return null;
          const isHighlighted = hoveredPhase === to || hoveredPhase === from;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <path
              key={i}
              d={`M ${fromNode.x} ${fromNode.y} C ${fromNode.x} ${midY}, ${toNode.x} ${midY}, ${toNode.x} ${toNode.y}`}
              stroke={isHighlighted ? '#c8895a' : '#3d2412'}
              strokeWidth={isHighlighted ? 4.5 : 3}
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.35s ease, stroke-width 0.35s ease' }}
            />
          );
        })}

        {/* Floating ambient particles */}
        {[0,1,2,3,4].map(i => {
          const px = 120 + i * 130;
          const py = 30 + (i % 3) * 20;
          return (
            <ellipse key={i} cx={px} cy={py} rx="3" ry="3"
              fill={i % 2 === 0 ? '#D4A017' : '#8B5E3C'} fillOpacity={0.15 + i * 0.05}
              style={{ animation: `float ${3 + i * 0.6}s ease-in-out ${i * 0.4}s infinite` }}
            />
          );
        })}

        {/* Phase leaf nodes */}
        {treeNodes.map((node) => {
          const phaseConfig = phases.find(p => p.id === node.id);
          const nodeColor   = getNodeColor(node.id);
          const textColor   = getTextColor(node.id);
          const isHovered   = hoveredPhase === node.id;
          const hasOutput   = Boolean(phaseOutputs[node.id]);
          const status      = (phaseStatus[node.id] || 'locked').toLowerCase();
          const isCompleted = status === 'completed';
          const isActive    = status === 'active' || status === 'in_progress';
          const isReady     = status === 'ready' || status === 'planning';

          const rx = isHovered ? 50 : 44;
          const ry = isHovered ? 58 : 52;

          const leafP = (cx: number, cy: number, lrx: number, lry: number) => {
            const t = cy - lry;
            const b = cy + lry * 0.55;
            const ml = cx - lrx * 0.92;
            const mr = cx + lrx * 0.92;
            return `M ${cx} ${t} C ${mr} ${t + lry*0.35}, ${mr} ${b - lry*0.2}, ${cx} ${b} C ${ml} ${b - lry*0.2}, ${ml} ${t + lry*0.35}, ${cx} ${t} Z`;
          };

          return (
            <g
              key={node.id}
              onClick={() => onPhaseClick(node.id)}
              onMouseEnter={() => setHoveredPhase(node.id)}
              onMouseLeave={() => setHoveredPhase(null)}
              style={{ cursor: 'pointer' }}
              className="tree-node"
            >
              {/* Glow halo */}
              <ellipse cx={node.x} cy={node.y} rx={rx + 16} ry={ry + 16}
                fill={nodeColor} fillOpacity={isHovered ? 0.18 : 0.06}
                style={{ transition: 'all 0.35s ease' }}
              />

              {isCompleted ? (
                /* Completed → acorn shape */
                <g style={{
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isHovered ? 'drop-shadow(0 0 14px rgba(212,160,23,0.65))' : 'none',
                }}>
                  <ellipse cx={node.x} cy={node.y + ry * 0.22} rx={rx * 0.84} ry={ry * 0.76}
                    fill="#D4A017"
                    stroke={isHovered ? '#f5df90' : 'rgba(212,160,23,0.4)'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />
                  <ellipse cx={node.x} cy={node.y + ry * 0.22} rx={rx * 0.67} ry={ry * 0.62}
                    fill="#e8bf40" fillOpacity="0.5"
                  />
                  <ellipse cx={node.x} cy={node.y - ry * 0.42} rx={rx * 0.9} ry={ry * 0.35}
                    fill="#3d2412"
                  />
                  <ellipse cx={node.x} cy={node.y - ry * 0.42} rx={rx * 0.72} ry={ry * 0.25}
                    fill="#221508"
                  />
                  <rect x={node.x - rx * 0.1} y={node.y - ry * 0.85} width={rx * 0.2} height={ry * 0.46}
                    rx={rx * 0.08} fill="#221508"
                  />
                  <ellipse cx={node.x - rx * 0.24} cy={node.y + ry * 0.05} rx={rx * 0.14} ry={ry * 0.2}
                    fill="rgba(255,255,255,0.12)"
                  />
                </g>
              ) : (isActive || isReady) ? (
                /* Active/ready → filled leaf shape */
                <g style={{
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isHovered ? `drop-shadow(0 0 14px ${nodeColor}99)` : 'none',
                }}>
                  <path
                    d={leafP(node.x, node.y, rx, ry)}
                    fill={nodeColor}
                    stroke={isHovered ? '#5a9e6a' : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />
                  <line x1={node.x} y1={node.y - ry * 0.8} x2={node.x} y2={node.y + ry * 0.4}
                    stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={node.x} y1={node.y - ry * 0.25} x2={node.x - rx * 0.52} y2={node.y + ry * 0.1}
                    stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
                  <line x1={node.x} y1={node.y - ry * 0.25} x2={node.x + rx * 0.52} y2={node.y + ry * 0.1}
                    stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
                </g>
              ) : (
                /* Locked → bare/outlined leaf */
                <g style={{
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isHovered ? 'drop-shadow(0 0 10px rgba(44,27,14,0.5))' : 'none',
                }}>
                  <path
                    d={leafP(node.x, node.y, rx, ry)}
                    fill="#2c1b0e"
                    stroke={isHovered ? '#5c3820' : 'rgba(92,56,32,0.45)'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray="4 3"
                  />
                  <line x1={node.x} y1={node.y - ry * 0.8} x2={node.x} y2={node.y + ry * 0.4}
                    stroke="rgba(139,94,60,0.25)" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              )}

              {/* Step number */}
              <text x={node.x} y={node.y - (isCompleted ? ry * 0.05 : 8)} textAnchor="middle"
                fill={textColor} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}>
                {phaseConfig?.stepNumber || ''}
              </text>

              {/* Phase label */}
              <text x={node.x} y={node.y + (isCompleted ? ry * 0.38 : 8)} textAnchor="middle"
                fill={textColor} fontSize="9.5" fontWeight="700" fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}>
                {node.label}
              </text>

              {/* Has-output badge for non-completed */}
              {hasOutput && !isCompleted && (
                <g>
                  <ellipse cx={node.x + rx - 6} cy={node.y - ry + 8} rx={9} ry={9} fill="#D4A017" />
                  <text x={node.x + rx - 6} y={node.y - ry + 12}
                    textAnchor="middle" fill="#130c07" fontSize="9" fontWeight="800"
                    style={{ pointerEvents: 'none' }}>
                    ✓
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredPhase && (() => {
        const phase  = phases.find(p => p.id === hoveredPhase);
        const status = (phaseStatus[hoveredPhase] || 'locked').toLowerCase();
        if (!phase) return null;
        return (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-xl px-5 py-3 text-center pointer-events-none z-10"
            style={{
              minWidth: '220px',
              background: '#1a1008',
              border: '1px solid rgba(212,160,23,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-sm font-semibold" style={{ color: '#f0e4c8' }}>{phase.title}</p>
            {phase.description && (
              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#8a7055' }}>{phase.description.slice(0, 70)}...</p>
            )}
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: status === 'completed'
                  ? 'rgba(212,160,23,0.15)'
                  : status === 'active' || status === 'in_progress'
                  ? 'rgba(90,158,106,0.15)'
                  : 'rgba(61,36,18,0.4)',
                color: status === 'completed'
                  ? '#D4A017'
                  : status === 'active' || status === 'in_progress'
                  ? '#5a9e6a'
                  : '#8a7055',
              }}>
              {status}
            </span>
          </div>
        );
      })()}
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
    completed:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    ready:       'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30',
    in_progress: 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30',
    locked:      'bg-[#3d2412]/30 text-[#8a7055] border border-[#3d2412]',
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
            <div className="text-5xl mb-4 animate-bounce">🌰</div>
            <p style={{ color: '#8a7055' }}>Loading project…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-[#f0e4c8] mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')} className="bg-gradient-to-r from-[#4ade80] to-[#3d8a55] text-[#130c07]">Back to Projects</Button>
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
            primaryColor: '#D4A017',
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
        <div className="rounded-2xl shadow-lg overflow-hidden"
          style={{ background: '#1a1008', border: '1px solid #3d2412' }}>
          {/* Header gradient bar - amber */}
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #D4A017, #c8870f, #8B5E3C)' }} />

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-sm font-medium transition-colors"
                style={{ color: '#8a7055' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D4A017')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8a7055')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Grove
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => goToDraft('overview')}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                  style={{ borderColor: '#3d2412', color: '#8a7055' }}>
                  <span className="hidden sm:inline">Open </span>Draft
                </Button>
                <Button
                  className="text-xs sm:text-sm px-2 sm:px-4 font-semibold shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #D4A017, #c8870f)', color: '#130c07', boxShadow: '0 4px 14px rgba(212,160,23,0.3)' }}
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phaseConfigs[0]?.id}`)}
                >
                  <span className="hidden sm:inline">Continue </span>Planning 🌱
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#f0e4c8' }}>{project.name}</h1>
                {project.description && (
                  <p className="max-w-2xl" style={{ color: '#8a7055' }}>{project.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
                  style={{ background: 'rgba(212,160,23,0.12)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)' }}>
                  {project.status}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(61,36,18,0.5)', color: '#c8b090', border: '1px solid #3d2412' }}>
                  {project.template_type.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(90,158,106,0.1)', color: '#5a9e6a', border: '1px solid rgba(90,158,106,0.25)' }}>
                  {project.owner_name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Workspace Preset Switcher */}
            <div className="pt-4" style={{ borderTop: '1px solid #3d2412' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#5c3820' }}>Workspace Mode</p>
              <div className="flex flex-wrap items-center gap-2">
                {workspacePresets.map((preset) => {
                  const isActive = preset.id === activePreset;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      disabled={updatingPreset}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        updatingPreset ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={isActive
                        ? { background: '#D4A017', color: '#130c07', boxShadow: '0 4px 12px rgba(212,160,23,0.3)' }
                        : { background: '#221508', color: '#8a7055', border: '1px solid #3d2412' }
                      }
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: '#5c3820' }}>{presetConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-4 sm:gap-6 ${showSummaryPanel ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : ''}`}>
          {showSummaryPanel && (
            <aside className="space-y-6 side-summary">
              <div className="bg-[#1a1008] border border-[#3d2412]/50 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#f0e4c8]">Project Summary</h2>
                  <dl className="mt-4 space-y-3 text-sm text-[#8a7055]">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium text-[#4ade80]">{project.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-[#f0e4c8]">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-[#f0e4c8]">{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium text-[#f0e4c8]">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated</span>
                      <span className="font-medium text-[#f0e4c8]">{formatDate(project.updated_at)}</span>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#8a7055] mb-3">Key Metrics</h3>
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
                        className="rounded-xl border border-[#3d2412] px-3 py-4 bg-[#221508] text-center hover:border-[#4ade80]/50 hover:bg-[#2c1b0e] transition-all cursor-pointer group"
                      >
                        <div className="text-2xl font-semibold text-[#f0e4c8] group-hover:text-[#4ade80] transition-colors">{metric.value}</div>
                        <div className="text-xs text-[#8a7055] group-hover:text-[#4ade80]/80 transition-colors">{metric.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-[#8a7055]">
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
                    className="text-[#4ade80] font-medium hover:text-[#86efac] cursor-pointer"
                  >
                    Unlock all phases
                  </span>
                </div>
              </div>

              <div className="bg-[#1a1008] border border-[#3d2412]/50 rounded-2xl p-6 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#f0e4c8]">Project Brief</h2>
                  <Button variant="outline" size="sm" onClick={() => goToDraft('overview')} className="border-[#3d2412] text-[#8a7055] hover:border-[#4ade80]/50 hover:text-[#4ade80]">
                    Open Draft
                  </Button>
                </div>
                <p className="text-sm text-[#8a7055] whitespace-pre-wrap">
                  {project.brief_text || 'No brief provided.'}
                </p>
              </div>

              <div className="bg-[#1a1008] border border-[#3d2412]/50 rounded-2xl p-6 shadow-lg space-y-4">
                <h2 className="text-base font-semibold text-[#f0e4c8]">Governance &amp; Updates</h2>
                <p className="text-sm text-[#8a7055]">Manage membership, branching, and development logs.</p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate(`/projects/${project.project_id || project.id}/governance`)} className="border-[#3d2412] text-[#8a7055] hover:border-[#4ade80]/50 hover:text-[#4ade80]">
                    Governance hub
                  </Button>
                  <Button onClick={() => navigate(`/projects/${project.project_id || project.id}/updates`)} className="bg-gradient-to-r from-[#4ade80] to-[#3d8a55] text-[#130c07] font-semibold">
                    Development updates
                  </Button>
                </div>
              </div>
            </aside>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Phases Section */}
            <div className="bg-[#1a1008] border border-[#3d2412]/50 rounded-2xl p-4 sm:p-6 shadow-lg phase-board">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[#f0e4c8]">Project Phases</h2>
                  <p className="text-xs sm:text-sm text-[#8a7055] hidden sm:block">
                    Click any leaf to work on that phase. Green = complete, amber = in progress.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex items-center bg-[#221508] rounded-xl p-1 border border-[#3d2412]/50">
                    <button
                      onClick={() => setTreeView(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        treeView ? 'bg-[#4ade80] text-[#130c07]' : 'text-[#8a7055] hover:text-[#f0e4c8]'
                      }`}
                    >
                      Tree
                    </button>
                    <button
                      onClick={() => setTreeView(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !treeView ? 'bg-[#4ade80] text-[#130c07]' : 'text-[#8a7055] hover:text-[#f0e4c8]'
                      }`}
                    >
                      List
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportAllPhases} disabled={!Object.keys(phaseOutputs).length} className="border-[#3d2412] text-[#8a7055] hover:border-[#4ade80]/50 hover:text-[#4ade80]">
                    Export All
                  </Button>
                </div>
              </div>

              {/* Tree View */}
              {treeView ? (
                <div className="relative">
                  <PhaseTree
                    phases={phaseConfigs}
                    phaseStatus={phaseStatus}
                    phaseOutputs={phaseOutputs}
                    onPhaseClick={handlePhaseClick}
                    projectId={project.project_id || project.id || ''}
                  />

                  {/* Phase color legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#3d2412]/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#4ade80]" />
                      <span className="text-xs text-[#8a7055]">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#fbbf24]" />
                      <span className="text-xs text-[#8a7055]">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#86efac]" />
                      <span className="text-xs text-[#8a7055]">Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#3d2412] border border-[#2d6a3f]" />
                      <span className="text-xs text-[#8a7055]">Locked</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#fbbf24]" />
                      <span className="text-xs text-[#8a7055]">dot = output available</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="divide-y divide-[#1e4a28]/30">
                  {phaseConfigs.map((phase) => {
                    const status = (phaseStatus[phase.id] || 'locked').toLowerCase();
                    const pillClass =
                      status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : status === 'active' || status === 'planning'
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                        : 'bg-[#3d2412]/30 text-[#8a7055] border border-[#3d2412]';
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
                        className={`w-full text-left ${phaseRowPadding} hover:bg-[#2c1b0e] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80] rounded-xl`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                            {phase.stepNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className={`font-semibold text-[#f0e4c8] ${condensePhases ? 'text-sm' : 'text-base'}`}>{phase.title}</p>
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
                                    className="text-xs font-semibold text-[#4ade80] hover:text-[#86efac]"
                                  >
                                    Export
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`mt-1 text-[#8a7055] line-clamp-2 ${condensePhases ? 'text-xs' : 'text-sm'}`}>{phase.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="bg-[#1a1008] border border-[#3d2412]/50 rounded-2xl p-6 shadow-lg">
                <h2 className="text-base font-semibold text-[#f0e4c8] mb-4">Project Details</h2>
                <dl className="space-y-3 text-sm text-[#8a7055]">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-[#f0e4c8]">{project.template_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <span className="font-medium text-[#f0e4c8]">{project.owner_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="font-medium text-[#f0e4c8]">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="font-medium text-[#f0e4c8]">{formatDate(project.updated_at)}</span>
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
          requirements={[]}
        />
      )}
    </Layout>
  );
};
