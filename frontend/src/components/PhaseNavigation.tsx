import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { phaseConfigs } from '@/constants/phases';
import { ChevronLeft, Home, Check } from 'lucide-react';

interface PhaseNavigationProps {
  projectId?: string;
  variant?: 'sidebar' | 'horizontal' | 'floating';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  phaseStatus?: Record<string, string>;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({
  projectId,
  variant = 'sidebar',
  collapsed = false,
  onToggleCollapse,
  phaseStatus = {},
}) => {
  const navigate = useNavigate();
  const { phaseId } = useParams<{ phaseId: string }>();
  const location = useLocation();

  const currentPhaseId = phaseId || location.pathname.split('/').pop();
  const effectiveProjectId = projectId || location.pathname.split('/')[2];

  const handlePhaseClick = (phase: typeof phaseConfigs[0]) => {
    if (effectiveProjectId) {
      navigate(`/projects/${effectiveProjectId}/phases/${phase.id}`);
    }
  };

  const getStatus = (id: string) => (phaseStatus[id] || 'locked').toLowerCase();

  // ─── Horizontal Tab Bar ───────────────────────────────────
  if (variant === 'horizontal') {
    return (
      <div className="w-full sticky top-0 z-40">
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-thin">
              {/* Overview link */}
              <button
                onClick={() => navigate(`/projects/${effectiveProjectId}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all whitespace-nowrap"
              >
                <Home className="h-3.5 w-3.5" />
                Overview
              </button>

              <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

              {/* Phase tabs */}
              {phaseConfigs.map((phase) => {
                const isActive = currentPhaseId === phase.id;
                const status = getStatus(phase.id);
                const isCompleted = status === 'completed' || status === 'ready';
                return (
                  <button
                    key={phase.id}
                    onClick={() => handlePhaseClick(phase)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    {/* Step number or check */}
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${isActive
                        ? 'bg-white/25 text-white'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                      {isCompleted && !isActive ? <Check className="h-3 w-3" /> : phase.stepNumber}
                    </span>
                    <span>{phase.shortTitle}</span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Floating Variant ─────────────────────────────────────
  if (variant === 'floating') {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1.5">
        {phaseConfigs.map((phase) => {
          const isActive = currentPhaseId === phase.id;
          const status = getStatus(phase.id);
          const isCompleted = status === 'completed' || status === 'ready';
          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-300 shadow-sm'
                }`}
              title={phase.title}
            >
              <span className="text-xs font-bold">{phase.stepNumber}</span>
              {isCompleted && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              )}
              <span className="absolute right-full mr-2 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {phase.title}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Sidebar Variant (default) ────────────────────────────
  return (
    <div
      className={`flex flex-col h-full bg-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <span className="font-bold text-sm text-white">GP</span>
            </div>
            <span className="font-semibold text-slate-900">Phases</span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {/* Project Overview */}
        <button
          onClick={() => navigate(`/projects/${effectiveProjectId}`)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${!currentPhaseId || currentPhaseId === effectiveProjectId
              ? 'bg-slate-100 text-slate-900 font-medium'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Overview</span>}
        </button>

        {/* Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Phases
            </span>
          </div>
        )}

        {/* Phase Items */}
        {phaseConfigs.map((phase) => {
          const isActive = currentPhaseId === phase.id;
          const status = getStatus(phase.id);
          const isCompleted = status === 'completed' || status === 'ready';

          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              data-testid={`phase-nav-${phase.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group ${isActive
                  ? 'bg-amber-50 text-amber-700 font-medium border border-amber-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
            >
              {/* Step number */}
              <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${isActive
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isCompleted
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                {isCompleted && !isActive ? <Check className="h-3.5 w-3.5" /> : phase.stepNumber}
              </span>

              {/* Phase Info */}
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="truncate">{phase.shortTitle}</div>
                </div>
              )}

              {/* Status dot */}
              {!collapsed && (
                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'
                  }`} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PhaseNavigation;
