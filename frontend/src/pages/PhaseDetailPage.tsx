import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Artifact, Project, Task, Requirement, SandboxRunResult } from '@/types';
import { phaseConfigs, getPhaseConfig, getNextPhase, phaseColors } from '@/constants/phases';
import { workspacePresets } from '@/constants/workspacePresets';
import { useAuthStore } from '@/store/authStore';
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
        const baseRate = proj.hourly_rate || 100;
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
  }, [id, teamSizeMultiplier, roleMix]);

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

  const latestArtifact = useMemo(() => {
    if (!phaseId) return null;
    return artifacts.find((art) => art.type === `PHASE_${phaseId.toUpperCase()}`);
  }, [artifacts, phaseId]);

  const phaseMarkdown = latestArtifact?.content_json?.markdown || '';
  const phaseRawMarkdown = latestArtifact?.content_json?.raw_markdown || '';

  const RawMarkdownDisclosure: React.FC = () => {
    if (!phaseRawMarkdown || phaseRawMarkdown === phaseMarkdown) {
      return null;
    }
    return (
      <details className="mt-3 text-xs text-gray-500">
        <summary className="cursor-pointer font-medium text-gray-600">
          Show raw AI output
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-700 overflow-x-auto">
          {phaseRawMarkdown}
        </pre>
      </details>
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

  const unifiedPromptRef = useRef<HTMLTextAreaElement | null>(null);

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

  const handleGenerate = async (prompt?: string) => {
    if (!id || !phaseId) return;
    if (!canTriggerAi) {
      setError('Your role cannot run AI generations. Ask a Program Manager for elevated access.');
      return;
    }
    setIsGenerating(true);
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
              { id: 'economic', title: 'Economic Feasibility', color: 'green' },
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
      const color = status === 'completed' ? '#16a34a' : status === 'in_progress' ? '#2563eb' : '#c084fc';
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
        <div className="flex items-center justify-center h-64 bg-navy-950">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
            <span className="text-gray-400 text-sm">Loading phase...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project || !phaseConfig) {
    return (
      <Layout>
        <div className="text-center py-16 bg-navy-950">
          <h2 className="text-2xl font-bold text-white mb-4">Phase not found</h2>
          <Button onClick={() => navigate(`/projects/${id}`)} className="bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold">Back to Project</Button>
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
  const PhaseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const quickActions = [
      {
        id: 'overview',
        label: 'Project Overview',
        icon: LayoutDashboard,
        onClick: () => navigate(`/projects/${id}`),
        disabled: false,
      },
      {
        id: 'export',
        label: 'Export Markdown',
        icon: Download,
        onClick: handleDownload,
        disabled: !phaseMarkdown,
      },
      {
        id: 'rerun',
        label: 'Re-run AI',
        icon: Sparkles,
        onClick: () => handleGenerate(),
        disabled: isGenerating || status === 'locked',
      },
    ];

    const gridTemplate = showSidebar
      ? showToolbar
        ? 'xl:grid-cols-[260px,minmax(0,1fr),72px]'
        : 'xl:grid-cols-[260px,minmax(0,1fr)]'
      : showToolbar
      ? 'xl:grid-cols-[minmax(0,1fr),72px]'
      : '';
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] bg-navy-950">
          <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6 py-6">
            <div className={`grid gap-5 ${gridTemplate}`}>
              {/* Phase Navigation Sidebar */}
              {showSidebar && (
                <aside className="hidden xl:block">
                  <div className="sticky top-6 rounded-2xl shadow-lg shadow-[#0a0f1a]/50" style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}>
                    <PhaseNavigation projectId={id} variant="sidebar" />
                  </div>
                </aside>
              )}

              {/* Main Content */}
              <div className="min-w-0">
                {/* Horizontal Navigation for smaller screens */}
                <div className="xl:hidden mb-4 -mx-2">
                  <PhaseNavigation projectId={id} variant="horizontal" />
                </div>

                <div className="space-y-6">
                  {!canTriggerAi && (
                    <div className="rounded-2xl border border-gold-500/30 bg-gradient-to-r from-navy-900 to-navy-850 p-4 text-sm text-gold-400 flex items-center gap-3 shadow-lg animate-reveal-up">
                      <div className="p-2 bg-gold-500/10 rounded-xl">
                        <Shield className="h-5 w-5 text-gold-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gold-400">Limited Access</p>
                        <p className="text-gray-400">You have {user?.role_label || 'reviewer'} access. A Program Manager must trigger AI generation.</p>
                      </div>
                    </div>
                  )}
                  {/* Phase Header - Corporate Navy Card */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 to-navy-850 shadow-2xl border border-navy-800 animate-reveal-up" data-testid="phase-header">
                    {/* Gold accent bar */}
                    <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400" />
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 text-navy-950 font-bold text-xl shadow-lg shadow-gold-500/20 animate-glow">
                              {phaseConfig.stepNumber}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-gold-500/80 tracking-wider">
                                Phase {(phaseConfig.order || 0) + 1} of {phaseConfigs.length}
                              </p>
                              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                {phaseConfig.title}
                              </h1>
                            </div>
                          </div>
                          <p className="text-gray-400 max-w-md">{phaseConfig.description || project?.name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <Button 
                            variant="outline" 
                            onClick={() => navigate(`/projects/${id}`)} 
                            className="border-navy-700 hover:bg-navy-800 text-gray-300 hover:text-white hover:border-gold-500/50 transition-all"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Project
                          </Button>
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                            status === 'completed' 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30' 
                              : status === 'locked' 
                              ? 'bg-navy-800 text-gray-500 border border-navy-700' 
                              : 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 shadow-gold-500/30'
                          }`}>
                            {status === 'locked' ? '🔒 Locked' : status === 'completed' ? '✓ Completed' : '● In Progress'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {nextPhase && (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 p-[2px] shadow-lg shadow-gold-500/20 animate-reveal-up delay-100" data-testid="next-phase-banner">
                      <div className="bg-navy-900 rounded-[14px] p-5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-500 font-bold border border-gold-500/30">
                            {nextPhase.stepNumber}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gold-500/70 font-semibold">Continue to Next</p>
                            <h3 className="text-lg font-bold text-white">{nextPhase.title}</h3>
                          </div>
                        </div>
                        <Button
                          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-semibold shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all"
                          onClick={() => navigate(`/projects/${id}/phases/${nextPhase.id}`)}
                        >
                          Continue
                          <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  {phaseId !== 'validation' && (
                    <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-850 border border-navy-800 shadow-xl overflow-hidden animate-reveal-up delay-200" data-testid="ai-assistant-card">
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-5">
                          <div className="p-3 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl shadow-lg shadow-gold-500/20">
                            <Sparkles className="h-6 w-6 text-navy-950" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">AI Assistant</h3>
                            <p className="text-sm text-gray-400">Enter a custom prompt to generate or refine content for this phase</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="relative">
                            <textarea
                              ref={unifiedPromptRef}
                              className="w-full border border-navy-700 rounded-2xl px-4 py-4 text-sm bg-navy-900 text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all resize-none"
                              rows={3}
                              placeholder="E.g., 'Generate detailed requirements with acceptance criteria' or 'Create a risk assessment matrix'"
                            />
                            {isGenerating && (
                              <div className="absolute inset-0 bg-navy-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <div className="flex items-center gap-3 text-gold-500">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  <span className="font-medium">Generating content...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => { if (unifiedPromptRef.current) unifiedPromptRef.current.value = 'Generate comprehensive analysis'; }}
                                className="px-3 py-1.5 text-xs font-medium bg-navy-800 border border-navy-700 rounded-full hover:bg-navy-700 hover:border-gold-500/50 text-gray-300 transition-all"
                              >
                                📊 Analysis
                              </button>
                              <button
                                onClick={() => { if (unifiedPromptRef.current) unifiedPromptRef.current.value = 'Create detailed requirements list'; }}
                                className="px-3 py-1.5 text-xs font-medium bg-navy-800 border border-navy-700 rounded-full hover:bg-navy-700 hover:border-gold-500/50 text-gray-300 transition-all"
                              >
                                📋 Requirements
                              </button>
                              <button
                                onClick={() => { if (unifiedPromptRef.current) unifiedPromptRef.current.value = 'Generate risk assessment'; }}
                                className="px-3 py-1.5 text-xs font-medium bg-navy-800 border border-navy-700 rounded-full hover:bg-navy-700 hover:border-gold-500/50 text-gray-300 transition-all"
                              >
                                ⚠️ Risks
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => { if (unifiedPromptRef.current) unifiedPromptRef.current.value = ''; }}
                                disabled={isGenerating}
                                className="border-navy-700 text-gray-300 hover:bg-navy-800"
                              >
                                Clear
                              </Button>
                              <Button
                                disabled={isGenerating}
                                onClick={() => {
                                  const prompt = unifiedPromptRef.current?.value || '';
                                  if (!prompt.trim()) return;
                                  handleGenerate(prompt);
                                }}
                                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-semibold shadow-lg shadow-gold-500/30"
                              >
                                {isGenerating ? 'Generating…' : 'Generate with AI'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase Content */}
                  {children}
                </div>
              </div>

              {/* Right toolbar */}
              {showToolbar && (
                <aside className="hidden xl:flex flex-col items-center gap-4">
                  <div className="sticky top-6 flex flex-col gap-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={action.onClick}
                          disabled={action.disabled}
                          className={`group flex h-14 w-14 items-center justify-center rounded-2xl border border-navy-800 bg-navy-900 text-gray-400 shadow-lg transition hover:shadow-xl hover:border-gold-500/50 hover:text-gold-500 ${
                            action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'
                          }`}
                          aria-label={action.label}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="absolute right-full mr-2 whitespace-nowrap rounded-lg bg-navy-800 border border-navy-700 px-3 py-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
                            {action.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  };

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

            {/* Cost vs Benefit Comparison card removed here; lives in cost_benefit phase instead */}
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

          {/* Requirements Catalog */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    Requirements Catalog
                  </CardTitle>
                  <CardDescription>
                    Functional and non-functional requirements with priority scoring
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncRequirements}
                >
                  Sync Validation
                </Button>
              </div>
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

              <div className="mt-4 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
          requirements={requirements}
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
          requirements={requirements}
          content={phaseMarkdown}
        />
      </PhaseWrapper>
    );
  }

  // ============================================
  // RISKS PHASE
  // ============================================
  if (phaseId === 'risks') {
    return (
      <PhaseWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-200/30 rounded-full blur-3xl"></div>
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Project
                </Button>
                <span className="text-xs uppercase text-red-500 font-semibold tracking-widest">Active Risk Review</span>
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
                      className="bg-gradient-to-r from-red-500 to-amber-500 text-white border-none"
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
                <p className="text-xs uppercase text-gray-500 tracking-wider">Phase</p>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-transparent">
                  Risks & Mitigations
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

          {/* Main layout: Overview + detailed tables */}
          <div className="space-y-4">
            {/* Overview card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
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
                          className="flex-1 min-h-[50px] border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-200"
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
                  <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
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
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Grid2X2 className="h-4 w-4 text-red-500" />
                    Risk Register
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Detailed list of identified risks with impact, likelihood, mitigation, and owner.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingRisks ? (
                    <div className="space-y-3">
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Risk</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Impact</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Likelihood</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Mitigation</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Owner</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-700 border-b border-gray-200 sr-only">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskDraft.riskRows.map((row, idx) => (
                              <tr key={idx} className="bg-white">
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <input
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
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
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white"
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
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white"
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
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs min-h-[60px]"
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
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
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
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Risk</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Impact</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Likelihood</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Mitigation</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Owner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRisks.riskRows.map((row, idx) => {
                            const impact = row.impact.toLowerCase();
                            const likelihood = row.likelihood.toLowerCase();

                            const chip = (level: string) => {
                              const lower = level.toLowerCase();
                              if (lower.startsWith('high')) {
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-medium">🔴 {level}</span>;
                              }
                              if (lower.startsWith('medium')) {
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">🟡 {level}</span>;
                              }
                              if (lower.startsWith('low')) {
                                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">🟢 {level}</span>;
                              }
                              return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[10px] font-medium">{level}</span>;
                            };

                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                                <td className="align-top px-2 py-2 border-b border-gray-100 text-gray-900 font-medium w-48">
                                  {row.risk}
                                </td>
                                <td className="align-top px-2 py-2 border-b border-gray-100">{chip(row.impact)}</td>
                                <td className="align-top px-2 py-2 border-b border-gray-100">{chip(row.likelihood)}</td>
                                <td className="align-top px-2 py-2 border-b border-gray-100 text-gray-700 max-w-xs">
                                  <p className="whitespace-normal break-words">{row.mitigation}</p>
                                </td>
                                <td className="align-top px-2 py-2 border-b border-gray-100 text-gray-700 w-32">{row.owner}</td>
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
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Aspect</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Before</th>
                              <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">After</th>
                              <th className="px-2 py-2 text-right font-semibold text-gray-700 border-b border-gray-200 sr-only">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskDraft.beforeAfter.map((row, idx) => (
                              <tr key={idx} className="bg-white">
                                <td className="px-2 py-2 border-b border-gray-100">
                                  <input
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
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
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs min-h-[50px]"
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
                                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs min-h-[50px]"
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
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Aspect</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">Before</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200">After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRisks.beforeAfter.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                              <td className="px-2 py-2 border-b border-gray-100 text-gray-900 font-medium">{row.aspect}</td>
                              <td className="px-2 py-2 border-b border-gray-100 text-gray-700">{row.before}</td>
                              <td className="px-2 py-2 border-b border-gray-100 text-gray-700">{row.after}</td>
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
                    <ListChecks className="h-4 w-4 text-emerald-500" />
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
                            className="flex-1 min-h-[45px] border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-200"
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
                    <ul className="space-y-1 text-xs text-gray-700">
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
      <PhaseWrapper>
        <>
          <div className="space-y-6">

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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent cursor-pointer hover:border-purple-300 transition-colors"
                        value={newTask.start_date}
                        onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent cursor-pointer hover:border-purple-300 transition-colors"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                        min={newTask.start_date || undefined}
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

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-purple-900">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Task Insights
              </CardTitle>
              <CardDescription className="text-sm text-purple-700">
                Ask the assistant to summarize execution risks, propose a new sprint, or refine dependencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent min-h-[90px] bg-white"
                placeholder="E.g., “Summarize task dependencies”, “Highlight schedule risks”, “Draft QA tasks for sprint 2”"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || status === 'locked'}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Generate Insight
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!phaseMarkdown}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
              <div className="border border-purple-100 rounded-xl bg-white/80 p-4 min-h-[160px]">
                {phaseMarkdown ? (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                    <RawMarkdownDisclosure />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-sm text-gray-500 gap-1 py-6">
                    <Sparkles className="h-6 w-6 text-purple-400" />
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
        </>
      </PhaseWrapper>
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
      <PhaseWrapper>
        <>
          <div className="space-y-6">


          {/* Scenario Presets + Team Size Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-gray-600">Scenario presets:</div>
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

          <Card className="border-emerald-200 bg-emerald-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Team Size Scenario
              </CardTitle>
              <CardDescription className="text-xs">
                Move the slider to simulate a smaller or larger team. This scales hourly cost and all charts/cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex flex-col gap-2 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Team size multiplier</span>
                  <span className="font-mono text-emerald-700">{teamSizeMultiplier.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={teamSizeMultiplier}
                  onChange={(e) => setTeamSizeMultiplier(parseFloat(e.target.value) || 1)}
                  className="w-full accent-emerald-600"
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
            <CardContent className="pt-0 space-y-4 text-xs text-gray-700">
              <div className="grid md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-gray-500 mb-1">Description</label>
                  <input
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    placeholder="e.g. Senior backend hire, SaaS subscription"
                    value={newCostItem.description}
                    onChange={(e) => setNewCostItem((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Cost</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    placeholder="e.g. 5000"
                    value={newCostItem.cost}
                    onChange={(e) => setNewCostItem((prev) => ({ ...prev, cost: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Benefit</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
                    placeholder="e.g. 15000"
                    value={newCostItem.benefit}
                    onChange={(e) => setNewCostItem((prev) => ({ ...prev, benefit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Currency</label>
                  <select
                    className="w-full border rounded-lg px-2 py-1.5 text-xs"
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
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Total custom cost:</span>
                    <span className="font-mono">{totalCustomCost.toLocaleString()} (mixed currencies)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Total custom benefit:</span>
                    <span className="font-mono">{totalCustomBenefit.toLocaleString()} (mixed currencies)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Custom ROI:</span>
                    <span className="font-mono">{isFinite(customRoi) ? `${customRoi.toFixed(0)}%` : 'N/A'}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 space-y-1 max-h-48 overflow-y-auto">
                    {customCostItems.map((item) => {
                      const itemRoi = item.cost > 0 ? ((item.benefit - item.cost) / item.cost) * 100 : 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between text-[11px] bg-gray-50 rounded-lg px-2 py-1.5">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{item.description}</p>
                            <p className="text-[10px] text-gray-500">
                              Cost: {item.cost.toLocaleString()} {item.currency} · Benefit: {item.benefit.toLocaleString()} {item.currency}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono text-emerald-700">{itemRoi.toFixed(0)}%</span>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${effectiveCostForRoi.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-gray-900">${effectiveBenefit.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Estimated Benefit ({useCustomRoi ? 'custom totals' : '2× assumption'})</p>
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
                    <p className="text-2xl font-bold text-gray-900">{roi.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">ROI (Benefit vs Cost)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {phaseMarkdown && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  AI Summary
                </CardTitle>
                <CardDescription className="text-sm">Latest AI output for this phase.</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                <RawMarkdownDisclosure />
              </CardContent>
            </Card>
          )}

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Cost vs Benefit Comparison */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Cost vs Benefit (Current Scenario)
                </CardTitle>
                <CardDescription className="text-xs">
                  Compare total project cost to estimated benefit using either base or custom totals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Cost</span>
                    <span className="font-mono">${effectiveCostForRoi.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: '50%' }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estimated Benefit</span>
                    <span className="font-mono">${effectiveBenefit.toLocaleString()}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${effectiveCostForRoi > 0 ? Math.min(100, (effectiveBenefit / effectiveCostForRoi) * 50) : 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">
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
                    <PieChart className="h-5 w-5 text-emerald-500" />
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
                          className="col-span-4 border rounded px-2 py-1"
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
                          className="col-span-3 border rounded px-2 py-1"
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
                          className="col-span-3 border rounded px-2 py-1"
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
                        className="col-span-4 border rounded px-2 py-1"
                        placeholder="Label"
                        value={manualSliceDraft.label}
                        onChange={(e) => setManualSliceDraft((prev) => ({ ...prev, label: e.target.value }))}
                      />
                      <input
                        type="number"
                        className="col-span-3 border rounded px-2 py-1"
                        placeholder="Cost"
                        value={manualSliceDraft.cost}
                        onChange={(e) => setManualSliceDraft((prev) => ({ ...prev, cost: e.target.value }))}
                      />
                      <input
                        type="number"
                        className="col-span-3 border rounded px-2 py-1"
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
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                    const colorIdx = idx % colors.length;
                    return (
                      <div key={slice.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{slice.label}</span>
                          <span className="text-gray-500">${Math.round(slice.cost).toLocaleString()} ({Math.round(slice.hours)}h)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
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
                    <RawMarkdownDisclosure />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
      </PhaseWrapper>
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
                      className="border rounded-lg px-3 py-2 flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
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
                    <RawMarkdownDisclosure />
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
                      <RawMarkdownDisclosure />
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
