/**
 * DemoMode — persistent bottom-right pill that walks through the entire
 * real application, including all 11 SDLC phase pages of a real project.
 *
 * Project ID strategy:
 *   - When the user opens any project, we cache its ID in
 *     localStorage['acorn_demo_project_id'].
 *   - The demo reads that ID and navigates to every real phase route.
 *   - If no project ID is cached, the demo walks only the public pages
 *     and shows a tooltip asking the user to open a project first.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { phaseConfigs } from '@/constants/phases';

// ─── Storage key ──────────────────────────────────────────────────────────────

export const DEMO_PROJECT_KEY = 'acorn_demo_project_id';

// ─── Demo step definition ─────────────────────────────────────────────────────

interface DemoStep {
  path: string;
  label: string;
  /** milliseconds to stay on this screen */
  dwell: number;
  /** whether this step requires a real project ID */
  needsProject?: boolean;
}

/** Build the full step list.  projectId may be '' when no project is cached. */
function buildSteps(projectId: string): DemoStep[] {
  const pub: DemoStep[] = [
    { path: '/',         label: 'Landing',    dwell: 5000 },
    { path: '/login',    label: 'Sign In',    dwell: 4000 },
    { path: '/register', label: 'Register',   dwell: 4000 },
  ];

  if (!projectId) return pub;

  const phaseSteps: DemoStep[] = phaseConfigs.map(p => ({
    path: `/projects/${projectId}/phases/${p.id}`,
    label: p.title,
    dwell: 9000,
    needsProject: true,
  }));

  const projectSteps: DemoStep[] = [
    { path: '/projects',                             label: 'Dashboard',    dwell: 5000, needsProject: true },
    { path: `/projects/${projectId}`,                label: 'Project',      dwell: 5000, needsProject: true },
    ...phaseSteps,
    { path: `/projects/${projectId}/summary`,        label: 'Summary',      dwell: 8000, needsProject: true },
    { path: `/projects/${projectId}/diagram-studio`, label: 'Diagrams',     dwell: 7000, needsProject: true },
    { path: `/projects/${projectId}/export`,         label: 'Export',       dwell: 5000, needsProject: true },
    { path: `/projects/${projectId}/analytics`,      label: 'Analytics',    dwell: 5000, needsProject: true },
  ];

  return [...pub, ...projectSteps];
}

// ─── Ease ─────────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, background: 'rgba(26,46,69,0.6)', borderRadius: '0 0 999px 999px', overflow: 'hidden',
  }}>
    <m.div
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ height: '100%', background: '#F97316', borderRadius: 'inherit' }}
    />
  </div>
);

// ─── DemoMode component ───────────────────────────────────────────────────────

export const DemoMode: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [running,    setRunning]    = useState(false);
  const [stepIdx,    setStepIdx]    = useState(0);
  const [noProject,  setNoProject]  = useState(false);
  const [pct,        setPct]        = useState(0);

  const runningRef = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pctRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef   = useRef<DemoStep[]>([]);
  const idxRef     = useRef(0);

  // ── tick pct bar ──
  const startPct = useCallback((dwell: number) => {
    setPct(0);
    if (pctRef.current) clearInterval(pctRef.current);
    const tick = 80; // ms
    let elapsed = 0;
    pctRef.current = setInterval(() => {
      elapsed += tick;
      setPct(Math.min((elapsed / dwell) * 100, 99));
      if (elapsed >= dwell) { if (pctRef.current) clearInterval(pctRef.current); }
    }, tick);
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (pctRef.current)   { clearInterval(pctRef.current);  pctRef.current   = null; }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setStepIdx(0);
    setPct(0);
    setNoProject(false);
    clearTimers();
  }, [clearTimers]);

  const runStep = useCallback((idx: number) => {
    if (!runningRef.current) return;
    const steps = stepsRef.current;
    if (idx >= steps.length) { stop(); return; }

    const step = steps[idx];
    idxRef.current = idx;
    setStepIdx(idx);
    navigate(step.path);
    startPct(step.dwell);

    timerRef.current = setTimeout(() => runStep(idx + 1), step.dwell);
  }, [navigate, startPct, stop]);

  const start = useCallback(() => {
    const projectId = localStorage.getItem(DEMO_PROJECT_KEY) ?? '';
    const steps = buildSteps(projectId);
    stepsRef.current = steps;

    runningRef.current = true;
    setRunning(true);
    setNoProject(!projectId);
    runStep(0);
  }, [runStep]);

  const toggle = () => { if (running) stop(); else start(); };

  // Stop if user navigates away manually mid-demo
  useEffect(() => {
    if (!running) return;
    const expected = stepsRef.current[idxRef.current]?.path;
    if (expected && location.pathname !== expected) stop();
  }, [location.pathname, running, stop]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const steps         = stepsRef.current;
  const currentStep   = steps[stepIdx];
  const totalSteps    = steps.length;

  return (
    <AnimatePresence>
      <m.div
        key="demo-pill"
        initial={{ opacity: 0, y: 24, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.4, type: 'spring', stiffness: 260, damping: 22 }}
        style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9000 }}
      >
        {/* No-project tooltip */}
        <AnimatePresence>
          {noProject && running && (
            <m.div
              key="no-project-tip"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{
                position: 'absolute', bottom: '110%', right: 0,
                background: 'rgba(10,21,37,0.97)',
                border: '1px solid rgba(249,115,22,0.35)',
                borderRadius: 10, padding: '10px 14px', width: 220,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                color: '#8899AA', lineHeight: 1.55,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ color: '#F97316', fontWeight: 600 }}>Tip:</span> Open any project
              first so the demo can show all phase pages.
              <div style={{ position: 'absolute', bottom: -6, right: 18, width: 10, height: 10, background: 'rgba(10,21,37,0.97)', borderRight: '1px solid rgba(249,115,22,0.35)', borderBottom: '1px solid rgba(249,115,22,0.35)', transform: 'rotate(45deg)' }} />
            </m.div>
          )}
        </AnimatePresence>

        {/* Main pill */}
        <m.button
          onClick={toggle}
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 18px 9px 14px', borderRadius: 999, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(5,13,26,0.96), rgba(13,27,42,0.92))',
            border: `1px solid ${running ? 'rgba(249,115,22,0.5)' : 'rgba(26,111,212,0.3)'}`,
            backdropFilter: 'blur(14px)',
            boxShadow: running
              ? '0 4px 24px rgba(249,115,22,0.18), 0 0 0 1px rgba(249,115,22,0.08)'
              : '0 4px 20px rgba(0,0,0,0.35)',
            position: 'relative', overflow: 'hidden',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            willChange: 'transform',
          }}
        >
          {/* Pulsing dot */}
          <m.span
            animate={running
              ? { opacity: [1, 0.25, 1], scale: [1, 1.4, 1] }
              : { opacity: 1, scale: 1 }
            }
            transition={running ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' } : {}}
            style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: running ? '#F97316' : '#1A6FD4',
              boxShadow: running ? '0 0 6px rgba(249,115,22,0.7)' : 'none',
            }}
          />

          {/* Button label */}
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600,
            letterSpacing: '0.07em', color: running ? '#F97316' : '#8899AA',
            transition: 'color 0.3s', whiteSpace: 'nowrap',
          }}>
            {running ? '■ Stop' : 'Demo Mode'}
          </span>

          {/* Current step label + counter */}
          <AnimatePresence mode="wait">
            {running && currentStep && (
              <m.span
                key={currentStep.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: EASE }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  paddingLeft: 8, borderLeft: '1px solid rgba(26,46,69,0.7)',
                }}
              >
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                  color: '#E8EDF5', whiteSpace: 'nowrap',
                }}>
                  {currentStep.label}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10,
                  color: '#4a6070', whiteSpace: 'nowrap',
                }}>
                  {stepIdx + 1}/{totalSteps}
                </span>
              </m.span>
            )}
          </AnimatePresence>

          {/* Progress bar at the bottom */}
          {running && <ProgressBar pct={pct} />}
        </m.button>
      </m.div>
    </AnimatePresence>
  );
};

export default DemoMode;
