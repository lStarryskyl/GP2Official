import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Sparkles, FolderOpen, Calendar, TrendingUp, Zap, BarChart3, Eye, ArrowRight, Layers } from 'lucide-react';
import type { Project } from '@/types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      planning: 'bg-blue-100 text-blue-700 border-blue-300',
      active: 'bg-green-100 text-green-700 border-green-300',
      archived: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[status] || colors.draft;
  };

  const getTemplateIcon = (type: string) => {
    const icons: Record<string, any> = {
      web_app: '🌐',
      mobile_app: '📱',
      api: '⚡',
      desktop: '💻',
      other: '📦',
    };
    return icons[type] || icons.other;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full animate-pulse flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-spin" />
              </div>
            </div>
            <p className="text-lg text-gray-600 animate-pulse">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header with floating animation */}
        <div className="relative">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -top-10 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slideDown">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-2">
                Your Projects
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} growing
              </p>
            </div>
            <Button
              onClick={() => navigate('/projects/new')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Plant New Project
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 rounded-full p-8 border-2 border-amber-300 shadow-xl">
                <Sparkles className="w-16 h-16 text-amber-600 animate-bounce" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 mb-6">Plant your first project seed and watch it grow!</p>
            <Button
              onClick={() => navigate('/projects/new')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const projectKey = project.project_id || project.id || `${project.name}-${index}`;
              const resolvedId = project.project_id || project.id || '';
              return (
              <div
                key={projectKey}
                className="group relative animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => setHoveredCard(projectKey)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Glow effect on hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500 ${
                  hoveredCard === projectKey ? 'animate-pulse' : ''
                }`}></div>
                
                <Card
                  className="relative h-full bg-white/80 backdrop-blur-sm border-2 border-amber-100 hover:border-amber-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden"
                  onClick={() => resolvedId && navigate(`/projects/${resolvedId}`)}
                >
                  {/* Animated background pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-500"></div>
                  
                  <div className="relative p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                          {getTemplateIcon(project.template_type)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(project.status)} transform group-hover:scale-105 transition-transform`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <Zap className="w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity" />
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2 mb-2">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-amber-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        <span className="truncate">
                          {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="truncate">Active</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (resolvedId) {
                            navigate(`/projects/${resolvedId}`);
                          }
                        }}
                      >
                        <Layers className="w-4 h-4 mr-1" />
                        Phases
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (resolvedId) {
                            navigate(`/projects/${resolvedId}/summary`);
                          }
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Summary
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
        }
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};
