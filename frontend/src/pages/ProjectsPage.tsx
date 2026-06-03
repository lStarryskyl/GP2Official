import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import {
  Plus, FolderOpen, Calendar, Upload, MoreVertical,
  Clock, CheckCircle, Loader2, Sparkles, ArrowRight, TrendingUp,
  Search, Grid3X3, List, Trash2, ExternalLink, FileText,
  TreePine, Activity, Zap, Archive, RotateCcw, Layers, Crown, Lock,
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

function getCardAccentStyle(status: string): React.CSSProperties {
  if (status === 'completed') return { '--card-accent-color': '#22c55e', '--card-accent-glow': 'rgba(34,197,94,0.45)' } as React.CSSProperties;
  if (status === 'active' || status === 'planning') return { '--card-accent-color': '#3d8fe0', '--card-accent-glow': 'rgba(61,143,224,0.45)' } as React.CSSProperties;
  if (status === 'archived') return { '--card-accent-color': '#F97316', '--card-accent-glow': 'rgba(249,115,22,0.4)' } as React.CSSProperties;
  return { '--card-accent-color': '#8899AA', '--card-accent-glow': 'rgba(136,153,170,0.3)' } as React.CSSProperties;
}

const AnimatedProgressBar: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  return (
    <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(74,96,112,0.25)', overflow: 'hidden' }}>
      <div className="progress-bar-fill" style={{ width: `${width}%`, height: '100%', borderRadius: '999px', background: color }} />
    </div>
  );
};

const quickActions = [
  { icon: Plus, label: 'New Project', description: 'Start from scratch', action: 'new', color: 'forest' },
  { icon: Upload, label: 'Import', description: 'Upload documents', action: 'import', color: 'sage' },
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

  const cardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAll();
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const container = cardsContainerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<Element>('.card-reveal');
    if (!cards.length) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-revealed');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
    );
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [projects, archived, tab, searchQuery, viewMode]);

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
      draft: { color: 'text-[var(--text-muted)]', bgColor: 'bg-[var(--brand-700)]/20', borderColor: 'border-[var(--brand-700)]/50', icon: Clock, label: 'Draft' },
      planning: { color: 'text-[var(--blue-300)]', bgColor: 'bg-[var(--blue-400)]/10', borderColor: 'border-[var(--blue-400)]/30', icon: Loader2, label: 'Planning' },
      active: { color: 'text-[var(--blue-400)]', bgColor: 'bg-[var(--blue-400)]/15', borderColor: 'border-[var(--blue-400)]/40', icon: CheckCircle, label: 'Active' },
      completed: { color: 'text-[var(--orange-400)]', bgColor: 'bg-[var(--orange-400)]/10', borderColor: 'border-[var(--orange-400)]/30', icon: CheckCircle, label: 'Completed' },
      archived: { color: 'text-[var(--text-muted)]', bgColor: 'bg-[var(--brand-700)]/10', borderColor: 'border-[var(--brand-700)]/30', icon: Archive, label: 'Archived' },
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-6 animate-pulse">
              <TreePine className="w-8 h-8 text-[var(--brand-900)]" />
            </div>
            <p className="text-[var(--text-muted)] text-lg">Loading your projects…</p>
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
                Your AI-powered SDLC workspace
              </p>
            </div>
            <button onClick={handleNewProject} className="btn-primary btn-new-shimmer group" data-testid="new-project-btn">
              <Plus className="w-5 h-5" />
              New Project
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </div>
        </div>

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
                    onClick={() => {
                      if (usage && !usage.can_create) { setShowUpgradeModal(true); return; }
                      navigate('/projects/new?template=true');
                    }}
                    className="btn-primary px-8 py-3 text-base"
                  >
                    <TreePine className="w-5 h-5" />
                    Start with a Template
                  </button>
                  <button onClick={handleNewProject} className="btn-secondary px-8 py-3 text-base">
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
              <div ref={cardsContainerRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project, index) => {
                  const projectId = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const healthScore = getHealthScore(project.phase_status);
                  const healthColor = getHealthColor(healthScore);
                  const completedCount = PHASE_KEYS.filter(k => (project.phase_status?.[k] || '').toLowerCase() === 'completed').length;
                  const isArchivedCard = tab === 'archived';

                  return (
                    <div
                      key={projectId}
                      className="group relative card card-accent-top p-5 cursor-pointer card-reveal"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ '--card-i': index, opacity: isArchivedCard ? 0.85 : 1, ...getCardAccentStyle(project.status) } as React.CSSProperties}
                      data-testid={`project-card-${projectId}`}
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                          {(project.status === 'active' || project.status === 'planning') ? (
                            <span className="status-pulse-dot" />
                          ) : (
                            <StatusIcon className="w-3 h-3" />
                          )}
                          {statusConfig.label}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === projectId ? null : projectId);
                          }}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-[var(--brand-700)]/60 hover:bg-[var(--brand-700)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1.5 group-hover:text-[var(--blue-400)] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2 min-h-[40px]">
                        {project.description || 'No description provided'}
                      </p>

                      {/* Progress bar */}
                      <div style={{ marginBottom: '14px' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>
                            {completedCount} / {PHASE_KEYS.length} phases complete
                          </span>
                          <span style={{ fontSize: '11px', color: healthColor.color, fontWeight: 700 }}>
                            {healthScore}%
                          </span>
                        </div>
                        <AnimatedProgressBar
                          value={healthScore}
                          color={healthScore >= 70 ? '#22c55e' : healthScore >= 40 ? '#F97316' : '#1A6FD4'}
                        />
                      </div>

                      {/* Meta row */}
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

                      {/* Dropdown menu */}
                      {activeMenu === projectId && (
                        <div
                          className="absolute top-12 right-3 w-44 bg-[var(--brand-800)] border border-[var(--brand-700)]/60 rounded-xl shadow-xl overflow-hidden z-10 menu-spring"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/projects/${projectId}`)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--brand-700)]/30 hover:text-[var(--text-primary)] transition-colors"
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
                  );
                })}
              </div>
            ) : (
              <div ref={cardsContainerRef} className="space-y-2">
                {filteredProjects.map((project, index) => {
                  const projectId = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const healthScore = getHealthScore(project.phase_status);
                  const isArchivedCard = tab === 'archived';
                  return (
                    <div
                      key={projectId}
                      className="group flex items-center gap-5 p-4 rounded-xl bg-[var(--brand-850)] border border-[var(--brand-700)]/50 hover:border-[var(--blue-400)]/30 cursor-pointer transition-all duration-300 card-reveal"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ '--card-i': index, opacity: isArchivedCard ? 0.85 : 1 } as React.CSSProperties}
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--blue-400)]/20 to-[var(--blue-600)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--blue-400)]/30">
                        <FolderOpen className="w-5 h-5 text-[var(--blue-400)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

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
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectsPage;
