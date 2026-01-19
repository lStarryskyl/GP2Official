import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { phaseConfigs, phaseColors } from '@/constants/phases';
import {
  ChevronRight,
  ChevronLeft,
  Home,
  Calendar,
  BarChart3,
  FileText,
  CheckCircle2,
  Layers,
  Code,
  ListChecks,
  Flag,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface PhaseNavigationProps {
  projectId?: string;
  variant?: 'sidebar' | 'horizontal' | 'floating';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({
  projectId,
  variant = 'sidebar',
  collapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { phaseId } = useParams<{ phaseId: string }>();
  const location = useLocation();

  const currentPhaseId = phaseId || location.pathname.split('/').pop();
  const effectiveProjectId = projectId || location.pathname.split('/')[2];

  const getPhaseIcon = (id: string): React.ReactNode => {
    switch (id) {
      case 'planning':
        return <Calendar className="h-4 w-4" />;
      case 'feasibility_study':
        return <BarChart3 className="h-4 w-4" />;
      case 'requirements_gathering':
        return <FileText className="h-4 w-4" />;
      case 'validation':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'design':
        return <Layers className="h-4 w-4" />;
      case 'development':
        return <Code className="h-4 w-4" />;
      case 'tasks':
        return <ListChecks className="h-4 w-4" />;
      case 'cost_benefit':
        return <DollarSign className="h-4 w-4" />;
      case 'risks':
        return <AlertTriangle className="h-4 w-4" />;
      case 'summary':
        return <Flag className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const handlePhaseClick = (phase: typeof phaseConfigs[0]) => {
    if (effectiveProjectId) {
      navigate(`/projects/${effectiveProjectId}/phases/${phase.id}`);
    }
  };

  if (variant === 'horizontal') {
    return (
      <div className="w-full bg-navy-900/95 backdrop-blur-xl border-b border-navy-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => navigate(`/projects/${effectiveProjectId}`)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-navy-800 hover:text-gold-500 transition-all whitespace-nowrap"
            >
              <Home className="h-4 w-4" />
              Overview
            </button>
            <ChevronRight className="h-4 w-4 text-navy-700 flex-shrink-0" />
            {phaseConfigs.map((phase, idx) => {
              const isActive = currentPhaseId === phase.id;
              return (
                <React.Fragment key={phase.id}>
                  <button
                    onClick={() => handlePhaseClick(phase)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 shadow-lg shadow-gold-500/30 scale-105'
                        : 'bg-navy-800 text-gray-400 hover:bg-navy-700 hover:text-white hover:scale-105'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full ${isActive ? 'bg-navy-950/20' : 'bg-navy-700'}`}>
                      {getPhaseIcon(phase.id)}
                    </span>
                    <span>{phase.shortTitle}</span>
                  </button>
                  {idx < phaseConfigs.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-navy-700 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {phaseConfigs.map((phase) => {
          const colors = phaseColors[phase.color];
          const isActive = currentPhaseId === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl shadow-lg transition-all hover:scale-110 ${
                isActive
                  ? `bg-gradient-to-r ${colors.gradient} text-white`
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title={phase.title}
            >
              <span className="text-xl">
                {getPhaseIcon(phase.id)}
              </span>
              <span className="absolute right-full mr-2 px-2 py-1 rounded-lg bg-gray-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {phase.title}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Sidebar variant (default) - Navy & Gold Theme
  return (
    <div
      className={`flex flex-col h-full bg-navy-900 border-r border-navy-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-navy-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <span className="text-navy-950 font-bold text-sm">GP</span>
            </div>
            <span className="font-semibold text-white">Phases</span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-navy-800 text-gray-400 hover:text-gold-500 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Project Overview */}
        <button
          onClick={() => navigate(`/projects/${effectiveProjectId}`)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            !currentPhaseId || currentPhaseId === effectiveProjectId
              ? 'bg-navy-800 text-gold-500 border border-gold-500/30'
              : 'text-gray-400 hover:bg-navy-800 hover:text-white'
          }`}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Overview</span>}
        </button>

        {/* Phase Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold text-gold-500/60 uppercase tracking-wider">
              Development Phases
            </span>
          </div>
        )}

        {/* Phase Items */}
        {phaseConfigs.map((phase) => {
          const isActive = currentPhaseId === phase.id;
          const isCompleted = false; // Phase status tracked elsewhere

          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              data-testid={`phase-nav-${phase.id}`}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 shadow-lg shadow-gold-500/30'
                  : 'text-gray-400 hover:bg-navy-800 hover:text-white'
              }`}
            >
              {/* Phase Number/Icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                  isActive ? 'bg-navy-950/20' : 'bg-navy-800 group-hover:bg-navy-700'
                }`}
              >
                {getPhaseIcon(phase.id)}
              </div>

              {/* Phase Info */}
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{phase.shortTitle}</div>
                  {!isActive && (
                    <div className="text-xs opacity-60 truncate">
                      {phase.description.slice(0, 30)}...
                    </div>
                  )}
                </div>
              )}

              {/* Status Indicator */}
              {!collapsed && (
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-navy-950 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-navy-700" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer intentionally minimal to avoid placeholder progress */}
    </div>
  );
};

export default PhaseNavigation;
