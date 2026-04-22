import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { phaseConfigs } from '@/constants/phases';
import { ChevronLeft, ChevronRight, Home, Check } from 'lucide-react';

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

  // ─── Horizontal Tab Bar (Dark Navy/Gold Theme) ───────────────────────────────────
  if (variant === 'horizontal') {
    return (
      <div className="w-full bg-[var(--brand-900)]/95 backdrop-blur-xl border-b border-[var(--brand-700)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-thin">
            {/* Overview link */}
            <button
              onClick={() => navigate(`/projects/${effectiveProjectId}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-[var(--blue-400)] hover:bg-[#152238] transition-all whitespace-nowrap"
            >
              <Home className="h-3.5 w-3.5" />
              Overview
            </button>

            <ChevronRight className="h-4 w-4 text-[var(--brand-700)] flex-shrink-0" />

            {/* Phase tabs */}
            {phaseConfigs.map((phase, idx) => {
              const isActive = currentPhaseId === phase.id;
              const status = getStatus(phase.id);
              const isCompleted = status === 'completed' || status === 'ready';
              return (
                <React.Fragment key={phase.id}>
                  <button
                    onClick={() => handlePhaseClick(phase)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] text-[var(--brand-900)] shadow-lg shadow-[var(--blue-400)]/30'
                        : 'bg-[#152238] text-gray-400 hover:bg-[var(--brand-700)] hover:text-white'
                    }`}
                  >
                    {/* Step number or check */}
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-[var(--brand-900)]/20 text-[var(--brand-900)]'
                        : isCompleted
                          ? 'bg-blue-900/20 text-blue-400'
                          : 'bg-[var(--brand-700)] text-gray-500'
                    }`}>
                      {isCompleted && !isActive ? <Check className="h-3 w-3" /> : phase.stepNumber}
                    </span>
                    <span>{phase.shortTitle}</span>
                  </button>
                  {idx < phaseConfigs.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-[var(--brand-700)] flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Floating Variant (Dark Navy/Gold Theme) ─────────────────────────────────────
  if (variant === 'floating') {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {phaseConfigs.map((phase) => {
          const isActive = currentPhaseId === phase.id;
          const status = getStatus(phase.id);
          const isCompleted = status === 'completed' || status === 'ready';
          return (
            <button
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl shadow-lg transition-all hover:scale-110 ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] text-[var(--brand-900)] shadow-[var(--blue-400)]/30'
                  : 'bg-[var(--brand-900)] border border-[var(--brand-700)] text-gray-400 hover:bg-[#152238] hover:text-[var(--blue-400)] hover:border-[var(--blue-400)]/50'
              }`}
              title={phase.title}
            >
              <span className="text-sm font-bold">{phase.stepNumber}</span>
              {isCompleted && !isActive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-900/200 rounded-full border-2 border-[var(--brand-900)]" />
              )}
              <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-[#152238] border border-[var(--brand-700)] text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {phase.title}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Sidebar Variant (Dark Navy/Gold Theme) ────────────────────────────
  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ backgroundColor: 'var(--brand-900)', borderRight: '1px solid var(--brand-700)' }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--brand-700)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--blue-400), #b8962e)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--brand-900)' }}>GP</span>
            </div>
            <span className="font-semibold text-white">Phases</span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-gray-400 hover:text-[var(--blue-400)] hover:bg-[#152238] transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
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
              ? 'text-[var(--blue-400)]'
              : 'text-gray-400 hover:text-white'
          }`}
          style={{
            backgroundColor: (!currentPhaseId || currentPhaseId === effectiveProjectId) ? '#152238' : 'transparent',
            border: (!currentPhaseId || currentPhaseId === effectiveProjectId) ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent'
          }}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Overview</span>}
        </button>

        {/* Phase Divider */}
        {!collapsed && (
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(212, 175, 55, 0.6)' }}>
              Development Phases
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
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'text-[var(--brand-900)] shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                background: isActive ? 'linear-gradient(to right, var(--blue-400), #b8962e)' : 'transparent',
                boxShadow: isActive ? '0 10px 15px -3px rgba(212, 175, 55, 0.3)' : 'none'
              }}
            >
              {/* Phase Number */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                style={{ 
                  backgroundColor: isActive ? 'rgba(10, 15, 26, 0.2)' : '#152238',
                  color: isCompleted && !isActive ? '#10b981' : 'inherit'
                }}
              >
                {isCompleted && !isActive ? <Check className="h-4 w-4" /> : phase.stepNumber}
              </div>

              {/* Phase Info */}
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{phase.shortTitle}</div>
                  {!isActive && (
                    <div className="text-xs opacity-60 truncate">
                      {phase.description?.slice(0, 30)}...
                    </div>
                  )}
                </div>
              )}

              {/* Status Indicator */}
              {!collapsed && (
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-blue-900/200 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--brand-900)' }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-700)' }} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PhaseNavigation;
