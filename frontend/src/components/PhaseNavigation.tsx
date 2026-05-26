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

  // ─── Horizontal Timeline (Modern Brand Theme) ──────────────────────────────
  if (variant === 'horizontal') {
    const completedCount = phaseConfigs.filter(p => {
      const s = getStatus(p.id);
      return s === 'completed' || s === 'ready';
    }).length;
    const overallPct = Math.round((completedCount / phaseConfigs.length) * 100);

    return (
<<<<<<< HEAD
      <div className="w-full bg-[var(--brand-900)]/95 backdrop-blur-xl border-b border-[var(--brand-700)] sticky top-0 z-40">
=======
      <div
        className="w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(13,27,42,0.6) 0%, rgba(13,27,42,0.2) 100%)',
          borderBottom: '1px solid rgba(26,111,212,0.2)',
          padding: '14px 0 12px',
        }}
      >
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2.5">
            <button
              onClick={() => navigate(`/projects/${effectiveProjectId}`)}
<<<<<<< HEAD
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-[var(--blue-400)] hover:bg-[#152238] transition-all whitespace-nowrap"
=======
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--blue-300)] transition-colors"
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
            >
              <Home className="h-3.5 w-3.5" /> Project Overview
            </button>
            <div className="text-xs text-[var(--text-faint)] font-semibold uppercase tracking-wider">
              Journey · <span className="text-[var(--blue-300)]">{overallPct}%</span> complete
            </div>
          </div>

<<<<<<< HEAD
            <ChevronRight className="h-4 w-4 text-[var(--brand-700)] flex-shrink-0" />
=======
          <div className="relative">
            {/* Progress baseline */}
            <div
              style={{
                position: 'absolute', top: '14px', left: '14px', right: '14px', height: '2px',
                background: 'rgba(74,96,112,0.25)', borderRadius: '999px', zIndex: 0,
              }}
            />
            <div
              style={{
                position: 'absolute', top: '14px', left: '14px',
                width: `calc(${overallPct}% - ${overallPct > 0 ? '14px' : '0px'})`,
                height: '2px',
                background: 'linear-gradient(90deg, #22c55e, #1A6FD4, #F97316)',
                borderRadius: '999px', zIndex: 1,
                transition: 'width 0.6s var(--ease-out-expo, ease)',
              }}
            />
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1

            <div className="relative flex items-start justify-between gap-1 overflow-x-auto pb-1" style={{ zIndex: 2 }}>
              {phaseConfigs.map((phase) => {
                const isActive    = currentPhaseId === phase.id;
                const status      = getStatus(phase.id);
                const isCompleted = status === 'completed' || status === 'ready';
                const isProgress  = status === 'in_progress';
                const isLocked    = status === 'locked';

                let dotBg = 'rgba(74,96,112,0.6)';
                let dotBorder = '#0d1b2a';
                let dotText = 'var(--text-faint)';
                if (isActive)         { dotBg = '#1A6FD4'; dotText = '#fff'; dotBorder = '#1A6FD4'; }
                else if (isCompleted) { dotBg = '#22c55e'; dotText = '#fff'; dotBorder = '#22c55e'; }
                else if (isProgress)  { dotBg = '#F97316'; dotText = '#fff'; dotBorder = '#F97316'; }

                return (
                  <button
                    key={phase.id}
                    onClick={() => handlePhaseClick(phase)}
<<<<<<< HEAD
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
                          ? 'bg-blue-900/200/20 text-blue-400'
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
=======
                    disabled={isLocked && !isActive}
                    title={`${phase.title}${isLocked ? ' (locked)' : ''}`}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      background: 'transparent', border: 'none',
                      cursor: isLocked && !isActive ? 'not-allowed' : 'pointer',
                      opacity: isLocked && !isActive ? 0.5 : 1,
                      minWidth: '70px', padding: '0 2px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    data-testid={`phase-nav-${phase.id}`}
                  >
                    <div
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: dotBg, color: dotText,
                        border: `3px solid ${dotBorder === '#0d1b2a' ? '#0d1b2a' : 'rgba(13,27,42,0.9)'}`,
                        boxShadow: isActive
                          ? '0 0 0 3px rgba(26,111,212,0.35), 0 4px 12px rgba(26,111,212,0.4)'
                          : isCompleted
                            ? '0 2px 8px rgba(34,197,94,0.3)'
                            : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '11px', flexShrink: 0,
                        transition: 'all 0.25s',
                      }}
                    >
                      {isCompleted && !isActive ? <Check className="h-3.5 w-3.5" /> : phase.stepNumber}
                    </div>
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--blue-300)' : isCompleted ? '#86efac' : 'var(--text-muted)',
                        textAlign: 'center', lineHeight: 1.2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '70px',
                        fontFamily: isActive ? "'Syne', sans-serif" : "'DM Sans', sans-serif",
                      }}
                    >
                      {phase.shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
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
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';

          const dotColor = isCompleted
            ? '#3b82f6'
            : isInProgress
            ? '#f97316'
            : '#374151';

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
                  color: isCompleted && !isActive ? '#3b82f6' : 'inherit'
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

<<<<<<< HEAD
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
=======
              {/* Status Dot Indicator */}
              <div className="flex-shrink-0">
                <div
                  className="rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: dotColor,
                    boxShadow: isCompleted ? '0 0 6px #3b82f6' : isInProgress ? '0 0 6px #f97316' : 'none',
                  }}
                />
              </div>
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PhaseNavigation;
