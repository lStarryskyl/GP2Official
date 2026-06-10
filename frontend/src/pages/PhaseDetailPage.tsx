import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AIChatAssistant } from '@/components/AIChatAssistant';
import { Layout } from '@/components/Layout';
import { useToast } from '@/contexts/ToastContext';
import { AISuggestionsPanel } from '@/components/AISuggestionsPanel';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type {
  Artifact,
  Project,
  Task,
  Requirement,
  SandboxRunResult,
  VersionHistoryEntry,
  TraceabilityMatrixData,
  NegotiationThread as NegotiationThreadData,
  NegotiationComment,
  PhaseCompletionMeta,
} from '@/types';
import { phaseConfigs, getPhaseConfig, getNextPhase, phaseColors } from '@/constants/phases';
import { workspacePresets } from '@/constants/workspacePresets';
import { useAuthStore } from '@/store/authStore';
import ReactMarkdown from 'react-markdown';
import { PhaseNavigation } from '@/components/PhaseNavigation';
import { PhaseStickyHeader } from '@/components/PhaseStickyHeader';
import { VersionHistory } from '@/components/VersionHistory';
import { TraceabilityMatrix } from '@/components/TraceabilityMatrix';
import { NegotiationThread } from '@/components/NegotiationThread';
import {
  FeasibilityStudyPhase,
  PlanningRoadmapPhase,
  SystemDesignPhase,
  DevelopmentPhase,
  GanttChartPhase,
  FinalSummaryPhase,
  ValidationPhase,
  DesignPhase,
  TestingPhase,
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
  LayoutDashboard,
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
  Save,
  Undo2,
  Printer,
  Play,
  Copy,
  Check,
} from 'lucide-react';

type RiskRegisterRow = {
  risk: string;
  impact: string;
  likelihood: string;
  mitigation: string;
  owner: string;
};

type RiskPostureRow = {
  aspect: string;
  before: string;
  after: string;
};

type RiskDraft = {
  overview: string[];
  riskRows: RiskRegisterRow[];
  beforeAfter: RiskPostureRow[];
  actions: string[];
};

const createEmptyRiskRow = (): RiskRegisterRow => ({
  risk: '',
  impact: 'Medium',
  likelihood: 'Medium',
  mitigation: '',
  owner: '',
});

const createEmptyPostureRow = (): RiskPostureRow => ({
  aspect: '',
  before: '',
  after: '',
});

const createDefaultRiskDraft = (): RiskDraft => ({
  overview: [''],
  riskRows: [createEmptyRiskRow()],
  beforeAfter: [createEmptyPostureRow()],
  actions: [''],
});

export const PhaseDetailPage: React.FC = () => {
  const { id, phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [phaseCompletionMeta, setPhaseCompletionMeta] = useState<Record<string, PhaseCompletionMeta>>({});
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
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
  const generationInFlightRef = useRef(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseBottomTab, setPhaseBottomTab] = useState<'history' | 'traceability' | 'discussion'>('history');
  const bottomTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bottomTabUnderline, setBottomTabUnderline] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [versionEntries, setVersionEntries] = useState<VersionHistoryEntry[]>([]);
  const [traceabilityMatrix, setTraceabilityMatrix] = useState<TraceabilityMatrixData | null>(null);
  const [discussionThread, setDiscussionThread] = useState<NegotiationThreadData | null>(null);
  const [discussionComments, setDiscussionComments] = useState<NegotiationComment[]>([]);
  const [syncingCanvas, setSyncingCanvas] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [ganttZoom, setGanttZoom] = useState(100);
  const [ganttViewMode, setGanttViewMode] = useState<'chart' | 'list' | 'board'>('chart');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const ganttCanvasRef = useRef<HTMLDivElement | null>(null);
  const [ganttExporting, setGanttExporting] = useState(false);
  const [sandboxLanguage, setSandboxLanguage] = useState('python');
  const [sandboxCode, setSandboxCode] = useState('print("Hello Acorn")');
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxResult, setSandboxResult] = useState<SandboxRunResult | null>(null);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [costData, setCostData] = useState<{
    phases: { name: string; cost: number; hours: number }[];
    totalCost: number;
    totalHours: number;
    hourlyRate: number;
  } | null>(null);
  const [customCostItems, setCustomCostItems] = useState<{
    id: string;
    description: string;
    cost: number;
    benefit: number;
    currency: 'USD' | 'JOD';
  }[]>([]);
  const [newCostItem, setNewCostItem] = useState({
    description: '',
    cost: '',
    benefit: '',
    currency: 'USD' as 'USD' | 'JOD',
  });
  const [useCustomRoi, setUseCustomRoi] = useState(false);
  const [manualCostSlices, setManualCostSlices] = useState<{ id: string; label: string; cost: number; hours: number }[]>([]);
  const [useManualCostSlices, setUseManualCostSlices] = useState(false);
  const [editingCostSlices, setEditingCostSlices] = useState(false);
  const [manualSliceDraft, setManualSliceDraft] = useState({ label: '', cost: '', hours: '' });
  const [teamSizeMultiplier, setTeamSizeMultiplier] = useState(1);
  const [roleMix, setRoleMix] = useState({
    junior: 0,
    mid: 0,
    senior: 0,
    architect: 0,
    pm: 0,
  });
  const phaseConfig = getPhaseConfig(phaseId || '');

  const [requirementDraft, setRequirementDraft] = useState({
    type: 'functional',
    title: '',
    description: '',
    priority: 'medium',
    status: 'proposed',
  });
  const [editingRequirementId, setEditingRequirementId] = useState<string | null>(null);
  const [savedReqId, setSavedReqId] = useState<string | null>(null);
  const [phaseContentKey, setPhaseContentKey] = useState(0);
  const [editingRequirementDraft, setEditingRequirementDraft] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'proposed',
  });
  const [isEditingRisks, setIsEditingRisks] = useState(false);
  const [riskDraft, setRiskDraft] = useState<RiskDraft>(createDefaultRiskDraft());
  const [savingRisks, setSavingRisks] = useState(false);
  const { user } = useAuthStore();
  const userAuthority = user?.role_authority || 0;
  const canTriggerAi = userAuthority >= 3;

  const handleUpdateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      const updated = await api.updateTask(taskId, patch);
      setTasks((prev) => prev.map((t) => (t.task_id === taskId ? updated : t)));
    } catch (err) {
      console.error('Update task failed', err);
    }
  };

  const handleSyncRequirements = async () => {
    if (!id) return;
    try {
      const latest = await api.getRequirements(id);
      setRequirements(latest);
    } catch (err) {
      console.error('Failed to sync requirements from backend', err);
    }
  };

  const latestArtifact = useMemo(() => {
    if (!phaseId) return null;
    return artifacts.find((art) => art.type === `PHASE_${phaseId.toUpperCase()}`);
  }, [artifacts, phaseId]);

  const phaseMarkdown = latestArtifact?.content_json?.markdown || '';
  const phaseRawMarkdown = latestArtifact?.content_json?.raw_markdown || '';

  const loadVersionHistory = useCallback(async () => {
    if (!id || !latestArtifact?.artifact_id) {
      setVersionEntries([]);
      return;
    }
    try {
      const versions = await api.getVersionHistory(id, 'artifact', latestArtifact.artifact_id, 20);
      setVersionEntries(versions);
    } catch (err) {
      console.error('Failed to load version history', err);
      setVersionEntries([]);
    }
  }, [id, latestArtifact]);

  const loadTraceability = useCallback(async () => {
    if (!id || phaseId !== 'requirements_gathering') {
      setTraceabilityMatrix(null);
      return;
    }
    try {
      const matrix = await api.getTraceabilityMatrix(id);
      setTraceabilityMatrix(matrix);
    } catch (err) {
      console.error('Failed to load traceability matrix', err);
      setTraceabilityMatrix(null);
    }
  }, [id, phaseId]);

  const loadDiscussion = useCallback(async () => {
    if (!id || !phaseId) {
      setDiscussionThread(null);
      setDiscussionComments([]);
      return;
    }
    try {
      const threads = await api.getNegotiationThreads(id);
      let thread = threads.find((item) => item.requirement_id === phaseId);
      if (!thread) {
        thread = await api.createNegotiationThread(id, {
          title: `${phaseConfig?.title || 'Phase'} Discussion`,
          description: 'Discuss requirements, changes, and decisions for this phase.',
          requirement_id: phaseId,
          status: 'open',
          priority: 'medium',
        });
      }
      const details = await api.getNegotiationThread(id, thread.id);
      setDiscussionThread(details.thread);
      setDiscussionComments(details.comments);
    } catch (err) {
      console.error('Failed to load discussion thread', err);
      setDiscussionThread(null);
      setDiscussionComments([]);
    }
  }, [id, phaseId, phaseConfig]);

  const handleCompareVersions = useCallback(async (fromVersion: number, toVersion: number) => {
    if (!id || !latestArtifact?.artifact_id) return null;
    try {
      const diff = await api.compareVersions(id, 'artifact', latestArtifact.artifact_id, fromVersion, toVersion);
      toastSuccess(diff.summary || 'Version comparison complete');
      return diff;
    } catch (err) {
      console.error('Failed to compare versions', err);
      toastError('Failed to compare versions');
      return null;
    }
  }, [id, latestArtifact, toastError, toastSuccess]);

  const handleRestoreVersion = useCallback(async (versionNumber: number) => {
    if (!id || !latestArtifact?.artifact_id) return;
    try {
      await api.restoreVersion(id, 'artifact', latestArtifact.artifact_id, versionNumber);
      toastSuccess(`Restored version ${versionNumber}`);
      const [arts, versions] = await Promise.all([
        api.getArtifacts(id),
        api.getVersionHistory(id, 'artifact', latestArtifact.artifact_id, 20),
      ]);
      setArtifacts(arts);
      setVersionEntries(versions);
    } catch (err) {
      console.error('Failed to restore version', err);
      toastError('Failed to restore version');
    }
  }, [id, latestArtifact, toastError, toastSuccess]);

  const handleCreateTraceabilityLink = useCallback(async (sourceId: string, targetId: string) => {
    if (!id) return;
    const requirement = requirements.find((item) => item.requirement_id === sourceId);
    const task = tasks.find((item) => item.task_id === targetId);
    if (!requirement || !task) return;

    try {
      await api.createTraceabilityLink(id, {
        source_type: 'requirement',
        source_id: sourceId,
        source_name: requirement.title,
        target_type: 'task',
        target_id: targetId,
        target_name: task.title,
        link_type: 'implements',
      });
      toastSuccess('Traceability link created');
      await loadTraceability();
    } catch (err) {
      console.error('Failed to create traceability link', err);
      toastError('Failed to create traceability link');
    }
  }, [id, loadTraceability, requirements, tasks, toastError, toastSuccess]);

  const handleAddDiscussionComment = useCallback(async (content: string, parentId?: string) => {
    if (!id || !discussionThread) return;
    try {
      await api.addNegotiationComment(id, discussionThread.id, {
        content,
        parent_id: parentId,
        requirement_id: phaseId,
      });
      const details = await api.getNegotiationThread(id, discussionThread.id);
      setDiscussionThread(details.thread);
      setDiscussionComments(details.comments);
    } catch (err) {
      console.error('Failed to add comment', err);
      toastError('Failed to add comment');
    }
  }, [discussionThread, id, phaseId, toastError]);

  const handleResolveDiscussion = useCallback(async (resolution: string) => {
    if (!id || !discussionThread) return;
    try {
      const thread = await api.resolveNegotiationThread(id, discussionThread.id, resolution);
      setDiscussionThread(thread);
      const details = await api.getNegotiationThread(id, discussionThread.id);
      setDiscussionComments(details.comments);
      toastSuccess('Discussion resolved');
    } catch (err) {
      console.error('Failed to resolve discussion', err);
      toastError('Failed to resolve discussion');
    }
  }, [discussionThread, id, toastError, toastSuccess]);

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
        setPhaseCompletionMeta(proj.phase_completion_meta ?? {});
        setTasks(taskData);
        setRequirements(reqData);
      } catch (err) {
        setError('Failed to load phase info');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [id]);

  // Recalculate cost data locally whenever tasks, roleMix, or teamSizeMultiplier change
  // (no API calls needed — this is a pure client-side derivation)
  useEffect(() => {
    if (!project || tasks.length === 0) return;

    const baseRate = project.hourly_rate || 100;
    const roleRates = { junior: 50, mid: 80, senior: 120, architect: 150, pm: 100 };
    const totalRoleCount =
      roleMix.junior + roleMix.mid + roleMix.senior + roleMix.architect + roleMix.pm;
    const blendedRate = totalRoleCount
      ? (
        roleMix.junior * roleRates.junior +
        roleMix.mid * roleRates.mid +
        roleMix.senior * roleRates.senior +
        roleMix.architect * roleRates.architect +
        roleMix.pm * roleRates.pm
      ) / totalRoleCount
      : baseRate;
    const hourlyRate = blendedRate * teamSizeMultiplier;

    const phaseGroups: Record<string, { hours: number; tasks: number }> = {};
    tasks.forEach((task: Task) => {
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

    const totalHours = tasks.reduce((sum: number, t: Task) => sum + (t.estimate_hours || 0), 0);
    setCostData({
      phases,
      totalCost: totalHours * hourlyRate,
      totalHours,
      hourlyRate,
    });
  }, [project, tasks, teamSizeMultiplier, roleMix]);

  useEffect(() => {
    if (phaseBottomTab === 'history') {
      loadVersionHistory();
      return;
    }
    if (phaseBottomTab === 'traceability') {
      loadTraceability();
      return;
    }
    if (phaseBottomTab === 'discussion') {
      loadDiscussion();
    }
  }, [phaseBottomTab, loadVersionHistory, loadTraceability, loadDiscussion]);

  useEffect(() => {
    if (phaseBottomTab === 'history') {
      loadVersionHistory();
      return;
    }
    if (phaseBottomTab === 'traceability') {
      loadTraceability();
      return;
    }
    if (phaseBottomTab === 'discussion') {
      loadDiscussion();
    }
  }, [phaseBottomTab, loadVersionHistory, loadTraceability, loadDiscussion]);

  // Auto-generate phase content on first visit if no content exists
  const autoGenerateTriggeredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!id || !phaseId || isLoading || isGenerating || !canTriggerAi) return;

    // Skip phases that don't support auto-generation
    const autoGenPhases = ['planning', 'feasibility_study', 'requirements_gathering', 'validation', 'design', 'development'];
    if (!autoGenPhases.includes(phaseId)) return;

    // Check if we already have content for this phase
    const hasContent = artifacts.some(
      (art) => art.type === `PHASE_${phaseId.toUpperCase()}` && art.content_json?.markdown
    );

    // Check if we already triggered auto-generation for this phase in this session
    const cacheKey = `${id}-${phaseId}`;
    if (hasContent || autoGenerateTriggeredRef.current.has(cacheKey)) return;

    // Mark as triggered and auto-generate
    autoGenerateTriggeredRef.current.add(cacheKey);
    handleGenerate(`Auto-generate comprehensive ${phaseId.replace('_', ' ')} content for this project`);
  }, [id, phaseId, isLoading, artifacts, canTriggerAi]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }
      event.preventDefault();
      shiftTimeline(event.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const nestedDiscussionComments = useMemo(() => {
    const byId = new Map(discussionComments.map((comment) => [comment.id, { ...comment, replies: [] as any[] }]));
    const roots: any[] = [];

    discussionComments.forEach((comment) => {
      const current = byId.get(comment.id);
      if (!current) return;
      if (comment.parent_id && byId.has(comment.parent_id)) {
        byId.get(comment.parent_id)!.replies.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }, [discussionComments]);

  // Copy-to-clipboard helper
  const [copied, setCopied] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [editNoteDialogOpen, setEditNoteDialogOpen] = useState(false);
  const [editNoteValue, setEditNoteValue] = useState('');
  const [isSavingEditedNote, setIsSavingEditedNote] = useState(false);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [isUndoingComplete, setIsUndoingComplete] = useState(false);

  const currentCompletionMeta = phaseId ? phaseCompletionMeta[phaseId] : undefined;
  const canManageCompletion = useMemo(() => {
    if (!currentCompletionMeta) return false;
    if (userAuthority >= 4) return true;
    return !!user && currentCompletionMeta.completed_by === user.id;
  }, [currentCompletionMeta, user, userAuthority]);

  const handleOpenEditNoteDialog = useCallback(() => {
    setEditNoteValue((currentCompletionMeta?.notes as string) || '');
    setEditNoteDialogOpen(true);
  }, [currentCompletionMeta]);

  const handleConfirmEditNote = useCallback(async () => {
    if (!id || !phaseId) return;
    setIsSavingEditedNote(true);
    try {
      const result = await api.editPhaseCompletionNote(id, phaseId, editNoteValue.trim());
      setPhaseStatus(result.phases);
      setPhaseCompletionMeta(result.completion_meta);
      toastSuccess('Completion note updated');
      setEditNoteDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to edit completion note', err);
      toastError(err?.response?.data?.detail || 'Failed to edit completion note');
    } finally {
      setIsSavingEditedNote(false);
    }
  }, [id, phaseId, editNoteValue, toastSuccess, toastError]);

  const handleConfirmUndoComplete = useCallback(async () => {
    if (!id || !phaseId) return;
    setIsUndoingComplete(true);
    try {
      const result = await api.undoPhaseCompletion(id, phaseId);
      setPhaseStatus(result.phases);
      setPhaseCompletionMeta(result.completion_meta);
      toastSuccess(`${phaseConfig?.title || 'Phase'} completion undone`);
      setUndoDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to undo completion', err);
      toastError(err?.response?.data?.detail || 'Failed to undo completion');
    } finally {
      setIsUndoingComplete(false);
    }
  }, [id, phaseId, phaseConfig, toastSuccess, toastError]);

  const handleOpenCompleteDialog = useCallback(() => {
    setCompletionNotes('');
    setCompletionDialogOpen(true);
  }, []);

  const handleConfirmMarkComplete = useCallback(async () => {
    if (!id || !phaseId) return;
    setIsMarkingComplete(true);
    try {
      const result = await api.markPhaseComplete(id, phaseId, completionNotes.trim());
      setPhaseStatus(result.phases);
      setPhaseCompletionMeta(result.completion_meta);
      toastSuccess(`${phaseConfig?.title || 'Phase'} marked as complete`);
      setCompletionDialogOpen(false);
      setCompletionNotes('');
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 1200);
    } catch (err) {
      console.error('Failed to mark phase complete', err);
      toastError('Failed to mark phase as complete');
    } finally {
      setIsMarkingComplete(false);
    }
  }, [id, phaseId, phaseConfig, completionNotes, toastSuccess, toastError]);

  const handlePrintPhase = useCallback(() => {
    window.print();
  }, []);

  const handleCopyContent = useCallback(() => {
    const text = phaseMarkdown || phaseRawMarkdown;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toastSuccess('Content copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [phaseMarkdown, phaseRawMarkdown, toastSuccess]);

  const renderRawMarkdownDisclosure = () => {
    if (!phaseRawMarkdown || phaseRawMarkdown === phaseMarkdown) {
      return null;
    }
    return (
      <details className="mt-3 text-xs text-gray-500">
        <summary className="cursor-pointer font-medium text-gray-600">
          Show raw AI output
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--brand-700)] bg-[var(--brand-700)]/50 p-3 text-[11px] leading-relaxed text-gray-300 overflow-x-auto">
          {phaseRawMarkdown}
        </pre>
      </details>
    );
  };

  const PIPELINE_STEPS = ['Analyzing', 'Structuring', 'Writing', 'Finalising'];

  useEffect(() => {
    if (!isGenerating) { setPipelineStep(0); return; }
    const id = setInterval(() => {
      setPipelineStep(prev => Math.min(prev + 1, PIPELINE_STEPS.length - 1));
    }, 1800);
    return () => clearInterval(id);
  }, [isGenerating]);

  // Measure active bottom tab for DOM-driven sliding underline
  useEffect(() => {
    const allTabs = ['history', 'traceability', 'discussion'];
    const visibleTabs = allTabs.filter(t => t !== 'traceability' || phaseId === 'requirements_gathering');
    const idx = visibleTabs.indexOf(phaseBottomTab as string);
    const el = bottomTabRefs.current[idx];
    if (el) {
      setBottomTabUnderline({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [phaseBottomTab, phaseId]);

  const renderPipelineIndicator = () => {
    if (!isGenerating) return null;
    return (
      <div className="rounded-xl p-5 mt-4 animate-slide-in-up" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(26,111,212,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          {PIPELINE_STEPS.map((label, i) => {
            const isActive = i === pipelineStep;
            const isDone = i < pipelineStep;
            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${isActive ? 'animate-pipeline-pulse' : ''}`}
                    style={{
                      background: isActive ? 'var(--blue-500)' : isDone ? 'rgba(26,111,212,0.4)' : 'rgba(26,46,69,0.4)',
                      border: isActive ? '2px solid var(--blue-400)' : isDone ? '2px solid rgba(26,111,212,0.4)' : '2px solid rgba(26,46,69,0.5)',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {isDone ? '✓' : <span style={{ color: isActive ? '#fff' : '#4a6580' }}>{i + 1}</span>}
                  </div>
                  <span className="text-[11px] font-semibold transition-all duration-300" style={{ color: isActive ? 'var(--blue-400)' : isDone ? 'rgba(26,111,212,0.6)' : '#4a6580' }}>
                    {label}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: i < pipelineStep ? 'rgba(26,111,212,0.4)' : 'rgba(26,46,69,0.4)', transition: 'background 0.5s ease' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="skeleton-shimmer h-3 w-3/4" />
          <div className="skeleton-shimmer h-3 w-full" />
          <div className="skeleton-shimmer h-3 w-5/6" />
          <div className="skeleton-shimmer h-3 w-4/5" />
        </div>
      </div>
    );
  };

  const renderStreamingOverlay = () => {
    if (!isStreaming && !streamingText) return null;
    if (!isStreaming && phaseMarkdown) return null;
    return (
      <div className="rounded-xl p-5 mt-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(26,111,212,0.2)' }}>
        {/* Pipeline steps indicator */}
        <div className="flex items-center gap-3 mb-4">
          {PIPELINE_STEPS.map((label, i) => {
            const isActive = i === pipelineStep;
            const isDone = i < pipelineStep;
            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${isActive ? 'animate-pipeline-pulse' : ''}`}
                    style={{
                      background: isActive ? 'var(--blue-500)' : isDone ? 'rgba(26,111,212,0.4)' : 'rgba(26,46,69,0.4)',
                      border: isActive ? '2px solid var(--blue-400)' : isDone ? '2px solid rgba(26,111,212,0.4)' : '2px solid rgba(26,46,69,0.5)',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    {isDone ? '✓' : <span style={{ color: isActive ? '#fff' : '#4a6580' }}>{i + 1}</span>}
                  </div>
                  <span className="text-[11px] font-semibold transition-all duration-300" style={{ color: isActive ? 'var(--blue-400)' : isDone ? 'rgba(26,111,212,0.6)' : '#4a6580' }}>
                    {label}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: i < pipelineStep ? 'rgba(26,111,212,0.4)' : 'rgba(26,46,69,0.4)', transition: 'background 0.5s ease' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Shimmer skeleton while no content yet */}
        {!streamingText && (
          <div className="space-y-2">
            <div className="skeleton-shimmer h-3 w-3/4" />
            <div className="skeleton-shimmer h-3 w-full" />
            <div className="skeleton-shimmer h-3 w-5/6" />
            <div className="skeleton-shimmer h-3 w-4/5" />
          </div>
        )}

        {streamingText && (
          <div className="prose prose-sm max-w-none text-[var(--text-muted)]">
            <ReactMarkdown>{streamingText + (isStreaming ? ' ▊' : '')}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  // Simple parser for Risks phase markdown so we can render real UI components
  const parsedRisks = useMemo(() => {
    if (!phaseMarkdown || phaseId !== 'risks') {
      return null;
    }

    const lines = phaseMarkdown.split('\n');
    const overview: string[] = [];
    const riskRows: { risk: string; impact: string; likelihood: string; mitigation: string; owner: string }[] = [];
    const beforeAfter: { aspect: string; before: string; after: string }[] = [];
    const actions: string[] = [];

    let section: 'none' | 'overview' | 'register' | 'beforeAfter' | 'actions' = 'none';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        const lower = line.toLowerCase();
        if (lower.includes('risk overview')) section = 'overview';
        else if (lower.includes('risk register')) section = 'register';
        else if (lower.includes('before vs after')) section = 'beforeAfter';
        else if (lower.includes('recommended actions')) section = 'actions';
        continue;
      }

      if (section === 'overview' && (line.startsWith('- ') || line.startsWith('* '))) {
        overview.push(line.replace(/^[-*]\s*/, ''));
        continue;
      }

      if (section === 'register') {
        // Skip header/separator lines
        if (line.startsWith('| Risk') || line.startsWith('| ---')) continue;
        if (line.startsWith('|')) {
          const cols = line
            .split('|')
            .map((c: string) => c.trim())
            .filter(Boolean);
          if (cols.length >= 5) {
            const [risk, impact, likelihood, mitigation, owner] = cols;
            riskRows.push({ risk, impact, likelihood, mitigation, owner });
          }
        }
        continue;
      }

      if (section === 'beforeAfter') {
        if (line.startsWith('| Aspect') || line.startsWith('| ---')) continue;
        if (line.startsWith('|')) {
          const cols = line
            .split('|')
            .map((c) => c.trim())
            .filter(Boolean);
          if (cols.length >= 3) {
            const [aspect, before, after] = cols;
            beforeAfter.push({ aspect, before, after });
          }
        }
        continue;
      }

      if (section === 'actions' && line.startsWith('-')) {
        const cleaned = line.replace(/^-\s*\[.?\]\s*/, '').trim();
        if (cleaned) actions.push(cleaned);
      }
    }

    return { overview, riskRows, beforeAfter, actions };
  }, [phaseMarkdown, phaseId]);

  useEffect(() => {
    if (phaseId !== 'risks' || !parsedRisks || isEditingRisks) {
      return;
    }
    setRiskDraft({
      overview: parsedRisks.overview.length ? [...parsedRisks.overview] : [''],
      riskRows: parsedRisks.riskRows.length
        ? parsedRisks.riskRows.map((row) => ({ ...row }))
        : [createEmptyRiskRow()],
      beforeAfter: parsedRisks.beforeAfter.length
        ? parsedRisks.beforeAfter.map((row) => ({ ...row }))
        : [createEmptyPostureRow()],
      actions: parsedRisks.actions.length ? [...parsedRisks.actions] : [''],
    });
  }, [phaseId, parsedRisks, isEditingRisks]);

  const unifiedPromptRef = useRef<HTMLTextAreaElement>(null);
  const regenerateInputRef = useRef<HTMLInputElement>(null);

  const hydrateRiskDraft = (source: RiskDraft | null) => {
    if (source) {
      return {
        overview: source.overview.length ? [...source.overview] : [''],
        riskRows: source.riskRows.length ? source.riskRows.map((row) => ({ ...row })) : [createEmptyRiskRow()],
        beforeAfter: source.beforeAfter.length ? source.beforeAfter.map((row) => ({ ...row })) : [createEmptyPostureRow()],
        actions: source.actions.length ? [...source.actions] : [''],
      };
    }
    return createDefaultRiskDraft();
  };

  const buildRiskMarkdown = (draft: RiskDraft) => {
    const lines: string[] = [];
    const overviewItems = draft.overview.map((entry) => entry.trim()).filter(Boolean);
    lines.push('# Risk Overview', '');
    if (overviewItems.length) {
      overviewItems.forEach((item) => lines.push(`- ${item}`));
    } else {
      lines.push('- Summary pending user input');
    }
    lines.push('', '## Risk Register', '| Risk | Impact | Likelihood | Mitigation | Owner |', '| --- | --- | --- | --- | --- |');

    const registerRows = draft.riskRows.filter(
      (row) => row.risk.trim() || row.mitigation.trim() || row.owner.trim() || row.impact.trim() || row.likelihood.trim()
    );
    (registerRows.length ? registerRows : draft.riskRows).forEach((row) => {
      lines.push(
        `| ${row.risk.trim() || '-'} | ${row.impact.trim() || '-'} | ${row.likelihood.trim() || '-'} | ${row.mitigation.trim() || '-'} | ${row.owner.trim() || '-'} |`
      );
    });

    lines.push('', '## Before vs After Mitigation', '| Aspect | Before | After |', '| --- | --- | --- |');
    const postureRows = draft.beforeAfter.filter((row) => row.aspect.trim() || row.before.trim() || row.after.trim());
    (postureRows.length ? postureRows : draft.beforeAfter).forEach((row) => {
      lines.push(`| ${row.aspect.trim() || '-'} | ${row.before.trim() || '-'} | ${row.after.trim() || '-'} |`);
    });

    lines.push('', '## Recommended Actions', '');
    const actions = draft.actions.map((entry) => entry.trim()).filter(Boolean);
    (actions.length ? actions : ['Define next mitigation actions']).forEach((action) => {
      lines.push(`- [ ] ${action}`);
    });

    return lines.join('\n');
  };

  const handleStartRiskEdit = () => {
    if (phaseId !== 'risks') return;
    setRiskDraft(hydrateRiskDraft(parsedRisks));
    setIsEditingRisks(true);
  };

  const handleCancelRiskEdit = () => {
    setIsEditingRisks(false);
    setRiskDraft(hydrateRiskDraft(parsedRisks));
  };

  const handleSaveRisks = async () => {
    if (!id || !latestArtifact) return;
    setSavingRisks(true);
    setError(null);
    try {
      const markdown = buildRiskMarkdown(riskDraft);
      const updated = await api.updateArtifact(id, latestArtifact.artifact_id, {
        title: latestArtifact.title,
        content_json: { ...(latestArtifact.content_json || {}), markdown },
        metadata: latestArtifact.metadata,
      });
      setArtifacts((prev) =>
        prev.map((artifact) => (artifact.artifact_id === updated.artifact_id ? updated : artifact))
      );
      setIsEditingRisks(false);
    } catch (err) {
      console.error('Failed to save risk edits', err);
      setError('Unable to save risk updates. Please try again.');
    } finally {
      setSavingRisks(false);
    }
  };

  const generateWithStreaming = (phase: string, prompt: string): Promise<void> => {
    return new Promise((resolve) => {
      setStreamingText('');
      setIsStreaming(true);
      const token = localStorage.getItem('access_token') || '';
      const url = `/api/projects/${id}/phases/${phase}/generate/stream/?prompt=${encodeURIComponent(prompt)}&token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);

      es.addEventListener('token', (event) => {
        try {
          const data = JSON.parse(event.data);
          setStreamingText((prev) => prev + (data.text || ''));
        } catch {
          setStreamingText((prev) => prev + (event.data || ''));
        }
      });

      es.addEventListener('done', () => {
        es.close();
        setIsStreaming(false);
        resolve();
      });

      es.addEventListener('error', (event) => {
        es.close();
        setIsStreaming(false);
        resolve();
      });

      es.onerror = () => {
        es.close();
        setIsStreaming(false);
        resolve();
      };
    });
  };

  const handleGenerate = async (prompt?: string) => {
    if (!id || !phaseId) return;
    if (generationInFlightRef.current) return;
    if (!canTriggerAi) {
      setError('Your role cannot run AI generations. Ask a Program Manager for elevated access.');
      return;
    }

    generationInFlightRef.current = true;
    setIsGenerating(true);
    setIsStreaming(false);
    setStreamingText('');
    setError(null);

    try {
      let userPrompt = prompt || input;

      // For the Cost & Benefit phase, append the current scenario so AI explanations
      // match the charts/cards (effective cost, benefit, ROI, custom toggle, and role usage).
      if (phaseId === 'cost_benefit') {
        const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);
        const baseRate = project?.hourly_rate || 100;
        const roleRates = { junior: 50, mid: 80, senior: 120, architect: 150, pm: 100 };
        const totalRoleCount =
          roleMix.junior + roleMix.mid + roleMix.senior + roleMix.architect + roleMix.pm;
        const blendedBaseHourlyRate = totalRoleCount
          ? (
            roleMix.junior * roleRates.junior +
            roleMix.mid * roleRates.mid +
            roleMix.senior * roleRates.senior +
            roleMix.architect * roleRates.architect +
            roleMix.pm * roleRates.pm
          ) / totalRoleCount
          : baseRate;
        const effectiveHourlyRate = blendedBaseHourlyRate * teamSizeMultiplier;
        const baseTotalCost = totalHours * effectiveHourlyRate;
        const baseEstimatedBenefit = baseTotalCost * 2;

        // Summarize how many tasks are assigned to each role so AI considers per-task roles
        const roleCounts = tasks.reduce((acc, t) => {
          const r = (t.role || 'unassigned').toLowerCase();
          acc[r] = (acc[r] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const roleUsageSummary = Object.keys(roleCounts).length
          ? Object.entries(roleCounts)
            .map(([role, count]) => `${role}: ${count} tasks`)
            .join(', ')
          : 'no explicit roles set on tasks (using blended role mix only)';

        const totalCustomCost = customCostItems.reduce((sum, item) => sum + item.cost, 0);
        const totalCustomBenefit = customCostItems.reduce((sum, item) => sum + item.benefit, 0);

        const useCustom = useCustomRoi;
        const effectiveCostForRoi = useCustom ? totalCustomCost : baseTotalCost;
        const effectiveBenefit = useCustom ? totalCustomBenefit : baseEstimatedBenefit;
        const roi = effectiveCostForRoi > 0 ? ((effectiveBenefit - effectiveCostForRoi) / effectiveCostForRoi) * 100 : 0;

        const scenarioSummary = `\n\n[Current cost scenario]\n` +
          `Mode: ${useCustom ? 'custom totals from manual items' : 'task estimates × project hourly rate (2× benefit assumption)'}\n` +
          `Total hours (from tasks): ${totalHours}\n` +
          `Blended base hourly rate (by roles): ${blendedBaseHourlyRate.toFixed(2)} (project base: ${baseRate})\n` +
          `Team size multiplier: ${teamSizeMultiplier.toFixed(2)} (effective hourly rate: ${effectiveHourlyRate.toFixed(2)})\n` +
          `Effective total cost: ${effectiveCostForRoi.toFixed(2)}\n` +
          `Effective estimated benefit: ${effectiveBenefit.toFixed(2)}\n` +
          `Effective ROI: ${roi.toFixed(1)}%\n` +
          `Custom items count: ${customCostItems.length}\n` +
          `Per-task role usage: ${roleUsageSummary}`;

        userPrompt = `${userPrompt}\n${scenarioSummary}`;
      }

      // Use the authenticated API client as the single source of truth for generation.
      // The previous EventSource-first path could not send Authorization headers, silently
      // failed on first touch, and then triggered a second generation request.
      const response = await api.generatePhase(id, phaseId, userPrompt);
      setPhaseStatus(response.phase_status);
      const updatedArtifacts = await api.getArtifacts(id);
      setArtifacts(updatedArtifacts);
      toastSuccess(`${phaseId.replace(/_/g, ' ')} phase generated successfully`);

      // Auto-sync AI outputs into structured project fields for certain phases
      const latestPhaseArtifact = updatedArtifacts.find(
        (art) => art.type === `PHASE_${phaseId.toUpperCase()}`
      );

      if (latestPhaseArtifact && latestPhaseArtifact.content_json?.markdown) {
        const markdown = latestPhaseArtifact.content_json.markdown as string;

        if (phaseId === 'requirements_gathering') {
          // Parse requirements markdown into structured requirements and overwrite project requirements
          const lines = markdown.split('\n');
          type ReqType = 'functional' | 'non_functional';
          let current: ReqType = 'functional';
          const parsed: Partial<Requirement>[] = [];

          const priorityMap: Record<string, Requirement['priority']> = {
            low: 'low',
            medium: 'medium',
            high: 'high',
            critical: 'critical',
          } as any;

          const statusMap: Record<string, Requirement['status']> = {
            proposed: 'proposed',
            draft: 'proposed',
            'in review': 'in_review',
            review: 'in_review',
            approved: 'approved',
            implemented: 'implemented',
          } as any;

          for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            const lower = line.toLowerCase();

            if (line.startsWith('#')) {
              if (lower.includes('non-functional') || lower.includes('non functional') || lower.includes('nfr')) {
                current = 'non_functional';
              } else if (lower.includes('functional') || lower.includes('fr')) {
                current = 'functional';
              }
              continue;
            }

            if (!line.startsWith('-') && !line.startsWith('*')) continue;
            let content = line.replace(/^[-*]\s*/, '').trim();
            if (!content) continue;

            // Skip obvious meta / instructional bullets rather than real requirements
            const lowerContent = content.toLowerCase();
            if (
              // Bold headings or labels like **Purpose**, **Format**, etc.
              content.startsWith('**') ||
              // Checklists / todo style items
              content.startsWith('[') ||
              // Persona / template fields
              lowerContent.includes('purpose') ||
              lowerContent.includes('format') ||
              lowerContent.includes('example') ||
              lowerContent.includes('persona') ||
              lowerContent.includes('demographics') ||
              lowerContent.includes('goals') ||
              lowerContent.includes('pain points') ||
              lowerContent.includes('tech savviness') ||
              lowerContent.includes('quote') ||
              lowerContent.includes('action items') ||
              lowerContent.includes('story id') ||
              lowerContent.startsWith('as a ') // often instructional user story examples
            ) {
              continue;
            }

            // Optional tags: [High][Approved] Title: description
            let priority: Requirement['priority'] | undefined;
            let status: Requirement['status'] | undefined;

            const tagPattern = /^\[(.*?)\]\s*(\[(.*?)\])?/; // [tag1][tag2] ...
            const tagMatch = content.match(tagPattern);
            if (tagMatch) {
              const tag1 = (tagMatch[1] || '').toLowerCase();
              const tag2 = ((tagMatch[3] || '') as string).toLowerCase();

              if (tag1 in priorityMap) priority = priorityMap[tag1];
              if (tag1 in statusMap) status = statusMap[tag1];
              if (tag2) {
                if (tag2 in priorityMap) priority = priorityMap[tag2];
                if (tag2 in statusMap) status = statusMap[tag2];
              }

              content = content.slice(tagMatch[0].length).trim();
            }

            const [titleRaw, ...rest] = content.split(':');
            const title = (titleRaw || '').trim();
            if (!title) continue;
            const description = rest.join(':').trim() || title;

            parsed.push({
              type: current,
              title,
              description,
              priority: priority || 'medium',
              status: status || 'proposed',
            } as any);
          }

          if (parsed.length) {
            try {
              const replaced = await api.replaceRequirements(id, { requirements: parsed });
              setRequirements(replaced);
            } catch (err) {
              console.error('Failed to auto-sync requirements from phase artifact', err);
            }
          }
        } else if (phaseId === 'development') {
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
              } else if (lower.includes('system flow') || lower.includes('request flow') || lower.includes(' flow')) {
                // Treat generic "Flow" headings (e.g. "## Flow") as the flow section too
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

            // We only care about list-style lines inside known sections
            const listMatch = trimmed.match(/^([-*]|\d+\.)\s+(.*)$/);
            if (!listMatch) {
              continue;
            }

            const content = (listMatch[2] || '').trim();
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

          const lowerBody = body.toLowerCase();
          if (lowerBody.includes('market')) tags.push('market');
          if (lowerBody.includes('technical')) tags.push('technical');
          if (lowerBody.includes('economic') || lowerBody.includes('roi')) tags.push('economic');
          if (lowerBody.includes('operational')) tags.push('operational');
          if (lowerBody.includes('legal') || lowerBody.includes('compliance')) tags.push('legal');

          const newStudy = {
            id: `study_${Date.now()}`,
            title,
            body,
            tags,
            source: 'user+ai',
          };

          try {
            // Save study history
            const existing = await api.getFeasibilityStudies(id);
            const merged = [...(existing.studies || []), newStudy];
            await api.saveFeasibilityStudies(id, { studies: merged });
          } catch (err) {
            console.error('Failed to auto-sync feasibility studies from phase artifact', err);
          }

          // Additionally, try to map markdown into structured feasibility sections
          try {
            const lines = body.split('\n');
            type SectionId = 'market' | 'technical' | 'economic' | 'operational' | 'legal';
            const sectionOrder: SectionId[] = ['market', 'technical', 'economic', 'operational', 'legal'];
            const sectionMap: Record<SectionId, { label: string; description: string }[]> = {
              market: [],
              technical: [],
              economic: [],
              operational: [],
              legal: [],
            };

            let current: SectionId | null = null;
            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line) continue;
              const lower = line.toLowerCase();

              if (line.startsWith('#')) {
                // Choose section based on heading text
                if (lower.includes('market')) current = 'market';
                else if (lower.includes('technical')) current = 'technical';
                else if (lower.includes('economic')) current = 'economic';
                else if (lower.includes('operational')) current = 'operational';
                else if (lower.includes('legal') || lower.includes('compliance')) current = 'legal';
                else current = null;
                continue;
              }

              if (!current) continue;
              if (!line.startsWith('-') && !line.startsWith('*')) continue;

              const content = line.replace(/^[-*]\s*/, '').trim();
              if (!content) continue;

              const [labelRaw, descRaw] = content.split(':');
              const label = (labelRaw || '').trim() || content;
              const description = (descRaw || '').trim() || label;
              sectionMap[current].push({ label, description });
            }

            // Fetch existing sections to preserve scores/colors/titles where possible
            let existingSections: any[] = [];
            try {
              const existing = await api.getFeasibilitySections(id);
              existingSections = Array.isArray(existing.sections) ? existing.sections : [];
            } catch (err) {
              existingSections = [];
            }

            const defaultSections = [
              { id: 'market', title: 'Market Feasibility', color: 'purple' },
              { id: 'technical', title: 'Technical Feasibility', color: 'blue' },
              { id: 'economic', title: 'Economic Feasibility', color: 'blue' },
              { id: 'operational', title: 'Operational Feasibility', color: 'amber' },
              { id: 'legal', title: 'Legal / Compliance Feasibility', color: 'red' },
            ];

            const mergedSections = sectionOrder.map((id) => {
              const existing = existingSections.find((s) => s.id === id) || {};
              const parsedItems = sectionMap[id];

              const items = parsedItems.length
                ? parsedItems.map((item) => ({
                  label: item.label,
                  description: item.description,
                  status: 'partial',
                }))
                : existing.items || [];

              const base = defaultSections.find((s) => s.id === id)!;
              const score = parsedItems.length
                ? Math.min(100, (parsedItems.length / 5) * 100)
                : typeof existing.score === 'number'
                  ? existing.score
                  : 0;

              return {
                id,
                title: existing.title || base.title,
                color: existing.color || base.color,
                items,
                score,
              };
            });

            await api.saveFeasibilitySections(id, { sections: mergedSections });
          } catch (err) {
            console.error('Failed to auto-sync feasibility sections from phase artifact', err);
          }
        }
      }
      if (prompt) setInput(''); // Clear input if prompt was provided externally
    } catch (err: any) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Generation is taking longer than expected. Please try again in a moment.'
        : err.response?.data?.detail || 'Failed to generate phase output';
      setError(msg);
      toastError(msg);
    } finally {
      generationInFlightRef.current = false;
      setIsStreaming(false);
      setIsGenerating(false);
    }
  };

  const handleOpenCanvas = async () => {
    if (!id || !phaseConfig) return;
    setSyncingCanvas(true);
    setError(null);

    // Only sync for supported backend modes
    const supportedSyncModes = ['requirements', 'srs', 'costs', 'freeform'];

    try {
      // Only call sync API for supported modes
      if (supportedSyncModes.includes(phaseConfig.canvasMode)) {
        await api.syncDiagramCanvas(id, phaseConfig.canvasMode);
      }

      // Navigate to diagram studio - use freeform for unsupported modes
      const effectiveMode = supportedSyncModes.includes(phaseConfig.canvasMode) ? phaseConfig.canvasMode : 'freeform';
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

  const shiftTimeline = (days: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        const start = task.start_date ? new Date(task.start_date) : null;
        const due = task.due_date ? new Date(task.due_date) : null;
        if (!start && !due) return task;
        const shiftDate = (date: Date | null) =>
          date ? new Date(date.getTime() + days * 86400000) : null;
        const shiftedStart = shiftDate(start);
        const shiftedDue = shiftDate(due);
        return {
          ...task,
          start_date: shiftedStart ? shiftedStart.toISOString() : task.start_date,
          due_date: shiftedDue ? shiftedDue.toISOString() : task.due_date,
        };
      })
    );
  };

  const handleExportTimeline = async (mode: 'png' | 'print') => {
    if (!ganttData.bars.length || !project) return;
    setGanttExporting(true);
    try {
      const width = 1200;
      const height = Math.max(360, ganttData.height + 140);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#111827';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`${project.name} – ${phaseConfig?.title || 'Timeline'}`, 32, 40);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`Exported ${new Date().toLocaleString()}`, 32, 60);

      const labelWidth = 220;
      const timelineWidth = width - labelWidth - 80;
      const yOffset = 100;

      // Draw connectors
      ctx.strokeStyle = '#c7d2fe';
      ctx.lineWidth = 2;
      ganttData.connectors.forEach((conn) => {
        const startX = labelWidth + (conn.x1 / 100) * timelineWidth;
        const endX = labelWidth + (conn.x2 / 100) * timelineWidth;
        const startY = yOffset + conn.y1;
        const endY = yOffset + conn.y2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(startX + 20, startY, endX - 20, endY, endX, endY);
        ctx.stroke();
      });

      ganttData.bars.forEach((bar, idx) => {
        const x = labelWidth + (bar.x / 100) * timelineWidth;
        const widthPx = (Math.max(8, bar.width) / 100) * timelineWidth;
        const y = yOffset + idx * (barHeight + 16);
        ctx.fillStyle = '#0f172a';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillText(bar.title, 40, y + barHeight - 4);
        ctx.fillStyle = bar.color;
        ctx.fillRect(x, y, widthPx, barHeight);
        if (bar.isMilestone) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(x + widthPx, y);
          ctx.lineTo(x + widthPx + 8, y + barHeight / 2);
          ctx.lineTo(x + widthPx, y + barHeight);
          ctx.closePath();
          ctx.fill();
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      if (mode === 'png') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${project.name}-gantt.png`.replace(/\s+/g, '-').toLowerCase();
        link.click();
      } else {
        const win = window.open('');
        if (win) {
          win.document.write(`<img src="${dataUrl}" style="width:100%" />`);
          win.document.close();
          win.focus();
          win.print();
        }
      }
    } catch (err) {
      console.error('Failed to export Gantt', err);
    } finally {
      setGanttExporting(false);
    }
  };

  const handleRunSandbox = async () => {
    if (!sandboxCode.trim()) return;
    setSandboxRunning(true);
    try {
      const result = await api.runSandbox({
        language: sandboxLanguage,
        code: sandboxCode,
        input_text: sandboxInput || undefined,
      });
      setSandboxResult(result);
    } catch (err) {
      console.error('Sandbox execution failed', err);
      setSandboxResult({
        language: sandboxLanguage,
        stdout: '',
        stderr: 'Execution failed. Please try again later.',
        exit_code: -1,
        duration_ms: 0,
      });
    } finally {
      setSandboxRunning(false);
    }
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
      const color = status === 'completed' ? '#1A6FD4' : status === 'in_progress' ? '#F97316' : '#8899AA';
      const isMilestone = (t.tags || []).includes('milestone');
      return { id: t.task_id, title: t.title, x, width, y: 50 + idx * (barHeight + 16), color, isMilestone };
    });
    const barsById: Record<string, typeof bars[number]> = {};
    bars.forEach((bar) => {
      barsById[bar.id] = bar;
    });
    const connectors: { id: string; x1: number; x2: number; y1: number; y2: number }[] = [];
    defaults.forEach((task) => {
      const target = barsById[task.task_id];
      if (!target || !task.dependencies) return;
      task.dependencies.forEach((depId) => {
        const source = barsById[depId];
        if (!source) return;
        connectors.push({
          id: `${depId}-${task.task_id}`,
          x1: Math.min(100, source.x + source.width),
          x2: Math.max(0, target.x),
          y1: source.y + barHeight / 2,
          y2: target.y + barHeight / 2,
        });
      });
    });
    const height = 80 + bars.length * (barHeight + 16);
    return { bars, connectors, start: min, end: max, height };
  }, [tasks, localTaskStatus, ganttScale, barHeight]);

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(26,46,69,0.6)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '180px', height: '28px', borderRadius: '6px', background: 'rgba(26,46,69,0.6)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          {/* Phase header skeleton */}
          <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--brand-850)', border: '1px solid rgba(26,46,69,0.5)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(26,46,69,0.6)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '200px', height: '22px', borderRadius: '6px', background: 'rgba(26,46,69,0.6)', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '8px' }} />
                <div style={{ width: '300px', height: '14px', borderRadius: '6px', background: 'rgba(26,46,69,0.4)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          </div>
          {/* Content skeletons */}
          {[1, 2, 3].map(i => (
            <div key={i} style={{ padding: '20px', borderRadius: '14px', background: 'var(--brand-850)', border: '1px solid rgba(26,46,69,0.4)', marginBottom: '16px' }}>
              <div style={{ width: `${60 + i * 10}%`, height: '16px', borderRadius: '6px', background: 'rgba(26,46,69,0.6)', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '12px' }} />
              <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'rgba(26,46,69,0.4)', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '8px' }} />
              <div style={{ width: '80%', height: '12px', borderRadius: '6px', background: 'rgba(26,46,69,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }`}</style>
      </Layout>
    );
  }

  if (!project || !phaseConfig) {
    return (
      <Layout>
        <div className="text-center py-16 bg-[var(--brand-900)]">
          <h2 className="text-2xl font-bold text-white mb-4">Phase not found</h2>
          <Button onClick={() => navigate(`/projects/${id}`)} className="bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] hover:from-[#e6c358] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold">Back to Project</Button>
        </div>
      </Layout>
    );
  }

  const status = phaseStatus[phaseConfig.id] || 'locked';
  const colors = phaseColors[phaseConfig.color] || phaseColors.orange;
  const nextPhase = getNextPhase(phaseId || '');
  const activePreset = project?.ui_preferences?.preset || 'default';
  const presetSettings =
    workspacePresets.find((preset) => preset.id === activePreset) || workspacePresets[0];
  const showSidebar = presetSettings.layout.showSummary !== false;
  const showToolbar = !presetSettings.layout.condensePhases;

  // Wrapper component for phase navigation
  // Phase-specific accent color for the header
  const phaseAccentColor = (() => {
    const colors: Record<string, string> = {
      planning: '#D4A017', feasibility_study: '#7BA05B', requirements_gathering: 'var(--blue-500)',
      validation: '#5F7A8A', design: '#6B4C8A', development: '#8B5E3C',
      tasks: '#D4A017', cost_benefit: '#2A9D8F', risks: '#C1440E', testing: '#0EA5E9', summary: 'var(--blue-400)',
    };
    return colors[phaseId || ''] || 'var(--blue-400)';
  })();

  const renderPhaseWrapper = (phaseChildren: React.ReactNode) => {
    return (
      <Layout>
        <style>{`
          @media print {
            .no-print {
              display: none !important;
            }
            nav, aside, header, footer,
            [data-testid="phase-nav"],
            [role="navigation"],
            [role="complementary"] {
              display: none !important;
            }
            html, body { background: white !important; }
            .print-content { padding: 0 !important; }
            .print-content * {
              color: black !important;
              background: transparent !important;
              border-color: #ccc !important;
              box-shadow: none !important;
            }
          }
        `}</style>
        <div className="min-h-[calc(100vh-4rem)] bg-[var(--brand-900)]">
          {/* Horizontal Navigation */}
          <div className="no-print">
            <PhaseNavigation projectId={id} variant="horizontal" phaseStatus={phaseStatus} />
          </div>

          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 print-content">
            <div className="space-y-5">
              {/* Phase Header */}
              <div className="rounded-2xl overflow-hidden shadow-lg no-print" style={{ background: 'var(--brand-850)', border: `1px solid ${phaseAccentColor}30` }}>
                <div
                  className={justCompleted ? 'animate-accent-bar-shimmer' : ''}
                  style={
                    justCompleted
                      ? { height: '4px', '--shimmer-from': phaseAccentColor, '--shimmer-to': `${phaseAccentColor}88` } as React.CSSProperties
                      : { height: '4px', background: `linear-gradient(to right, ${phaseAccentColor}, ${phaseAccentColor}88)` }
                  }
                />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg shadow-lg animate-icon-drop"
                        style={{ background: phaseAccentColor, color: 'var(--brand-900)' }}>
                        {phaseConfig.stepNumber}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                          style={{ color: phaseAccentColor }}>
                          Phase {(phaseConfig.order || 0) + 1} of {phaseConfigs.length}
                        </p>
                        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] animate-slide-in-up" style={{ animationDelay: '60ms' }}>
                          {phaseConfig.title}
                        </h1>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/projects/${id}`)}
                        className="text-[var(--text-muted)] bg-transparent"
                        style={{ borderColor: 'rgba(26,46,69,0.6)' }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      {phaseMarkdown && (
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          className="text-[var(--text-muted)] bg-transparent"
                          style={{ borderColor: 'rgba(26,46,69,0.6)' }}
                          title="Download phase content as Markdown"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handlePrintPhase}
                        className="text-[var(--text-muted)] bg-transparent"
                        style={{ borderColor: 'rgba(26,46,69,0.6)' }}
                        title="Export this phase as PDF"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Export PDF
                      </Button>
                      {status !== 'completed' && !!phaseMarkdown && (
                        <Button
                          onClick={handleOpenCompleteDialog}
                          disabled={isMarkingComplete}
                          className="font-semibold text-sm"
                          style={{ background: 'rgba(26,111,212,0.15)', color: 'var(--blue-400)', border: '1px solid rgba(26,111,212,0.4)' }}
                          title="Mark this phase as complete"
                        >
                          {isMarkingComplete ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Mark Complete
                        </Button>
                      )}
                      <span
                        key={justCompleted ? 'completing' : 'stable'}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold${justCompleted && status === 'completed' ? ' animate-completion-pop' : ''}`}
                        style={
                          status === 'completed'
                            ? { background: 'rgba(212,160,23,0.18)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.45)' }
                            : status === 'locked'
                              ? { background: 'rgba(26,46,69,0.15)', color: 'var(--text-muted)', border: '1px solid rgba(26,46,69,0.3)' }
                              : { background: `${phaseAccentColor}22`, color: phaseAccentColor, border: `1px solid ${phaseAccentColor}44` }
                        }>
                        {status === 'locked' ? '🔒 Locked' : status === 'completed' ? '✓ Completed' : '● Active'}
                      </span>
                    </div>
                  </div>
                  {phaseConfig.description && (
                    <p className="mt-2 text-sm text-[var(--text-muted)] max-w-2xl ml-16">{phaseConfig.description}</p>
                  )}
                  {phaseId && phaseCompletionMeta[phaseId]?.completed_at && (
                    <div className="mt-3 ml-16 rounded-lg p-3"
                      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#22c55e] flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmed by {phaseCompletionMeta[phaseId]?.completed_by_name || 'a team member'}
                            {phaseCompletionMeta[phaseId]?.completed_at
                              ? ` on ${new Date(phaseCompletionMeta[phaseId]!.completed_at as string).toLocaleString()}`
                              : ''}
                          </p>
                          {phaseCompletionMeta[phaseId]?.notes && (
                            <p className="mt-1.5 text-xs text-[var(--text-muted)] whitespace-pre-wrap">
                              <span className="font-semibold text-[var(--text-primary)]">Notes:</span>{' '}
                              {phaseCompletionMeta[phaseId]?.notes}
                            </p>
                          )}
                          {phaseCompletionMeta[phaseId]?.edited_at && (
                            <p className="mt-1.5 text-[10px] text-[var(--text-faint)] italic">
                              Edited by {phaseCompletionMeta[phaseId]?.edited_by_name || 'a team member'}
                              {' on '}
                              {new Date(phaseCompletionMeta[phaseId]!.edited_at as string).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {canManageCompletion && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              variant="outline"
                              onClick={handleOpenEditNoteDialog}
                              className="text-[var(--text-muted)] bg-transparent text-xs h-7 px-2"
                              style={{ borderColor: 'rgba(34,197,94,0.35)' }}
                              title="Edit completion note"
                            >
                              <Edit3 className="h-3 w-3 mr-1" /> Edit note
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setUndoDialogOpen(true)}
                              className="text-[var(--text-muted)] bg-transparent text-xs h-7 px-2"
                              style={{ borderColor: 'rgba(212,160,23,0.35)' }}
                              title="Unmark this phase as complete"
                            >
                              <Undo2 className="h-3 w-3 mr-1" /> Unmark
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Limited Access Banner */}
              {!canTriggerAi && (
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.25)' }}>
                  <Shield className="h-5 w-5 text-[#D4A017] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[#D4A017] text-sm">Limited Access</p>
                    <p className="text-[var(--text-muted)] text-xs">You have {user?.role_label || 'reviewer'} access. A Program Manager must trigger AI generation.</p>
                  </div>
                </div>
              )}

              {/* Next Phase Banner */}
              {nextPhase && (
                <div className="rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                  style={{ background: 'var(--brand-850)', border: '1px solid rgba(26,46,69,0.5)' }}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm"
                      style={{ background: 'rgba(26,111,212,0.12)', color: 'var(--blue-400)', border: '1px solid rgba(26,111,212,0.25)' }}>
                      {nextPhase.stepNumber}
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--blue-400)]">Continue to Next</p>
                      <p className="font-semibold text-[var(--text-primary)]">{nextPhase.title}</p>
                    </div>
                  </div>
                  <Button
                    className="font-semibold shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-400))', color: 'var(--brand-900)', border: 'none' }}
                    onClick={() => navigate(`/projects/${id}/phases/${nextPhase.id}`)}
                  >
                    Continue
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Compact AI Regenerate Bar / Empty State */}
              {phaseId !== 'validation' && <div className="no-print">{(() => {
                const phaseEmptyDescriptions: Record<string, string> = {
                  planning: 'No planning roadmap yet — generate a high-level plan, objectives, and scope alignment with AI.',
                  feasibility_study: 'No feasibility study yet — generate a market, technical, and economic analysis with AI.',
                  requirements_gathering: 'No requirements document yet — generate functional and non-functional requirements with AI.',
                  design: 'No system design yet — generate architecture diagrams and API specifications with AI.',
                  development: 'No development plan yet — generate a tech stack, system flow, and folder structure with AI.',
                  cost_benefit: 'No cost analysis yet — generate a cost breakdown, benefit estimates, and ROI analysis with AI.',
                  risks: 'No risk register yet — generate a risk register with impact, likelihood, and mitigations with AI.',
                  testing: 'No testing plan yet — generate test scenarios, edge cases, and coverage checklist with AI.',
                  summary: 'No project summary yet — generate a final summary, lessons learned, and recommendations with AI.',
                };
                const emptyDescription = phaseId ? phaseEmptyDescriptions[phaseId] : null;
                const showEmptyState = !phaseMarkdown && !isGenerating && !isStreaming && emptyDescription && canTriggerAi;

                if (showEmptyState) {
                  return (
                    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--brand-850)', border: '1px dashed rgba(26,111,212,0.4)' }}>
                      <div className="p-6 flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)' }}>
                          <Sparkles className="h-7 w-7 text-[var(--blue-400)]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white mb-1">No content yet</p>
                          <p className="text-sm text-gray-400 max-w-md">{emptyDescription}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <Button
                            onClick={() => handleGenerate(`Generate comprehensive ${phaseId?.replace(/_/g, ' ')} content for this project`)}
                            className="font-semibold px-6"
                            style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-400))', color: 'var(--brand-900)', border: 'none' }}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate with AI
                          </Button>
                          <div className="flex items-center gap-2">
                            <input
                              ref={regenerateInputRef}
                              type="text"
                              className="w-56 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 border border-[var(--brand-700)] bg-[#152238] focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 transition-all"
                              placeholder="Or enter a custom prompt..."
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const prompt = regenerateInputRef.current?.value || `Generate ${phaseId?.replace(/_/g, ' ')} content`;
                                handleGenerate(prompt);
                              }}
                              className="text-[var(--blue-400)] border-[var(--blue-400)]/30 text-sm"
                            >
                              Go
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-[var(--brand-900)] rounded-xl border border-[var(--brand-700)] overflow-hidden">
                    {isGenerating && renderPipelineIndicator()}
                    <div className="p-3 sm:p-4">
                      {isGenerating ? null : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[var(--blue-400)]" />
                            <span className="text-sm text-gray-400">Content auto-generated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCopyContent}
                              disabled={!phaseMarkdown && !phaseRawMarkdown}
                              title="Copy content to clipboard"
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 10px', borderRadius: '8px',
                                background: copied ? 'rgba(26,111,212,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${copied ? 'rgba(26,111,212,0.4)' : 'rgba(26,46,69,0.6)'}`,
                                color: copied ? '#3d8fe0' : '#4a6070',
                                fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
                              }}
                            >
                              {copied ? <Check size={13} /> : <Copy size={13} />}
                              {copied ? 'Copied' : 'Copy'}
                            </button>
                            <input
                              ref={regenerateInputRef}
                              type="text"
                              className="w-48 sm:w-64 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 border border-[var(--brand-700)] bg-[#152238] focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 transition-all"
                              placeholder="Custom prompt (optional)"
                            />
                            <Button
                              disabled={isGenerating}
                              onClick={() => {
                                const prompt = regenerateInputRef.current?.value || `Regenerate ${phaseId?.replace('_', ' ')} content`;
                                handleGenerate(prompt);
                              }}
                              className="bg-[#152238] hover:bg-[var(--brand-700)] text-[var(--blue-400)] border border-[var(--blue-400)]/30 hover:border-[var(--blue-400)] text-sm px-3 py-1.5 font-medium"
                            >
                              <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}</div>}

              {/* AI Suggestions Panel */}
              {phaseId && project && (
                <div className="no-print">
                  <AISuggestionsPanel
                    projectId={id || ''}
                    phase={phaseId}
                    phaseContent={phaseMarkdown}
                    projectName={project.name}
                    projectDescription={project.description || ''}
                  />
                </div>
              )}

              {/* Phase Content */}
              {phaseChildren}
            </div>
          </div>
        </div>

        {/* Athena AI Chat Assistant — floating per-phase */}
        {project && phaseId && (
          <div className="no-print">
            <AIChatAssistant
              projectId={id || ''}
              projectName={project.name}
              phase={phaseId}
              phaseName={phaseConfig?.title || phaseId}
            />
          </div>
        )}
      </Layout>
    );
  };


  // ============================================
  // FEASIBILITY STUDY PHASE
  // ============================================
  if (phaseId === 'feasibility_study') {
    return (
      renderPhaseWrapper(<>
        <FeasibilityStudyPhase
          projectId={id || ''}
          projectName={project?.name || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          content={phaseMarkdown}
        />
      </>)
    );
  }

  // ============================================
  // PLANNING ROADMAP PHASE
  // ============================================
  if (phaseId === 'planning') {
    return (
      renderPhaseWrapper(<>
        <PlanningRoadmapPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </>)
    );
  }

  // ============================================
  // REQUIREMENTS GATHERING PHASE
  // ============================================
  if (phaseId === 'requirements_gathering') {
    return (
      renderPhaseWrapper(<>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{requirements.length}</p>
                  <p className="text-xs text-gray-500">Total Requirements</p>
                </div>
              </div>
            </div>

            {/* Cost vs Benefit Comparison card removed here; lives in cost_benefit phase instead */}
            <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{requirements.filter(r => r.type === 'non_functional').length}</p>
                  <p className="text-xs text-gray-500">Non-Functional</p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--blue-400)]/20 rounded-lg border border-[var(--blue-400)]/30">
                  <TrendingUp className="h-5 w-5 text-[var(--blue-400)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{requirements.filter(r => r.priority === 'high').length}</p>
                  <p className="text-xs text-gray-500">High Priority</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Catalog */}
          <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--brand-700)]/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">Requirements Catalog</h3>
                  <p className="text-sm text-gray-500">Functional and non-functional requirements with priority scoring</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncRequirements}
                  className="border-[var(--brand-700)] text-gray-400 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]"
                >
                  Sync Validation
                </Button>
              </div>
            </div>
            <div className="p-6">
              {/* Add Requirement */}
              <div className="mb-6 p-4 border border-dashed border-[var(--brand-700)] rounded-lg bg-[#152238]/50 space-y-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--blue-400)]" />
                    <span className="text-sm font-medium text-white">Add Requirement</span>
                  </div>
                  <select
                    className="text-xs border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-gray-300"
                    value={requirementDraft.type}
                    onChange={(e) => setRequirementDraft({ ...requirementDraft, type: e.target.value })}
                  >
                    <option value="functional">Functional</option>
                    <option value="non_functional">Non-Functional</option>
                  </select>
                </div>
                <input
                  className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm bg-[#152238] text-white placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30"
                  placeholder="Requirement title..."
                  value={requirementDraft.title}
                  onChange={(e) => setRequirementDraft({ ...requirementDraft, title: e.target.value })}
                />
                <textarea
                  className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm bg-[#152238] text-white placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 min-h-[70px]"
                  placeholder="Requirement description..."
                  value={requirementDraft.description}
                  onChange={(e) => setRequirementDraft({ ...requirementDraft, description: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238] text-gray-300"
                    value={requirementDraft.priority}
                    onChange={(e) => setRequirementDraft({ ...requirementDraft, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    className="border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238] text-gray-300"
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
                    className="ml-auto bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] hover:from-[#e6c358] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold"
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
                        const withNew = { ...created, _isNew: true };
                        setRequirements((prev) => [withNew as any, ...prev]);
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
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No requirements gathered yet.</p>
                  <p className="text-sm mt-1 text-gray-500">Use the AI assistant to generate requirements.</p>
                </div>
              ) : (
                <div className="stagger-container space-y-3">
                  {requirements.map((req) => {
                    const isEditing = editingRequirementId === req.requirement_id;
                    const isSaved = savedReqId === req.requirement_id;
                    return (
                    <div key={req.requirement_id} className={`border rounded-lg phase-card-hover transition-all duration-300 overflow-hidden ${isSaved ? 'border-green-500/60 bg-green-500/5' : 'border-[var(--brand-700)]/50 bg-[#152238]/30 hover:bg-[#152238]'}`}
                      style={{ maxHeight: isEditing ? '500px' : '120px', transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1), border-color 0.3s ease, background 0.3s ease', animation: (req as any)._isNew ? 'slideInUp 0.4s ease forwards' : undefined }}
                    >
                      <div className="p-4">
                      {isSaved && (
                        <div className="flex items-center gap-2 mb-2 text-green-400 text-xs font-semibold animate-slide-in-up">
                          <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2,7 5,10 10,3" style={{ strokeDasharray: 16, strokeDashoffset: 16, animation: 'drawCheckmark 0.4s ease forwards' }} />
                          </svg>
                          Saved
                        </div>
                      )}
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

                          {isEditing ? (
                            <div className="space-y-2 mt-1">
                              <input
                                className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-1.5 text-sm"
                                value={editingRequirementDraft.title}
                                onChange={(e) =>
                                  setEditingRequirementDraft((prev) => ({ ...prev, title: e.target.value }))
                                }
                              />
                              <textarea
                                className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-1.5 text-sm"
                                rows={3}
                                value={editingRequirementDraft.description}
                                onChange={(e) =>
                                  setEditingRequirementDraft((prev) => ({ ...prev, description: e.target.value }))
                                }
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  className="border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238]"
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
                                  className="border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238]"
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
                                        await api.updateRequirement(req.requirement_id, patch);
                                        setEditingRequirementId(null);
                                        setSavedReqId(req.requirement_id);
                                        setTimeout(() => setSavedReqId(null), 1800);
                                        await handleSyncRequirements();
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
                              <h4 className="font-medium text-white">{req.title}</h4>
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{req.description}</p>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {!isEditing && (
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
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-2 border-t border-dashed border-[var(--brand-700)] flex items-center justify-between text-[11px] text-gray-500">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-[var(--brand-700)] bg-[#152238] text-[var(--blue-400)] focus:ring-[var(--blue-400)]"
                    checked={useCustomRoi}
                    onChange={(e) => setUseCustomRoi(e.target.checked)}
                  />
                  <span className="font-medium">Use custom totals for ROI cards & comparison</span>
                </label>
                <span className="text-[10px] text-gray-500 text-right">
                  {useCustomRoi
                    ? 'High-level ROI uses custom cost & benefit sums.'
                    : 'High-level ROI uses task hours × hourly rate with 2× benefit assumption.'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Generation */}
          <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--brand-700)]/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--blue-400)]" />
                <h3 className="font-bold text-white">AI Requirements Assistant</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">Generate requirements from your project description</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm bg-[#152238] text-white placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 min-h-[100px]"
                placeholder="Describe what you want AI to help with: Generate functional requirements, create acceptance criteria, suggest non-functional requirements..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] hover:from-[#e6c358] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Requirements</>}
                </Button>
                <Button variant="outline" onClick={() => handleGenerate('Generate functional requirements based on the project brief')} className="border-[var(--brand-700)] text-gray-400 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  <Wand2 className="mr-2 h-4 w-4" /> Auto-Generate FR
                </Button>
                <Button variant="outline" onClick={() => handleGenerate('Generate non-functional requirements (performance, security, scalability)')} className="border-[var(--brand-700)] text-gray-400 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  <Shield className="mr-2 h-4 w-4" /> Auto-Generate NFR
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>)
    );
  }

  // ============================================
  // VALIDATION PHASE
  // ============================================
  if (phaseId === 'validation') {
    return (
      renderPhaseWrapper(<>
        <ValidationPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          content={phaseMarkdown}
          requirements={requirements}
        />
      </>)
    );
  }

  // ============================================
  // DESIGN PHASE (AI Content + PlantUML)
  // ============================================
  if (phaseId === 'design') {
    const status = phaseStatus['design'] || 'locked';
    return (
      renderPhaseWrapper(<>
        <div className="space-y-6">
          {/* AI Generate Card */}
          <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, var(--brand-850), var(--brand-800))', border: '1px solid rgba(107,76,138,0.4)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">System Design</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">Architecture overview, component diagrams, data models, and API specs</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'}
                  style={{ background: 'linear-gradient(135deg, #6B4C8A, #8B68B0)', color: '#fff', border: 'none' }}>
                  {isGenerating
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Designing...</>
                    : <><Sparkles className="mr-2 h-4 w-4" />Generate Design</>
                  }
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                  <Download className="mr-2 h-4 w-4" />Export
                </Button>
              </div>
            </div>
            {phaseMarkdown && (
              <div className="rounded-xl p-5 mt-2" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(107,76,138,0.2)' }}>
                <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-muted)' }}>
                  <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  {renderRawMarkdownDisclosure()}
                </div>
              </div>
            )}
            {!phaseMarkdown && !isGenerating && (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No design content yet</p>
                <p className="text-sm mt-1">Click "Generate Design" to create your system architecture</p>
              </div>
            )}
          </div>

          {/* PlantUML Diagram Editor */}
          <div className="rounded-2xl p-2" style={{ border: '1px solid rgba(107,76,138,0.3)' }}>
            <DesignPhase projectId={id || ''} onOpenCanvas={handleOpenCanvas} />
          </div>
        </div>
      </>)
    );
  }

  // ============================================
  // SYSTEM DESIGN PHASE (Legacy)
  // ============================================
  if (phaseId === 'design_architecture') {
    return (
      renderPhaseWrapper(<>
        <SystemDesignPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onOpenCanvas={handleOpenCanvas}
        />
      </>)
    );
  }

  // ============================================
  // DEVELOPMENT PHASE
  // ============================================
  if (phaseId === 'development') {
    return (
      renderPhaseWrapper(<>
        <DevelopmentPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          requirements={requirements}
          content={phaseMarkdown}
        />
      </>)
    );
  }

  // ============================================
  // RISKS PHASE
  // ============================================
  if (phaseId === 'risks') {
    return (
      renderPhaseWrapper(<>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl" style={{ background: 'var(--orange-500, #F97316)', opacity: 0.08 }}></div>
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Project
                </Button>
                <span className="text-xs uppercase font-semibold tracking-widest" style={{ color: '#fb923c' }}>Active Risk Review</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isEditingRisks ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancelRiskEdit} disabled={savingRisks}>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      style={{ background: 'linear-gradient(135deg, #1A6FD4, #F97316)', color: '#fff', border: 'none' }}
                      onClick={handleSaveRisks}
                      disabled={savingRisks || !latestArtifact}
                    >
                      {savingRisks ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartRiskEdit}
                    disabled={!latestArtifact}
                    title={!latestArtifact ? 'Generate this phase before editing' : 'Edit the generated markdown'}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Output
                  </Button>
                )}
              </div>
              <div className="text-right flex-1 min-w-[220px]">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Phase</p>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Risks & Mitigations
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{project?.name}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Main layout: Overview + detailed tables */}
          <div className="space-y-4">
            {/* Overview card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <AlertTriangle className="h-4 w-4" style={{ color: '#F97316' }} />
                  Risk Overview
                </CardTitle>
                <CardDescription className="text-xs">
                  High-level summary of the main delivery, technical, and organizational risks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingRisks ? (
                  <div className="space-y-2">
                    {riskDraft.overview.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          className="flex-1 min-h-[50px] border border-[var(--brand-700)] rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-200"
                          value={item}
                          onChange={(e) =>
                            setRiskDraft((prev) => {
                              const updated = [...prev.overview];
                              updated[idx] = e.target.value;
                              return { ...prev, overview: updated };
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() =>
                            setRiskDraft((prev) => {
                              const updated = prev.overview.filter((_, i) => i !== idx);
                              return { ...prev, overview: updated.length ? updated : [''] };
                            })
                          }
                          disabled={riskDraft.overview.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRiskDraft((prev) => ({ ...prev, overview: [...prev.overview, ''] }))}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Summary Line
                    </Button>
                  </div>
                ) : parsedRisks && parsedRisks.overview.length ? (
                  <ul className="list-disc pl-5 space-y-1 text-xs text-gray-300">
                    {parsedRisks.overview.map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">Generate risks to see a summarized overview here.</p>
                )}
              </CardContent>
            </Card>

            {/* Risk Register + Before/After + Actions */}
            <div className="space-y-4">
              {/* Risk Register table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Grid2X2 className="h-4 w-4" style={{ color: '#F97316' }} />
                    Risk Register
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Detailed list of identified risks with impact, likelihood, mitigation, and owner.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingRisks ? (
                    <div className="space-y-3">
                      <div className="overflow-x-auto border border-[var(--brand-700)] rounded-lg">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-[var(--brand-700)]/50">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Risk</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Impact</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Likelihood</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Mitigation</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Owner</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-300 border-b border-[var(--brand-700)] sr-only">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskDraft.riskRows.map((row, idx) => (
                              <tr key={idx} className="bg-[#152238]">
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <input
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs"
                                    placeholder="Risk description"
                                    value={row.risk}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.riskRows];
                                        updated[idx] = { ...updated[idx], risk: e.target.value };
                                        return { ...prev, riskRows: updated };
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <select
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs bg-[#152238]"
                                    value={row.impact}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.riskRows];
                                        updated[idx] = { ...updated[idx], impact: e.target.value };
                                        return { ...prev, riskRows: updated };
                                      })
                                    }
                                  >
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <select
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs bg-[#152238]"
                                    value={row.likelihood}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.riskRows];
                                        updated[idx] = { ...updated[idx], likelihood: e.target.value };
                                        return { ...prev, riskRows: updated };
                                      })
                                    }
                                  >
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <textarea
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs min-h-[60px]"
                                    placeholder="Mitigation strategy"
                                    value={row.mitigation}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.riskRows];
                                        updated[idx] = { ...updated[idx], mitigation: e.target.value };
                                        return { ...prev, riskRows: updated };
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <input
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs"
                                    placeholder="Owner"
                                    value={row.owner}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.riskRows];
                                        updated[idx] = { ...updated[idx], owner: e.target.value };
                                        return { ...prev, riskRows: updated };
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="px-2"
                                    onClick={() =>
                                      setRiskDraft((prev) => {
                                        const updated = prev.riskRows.filter((_, i) => i !== idx);
                                        return { ...prev, riskRows: updated.length ? updated : [createEmptyRiskRow()] };
                                      })
                                    }
                                    disabled={riskDraft.riskRows.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setRiskDraft((prev) => ({ ...prev, riskRows: [...prev.riskRows, createEmptyRiskRow()] }))}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Risk
                        </Button>
                        <p className="text-[11px] text-gray-500">Use the table to adjust owners, severity, and mitigations inline.</p>
                      </div>
                    </div>
                  ) : parsedRisks && parsedRisks.riskRows.length ? (
                    <div className="overflow-x-auto border border-[var(--brand-700)] rounded-lg">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-[var(--brand-700)]/50">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Risk</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Impact</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Likelihood</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Mitigation</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Owner</th>
                          </tr>
                        </thead>
                        <tbody className="stagger-container">
                          {parsedRisks.riskRows.map((row, idx) => {
                            const impact = row.impact.toLowerCase();
                            const likelihood = row.likelihood.toLowerCase();

                            const chip = (level: string) => {
                              const lower = level.toLowerCase();
                              if (lower.startsWith('high')) {
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>🔴 {level}</span>;
                              }
                              if (lower.startsWith('medium')) {
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(249,115,22,0.15)', color: '#fdba74' }}>🟡 {level}</span>;
                              }
                              if (lower.startsWith('low')) {
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/20 text-blue-300 text-[10px] font-medium">🟢 {level}</span>;
                              }
                              return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-700)]/50 text-gray-600 text-[10px] font-medium">{level}</span>;
                            };

                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-[#152238]' : 'bg-[var(--brand-700)]/50/60'}>
                                <td className="align-top px-2 py-2 border-b border-gray-100 text-white font-medium w-48">
                                  {row.risk}
                                </td>
                                <td className="align-top px-2 py-2 border-b border-gray-100">{chip(row.impact)}</td>
                                <td className="align-top px-2 py-2 border-b border-gray-100">{chip(row.likelihood)}</td>
                                <td className="align-top px-2 py-2 border-b border-gray-100 text-gray-300 max-w-xs">
                                  <p className="whitespace-normal break-words">{row.mitigation}</p>
                                </td>
                                <td className="align-top px-2 py-2 border-b border-gray-100 text-gray-300 w-32">{row.owner}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Generate risks to populate the risk register table.</p>
                  )}
                </CardContent>
              </Card>

              {/* Before vs After Mitigation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    Before vs After Mitigation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    How the overall risk posture changes once mitigations are applied.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingRisks ? (
                    <div className="space-y-3">
                      <div className="overflow-x-auto border border-[var(--brand-700)] rounded-lg">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-[var(--brand-700)]/50">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Aspect</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Before</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">After</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-300 border-b border-[var(--brand-700)] sr-only">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskDraft.beforeAfter.map((row, idx) => (
                              <tr key={idx} className="bg-[#152238]">
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <input
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs"
                                    placeholder="Aspect"
                                    value={row.aspect}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.beforeAfter];
                                        updated[idx] = { ...updated[idx], aspect: e.target.value };
                                        return { ...prev, beforeAfter: updated };
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <textarea
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs min-h-[50px]"
                                    placeholder="Before mitigation"
                                    value={row.before}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.beforeAfter];
                                        updated[idx] = { ...updated[idx], before: e.target.value };
                                        return { ...prev, beforeAfter: updated };
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <textarea
                                    className="w-full border border-[var(--brand-700)] rounded px-2 py-1 text-xs min-h-[50px]"
                                    placeholder="After mitigation"
                                    value={row.after}
                                    onChange={(e) =>
                                      setRiskDraft((prev) => {
                                        const updated = [...prev.beforeAfter];
                                        updated[idx] = { ...updated[idx], after: e.target.value };
                                        return { ...prev, beforeAfter: updated };
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-2 py-2 border-b border-gray-100 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="px-2"
                                    onClick={() =>
                                      setRiskDraft((prev) => {
                                        const updated = prev.beforeAfter.filter((_, i) => i !== idx);
                                        return { ...prev, beforeAfter: updated.length ? updated : [createEmptyPostureRow()] };
                                      })
                                    }
                                    disabled={riskDraft.beforeAfter.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRiskDraft((prev) => ({ ...prev, beforeAfter: [...prev.beforeAfter, createEmptyPostureRow()] }))}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Aspect
                      </Button>
                    </div>
                  ) : parsedRisks && parsedRisks.beforeAfter.length ? (
                    <div className="overflow-x-auto border border-[var(--brand-700)] rounded-lg">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-[var(--brand-700)]/50">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Aspect</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">Before</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-300 border-b border-[var(--brand-700)]">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRisks.beforeAfter.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-[#152238]' : 'bg-[var(--brand-700)]/50/60'}>
                              <td className="px-2 py-2 border-b border-gray-100 text-white font-medium">{row.aspect}</td>
                              <td className="px-2 py-2 border-b border-gray-100 text-gray-300">{row.before}</td>
                              <td className="px-2 py-2 border-b border-gray-100 text-gray-300">{row.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Generate risks to see a before/after comparison.</p>
                  )}
                </CardContent>
              </Card>

              {/* Recommended Actions checklist */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-blue-400" />
                    Recommended Actions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Concrete next steps derived from the risk analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingRisks ? (
                    <div className="space-y-2">
                      {riskDraft.actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <textarea
                            className="flex-1 min-h-[45px] border border-[var(--brand-700)] rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                            placeholder="Describe the recommended action..."
                            value={action}
                            onChange={(e) =>
                              setRiskDraft((prev) => {
                                const updated = [...prev.actions];
                                updated[idx] = e.target.value;
                                return { ...prev, actions: updated };
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2"
                            onClick={() =>
                              setRiskDraft((prev) => {
                                const updated = prev.actions.filter((_, i) => i !== idx);
                                return { ...prev, actions: updated.length ? updated : [''] };
                              })
                            }
                            disabled={riskDraft.actions.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRiskDraft((prev) => ({ ...prev, actions: [...prev.actions, ''] }))}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Action
                      </Button>
                    </div>
                  ) : parsedRisks && parsedRisks.actions.length ? (
                    <ul className="space-y-1 text-xs text-gray-300">
                      {parsedRisks.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <input type="checkbox" className="mt-[2px] h-3 w-3 rounded border-gray-300" />
                          <span className="whitespace-normal break-words">{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Generate risks to see a checklist of recommended actions.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>)
    );
  }

  // ============================================
  // TESTING PHASE
  // ============================================
  if (phaseId === 'testing') {
    return (
      renderPhaseWrapper(<>
        <TestingPhase
          projectId={id || ''}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          content={phaseMarkdown}
          requirements={requirements}
        />
      </>)
    );
  }

  // ============================================
  // TESTING PHASE
  // ============================================
  if (phaseId === 'testing') {
    return renderPhaseWrapper(
      <TestingPhase
        projectId={id || ''}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        content={phaseMarkdown}
        requirements={requirements}
      />
    );
  }

  // ============================================
  // FINAL SUMMARY PHASE
  // ============================================
  if (phaseId === 'summary') {
    return (
      renderPhaseWrapper(<>
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
      </>)
    );
  }

  // ============================================
  // LEGACY TASKS PHASE - Keep for backwards compatibility
  // ============================================
  if (phaseId === 'tasks' || phaseId === 'tasks_legacy') {
    const completedCount = tasks.filter((t) => (localTaskStatus[t.task_id] || t.status || '').toLowerCase() === 'completed').length;
    const inProgressCount = tasks.filter((t) => (localTaskStatus[t.task_id] || t.status || '').toLowerCase() === 'in_progress').length;
    const todoCount = tasks.filter((t) => {
      const s = (localTaskStatus[t.task_id] || t.status || '').toLowerCase();
      return s === 'planned' || s === 'todo' || s === '';
    }).length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);

    const kanbanColumns: { key: string; label: string; accentColor: string; headerBg: string }[] = [
      { key: 'todo', label: 'To Do', accentColor: '#1A6FD4', headerBg: 'rgba(26,111,212,0.15)' },
      { key: 'in_progress', label: 'In Progress', accentColor: '#F97316', headerBg: 'rgba(249,115,22,0.15)' },
      { key: 'done', label: 'Done', accentColor: '#4B7EA3', headerBg: 'rgba(75,126,163,0.12)' },
    ];

    const getColumnTasks = (colKey: string) =>
      tasks.filter((t) => {
        const s = (localTaskStatus[t.task_id] || t.status || '').toLowerCase();
        if (colKey === 'todo') return s === 'planned' || s === 'todo' || s === '';
        if (colKey === 'in_progress') return s === 'in_progress';
        if (colKey === 'done') return s === 'completed';
        return false;
      });

    const priorityBorder: Record<string, string> = {
      high: '3px solid #ef4444',
      medium: '3px solid #F97316',
      low: '3px solid #1A6FD4',
    };
    const priorityPill: Record<string, { bg: string; color: string }> = {
      high: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5' },
      medium: { bg: 'rgba(249,115,22,0.15)', color: '#fdba74' },
      low: { bg: 'rgba(26,111,212,0.15)', color: '#93c5fd' },
    };

    return (
      renderPhaseWrapper(<>
        <>
          <div className="space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.15)' }}>
                  <ListChecks className="h-5 w-5" style={{ color: '#1A6FD4' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#1A6FD4' }}>{tasks.length}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Tasks</p>
                </div>
              </div>
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.15)' }}>
                  <CheckCircle2 className="h-5 w-5" style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{todoCount}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>To Do</p>
                </div>
              </div>
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--brand-800)', border: '1px solid rgba(249,115,22,0.2)' }}>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.12)' }}>
                  <Clock className="h-5 w-5" style={{ color: '#F97316' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#F97316' }}>{inProgressCount}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>In Progress</p>
                </div>
              </div>
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.1)' }}>
                  <TrendingUp className="h-5 w-5" style={{ color: '#4ade80' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#4ade80' }}>{completedCount}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Done</p>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                style={{ background: '#1A6FD4', color: '#fff', border: 'none' }}
                onClick={() => setNewTask({ ...newTask, status: 'planned' })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Task
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
                {aiAddingTasks ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />}
                AI Generate
              </Button>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{totalHours}h estimated · {completedCount}/{tasks.length} done</span>
            </div>

            {/* 3-Column Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kanbanColumns.map((col) => {
                const colTasks = getColumnTasks(col.key);
                return (
                  <div key={col.key} className="rounded-xl flex flex-col" style={{ background: 'var(--brand-800)', border: '1px solid var(--brand-700)' }}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-t-xl" style={{ background: col.headerBg, borderBottom: `1px solid var(--brand-700)` }}>
                      <span className="font-semibold text-sm" style={{ color: col.accentColor }}>{col.label}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.accentColor + '22', color: col.accentColor }}>{colTasks.length}</span>
                    </div>

                    {/* Task Cards */}
                    <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 480 }}>
                      {colTasks.map((task) => {
                        const prio = (task.priority || 'low').toLowerCase() as keyof typeof priorityBorder;
                        const pill = priorityPill[prio] || priorityPill.low;
                        return (
                          <div
                            key={task.task_id}
                            className="rounded-lg p-3 cursor-pointer hover:brightness-110 transition-all"
                            style={{
                              background: 'var(--brand-750, #152238)',
                              borderLeft: priorityBorder[prio] || '3px solid #1A6FD4',
                              border: '1px solid var(--brand-700)',
                              borderLeftWidth: '3px',
                            }}
                            onClick={() => toggleLocalTaskStatus(task.task_id)}
                            title="Click to advance status"
                          >
                            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                            {task.description && (
                              <p className="text-xs truncate mb-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: pill.bg, color: pill.color }}>{prio}</span>
                              {task.estimate_hours > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(26,111,212,0.1)', color: '#93c5fd' }}>{task.estimate_hours}h</span>
                              )}
                              {task.due_date && (
                                <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {colTasks.length === 0 && (
                        <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>No tasks here</p>
                      )}

                      {/* Inline Add Form — only in To Do column */}
                      {col.key === 'todo' && (
                        <div className="mt-3 rounded-lg p-3 space-y-2" style={{ background: 'var(--brand-750, #152238)', border: '1px dashed rgba(26,111,212,0.3)' }}>
                          <input
                            className="w-full rounded-lg px-3 py-1.5 text-sm"
                            style={{ background: 'var(--brand-800)', border: '1px solid var(--brand-700)', color: 'var(--text-primary)' }}
                            placeholder="New task title..."
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              className="rounded-lg px-2 py-1.5 text-xs"
                              style={{ background: 'var(--brand-800)', border: '1px solid var(--brand-700)', color: 'var(--text-primary)' }}
                              value={newTask.priority}
                              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <input
                              type="number"
                              className="rounded-lg px-2 py-1.5 text-xs"
                              style={{ background: 'var(--brand-800)', border: '1px solid var(--brand-700)', color: 'var(--text-primary)' }}
                              placeholder="Hours est."
                              value={newTask.due_date}
                              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                            />
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            style={{ background: '#1A6FD4', color: '#fff', border: 'none' }}
                            onClick={async () => {
                              if (!id || !newTask.title.trim()) return;
                              setCreatingTask(true);
                              try {
                                const payload: any = {
                                  title: newTask.title,
                                  description: newTask.description,
                                  start_date: newTask.start_date || undefined,
                                  due_date: newTask.due_date || undefined,
                                  priority: newTask.priority,
                                  status: 'planned',
                                  dependencies: [],
                                  tags: [],
                                };
                                const created = await api.createTask(id, payload);
                                setTasks((prev) => [created, ...prev]);
                                setNewTask({ title: '', description: '', start_date: '', due_date: '', priority: 'medium', status: 'planned', dependencies: '', milestone: false });
                              } catch (err) {
                                console.error('Create task failed', err);
                              } finally {
                                setCreatingTask(false);
                              }
                            }}
                            disabled={creatingTask || !newTask.title.trim()}
                          >
                            {creatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" />Add</>}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Task Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: 'var(--text-primary)' }}>
                  <Sparkles className="h-4 w-4" style={{ color: '#1A6FD4' }} />
                  AI Task Insights
                </CardTitle>
                <CardDescription style={{ color: 'var(--text-muted)' }}>
                  Ask the assistant to summarize execution risks, propose a new sprint, or refine dependencies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="w-full rounded-lg px-3 py-2 text-sm min-h-[90px]"
                  style={{ background: 'var(--brand-750, #152238)', border: '1px solid var(--brand-700)', color: 'var(--text-primary)' }}
                  placeholder="E.g., Summarize task dependencies, highlight schedule risks, draft QA tasks for sprint 2"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || status === 'locked'}
                    style={{ background: '#1A6FD4', color: '#fff', border: 'none' }}
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Generate Insight</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </div>
                <div className="rounded-xl p-4 min-h-[120px]" style={{ border: '1px solid var(--brand-700)', background: 'var(--brand-750, #152238)' }}>
                  {phaseMarkdown ? (
                    <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
                      <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                      {renderRawMarkdownDisclosure()}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-sm gap-1 py-6" style={{ color: 'var(--text-muted)' }}>
                      <Sparkles className="h-6 w-6" style={{ color: '#1A6FD4' }} />
                      <p>No AI output yet for this phase.</p>
                      <p className="text-xs">Describe what you need above to generate a summary.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task Detail Modal */}
            {selectedTask && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
                <Card className="w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle style={{ color: 'var(--text-primary)' }}>{selectedTask.title}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedTask.description || 'No description'}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <Badge>{selectedTask.status}</Badge></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Priority:</span> <span className="capitalize" style={{ color: 'var(--text-primary)' }}>{selectedTask.priority}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Start:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : 'Not set'}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Due:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'Not set'}</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Estimate:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedTask.estimate_hours || 0} hours</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Actual:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedTask.actual_hours || 0} hours</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      </>)
    );
  }

  // ============================================
  // COST & BENEFIT PHASE - Charts & Analytics
  // ============================================
  if (phaseId === 'cost_benefit') {
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);
    const baseRate = project?.hourly_rate || 100;
    const roleRates = { junior: 50, mid: 80, senior: 120, architect: 150, pm: 100 };
    const totalRoleCount =
      roleMix.junior + roleMix.mid + roleMix.senior + roleMix.architect + roleMix.pm;
    const blendedBaseHourlyRate = totalRoleCount
      ? (
        roleMix.junior * roleRates.junior +
        roleMix.mid * roleRates.mid +
        roleMix.senior * roleRates.senior +
        roleMix.architect * roleRates.architect +
        roleMix.pm * roleRates.pm
      ) / totalRoleCount
      : baseRate;

    const getTaskRate = (task: Task) => {
      const key = (task.role || '').toLowerCase() as keyof typeof roleRates;
      const baseRoleRate = key && roleRates[key] ? roleRates[key] : blendedBaseHourlyRate;
      return baseRoleRate * teamSizeMultiplier;
    };

    const totalCost = tasks.reduce(
      (sum, t) => sum + (t.estimate_hours || 0) * getTaskRate(t),
      0
    );
    const baseEstimatedBenefit = totalCost * 2; // base 2x assumption; custom items refine below

    // Group costs by phase/category
    const costByPhase = tasks.reduce((acc, task) => {
      const phase = task.phase || 'General';
      if (!acc[phase]) acc[phase] = { hours: 0, cost: 0, tasks: 0 };
      const hours = task.estimate_hours || 0;
      acc[phase].hours += hours;
      acc[phase].cost += hours * getTaskRate(task);
      acc[phase].tasks += 1;
      return acc;
    }, {} as Record<string, { hours: number; cost: number; tasks: number }>);

    const costByPriority = tasks.reduce((acc, task) => {
      const priority = task.priority || 'medium';
      if (!acc[priority]) acc[priority] = { hours: 0, cost: 0 };
      const hours = task.estimate_hours || 0;
      acc[priority].hours += hours;
      acc[priority].cost += hours * getTaskRate(task);
      return acc;
    }, {} as Record<string, { hours: number; cost: number }>);

    const totalCustomCost = customCostItems.reduce((sum, item) => sum + item.cost, 0);
    const totalCustomBenefit = customCostItems.reduce((sum, item) => sum + item.benefit, 0);
    const customRoi = totalCustomCost > 0 ? ((totalCustomBenefit - totalCustomCost) / totalCustomCost) * 100 : 0;

    // Effective values for high-level ROI visuals (cards + comparison)
    // If user enables custom ROI, always use their totals (even if zero) so cards start at 0
    const effectiveCostForRoi = useCustomRoi ? totalCustomCost : totalCost;
    const effectiveBenefit = useCustomRoi ? totalCustomBenefit : baseEstimatedBenefit;
    const roi = effectiveCostForRoi > 0 ? ((effectiveBenefit - effectiveCostForRoi) / effectiveCostForRoi) * 100 : 0;

    const actualPhaseSlices = Object.entries(costByPhase).map(([phase, data]) => ({
      id: phase,
      label: phase.replace('_', ' '),
      cost: data.cost,
      hours: data.hours,
    }));
    const phaseSlicesForChart =
      useManualCostSlices && manualCostSlices.length ? manualCostSlices : actualPhaseSlices;
    const manualTotalCost = phaseSlicesForChart.reduce((sum, entry) => sum + entry.cost, 0) || 1;

    const startEditingCostSlices = () => {
      if (!useManualCostSlices || manualCostSlices.length === 0) {
        setManualCostSlices(actualPhaseSlices.map((slice, idx) => ({
          id: slice.id || `phase_${idx}`,
          label: slice.label,
          cost: Math.round(slice.cost),
          hours: Math.round(slice.hours),
        })));
      }
      setManualSliceDraft({ label: '', cost: '', hours: '' });
      setEditingCostSlices(true);
    };

    const addManualSlice = () => {
      if (!manualSliceDraft.label.trim() || !Number(manualSliceDraft.cost)) return;
      setManualCostSlices((prev) => [
        ...prev,
        {
          id: `manual_${Date.now()}_${prev.length}`,
          label: manualSliceDraft.label.trim(),
          cost: Number(manualSliceDraft.cost),
          hours: Number(manualSliceDraft.hours) || 0,
        },
      ]);
      setManualSliceDraft({ label: '', cost: '', hours: '' });
    };

    return (
      renderPhaseWrapper(<>
        <>
          <div className="space-y-6">


            {/* Scenario Presets + Team Size Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Scenario presets:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setTeamSizeMultiplier(0.8);
                    setRoleMix({ junior: 1, mid: 1, senior: 0, architect: 0, pm: 0 });
                    setUseCustomRoi(false);
                  }}
                >
                  MVP
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setTeamSizeMultiplier(1.3);
                    setRoleMix({ junior: 0, mid: 1, senior: 2, architect: 1, pm: 1 });
                    setUseCustomRoi(false);
                  }}
                >
                  Aggressive
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    setTeamSizeMultiplier(1.5);
                    setRoleMix({ junior: 1, mid: 2, senior: 2, architect: 1, pm: 1 });
                    setUseCustomRoi(true);
                  }}
                >
                  Enterprise
                </Button>
              </div>
            </div>

            <Card className="border-blue-700/40 bg-blue-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Team Size Scenario
                </CardTitle>
                <CardDescription className="text-xs">
                  Move the slider to simulate a smaller or larger team. This scales hourly cost and all charts/cards.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="flex flex-col gap-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Team size multiplier</span>
                    <span className="font-mono text-blue-300">{teamSizeMultiplier.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={teamSizeMultiplier}
                    onChange={(e) => setTeamSizeMultiplier(parseFloat(e.target.value) || 1)}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>0.5× (very small team)</span>
                    <span>1.0× (current)</span>
                    <span>2.0× (larger team)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Cost & Benefit Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Custom cost & benefit items</CardTitle>
                <CardDescription className="text-xs">
                  Add specific costs and expected benefits per item (e.g. licenses, hires, marketing), in USD or JOD.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 text-xs text-gray-300">
                <div className="grid md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-gray-500 mb-1">Description</label>
                    <input
                      className="w-full border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 outline-none transition-colors"
                      placeholder="e.g. Senior backend hire, SaaS subscription"
                      value={newCostItem.description}
                      onChange={(e) => setNewCostItem((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Cost</label>
                    <input
                      type="number"
                      className="w-full border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 outline-none transition-colors"
                      placeholder="e.g. 5000"
                      value={newCostItem.cost}
                      onChange={(e) => setNewCostItem((prev) => ({ ...prev, cost: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Benefit</label>
                    <input
                      type="number"
                      className="w-full border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 outline-none transition-colors"
                      placeholder="e.g. 15000"
                      value={newCostItem.benefit}
                      onChange={(e) => setNewCostItem((prev) => ({ ...prev, benefit: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1">Currency</label>
                    <select
                      className="w-full border border-[var(--brand-700)] rounded-lg px-2 py-1.5 text-xs bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30 outline-none transition-colors"
                      value={newCostItem.currency}
                      onChange={(e) => setNewCostItem((prev) => ({ ...prev, currency: e.target.value as 'USD' | 'JOD' }))}
                    >
                      <option value="USD">USD</option>
                      <option value="JOD">JOD</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <Button
                      size="sm"
                      disabled={!newCostItem.description.trim() || !Number(newCostItem.cost) || !Number(newCostItem.benefit)}
                      onClick={() => {
                        const cost = Number(newCostItem.cost) || 0;
                        const benefit = Number(newCostItem.benefit) || 0;
                        if (!newCostItem.description.trim() || !cost || !benefit) return;
                        setCustomCostItems((prev) => [
                          ...prev,
                          {
                            id: `item_${Date.now()}_${prev.length}`,
                            description: newCostItem.description.trim(),
                            cost,
                            benefit,
                            currency: newCostItem.currency,
                          },
                        ]);
                        setNewCostItem({ description: '', cost: '', benefit: '', currency: newCostItem.currency });
                      }}
                    >
                      Add item
                    </Button>
                  </div>
                </div>

                {customCostItems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>Total custom cost:</span>
                      <span className="font-mono">{totalCustomCost.toLocaleString()} (mixed currencies)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>Total custom benefit:</span>
                      <span className="font-mono">{totalCustomBenefit.toLocaleString()} (mixed currencies)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span>Custom ROI:</span>
                      <span className="font-mono">{isFinite(customRoi) ? `${customRoi.toFixed(0)}%` : 'N/A'}</span>
                    </div>

                    <div className="border-t border-[var(--brand-700)] pt-2 space-y-1 max-h-48 overflow-y-auto">
                      {customCostItems.map((item) => {
                        const itemRoi = item.cost > 0 ? ((item.benefit - item.cost) / item.cost) * 100 : 0;
                        return (
                          <div key={item.id} className="flex items-center justify-between text-[11px] bg-[var(--brand-700)]/50 rounded-lg px-2 py-1.5">
                            <div className="min-w-0">
                              <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.description}</p>
                              <p className="text-[10px] text-gray-500">
                                Cost: {item.cost.toLocaleString()} {item.currency} · Benefit: {item.benefit.toLocaleString()} {item.currency}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-blue-300">{itemRoi.toFixed(0)}%</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[10px] text-red-500 px-1 h-6"
                                onClick={() => setCustomCostItems((prev) => prev.filter((x) => x.id !== item.id))}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Overview Cards */}
            <div className="stagger-container grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="phase-card-hover" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.25)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.15)' }}>
                      <DollarSign className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>${effectiveCostForRoi.toLocaleString()}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Estimated Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="phase-card-hover" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.25)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.15)' }}>
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{totalHours}h</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="phase-card-hover" style={{ background: 'var(--brand-800)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(249,115,22,0.12)' }}>
                      <Target className="h-5 w-5" style={{ color: '#F97316' }} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#fb923c' }}>${effectiveBenefit.toLocaleString()}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Estimated Benefit ({useCustomRoi ? 'custom totals' : '2× assumption'})</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="phase-card-hover" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.25)' }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.15)' }}>
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{roi.toFixed(0)}%</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ROI (Benefit vs Cost)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {phaseMarkdown && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    AI Summary
                  </CardTitle>
                  <CardDescription className="text-sm">Latest AI output for this phase.</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none text-gray-300">
                  <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  {renderRawMarkdownDisclosure()}
                </CardContent>
              </Card>
            )}

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cost vs Benefit Comparison */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Cost vs Benefit (Current Scenario)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Compare total project cost to estimated benefit using either base or custom totals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-xs" style={{ color: 'var(--text-primary)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Cost</span>
                      <span className="font-mono">${effectiveCostForRoi.toLocaleString()}</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden mb-2" style={{ background: 'var(--brand-700)' }}>
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: '50%' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Estimated Benefit</span>
                      <span className="font-mono">${effectiveBenefit.toLocaleString()}</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--brand-700)' }}>
                      <div
                        className="h-full"
                        style={{ background: '#1A6FD4', width: `${effectiveCostForRoi > 0 ? Math.min(100, (effectiveBenefit / effectiveCostForRoi) * 50) : 0}%` }}
                      />
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                      Bars are normalized for display; focus on the relative size between cost and benefit.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost by Phase Chart */}
              <Card>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-blue-400" />
                      Cost Distribution by Phase
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {useManualCostSlices ? 'Using manual overrides' : 'Calculated from current tasks'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="xs" variant="outline" onClick={startEditingCostSlices}>
                      {editingCostSlices ? 'Hide editor' : 'Edit values'}
                    </Button>
                    {useManualCostSlices && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setUseManualCostSlices(false);
                          setManualCostSlices([]);
                        }}
                      >
                        Use actual
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingCostSlices && (
                    <div className="space-y-2 mb-4 text-xs">
                      {manualCostSlices.map((slice, idx) => (
                        <div key={slice.id} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            className="col-span-4 border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                            value={slice.label}
                            onChange={(e) =>
                              setManualCostSlices((prev) =>
                                prev.map((entry, i) =>
                                  i === idx ? { ...entry, label: e.target.value } : entry
                                )
                              )
                            }
                          />
                          <input
                            type="number"
                            className="col-span-3 border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                            value={slice.cost}
                            onChange={(e) =>
                              setManualCostSlices((prev) =>
                                prev.map((entry, i) =>
                                  i === idx ? { ...entry, cost: Number(e.target.value) || 0 } : entry
                                )
                              )
                            }
                          />
                          <input
                            type="number"
                            className="col-span-3 border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                            value={slice.hours}
                            onChange={(e) =>
                              setManualCostSlices((prev) =>
                                prev.map((entry, i) =>
                                  i === idx ? { ...entry, hours: Number(e.target.value) || 0 } : entry
                                )
                              )
                            }
                          />
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() =>
                              setManualCostSlices((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input
                          className="col-span-4 border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                          placeholder="Label"
                          value={manualSliceDraft.label}
                          onChange={(e) => setManualSliceDraft((prev) => ({ ...prev, label: e.target.value }))}
                        />
                        <input
                          type="number"
                          className="col-span-3 border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                          placeholder="Cost"
                          value={manualSliceDraft.cost}
                          onChange={(e) => setManualSliceDraft((prev) => ({ ...prev, cost: e.target.value }))}
                        />
                        <input
                          type="number"
                          className="col-span-3 border border-[var(--brand-700)] rounded px-2 py-1 bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                          placeholder="Hours"
                          value={manualSliceDraft.hours}
                          onChange={(e) => setManualSliceDraft((prev) => ({ ...prev, hours: e.target.value }))}
                        />
                        <Button size="xs" variant="outline" onClick={addManualSlice}>
                          Add
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          onClick={() => {
                            setUseManualCostSlices(true);
                            setEditingCostSlices(false);
                          }}
                          disabled={!manualCostSlices.length}
                        >
                          Apply overrides
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setEditingCostSlices(false);
                            setManualSliceDraft({ label: '', cost: '', hours: '' });
                          }}
                        >
                          Close editor
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {phaseSlicesForChart.map((slice, idx) => {
                      const percentage = totalCost > 0 && !useManualCostSlices ? (slice.cost / totalCost) * 100 : (slice.cost / manualTotalCost) * 100;
                      const colors = ['bg-blue-900/200', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                      const colorIdx = idx % colors.length;
                      return (
                        <div key={slice.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{slice.label}</span>
                            <span style={{ color: 'var(--text-muted)' }}>${Math.round(slice.cost).toLocaleString()} ({Math.round(slice.hours)}h)</span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--brand-700)' }}>
                            <div className={`h-full ${colors[colorIdx]} transition-all`} style={{ width: `${Math.min(100, Math.max(percentage, 0))}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {phaseSlicesForChart.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No cost data available. Add tasks with estimates or switch back to actual data.
                      </p>
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
                      const colors = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-900/200' };
                      const icons = { high: '🔴', medium: '🟡', low: '🟢' };
                      return (
                        <div key={priority} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              {icons[priority as keyof typeof icons]} {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>${data.cost.toLocaleString()}</span>
                          </div>
                          <div className="h-6 rounded-lg overflow-hidden flex items-center" style={{ background: 'var(--brand-700)' }}>
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
                    <div className="rounded-xl p-4" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: '#93c5fd' }}>Conservative Estimate</p>
                      <p className="text-3xl font-bold" style={{ color: '#60a5fa' }}>${Math.round(totalCost * 0.8).toLocaleString()}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>-20% buffer</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.3)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: '#1A6FD4' }}>Base Estimate</p>
                      <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>${totalCost.toLocaleString()}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Current projection</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'var(--brand-800)', border: '1px solid rgba(249,115,22,0.2)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: '#fdba74' }}>With Contingency</p>
                      <p className="text-3xl font-bold" style={{ color: '#fb923c' }}>${Math.round(totalCost * 1.25).toLocaleString()}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>+25% contingency</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Chat Section */}
            <Card className="bg-gradient-to-r from-blue-900/20 to-blue-900/10 border-blue-700/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  AI Cost Analysis
                </CardTitle>
                <CardDescription>Ask AI to analyze costs, suggest optimizations, or generate reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full border border-blue-700/40 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[100px] bg-[#152238]"
                  placeholder="Ask AI to analyze your project costs, suggest budget optimizations, or generate a cost breakdown report..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerate()} disabled={isGenerating || status === 'locked'} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze Costs</>}
                  </Button>
                  <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                    <Download className="mr-2 h-4 w-4" /> Export Report
                  </Button>
                </div>
                {phaseMarkdown && (
                  <div className="border border-blue-700/40 rounded-lg bg-[#152238] p-4 mt-4">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                      {renderRawMarkdownDisclosure()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      </>)
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
                    <p className="text-2xl font-bold text-white">{requirements.length}</p>
                    <p className="text-xs text-gray-500">Requirements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-900/20 to-white border-blue-700/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{requirements.filter(r => r.status === 'approved').length}</p>
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
                    <p className="text-2xl font-bold text-white">{requirements.filter(r => r.status === 'pending').length}</p>
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
                    <p className="text-2xl font-bold text-white">{requirements.length ? Math.round((requirements.filter(r => r.status === 'approved').length / requirements.length) * 100) : 0}%</p>
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
                  <div key={req.requirement_id} className={`p-4 rounded-lg border-l-4 ${req.status === 'approved' ? 'border-l-blue-500 bg-blue-900/20' : req.status === 'rejected' ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{req.title}</p>
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
                  <div key={technique.id} className="p-4 rounded-xl border border-[var(--brand-700)] hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-[#152238]">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <technique.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{technique.name}</p>
                        <p className="text-sm text-gray-500">{technique.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Requirements to Validate - mirror catalog requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Requirements to Validate</span>
                <span className="text-xs text-gray-500">Synced from Requirements Catalog</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requirements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No requirements found for this project yet.</p>
                  <p className="text-sm mt-1">Generate or add requirements in the Requirements phase first.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {requirements.map((req) => (
                    <div
                      key={req.requirement_id}
                      className="border rounded-lg px-3 py-2 flex items-center justify-between gap-3 bg-[#152238]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{req.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{req.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant={req.priority === 'high' || req.priority === 'critical' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                          {req.priority}
                        </Badge>
                        <Badge variant={req.status === 'approved' ? 'success' : req.status === 'in_review' ? 'secondary' : 'outline'} className="text-[10px] uppercase tracking-wide">
                          {req.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {project && phaseId && (
          <div className="no-print">
            <AIChatAssistant projectId={id || ''} projectName={project.name} phase={phaseId} phaseName={phaseConfig?.title || phaseId} />
          </div>
        )}
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
            <Card className="border border-dashed border-[var(--brand-700)]">
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500">Last generated</p>
                  <p className="text-sm font-semibold text-white">{latestArtifact.title}</p>
                  <p className="text-xs text-gray-500">
                    {latestArtifact.metadata?.generated_at
                      ? `Updated ${new Date(latestArtifact.metadata.generated_at).toLocaleString()}`
                      : `Updated ${new Date(latestArtifact.updated_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Phase</p>
                  <p className="text-sm font-semibold text-white">Design & Architecture</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[var(--brand-700)]/50 border border-[var(--brand-700)]">
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
                className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
                    <div key={diagram.id} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${artifact ? 'border-violet-300 bg-violet-50' : 'border-dashed border-gray-300 bg-[var(--brand-700)]/50 hover:border-violet-300'}`} onClick={() => navigate(`/projects/${id}/uml/${diagram.id}`)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${artifact ? 'bg-violet-200' : 'bg-gray-200'}`}>
                          <diagram.icon className={`h-5 w-5 ${artifact ? 'text-violet-600' : 'text-gray-500'}`} />
                        </div>
                        {artifact && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                      </div>
                      <p className="font-medium text-white">{diagram.name}</p>
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
                className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent min-h-[100px] bg-[#152238]"
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
                <div className="border border-violet-200 rounded-lg bg-[#152238] p-4 mt-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                    {renderRawMarkdownDisclosure()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {project && phaseId && (
          <div className="no-print">
            <AIChatAssistant projectId={id || ''} projectName={project.name} phase={phaseId} phaseName={phaseConfig?.title || phaseId} />
          </div>
        )}
      </Layout>
    );
  }

  // ============================================
  // DEFAULT PHASE VIEW (Planning, Requirements Gathering, Development, etc.)
  // ============================================
  return (
    <Layout>
      {id && phaseId && (
        <PhaseStickyHeader
          projectId={id}
          projectName={project?.name}
          currentPhaseId={phaseId}
          phaseStatus={project?.phase_status}
        />
      )}
      <div className="space-y-6">

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
                className="w-full border border-[var(--brand-700)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent min-h-[150px] resize-none"
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
              <div className="border-t border-[var(--brand-700)] pt-4 mt-4">
                <p className="text-sm font-medium text-gray-300 mb-3">Phase Document</p>
                <div className="border border-[var(--brand-700)] rounded-lg bg-[#152238] p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                  {phaseMarkdown ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                      {renderRawMarkdownDisclosure()}
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
      {/* Phase Bottom Tabs: History | Traceability | Discussion */}
      <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: 'var(--brand-850)', border: '1px solid rgba(26,46,69,0.5)' }}>
        {(() => {
          const allTabs = (['history', 'traceability', 'discussion'] as const);
          const visibleTabs = allTabs.filter(t => t !== 'traceability' || phaseId === 'requirements_gathering');
          const labels: Record<string, string> = { history: 'History', traceability: 'Traceability', discussion: 'Discussion' };
          return (
            <div className="relative flex border-b" style={{ borderColor: 'rgba(26,46,69,0.5)' }}>
              {/* DOM-measured sliding underline */}
              <div
                className="absolute bottom-0 h-0.5 rounded-full"
                style={{
                  background: 'var(--blue-400)',
                  width: `${bottomTabUnderline.width}px`,
                  left: `${bottomTabUnderline.left}px`,
                  transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1), width 0.28s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
              {visibleTabs.map((tab, tabIdx) => {
                const isActive = phaseBottomTab === tab;
                return (
                  <button
                    key={tab}
                    ref={el => { bottomTabRefs.current[tabIdx] = el; }}
                    onClick={() => setPhaseBottomTab(tab)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${isActive
                        ? 'text-[var(--blue-400)] bg-[var(--brand-800)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-800)]/50'
                      }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          );
        })()}

        <div
          key={phaseBottomTab}
          className="p-4"
          style={{ animation: 'slideInUp 0.25s ease forwards', opacity: 0 }}
        >
          {phaseBottomTab === 'history' && (
            <VersionHistory
              versions={versionEntries}
              onCompare={handleCompareVersions}
              onRestore={handleRestoreVersion}
            />
          )}
          {phaseBottomTab === 'traceability' && phaseId === 'requirements_gathering' && (
            <TraceabilityMatrix
              requirements={(traceabilityMatrix?.requirements || requirements).map((r: any) => ({ id: r.id || r.requirement_id || '', title: r.title || '', type: r.type || '' }))}
              tasks={(traceabilityMatrix?.tasks || tasks).map((t: any) => ({ id: t.id || t.task_id || '', title: t.title || '', status: t.status || '' }))}
              links={(traceabilityMatrix?.links || []).map(link => ({
                source_id: link.source_id,
                target_id: link.target_id,
                link_type: link.link_type,
              }))}
              coveragePercentage={traceabilityMatrix?.coverage_percentage || 0}
              onCreateLink={handleCreateTraceabilityLink}
            />
          )}
          {phaseBottomTab === 'discussion' && (
            <NegotiationThread
              threadId={discussionThread?.id || `${id}-${phaseId}`}
              title={discussionThread?.title || `${phaseConfig?.title || 'Phase'} Discussion`}
              description={discussionThread?.description || 'Discuss requirements, changes, and decisions for this phase.'}
              status={discussionThread?.status || 'open'}
              comments={nestedDiscussionComments}
              onAddComment={handleAddDiscussionComment}
              onResolve={handleResolveDiscussion}
            />
          )}
        </div>
      </div>
      {editNoteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          role="dialog"
          aria-modal="true"
          onClick={() => !isSavingEditedNote && setEditNoteDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ background: 'var(--brand-850)', border: '1px solid rgba(34,197,94,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b" style={{ borderColor: 'rgba(26,46,69,0.6)' }}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#22c55e]" />
                Edit completion note
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Update the note recorded when this phase was confirmed complete.
              </p>
            </div>
            <div className="p-5">
              <textarea
                value={editNoteValue}
                onChange={(e) => setEditNoteValue(e.target.value)}
                placeholder="Completion note..."
                rows={5}
                disabled={isSavingEditedNote}
                maxLength={2000}
                className="w-full rounded-lg p-3 text-sm bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                style={{ border: '1px solid rgba(26,46,69,0.6)', resize: 'vertical' }}
              />
              <p className="mt-1 text-[10px] text-[var(--text-faint)] text-right">
                {editNoteValue.length}/2000
              </p>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditNoteDialogOpen(false)}
                disabled={isSavingEditedNote}
                className="text-[var(--text-muted)] bg-transparent"
                style={{ borderColor: 'rgba(26,46,69,0.6)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmEditNote}
                disabled={isSavingEditedNote}
                className="font-semibold"
                style={{ background: 'rgba(34,197,94,0.18)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}
              >
                {isSavingEditedNote ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save note
              </Button>
            </div>
          </div>
        </div>
      )}
      {undoDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          role="dialog"
          aria-modal="true"
          onClick={() => !isUndoingComplete && setUndoDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ background: 'var(--brand-850)', border: '1px solid rgba(212,160,23,0.35)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b" style={{ borderColor: 'rgba(26,46,69,0.6)' }}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-[#D4A017]" />
                Unmark {phaseConfig?.title || 'phase'} as complete?
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                This resets the phase status to ready and removes the saved completion note. You can mark it complete again later.
              </p>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-2 mt-5">
              <Button
                variant="outline"
                onClick={() => setUndoDialogOpen(false)}
                disabled={isUndoingComplete}
                className="text-[var(--text-muted)] bg-transparent"
                style={{ borderColor: 'rgba(26,46,69,0.6)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUndoComplete}
                disabled={isUndoingComplete}
                className="font-semibold"
                style={{ background: 'rgba(212,160,23,0.18)', color: '#D4A017', border: '1px solid rgba(212,160,23,0.45)' }}
              >
                {isUndoingComplete ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="mr-2 h-4 w-4" />
                )}
                Yes, unmark complete
              </Button>
            </div>
          </div>
        </div>
      )}
      {completionDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          role="dialog"
          aria-modal="true"
          onClick={() => !isMarkingComplete && setCompletionDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ background: 'var(--brand-850)', border: '1px solid rgba(26,111,212,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b" style={{ borderColor: 'rgba(26,46,69,0.6)' }}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                Mark {phaseConfig?.title || 'Phase'} as complete?
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Add an optional note to capture decisions, reviewers, or caveats. This will appear in the phase header.
              </p>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                Completion notes (optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g., Reviewed with stakeholders, approved scope changes, etc."
                rows={5}
                disabled={isMarkingComplete}
                maxLength={2000}
                className="w-full rounded-lg p-3 text-sm bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]"
                style={{ border: '1px solid rgba(26,46,69,0.6)', resize: 'vertical' }}
              />
              <p className="mt-1 text-[10px] text-[var(--text-faint)] text-right">
                {completionNotes.length}/2000
              </p>
            </div>
            <div className="p-5 pt-0 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCompletionDialogOpen(false)}
                disabled={isMarkingComplete}
                className="text-[var(--text-muted)] bg-transparent"
                style={{ borderColor: 'rgba(26,46,69,0.6)' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmMarkComplete}
                disabled={isMarkingComplete}
                className="font-semibold"
                style={{ background: 'rgba(34,197,94,0.18)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}
              >
                {isMarkingComplete ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirm complete
              </Button>
            </div>
          </div>
        </div>
      )}
      {project && phaseId && (
        <div className="no-print">
          <AIChatAssistant projectId={id || ''} projectName={project.name} phase={phaseId} phaseName={phaseConfig?.title || phaseId} />
        </div>
      )}
    </Layout>
  );
};

export default PhaseDetailPage;