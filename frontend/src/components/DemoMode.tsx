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
    height: 2, background: 'rgba(26,46,69,0.5)',
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
  const navigate  = useNavigate();
  const location  = useLocation();

  const [running,   setRunning]   = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [noProject, setNoProject] = useState(false);
  const [pct,       setPct]       = useState(0);
  const [collapsed, setCollapsed] = useState(true); // starts as small dot

  const runningRef    = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pctRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef      = useRef<DemoStep[]>([]);
  const idxRef        = useRef(0);
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
    navigatingRef.current = true;
    navigate(step.path);
    setTimeout(() => { navigatingRef.current = false; }, 300);
    startPct(step.dwell);
    timerRef.current = setTimeout(() => runStep(idx + 1), step.dwell);
  }, [navigate, startPct, stop]);

  const start = useCallback(() => {
    const projectId = localStorage.getItem(DEMO_PROJECT_KEY) ?? '';
    stepsRef.current = buildSteps(projectId);
    runningRef.current = true;
    setRunning(true);
    setCollapsed(false); // expand when running
    setNoProject(!projectId);
    runStep(0);
  }, [runStep]);

  const toggle = () => { if (running) stop(); else start(); };

  useEffect(() => {
    if (!running || navigatingRef.current) return;
    const expected = stepsRef.current[idxRef.current]?.path;
    if (expected && location.pathname !== expected) stop();
  }, [location.pathname, running, stop]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const currentStep = stepsRef.current[stepIdx];
  const totalSteps  = stepsRef.current.length;

  return (
    // TOP-LEFT — away from Athena (bottom-right) and AI panels (right side)
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.6, type: 'spring' as const, stiffness: 260, damping: 22 }}
      style={{ position: 'fixed', top: 20, left: 20, zIndex: 200 }}
    >
      {/* No-project tooltip */}
      <AnimatePresence>
        {noProject && running && (
          <m.div
            key="tip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{
              position: 'absolute', top: '110%', left: 0,
              background: 'rgba(10,21,37,0.97)',
              border: '1px solid rgba(249,115,22,0.35)',
              borderRadius: 10, padding: '10px 14px', width: 230,
              fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              color: '#8899AA', lineHeight: 1.6,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 1,
            }}
          >
            <span style={{ color: '#F97316', fontWeight: 600 }}>Tip: </span>
            Open any project first so the demo can walk all phase pages.
          </m.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Collapse/expand toggle — always visible small dot */}
        <m.button
          onClick={() => setCollapsed(c => !c)}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          title={collapsed ? 'Show Demo Mode' : 'Hide Demo Mode'}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: running
              ? 'linear-gradient(135deg, #F97316, #e85d04)'
              : 'rgba(26,46,69,0.85)',
            border: `1px solid ${running ? 'rgba(249,115,22,0.6)' : 'rgba(26,111,212,0.3)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: running ? '0 0 12px rgba(249,115,22,0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
            flexShrink: 0,
          }}
        >
          <m.span
            animate={running ? { opacity: [1, 0.3, 1], scale: [1, 1.3, 1] } : { opacity: 1, scale: 1 }}
            transition={running ? { repeat: Infinity, duration: 1.1, ease: 'easeInOut' } : {}}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: running ? '#fff' : '#1A6FD4',
              display: 'block',
            }}
          />
        </m.button>

        {/* Expandable pill */}
        <AnimatePresence>
          {!collapsed && (
            <m.div
              key="pill"
              initial={{ opacity: 0, width: 0, x: -10 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: -10 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{ overflow: 'hidden' }}
            >
              <m.button
                onClick={toggle}
                whileHover={{ y: -1, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 0.96 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px 7px 12px', borderRadius: 999,
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  background: 'rgba(5,13,26,0.92)',
                  border: `1px solid ${running ? 'rgba(249,115,22,0.45)' : 'rgba(26,111,212,0.28)'}`,
                  backdropFilter: 'blur(14px)',
                  boxShadow: running ? '0 4px 20px rgba(249,115,22,0.15)' : '0 4px 16px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                  willChange: 'transform',
                }}
              >
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.07em',
                  color: running ? '#F97316' : '#8899AA',
                  transition: 'color 0.3s',
                }}>
                  {running ? '■ Stop' : 'Demo Mode'}
                </span>

                <AnimatePresence mode="wait">
                  {running && currentStep && (
                    <m.span
                      key={currentStep.label}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18, ease: EASE }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        paddingLeft: 8, borderLeft: '1px solid rgba(26,46,69,0.7)',
                      }}
                    >
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                        fontWeight: 600, color: '#E8EDF5',
                      }}>
                        {currentStep.label}
                      </span>
                      <span style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 10,
                        color: '#4a6070',
                      }}>
                        {stepIdx + 1}/{totalSteps}
                      </span>
                    </m.span>
                  )}
                </AnimatePresence>

                {running && <ProgressBar pct={pct} />}
              </m.button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
};

export default DemoMode;
