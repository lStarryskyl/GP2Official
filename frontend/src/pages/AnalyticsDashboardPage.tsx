import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { api } from '@/lib/api';
import { phaseConfigs } from '@/constants/phases';
import { PhaseActivityTimeline, type PhaseActivityEntry } from '@/components/PhaseActivityTimeline';
import type { PhaseCompletionMeta, Project } from '@/types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  Zap,
  Shield,
  DollarSign,
  Circle,
  ArrowLeft,
  FolderKanban,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ChevronsUpDown,
  Filter,
  X,
} from 'lucide-react';

interface AnalyticsData {
  projectProgress: number;
  totalRequirements: number;
  completedRequirements: number;
  aiGenerations: number;
  totalPhases: number;
  completedPhases: number;
  estimatedCompletion: string;
  riskLevel: 'low' | 'medium' | 'high';
  weeklyActivity: { day: string; count: number }[];
  phaseBreakdown: { name: string; progress: number; status: string; color: string }[];
  totalProjects?: number;
}

type BreakdownStatus = 'active' | 'completed' | 'stalled';

interface ProjectBreakdownRow {
  id: string;
  name: string;
  completionPct: number;
  phasesCompleted: number;
  requirementsCount: number;
  aiRunCount: number;
  weeklyActivity: number[];
  status: BreakdownStatus;
  createdAt: string;
}

const ProjectSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(1, ...data);
  const W = 7, GAP = 2, H = 24;
  const totalW = data.length * W + (data.length - 1) * GAP;
  return (
    <svg width={totalW} height={H} style={{ display: 'block', overflow: 'visible' }}>
      {data.map((v, i) => {
        const barH = v === 0 ? 2 : Math.max(3, Math.round((v / max) * (H - 2)));
        const active = v > 0;
        return (
          <rect
            key={i}
            x={i * (W + GAP)}
            y={H - barH}
            width={W}
            height={barH}
            rx="1"
            fill={active ? '#D4A017' : 'rgba(61,36,18,0.45)'}
            opacity={active ? (0.35 + 0.65 * (v / max)) : 1}
          />
        );
      })}
    </svg>
  );
};

const PHASE_COLORS: Record<string, string> = {
  Planning: '#D4A017',
  Feasibility: '#7BA05B',
  Requirements: 'var(--blue-500)',
  Validation: '#5F7A8A',
  Design: '#6B4C8A',
  Development: '#8B5E3C',
  Tasks: '#D4A017',
  'Costs & Benefits': '#2A9D8F',
  'Risks': '#C1440E',
  Summary: 'var(--blue-400)',
};

const PHASE_META: { key: string; name: string; color: string }[] = [
  { key: 'planning', name: 'Planning', color: '#D4A017' },
  { key: 'feasibility_study', name: 'Feasibility', color: '#7BA05B' },
  { key: 'requirements_gathering', name: 'Requirements', color: 'var(--blue-500)' },
  { key: 'validation', name: 'Validation', color: '#5F7A8A' },
  { key: 'design', name: 'Design', color: '#6B4C8A' },
  { key: 'development', name: 'Development', color: '#8B5E3C' },
  { key: 'tasks', name: 'Tasks', color: '#D4A017' },
  { key: 'cost_benefit', name: 'Costs & Benefits', color: '#2A9D8F' },
  { key: 'risks', name: 'Risks', color: '#C1440E' },
  { key: 'summary', name: 'Summary', color: 'var(--blue-400)' },
];

export const AnalyticsDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activityEntries, setActivityEntries] = useState<PhaseActivityEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [projectsBreakdown, setProjectsBreakdown] = useState<ProjectBreakdownRow[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'completion' | 'phases' | 'requirements' | 'ai'>('completion');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [statusFilter, setStatusFilter] = useState<'all' | BreakdownStatus>(
    () => (searchParams.get('status') as BreakdownStatus | 'all') || 'all'
  );
  const [dateFrom, setDateFrom] = useState<string>(() => searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState<string>(() => searchParams.get('to') || '');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    setSearchParams(params, { replace: true });
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const projects: Project[] = await api.getProjects();
        setProjects(projects);
        const collectedEntries: PhaseActivityEntry[] = [];
        for (const proj of projects) {
          const projectId: string | undefined = proj.project_id || proj.id;
          const projectName: string = proj.name || 'Untitled project';
          const meta: Record<string, PhaseCompletionMeta> = proj.phase_completion_meta || {};
          const status: Record<string, string> = proj.phase_status || {};
          for (const phase of phaseConfigs) {
            const m: PhaseCompletionMeta | undefined = meta[phase.id];
            const st = (status[phase.id] || '').toLowerCase();
            if (st !== 'completed' && !m?.completed_at) continue;
            collectedEntries.push({
              key: `${projectId || projectName}:${phase.id}`,
              phaseId: phase.id,
              phaseTitle: phase.title,
              stepNumber: phase.stepNumber,
              completedAt: m?.completed_at ?? null,
              confirmer: m?.completed_by_name || m?.completed_by || null,
              note: m?.notes ?? null,
              projectId,
              projectName,
            });
          }
        }
        collectedEntries.sort((a, b) => {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return tb - ta;
        });
        setActivityEntries(collectedEntries);
        const totalProjects = projects.length;
        const isGlobal = !id;

        let completedPhases = 0;
        let totalPhasesCount = 10;
        let phaseBreakdown: { name: string; progress: number; status: string; color: string }[];
        let totalReqs = 0;
        let completedReqs = 0;
        let aiGens = 0;
        let weeklyActivity: { day: string; count: number }[] = [];

        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - 6);

        if (isGlobal) {
          // ── Global mode: aggregate across all projects ──
          totalPhasesCount = projects.length * 10;
          const allActivityItems: any[] = [];
          const breakdownRows: ProjectBreakdownRow[] = [];

          phaseBreakdown = PHASE_META.map((pm) => {
            let phaseCompleted = 0;
            let phaseInProgress = 0;
            for (const proj of projects) {
              const st = ((proj.phase_status || {})[pm.key] || 'locked').toLowerCase();
              if (st === 'completed') { phaseCompleted++; completedPhases++; }
              else if (st === 'in_progress') phaseInProgress++;
            }
            const progress = projects.length > 0
              ? Math.round(((phaseCompleted + phaseInProgress * 0.5) / projects.length) * 100)
              : 0;
            const status = projects.length > 0 && phaseCompleted === projects.length
              ? 'completed'
              : phaseInProgress > 0 || phaseCompleted > 0
                ? 'in_progress'
                : 'pending';
            return { name: pm.name, progress, status, color: pm.color };
          });

          for (const proj of projects) {
            const pid = proj.id || proj.project_id;
            if (!pid) continue;

            const projPhaseStatus: Record<string, string> = proj.phase_status || {};
            const projPhasesCompleted = PHASE_META.filter(
              (pm) => (projPhaseStatus[pm.key] || '').toLowerCase() === 'completed'
            ).length;
            const projCompletionPct = Math.round((projPhasesCompleted / 10) * 100);

            let projReqCount = 0;
            let projAiCount = 0;
            let projActivityItems: any[] = [];

            try {
              const reqs = await api.getRequirements(pid);
              projReqCount = reqs.length;
              totalReqs += reqs.length;
              completedReqs += reqs.filter((r: any) => r.status === 'approved' || r.status === 'implemented').length;
            } catch { /* ignore */ }
            try {
              const aiRuns = await api.getAiRuns(pid, 200);
              const projAiCompleted = aiRuns.filter((run: any) => (run.status || '').toLowerCase() === 'completed').length;
              projAiCount = projAiCompleted || aiRuns.length;
              aiGens += projAiCount;
              try {
                const items = await api.getActivity(pid, 200);
                projActivityItems = items;
                allActivityItems.push(...items);
              } catch {
                projActivityItems = aiRuns;
                allActivityItems.push(...aiRuns);
              }
            } catch { /* ignore */ }

            const projWeeklyActivity = Array.from({ length: 7 }).map((_, i) => {
              const dayStart = new Date(weekStart);
              dayStart.setDate(weekStart.getDate() + i);
              const dayEnd = new Date(dayStart);
              dayEnd.setDate(dayStart.getDate() + 1);
              return projActivityItems.filter((item: any) => {
                const raw = item.completed_at || item.created_at;
                if (!raw) return false;
                const when = new Date(raw);
                return when >= dayStart && when < dayEnd;
              }).length;
            });

            const derivedStatus: BreakdownStatus =
              projPhasesCompleted === 10
                ? 'completed'
                : projPhasesCompleted > 0
                  ? 'active'
                  : 'stalled';

            breakdownRows.push({
              id: pid,
              name: proj.name || 'Untitled project',
              completionPct: projCompletionPct,
              phasesCompleted: projPhasesCompleted,
              requirementsCount: projReqCount,
              aiRunCount: projAiCount,
              weeklyActivity: projWeeklyActivity,
              status: derivedStatus,
              createdAt: proj.created_at || '',
            });
          }

          setProjectsBreakdown(breakdownRows);

          weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
            const dayStart = new Date(weekStart);
            dayStart.setDate(weekStart.getDate() + i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);
            const count = allActivityItems.filter((item: any) => {
              const raw = item.completed_at || item.created_at;
              if (!raw) return false;
              const when = new Date(raw);
              return when >= dayStart && when < dayEnd;
            }).length;
            return { day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }), count };
          });
        } else {
          // ── Per-project mode ──
          let targetProject = projects[0];
          const found = projects.find((p: any) => (p.id || p.project_id) === id);
          if (found) targetProject = found;

          const phaseStatus: Record<string, string> = targetProject?.phase_status || {};
          phaseBreakdown = PHASE_META.map((pm) => {
            const st = (phaseStatus[pm.key] || 'locked').toLowerCase();
            const progress = st === 'completed' ? 100 : st === 'in_progress' ? 50 : st === 'ready' ? 10 : 0;
            if (st === 'completed') completedPhases++;
            return { name: pm.name, progress, status: st === 'completed' ? 'completed' : st === 'in_progress' ? 'in_progress' : 'pending', color: pm.color };
          });

          try {
            const projectId = targetProject?.id || targetProject?.project_id;
            if (projectId) {
              const reqs = await api.getRequirements(projectId);
              totalReqs = reqs.length;
              completedReqs = reqs.filter((r: any) => r.status === 'approved' || r.status === 'implemented').length;
            }
          } catch { /* ignore */ }

          try {
            const projectId = targetProject?.id || targetProject?.project_id;
            if (projectId) {
              const aiRuns = await api.getAiRuns(projectId, 200);
              aiGens = aiRuns.filter((run: any) => (run.status || '').toLowerCase() === 'completed').length || aiRuns.length;

              let activityItems: any[] = [];
              try {
                activityItems = await api.getActivity(projectId, 200);
              } catch {
                activityItems = [];
              }
              const sourceItems = activityItems.length > 0 ? activityItems : aiRuns;
              weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
                const dayStart = new Date(weekStart);
                dayStart.setDate(weekStart.getDate() + i);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayStart.getDate() + 1);
                const count = sourceItems.filter((item: any) => {
                  const raw = item.completed_at || item.created_at;
                  if (!raw) return false;
                  const when = new Date(raw);
                  return when >= dayStart && when < dayEnd;
                }).length;
                return { day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }), count };
              });
            }
          } catch {
            weeklyActivity = [];
          }
        }

        if (weeklyActivity.length === 0) {
          weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            return { day: day.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
          });
        }

        const progressPct = totalPhasesCount > 0 ? Math.round((completedPhases / totalPhasesCount) * 100) : 0;
        const riskLevel: 'low' | 'medium' | 'high' = completedPhases >= 7 ? 'low' : completedPhases >= 4 ? 'medium' : 'high';
        const now = new Date();
        const remainingPhases = isGlobal
          ? Math.max(0, totalPhasesCount - completedPhases)
          : Math.max(0, 10 - completedPhases);
        const estDate = new Date(now.getTime() + remainingPhases * 14 * 86400000);
        const estimatedCompletion = estDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        setAnalytics({
          projectProgress: progressPct,
          totalRequirements: totalReqs,
          completedRequirements: completedReqs,
          aiGenerations: aiGens,
          totalPhases: totalPhasesCount,
          completedPhases,
          estimatedCompletion,
          riskLevel,
          weeklyActivity,
          phaseBreakdown,
          totalProjects: isGlobal ? totalProjects : undefined,
        });
      } catch (err) {
        console.error('Failed to fetch analytics', err);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  const getRiskConfig = (risk: string) => ({
    low: { color: 'var(--blue-400)', bg: 'rgba(26,111,212,0.12)', label: 'Low Risk' },
    medium: { color: '#D4A017', bg: 'rgba(212,160,23,0.12)', label: 'Medium Risk' },
    high: { color: '#C1440E', bg: 'rgba(193,68,14,0.12)', label: 'High Risk' },
  }[risk] || { color: 'var(--text-muted)', bg: 'rgba(107,158,122,0.12)', label: 'Unknown' });

  const isGlobal = !id;
  const maxActivity = Math.max(1, ...(analytics?.weeklyActivity.map(d => d.count) || []));

  const filteredActivityEntries = isGlobal && selectedProjectId !== 'all'
    ? activityEntries.filter((e) => e.projectId === selectedProjectId)
    : activityEntries;

  const projectsWithActivity = isGlobal
    ? projects.filter((p) => {
        const pid = p.project_id || p.id;
        return activityEntries.some((e) => e.projectId === pid);
      })
    : [];
  const risk = getRiskConfig(analytics?.riskLevel || 'low');

  const cardStyle = {
    background: 'var(--brand-850)',
    border: '1px solid rgba(26,46,69,0.6)',
    borderRadius: '16px',
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--brand-900)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--blue-400)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-muted)]">Loading analytics...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--brand-900)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
              style={{
                background: 'rgba(26,111,212,0.1)',
                border: '1px solid rgba(26,111,212,0.25)',
                color: 'var(--blue-400)',
              }}
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-400))', boxShadow: '0 10px 30px rgba(26,111,212,0.2)' }}>
              <BarChart3 className="w-7 h-7 text-[var(--brand-900)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {isGlobal ? 'Workspace Analytics' : 'Analytics Dashboard'}
              </h1>
              <p className="text-[var(--text-muted)]">
                {isGlobal
                  ? `Insights across all ${analytics?.totalProjects ?? ''} projects`
                  : 'Project insights and performance metrics'}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Progress / Total Projects */}
            {isGlobal ? (
              <div className="p-6" style={cardStyle}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.12)' }}>
                    <FolderKanban className="w-5 h-5 text-[var(--blue-400)]" />
                  </div>
                  <span className="text-[var(--text-muted)] text-sm">Projects</span>
                </div>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics?.totalProjects ?? 0}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Total projects</p>
              </div>
            ) : (
              <div className="p-6" style={cardStyle}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(26,111,212,0.12)' }}>
                    <TrendingUp className="w-5 h-5 text-[var(--blue-400)]" />
                  </div>
                  <span className="text-[var(--text-muted)] text-sm">Progress</span>
                </div>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics?.projectProgress}%</p>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(26,46,69,0.5)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${analytics?.projectProgress}%`, background: 'linear-gradient(to right, var(--blue-600), var(--blue-400))' }} />
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(107,76,138,0.15)' }}>
                  <FileText className="w-5 h-5" style={{ color: '#6B4C8A' }} />
                </div>
                <span className="text-[var(--text-muted)] text-sm">Requirements</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics?.completedRequirements}/{analytics?.totalRequirements}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Completed</p>
            </div>

            {/* AI Generations */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(42,157,143,0.12)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#2A9D8F' }} />
                </div>
                <span className="text-[var(--text-muted)] text-sm">AI Generations</span>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics?.aiGenerations}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Total calls</p>
            </div>

            {/* Risk */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ background: risk.bg }}>
                  <Shield className="w-5 h-5" style={{ color: risk.color }} />
                </div>
                <span className="text-[var(--text-muted)] text-sm">Risk Level</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: risk.color }}>{risk.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Current status</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-[var(--blue-400)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Weekly Activity</h3>
              </div>
              <div className="flex items-end justify-between h-40 gap-2">
                {analytics?.weeklyActivity.map((day, i) => {
                  const colors = ['var(--blue-400)', '#D4A017', '#2A9D8F', '#6B4C8A', 'var(--blue-400)', '#7BA05B', '#8B5E3C'];
                  const c = colors[i % colors.length];
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${(day.count / maxActivity) * 100}%`,
                          background: `linear-gradient(to top, ${c}cc, ${c}44)`,
                          minHeight: '6px',
                        }}
                      />
                      <span className="text-xs text-[var(--text-muted)]">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase Progress */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-5 h-5 text-[var(--blue-400)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Phase Progress</h3>
              </div>
              <div className="space-y-3">
                {analytics?.phaseBreakdown.map((phase) => (
                  <div key={phase.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: phase.color }} />
                        <span className="text-xs text-[var(--text-muted)]">{phase.name}</span>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{phase.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(26,46,69,0.5)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${phase.progress}%`,
                          background: phase.status === 'completed'
                            ? phase.color
                            : phase.status === 'in_progress'
                              ? `linear-gradient(to right, ${phase.color}88, ${phase.color})`
                              : 'rgba(26,46,69,0.2)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5 text-[#D4A017]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Estimated Timeline</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{analytics?.estimatedCompletion}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Projected completion date</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-[#D4A017]">{analytics?.completedPhases}/{analytics?.totalPhases}</p>
                  <p className="text-sm text-[var(--text-muted)]">Phases complete</p>
                </div>
              </div>
              {/* Mini phase dots */}
              <div className="flex gap-1.5 mt-5">
                {analytics?.phaseBreakdown.map((phase) => (
                  <div key={phase.name} className="flex-1 h-1.5 rounded-full"
                    style={{
                      background: phase.status === 'completed' ? phase.color
                        : phase.status === 'in_progress' ? `${phase.color}55`
                          : 'rgba(26,46,69,0.4)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Phase Completion Donut */}
            <div className="p-6" style={cardStyle}>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-[var(--blue-400)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Completion Overview</h3>
              </div>
              {(() => {
                const pct = analytics?.projectProgress || 0;
                const r = 52, cx = 70, cy = 70;
                const circ = 2 * Math.PI * r;
                const dash = (pct / 100) * circ;
                const scoreColor = pct >= 70 ? '#1A6FD4' : pct >= 40 ? '#F97316' : '#4a6070';
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <svg width="140" height="140" style={{ flexShrink: 0 }}>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,46,69,0.5)" strokeWidth="10" />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={scoreColor} strokeWidth="10"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                      <text x={cx} y={cy - 6} textAnchor="middle" fill="#E8EDF5" fontSize="22" fontWeight="800" fontFamily="Syne,sans-serif">{pct}%</text>
                      <text x={cx} y={cy + 14} textAnchor="middle" fill="#4a6070" fontSize="10" fontFamily="DM Sans,sans-serif">complete</text>
                    </svg>
                    <div style={{ flex: 1 }}>
                      {[
                        { label: 'Completed', count: analytics?.completedPhases || 0, color: scoreColor },
                        { label: 'Remaining', count: (analytics?.totalPhases || 10) - (analytics?.completedPhases || 0), color: 'rgba(26,46,69,0.5)' },
                        { label: 'Requirements', count: analytics?.totalRequirements || 0, color: '#2A9D8F' },
                        { label: 'AI Artifacts', count: analytics?.aiGenerations || 0, color: '#6B4C8A' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Sans,sans-serif' }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#E8EDF5', fontFamily: 'Syne,sans-serif' }}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Phase Status Summary */}
          <div className="mt-6 p-6" style={cardStyle}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-[#6B4C8A]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Phase Status Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {analytics?.phaseBreakdown.map(({ name, status, color }) => (
                <div key={name} className="p-4 rounded-xl text-center"
                  style={{ background: `${color}0d`, border: `1px solid ${color}25` }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${color}22`, border: `2px solid ${status === 'completed' ? color : 'rgba(26,46,69,0.4)'}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {status === 'completed'
                      ? <CheckCircle2 size={14} color={color} />
                      : status === 'in_progress'
                        ? <Activity size={14} color={color} />
                        : <Circle size={14} color="rgba(26,46,69,0.5)" />}
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">{name}</p>
                  <p className="text-xs capitalize" style={{ color: status === 'completed' ? color : status === 'in_progress' ? '#F97316' : 'var(--text-faint)' }}>
                    {status === 'completed' ? 'Done' : status === 'in_progress' ? 'Active' : 'Pending'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Breakdown Table — global mode only */}
          {isGlobal && projectsBreakdown.length > 0 && (() => {
            const handleSort = (col: typeof sortBy) => {
              if (sortBy === col) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(col);
                setSortDir(col === 'name' ? 'asc' : 'desc');
              }
            };

            const sorted = [...projectsBreakdown].sort((a, b) => {
              let cmp = 0;
              if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
              else if (sortBy === 'completion') cmp = a.completionPct - b.completionPct;
              else if (sortBy === 'phases') cmp = a.phasesCompleted - b.phasesCompleted;
              else if (sortBy === 'requirements') cmp = a.requirementsCount - b.requirementsCount;
              else if (sortBy === 'ai') cmp = a.aiRunCount - b.aiRunCount;
              return sortDir === 'asc' ? cmp : -cmp;
            });

            const SortIcon = ({ col }: { col: typeof sortBy }) => {
              if (sortBy !== col) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
              return sortDir === 'asc'
                ? <ChevronUp className="w-3.5 h-3.5" style={{ color: '#D4A017' }} />
                : <ChevronDown className="w-3.5 h-3.5" style={{ color: '#D4A017' }} />;
            };

            const thBase: React.CSSProperties = {
              padding: '10px 14px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              background: 'rgba(26,46,69,0.35)',
            };

            const filtered = sorted.filter((row) => {
              if (statusFilter !== 'all' && row.status !== statusFilter) return false;
              if (dateFrom && row.createdAt) {
                if (new Date(row.createdAt) < new Date(dateFrom)) return false;
              }
              if (dateTo && row.createdAt) {
                const toEnd = new Date(dateTo);
                toEnd.setDate(toEnd.getDate() + 1);
                if (new Date(row.createdAt) >= toEnd) return false;
              }
              return true;
            });

            const hasActiveFilters = statusFilter !== 'all' || dateFrom !== '' || dateTo !== '';

            const statusBadge: Record<BreakdownStatus, { label: string; color: string; bg: string }> = {
              active: { label: 'Active', color: '#D4A017', bg: 'rgba(212,160,23,0.15)' },
              completed: { label: 'Completed', color: '#5a9e6a', bg: 'rgba(90,158,106,0.15)' },
              stalled: { label: 'Stalled', color: '#8a7055', bg: 'rgba(138,112,85,0.15)' },
            };

            return (
              <div className="mt-6 p-6" style={cardStyle}>
                <div className="flex items-center gap-3 mb-5">
                  <FolderKanban className="w-5 h-5" style={{ color: '#D4A017' }} />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Projects Breakdown</h3>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">
                    {filtered.length !== projectsBreakdown.length
                      ? `${filtered.length} of ${projectsBreakdown.length} project${projectsBreakdown.length !== 1 ? 's' : ''}`
                      : `${projectsBreakdown.length} project${projectsBreakdown.length !== 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(61,36,18,0.4)' }}>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" style={{ color: hasActiveFilters ? '#D4A017' : 'var(--text-muted)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Filter:</span>
                  </div>

                  {/* Status dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | BreakdownStatus)}
                    className="text-sm rounded-lg px-3 py-1.5 focus:outline-none transition-colors"
                    style={{
                      background: statusFilter !== 'all' ? 'rgba(212,160,23,0.12)' : 'rgba(26,16,8,0.6)',
                      border: `1px solid ${statusFilter !== 'all' ? 'rgba(212,160,23,0.4)' : 'rgba(61,36,18,0.5)'}`,
                      color: statusFilter !== 'all' ? '#D4A017' : 'var(--text-primary)',
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="stalled">Stalled</option>
                  </select>

                  {/* Date from */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>From</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="text-sm rounded-lg px-3 py-1.5 focus:outline-none transition-colors"
                      style={{
                        background: dateFrom ? 'rgba(212,160,23,0.12)' : 'rgba(26,16,8,0.6)',
                        border: `1px solid ${dateFrom ? 'rgba(212,160,23,0.4)' : 'rgba(61,36,18,0.5)'}`,
                        color: dateFrom ? '#D4A017' : 'var(--text-muted)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>

                  {/* Date to */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>To</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="text-sm rounded-lg px-3 py-1.5 focus:outline-none transition-colors"
                      style={{
                        background: dateTo ? 'rgba(212,160,23,0.12)' : 'rgba(26,16,8,0.6)',
                        border: `1px solid ${dateTo ? 'rgba(212,160,23,0.4)' : 'rgba(61,36,18,0.5)'}`,
                        color: dateTo ? '#D4A017' : 'var(--text-muted)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>

                  {/* Clear filters button */}
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                      style={{ background: 'rgba(193,68,14,0.1)', border: '1px solid rgba(193,68,14,0.3)', color: '#C1440E' }}
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(61,36,18,0.5)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(61,36,18,0.4)' }}>
                        <th style={{ ...thBase, textAlign: 'left' }} onClick={() => handleSort('name')}>
                          <span className="flex items-center gap-1.5">Project <SortIcon col="name" /></span>
                        </th>
                        <th style={{ ...thBase, textAlign: 'center', cursor: 'default' }}>Status</th>
                        <th style={{ ...thBase, textAlign: 'center' }} onClick={() => handleSort('completion')}>
                          <span className="flex items-center justify-center gap-1.5">Completion <SortIcon col="completion" /></span>
                        </th>
                        <th style={{ ...thBase, textAlign: 'center' }} onClick={() => handleSort('phases')}>
                          <span className="flex items-center justify-center gap-1.5">Phases <SortIcon col="phases" /></span>
                        </th>
                        <th style={{ ...thBase, textAlign: 'center' }} onClick={() => handleSort('requirements')}>
                          <span className="flex items-center justify-center gap-1.5">Requirements <SortIcon col="requirements" /></span>
                        </th>
                        <th style={{ ...thBase, textAlign: 'center' }} onClick={() => handleSort('ai')}>
                          <span className="flex items-center justify-center gap-1.5">AI Runs <SortIcon col="ai" /></span>
                        </th>
                        <th style={{ ...thBase, textAlign: 'center', cursor: 'default' }}>7-Day Trend</th>
                        <th style={{ ...thBase, textAlign: 'center', cursor: 'default' }}>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No projects match the current filters.
                          </td>
                        </tr>
                      ) : filtered.map((row, i) => {
                        const barColor = row.completionPct >= 70 ? '#D4A017' : row.completionPct >= 40 ? '#c8870f' : '#5c3820';
                        const isEven = i % 2 === 0;
                        const rowBg = isEven ? 'transparent' : 'rgba(26,16,8,0.3)';
                        const badge = statusBadge[row.status];
                        return (
                          <tr
                            key={row.id}
                            onClick={() => navigate(`/projects/${row.id}`)}
                            style={{
                              background: rowBg,
                              cursor: 'pointer',
                              transition: 'background 0.15s',
                              borderBottom: i < filtered.length - 1 ? '1px solid rgba(61,36,18,0.25)' : 'none',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,160,23,0.07)')}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
                          >
                            {/* Project name */}
                            <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                              <span
                                className="font-medium text-[var(--text-primary)] truncate block"
                                style={{ fontSize: '13px', maxWidth: '200px' }}
                                title={row.name}
                              >
                                {row.name}
                              </span>
                            </td>

                            {/* Status badge */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span
                                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}44` }}
                              >
                                {badge.label}
                              </span>
                            </td>

                            {/* Completion % with mini bar */}
                            <td style={{ padding: '12px 14px', textAlign: 'center', minWidth: '120px' }}>
                              <div className="flex flex-col items-center gap-1">
                                <span style={{ fontSize: '13px', fontWeight: 700, color: barColor }}>{row.completionPct}%</span>
                                <div style={{ width: '80px', height: '5px', borderRadius: '3px', background: 'rgba(26,46,69,0.5)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${row.completionPct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                </div>
                              </div>
                            </td>

                            {/* Phases completed / 10 */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                {row.phasesCompleted}
                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/10</span>
                              </span>
                            </td>

                            {/* Requirements */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{row.requirementsCount}</span>
                            </td>

                            {/* AI Runs */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{row.aiRunCount}</span>
                            </td>

                            {/* 7-Day Sparkline */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div className="flex justify-center items-end" title={`Activity last 7 days: ${row.weeklyActivity.join(', ')}`}>
                                <ProjectSparkline data={row.weeklyActivity} />
                              </div>
                            </td>

                            {/* Quick link */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div className="flex justify-center">
                                <button
                                  onClick={e => { e.stopPropagation(); navigate(`/projects/${row.id}`); }}
                                  className="p-1.5 rounded-lg transition-all hover:scale-110"
                                  style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)', color: '#D4A017' }}
                                  title={`Open ${row.name}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Cross-project Activity Timeline */}
          <div className="mt-6">
            {isGlobal && projectsWithActivity.length > 0 && (
              <div className="flex items-center gap-3 mb-3">
                <FolderKanban className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="text-sm bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-400)] transition-colors"
                >
                  <option value="all">All Projects</option>
                  {projectsWithActivity.map((p) => {
                    const pid = p.project_id || p.id || '';
                    return (
                      <option key={pid} value={pid}>
                        {p.name || 'Untitled project'}
                      </option>
                    );
                  })}
                </select>
                {selectedProjectId !== 'all' && (
                  <button
                    onClick={() => setSelectedProjectId('all')}
                    className="text-xs text-[var(--blue-400)] hover:text-[var(--blue-300)] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            <PhaseActivityTimeline
              title="Recent Project Activity"
              description={
                isGlobal && selectedProjectId !== 'all'
                  ? `Confirmed phase completions for ${projectsWithActivity.find((p) => (p.project_id || p.id) === selectedProjectId)?.name ?? 'selected project'}.`
                  : 'Confirmed phase completions across all of your projects.'
              }
              emptyTitle="No phase completions yet"
              emptyDescription="As your team confirms phases across projects, they'll show up here."
              entries={filteredActivityEntries}
              showProject={selectedProjectId === 'all'}
              previewNotes
              onEntryClick={(entry) => {
                if (entry.projectId) {
                  navigate(`/projects/${entry.projectId}/phases/${entry.phaseId}`);
                }
              }}
            />
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboardPage;
