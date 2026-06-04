import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AcornLogo } from '../components/AcornLogo';

const PIPELINE = [
  'Brief', 'Feasibility', 'Requirements', 'Validation',
  'Tech Stack', 'Architecture', 'Design', 'Planning',
  'Tasks', 'Costs', 'Risk', 'Testing', 'Deployment',
];

const STATUS_MESSAGES = [
  'Initialising workspace…',
  'Loading phase engine…',
  'Connecting AI agents…',
  'Preparing your canvas…',
  'Almost ready…',
];

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.4, y: 20 },
  visible: (i: number) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22, delay: 0.6 + i * 0.28 },
  }),
  exit: (i: number) => ({
    opacity: 0, y: -16,
    transition: { duration: 0.2, delay: i * 0.03, ease: easeOutExpo },
  }),
};

const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1, opacity: 0.4,
    transition: { duration: 0.5, delay: 0.6 + (i + 1) * 0.28 + 0.2, ease: easeOutExpo },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const wordmarkVariants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 220, damping: 20, delay: 0.1 },
  },
};

const containerVariants = {
  exit: {
    opacity: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

const NODE_W = 88;
const NODE_H = 34;
const GAP = 36;
const ROW_SIZE = 7;

interface PipelineRowProps {
  nodes: string[];
  startIndex: number;
  activeNode: number;
}

const PipelineRow: React.FC<PipelineRowProps> = ({ nodes, startIndex, activeNode }) => {
  const totalW = nodes.length * NODE_W + (nodes.length - 1) * GAP;
  const cy = NODE_H / 2;

  return (
    <div style={{ position: 'relative', width: totalW, height: NODE_H + 16 }}>
      <svg
        width={totalW}
        height={NODE_H + 16}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        {nodes.map((_, i) => {
          if (i === nodes.length - 1) return null;
          const x1 = i * (NODE_W + GAP) + NODE_W;
          const x2 = (i + 1) * (NODE_W + GAP);
          const y = cy + 8;
          return (
            <m.line
              key={i}
              x1={x1} y1={y} x2={x2} y2={y}
              stroke="#1A6FD4"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              custom={startIndex + i}
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />
          );
        })}
      </svg>

      {nodes.map((label, i) => {
        const absIdx = startIndex + i;
        const isActive = activeNode === absIdx;
        return (
          <m.div
            key={label}
            custom={absIdx}
            variants={nodeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'absolute',
              left: i * (NODE_W + GAP),
              top: 8,
              width: NODE_W,
              height: NODE_H,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'rgba(249,115,22,0.15)' : 'rgba(26,111,212,0.10)',
              border: `1px solid ${isActive ? 'rgba(249,115,22,0.55)' : 'rgba(26,111,212,0.22)'}`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: 600,
              color: isActive ? '#F97316' : '#3d8fe0',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap' as const,
              cursor: 'default',
            }}
          >
            <m.span
              animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={isActive ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {label}
            </m.span>
          </m.div>
        );
      })}
    </div>
  );
};

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [statusIdx, setStatusIdx] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const [activeNode, setActiveNode] = React.useState(0);

  useEffect(() => {
    const id = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length), 900);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActiveNode(i => (i + 1) % PIPELINE.length), 650);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const totalDuration = PIPELINE.length * 280 + 1600;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => navigate('/landing'), 450);
    }, totalDuration);
    return () => clearTimeout(t);
  }, [navigate]);

  const row1 = PIPELINE.slice(0, ROW_SIZE);
  const row2 = PIPELINE.slice(ROW_SIZE);

  return (
    <AnimatePresence>
      {!exiting && (
        <m.div
          key="splash"
          variants={containerVariants}
          initial={{ opacity: 1 }}
          exit="exit"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#050D1A',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 48, overflow: 'hidden',
          }}
        >
          {/* Grid background */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: [
              'linear-gradient(rgba(26,111,212,0.05) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(26,111,212,0.05) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '48px 48px',
          }} />
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: '18%', left: '12%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,111,212,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '18%', right: '12%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Wordmark */}
          <m.div
            variants={wordmarkVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
          >
            <AcornLogo height={44} white />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#4a6070', letterSpacing: '0.2em', textTransform: 'uppercase' as const }}>
              SDLC Intelligence Platform
            </div>
          </m.div>

          {/* Pipeline rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', maxWidth: '90vw', overflowX: 'hidden' }}>
            <PipelineRow nodes={row1} startIndex={0} activeNode={activeNode} />
            <PipelineRow nodes={row2} startIndex={ROW_SIZE} activeNode={activeNode} />
          </div>

          {/* Status text */}
          <div style={{ height: 22, position: 'relative' }}>
            <AnimatePresence mode="wait">
              <m.p
                key={statusIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: easeOutExpo }}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4a6070', letterSpacing: '0.1em' }}
              >
                {STATUS_MESSAGES[statusIdx]}
              </m.p>
            </AnimatePresence>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
