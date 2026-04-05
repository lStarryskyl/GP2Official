import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import {
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
} from 'lucide-react';
import type { Project } from '@/types';

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
  { icon: Plus,       label: 'New Project',   description: 'Start from scratch',       action: 'new',     color: 'forest' },
  { icon: Upload,     label: 'Import',         description: 'Upload documents',          action: 'import',  color: 'sage' },
  { icon: Lightbulb, label: 'AI Insights',    description: 'Get recommendations',       action: 'insights',color: 'amber' },
  { icon: HelpCircle,label: 'Documentation',  description: 'Learn more',                action: 'docs',    color: 'blue' },
];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects]         = useState<Project[]>([]);
  const [loading, setLoading]           = useState(true);
  const [isVisible, setIsVisible]       = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [viewMode, setViewMode]         = useState<'grid' | 'list'>('grid');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [activeMenu, setActiveMenu]     = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    setIsVisible(true);
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(projectId);
      setProjects(prev => prev.filter(p => (p.id || p.project_id) !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
    setActiveMenu(null);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType; label: string }> = {
      draft:     { color: 'text-[var(--text-muted)]',   bgColor: 'bg-[var(--brand-700)]/20',   borderColor: 'border-[var(--brand-700)]/50',  icon: Clock,        label: 'Draft' },
      planning:  { color: 'text-[var(--blue-300)]',   bgColor: 'bg-[var(--blue-400)]/10',   borderColor: 'border-[var(--blue-400)]/30',  icon: Loader2,      label: 'Planning' },
      active:    { color: 'text-[var(--blue-400)]',   bgColor: 'bg-[var(--blue-400)]/15',   borderColor: 'border-[var(--blue-400)]/40',  icon: CheckCircle,  label: 'Active' },
      completed: { color: 'text-[var(--orange-400)]',   bgColor: 'bg-[var(--orange-400)]/10',   borderColor: 'border-[var(--orange-400)]/30',  icon: CheckCircle,  label: 'Completed' },
      archived:  { color: 'text-[var(--text-muted)]',   bgColor: 'bg-[var(--brand-700)]/10',   borderColor: 'border-[var(--brand-700)]/30',  icon: AlertCircle,  label: 'Archived' },
    };
    return configs[status] || configs.draft;
  };

  const handleQuickAction = (action: string) => {
    if (action === 'new' || action === 'import') navigate('/projects/new');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-6 animate-pulse">
                <TreePine className="w-8 h-8 text-[var(--brand-900)]" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-[var(--blue-400)]/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[var(--text-muted)] text-lg">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className={`mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-[var(--blue-400)] to-[var(--blue-600)] rounded-full" />
                <h1 className="text-4xl font-bold text-[var(--text-primary)]">Projects</h1>
              </div>
              <p className="text-[var(--text-muted)] text-lg ml-5">
                Manage and track all your enterprise project plans
              </p>
            </div>

            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary group"
              data-testid="new-project-btn"
            >
              <Plus className="w-5 h-5" />
              New Project
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </div>
        </div>

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
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 w-full"
              data-testid="search-projects-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary px-4 py-3">
              <Filter className="w-5 h-5" />
              <span className="hidden md:inline">Filters</span>
            </button>

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
          </div>
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className={`text-center py-20 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {searchQuery ? (
              <>
                <div className="w-24 h-24 rounded-2xl bg-[var(--brand-800)] flex items-center justify-center mx-auto mb-6 border border-[var(--brand-700)]/50">
                  <FolderOpen className="w-12 h-12 text-[var(--blue-600)]" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">No projects match your search</h3>
                <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">Try a different search term or clear the filter.</p>
                <button onClick={() => setSearchQuery('')} className="btn-secondary">Clear Search</button>
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
                    onClick={() => navigate('/projects/new?template=true')}
                    className="btn-primary px-8 py-3 text-base"
                  >
                    <TreePine className="w-5 h-5" />
                    Start with a Template
                  </button>
                  <button
                    onClick={() => navigate('/projects/new')}
                    className="btn-secondary px-8 py-3 text-base"
                  >
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const projectId    = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon   = statusConfig.icon;
                  const isHovered    = hoveredProject === projectId;

                  const healthScore = getHealthScore(project.phase_status);
                  const healthColor = getHealthColor(healthScore);
                  const phaseText   = getPhaseCompletionText(project.phase_status);

                  return (
                    <div
                      key={projectId}
                      className="group relative card p-6 cursor-pointer animate-reveal-up"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      onMouseEnter={() => setHoveredProject(projectId)}
                      onMouseLeave={() => setHoveredProject(null)}
                      style={{ animationDelay: `${index * 75}ms` }}
                      data-testid={`project-card-${projectId}`}
                    >
                      {/* Top row: status + health badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '4px 10px', borderRadius: '999px',
                          background: healthColor.bg, border: `1px solid ${healthColor.color}44`,
                          fontSize: '11px', fontWeight: 700, color: healthColor.color,
                          fontFamily: 'Syne, sans-serif',
                        }}>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === projectId ? null : projectId);
                          }}
                          className="p-2 rounded-lg bg-[var(--brand-700)]/50 hover:bg-[var(--brand-700)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === projectId && (
                          <div
                            className="absolute top-full right-0 mt-2 w-40 bg-[var(--brand-800)] border border-[var(--brand-700)]/50 rounded-xl shadow-xl overflow-hidden z-10 animate-reveal-down"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/projects/${projectId}`)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--text-muted)] hover:bg-[var(--brand-700)]/30 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProject(projectId)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project, index) => {
                  const projectId    = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon   = statusConfig.icon;

                  return (
                    <div
                      key={projectId}
                      className="group flex items-center gap-6 p-5 rounded-xl bg-[var(--brand-850)] border border-[var(--brand-700)]/50 hover:border-[var(--blue-400)]/30 cursor-pointer transition-all duration-300 animate-reveal-up"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--blue-400)]/20 to-[var(--blue-600)]/20 flex items-center justify-center flex-shrink-0 border border-[var(--blue-400)]/30">
                        <FolderOpen className="w-6 h-6 text-[var(--blue-400)]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>

                      <div className="text-sm text-[var(--text-muted)] hidden md:block">
                        {formatDate(project.created_at)}
                      </div>

                      <ArrowRight className="w-5 h-5 text-[var(--blue-600)] group-hover:text-[var(--blue-400)] group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;
