import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { api } from '@/lib/api';
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
}

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
  { key: 'planning',               name: 'Planning',         color: '#D4A017' },
  { key: 'feasibility_study',      name: 'Feasibility',      color: '#7BA05B' },
  { key: 'requirements_gathering', name: 'Requirements',     color: 'var(--blue-500)' },
  { key: 'validation',             name: 'Validation',       color: '#5F7A8A' },
  { key: 'design',                 name: 'Design',           color: '#6B4C8A' },
  { key: 'development',            name: 'Development',      color: '#8B5E3C' },
  { key: 'tasks',                  name: 'Tasks',            color: '#D4A017' },
  { key: 'cost_benefit',           name: 'Costs & Benefits', color: '#2A9D8F' },
  { key: 'risks',                  name: 'Risks',            color: '#C1440E' },
  { key: 'summary',                name: 'Summary',          color: 'var(--blue-400)' },
];

export const AnalyticsDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const projects = await api.getProjects();
        const totalProjects = projects.length;

        // Aggregate phase statuses across all projects (or use id-specific project)
        let targetProject = projects[0];
        if (id) {
          const found = projects.find((p: any) => (p.id || p.project_id) === id);
          if (found) targetProject = found;
        }

        const phaseStatus: Record<string, string> = targetProject?.phase_status || {};
        let completedPhases = 0;
        const phaseBreakdown = PHASE_META.map((pm) => {
          const st = (phaseStatus[pm.key] || 'locked').toLowerCase();
          const progress = st === 'completed' ? 100 : st === 'in_progress' ? 50 : st === 'ready' ? 10 : 0;
          if (st === 'completed') completedPhases++;
          return { name: pm.name, progress, status: st === 'completed' ? 'completed' : st === 'in_progress' ? 'in_progress' : 'pending', color: pm.color };
        });

        const progressPct = Math.round((completedPhases / 10) * 100);

        // Fetch requirements for the target project
        let totalReqs = 0;
        let completedReqs = 0;
        try {
          const projectId = targetProject?.id || targetProject?.project_id;
          if (projectId) {
            const reqs = await api.getRequirements(projectId);
            totalReqs = reqs.length;
            completedReqs = reqs.filter((r: any) => r.status === 'approved' || r.status === 'implemented').length;
          }
        } catch { /* ignore */ }

        // AI runs (real usage)
        let aiGens = 0;
        let weeklyActivity: { day: string; count: number }[] = [];
        try {
          const projectId = targetProject?.id || targetProject?.project_id;
          if (projectId) {
            const aiRuns = await api.getAiRuns(projectId, 200);
            aiGens = aiRuns.filter((run: any) => (run.status || '').toLowerCase() === 'completed').length || aiRuns.length;

            // Prefer recorded activity logs; fall back to AI runs if the project has none.
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - 6);
            let activityItems: any[] = [];
            try {
              activityItems = await api.getActivity(projectId, 200);
            } catch {
              activityItems = [];
            }

            const sourceItems = activityItems.length > 0 ? activityItems : aiRuns;
            weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
              const dayStart = new Date(start);
              dayStart.setDate(start.getDate() + i);
              const dayEnd = new Date(dayStart);
              dayEnd.setDate(dayStart.getDate() + 1);
              const count = sourceItems.filter((item: any) => {
                const raw = item.completed_at || item.created_at;
                if (!raw) return false;
                const when = new Date(raw);
                return when >= dayStart && when < dayEnd;
              }).length;
              return {
                day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
                count,
              };
            });
          }
        } catch {
          weeklyActivity = [];
        }

        if (weeklyActivity.length === 0) {
          // Fallback empty week with zeros (keeps UI stable)
          const fallbackStart = new Date();
          fallbackStart.setHours(0, 0, 0, 0);
          fallbackStart.setDate(fallbackStart.getDate() - 6);
          weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(fallbackStart);
            day.setDate(fallbackStart.getDate() + i);
            return { day: day.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
          });
        }

        const riskLevel: 'low' | 'medium' | 'high' = completedPhases >= 7 ? 'low' : completedPhases >= 4 ? 'medium' : 'high';

        const now = new Date();
        const estDate = new Date(now.getTime() + (10 - completedPhases) * 14 * 86400000);
        const estimatedCompletion = estDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        setAnalytics({
          projectProgress: progressPct,
          totalRequirements: totalReqs,
          completedRequirements: completedReqs,
          aiGenerations: aiGens,
          totalPhases: 10,
          completedPhases,
          estimatedCompletion,
          riskLevel,
          weeklyActivity,
          phaseBreakdown,
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
    low:    { color: 'var(--blue-400)', bg: 'rgba(26,111,212,0.12)',  label: 'Low Risk' },
    medium: { color: '#D4A017', bg: 'rgba(212,160,23,0.12)',  label: 'Medium Risk' },
    high:   { color: '#C1440E', bg: 'rgba(193,68,14,0.12)',   label: 'High Risk' },
  }[risk] || { color: 'var(--text-muted)', bg: 'rgba(107,158,122,0.12)', label: 'Unknown' });

  const maxActivity = Math.max(1, ...(analytics?.weeklyActivity.map(d => d.count) || []));
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--blue-400))', boxShadow: '0 10px 30px rgba(26,111,212,0.2)' }}>
              <BarChart3 className="w-7 h-7 text-[var(--brand-900)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Analytics Dashboard</h1>
              <p className="text-[var(--text-muted)]">Project insights and performance metrics</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Progress */}
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
                  const colors = ['var(--blue-400)','#D4A017','#2A9D8F','#6B4C8A','var(--blue-400)','#7BA05B','#8B5E3C'];
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

        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboardPage;
