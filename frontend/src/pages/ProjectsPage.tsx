import React, { useEffect, useState, useRef } from 'react';
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
  Zap,
  Search,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Edit3,
  ExternalLink,
  BarChart3,
  Users,
  FileText
} from 'lucide-react';
import type { Project } from '@/types';

const quickActions = [
  { icon: Plus, label: 'New Project', description: 'Start from scratch', action: 'new', gradient: 'from-amber-500 to-orange-600' },
  { icon: Upload, label: 'Import', description: 'Upload docs', action: 'import', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Lightbulb, label: 'AI Ideas', description: 'Get suggestions', action: 'insights', gradient: 'from-purple-500 to-pink-500' },
  { icon: HelpCircle, label: 'Learn', description: 'Documentation', action: 'docs', gradient: 'from-emerald-500 to-teal-500' },
];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
    setActiveMenu(null);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType; label: string }> = {
      draft: { color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30', icon: Clock, label: 'Draft' },
      planning: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: Loader2, label: 'Planning' },
      active: { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: CheckCircle, label: 'Active' },
      completed: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: CheckCircle, label: 'Completed' },
      archived: { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', icon: AlertCircle, label: 'Archived' },
    };
    return configs[status] || configs.draft;
  };

  const handleQuickAction = (action: string) => {
    if (action === 'new' || action === 'import') {
      navigate('/projects/new');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-amber-500/30 blur-xl animate-pulse" />
            </div>
            <p className="text-slate-400 text-lg">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-12">
        {/* Header Section */}
        <div 
          className={`mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Projects
              </h1>
              <p className="text-slate-400 text-lg">
                Manage and track all your AI-powered project plans
              </p>
            </div>
            
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-premium group"
              data-testid="new-project-btn"
            >
              <Plus className="w-5 h-5" />
              New Project
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="group relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 transition-all duration-300 text-left overflow-hidden"
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {/* Gradient Glow on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{action.label}</h3>
                <p className="text-sm text-slate-500">{action.description}</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div 
          className={`flex flex-col md:flex-row gap-4 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium pl-12 w-full"
              data-testid="search-projects-input"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-4 py-3">
              <Filter className="w-5 h-5" />
              <span className="hidden md:inline">Filters</span>
            </button>
            
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div 
            className={`text-center py-20 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Create your first project and let AI help you build comprehensive documentation
            </p>
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-premium"
            >
              <Plus className="w-5 h-5" />
              Create First Project
            </button>
          </div>
        ) : (
          <div 
            className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const isHovered = hoveredProject === project.id;
                  
                  return (
                    <div
                      key={project.id}
                      className="group relative card-premium p-6 cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      onMouseEnter={() => setHoveredProject(project.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      style={{ animationDelay: `${index * 50}ms` }}
                      data-testid={`project-card-${project.id}`}
                    >
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor} mb-4`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                      
                      {/* Project Info */}
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
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
                            navigate(`/projects/${project.id}`);
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-400 hover:text-white transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === project.id ? null : project.id);
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenu === project.id && (
                          <div 
                            className="absolute top-full right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10 animate-fade-in-down"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProject(project.id)}
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
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={project.id}
                      className="group flex items-center gap-6 p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 cursor-pointer transition-all duration-300"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-6 h-6 text-amber-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                      
                      <div className="text-sm text-slate-500 hidden md:block">
                        {formatDate(project.created_at)}
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats Banner */}
        {projects.length > 0 && (
          <div 
            className={`mt-12 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Your Progress</h4>
                  <p className="text-sm text-slate-400">Keep building amazing things</p>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">{projects.length}</div>
                  <div className="text-xs text-slate-500">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {projects.filter(p => p.status === 'active' || p.status === 'completed').length}
                  </div>
                  <div className="text-xs text-slate-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {projects.filter(p => p.status === 'draft').length}
                  </div>
                  <div className="text-xs text-slate-500">In Draft</div>
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
