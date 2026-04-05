import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Zap, Shield, BarChart3, Users, FileText,
  CheckCircle2, Star, Rocket, TrendingUp, Clock, Award, Cpu, Layers,
  GitBranch, ChevronDown, MessageSquare, DollarSign, AlertTriangle,
  ClipboardList, Search, FlaskConical, Code2, LayoutDashboard,
} from 'lucide-react';

// ─── Phase data ──────────────────────────────────────────────────────────────
const PHASES = [
  { id: 'planning',      label: 'Planning',        icon: ClipboardList,  color: '#1A6FD4' },
  { id: 'feasibility',   label: 'Feasibility',     icon: Search,         color: '#2d88e8' },
  { id: 'requirements',  label: 'Requirements',    icon: FileText,       color: '#3d8fe0' },
  { id: 'validation',    label: 'Validation',      icon: CheckCircle2,   color: '#1A6FD4' },
  { id: 'design',        label: 'System Design',   icon: Layers,         color: '#2d88e8' },
  { id: 'development',   label: 'Development',     icon: Code2,          color: '#F97316' },
  { id: 'tasks',         label: 'Tasks',           icon: GitBranch,      color: '#fb9042' },
  { id: 'cost',          label: 'Cost & Benefit',  icon: DollarSign,     color: '#F97316' },
  { id: 'risks',         label: 'Risks',           icon: AlertTriangle,  color: '#fb9042' },
  { id: 'summary',       label: 'Summary',         icon: LayoutDashboard,color: '#F97316' },
];

// Row 1: indices 0-4 left→right  (y ≈ 80)
// Row 2: indices 5-9 right→left  (y ≈ 200)
const NODE_W = 108;
const NODE_H = 56;
const GAP_X  = 48;
const ROW1_Y = 60;
const ROW2_Y = 188;

function nodeX(i: number): number {
  if (i < 5) return 20 + i * (NODE_W + GAP_X);
  // bottom row reversed: index 5 = rightmost
  const j = i - 5; // 0..4
  return 20 + (4 - j) * (NODE_W + GAP_X);
}
function nodeY(i: number): number {
  return i < 5 ? ROW1_Y : ROW2_Y;
}

const SVG_W = 20 + 5 * (NODE_W + GAP_X) - GAP_X + 20; // 5 nodes
const SVG_H = ROW2_Y + NODE_H + 40;

// ─── SDLC Flowchart SVG ───────────────────────────────────────────────────────
interface SDLCFlowchartProps {
  visibleCount: number; // 0 = nothing, 10 = all
  compact?: boolean;
}

const SDLCFlowchart: React.FC<SDLCFlowchartProps> = ({ visibleCount, compact = false }) => {
  const scale = compact ? 0.72 : 1;

  return (
    <svg
      width={SVG_W * scale}
      height={SVG_H * scale}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <filter id="glow-node">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-line">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#1A6FD4" />
        </marker>
        <marker id="arrow-orange" markerWidth="8" markerHeight="8" refX="1" refY="3" orient="auto">
          <path d="M8,0 L8,6 L0,3 z" fill="#F97316" />
        </marker>
        <marker id="arrow-down" markerWidth="8" markerHeight="8" refX="3" refY="7" orient="auto">
          <path d="M0,0 L6,0 L3,8 z" fill="#F97316" />
        </marker>
      </defs>

      {/* ── Connector lines ── */}
      {PHASES.map((phase, i) => {
        if (i >= visibleCount - 1) return null;

        // Row 1 horizontal connectors (0→1, 1→2, 2→3, 3→4)
        if (i < 4) {
          const x1 = nodeX(i) + NODE_W;
          const y  = nodeY(i) + NODE_H / 2;
          const x2 = nodeX(i + 1);
          return (
            <line key={`conn-${i}`}
              x1={x1} y1={y} x2={x2 - 2} y2={y}
              stroke="#1A6FD4" strokeWidth="2"
              markerEnd="url(#arrow-blue)"
              filter="url(#glow-line)"
              style={{ animation: `fadeIn 0.3s ease forwards` }}
            />
          );
        }

        // U-turn connector: row1 node 4 → row2 node 5
        if (i === 4) {
          const x  = nodeX(4) + NODE_W / 2;
          const y1 = nodeY(4) + NODE_H;
          const y2 = nodeY(5);
          return (
            <line key="conn-uturn"
              x1={x} y1={y1} x2={x} y2={y2 - 2}
              stroke="#F97316" strokeWidth="2"
              markerEnd="url(#arrow-down)"
              filter="url(#glow-line)"
              style={{ animation: 'fadeIn 0.3s ease forwards' }}
            />
          );
        }

        // Row 2 horizontal connectors (5→6, 6→7, 7→8, 8→9)
        // nodeX(5) is rightmost, nodeX(9) is leftmost — so connect right-edge of next to left-edge of current
        if (i >= 5 && i < 9) {
          const x1 = nodeX(i);              // left edge of current (further left = higher index)
          const x2 = nodeX(i + 1) + NODE_W; // right edge of next node (further right)
          const y  = nodeY(i) + NODE_H / 2;
          // Draw from right (x2) to left (x1), arrow points left
          return (
            <line key={`conn-${i}`}
              x1={x2} y1={y} x2={x1 + 2} y2={y}
              stroke="#F97316" strokeWidth="2"
              markerEnd="url(#arrow-orange)"
              filter="url(#glow-line)"
              style={{ animation: 'fadeIn 0.3s ease forwards' }}
            />
          );
        }

        return null;
      })}

      {/* ── Phase nodes ── */}
      {PHASES.map((phase, i) => {
        if (i >= visibleCount) return null;
        const x = nodeX(i);
        const y = nodeY(i);
        const Icon = phase.icon;
        const isOrange = i >= 5;

        return (
          <g key={phase.id} style={{ animation: 'nodeAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            {/* Node background */}
            <rect
              x={x} y={y} width={NODE_W} height={NODE_H} rx={10}
              fill={isOrange ? 'rgba(249,115,22,0.15)' : 'rgba(26,111,212,0.18)'}
              stroke={isOrange ? '#F97316' : '#1A6FD4'}
              strokeWidth="1.5"
              filter="url(#glow-node)"
            />

            {/* Step badge */}
            <circle cx={x + 14} cy={y + 14} r={10}
              fill={isOrange ? '#F97316' : '#1A6FD4'}
              opacity={0.9}
            />
            <text x={x + 14} y={y + 18} textAnchor="middle"
              fill="#fff" fontSize="9" fontFamily="DM Sans, sans-serif" fontWeight="700">
              {i + 1}
            </text>

            {/* Label */}
            <text x={x + NODE_W / 2} y={y + NODE_H / 2 + 5}
              textAnchor="middle"
              fill="#E8EDF5" fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="600">
              {phase.label}
            </text>
          </g>
        );
      })}

      <style>{`
        @keyframes nodeAppear {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </svg>
  );
};

// ─── Splash Screen ───────────────────────────────────────────────────────────
interface SplashProps { onEnter: () => void; onViewDocs: () => void; }

const SPLASH_STATS = [
  { value: '10x', label: 'Faster planning' },
  { value: '100%', label: 'SDLC coverage' },
  { value: '< 5 min', label: 'From idea to SRS' },
];

const SplashScreen: React.FC<SplashProps> = ({ onEnter, onViewDocs }) => {
  const [visible, setVisible] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (visible < PHASES.length) {
      const t = setTimeout(() => setVisible(v => v + 1), 280);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setShowCTA(true); setShowStats(true); }, 350);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0a1f3d 0%, #0D1B2A 55%, #0d1520 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div className="bg-grid" style={{ position: 'absolute', inset: 0, opacity: 0.25 }} />
      <div className="glow-orb glow-orb-forest" style={{ width: '700px', height: '700px', top: '-25%', left: '-20%', opacity: 0.35 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%)' }} />

      {/* Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '13px',
          background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(26,111,212,0.55)',
        }}>
          <Zap size={24} color="#fff" />
        </div>
        <div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '30px', color: '#E8EDF5', letterSpacing: '-0.03em', display: 'block', lineHeight: 1 }}>Acorn</span>
          <span style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Project Intelligence Platform</span>
        </div>
      </div>

      {/* Headline */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1, padding: '0 24px' }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: 'clamp(24px, 4vw, 42px)', color: '#E8EDF5',
          lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '12px',
        }}>
          Your entire SDLC,<br />
          <span style={{ background: 'linear-gradient(135deg, #1A6FD4, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            generated in minutes.
          </span>
        </h1>
        <p style={{ color: '#8899AA', fontSize: '15px', fontFamily: "'DM Sans', sans-serif", maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          Describe any software project. Acorn builds every phase — requirements, architecture, tasks, costs, and risk analysis — automatically.
        </p>
      </div>

      {/* Flowchart */}
      <div style={{ position: 'relative', zIndex: 1, overflowX: 'auto', maxWidth: '100vw', padding: '0 16px' }}>
        <SDLCFlowchart visibleCount={visible} />
      </div>

      {/* Progress label */}
      <p style={{
        marginTop: '16px', fontSize: '12px', color: 'rgba(136,153,170,0.7)',
        fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase',
        position: 'relative', zIndex: 1,
        opacity: visible > 0 ? 1 : 0, transition: 'opacity 0.4s',
      }}>
        {visible < PHASES.length ? `Building pipeline · phase ${visible} of ${PHASES.length}` : 'All 10 phases ready'}
      </p>

      {/* Stats row */}
      {showStats && (
        <div style={{
          display: 'flex', gap: '32px', marginTop: '28px', position: 'relative', zIndex: 1,
          animation: 'nodeAppear 0.5s ease forwards',
        }}>
          {SPLASH_STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: '#F97316' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {showCTA && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px', position: 'relative', zIndex: 1, animation: 'nodeAppear 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onEnter}
            style={{
              padding: '14px 36px',
              background: 'linear-gradient(135deg, #F97316, #cc4900)',
              border: 'none', borderRadius: '12px', cursor: 'pointer',
              color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 4px 28px rgba(249,115,22,0.45)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(249,115,22,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.45)'; }}
          >
            <ArrowRight size={18} /> Start Building Free
          </button>
          <button
            onClick={onViewDocs}
            style={{
              padding: '14px 28px',
              background: 'rgba(26,111,212,0.12)',
              border: '1px solid rgba(26,111,212,0.4)', borderRadius: '12px', cursor: 'pointer',
              color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              fontSize: '15px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,111,212,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,111,212,0.12)'; }}
          >
            View SDLC Guide
          </button>
        </div>
      )}

      {/* Bottom tagline */}
      {showCTA && (
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", position: 'relative', zIndex: 1, animation: 'nodeAppear 0.5s ease 0.2s forwards', opacity: 0 }}>
          No credit card required · Full SDLC automation · Export to PDF, Confluence & Jira
        </p>
      )}
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} onViewDocs={() => navigate('/sdlc-guide')} />;
  }

  const card = (style?: React.CSSProperties): React.CSSProperties => ({
    background: 'rgba(26,46,69,0.6)',
    border: '1px solid rgba(26,111,212,0.2)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
    ...style,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0D1B2A', color: '#E8EDF5' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: '64px',
        background: 'rgba(13,27,42,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(26,111,212,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(26,111,212,0.4)' }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px' }}>Acorn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/sdlc-guide')} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer' }}>SDLC Guide</button>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', background: 'none', border: '1px solid rgba(26,111,212,0.4)', borderRadius: '8px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '8px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '80px 40px 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(26,111,212,0.12)', border: '1px solid rgba(26,111,212,0.35)', borderRadius: '999px' }}>
            <Sparkles size={14} color="#1A6FD4" />
            <span style={{ fontSize: '13px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>AI-Powered Platform</span>
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 6vw, 68px)', lineHeight: 1.1, maxWidth: '800px' }}>
            AI-Powered<br />
            <span style={{ background: 'linear-gradient(135deg, #1A6FD4, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Project Planning
            </span>
          </h1>

          <p style={{ color: '#8899AA', fontSize: '18px', fontFamily: "'DM Sans', sans-serif", maxWidth: '600px', lineHeight: 1.7 }}>
            Describe your project — Acorn generates a complete SDLC plan with requirements, SRS, designs, tasks, risk analysis, and cost estimates in minutes.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/register')}
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 24px rgba(249,115,22,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <ArrowRight size={18} /> Start Building Free
            </button>
            <button onClick={() => navigate('/sdlc-guide')} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer' }}>SDLC Guide</button>
          <button onClick={() => navigate('/login')}
              style={{ padding: '14px 32px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.4)', borderRadius: '10px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>
              Sign In
            </button>
          </div>

          {/* Flowchart preview — all phases visible */}
          <div style={{ marginTop: '48px', padding: '32px', ...card(), overflowX: 'auto', width: '100%' }}>
            <p style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px', textAlign: 'left' }}>
              Complete SDLC Pipeline · 10 Phases
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SDLCFlowchart visibleCount={10} compact />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', textAlign: 'center', marginBottom: '12px' }}>
          How It Works
        </h2>
        <p style={{ color: '#8899AA', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', marginBottom: '48px' }}>
          Three steps from idea to a complete project plan.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', icon: MessageSquare, title: 'Describe Your Project', desc: 'Write a brief description of what you want to build — a sentence or a paragraph.', color: '#1A6FD4' },
            { step: '02', icon: Cpu,           title: 'AI Generates the Plan', desc: 'Our AI creates SRS, personas, architecture, tasks, cost estimates, and risk analysis.', color: '#F97316' },
            { step: '03', icon: Rocket,        title: 'Refine & Export',        desc: 'Edit any section, chat with your AI advisor, and export to PDF, Confluence, or Jira.', color: '#1A6FD4' },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} style={{ padding: '28px', ...card(), position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-12px', right: '-8px', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '72px', color: 'rgba(255,255,255,0.03)', lineHeight: 1 }}>{step}</div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `rgba(${color === '#1A6FD4' ? '26,111,212' : '249,115,22'},0.15)`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', marginBottom: '10px' }}>{title}</h3>
              <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PHASES GRID ── */}
      <section style={{ padding: '80px 40px', background: 'rgba(26,111,212,0.04)', borderTop: '1px solid rgba(26,111,212,0.1)', borderBottom: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', textAlign: 'center', marginBottom: '12px' }}>
            Every Phase, Covered
          </h2>
          <p style={{ color: '#8899AA', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', marginBottom: '48px' }}>
            From initial planning to deployment — all 10 SDLC phases automated.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const isOrange = i >= 5;
              return (
                <div key={phase.id} style={{ padding: '20px', ...card({ border: `1px solid ${isOrange ? 'rgba(249,115,22,0.2)' : 'rgba(26,111,212,0.2)'}` }), display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `rgba(${isOrange ? '249,115,22' : '26,111,212'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={isOrange ? '#F97316' : '#1A6FD4'} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: isOrange ? '#F97316' : '#1A6FD4', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, marginBottom: '2px' }}>Phase {i + 1}</div>
                    <div style={{ fontSize: '13px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: '#E8EDF5' }}>{phase.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES ── */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', textAlign: 'center', marginBottom: '12px' }}>
          Intelligent AI Agents
        </h2>
        <p style={{ color: '#8899AA', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', marginBottom: '48px' }}>
          Specialized agents work together to deliver comprehensive project intelligence.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { icon: FileText,    title: 'SRS Generator',       desc: 'Full software requirements specification with functional + non-functional reqs.', color: '#1A6FD4' },
            { icon: Users,       title: 'Persona Builder',      desc: 'AI-generated user personas with pain points, goals, and user stories.', color: '#F97316' },
            { icon: Shield,      title: 'Risk Analyzer',        desc: 'Proactively identifies project risks with mitigation strategies.', color: '#1A6FD4' },
            { icon: BarChart3,   title: 'Cost Estimator',       desc: 'Detailed budget breakdowns with ROI forecasting and resource planning.', color: '#F97316' },
            { icon: GitBranch,   title: 'Task Planner',         desc: 'Sprint-ready task breakdown with priorities, estimates, and dependencies.', color: '#1A6FD4' },
            { icon: TrendingUp,  title: 'AI Explainability',    desc: 'Confidence scores and reasoning trails for every AI-generated output.', color: '#F97316' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{ padding: '24px', ...card(), transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}60`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <Icon size={24} color={color} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{title}</h3>
              <p style={{ color: '#8899AA', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '80px 40px', background: 'rgba(26,111,212,0.04)', borderTop: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', textAlign: 'center', marginBottom: '48px' }}>
            Trusted by Product Teams
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { quote: 'Acorn cut our pre-dev planning phase from 3 weeks to 2 days. The SRS output is genuinely production-quality.', name: 'Sarah M.', role: 'VP Engineering', stars: 5 },
              { quote: 'The AI personas feature alone is worth it. No more guessing who our users are — we have data-backed profiles from day one.', name: 'James K.', role: 'Product Manager', stars: 5 },
              { quote: 'Risk analysis caught three architectural issues we would have missed. Saved us from a very painful sprint 4.', name: 'Priya L.', role: 'Tech Lead', stars: 5 },
            ].map(({ quote, name, role, stars }) => (
              <div key={name} style={{ padding: '24px', ...card() }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} size={14} color="#F97316" fill="#F97316" />)}
                </div>
                <p style={{ color: '#C8D5E5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>"{quote}"</p>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px' }}>{name}</div>
                  <div style={{ color: '#8899AA', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 40px', textAlign: 'center', background: 'linear-gradient(180deg, transparent, rgba(26,111,212,0.08))' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '999px', marginBottom: '24px' }}>
          <Award size={14} color="#F97316" />
          <span style={{ fontSize: '13px', color: '#fb9042', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Free to get started</span>
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 5vw, 52px)', marginBottom: '16px', lineHeight: 1.1 }}>
          Ready to build smarter?
        </h2>
        <p style={{ color: '#8899AA', fontSize: '18px', fontFamily: "'DM Sans', sans-serif", marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
          Join thousands of product teams shipping better software faster.
        </p>
        <button onClick={() => navigate('/register')}
          style={{ padding: '16px 48px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 32px rgba(249,115,22,0.45)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(249,115,22,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(249,115,22,0.45)'; }}
        >
          <Rocket size={20} /> Start Building Free
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '32px 40px', borderTop: '1px solid rgba(26,111,212,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px' }}>Acorn</span>
        </div>
        <p style={{ color: '#4a6070', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
          © 2025 Acorn · AI-Powered Project Planning · Project Intelligence Platform
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
