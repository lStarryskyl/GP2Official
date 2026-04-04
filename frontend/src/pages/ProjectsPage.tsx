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
  TreePine
} from 'lucide-react';
import type { Project } from '@/types';

const quickActions = [
  { icon: Plus,       label: 'New Project',   description: 'Start from scratch',       action: 'new',     color: 'forest' },
  { icon: Upload,     label: 'Import',         description: 'Upload documents',          action: 'import',  color: 'sage' },
  { icon: Lightbulb, label: 'AI Insights',    description: 'Get recommendations',       action: 'insights',color: 'amber' },
  { icon: HelpCircle,label: 'Documentation',  description: 'Learn more',                action: 'docs',    color: 'green' },
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
      draft:     { color: 'text-[#6b9e7a]',   bgColor: 'bg-[#1e4a28]/20',   borderColor: 'border-[#1e4a28]/50',  icon: Clock,        label: 'Draft' },
      planning:  { color: 'text-[#86efac]',   bgColor: 'bg-[#4ade80]/10',   borderColor: 'border-[#4ade80]/30',  icon: Loader2,      label: 'Planning' },
      active:    { color: 'text-[#4ade80]',   bgColor: 'bg-[#4ade80]/15',   borderColor: 'border-[#4ade80]/40',  icon: CheckCircle,  label: 'Active' },
      completed: { color: 'text-[#fbbf24]',   bgColor: 'bg-[#fbbf24]/10',   borderColor: 'border-[#fbbf24]/30',  icon: CheckCircle,  label: 'Completed' },
      archived:  { color: 'text-[#a8d5a8]',   bgColor: 'bg-[#1e4a28]/10',   borderColor: 'border-[#1e4a28]/30',  icon: AlertCircle,  label: 'Archived' },
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#3d8a55] flex items-center justify-center mx-auto mb-6 animate-pulse">
                <TreePine className="w-8 h-8 text-[#0a150e]" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-[#4ade80]/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[#6b9e7a] text-lg">Loading your projects...</p>
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
                <div className="w-2 h-8 bg-gradient-to-b from-[#4ade80] to-[#2d6a3f] rounded-full" />
                <h1 className="text-4xl font-bold text-[#e8f5e0]">Projects</h1>
              </div>
              <p className="text-[#6b9e7a] text-lg ml-5">
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
              forest: 'from-[#4ade80] to-[#2d6a3f] hover:shadow-[#4ade80]/20',
              sage:   'from-[#86efac] to-[#4a7a56] hover:shadow-[#86efac]/20',
              amber:  'from-[#fbbf24] to-[#d97706] hover:shadow-[#fbbf24]/20',
              green:  'from-emerald-500 to-emerald-600 hover:shadow-emerald-500/20',
            }[action.color] || 'from-[#4ade80] to-[#2d6a3f]';

            return (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="group relative p-6 rounded-2xl bg-[#0f1f15] border border-[#1e4a28]/50 hover:border-[#4ade80]/30 transition-all duration-500 text-left overflow-hidden hover-lift"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#e8f5e0] mb-1">{action.label}</h3>
                <p className="text-sm text-[#6b9e7a]">{action.description}</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className={`flex flex-col md:flex-row gap-4 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b9e7a]" />
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

            <div className="flex items-center bg-[#0f1f15] rounded-xl p-1 border border-[#1e4a28]/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#4ade80] text-[#0a150e]' : 'text-[#6b9e7a] hover:text-[#e8f5e0]'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#4ade80] text-[#0a150e]' : 'text-[#6b9e7a] hover:text-[#e8f5e0]'}`}
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
                <div className="w-24 h-24 rounded-2xl bg-[#142b1a] flex items-center justify-center mx-auto mb-6 border border-[#1e4a28]/50">
                  <FolderOpen className="w-12 h-12 text-[#2d6a3f]" />
                </div>
                <h3 className="text-2xl font-bold text-[#e8f5e0] mb-3">No projects match your search</h3>
                <p className="text-[#6b9e7a] mb-8 max-w-md mx-auto">Try a different search term or clear the filter.</p>
                <button onClick={() => setSearchQuery('')} className="btn-secondary">Clear Search</button>
              </>
            ) : (
              <>
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#1e4a28]/60 to-[#0f1f15] flex items-center justify-center mx-auto mb-8 border border-[rgba(30,74,40,0.5)] shadow-lg shadow-[#4ade80]/10">
                  <Sparkles className="w-14 h-14 text-[#4ade80]" />
                </div>
                <h3 className="text-3xl font-bold text-[#e8f5e0] mb-4">Plant Your First Seed</h3>
                <p className="text-[#6b9e7a] mb-10 max-w-lg mx-auto text-lg leading-relaxed">
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
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor} mb-4`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>

                      {/* Project Info */}
                      <h3 className="text-xl font-semibold text-[#e8f5e0] mb-2 group-hover:text-[#4ade80] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-[#6b9e7a] text-sm mb-6 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-[#6b9e7a]">
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
                          className="p-2 rounded-lg bg-[#1e4a28]/50 hover:bg-[#4ade80] text-[#6b9e7a] hover:text-[#0a150e] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === projectId ? null : projectId);
                          }}
                          className="p-2 rounded-lg bg-[#1e4a28]/50 hover:bg-[#1e4a28] text-[#6b9e7a] hover:text-[#e8f5e0] transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === projectId && (
                          <div
                            className="absolute top-full right-0 mt-2 w-40 bg-[#142b1a] border border-[#1e4a28]/50 rounded-xl shadow-xl overflow-hidden z-10 animate-reveal-down"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/projects/${projectId}`)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#a8d5a8] hover:bg-[#1e4a28]/30 transition-colors"
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
                      className="group flex items-center gap-6 p-5 rounded-xl bg-[#0f1f15] border border-[#1e4a28]/50 hover:border-[#4ade80]/30 cursor-pointer transition-all duration-300 animate-reveal-up"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4ade80]/20 to-[#2d6a3f]/20 flex items-center justify-center flex-shrink-0 border border-[#4ade80]/30">
                        <FolderOpen className="w-6 h-6 text-[#4ade80]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#e8f5e0] group-hover:text-[#4ade80] transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-[#6b9e7a] truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>

                      <div className="text-sm text-[#6b9e7a] hidden md:block">
                        {formatDate(project.created_at)}
                      </div>

                      <ArrowRight className="w-5 h-5 text-[#2d6a3f] group-hover:text-[#4ade80] group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats Banner */}
        {projects.length > 0 && (
          <div className={`mt-12 p-8 rounded-2xl bg-gradient-to-r from-[#4ade80]/10 to-[#1e4a28]/20 border border-[#4ade80]/20 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#4ade80]/20 flex items-center justify-center border border-[#4ade80]/30">
                  <TrendingUp className="w-7 h-7 text-[#4ade80]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#e8f5e0]">Project Overview</h4>
                  <p className="text-sm text-[#6b9e7a]">Your enterprise portfolio at a glance</p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#4ade80]">{projects.length}</div>
                  <div className="text-xs text-[#6b9e7a] mt-1">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#86efac]">
                    {projects.filter(p => p.status === 'active' || p.status === 'completed').length}
                  </div>
                  <div className="text-xs text-[#6b9e7a] mt-1">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#fbbf24]">
                    {projects.filter(p => p.status === 'draft' || p.status === 'planning').length}
                  </div>
                  <div className="text-xs text-[#6b9e7a] mt-1">In Progress</div>
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
