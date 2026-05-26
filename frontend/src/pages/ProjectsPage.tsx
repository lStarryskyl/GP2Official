import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import {
<<<<<<< HEAD
  Plus,
  FolderOpen,
  Calendar,
  Upload,
  Lightbulb,
  HelpCircle,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Edit3,
  ExternalLink,
  BarChart3,
  FileText,
  Building2,
  Briefcase,
  Users,
  TreePine,
  Activity,
  Zap,
=======
  Plus, FolderOpen, Calendar, Upload, MoreVertical,
  Clock, CheckCircle, Loader2, Sparkles, ArrowRight, TrendingUp,
  Search, Grid3X3, List, Trash2, ExternalLink, FileText,
  TreePine, Activity, Zap, Archive, RotateCcw, Layers, Crown, Lock,
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
} from 'lucide-react';
import type { Project } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import { useToast } from '@/contexts/ToastContext';

const PHASE_KEYS = phaseConfigs.map(p => p.id);

function getHealthScore(phaseStatus?: Record<string, string>): number {
  if (!phaseStatus) return 0;
  const completed = PHASE_KEYS.filter(k => (phaseStatus[k] || '').toLowerCase() === 'completed').length;
  return Math.round((completed / PHASE_KEYS.length) * 100);
}

function getHealthColor(score: number) {
  if (score >= 70) return { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Healthy' };
  if (score >= 40) return { color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'In Progress' };
  return { color: '#1A6FD4', bg: 'rgba(26,111,212,0.15)', label: 'Starting' };
}

// ── Health score helpers ─────────────────────────────────────────────────────
const PHASE_KEYS = ['planning','feasibility_study','requirements_gathering','validation','design','development','tasks','cost_benefit','risks','summary'];

function getHealthScore(phaseStatus?: Record<string, string>): number {
  if (!phaseStatus) return 0;
  const completed = PHASE_KEYS.filter(k => (phaseStatus[k] || '').toLowerCase() === 'completed').length;
  return Math.round((completed / PHASE_KEYS.length) * 100);
}

function getHealthColor(score: number) {
  if (score >= 70) return { color: '#1A6FD4', bg: 'rgba(26,111,212,0.15)', label: 'Healthy' };
  if (score >= 40) return { color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'In Progress' };
  return { color: '#4a6070', bg: 'rgba(74,96,112,0.15)', label: 'Starting' };
}

function getPhaseCompletionText(phaseStatus?: Record<string, string>): string {
  if (!phaseStatus) return '0 / 10 phases';
  const completed = PHASE_KEYS.filter(k => (phaseStatus[k] || '').toLowerCase() === 'completed').length;
  return `${completed} / 10 phases`;
}

const quickActions = [
<<<<<<< HEAD
  { icon: Plus,       label: 'New Project',   description: 'Start from scratch',       action: 'new',     color: 'forest' },
  { icon: Upload,     label: 'Import',         description: 'Upload documents',          action: 'import',  color: 'sage' },
  { icon: Lightbulb, label: 'AI Insights',    description: 'Get recommendations',       action: 'insights',color: 'amber' },
  { icon: HelpCircle,label: 'Documentation',  description: 'Learn more',                action: 'docs',    color: 'blue' },
=======
  { icon: Plus, label: 'New Project', description: 'Start from scratch', action: 'new', color: 'forest' },
  { icon: Upload, label: 'Import', description: 'Upload documents', action: 'import', color: 'sage' },
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
];

type ViewTab = 'active' | 'archived';

interface PlanUsage {
  tier: string;
  used: number;
  limit: number | null;
  unlimited: boolean;
  can_create: boolean;
}

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const initialTab = (searchParams.get('view') === 'archived' ? 'archived' : 'active') as ViewTab;
  const [tab, setTab] = useState<ViewTab>(initialTab);
  const [projects, setProjects] = useState<Project[]>([]);
  const [archived, setArchived] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadAll();
    setIsVisible(true);
  }, []);

  // Sync tab to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'archived') next.set('view', 'archived');
    else next.delete('view');
    setSearchParams(next, { replace: true });
  }, [tab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [active, arch, planUsage] = await Promise.all([
        api.getProjects(),
        api.getProjects({ only_archived: true }),
        api.getProjectsUsage().catch(() => null),
      ]);
      setProjects(active);
      setArchived(arch);
      if (planUsage) setUsage(planUsage);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = async () => {
    try {
      const planUsage = await api.getProjectsUsage();
      setUsage(planUsage);
    } catch (e) {
      console.error('Failed to refresh usage:', e);
    }
  };

  const handleNewProject = () => {
    if (usage && !usage.can_create) {
      setShowUpgradeModal(true);
      return;
    }
    navigate('/projects/new');
  };

  const archiveProject = async (projectId: string) => {
    try {
      await api.archiveProject(projectId);
      const moved = projects.find(p => (p.id || p.project_id) === projectId);
      setProjects(prev => prev.filter(p => (p.id || p.project_id) !== projectId));
      if (moved) setArchived(prev => [{ ...moved, status: 'archived' as any }, ...prev]);
      toastSuccess('Project archived');
      refreshUsage();
    } catch (e) {
      console.error(e);
      toastError('Failed to archive project');
    } finally {
      setActiveMenu(null);
    }
  };

  const restoreProject = async (projectId: string) => {
    try {
      await api.restoreProject(projectId);
      const moved = archived.find(p => (p.id || p.project_id) === projectId);
      setArchived(prev => prev.filter(p => (p.id || p.project_id) !== projectId));
      if (moved) setProjects(prev => [{ ...moved, status: 'active' as any }, ...prev]);
      toastSuccess('Project restored');
      refreshUsage();
    } catch (e) {
      console.error(e);
      toastError('Failed to restore project');
    } finally {
      setActiveMenu(null);
    }
  };

  const permanentlyDelete = async (projectId: string) => {
    if (!window.confirm('Permanently delete this project? This cannot be undone.')) return;
    try {
      await api.deleteProject(projectId);
      setArchived(prev => prev.filter(p => (p.id || p.project_id) !== projectId));
      toastSuccess('Project permanently deleted');
    } catch (e) {
      console.error(e);
      toastError('Failed to delete project');
    } finally {
      setActiveMenu(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType; label: string }> = {
<<<<<<< HEAD
      draft:     { color: 'text-[var(--text-muted)]',   bgColor: 'bg-[var(--brand-700)]/20',   borderColor: 'border-[var(--brand-700)]/50',  icon: Clock,        label: 'Draft' },
      planning:  { color: 'text-[var(--blue-300)]',   bgColor: 'bg-[var(--blue-400)]/10',   borderColor: 'border-[var(--blue-400)]/30',  icon: Loader2,      label: 'Planning' },
      active:    { color: 'text-[var(--blue-400)]',   bgColor: 'bg-[var(--blue-400)]/15',   borderColor: 'border-[var(--blue-400)]/40',  icon: CheckCircle,  label: 'Active' },
      completed: { color: 'text-[var(--orange-400)]',   bgColor: 'bg-[var(--orange-400)]/10',   borderColor: 'border-[var(--orange-400)]/30',  icon: CheckCircle,  label: 'Completed' },
      archived:  { color: 'text-[var(--text-muted)]',   bgColor: 'bg-[var(--brand-700)]/10',   borderColor: 'border-[var(--brand-700)]/30',  icon: AlertCircle,  label: 'Archived' },
=======
      draft: { color: 'text-[var(--text-muted)]', bgColor: 'bg-[var(--brand-700)]/20', borderColor: 'border-[var(--brand-700)]/50', icon: Clock, label: 'Draft' },
      planning: { color: 'text-[var(--blue-300)]', bgColor: 'bg-[var(--blue-400)]/10', borderColor: 'border-[var(--blue-400)]/30', icon: Loader2, label: 'Planning' },
      active: { color: 'text-[var(--blue-400)]', bgColor: 'bg-[var(--blue-400)]/15', borderColor: 'border-[var(--blue-400)]/40', icon: CheckCircle, label: 'Active' },
      completed: { color: 'text-[var(--orange-400)]', bgColor: 'bg-[var(--orange-400)]/10', borderColor: 'border-[var(--orange-400)]/30', icon: CheckCircle, label: 'Completed' },
      archived: { color: 'text-[var(--text-muted)]', bgColor: 'bg-[var(--brand-700)]/10', borderColor: 'border-[var(--brand-700)]/30', icon: Archive, label: 'Archived' },
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
    };
    return configs[status] || configs.draft;
  };

  const handleQuickAction = (action: string) => {
    if (action === 'new' || action === 'import') handleNewProject();
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const list = tab === 'archived' ? archived : projects;
  const filteredProjects = useMemo(
    () => list.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [list, searchQuery],
  );

  // Stats (always over active list)
  const stats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === 'draft' || p.status === 'planning').length;
    const activeNow = projects.filter(p => p.status === 'active' || p.status === 'completed').length;
    const avgHealth = projects.length === 0 ? 0 : Math.round(
      projects.reduce((s, p) => s + getHealthScore(p.phase_status), 0) / projects.length,
    );
    return { total, inProgress, activeNow, avgHealth };
  }, [projects]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
<<<<<<< HEAD
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-6 animate-pulse">
                <TreePine className="w-8 h-8 text-[var(--brand-900)]" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-[var(--blue-400)]/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[var(--text-muted)] text-lg">Loading your projects...</p>
=======
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-6 animate-pulse">
              <TreePine className="w-8 h-8 text-[var(--brand-900)]" />
            </div>
            <p className="text-[var(--text-muted)] text-lg">Loading your projects…</p>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-12">
        {/* ── Header ── */}
        <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-[var(--blue-400)] to-[var(--blue-600)] rounded-full" />
                <h1 className="text-4xl font-bold text-[var(--text-primary)]">Projects</h1>
              </div>
              <p className="text-[var(--text-muted)] text-lg ml-5">
<<<<<<< HEAD
                Manage and track all your enterprise project plans
=======
                Your AI-powered SDLC workspace
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
              </p>
            </div>
            <button onClick={handleNewProject} className="btn-primary group" data-testid="new-project-btn">
              <Plus className="w-5 h-5" />
              New Project
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </div>
        </div>

<<<<<<< HEAD
        {/* Quick Actions */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              forest: 'from-[var(--blue-400)] to-[var(--blue-600)] hover:shadow-[var(--blue-400)]/20',
              sage:   'from-[var(--blue-300)] to-[var(--text-muted)] hover:shadow-[var(--blue-300)]/20',
              amber:  'from-[var(--orange-400)] to-[var(--orange-600)] hover:shadow-[var(--orange-400)]/20',
              green:  'from-blue-500 to-blue-500 hover:shadow-blue-500/20',
            }[action.color] || 'from-[var(--blue-400)] to-[var(--blue-600)]';

            return (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="group relative p-6 rounded-2xl bg-[var(--brand-850)] border border-[var(--brand-700)]/50 hover:border-[var(--blue-400)]/30 transition-all duration-500 text-left overflow-hidden hover-lift"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{action.label}</h3>
                <p className="text-sm text-[var(--text-muted)]">{action.description}</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className={`flex flex-col md:flex-row gap-4 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
=======
        {/* ── Stats Strip ── */}
        {(projects.length > 0 || archived.length > 0) && (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 transition-all duration-700 delay-75 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {[
              { label: 'Total', value: stats.total, icon: FolderOpen, color: '#1A6FD4' },
              { label: 'Active', value: stats.activeNow, icon: Activity, color: '#22c55e' },
              { label: 'In Progress', value: stats.inProgress, icon: Loader2, color: '#F97316' },
              { label: 'Avg Health', value: `${stats.avgHealth}%`, icon: TrendingUp, color: '#1A6FD4' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '14px 18px', borderRadius: '14px',
                background: 'var(--brand-850)', border: '1px solid rgba(26,111,212,0.18)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Plan Usage Indicator ── */}
        {usage && (
          <div
            className={`mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            data-testid="plan-usage-card"
          >
            {(() => {
              const isFree = (usage.tier || 'free').toLowerCase() === 'free';
              const limit = usage.limit;
              const used = usage.used;
              const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
              const atLimit = limit !== null && used >= (limit ?? 0);
              const nearLimit = limit !== null && !atLimit && used >= Math.max(1, (limit ?? 0) - 1);
              const barColor = atLimit ? '#ef4444' : nearLimit ? '#F97316' : '#1A6FD4';
              return (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'var(--brand-850)',
                    border: `1px solid ${atLimit ? 'rgba(239,68,68,0.4)' : 'rgba(26,111,212,0.18)'}`,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: isFree ? 'rgba(26,111,212,0.15)' : 'rgba(245,158,11,0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isFree ? (
                          <Layers size={18} color="#1A6FD4" />
                        ) : (
                          <Crown size={18} color="#F59E0B" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {(usage.tier || 'free').toUpperCase()} PLAN
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }} data-testid="plan-usage-text">
                          {usage.unlimited
                            ? `${used} active project${used === 1 ? '' : 's'} · Unlimited`
                            : `${used} of ${limit} project${(limit ?? 0) === 1 ? '' : 's'} used`}
                        </div>
                      </div>
                    </div>
                    {!usage.unlimited && (
                      <div className="flex items-center gap-3 flex-1 md:max-w-md md:ml-6">
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 999,
                            background: 'rgba(74,96,112,0.25)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: barColor,
                              transition: 'width 400ms ease',
                            }}
                          />
                        </div>
                        <button
                          onClick={() => navigate('/billing')}
                          className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
                          style={{ fontSize: 13 }}
                          data-testid="upgrade-pro-btn"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Pro
                        </button>
                      </div>
                    )}
                  </div>
                  {atLimit && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        fontSize: 12,
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      You've reached your plan limit. Archive a project or upgrade to Pro to start a new one.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Quick Actions ── */}
        {tab === 'active' && (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                forest: 'from-[var(--blue-400)] to-[var(--blue-600)]',
                sage: 'from-[var(--blue-300)] to-[var(--text-muted)]',
                amber: 'from-[var(--orange-400)] to-[var(--orange-600)]',
                blue: 'from-blue-500 to-blue-500',
              }[action.color] || 'from-[var(--blue-400)] to-[var(--blue-600)]';
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className="group relative p-5 rounded-2xl bg-[var(--brand-850)] border border-[var(--brand-700)]/50 hover:border-[var(--blue-400)]/30 transition-all duration-500 text-left overflow-hidden hover-lift"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm">{action.label}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{action.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'active'
              ? 'bg-[var(--blue-400)]/15 text-[var(--blue-300)] border border-[var(--blue-400)]/40'
              : 'text-[var(--text-muted)] border border-transparent hover:text-[var(--text-primary)]'
              }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Active <span className="opacity-60 ml-1">{projects.length}</span>
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'archived'
              ? 'bg-[var(--brand-700)]/40 text-[var(--text-primary)] border border-[var(--brand-700)]'
              : 'text-[var(--text-muted)] border border-transparent hover:text-[var(--text-primary)]'
              }`}
          >
            <Archive className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Archived <span className="opacity-60 ml-1">{archived.length}</span>
          </button>
        </div>

        {/* ── Search & view ── */}
        <div className={`flex flex-col md:flex-row gap-3 mb-6 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
            <input
              type="text"
              placeholder={tab === 'archived' ? 'Search archived…' : 'Search projects…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full"
              style={{ paddingLeft: '48px' }}
              data-testid="search-projects-input"
            />
          </div>
          <div className="flex items-center bg-[var(--brand-850)] rounded-xl p-1 border border-[var(--brand-700)]/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--blue-400)] text-[var(--brand-900)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--blue-400)] text-[var(--brand-900)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
<<<<<<< HEAD

            <div className="flex items-center bg-[var(--brand-850)] rounded-xl p-1 border border-[var(--brand-700)]/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--blue-400)] text-[var(--brand-900)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--blue-400)] text-[var(--brand-900)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
=======
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
          </div>
        </div>

        {/* ── Empty state ── */}
        {filteredProjects.length === 0 ? (
          <div className={`text-center py-20 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {searchQuery ? (
              <>
                <div className="w-24 h-24 rounded-2xl bg-[var(--brand-800)] flex items-center justify-center mx-auto mb-6 border border-[var(--brand-700)]/50">
                  <FolderOpen className="w-12 h-12 text-[var(--blue-600)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">No projects match your search</h3>
<<<<<<< HEAD
                <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">Try a different search term or clear the filter.</p>
                <button onClick={() => setSearchQuery('')} className="btn-secondary">Clear Search</button>
              </>
=======
                <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">Try a different search term.</p>
                <button onClick={() => setSearchQuery('')} className="btn-secondary">Clear Search</button>
              </>
            ) : tab === 'archived' ? (
              <>
                <div className="w-24 h-24 rounded-2xl bg-[var(--brand-800)] flex items-center justify-center mx-auto mb-6 border border-[var(--brand-700)]/50">
                  <Archive className="w-12 h-12 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Nothing in your archive</h3>
                <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                  Archived projects appear here and can be restored at any time.
                </p>
                <button onClick={() => setTab('active')} className="btn-secondary">Back to Active</button>
              </>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
            ) : (
              <>
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[var(--brand-700)]/60 to-[var(--brand-850)] flex items-center justify-center mx-auto mb-8 border border-[rgba(26,46,69,0.5)] shadow-lg shadow-[var(--blue-400)]/10">
                  <Sparkles className="w-14 h-14 text-[var(--blue-400)]" />
                </div>
                <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Plant Your First Seed</h3>
                <p className="text-[var(--text-muted)] mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                  Create an AI-powered project plan in minutes. Start with a template or build from scratch.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
<<<<<<< HEAD
                    onClick={() => navigate('/projects/new?template=true')}
=======
                    onClick={() => {
                      if (usage && !usage.can_create) { setShowUpgradeModal(true); return; }
                      navigate('/projects/new?template=true');
                    }}
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                    className="btn-primary px-8 py-3 text-base"
                  >
                    <TreePine className="w-5 h-5" />
                    Start with a Template
                  </button>
<<<<<<< HEAD
                  <button
                    onClick={() => navigate('/projects/new')}
                    className="btn-secondary px-8 py-3 text-base"
                  >
=======
                  <button onClick={handleNewProject} className="btn-secondary px-8 py-3 text-base">
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                    <Plus className="w-5 h-5" />
                    Create from Scratch
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project, index) => {
                  const projectId = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const healthScore = getHealthScore(project.phase_status);
                  const healthColor = getHealthColor(healthScore);
                  const completedCount = PHASE_KEYS.filter(k => (project.phase_status?.[k] || '').toLowerCase() === 'completed').length;
                  const isArchivedCard = tab === 'archived';

                  const healthScore = getHealthScore(project.phase_status);
                  const healthColor = getHealthColor(healthScore);
                  const phaseText   = getPhaseCompletionText(project.phase_status);

                  return (
                    <div
                      key={projectId}
                      className="group relative card p-5 cursor-pointer animate-reveal-up"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ animationDelay: `${index * 60}ms`, opacity: isArchivedCard ? 0.85 : 1 }}
                      data-testid={`project-card-${projectId}`}
                    >
<<<<<<< HEAD
                      {/* Top row: status + health badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
=======
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </div>
                        <div style={{
<<<<<<< HEAD
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '4px 10px', borderRadius: '999px',
=======
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '3px 9px', borderRadius: '999px',
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                          background: healthColor.bg, border: `1px solid ${healthColor.color}44`,
                          fontSize: '11px', fontWeight: 700, color: healthColor.color,
                          fontFamily: 'Syne, sans-serif',
                        }}>
<<<<<<< HEAD
                          <Zap size={10} />
                          {healthScore}%
                        </div>
                      </div>

                      {/* Project Info */}
                      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--blue-400)] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>

                      {/* Phase progress bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'DM Sans, sans-serif' }}>
                            <Activity size={10} style={{ display: 'inline', marginRight: '4px' }} />
                            {phaseText}
                          </span>
                          <span style={{ fontSize: '11px', color: healthColor.color, fontWeight: 600 }}>{healthScore}% complete</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(26,46,69,0.6)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '999px',
                            width: `${healthScore}%`,
                            background: healthScore >= 70
                              ? 'linear-gradient(to right, #1A6FD4, #3d8fe0)'
                              : healthScore >= 40
                              ? 'linear-gradient(to right, #F97316, #fb9042)'
                              : 'rgba(74,96,112,0.5)',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>

                      {/* Meta Info */}
=======
                          <Zap size={10} /> {healthScore}%
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1.5 group-hover:text-[var(--blue-400)] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {project.description || 'No description provided'}
                      </p>

                      {/* Phase journey strip */}
                      <div style={{ marginBottom: '14px' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>
                            <Layers size={10} style={{ display: 'inline', marginRight: '4px' }} />
                            {completedCount} / {PHASE_KEYS.length} phases
                          </span>
                          <span style={{ fontSize: '11px', color: healthColor.color, fontWeight: 600 }}>
                            {healthScore}%
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {phaseConfigs.map(ph => {
                            const st = (project.phase_status?.[ph.id] || '').toLowerCase();
                            let bg = 'rgba(74,96,112,0.3)';
                            if (st === 'completed') bg = '#22c55e';
                            else if (st === 'in_progress') bg = '#F97316';
                            else if (st === 'ready') bg = '#1A6FD4';
                            return (
                              <div
                                key={ph.id}
                                title={`${ph.title}: ${st || 'locked'}`}
                                style={{ flex: 1, height: '5px', borderRadius: '999px', background: bg, opacity: st ? 1 : 0.5 }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Meta row */}
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(project.created_at)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {project.template_type || 'Custom'}
                        </div>
                      </div>

<<<<<<< HEAD
                      {/* Hover Actions */}
                      <div className={`absolute top-4 right-4 flex items-center gap-1 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${projectId}`);
                          }}
                          className="p-2 rounded-lg bg-[var(--brand-700)]/50 hover:bg-[var(--blue-400)] text-[var(--text-muted)] hover:text-[var(--brand-900)] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
=======
                      {/* Hover actions */}
                      <div className="absolute top-12 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === projectId ? null : projectId);
                          }}
<<<<<<< HEAD
                          className="p-2 rounded-lg bg-[var(--brand-700)]/50 hover:bg-[var(--brand-700)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
=======
                          className="p-1.5 rounded-lg bg-[var(--brand-700)]/60 hover:bg-[var(--brand-700)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                          aria-label="More actions"
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === projectId && (
                          <div
<<<<<<< HEAD
                            className="absolute top-full right-0 mt-2 w-40 bg-[var(--brand-800)] border border-[var(--brand-700)]/50 rounded-xl shadow-xl overflow-hidden z-10 animate-reveal-down"
=======
                            className="absolute top-full right-0 mt-2 w-44 bg-[var(--brand-800)] border border-[var(--brand-700)]/60 rounded-xl shadow-xl overflow-hidden z-10 animate-reveal-down"
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/projects/${projectId}`)}
<<<<<<< HEAD
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)] hover:bg-[var(--brand-700)]/30 transition-colors"
=======
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--brand-700)]/30 hover:text-[var(--text-primary)] transition-colors"
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                            >
                              <ExternalLink className="w-4 h-4" /> Open
                            </button>
                            {!isArchivedCard ? (
                              <button
                                onClick={() => archiveProject(projectId)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                              >
                                <Archive className="w-4 h-4" /> Archive
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => restoreProject(projectId)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--blue-300)] hover:bg-[var(--blue-400)]/10 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" /> Restore
                                </button>
                                <button
                                  onClick={() => permanentlyDelete(projectId)}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete forever
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project, index) => {
                  const projectId = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const healthScore = getHealthScore(project.phase_status);
                  const isArchivedCard = tab === 'archived';
                  return (
                    <div
                      key={projectId}
<<<<<<< HEAD
                      className="group flex items-center gap-6 p-5 rounded-xl bg-[var(--brand-850)] border border-[var(--brand-700)]/50 hover:border-[var(--blue-400)]/30 cursor-pointer transition-all duration-300 animate-reveal-up"
=======
                      className="group flex items-center gap-5 p-4 rounded-xl bg-[var(--brand-850)] border border-[var(--brand-700)]/50 hover:border-[var(--blue-400)]/30 cursor-pointer transition-all duration-300 animate-reveal-up"
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ animationDelay: `${index * 40}ms`, opacity: isArchivedCard ? 0.85 : 1 }}
                    >
<<<<<<< HEAD
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--blue-400)]/20 to-[var(--blue-600)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--blue-400)]/30">
                        <FolderOpen className="w-6 h-6 text-[var(--blue-400)]" />
=======
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--blue-400)]/20 to-[var(--blue-600)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--blue-400)]/30">
                        <FolderOpen className="w-5 h-5 text-[var(--blue-400)]" />
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                      </div>
                      <div className="flex-1 min-w-0">
<<<<<<< HEAD
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] truncate">
=======
                        <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] truncate">
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
<<<<<<< HEAD

                      <div className="text-sm text-[var(--text-muted)] hidden md:block">
                        {formatDate(project.created_at)}
                      </div>

                      <ArrowRight className="w-5 h-5 text-[var(--blue-600)] group-hover:text-[var(--blue-400)] group-hover:translate-x-1 transition-all" />
=======
                      <div className="text-xs text-[var(--text-muted)] hidden md:block w-20 text-right">{healthScore}%</div>
                      <div className="text-xs text-[var(--text-muted)] hidden md:block">{formatDate(project.created_at)}</div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {!isArchivedCard ? (
                          <button
                            onClick={() => archiveProject(projectId)}
                            className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => restoreProject(projectId)} className="p-2 rounded-lg text-[var(--blue-300)] hover:bg-[var(--blue-400)]/10" title="Restore">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={() => permanentlyDelete(projectId)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete forever">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <ArrowRight className="w-4 h-4 text-[var(--blue-600)] group-hover:text-[var(--blue-400)] group-hover:translate-x-1 transition-all" />
                      </div>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

<<<<<<< HEAD
        {/* Stats Banner */}
        {projects.length > 0 && (
          <div className={`mt-12 p-8 rounded-2xl bg-gradient-to-r from-[var(--blue-400)]/10 to-[var(--brand-700)]/20 border border-[var(--blue-400)]/20 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[var(--blue-400)]/20 flex items-center justify-center border border-[var(--blue-400)]/30">
                  <TrendingUp className="w-7 h-7 text-[var(--blue-400)]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--text-primary)]">Project Overview</h4>
                  <p className="text-sm text-[var(--text-muted)]">Your enterprise portfolio at a glance</p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--blue-400)]">{projects.length}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--blue-300)]">
                    {projects.filter(p => p.status === 'active' || p.status === 'completed').length}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--orange-400)]">
                    {projects.filter(p => p.status === 'draft' || p.status === 'planning').length}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">In Progress</div>
                </div>
              </div>
=======
      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <div
          onClick={() => setShowUpgradeModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          data-testid="upgrade-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--brand-850)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 18,
              maxWidth: 460,
              width: '100%',
              padding: 28,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(245,158,11,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Crown size={28} color="#F59E0B" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              You've hit your Free plan limit
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Free accounts can have up to {usage?.limit ?? 3} active projects at a time. Upgrade to
              Pro for unlimited projects, advanced AI, and priority support — or archive an existing
              project to free up a slot.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setShowUpgradeModal(false); navigate('/billing'); }}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                data-testid="upgrade-modal-upgrade-btn"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Maybe later
              </button>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectsPage;
