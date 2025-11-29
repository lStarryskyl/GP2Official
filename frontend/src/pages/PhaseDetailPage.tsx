import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Artifact, Project, Task, Requirement } from '@/types';
import { phaseConfigs, getPhaseConfig, getNextPhase, phaseColors } from '@/constants/phases';
import ReactMarkdown from 'react-markdown';
import { PhaseNavigation } from '@/components/PhaseNavigation';
import {
  FeasibilityStudyPhase,
  PlanningRoadmapPhase,
  SystemDesignPhase,
  DevelopmentPhase,
  GanttChartPhase,
  FinalSummaryPhase,
  ValidationPhase,
  DesignPhase,
} from '@/components/phases';
import {
  ArrowLeft,
  Download,
  Loader2,
  Share2,
  Sparkles,
  ListChecks,
  Grid2X2,
  BarChart3,
  Wand2,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  Layers,
  GitBranch,
  Edit3,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  CheckSquare,
  XCircle,
  Code,
  Database,
  Shield,
  Users,
  Settings,
  Palette,
} from 'lucide-react';

export const PhaseDetailPage: React.FC = () => {
  const { id, phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [localTaskStatus, setLocalTaskStatus] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    start_date: '',
    due_date: '',
    priority: 'medium',
    status: 'planned',
    dependencies: '',
    milestone: false,
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [aiAddingTasks, setAiAddingTasks] = useState(false);
  const [ganttScale, setGanttScale] = useState<'auto' | '2w' | '1m' | '3m' | '6m'>('auto');
  const [barHeight, setBarHeight] = useState(22);
  const [taskFilter, setTaskFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingCanvas, setSyncingCanvas] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [ganttZoom, setGanttZoom] = useState(100);
  const [ganttViewMode, setGanttViewMode] = useState<'chart' | 'list' | 'board'>('chart');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [costData, setCostData] = useState<{
    phases: { name: string; cost: number; hours: number }[];
    totalCost: number;
    totalHours: number;
    hourlyRate: number;
  } | null>(null);
  const phaseConfig = getPhaseConfig(phaseId || '');

  const [requirementDraft, setRequirementDraft] = useState({
    type: 'functional',
    title: '',
    description: '',
    priority: 'medium',
    status: 'proposed',
  });
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [editingRequirementDraft, setEditingRequirementDraft] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'proposed',
  });

  const handleUpdateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      const updated = await api.updateTask(taskId, patch);
      setTasks((prev) => prev.map((t) => (t.task_id === taskId ? updated : t)));
    } catch (err) {
      console.error('Update task failed', err);
    }
  };

  useEffect(() => {
    if (!id) return;
    const loadProjectData = async () => {
      try {
        const [proj, arts, status, taskData, reqData] = await Promise.all([
          api.getProject(id),
          api.getArtifacts(id),
          api.getPhaseStatus(id),
          api.getTasks(id),
          api.getRequirements(id),
        ]);
        setProject(proj);
        setArtifacts(arts);
        setPhaseStatus(status.phases);
        setTasks(taskData);
        setRequirements(reqData);
        
        // Calculate cost data from tasks
        const hourlyRate = proj.hourly_rate || 100;
        const phaseGroups: Record<string, { hours: number; tasks: number }> = {};
        taskData.forEach((task: Task) => {
          const phase = task.phase || 'unassigned';
          if (!phaseGroups[phase]) {
            phaseGroups[phase] = { hours: 0, tasks: 0 };
          }
          phaseGroups[phase].hours += task.estimate_hours || 0;
          phaseGroups[phase].tasks += 1;
        });
        
        const phases = Object.entries(phaseGroups).map(([name, data]) => ({
          name: name.replace('_', ' '),
          cost: data.hours * hourlyRate,
          hours: data.hours,
        }));
        
        const totalHours = taskData.reduce((sum: number, t: Task) => sum + (t.estimate_hours || 0), 0);
        setCostData({
          phases,
          totalCost: totalHours * hourlyRate,
          totalHours,
          hourlyRate,
        });
      } catch (err) {
        setError('Failed to load phase info');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [id]);

  const phaseMarkdown = useMemo(() => {
    if (!phaseId) return '';
    const artifact = artifacts.find(
      (art) => art.type === `PHASE_${phaseId.toUpperCase()}`
    );
    return artifact?.content_json?.markdown || '';
  }, [artifacts, phaseId]);

  const unifiedPromptRef = useRef<HTMLTextAreaElement | null>(null);

  const latestArtifact = useMemo(() => {
    if (!phaseId) return null;
    return artifacts.find((art) => art.type === `PHASE_${phaseId.toUpperCase()}`);
  }, [artifacts, phaseId]);

  const handleGenerate = async (prompt?: string) => {
    if (!id || !phaseId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const userPrompt = prompt || input;
      const response = await api.generatePhase(id, phaseId, userPrompt);
      setPhaseStatus(response.phase_status);
      const updatedArtifacts = await api.getArtifacts(id);
      setArtifacts(updatedArtifacts);

      // Auto-sync AI outputs into structured project fields for certain phases
      const latestPhaseArtifact = updatedArtifacts.find(
        (art) => art.type === `PHASE_${phaseId.toUpperCase()}`
      );

      if (latestPhaseArtifact && latestPhaseArtifact.content_json?.markdown) {
        const markdown = latestPhaseArtifact.content_json.markdown as string;

        if (phaseId === 'development') {
          // Very lightweight parser: look for headings and bullet lists / blocks
          const lines = markdown.split('\n');
          const stack: any[] = [];
          const best: string[] = [];
          const watch: string[] = [];
          const flow: string[] = [];
          const structureLines: string[] = [];
          const components: string[] = [];
          let currentSection:
            | 'none'
            | 'stack'
            | 'best'
            | 'watch'
            | 'flow'
            | 'structure'
            | 'components' = 'none';
          let inCodeBlock = false;

          for (const raw of lines) {
            const line = raw.replace(/\r?$/, '');
            const trimmed = line.trim();
            const lower = trimmed.toLowerCase();

            if (trimmed.startsWith('```')) {
              inCodeBlock = !inCodeBlock;
              if (inCodeBlock && (currentSection === 'structure' || lower.includes('folder') || lower.includes('directory'))) {
                currentSection = 'structure';
              }
              continue;
            }

            if (!inCodeBlock && trimmed.startsWith('#')) {
              if (lower.includes('tech stack') || lower.includes('technology stack')) {
                currentSection = 'stack';
              } else if (lower.includes('best practice')) {
                currentSection = 'best';
              } else if (lower.includes('risk') || lower.includes('watch out')) {
                currentSection = 'watch';
              } else if (lower.includes('system flow') || lower.includes('request flow')) {
                currentSection = 'flow';
              } else if (lower.includes('folder structure') || lower.includes('directory structure')) {
                currentSection = 'structure';
              } else if (lower.includes('component')) {
                currentSection = 'components';
              } else {
                currentSection = 'none';
              }
              continue;
            }

            if (!trimmed) {
              if (inCodeBlock && currentSection === 'structure') {
                structureLines.push('');
              }
              continue;
            }

            if (inCodeBlock && currentSection === 'structure') {
              structureLines.push(line);
              continue;
            }

            if (!trimmed.startsWith('-') && !trimmed.startsWith('*')) {
              continue;
            }

            const content = trimmed.replace(/^[-*]\s*/, '').trim();
            if (!content) continue;

            if (currentSection === 'stack') {
              // Try to parse "Name: description" or just a name
              const [namePart, descPart] = content.split(':');
              const name = (namePart || '').trim();
              const description = (descPart || '').trim();
              if (name) {
                stack.push({
                  name,
                  category: 'general',
                  description: description || name,
                  icon: '✨',
                  recommended: true,
                });
              }
            } else if (currentSection === 'best') {
              best.push(content);
            } else if (currentSection === 'watch') {
              watch.push(content);
            } else if (currentSection === 'flow') {
              flow.push(content);
            } else if (currentSection === 'components') {
              components.push(content);
            }
          }

          if (stack.length || best.length || watch.length || flow.length || structureLines.length || components.length) {
            try {
              // Merge with existing project development data if available
              const existing = await api.getDevelopment(id);
              const mergedStack = [...(existing.stack || []), ...stack];
              const mergedBest = [
                ...(Array.isArray(existing.notes?.bestPractices) ? existing.notes!.bestPractices : []),
                ...best,
              ];
              const mergedWatch = [
                ...(Array.isArray(existing.notes?.watchOuts) ? existing.notes!.watchOuts : []),
                ...watch,
              ];

              const existingNotes = (existing.notes || {}) as Record<string, any>;
              const nextNotes: Record<string, any> = {
                ...existingNotes,
                bestPractices: mergedBest,
                watchOuts: mergedWatch,
              };

              if (flow.length) {
                nextNotes.flowSteps = flow;
              }
              if (structureLines.length) {
                nextNotes.folderStructure = structureLines.join('\n');
              }
              if (components.length) {
                nextNotes.components = components;
              }

              await api.saveDevelopment(id, {
                stack: mergedStack,
                notes: nextNotes,
              });
            } catch (err) {
              console.error('Failed to auto-sync development data from phase artifact', err);
            }
          }
        } else if (phaseId === 'planning') {
          // Convert planning markdown into basic roadmap milestones
          const lines = markdown.split('\n');
          const milestones: {
            id: string;
            name: string;
            phase: string;
            startMonth: number;
            endMonth: number;
            progress: number;
            status: 'completed' | 'in_progress' | 'upcoming';
            color: string;
            dependencies?: string[];
            subItems?: any[];
          }[] = [];

          let currentName: string | null = null;
          for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            if (line.startsWith('#')) {
              // Treat headings as potential milestone names
              const name = line.replace(/^#+\s*/, '').trim();
              if (name) {
                currentName = name;
                milestones.push({
                  id: `mile_${milestones.length + 1}_${Date.now()}`,
                  name,
                  phase: 'Planning',
                  startMonth: milestones.length,
                  endMonth: milestones.length + 1,
                  progress: 0,
                  status: 'upcoming',
                  color: 'blue',
                });
              }
            } else if ((line.startsWith('-') || line.startsWith('*')) && !currentName) {
              // Fallback: bullet lines as standalone milestones if no heading seen yet
              const name = line.replace(/^[-*]\s*/, '').trim();
              if (!name) continue;
              milestones.push({
                id: `mile_${milestones.length + 1}_${Date.now()}`,
                name,
                phase: 'Planning',
                startMonth: milestones.length,
                endMonth: milestones.length + 1,
                progress: 0,
                status: 'upcoming',
                color: 'blue',
              });
            }
          }

          if (milestones.length) {
            try {
              const summary = milestones.map((m) => ({
                id: m.id,
                name: m.name,
                phase: m.phase,
                status: m.status,
                window: `${m.startMonth} → ${m.endMonth}`,
                progress: m.progress,
              }));
              await api.saveRoadmap(id, { milestones, summary });
            } catch (err) {
              console.error('Failed to auto-sync planning roadmap from phase artifact', err);
            }
          }
        } else if (phaseId === 'feasibility_study') {
          // Convert feasibility markdown into a single structured study
          const titleLine = markdown.split('\n').find((l) => l.trim().startsWith('#')) || '# Feasibility Study';
          const title = titleLine.replace(/^#+\s*/, '').trim() || 'Feasibility Study';
          const body = markdown.trim();
          const tags: string[] = [];

          if (body.toLowerCase().includes('market')) tags.push('market');
          if (body.toLowerCase().includes('technical')) tags.push('technical');
          if (body.toLowerCase().includes('economic') || body.toLowerCase().includes('roi')) tags.push('economic');

          const newStudy = {
            id: `study_${Date.now()}`,
            title,
            body,
            tags,
            source: 'user+ai',
          };

          try {
            const existing = await api.getFeasibilityStudies(id);
            const merged = [...(existing.studies || []), newStudy];
            await api.saveFeasibilityStudies(id, { studies: merged });
          } catch (err) {
            console.error('Failed to auto-sync feasibility studies from phase artifact', err);
          }
        }
      }
      if (prompt) setInput(''); // Clear input if prompt was provided externally
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate phase output');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenCanvas = async () => {
    if (!id || !phaseConfig) return;
    setSyncingCanvas(true);
    setError(null);
    
    // Only sync for supported backend modes
    const supportedSyncModes = ['requirements', 'srs', 'costs', 'freeform'];
    const canvasMode = phaseConfig.canvasMode;
    
    try {
      // Only call sync API for supported modes
      if (supportedSyncModes.includes(canvasMode)) {
        await api.syncDiagramCanvas(id, canvasMode);
      }
      
      // Navigate to diagram studio - use freeform for unsupported modes
      const effectiveMode = supportedSyncModes.includes(canvasMode) ? canvasMode : 'freeform';
      const params = effectiveMode === 'freeform' ? '' : `?mode=${effectiveMode}`;
      navigate(`/projects/${id}/diagram-studio${params}`);
    } catch (err: any) {
      // If sync fails, still navigate but show warning
      console.warn('Canvas sync failed, navigating anyway:', err);
      navigate(`/projects/${id}/diagram-studio`);
    } finally {
      setSyncingCanvas(false);
    }
  };

  const handleDownload = () => {
    if (!phaseMarkdown || !phaseConfig || !project) return;
    const blob = new Blob([phaseMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-${phaseConfig.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleLocalTaskStatus = (taskId: string) => {
    setLocalTaskStatus((prev) => {
      const next = { ...prev };
      const current = (prev[taskId] || '').toLowerCase();
      next[taskId] = current === 'completed' ? 'pending' : 'completed';
      return next;
    });
  };

  const matrixBuckets = useMemo(() => {
    const buckets = {
      urgentImportant: [] as Task[],
      urgentNotImportant: [] as Task[],
      notUrgentImportant: [] as Task[],
      notUrgentNotImportant: [] as Task[],
    };
    const now = new Date();
    tasks.forEach((task) => {
      const due = task.due_date ? new Date(task.due_date) : null;
      const urgent = due ? due.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 3 : false;
      const important = (task.priority || '').toLowerCase() !== 'low';
      if (urgent && important) buckets.urgentImportant.push(task);
      else if (urgent && !important) buckets.urgentNotImportant.push(task);
      else if (!urgent && important) buckets.notUrgentImportant.push(task);
      else buckets.notUrgentNotImportant.push(task);
    });
    return buckets;
  }, [tasks]);

  const ganttData = useMemo(() => {
    if (!tasks.length) {
      return { bars: [], connectors: [], start: new Date(), end: new Date(), height: 200 };
    }
    const defaults = tasks.map((t, idx) => {
      const start = t.start_date ? new Date(t.start_date) : new Date(Date.now() + idx * 86400000);
      const end = t.due_date ? new Date(t.due_date) : new Date(start.getTime() + 86400000 * 3);
      return { ...t, start, end };
    });
    let min = defaults.reduce((acc, t) => (t.start < acc ? t.start : acc), defaults[0].start);
    let max = defaults.reduce((acc, t) => (t.end > acc ? t.end : acc), defaults[0].end);
    if (ganttScale !== 'auto') {
      const now = new Date();
      const ranges: Record<string, number> = {
        '2w': 14,
        '1m': 30,
        '3m': 90,
        '6m': 180,
      };
      const days = ranges[ganttScale] || 30;
      min = now;
      max = new Date(now.getTime() + days * 86400000);
    }
    const totalMs = max.getTime() - min.getTime() || 1;
    const bars = defaults.map((t, idx) => {
      const x = Math.max(0, ((t.start.getTime() - min.getTime()) / totalMs) * 100);
      const width = Math.max(4, ((t.end.getTime() - t.start.getTime()) / totalMs) * 100);
      const status = (localTaskStatus[t.task_id] || t.status || '').toLowerCase();
      const color = status === 'completed' ? '#16a34a' : status === 'in_progress' ? '#2563eb' : '#c084fc';
      const isMilestone = (t.tags || []).includes('milestone');
      return { id: t.task_id, title: t.title, x, width, y: 50 + idx * (barHeight + 16), color, isMilestone };
    });
    const connectors: { x1: number; x2: number; y1: number; y2: number }[] = [];
    return { bars, connectors, start: min, end: max, height: 80 + bars.length * (barHeight + 16) };
  }, [tasks, localTaskStatus, ganttScale, barHeight]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!project || !phaseConfig) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Phase not found</h2>
          <Button onClick={() => navigate(`/projects/${id}`)}>Back to Project</Button>
        </div>
      </Layout>
    );
  }

  const status = phaseStatus[phaseConfig.id] || 'locked';
  const colors = phaseColors[phaseConfig.color] || phaseColors.yellow;
  const nextPhase = getNextPhase(phaseId || '');

  // Wrapper component for phase navigation
  const PhaseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Layout>
      <div className="flex">
        {/* Phase Navigation Sidebar */}
        <div className="hidden lg:block">
          <PhaseNavigation projectId={id} variant="sidebar" />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Horizontal Navigation for smaller screens */}
          <div className="lg:hidden">
            <PhaseNavigation projectId={id} variant="horizontal" />
          </div>
          
          <div className="p-6 space-y-6">
            {/* Phase Header */}
            <div className="relative">
              <div className={`absolute -top-10 -left-10 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-50`}></div>
              <div className="relative flex items-center justify-between flex-wrap gap-3">
                <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Project
                </Button>
                <div className="text-right">
                  <p className="text-xs uppercase text-gray-500 tracking-wider">Phase {(phaseConfig.order || 0) + 1} of {phaseConfigs.length}</p>
                  <h1 className={`text-2xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                    Step {phaseConfig.stepNumber}: {phaseConfig.title}
                  </h1>
                  <p className="text-sm text-gray-500">{project?.name}</p>
                </div>
              </div>
            </div>

            {nextPhase && (
              <Card className={`bg-gradient-to-r ${colors.gradient}`}>
                <CardContent className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-sm opacity-80">Next Phase</p>
                    <h3 className="text-xl font-bold">Step {nextPhase.stepNumber}: {nextPhase.title}</h3>
                  </div>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    variant="outline"
                    onClick={() => navigate(`/projects/${id}/phases/${nextPhase.id}`)}
                  >
                    Continue to {nextPhase.shortTitle}
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Card className="bg-gray-50 border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-600" />
                  Prompt for this phase
                </CardTitle>
                <CardDescription>Custom prompt will re-run the active phase using the latest project context.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  ref={unifiedPromptRef}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  rows={3}
                  placeholder="E.g., 'Generate the validation checklist with stakeholder signoff steps'"
                />
                <div className="flex justify-end">
                  <Button
                    disabled={isGenerating}
                    onClick={() => {
                      const prompt = unifiedPromptRef.current?.value || '';
                      if (!prompt.trim()) return;
                      handleGenerate(prompt);
                    }}
                  >
                    {isGenerating ? 'Generating…' : 'Run prompt for this phase'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Phase Content */}
            {children}
          </div>
        </div>

        {/* Floating Navigation for quick access */}
        <PhaseNavigation projectId={id} variant="floating" />
      </div>
    </Layout>
  );

  // ============================================
  // FEASIBILITY STUDY PHASE
  // ============================================
  if (phaseId === 'feasibility_study') {
    return (
      <PhaseWrapper>
        <FeasibilityStudyPhase
          projectId={id || ''}
          projectName={project?.name || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          content={phaseMarkdown}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // PLANNING ROADMAP PHASE
  // ============================================
  if (phaseId === 'planning') {
    return (
      <PhaseWrapper>
        <PlanningRoadmapPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // REQUIREMENTS GATHERING PHASE
  // ============================================
  if (phaseId === 'requirements_gathering') {
    return (
      <PhaseWrapper>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.length}</p>
                    <p className="text-xs text-gray-500">Total Requirements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.filter(r => r.type === 'functional').length}</p>
                    <p className="text-xs text-gray-500">Functional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.filter(r => r.type === 'non_functional').length}</p>
                    <p className="text-xs text-gray-500">Non-Functional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.filter(r => r.priority === 'high').length}</p>
                    <p className="text-xs text-gray-500">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Requirements Catalog
              </CardTitle>
              <CardDescription>Functional and non-functional requirements with priority scoring</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Requirement */}
              <div className="mb-6 p-4 border border-dashed border-blue-200 rounded-lg bg-blue-50/50 space-y-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Add Requirement</span>
                  </div>
                  <select
                    className="text-xs border border-blue-200 rounded px-2 py-1 bg-white"
                    value={requirementDraft.type}
                    onChange={(e) => setRequirementDraft({ ...requirementDraft, type: e.target.value })}
                  >
                    <option value="functional">Functional</option>
                    <option value="non_functional">Non-Functional</option>
                  </select>
                </div>
                <input
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Requirement title..."
                  value={requirementDraft.title}
                  onChange={(e) => setRequirementDraft({ ...requirementDraft, title: e.target.value })}
                />
                <textarea
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[70px]"
                  placeholder="Requirement description..."
                  value={requirementDraft.description}
                  onChange={(e) => setRequirementDraft({ ...requirementDraft, description: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                    value={requirementDraft.priority}
                    onChange={(e) => setRequirementDraft({ ...requirementDraft, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    className="border border-blue-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                    value={requirementDraft.status}
                    onChange={(e) => setRequirementDraft({ ...requirementDraft, status: e.target.value })}
                  >
                    <option value="proposed">Proposed</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="implemented">Implemented</option>
                  </select>
                  <Button
                    size="sm"
                    className="ml-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                    disabled={!requirementDraft.title.trim()}
                    onClick={async () => {
                      if (!id || !requirementDraft.title.trim()) return;
                      try {
                        const payload: Partial<Requirement> = {
                          type: requirementDraft.type,
                          title: requirementDraft.title,
                          description: requirementDraft.description,
                          priority: requirementDraft.priority,
                          status: requirementDraft.status,
                        } as any;
                        const created = await api.createRequirement(id, payload);
                        setRequirements((prev) => [created, ...prev]);
                        setRequirementDraft({
                          type: 'functional',
                          title: '',
                          description: '',
                          priority: 'medium',
                          status: 'proposed',
                        });
                      } catch (err) {
                        console.error('Create requirement failed', err);
                      }
                    }}
                  >
                    Add Requirement
                  </Button>
                </div>
              </div>

              {requirements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No requirements gathered yet.</p>
                  <p className="text-sm mt-1">Use the AI assistant to generate requirements.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requirements.map((req) => (
                    <div key={req.requirement_id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={req.type === 'functional' ? 'default' : 'secondary'}>
                              {req.type === 'functional' ? 'FR' : 'NFR'}
                            </Badge>
                            <Badge variant={req.priority === 'high' ? 'destructive' : req.priority === 'medium' ? 'warning' : 'secondary'}>
                              {req.priority}
                            </Badge>
                            <Badge variant={req.status === 'approved' ? 'success' : req.status === 'implemented' ? 'success' : req.status === 'in_review' ? 'warning' : 'secondary'}>
                              {req.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {editingRequirementId === req.requirement_id ? (
                            <div className="space-y-2 mt-1">
                              <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                                value={editingRequirementDraft.title}
                                onChange={(e) =>
                                  setEditingRequirementDraft((prev) => ({ ...prev, title: e.target.value }))
                                }
                              />
                              <textarea
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                                rows={3}
                                value={editingRequirementDraft.description}
                                onChange={(e) =>
                                  setEditingRequirementDraft((prev) => ({ ...prev, description: e.target.value }))
                                }
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                                  value={editingRequirementDraft.priority}
                                  onChange={(e) =>
                                    setEditingRequirementDraft((prev) => ({ ...prev, priority: e.target.value }))
                                  }
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="critical">Critical</option>
                                </select>
                                <select
                                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                                  value={editingRequirementDraft.status}
                                  onChange={(e) =>
                                    setEditingRequirementDraft((prev) => ({ ...prev, status: e.target.value }))
                                  }
                                >
                                  <option value="proposed">Proposed</option>
                                  <option value="in_review">In Review</option>
                                  <option value="approved">Approved</option>
                                  <option value="implemented">Implemented</option>
                                </select>
                                <div className="ml-auto flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingRequirementId(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const patch: Partial<Requirement> = {
                                          title: editingRequirementDraft.title,
                                          description: editingRequirementDraft.description,
                                          priority: editingRequirementDraft.priority,
                                          status: editingRequirementDraft.status,
                                        } as any;
                                        const updated = await api.updateRequirement(req.requirement_id, patch);
                                        setRequirements((prev) =>
                                          prev.map((r) =>
                                            r.requirement_id === req.requirement_id ? updated : r
                                          )
                                        );
                                        setEditingRequirementId(null);
                                      } catch (err) {
                                        console.error('Update requirement failed', err);
                                      }
                                    }}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h4 className="font-medium text-gray-900">{req.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRequirementId(req.requirement_id);
                              setEditingRequirementDraft({
                                title: req.title,
                                description: req.description,
                                priority: req.priority,
                                status: req.status,
                              });
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Generation */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Requirements Assistant
              </CardTitle>
              <CardDescription>Generate requirements from your project description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[100px] bg-white"
                placeholder="Describe what you want AI to help with: Generate functional requirements, create acceptance criteria, suggest non-functional requirements..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-blue-500 to-indigo-500">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Requirements</>}
                </Button>
                <Button variant="outline" onClick={() => handleGenerate('Generate functional requirements based on the project brief')}>
                  <Wand2 className="mr-2 h-4 w-4" /> Auto-Generate FR
                </Button>
                <Button variant="outline" onClick={() => handleGenerate('Generate non-functional requirements (performance, security, scalability)')}>
                  <Shield className="mr-2 h-4 w-4" /> Auto-Generate NFR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PhaseWrapper>
    );
  }

  // ============================================
  // VALIDATION PHASE
  // ============================================
  if (phaseId === 'validation') {
    return (
      <PhaseWrapper>
        <ValidationPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          content={phaseMarkdown}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // DESIGN PHASE (PlantUML-based)
  // ============================================
  if (phaseId === 'design') {
    return (
      <PhaseWrapper>
        <DesignPhase
          projectId={id || ''}
          onOpenCanvas={handleOpenCanvas}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // SYSTEM DESIGN PHASE (Legacy)
  // ============================================
  if (phaseId === 'design_architecture') {
    return (
      <PhaseWrapper>
        <SystemDesignPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onOpenCanvas={handleOpenCanvas}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // DEVELOPMENT PHASE
  // ============================================
  if (phaseId === 'development') {
    return (
      <PhaseWrapper>
        <DevelopmentPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // FINAL SUMMARY PHASE
  // ============================================
  if (phaseId === 'summary') {
    return (
      <PhaseWrapper>
        <FinalSummaryPhase
          projectId={id || ''}
          projectName={project?.name || ''}
          phaseStatus={phaseStatus}
          stats={{
            requirements: requirements.length,
            tasks: tasks.length,
            artifacts: artifacts.length,
            progress: Math.round((Object.values(phaseStatus).filter(s => s === 'completed').length / phaseConfigs.length) * 100),
          }}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // LEGACY TASKS PHASE - Keep for backwards compatibility
  // ============================================
  if (phaseId === 'tasks' || phaseId === 'tasks_legacy') {
    const completedCount = tasks.filter((t) => (localTaskStatus[t.task_id] || t.status || '').toLowerCase() === 'completed').length;
    const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);
    
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-200/30 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Button>
              <div className="text-right">
                <p className="text-xs uppercase text-gray-500 tracking-wider">Phase</p>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Tasks & Timeline
                </h1>
                <p className="text-sm text-gray-500">{project?.name}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ListChecks className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                    <p className="text-xs text-gray-500">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
                    <p className="text-xs text-gray-500">Est. Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{progressPct}%</p>
                    <p className="text-xs text-gray-500">Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Task Management */}
            <div className="lg:col-span-1 space-y-4">
              {/* Add Task Card */}
              <Card className="border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4 text-purple-500" />
                    Add New Task
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Task title..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                    placeholder="Description..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        value={newTask.start_date}
                        onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                    <select
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    >
                      <option value="planned">📋 Planned</option>
                      <option value="in_progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Dependencies (task titles or IDs, comma separated)</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="e.g. Design UI, Implement API"
                      value={newTask.dependencies}
                      onChange={(e) => setNewTask({ ...newTask, dependencies: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                      onClick={async () => {
                        if (!id || !newTask.title.trim()) return;
                        setCreatingTask(true);
                        try {
                          const dependencies = (newTask.dependencies || '')
                            .split(',')
                            .map((d) => d.trim())
                            .filter(Boolean);

                          const payload: any = {
                            title: newTask.title,
                            description: newTask.description,
                            start_date: newTask.start_date || undefined,
                            due_date: newTask.due_date || undefined,
                            priority: newTask.priority,
                            status: newTask.status,
                            dependencies,
                            tags: newTask.milestone ? ['milestone'] : [],
                          };
                          const created = await api.createTask(id, payload);
                          setTasks((prev) => [created, ...prev]);
                          setNewTask({
                            title: '',
                            description: '',
                            start_date: '',
                            due_date: '',
                            priority: 'medium',
                            status: 'planned',
                            dependencies: '',
                            milestone: false,
                          });
                        } catch (err) {
                          console.error('Create task failed', err);
                        } finally {
                          setCreatingTask(false);
                        }
                      }}
                      disabled={creatingTask || !newTask.title.trim()}
                    >
                      {creatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Task'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!id) return;
                        setAiAddingTasks(true);
                        try {
                          await api.generateProject(id, {
                            detail_level: 'light',
                            include_tasks: true,
                            regenerate_requirements: false,
                            generate_srs: false,
                            generate_risks: false,
                            generate_costs: false,
                          });
                          const refreshed = await api.getTasks(id);
                          setTasks(refreshed);
                        } catch (err) {
                          console.error('AI task gen failed', err);
                        } finally {
                          setAiAddingTasks(false);
                        }
                      }}
                      disabled={aiAddingTasks}
                    >
                      {aiAddingTasks ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-1" /> AI
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task List */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Task List</CardTitle>
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value as any)}
                    >
                      <option value="all">All</option>
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{completedCount} of {tasks.length} completed</p>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
                  {tasks.filter((task) => taskFilter === 'all' || (localTaskStatus[task.task_id] || task.status || '').toLowerCase() === taskFilter).map((task) => {
                    const taskStatus = (localTaskStatus[task.task_id] || task.status || '').toLowerCase();
                    const done = taskStatus === 'completed';
                    const priorityColors: Record<string, string> = { high: 'border-l-red-500', medium: 'border-l-amber-500', low: 'border-l-emerald-500' };
                    return (
                      <div
                        key={task.task_id}
                        className={`p-3 rounded-lg border-l-4 ${priorityColors[task.priority] || 'border-l-gray-300'} bg-white border border-gray-100 hover:shadow-md transition-shadow cursor-pointer ${done ? 'opacity-60' : ''}`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={(e) => { e.stopPropagation(); toggleLocalTaskStatus(task.task_id); }}
                            className="mt-1 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                            <p className="text-xs text-gray-500 truncate">{task.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.due_date && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {task.estimate_hours > 0 && (
                                <span className="text-xs text-gray-400">{task.estimate_hours}h</span>
                              )}
                            </div>
                          </div>
                          <Edit3 className="h-4 w-4 text-gray-300 hover:text-gray-500" onClick={(e) => { e.stopPropagation(); setEditingTask(task.task_id); }} />
                        </div>
                      </div>
                    );
                  })}
                  {!tasks.length && <p className="text-sm text-gray-500 text-center py-4">No tasks yet. Add one above!</p>}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Gantt Chart & Matrix */}
            <div className="lg:col-span-2 space-y-4">
              {/* Enhanced Gantt Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      <CardTitle>Project Timeline</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setGanttViewMode('chart')} className={`px-2 py-1 rounded text-xs ${ganttViewMode === 'chart' ? 'bg-white shadow' : ''}`}>Chart</button>
                        <button onClick={() => setGanttViewMode('list')} className={`px-2 py-1 rounded text-xs ${ganttViewMode === 'list' ? 'bg-white shadow' : ''}`}>List</button>
                        <button onClick={() => setGanttViewMode('board')} className={`px-2 py-1 rounded text-xs ${ganttViewMode === 'board' ? 'bg-white shadow' : ''}`}>Board</button>
                      </div>
                      <select className="text-xs border border-gray-200 rounded-lg px-2 py-1" value={ganttScale} onChange={(e) => setGanttScale(e.target.value as any)}>
                        <option value="auto">Auto</option>
                        <option value="2w">2 Weeks</option>
                        <option value="1m">1 Month</option>
                        <option value="3m">3 Months</option>
                        <option value="6m">6 Months</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setGanttZoom(Math.max(50, ganttZoom - 25))} className="p-1 hover:bg-gray-100 rounded"><ZoomOut className="h-4 w-4" /></button>
                        <span className="text-xs text-gray-500 w-10 text-center">{ganttZoom}%</span>
                        <button onClick={() => setGanttZoom(Math.min(200, ganttZoom + 25))} className="p-1 hover:bg-gray-100 rounded"><ZoomIn className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ganttViewMode === 'chart' && (
                    <div className="relative border border-gray-200 rounded-xl bg-gradient-to-b from-gray-50 to-white p-4 overflow-x-auto" style={{ minHeight: Math.max(300, ganttData.height), transform: `scale(${ganttZoom / 100})`, transformOrigin: 'top left' }}>
                      <div className="min-w-[800px]">
                        {/* Timeline Header */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-2 border-b border-gray-200">
                          {Array.from({ length: 7 }).map((_, idx) => {
                            const date = new Date(ganttData.start.getTime() + ((ganttData.end.getTime() - ganttData.start.getTime()) * idx) / 6);
                            return <span key={idx} className="font-medium">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
                          })}
                        </div>
                        {/* Task Bars */}
                        <div className="space-y-3">
                          {ganttData.bars.map((bar, idx) => {
                            const task = tasks.find(t => t.task_id === bar.id);
                            return (
                              <div key={bar.id} className="flex items-center gap-3">
                                <div className="w-32 flex-shrink-0">
                                  <p className="text-xs font-medium text-gray-700 truncate">{bar.title}</p>
                                  <p className="text-[10px] text-gray-400">{task?.estimate_hours || 0}h</p>
                                </div>
                                <div className="flex-1 relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                                  <div
                                    className="absolute h-full rounded-lg transition-all duration-300 cursor-pointer hover:opacity-80"
                                    style={{ left: `${bar.x}%`, width: `${Math.max(8, bar.width)}%`, background: `linear-gradient(135deg, ${bar.color}, ${bar.color}dd)` }}
                                    onClick={() => setSelectedTask(task || null)}
                                  >
                                    <div className="h-full flex items-center justify-center">
                                      <span className="text-[10px] text-white font-medium truncate px-2">{bar.title}</span>
                                    </div>
                                  </div>
                                  {bar.isMilestone && (
                                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${bar.x + bar.width}%` }}>
                                      <div className="w-3 h-3 bg-orange-500 rotate-45 transform"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {!ganttData.bars.length && (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Calendar className="h-12 w-12 mb-2 opacity-50" />
                            <p className="text-sm">No tasks with dates yet</p>
                            <p className="text-xs">Add tasks with start/due dates to see the timeline</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {ganttViewMode === 'board' && (
                    <div className="grid grid-cols-3 gap-4">
                      {['planned', 'in_progress', 'completed'].map((status) => (
                        <div key={status} className="bg-gray-50 rounded-xl p-3">
                          <h4 className="font-medium text-sm text-gray-700 mb-3 capitalize">{status.replace('_', ' ')}</h4>
                          <div className="space-y-2">
                            {tasks.filter(t => (localTaskStatus[t.task_id] || t.status || '').toLowerCase() === status).map(task => (
                              <div key={task.task_id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <p className="text-sm font-medium">{task.title}</p>
                                <p className="text-xs text-gray-500 truncate">{task.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {ganttViewMode === 'list' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2 font-medium text-gray-600">Task</th>
                            <th className="text-left p-2 font-medium text-gray-600">Status</th>
                            <th className="text-left p-2 font-medium text-gray-600">Priority</th>
                            <th className="text-left p-2 font-medium text-gray-600">Start</th>
                            <th className="text-left p-2 font-medium text-gray-600">Due</th>
                            <th className="text-left p-2 font-medium text-gray-600">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map(task => (
                            <tr key={task.task_id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-2">{task.title}</td>
                              <td className="p-2"><Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'secondary'}>{task.status}</Badge></td>
                              <td className="p-2 capitalize">{task.priority}</td>
                              <td className="p-2 text-gray-500">{task.start_date ? new Date(task.start_date).toLocaleDateString() : '-'}</td>
                              <td className="p-2 text-gray-500">{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                              <td className="p-2 text-gray-500">{task.estimate_hours || 0}h</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Eisenhower Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Grid2X2 className="h-4 w-4 text-blue-500" />
                    Priority Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Do First', color: 'bg-red-50 border-red-200', tasks: matrixBuckets.urgentImportant, icon: '🔥' },
                      { label: 'Schedule', color: 'bg-blue-50 border-blue-200', tasks: matrixBuckets.notUrgentImportant, icon: '📅' },
                      { label: 'Delegate', color: 'bg-amber-50 border-amber-200', tasks: matrixBuckets.urgentNotImportant, icon: '👥' },
                      { label: 'Eliminate', color: 'bg-gray-50 border-gray-200', tasks: matrixBuckets.notUrgentNotImportant, icon: '🗑️' },
                    ].map(({ label, color, tasks: bucketTasks, icon }) => (
                      <div key={label} className={`${color} border rounded-xl p-3`}>
                        <p className="font-medium text-sm mb-2">{icon} {label}</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {bucketTasks.length ? bucketTasks.map(task => (
                            <p key={task.task_id} className="text-xs text-gray-600 truncate">• {task.title}</p>
                          )) : <p className="text-xs text-gray-400">No tasks</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Actions */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm text-purple-900">AI Quick Actions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="bg-white" onClick={() => {
                      const updated = tasks.map((t, idx) => {
                        const start = t.start_date ? new Date(t.start_date) : new Date(Date.now() + idx * 86400000);
                        const end = t.due_date ? new Date(t.due_date) : new Date(start.getTime() + 86400000 * 2);
                        return { ...t, start_date: start.toISOString(), due_date: end.toISOString() };
                      });
                      setTasks(updated as any);
                    }}>
                      <Calendar className="h-3 w-3 mr-1" /> Auto-fill Dates
                    </Button>
                    <Button size="sm" variant="outline" className="bg-white" onClick={() => {
                      const sorted = [...tasks].sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a.priority as keyof typeof order] || 2) - (order[b.priority as keyof typeof order] || 2);
                      });
                      setTasks(sorted);
                    }}>
                      <TrendingUp className="h-3 w-3 mr-1" /> Sort by Priority
                    </Button>
                    <Button size="sm" variant="outline" className="bg-white" onClick={() => {
                      const deduped: Record<string, Task> = {};
                      tasks.forEach((t) => { deduped[t.task_id] = t; });
                      setTasks(Object.values(deduped));
                    }}>
                      <Trash2 className="h-3 w-3 mr-1" /> Remove Duplicates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Task Detail Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
              <Card className="w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedTask.title}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{selectedTask.description || 'No description'}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Status:</span> <Badge>{selectedTask.status}</Badge></div>
                    <div><span className="text-gray-500">Priority:</span> <span className="capitalize">{selectedTask.priority}</span></div>
                    <div><span className="text-gray-500">Start:</span> {selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : 'Not set'}</div>
                    <div><span className="text-gray-500">Due:</span> {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'Not set'}</div>
                    <div><span className="text-gray-500">Estimate:</span> {selectedTask.estimate_hours || 0} hours</div>
                    <div><span className="text-gray-500">Actual:</span> {selectedTask.actual_hours || 0} hours</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ============================================
  // COST & BENEFIT PHASE - Charts & Analytics
  // ============================================
  if (phaseId === 'cost_benefit') {
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);
    const hourlyRate = project?.hourly_rate || 100;
    const totalCost = totalHours * hourlyRate;
    
    // Group costs by phase/category
    const costByPhase = tasks.reduce((acc, task) => {
      const phase = task.phase || 'General';
      if (!acc[phase]) acc[phase] = { hours: 0, cost: 0, tasks: 0 };
      acc[phase].hours += task.estimate_hours || 0;
      acc[phase].cost += (task.estimate_hours || 0) * hourlyRate;
      acc[phase].tasks += 1;
      return acc;
    }, {} as Record<string, { hours: number; cost: number; tasks: number }>);

    const costByPriority = tasks.reduce((acc, task) => {
      const priority = task.priority || 'medium';
      if (!acc[priority]) acc[priority] = { hours: 0, cost: 0 };
      acc[priority].hours += task.estimate_hours || 0;
      acc[priority].cost += (task.estimate_hours || 0) * hourlyRate;
      return acc;
    }, {} as Record<string, { hours: number; cost: number }>);

    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Button>
              <div className="text-right">
                <p className="text-xs uppercase text-gray-500 tracking-wider">Phase</p>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Cost & Benefit Analysis
                </h1>
                <p className="text-sm text-gray-500">{project?.name}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Cost Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${totalCost.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total Estimated Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalHours}h</p>
                    <p className="text-xs text-gray-500">Total Hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${hourlyRate}</p>
                    <p className="text-xs text-gray-500">Hourly Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                    <p className="text-xs text-gray-500">Billable Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cost by Phase Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-500" />
                  Cost Distribution by Phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(costByPhase).map(([phase, data]) => {
                    const percentage = totalCost > 0 ? (data.cost / totalCost) * 100 : 0;
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                    const colorIdx = Object.keys(costByPhase).indexOf(phase) % colors.length;
                    return (
                      <div key={phase} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{phase.replace('_', ' ')}</span>
                          <span className="text-gray-500">${data.cost.toLocaleString()} ({data.hours}h)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[colorIdx]} transition-all`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(costByPhase).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No cost data available. Add tasks with estimates to see breakdown.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cost by Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Cost by Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['high', 'medium', 'low'].map((priority) => {
                    const data = costByPriority[priority] || { hours: 0, cost: 0 };
                    const percentage = totalCost > 0 ? (data.cost / totalCost) * 100 : 0;
                    const colors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
                    const icons = { high: '🔴', medium: '🟡', low: '🟢' };
                    return (
                      <div key={priority} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">
                            {icons[priority as keyof typeof icons]} {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                          </span>
                          <span className="text-gray-500">${data.cost.toLocaleString()}</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-lg overflow-hidden flex items-center">
                          <div className={`h-full ${colors[priority as keyof typeof colors]} transition-all flex items-center justify-end pr-2`} style={{ width: `${Math.max(percentage, 5)}%` }}>
                            <span className="text-xs text-white font-medium">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ROI Calculator */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  ROI & Budget Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                    <p className="text-sm text-emerald-700 font-medium mb-2">Conservative Estimate</p>
                    <p className="text-3xl font-bold text-emerald-800">${Math.round(totalCost * 0.8).toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1">-20% buffer</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <p className="text-sm text-blue-700 font-medium mb-2">Base Estimate</p>
                    <p className="text-3xl font-bold text-blue-800">${totalCost.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-1">Current projection</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-700 font-medium mb-2">With Contingency</p>
                    <p className="text-3xl font-bold text-amber-800">${Math.round(totalCost * 1.25).toLocaleString()}</p>
                    <p className="text-xs text-amber-600 mt-1">+25% contingency</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Section */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                AI Cost Analysis
              </CardTitle>
              <CardDescription>Ask AI to analyze costs, suggest optimizations, or generate reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent min-h-[100px] bg-white"
                placeholder="Ask AI to analyze your project costs, suggest budget optimizations, or generate a cost breakdown report..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Costs</>}
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                  <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
              </div>
              {phaseMarkdown && (
                <div className="border border-emerald-200 rounded-lg bg-white p-4 mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ============================================
  // REQUIREMENTS VALIDATION PHASE - Side-by-Side
  // ============================================
  if (phaseId === 'requirements_validation') {
    const validationTechniques = [
      { id: 'review', name: 'Peer Review', icon: Users, description: 'Have stakeholders review requirements for accuracy' },
      { id: 'prototype', name: 'Prototyping', icon: Palette, description: 'Build quick prototypes to validate UX requirements' },
      { id: 'trace', name: 'Traceability', icon: GitBranch, description: 'Ensure all requirements link to business goals' },
      { id: 'test', name: 'Test Cases', icon: CheckSquare, description: 'Write test cases to validate requirements are testable' },
    ];

    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Button>
              <div className="text-right">
                <p className="text-xs uppercase text-gray-500 tracking-wider">Phase</p>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Requirements Validation
                </h1>
                <p className="text-sm text-gray-500">{project?.name}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.length}</p>
                    <p className="text-xs text-gray-500">Requirements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.filter(r => r.status === 'approved').length}</p>
                    <p className="text-xs text-gray-500">Validated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.filter(r => r.status === 'pending').length}</p>
                    <p className="text-xs text-gray-500">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{requirements.length ? Math.round((requirements.filter(r => r.status === 'approved').length / requirements.length) * 100) : 0}%</p>
                    <p className="text-xs text-gray-500">Coverage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-Side Validation */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Requirements List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Requirements to Validate
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto space-y-3">
                {requirements.length > 0 ? requirements.map((req) => (
                  <div key={req.requirement_id} className={`p-4 rounded-lg border-l-4 ${req.status === 'approved' ? 'border-l-emerald-500 bg-emerald-50' : req.status === 'rejected' ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{req.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={req.priority === 'high' ? 'destructive' : req.priority === 'medium' ? 'warning' : 'secondary'}>{req.priority}</Badge>
                          <Badge variant="secondary">{req.type}</Badge>
                        </div>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'destructive' : 'warning'}>{req.status}</Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No requirements found</p>
                    <p className="text-sm">Generate requirements in the Requirements Gathering phase first</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Techniques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  Validation Techniques
                </CardTitle>
                <CardDescription>Apply these techniques to validate your requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationTechniques.map((technique) => (
                  <div key={technique.id} className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <technique.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{technique.name}</p>
                        <p className="text-sm text-gray-500">{technique.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Validation */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                AI Validation Assistant
              </CardTitle>
              <CardDescription>Let AI help validate requirements for completeness, consistency, and testability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[100px] bg-white"
                placeholder="Ask AI to validate requirements, check for conflicts, or suggest acceptance criteria..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Validate Requirements</>}
                </Button>
              </div>
              {phaseMarkdown && (
                <div className="border border-blue-200 rounded-lg bg-white p-4 mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ============================================
  // DESIGN ARCHITECTURE PHASE - Diagrams Display
  // ============================================
  if (phaseId === 'design_architecture') {
    const diagramTypes = [
      { id: 'use_case', name: 'Use Case Diagram', icon: Users, description: 'Actor interactions with the system' },
      { id: 'class', name: 'Class Diagram', icon: Database, description: 'System structure and relationships' },
      { id: 'sequence', name: 'Sequence Diagram', icon: GitBranch, description: 'Object interactions over time' },
      { id: 'component', name: 'Component Diagram', icon: Layers, description: 'System component architecture' },
    ];

    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-violet-200/30 rounded-full blur-3xl"></div>
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project
              </Button>
              <div className="text-right">
                <p className="text-xs uppercase text-gray-500 tracking-wider">Phase</p>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Design & Architecture
                </h1>
                <p className="text-sm text-gray-500">{project?.name}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {latestArtifact && (
            <Card className="border border-dashed border-gray-200">
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500">Last generated</p>
                  <p className="text-sm font-semibold text-gray-900">{latestArtifact.title}</p>
                  <p className="text-xs text-gray-500">
                    {latestArtifact.metadata?.generated_at
                      ? `Updated ${new Date(latestArtifact.metadata.generated_at).toLocaleString()}`
                      : `Updated ${new Date(latestArtifact.updated_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Phase</p>
                  <p className="text-sm font-semibold text-gray-900">Design & Architecture</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-50 border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gray-600" />
                Prompt for this phase
              </CardTitle>
              <CardDescription>Custom prompt will re-run the active phase using the latest project context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                ref={unifiedPromptRef}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                rows={3}
                placeholder="E.g., 'Generate the validation checklist with stakeholder signoff steps'"
              />
              <div className="flex justify-end">
                <Button
                  disabled={isGenerating}
                  onClick={() => {
                    const prompt = unifiedPromptRef.current?.value || '';
                    if (!prompt.trim()) return;
                    handleGenerate(prompt);
                  }}
                >
                  {isGenerating ? 'Generating…' : 'Run prompt for this phase'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Created Designs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-violet-500" />
                    Created Designs & Diagrams
                  </CardTitle>
                  <CardDescription>View and manage your architectural artifacts</CardDescription>
                </div>
                <Button onClick={handleOpenCanvas} disabled={syncingCanvas} className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                  {syncingCanvas ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...</> : <><Palette className="mr-2 h-4 w-4" /> Open Canvas</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {diagramTypes.map((diagram) => {
                  const artifact = artifacts.find(a => a.type?.toLowerCase().includes(diagram.id));
                  return (
                    <div key={diagram.id} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${artifact ? 'border-violet-300 bg-violet-50' : 'border-dashed border-gray-300 bg-gray-50 hover:border-violet-300'}`} onClick={() => navigate(`/projects/${id}/uml/${diagram.id}`)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${artifact ? 'bg-violet-200' : 'bg-gray-200'}`}>
                          <diagram.icon className={`h-5 w-5 ${artifact ? 'text-violet-600' : 'text-gray-500'}`} />
                        </div>
                        {artifact && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className="font-medium text-gray-900">{diagram.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{diagram.description}</p>
                      {artifact ? (
                        <p className="text-xs text-violet-600 mt-2">✓ Created</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">Click to create</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Architecture Assistant */}
          <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                AI Architecture Assistant
              </CardTitle>
              <CardDescription>Get AI recommendations for system design and architecture decisions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent min-h-[100px] bg-white"
                placeholder="Ask AI about architecture patterns, technology choices, or design trade-offs..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Designing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Design</>}
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
              {phaseMarkdown && (
                <div className="border border-violet-200 rounded-lg bg-white p-4 mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ============================================
  // DEFAULT PHASE VIEW (Planning, Requirements Gathering, Development, etc.)
  // ============================================
  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl"></div>
          <div className="relative flex items-center justify-between flex-wrap gap-3">
            <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div className="text-right">
              <p className="text-xs uppercase text-gray-500 tracking-wider">Phase</p>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {phaseConfig.title}
              </h1>
              <p className="text-sm text-gray-500">{project.name}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Main Content */}
          <Card className="border-2 border-amber-100">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    {phaseConfig.title}
                  </CardTitle>
                  <CardDescription>{phaseConfig.description}</CardDescription>
                </div>
                <Badge variant={status === 'completed' ? 'success' : status === 'in_progress' ? 'warning' : 'secondary'}>{status.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>💡 Tip:</strong> Describe what you need from the AI for this phase. Be specific about deliverables, constraints, or questions you have.
                </p>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent min-h-[150px] resize-none"
                placeholder={`What would you like to accomplish in the ${phaseConfig.title} phase?`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working...</> : <><Sparkles className="mr-2 h-4 w-4" /> Chat with AI</>}
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </div>
              
              {/* Document Preview */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Phase Document</p>
                <div className="border border-gray-200 rounded-lg bg-white p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                  {phaseMarkdown ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <FileText className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">No document generated yet</p>
                      <p className="text-xs">Ask the AI to produce content for this phase</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Canvas Card - Only show for phases that don't have "Open Canvas" removed */}
            {phaseId !== 'design_architecture' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Visual Canvas</CardTitle>
                  <CardDescription>Edit this phase visually in the diagram studio</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={handleOpenCanvas} disabled={syncingCanvas}>
                    {syncingCanvas ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening...</> : <><Share2 className="mr-2 h-4 w-4" /> Open Canvas</>}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Phase Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Phase Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {phaseConfigs.map((cfg) => {
                  const phaseState = phaseStatus[cfg.id] || 'locked';
                  const isCurrent = cfg.id === phaseId;
                  return (
                    <div key={cfg.id} className={`flex items-center justify-between p-2 rounded-lg ${isCurrent ? 'bg-amber-50 border border-amber-200' : ''}`}>
                      <span className={`text-sm ${isCurrent ? 'font-medium text-amber-700' : 'text-gray-600'}`}>{cfg.title}</span>
                      <Badge variant={phaseState === 'completed' ? 'success' : phaseState === 'ready' ? 'default' : phaseState === 'in_progress' ? 'warning' : 'secondary'} className="text-xs">
                        {phaseState.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Requirements</span>
                  <span className="font-medium">{requirements.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tasks</span>
                  <span className="font-medium">{tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Artifacts</span>
                  <span className="font-medium">{artifacts.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PhaseDetailPage;
