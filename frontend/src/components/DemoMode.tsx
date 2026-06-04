import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { phaseConfigs } from '@/constants/phases';

export const DEMO_PROJECT_KEY = 'acorn_demo_project_id';

interface DemoStep {
  path: string;
  label: string;
  dwell: number;
}

function buildSteps(projectId: string): DemoStep[] {
  const pub: DemoStep[] = [
    { path: '/landing',  label: 'Landing',  dwell: 5000 },
    { path: '/login',    label: 'Sign In',  dwell: 4000 },
    { path: '/register', label: 'Register', dwell: 4000 },
  ];

  if (!projectId) return pub;

  return [
    ...pub,
    { path: '/projects',              label: 'Dashboard', dwell: 5000 },
    { path: `/projects/${projectId}`, label: 'Project',   dwell: 5000 },
    ...phaseConfigs.map(p => ({
      path:  `/projects/${projectId}/phases/${p.id}`,
      label: p.title,
      dwell: 9000,
    })),
    { path: `/projects/${projectId}/summary`,        label: 'Summary',   dwell: 8000 },
    { path: `/projects/${projectId}/diagram-studio`, label: 'Diagrams',  dwell: 7000 },
    { path: `/projects/${projectId}/export`,         label: 'Export',    dwell: 5000 },
    { path: `/projects/${projectId}/analytics`,      label: 'Analytics', dwell: 5000 },
  ];
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, background: 'rgba(26,46,69,0.6)',
    borderRadius: '0 0 999px 999px', overflow: 'hidden',
  }}>
    <m.div
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.25, ease: EASE }}
      style={{ height: '100%', background: '#F97316', borderRadius: 'inherit' }}
    />
  </div>
);

export const DemoMode: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [running,   setRunning]   = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [noProject, setNoProject] = useState(false);
  const [pct,       setPct]       = useState(0);

  const runningRef    = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pctRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef      = useRef<DemoStep[]>([]);
  const idxRef        = useRef(0);
  // While we are actively navigating to the next step we suppress the
  // "user navigated away" guard for a short window.
  const navigatingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current);  timerRef.current = null; }
    if (pctRef.current)   { clearInterval(pctRef.current);   pctRef.current   = null; }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setStepIdx(0);
    setPct(0);
    setNoProject(false);
    clearTimers();
  }, [clearTimers]);

  const startPct = useCallback((dwell: number) => {
    setPct(0);
    if (pctRef.current) clearInterval(pctRef.current);
    const tick = 80;
    let elapsed = 0;
    pctRef.current = setInterval(() => {
      elapsed += tick;
      setPct(Math.min((elapsed / dwell) * 100, 99));
      if (elapsed >= dwell && pctRef.current) clearInterval(pctRef.current);
    }, tick);
  }, []);

  const runStep = useCallback((idx: number) => {
    if (!runningRef.current) return;
    const steps = stepsRef.current;
    if (idx >= steps.length) { stop(); return; }

    const step = steps[idx];
    idxRef.current = idx;
    setStepIdx(idx);

    // Mark that WE are the ones navigating so the guard ignores this change
    navigatingRef.current = true;
    navigate(step.path);
    // Give React Router a tick to settle before re-enabling the guard
    setTimeout(() => { navigatingRef.current = false; }, 300);

    startPct(step.dwell);
    timerRef.current = setTimeout(() => runStep(idx + 1), step.dwell);
  }, [navigate, startPct, stop]);

  const start = useCallback(() => {
    const projectId = localStorage.getItem(DEMO_PROJECT_KEY) ?? '';
    stepsRef.current = buildSteps(projectId);
    runningRef.current = true;
    setRunning(true);
    setNoProject(!projectId);
    runStep(0);
  }, [runStep]);

  const toggle = () => { if (running) stop(); else start(); };

  // Stop only when the USER navigates away (not when we do it)
  useEffect(() => {
    if (!running || navigatingRef.current) return;
    const expected = stepsRef.current[idxRef.current]?.path;
    if (expected && location.pathname !== expected) stop();
  }, [location.pathname, running, stop]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const currentStep = stepsRef.current[stepIdx];
  const totalSteps  = stepsRef.current.length;

  return (
    <AnimatePresence>
      <m.div
        key="demo-pill"
        initial={{ opacity: 0, y: 24, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.4, type: 'spring' as const, stiffness: 260, damping: 22 }}
        style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9000 }}
      >
        {/* No-project tooltip */}
        <AnimatePresence>
          {noProject && running && (
            <m.div
              key="tip"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: EASE }}
              style={{
                position: 'absolute', bottom: '110%', right: 0,
                background: 'rgba(10,21,37,0.97)',
                border: '1px solid rgba(249,115,22,0.35)',
                borderRadius: 10, padding: '10px 14px', width: 224,
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                color: '#8899AA', lineHeight: 1.6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ color: '#F97316', fontWeight: 600 }}>Tip: </span>
              Open any project first so the demo can walk all phase pages.
              <div style={{
                position: 'absolute', bottom: -6, right: 18,
                width: 10, height: 10,
                background: 'rgba(10,21,37,0.97)',
                borderRight: '1px solid rgba(249,115,22,0.35)',
                borderBottom: '1px solid rgba(249,115,22,0.35)',
                transform: 'rotate(45deg)',
              }} />
            </m.div>
          )}
        </AnimatePresence>

        {/* Pill button */}
        <m.button
          onClick={toggle}
          whileHover={{ y: -2, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 18px 9px 14px', borderRadius: 999,
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(5,13,26,0.97), rgba(13,27,42,0.93))',
            border: `1px solid ${running ? 'rgba(249,115,22,0.5)' : 'rgba(26,111,212,0.3)'}`,
            backdropFilter: 'blur(14px)',
            boxShadow: running
              ? '0 4px 24px rgba(249,115,22,0.2)'
              : '0 4px 20px rgba(0,0,0,0.35)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            willChange: 'transform',
          }}
        >
          {/* Dot */}
          <m.span
            animate={running
              ? { opacity: [1, 0.25, 1], scale: [1, 1.4, 1] }
              : { opacity: 1, scale: 1 }}
            transition={running ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' } : {}}
            style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: running ? '#F97316' : '#1A6FD4',
              boxShadow: running ? '0 0 6px rgba(249,115,22,0.7)' : 'none',
            }}
          />

          {/* Label */}
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600,
            letterSpacing: '0.07em', whiteSpace: 'nowrap',
            color: running ? '#F97316' : '#8899AA',
            transition: 'color 0.3s',
          }}>
            {running ? '■ Stop' : 'Demo Mode'}
          </span>

          {/* Step info */}
          <AnimatePresence mode="wait">
            {running && currentStep && (
              <m.span
                key={currentStep.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: EASE }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  paddingLeft: 8, borderLeft: '1px solid rgba(26,46,69,0.7)',
                }}
              >
                <span style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 600, color: '#E8EDF5', whiteSpace: 'nowrap',
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

          {running && <ProgressBar pct={pct} />}
        </m.button>
      </m.div>
    </AnimatePresence>
  );
};

export default DemoMode;
