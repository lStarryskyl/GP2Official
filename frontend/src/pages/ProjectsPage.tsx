import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
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
  Zap
} from 'lucide-react';
import type { Project } from '@/types';

const quickActions = [
  { icon: Plus, label: 'New Project', description: 'Start from scratch', action: 'new', color: 'from-acorn-orange-500 to-acorn-orange-600' },
  { icon: Upload, label: 'Import Document', description: 'Upload existing docs', action: 'import', color: 'from-acorn-blue-500 to-acorn-blue-600' },
  { icon: Lightbulb, label: 'AI Insights', description: 'View suggestions', action: 'insights', color: 'from-purple-500 to-purple-600' },
  { icon: HelpCircle, label: 'Documentation', description: 'Learn Acorn', action: 'docs', color: 'from-green-500 to-green-600' },
];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(observerRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [projects]);

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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
      draft: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Clock, label: 'Draft' },
      planning: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Loader2, label: 'Planning' },
      active: { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Active' },
      completed: { color: 'text-acorn-blue-600', bgColor: 'bg-acorn-blue-100', icon: CheckCircle, label: 'Completed' },
      archived: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle, label: 'Archived' },
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-acorn-blue-500 to-acorn-orange-500 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-acorn-blue-500 to-acorn-orange-500 rounded-full animate-pulse flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white animate-spin" />
              </div>
            </div>
            <p className="text-xl text-gray-600 animate-pulse">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-acorn-blue-100/30 blur-3xl -top-48 -right-48 animate-float" />
          <div className="absolute w-72 h-72 rounded-full bg-acorn-orange-100/30 blur-3xl -bottom-36 -left-36 animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute w-64 h-64 rounded-full bg-purple-100/30 blur-3xl top-1/2 right-1/4 animate-float" style={{ animationDelay: '6s' }} />
        </div>

        {/* Header */}
        <div 
          id="header"
          ref={(el) => (observerRefs.current['header'] = el)}
          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-700 ${
            isVisible['header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <span className="bg-gradient-to-r from-acorn-blue-600 to-acorn-orange-500 bg-clip-text text-transparent">
                Your Projects
              </span>
              <Zap className="w-8 h-8 text-acorn-orange-500 animate-pulse" />
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} • Growing strong
            </p>
          </div>
          <Button
            onClick={() => navigate('/projects/new')}
            className="bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            New Project
          </Button>
        </div>

        {/* Quick Actions */}
        <div 
          id="quick-actions"
          ref={(el) => (observerRefs.current['quick-actions'] = el)}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 ${
            isVisible['quick-actions'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          {quickActions.map((action, index) => (
            <button
              key={action.action}
              onClick={() => handleQuickAction(action.action)}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left group relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-gray-900 group-hover:text-acorn-blue-600 transition-colors">{action.label}</p>
              <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              
              <ArrowRight className="absolute bottom-5 right-5 w-5 h-5 text-gray-300 group-hover:text-acorn-orange-500 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div 
            id="empty-state"
            ref={(el) => (observerRefs.current['empty-state'] = el)}
            className={`bg-white rounded-3xl border border-gray-100 p-16 text-center relative overflow-hidden transition-all duration-700 ${
              isVisible['empty-state'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-64 h-64 rounded-full bg-acorn-blue-100/50 blur-3xl -top-32 -left-32 animate-float" />
              <div className="absolute w-48 h-48 rounded-full bg-acorn-orange-100/50 blur-3xl -bottom-24 -right-24 animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-acorn-blue-100 to-acorn-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
                <FolderOpen className="w-12 h-12 text-acorn-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No projects yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                Create your first project to start generating AI-powered requirements and documentation.
              </p>
              <Button
                onClick={() => navigate('/projects/new')}
                className="bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Create Your First Project
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const statusConfig = getStatusConfig(project.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={project.id}
                  id={`project-${index}`}
                  ref={(el) => (observerRefs.current[`project-${index}`] = el)}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={`bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-2xl hover:border-acorn-blue-200 transition-all duration-500 cursor-pointer group relative overflow-hidden ${
                    isVisible[`project-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-acorn-blue-500/5 to-acorn-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Animated Border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-acorn-blue-200 transition-colors duration-300" />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-acorn-blue-600 transition-colors duration-300">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:rotate-90"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} group-hover:scale-105 transition-transform duration-300`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      {[
                        { value: (project as any).requirements_count || 0, label: 'Requirements' },
                        { value: (project as any).tasks_count || 0, label: 'Tasks' },
                        { value: (project as any).diagrams_count || 0, label: 'Diagrams' },
                      ].map((metric, i) => (
                        <div key={i} className="text-center group-hover:scale-105 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }}>
                          <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                          <p className="text-xs text-gray-500">{metric.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-acorn-orange-500 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
      `}</style>
    </Layout>
  );
};
