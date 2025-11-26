import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Project, Requirement, Task, Artifact, GenerationJob } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  CheckSquare,
  LayoutDashboard,
  AlertCircle,
  Image,
  AlertTriangle,
  DollarSign,
  Download,
  Link2,
} from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '@/lib/utils';

const DEFAULT_COST_ASSUMPTIONS = {
  teamSize: 6,
  avgRate: 110,
  timelineMonths: 5,
  benefitMultiplier: 1.25,
};

const BASE_COST_ROLES = [
  { role: 'Product/PM', hours: 120, rate: 120, color: 'bg-blue-500' },
  { role: 'Design', hours: 180, rate: 95, color: 'bg-purple-500' },
  { role: 'Frontend', hours: 220, rate: 110, color: 'bg-amber-500' },
  { role: 'Backend', hours: 240, rate: 125, color: 'bg-emerald-500' },
  { role: 'QA', hours: 140, rate: 80, color: 'bg-rose-500' },
];

const BENEFIT_SCENARIOS = [
  { label: 'Optimistic', multiplier: 1.5, color: 'bg-emerald-400' },
  { label: 'Expected', multiplier: 1.2, color: 'bg-blue-400' },
  { label: 'Pessimistic', multiplier: 0.85, color: 'bg-orange-400' },
];

type RiskLevel = 'High' | 'Medium' | 'Low';

type RiskSample = {
  id: string;
  title: string;
  description: string;
  probability: RiskLevel;
  impact: RiskLevel;
  owner: string;
  mitigation: string;
  status: 'Open' | 'Mitigating' | 'Watching';
  category: string;
};

const RISK_SAMPLES: RiskSample[] = [
  {
    id: 'RISK-01',
    title: 'Vendor OAuth dependency',
    description: 'Critical 3rd-party API may slip by four weeks, blocking integration flow.',
    probability: 'High',
    impact: 'High',
    owner: 'Platform Team',
    mitigation: 'Confirm interim mock server + add contingency sprint in roadmap.',
    status: 'Open',
    category: 'Dependencies',
  },
  {
    id: 'RISK-02',
    title: 'Scope creep during workshops',
    description: 'Stakeholders keep adding “nice to have” flows mid-sprint.',
    probability: 'Medium',
    impact: 'High',
    owner: 'Product',
    mitigation: 'Lock change board + timebox discovery questions per phase.',
    status: 'Mitigating',
    category: 'Process',
  },
  {
    id: 'RISK-03',
    title: 'Security review backlog',
    description: 'Cloud team is already carrying 3 audits; review may be delayed.',
    probability: 'Medium',
    impact: 'Medium',
    owner: 'Security',
    mitigation: 'Submit artifacts early and share draft SRS for parallel review.',
    status: 'Watching',
    category: 'Compliance',
  },
  {
    id: 'RISK-04',
    title: 'Internal skill gap',
    description: 'Only one engineer has experience with the target AI provider SDK.',
    probability: 'Low',
    impact: 'High',
    owner: 'Engineering',
    mitigation: 'Schedule enablement session + secure contractor backup.',
    status: 'Open',
    category: 'Resourcing',
  },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  High: 'bg-orange-500',
  Medium: 'bg-yellow-400',
  Low: 'bg-emerald-500',
};

type GenerationOptions = {
  detailLevel?: string;
  includeUml?: boolean;
  includeTasks?: boolean;
  regenerateRequirements?: boolean;
  generateSrs?: boolean;
  generateRisks?: boolean;
  generateCosts?: boolean;
  umlTypes?: string[];
};

type DraftSectionKey = 'overview' | 'requirements' | 'srs' | 'tasks' | 'risks' | 'costs';

const diagramTypeOptions = [
  { id: 'use_case', label: 'Use Case', description: 'Actors and flows' },
  { id: 'class_diagram', label: 'Class Diagram', description: 'Domain structure' },
  { id: 'sequence', label: 'Sequence Diagram', description: 'Runtime collaboration' },
  { id: 'entity_relationship', label: 'ER Diagram', description: 'Data model relationships' },
];

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const diagramArtifacts = useMemo(() => {
    const map: Record<string, Artifact> = {};
    artifacts.forEach((artifact) => {
      if (artifact.type?.startsWith('uml_')) {
        map[artifact.type] = artifact;
      }
    });
    return map;
  }, [artifacts]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requirements' | 'srs' | 'tasks' | 'diagrams' | 'traceability' | 'risks' | 'costs'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tourRun, setTourRun] = useState(false);
  const [exportingRequirements, setExportingRequirements] = useState(false);
  const [exportingSrs, setExportingSrs] = useState(false);
  const [costAssumptions, setCostAssumptions] = useState(DEFAULT_COST_ASSUMPTIONS);
  const [costSnapshots, setCostSnapshots] = useState<
    { id: string; label: string; createdAt: string; assumptions: typeof costAssumptions; totals: any }[]
  >([]);
  const riskInsights = useMemo(() => {
    const weights: Record<RiskLevel, number> = { High: 3, Medium: 2, Low: 1 };
    const severityCounts: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 };
    const heatmap: Record<RiskLevel, Record<RiskLevel, number>> = {
      High: { High: 0, Medium: 0, Low: 0 },
      Medium: { High: 0, Medium: 0, Low: 0 },
      Low: { High: 0, Medium: 0, Low: 0 },
    };

    const enriched = [...RISK_SAMPLES].map((risk) => {
      const score = weights[risk.probability] * weights[risk.impact];
      const severity: RiskLevel = score >= 8 ? 'High' : score >= 4 ? 'Medium' : 'Low';
      severityCounts[severity] += 1;
      heatmap[risk.probability][risk.impact] += 1;
      return { ...risk, score, severity };
    });

    enriched.sort((a, b) => b.score - a.score);

    return {
      total: enriched.length,
      severityCounts,
      heatmap,
      watchlist: enriched.filter((risk) => risk.status !== 'Mitigating').slice(0, 3),
      mitigationsReady: enriched.filter((risk) => risk.status === 'Mitigating').length,
      enriched,
    };
  }, []);
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
    let interval: ReturnType<typeof setInterval> | undefined;
    if (generationJobId) {
      interval = setInterval(() => {
        checkGenerationStatus();
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generationJobId]);

  useEffect(() => {
    const seenTour = localStorage.getItem('acorn_phase_tour');
    if (!seenTour) {
      setTourRun(true);
    }
  }, []);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const projectData = await api.getProject(id!);
      setProject(projectData);
      if (projectData.phase_status) {
        setPhaseStatus(projectData.phase_status);
      }

      // Load related data
      const [reqData, taskData, artData] = await Promise.all([
        api.getRequirements(id!),
        api.getTasks(id!),
        api.getArtifacts(id!),
      ]);

      setRequirements(reqData);
      setTasks(taskData);
      setArtifacts(artData);
      try {
        const status = await api.getPhaseStatus(id!);
        setPhaseStatus(status.phases);
      } catch (phaseErr) {
        console.error('Failed to refresh phase status', phaseErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const checkGenerationStatus = async () => {
    if (!generationJobId) return;

    try {
      const job: GenerationJob = await api.getGenerationJob(generationJobId);

      if (job.status === 'COMPLETED') {
        setIsGenerating(false);
        setGenerationJobId(null);
        // Reload project data
        await loadProjectData();
      } else if (job.status === 'FAILED') {
        setIsGenerating(false);
        setGenerationJobId(null);
        setError(job.error_message || 'Generation failed');
      }
    } catch (err) {
      console.error('Failed to check job status:', err);
    }
  };

  const tier = project?.feature_tier || 'pro';
  const tierFlags = {
    allowTasks: tier === 'advanced' || tier === 'pro',
    allowDiagrams: tier === 'advanced' || tier === 'pro',
    allowRisks: tier === 'pro',
    allowCosts: tier === 'pro',
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requirements', label: 'Requirements', icon: FileText },
    { id: 'srs', label: 'SRS', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'diagrams', label: 'Diagrams', icon: Image },
    { id: 'traceability', label: 'Traceability', icon: Link2 },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
    { id: 'costs', label: 'Costs', icon: DollarSign },
  ];

  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === 'tasks' && !tierFlags.allowTasks) return false;
    if (tab.id === 'diagrams' && !tierFlags.allowDiagrams) return false;
    if (tab.id === 'risks' && !tierFlags.allowRisks) return false;
    if (tab.id === 'costs' && !tierFlags.allowCosts) return false;
    return true;
  });

  useEffect(() => {
    if (!visibleTabs.find((tab) => tab.id === activeTab)) {
      const fallback = visibleTabs[0]?.id || 'overview';
      setActiveTab(fallback as any);
    }
  }, [visibleTabs, activeTab]);

  const triggerGeneration = async ({
    detailLevel = 'STANDARD',
    includeUml = false,
    includeTasks = false,
    regenerateRequirements = true,
    generateSrs = true,
    generateRisks = true,
    generateCosts = true,
    umlTypes,
  }: GenerationOptions = {}) => {
    if (!id) return;
    try {
      setIsGenerating(true);
      setError(null);
      const result = await api.generateProject(id, {
        detail_level: (detailLevel || 'standard').toLowerCase(),
        include_uml: includeUml && tierFlags.allowDiagrams,
        include_tasks: includeTasks && tierFlags.allowTasks,
        regenerate_requirements: regenerateRequirements,
        generate_srs: generateSrs,
        generate_risks: generateRisks,
        generate_costs: generateCosts,
        ...(umlTypes && umlTypes.length ? { uml_types: umlTypes } : {}),
      });
      setGenerationJobId(result.job_id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Generation failed');
      setIsGenerating(false);
    }
  };

  const handleDiagramGenerate = (diagramType: string) => {
    return triggerGeneration({
      detailLevel: 'STANDARD',
      includeUml: true,
      includeTasks: false,
      regenerateRequirements: false,
      generateSrs: false,
      generateRisks: false,
      generateCosts: false,
      umlTypes: [diagramType],
    });
  };

  const triggerDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRequirements = async () => {
    if (!id) return;
    setExportingRequirements(true);
    setError(null);
    try {
      const data = await api.exportRequirements(id);
      triggerDownload(`requirements-${project?.name || 'project'}.json`, JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to export requirements');
    } finally {
      setExportingRequirements(false);
    }
  };

  const handleExportSrs = async () => {
    if (!id) return;
    setExportingSrs(true);
    setError(null);
    try {
      const data = await api.exportSrs(id);
      triggerDownload(`srs-${project?.name || 'project'}.json`, JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to export SRS');
    } finally {
      setExportingSrs(false);
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

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
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

  const handleAssumptionChange = (key: keyof typeof costAssumptions, value: number) => {
    setCostAssumptions((prev) => ({ ...prev, [key]: value }));
  };

  const costRoleBreakdown = useMemo(() => {
    const teamFactor = costAssumptions.teamSize / DEFAULT_COST_ASSUMPTIONS.teamSize;
    const timelineFactor = costAssumptions.timelineMonths / DEFAULT_COST_ASSUMPTIONS.timelineMonths;
    const rateFactor = costAssumptions.avgRate / DEFAULT_COST_ASSUMPTIONS.avgRate;
    return BASE_COST_ROLES.map((role) => {
      const hours = Math.round(role.hours * teamFactor * timelineFactor);
      const rate = Math.round(role.rate * rateFactor);
      const cost = hours * rate;
      return { ...role, hours, rate, cost };
    });
  }, [costAssumptions]);

  const totalCost = useMemo(
    () => costRoleBreakdown.reduce((sum, role) => sum + role.cost, 0),
    [costRoleBreakdown]
  );

  const benefitScenarioData = useMemo(() => {
    return BENEFIT_SCENARIOS.map((scenario) => {
      const benefit =
        250000 * costAssumptions.benefitMultiplier * scenario.multiplier +
        costAssumptions.teamSize * 2000;
      return {
        ...scenario,
        benefit: Math.round(benefit),
        cost: Math.round(totalCost),
      };
    });
  }, [costAssumptions, totalCost]);
  const roiTarget = (benefitScenarioData[1]?.benefit || 0) - totalCost;

  const handleSaveSnapshot = () => {
    const snapshot = {
      id: `${Date.now()}`,
      label: `Snapshot ${costSnapshots.length + 1}`,
      createdAt: new Date().toISOString(),
      assumptions: costAssumptions,
      totals: {
        totalCost,
        roleBreakdown: costRoleBreakdown,
        scenarios: benefitScenarioData,
      },
    };
    setCostSnapshots((prev) => [snapshot, ...prev].slice(0, 5));
  };

  const handleDownloadSnapshot = (snapshot: (typeof costSnapshots)[number]) => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name || 'acorn'}-${snapshot.label.replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const traceabilityRows = useMemo(() => {
    const requirementMap = requirements.map((req) => ({
      requirement: req,
      tasks: tasks.filter((task) => task.requirement_id === req.requirement_id),
    }));
    const orphans = tasks.filter((task) => !task.requirement_id);
    return { requirementMap, orphans };
  }, [requirements, tasks]);

  const srsArtifact = artifacts.find((a) => a.type === 'SRS');
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
    <>
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
        {/* Header */}
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
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 overflow-x-auto">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="space-y-4 phase-board">
              {phaseConfigs.map((phase) => {
                const status = phaseStatus[phase.id] || 'locked';
                const output = phaseOutputs[phase.id];
                const locked = status === 'locked';
                return (
                  <Card key={phase.id} className="phase-card">
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {phase.title}
                          <Badge
                            variant={
                              status === 'completed'
                                ? 'success'
                                : status === 'ready'
                                ? 'default'
                                : status === 'in_progress'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {status.replace('_', ' ')}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`)
                        }
                      >
                        View Phase
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">{phase.description}</p>
                      <div className="text-xs text-gray-500">
                        {locked
                          ? 'Locked until previous phase is complete.'
                          : status === 'completed'
                          ? 'Phase completed. Review the latest summary below.'
                          : status === 'in_progress'
                          ? 'In progress — open the phase to continue collaborating with Acorn.'
                          : 'Ready to start — open the phase when you are ready to work on it.'}
                      </div>
                      {output ? (
                        <div className="border border-gray-100 rounded-md p-3 bg-gray-50 max-h-64 overflow-auto text-sm">
                          <ReactMarkdown>{output}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-200 rounded-md p-4 text-xs text-gray-500">
                          No summary has been generated for this phase yet. Use “View Phase” to open Acorn Draft and
                          capture details.
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
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.template_type.replace('_', ' ')}
                    </dd>
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
        )}

        {activeTab === 'requirements' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Requirements ({requirements.length})</CardTitle>
                <CardDescription>Extracted and structured requirements</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => goToDraft('requirements')}>
                  Open Acorn Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportRequirements}
                  disabled={exportingRequirements}
                >
                  {exportingRequirements ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-3 w-3" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {requirements.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No requirements yet. Click "Generate with AI" to extract requirements.
                </p>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => (
                    <div
                      key={req.requirement_id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge>{req.type}</Badge>
                          <Badge variant={getPriorityVariant(req.priority)}>{req.priority}</Badge>
                        </div>
                        <Badge variant="default">{req.status}</Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{req.title}</h4>
                      <p className="text-sm text-gray-600">{req.description}</p>
                      {req.confidence_score && (
                        <p className="text-xs text-gray-500 mt-2">
                          Confidence: {(req.confidence_score * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'srs' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Software Requirements Specification</CardTitle>
                <CardDescription>Detailed SRS document</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => goToDraft('srs')}>
                  Open Acorn Draft
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSrs} disabled={exportingSrs}>
                  {exportingSrs ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-3 w-3" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!srsArtifact ? (
                <p className="text-gray-600 text-center py-8">
                  No SRS generated yet. Click "Generate with AI" to create the SRS document.
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(srsArtifact.content_json).map(([section, content]: any) => (
                    <div key={section} className="border-b border-gray-200 pb-4 last:border-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-3 capitalize">
                        {section.replace(/_/g, ' ')}
                      </h3>
                      {typeof content === 'object' ? (
                        Object.entries(content).map(([subsection, subcontent]: any) => (
                          <div key={subsection} className="ml-4 mb-3">
                            <h4 className="font-medium text-gray-900 mb-2 capitalize">
                              {subsection.replace(/_/g, ' ')}
                            </h4>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{subcontent}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Tasks ({tasks.length})</CardTitle>
                <CardDescription>Work breakdown and estimates</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => goToDraft('tasks')}>
                Open Acorn Draft
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No tasks yet. Click "Generate with AI" to create task breakdown.
                </p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge>{task.status}</Badge>
                          <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                        </div>
                        <span className="text-sm text-gray-600">{task.estimate_hours}h</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      {task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'traceability' && (
          <Card>
            <CardHeader>
              <CardTitle>Traceability Matrix</CardTitle>
              <CardDescription>Map requirements to generated tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {traceabilityRows.requirementMap.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No requirements yet. Generate requirements to populate the matrix.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Requirement</th>
                        <th className="px-4 py-2 text-left">Linked Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceabilityRows.requirementMap.map(({ requirement, tasks }) => (
                        <tr key={requirement.requirement_id} className="border-t border-gray-100">
                          <td className="px-4 py-3 align-top">
                            <p className="font-semibold text-gray-900">{requirement.title}</p>
                            <p className="text-xs text-gray-500">{requirement.type}</p>
                          </td>
                          <td className="px-4 py-3">
                            {tasks.length === 0 ? (
                              <p className="text-xs text-gray-500">No tasks linked yet.</p>
                            ) : (
                              <ul className="space-y-2">
                                {tasks.map((task) => (
                                  <li
                                    key={task.task_id}
                                    className="border border-gray-200 rounded-md px-3 py-2 bg-white shadow-sm"
                                  >
                                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {task.estimate_hours}h · {task.priority}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {traceabilityRows.orphans.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Unlinked tasks</p>
                  <p className="text-xs mb-2">
                    These tasks are not linked to a requirement yet. Consider assigning them for better coverage.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {traceabilityRows.orphans.map((task) => (
                      <span key={task.task_id} className="bg-white border border-amber-200 px-2 py-1 rounded text-xs">
                        {task.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'diagrams' && (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 flex-wrap gap-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Diagram Studio</p>
                  <p className="text-sm text-gray-700">
                    Open the dedicated canvas to drag, drop, and edit freeform diagrams with the AI assistant.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/diagram-studio`)}
                >
                  Open Diagram Studio
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagramTypeOptions.map((option) => {
                const artifact = diagramArtifacts[`uml_${option.id}`];
                const diagramUrl = artifact?.metadata?.plantuml_svg_url;
                const plantumlSource = artifact?.content_json?.plantuml;
                return (
                  <Card key={option.id} className="overflow-hidden border border-slate-800/40 shadow-xl bg-slate-900 text-white">
                    <div className="flex items-center justify-between px-5 py-4 bg-slate-900/80 border-b border-white/10">
                      <div>
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-slate-300">{option.description}</p>
                      </div>
                      <Button
                        onClick={() => handleDiagramGenerate(option.id)}
                        disabled={isGenerating || !tierFlags.allowDiagrams}
                        className="bg-amber-500 hover:bg-amber-400 text-white"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-[280px] flex items-center justify-center">
                      {!artifact ? (
                        <div className="text-center space-y-2 text-slate-300">
                          <Image className="h-8 w-8 text-slate-600 mx-auto" />
                          <p className="text-sm">No {option.label} diagram yet.</p>
                          <p className="text-xs text-slate-500">Use Generate to create it.</p>
                        </div>
                      ) : diagramUrl ? (
                        <img
                          src={diagramUrl}
                          alt={`${project.name} ${option.label} diagram`}
                          className="w-full max-h-[240px] object-contain rounded-lg border border-slate-800 bg-white"
                        />
                      ) : (
                        <pre className="p-4 text-xs text-slate-100 whitespace-pre-wrap font-mono bg-slate-900/60 rounded-lg border border-slate-800 max-h-[240px] w-full overflow-auto">
                          {plantumlSource}
                        </pre>
                      )}
                    </div>
                    {artifact && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-xs">
                        <span className="text-slate-400">Updated {formatDate(artifact.updated_at)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-100"
                          onClick={() =>
                            navigate(`/projects/${project.project_id || project.id}/uml/${option.id}/edit`)
                          }
                        >
                          Edit Diagram
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Risks</CardTitle>
                <CardDescription>Risk insights will appear here once generated.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => goToDraft('risks')}>
                Open Acorn Draft
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total logged', value: riskInsights.total, helper: 'Tracked issues' },
                  {
                    label: 'High severity',
                    value: riskInsights.severityCounts.High,
                    helper: 'Require owner actions',
                  },
                  {
                    label: 'Medium severity',
                    value: riskInsights.severityCounts.Medium,
                    helper: 'Monitor weekly',
                  },
                  {
                    label: 'Mitigations active',
                    value: riskInsights.mitigationsReady,
                    helper: 'Playbooks in motion',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm"
                  >
                    <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.helper}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk distribution</h4>
                  <div className="space-y-3">
                    {(['High', 'Medium', 'Low'] as RiskLevel[]).map((level) => {
                      const count = riskInsights.severityCounts[level];
                      const percent = riskInsights.total
                        ? Math.round((count / riskInsights.total) * 100)
                        : 0;
                      return (
                        <div key={level}>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="inline-flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${RISK_COLORS[level]}`} />
                              {level} impact
                            </span>
                            <span className="font-semibold text-gray-900">
                              {count}{' '}
                              <span className="text-xs font-normal text-gray-400">({percent}%)</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${RISK_COLORS[level]}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Distribution of risk severities across the current backlog.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Probability × Impact heatmap</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    {(['High', 'Medium', 'Low'] as RiskLevel[]).map((prob) =>
                      (['High', 'Medium', 'Low'] as RiskLevel[]).map((impact) => {
                        const count = riskInsights.heatmap[prob][impact];
                        let intensity = 'bg-gray-50 text-gray-500';
                        if (count >= 3) intensity = 'bg-red-500/80 text-white';
                        else if (count === 2) intensity = 'bg-orange-400/90 text-white';
                        else if (count === 1) intensity = 'bg-yellow-200 text-gray-800';
                        return (
                          <div key={`${prob}-${impact}`} className={`rounded-md p-3 ${intensity}`}>
                            <p className="text-xs font-semibold">{prob[0]}/{impact[0]}</p>
                            <p className="text-lg font-bold">{count}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Counts represent how many risks fall into each probability/impact combination.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Critical watchlist</h4>
                    <p className="text-xs text-gray-500">
                      Top exposures that still need a clear mitigation owner.
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    Updated hourly
                  </Badge>
                </div>
                <div className="space-y-3">
                  {riskInsights.watchlist.map((risk) => (
                    <div
                      key={risk.id}
                      className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 space-y-2"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{risk.title}</p>
                          <p className="text-xs text-gray-500">{risk.description}</p>
                        </div>
                        <Badge
                          className={`capitalize ${
                            risk.severity === 'High'
                              ? 'bg-rose-500 text-white'
                              : risk.severity === 'Medium'
                              ? 'bg-yellow-400 text-gray-900'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {risk.severity} severity
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-400">Owner:</span> {risk.owner}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-400">Category:</span> {risk.category}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-400">Status:</span> {risk.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Mitigation: <span className="text-gray-600">{risk.mitigation}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <p>
                  Run the Risk phase (or open Acorn Draft) to replace this sample board with AI-generated,
                  project-specific risks, owners, and mitigations synced to your documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'costs' && (
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Costs</CardTitle>
                <CardDescription>Cost breakdown placeholder</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => goToDraft('costs')}>
                Open Acorn Draft
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="text-sm text-gray-600">
                  Team size: <span className="font-semibold text-gray-900">{costAssumptions.teamSize} FTE</span>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={costAssumptions.teamSize}
                    onChange={(e) => handleAssumptionChange('teamSize', Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Avg hourly rate:{' '}
                  <span className="font-semibold text-gray-900">${costAssumptions.avgRate}/hr</span>
                  <input
                    type="range"
                    min={70}
                    max={160}
                    step={5}
                    value={costAssumptions.avgRate}
                    onChange={(e) => handleAssumptionChange('avgRate', Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Timeline:{' '}
                  <span className="font-semibold text-gray-900">{costAssumptions.timelineMonths} months</span>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={costAssumptions.timelineMonths}
                    onChange={(e) => handleAssumptionChange('timelineMonths', Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Benefit multiplier:{' '}
                  <span className="font-semibold text-gray-900">
                    {costAssumptions.benefitMultiplier.toFixed(2)}x
                  </span>
                  <input
                    type="range"
                    min={0.8}
                    max={1.8}
                    step={0.05}
                    value={costAssumptions.benefitMultiplier}
                    onChange={(e) => handleAssumptionChange('benefitMultiplier', Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCostAssumptions(DEFAULT_COST_ASSUMPTIONS)}
                >
                  Reset assumptions
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveSnapshot}>
                  Save snapshot
                </Button>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    Estimated cost: ${totalCost.toLocaleString()}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-emerald-600">
                    ROI target: $
                    {roiTarget.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Cost Breakdown by Role</h4>
                  <div className="space-y-2">
                    {costRoleBreakdown.map((row) => {
                      const width = Math.min(100, Math.round((row.cost / (totalCost || 1)) * 100));
                      return (
                        <div key={row.role} className="space-y-1">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{row.role}</span>
                            <span>${row.cost.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div className={`h-full ${row.color} rounded-full`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Cost vs Benefit</h4>
                  <div className="flex items-end gap-4 h-48 overflow-x-auto pb-2">
                    {benefitScenarioData.map((scenario) => (
                      <div
                        key={scenario.label}
                        className="min-w-[120px] flex-1 text-sm text-center text-gray-600"
                      >
                        <div className="relative flex flex-col items-center gap-1">
                          <div
                            className="w-full max-w-[70px] rounded-t-md bg-gray-200"
                            style={{ height: `${Math.max(40, (scenario.cost / (totalCost || 1)) * 140)}px` }}
                          >
                            <div className="text-[10px] text-gray-500 rotate-90 origin-top-right translate-x-3 translate-y-2">
                              ${scenario.cost / 1000}K
                            </div>
                          </div>
                          <div
                            className={`w-full max-w-[70px] rounded-t-md ${scenario.color}`}
                            style={{
                              height: `${Math.max(40, (scenario.benefit / (scenario.cost || 1)) * 90)}px`,
                            }}
                          >
                            <div className="text-[10px] text-white rotate-90 origin-top-right translate-x-5 translate-y-2">
                              ${scenario.benefit / 1000}K
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 font-semibold">{scenario.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Bars show cost base (gray) with incremental benefit (color) for each scenario.
                  </p>
                </div>
              </div>
              {costSnapshots.length > 0 && (
                <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Snapshots</h4>
                    <span className="text-xs text-gray-500">Latest {costSnapshots.length} saved states</span>
                  </div>
                  <div className="space-y-2">
                    {costSnapshots.map((snap) => (
                      <div
                        key={snap.id}
                        className="rounded-md bg-white border border-gray-200 px-3 py-2 flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{snap.label}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(snap.createdAt).toLocaleString()} · ${snap.totals.totalCost.toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadSnapshot(snap)}>
                          Download JSON
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </div>
      </Layout>
    </>
  );
};
