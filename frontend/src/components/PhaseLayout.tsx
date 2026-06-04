import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { m, AnimatePresence, useAnimation } from 'framer-motion';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { phaseConfigs } from '@/constants/phases';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhaseAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

export interface PhaseLayoutProps {
  children: React.ReactNode;
  projectId: string;
  phaseId: string;
  projectName?: string;
  status?: 'idle' | 'streaming' | 'done' | 'error';
  isStreaming?: boolean;
  actions?: PhaseAction[];
  sidebarContent?: React.ReactNode;
  onRegenerate?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Phase-to-accent color mapping (brand palette only)
const PHASE_ACCENT: Record<string, string> = {
  planning:               '#D4A017',
  feasibility_study:      '#7BA05B',
  requirements_gathering: '#1A6FD4',
  validation:             '#5F7A8A',
  design:                 '#6B4C8A',
  development:            '#8B5E3C',
  tasks:                  '#D4A017',
  cost_benefit:           '#2A9D8F',
  risks:                  '#C1440E',
  testing:                '#0EA5E9',
  summary:                '#1A6FD4',
};

// ─── Streaming badge ──────────────────────────────────────────────────────────

const StreamingBadge: React.FC<{ isStreaming: boolean }> = ({ isStreaming }) => (
  <AnimatePresence>
    {isStreaming && (
      <m.div
        key="streaming-badge"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '4px 12px', borderRadius: 999,
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.35)',
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: '#F97316', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}
      >
        <m.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block', flexShrink: 0 }}
        />
        Streaming
      </m.div>
    )}
  </AnimatePresence>
);

// ─── Regenerate button ────────────────────────────────────────────────────────

const RegenerateButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const controls = useAnimation();

  const handleClick = async () => {
    await controls.start({ rotate: 360, transition: { duration: 0.55, ease: EASE_OUT } });
    controls.set({ rotate: 0 });
    onClick?.();
  };

  return (
    <m.button
      onClick={handleClick}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 10,
        background: 'rgba(26,111,212,0.1)',
        border: '1px solid rgba(26,111,212,0.25)',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
        color: '#3d8fe0',
        willChange: 'transform',
      }}
    >
      <m.span animate={controls} style={{ display: 'flex' }}>
        <RotateCcw size={14} />
      </m.span>
      Regenerate
    </m.button>
  );
};

// ─── Phase stepper ────────────────────────────────────────────────────────────

const PhaseStepper: React.FC<{ projectId: string; currentPhaseId: string }> = ({ projectId, currentPhaseId }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      overflowX: 'auto', paddingBottom: 4,
      scrollbarWidth: 'none',
    }}>
      {phaseConfigs.map((phase, i) => {
        const isCurrent = phase.id === currentPhaseId;
        const isPast = phase.order < (phaseConfigs.find(p => p.id === currentPhaseId)?.order ?? 0);
        const accent = PHASE_ACCENT[phase.id] ?? '#1A6FD4';

        return (
          <React.Fragment key={phase.id}>
            <m.button
              onClick={() => navigate(`/projects/${projectId}/phases/${phase.id}`)}
              whileHover={{ y: -1, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: '5px 12px', borderRadius: 999, flexShrink: 0,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                cursor: 'pointer', border: '1px solid',
                background: isCurrent
                  ? accent + '22'
                  : isPast
                  ? 'rgba(26,111,212,0.06)'
                  : 'transparent',
                borderColor: isCurrent ? accent + 'aa' : isPast ? 'rgba(26,111,212,0.22)' : 'rgba(26,46,69,0.4)',
                color: isCurrent ? accent : isPast ? '#8899AA' : '#4a6070',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                willChange: 'transform',
              }}
            >
              {isPast ? '✓ ' : ''}{phase.shortTitle}
            </m.button>
            {i < phaseConfigs.length - 1 && (
              <ChevronRight size={10} color="#243B55" style={{ flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Action button ────────────────────────────────────────────────────────────

const ActionButton: React.FC<{ action: PhaseAction }> = ({ action }) => {
  const isPrimary = action.variant === 'primary';
  const isGhost = action.variant === 'ghost';

  return (
    <m.button
      onClick={action.onClick}
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
        background: isPrimary
          ? 'linear-gradient(135deg, #1A6FD4, #0d2b52)'
          : isGhost
          ? 'transparent'
          : 'rgba(26,46,69,0.5)',
        border: isPrimary
          ? '1px solid rgba(26,111,212,0.4)'
          : isGhost
          ? 'none'
          : '1px solid rgba(26,111,212,0.2)',
        color: isPrimary ? '#fff' : '#8899AA',
        willChange: 'transform',
        boxShadow: isPrimary ? '0 4px 14px rgba(26,111,212,0.3)' : 'none',
      }}
    >
      {action.icon}
      {action.label}
    </m.button>
  );
};

// ─── PhaseLayout ──────────────────────────────────────────────────────────────

export const PhaseLayout: React.FC<PhaseLayoutProps> = ({
  children,
  projectId,
  phaseId,
  projectName,
  isStreaming = false,
  actions = [],
  sidebarContent,
  onRegenerate,
}) => {
  const navigate = useNavigate();
  const currentPhase = phaseConfigs.find(p => p.id === phaseId);
  const accent = PHASE_ACCENT[phaseId] ?? '#1A6FD4';

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}
    >
      {/* ── Top bar ── */}
      <div style={{
        padding: '0 0 20px 0',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4a6070',
              padding: 0, transition: 'color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8899AA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a6070'; }}
          >
            {projectName ?? 'Project'}
          </button>
          <ChevronRight size={12} color="#243B55" />
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: accent, fontWeight: 600,
          }}>
            {currentPhase?.title ?? phaseId}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <StreamingBadge isStreaming={isStreaming} />
            <RegenerateButton onClick={onRegenerate} />
          </div>
        </div>

        {/* Phase stepper */}
        <PhaseStepper projectId={projectId} currentPhaseId={phaseId} />
      </div>

      {/* ── Two-column body ── */}
      <div style={{
        display: 'flex', gap: 24, flex: 1, minHeight: 0,
        alignItems: 'flex-start',
      }}>
        {/* Main output panel — 65% */}
        <div style={{
          flex: '0 0 65%', maxWidth: '65%',
          display: 'flex', flexDirection: 'column', gap: 0,
          minHeight: 0,
        }}>
          <m.div
            layout
            style={{
              background: 'rgba(10,21,37,0.6)',
              border: '1px solid rgba(26,111,212,0.14)',
              borderRadius: 16, padding: '28px 32px',
              minHeight: 480, position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Streaming cursor overlay */}
            <AnimatePresence>
              {isStreaming && (
                <m.span
                  key="cursor"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                  style={{
                    display: 'inline-block', width: 2, height: '1.1em',
                    background: '#F97316', borderRadius: 1, marginLeft: 2,
                    verticalAlign: 'text-bottom',
                  }}
                />
              )}
            </AnimatePresence>

            {children}
          </m.div>

          {/* Phase actions */}
          {actions.length > 0 && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT }}
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 16,
              }}
            >
              {actions.map(action => (
                <ActionButton key={action.label} action={action} />
              ))}
            </m.div>
          )}
        </div>

        {/* Metadata sidebar — 35% */}
        <div style={{
          flex: '0 0 35%', maxWidth: '35%',
          display: 'flex', flexDirection: 'column', gap: 16,
          position: 'sticky', top: 0,
        }}>
          {/* Phase list quick-jump */}
          <div style={{
            background: 'rgba(10,21,37,0.5)',
            border: '1px solid rgba(26,111,212,0.12)',
            borderRadius: 14, padding: '20px',
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              letterSpacing: '0.14em', color: '#4a6070',
              textTransform: 'uppercase', marginBottom: 16,
            }}>
              All Phases
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              maxHeight: 280, overflowY: 'auto', scrollbarWidth: 'none',
            }}>
              {phaseConfigs.map(phase => {
                const isCurrent = phase.id === phaseId;
                const a = PHASE_ACCENT[phase.id] ?? '#1A6FD4';
                return (
                  <m.button
                    key={phase.id}
                    onClick={() => navigate(`/projects/${projectId}/phases/${phase.id}`)}
                    whileHover={{ x: 3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                      background: isCurrent ? a + '18' : 'transparent',
                      border: isCurrent ? `1px solid ${a}44` : '1px solid transparent',
                      textAlign: 'left', width: '100%',
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: isCurrent ? a : 'rgba(74,96,112,0.4)',
                    }} />
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                      color: isCurrent ? a : '#8899AA', fontWeight: isCurrent ? 600 : 400,
                    }}>
                      {phase.title}
                    </span>
                  </m.button>
                );
              })}
            </div>
          </div>

          {/* Custom sidebar content */}
          {sidebarContent && (
            <div style={{
              background: 'rgba(10,21,37,0.5)',
              border: '1px solid rgba(26,111,212,0.12)',
              borderRadius: 14, padding: '20px',
            }}>
              {sidebarContent}
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
};

export default PhaseLayout;
