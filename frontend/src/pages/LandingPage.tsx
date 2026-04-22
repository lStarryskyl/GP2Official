import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Zap, Shield, BarChart3, Users, FileText,
  CheckCircle2, Star, Rocket, TrendingUp, Clock, Award, Cpu, Layers,
  GitBranch, MessageSquare, DollarSign, AlertTriangle,
  ClipboardList, Search, FlaskConical, Code2, LayoutDashboard, ChevronRight,
} from 'lucide-react';

// ─── Phase data ──────────────────────────────────────────────────────────────
const PHASES = [
  { id: 'planning',      label: 'Planning',        icon: ClipboardList,  color: '#1A6FD4', desc: 'Define goals, scope, and roadmap with AI-assisted project framing.' },
  { id: 'feasibility',   label: 'Feasibility',     icon: Search,         color: '#2d88e8', desc: 'Validate technical and business viability before committing resources.' },
  { id: 'requirements',  label: 'Requirements',    icon: FileText,       color: '#3d8fe0', desc: 'Generate detailed SRS with functional and non-functional requirements.' },
  { id: 'validation',    label: 'Validation',      icon: CheckCircle2,   color: '#1A6FD4', desc: 'Ensure requirements are complete, consistent, and stakeholder-approved.' },
  { id: 'design',        label: 'System Design',   icon: Layers,         color: '#2d88e8', desc: 'Architecture diagrams, data models, and API contracts auto-generated.' },
  { id: 'development',   label: 'Development',     icon: Code2,          color: '#F97316', desc: 'Sprint breakdowns, story points, and technical implementation guidance.' },
  { id: 'tasks',         label: 'Tasks',           icon: GitBranch,      color: '#fb9042', desc: 'Prioritized backlog with dependencies, owners, and acceptance criteria.' },
  { id: 'cost',          label: 'Cost & Benefit',  icon: DollarSign,     color: '#F97316', desc: 'Detailed budget forecasts with ROI projections and resource planning.' },
  { id: 'risks',         label: 'Risks',           icon: AlertTriangle,  color: '#fb9042', desc: 'Proactive risk identification with impact scores and mitigation plans.' },
  { id: 'testing',       label: 'Testing',         icon: FlaskConical,   color: '#2A9D8F', desc: 'Test strategy, coverage plans, and QA checklists generated automatically.' },
  { id: 'summary',       label: 'Summary',         icon: LayoutDashboard,color: '#F97316', desc: 'Executive dashboard with KPIs, timeline, and go/no-go decision support.' },
];

const NODE_W = 100;
const NODE_H = 56;
const GAP_X  = 32;
const ROW1_Y = 60;
const ROW2_Y = 188;
const ROW1_COUNT = 6;
const ROW2_COUNT = 5;

function nodeX(i: number): number {
  if (i < ROW1_COUNT) return 20 + i * (NODE_W + GAP_X);
  const j = i - ROW1_COUNT;
  return 20 + (ROW2_COUNT - 1 - j) * (NODE_W + GAP_X);
}
function nodeY(i: number): number {
  return i < ROW1_COUNT ? ROW1_Y : ROW2_Y;
}

const SVG_W = 20 + ROW1_COUNT * (NODE_W + GAP_X) - GAP_X + 20;
const SVG_H = ROW2_Y + NODE_H + 40;

// ─── SDLC Flowchart SVG ───────────────────────────────────────────────────────
interface SDLCFlowchartProps {
  visibleCount: number;
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

      {PHASES.map((phase, i) => {
        if (i >= visibleCount - 1) return null;

        if (i < ROW1_COUNT - 1) {
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

        if (i === ROW1_COUNT - 1) {
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

        if (i >= ROW1_COUNT && i < ROW1_COUNT + ROW2_COUNT - 1) {
          const x1 = nodeX(i);
          const x2 = nodeX(i + 1) + NODE_W;
          const y  = nodeY(i) + NODE_H / 2;
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

      {PHASES.map((phase, i) => {
        if (i >= visibleCount) return null;
        const x = nodeX(i);
        const y = nodeY(i);
        const isOrange = i >= 5;

        return (
          <g key={phase.id} style={{ animation: 'nodeAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <rect
              x={x} y={y} width={NODE_W} height={NODE_H} rx={10}
              fill={isOrange ? 'rgba(249,115,22,0.15)' : 'rgba(26,111,212,0.18)'}
              stroke={isOrange ? '#F97316' : '#1A6FD4'}
              strokeWidth="1.5"
              filter="url(#glow-node)"
            />
            <circle cx={x + 14} cy={y + 14} r={10}
              fill={isOrange ? '#F97316' : '#1A6FD4'}
              opacity={0.9}
            />
            <text x={x + 14} y={y + 18} textAnchor="middle"
              fill="#fff" fontSize="9" fontFamily="DM Sans, sans-serif" fontWeight="700">
              {i + 1}
            </text>
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

      <div style={{ position: 'relative', zIndex: 1, overflowX: 'auto', maxWidth: '100vw', padding: '0 16px' }}>
        <SDLCFlowchart visibleCount={visible} />
      </div>

      <p style={{
        marginTop: '16px', fontSize: '12px', color: 'rgba(136,153,170,0.7)',
        fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase',
        position: 'relative', zIndex: 1,
        opacity: visible > 0 ? 1 : 0, transition: 'opacity 0.4s',
      }}>
        {visible < PHASES.length ? `Building pipeline · phase ${visible} of ${PHASES.length}` : 'All 11 phases ready'}
      </p>

      {showStats && (
        <div style={{
          display: 'flex', gap: '32px', marginTop: '28px', position: 'relative', zIndex: 1,
          animation: 'nodeAppear 0.5s ease forwards', flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {SPLASH_STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', color: '#F97316' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

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

      {showCTA && (
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", position: 'relative', zIndex: 1, animation: 'nodeAppear 0.5s ease 0.2s forwards', opacity: 0 }}>
          No credit card required · Full SDLC automation · Export to PDF, Confluence & Jira
        </p>
      )}
    </div>
  );
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const HERO_STATS = [
  { value: '10x', label: 'Faster project planning', icon: TrendingUp },
  { value: '< 5 min', label: 'From idea to full SRS', icon: Clock },
  { value: '11', label: 'SDLC phases automated', icon: CheckCircle2 },
  { value: '100%', label: 'Coverage guaranteed', icon: Award },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <style>{`
        @media (max-width: 768px) {
          .lp-nav-links { display: none !important; }
          .lp-nav-auth { gap: 8px !important; }
          .lp-nav-auth .lp-signin { display: none !important; }
          .lp-mobile-menu { display: flex !important; }
          .lp-mobile-drawer { display: block !important; }
        }
        @media (min-width: 769px) {
          .lp-mobile-menu { display: none !important; }
          .lp-mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 clamp(16px, 4vw, 40px)', height: '64px',
        background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(26,111,212,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(26,111,212,0.4)' }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em' }}>Acorn</span>
        </div>

        {/* Desktop nav links */}
        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => navigate('/sdlc-guide')} style={{ padding: '8px 14px', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
          >
            SDLC Guide
          </button>
          <button onClick={() => scrollTo('features')} style={{ padding: '8px 14px', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
          >
            Features
          </button>
          <button onClick={() => scrollTo('how-it-works')} style={{ padding: '8px 14px', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
          >
            How It Works
          </button>
        </div>

        <div className="lp-nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="lp-signin" onClick={() => navigate('/login')}
            style={{ padding: '8px 18px', background: 'none', border: '1px solid rgba(26,111,212,0.35)', borderRadius: '8px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.7)'; e.currentTarget.style.color = '#E8EDF5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.35)'; e.currentTarget.style.color = '#8899AA'; }}
          >
            Sign In
          </button>
          <button onClick={() => navigate('/register')}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '8px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.35)'; }}
          >
            Get Started
          </button>
          {/* Mobile hamburger */}
          <button className="lp-mobile-menu" onClick={() => setMobileMenuOpen(o => !o)}
            style={{ padding: '8px', background: 'none', border: '1px solid rgba(26,111,212,0.3)', borderRadius: '8px', color: '#8899AA', cursor: 'pointer', display: 'none', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}
          >
            <span style={{ display: 'block', width: '16px', height: '2px', background: mobileMenuOpen ? '#E8EDF5' : '#8899AA', transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ display: 'block', width: '16px', height: '2px', background: mobileMenuOpen ? 'transparent' : '#8899AA', transition: 'all 0.2s' }} />
            <span style={{ display: 'block', width: '16px', height: '2px', background: mobileMenuOpen ? '#E8EDF5' : '#8899AA', transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className="lp-mobile-drawer" style={{
        display: 'none', position: 'sticky', top: '64px', zIndex: 99,
        background: 'rgba(13,27,42,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(26,111,212,0.15)',
        padding: mobileMenuOpen ? '16px clamp(16px, 4vw, 40px)' : '0 clamp(16px, 4vw, 40px)',
        maxHeight: mobileMenuOpen ? '300px' : '0',
        overflow: 'hidden', transition: 'max-height 0.3s ease, padding 0.3s ease',
      }}>
        {[
          { label: 'SDLC Guide', action: () => { navigate('/sdlc-guide'); setMobileMenuOpen(false); } },
          { label: 'Features', action: () => { scrollTo('features'); setMobileMenuOpen(false); } },
          { label: 'How It Works', action: () => { scrollTo('how-it-works'); setMobileMenuOpen(false); } },
          { label: 'Sign In', action: () => { navigate('/login'); setMobileMenuOpen(false); } },
        ].map(({ label, action }) => (
          <button key={label} onClick={action} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(26,111,212,0.1)', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '28px' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.3)', borderRadius: '999px' }}>
            <Sparkles size={14} color="#3d8fe0" />
            <span style={{ fontSize: '13px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.02em' }}>AI-Powered SDLC Platform</span>
          </div>

          {/* Headline */}
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 6vw, 68px)', lineHeight: 1.08, maxWidth: '820px', letterSpacing: '-0.03em', margin: '0 auto 20px' }}>
              Ship better software,{' '}
              <span style={{ background: 'linear-gradient(135deg, #1A6FD4 30%, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                10x faster.
              </span>
            </h1>
            <p style={{ color: '#8899AA', fontSize: 'clamp(15px, 2vw, 18px)', fontFamily: "'DM Sans', sans-serif", maxWidth: '580px', lineHeight: 1.75, margin: '0 auto' }}>
              Describe your project in plain language. Acorn generates a complete, production-ready SDLC plan — requirements, architecture, tasks, risk analysis, and cost estimates — in under five minutes.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={() => navigate('/register')}
              style={{ padding: '15px 36px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 28px rgba(249,115,22,0.4)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(249,115,22,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.4)'; }}
            >
              <Rocket size={18} /> Start Building Free
            </button>
            <button onClick={() => navigate('/sdlc-guide')}
              style={{ padding: '15px 28px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.35)', borderRadius: '12px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.18)'; e.currentTarget.style.borderColor = 'rgba(26,111,212,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.1)'; e.currentTarget.style.borderColor = 'rgba(26,111,212,0.35)'; }}
            >
              View SDLC Guide <ChevronRight size={16} />
            </button>
          </div>

          {/* Trust micro-copy */}
          <p style={{ fontSize: '12px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.03em' }}>
            No credit card required &nbsp;·&nbsp; Free to start &nbsp;·&nbsp; Export to PDF, Confluence &amp; Jira
          </p>

          {/* Flowchart showcase */}
          <div style={{ marginTop: '24px', padding: '28px 32px', ...card({ borderColor: 'rgba(26,111,212,0.25)' }), width: '100%', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                Complete SDLC Pipeline · 11 Phases
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1A6FD4' }} />
                  <span style={{ fontSize: '11px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif" }}>Planning phases</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#F97316' }} />
                  <span style={{ fontSize: '11px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif" }}>Execution phases</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SDLCFlowchart visibleCount={11} compact />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ borderTop: '1px solid rgba(26,111,212,0.12)', borderBottom: '1px solid rgba(26,111,212,0.12)', background: 'rgba(26,111,212,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px clamp(20px, 5vw, 40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px' }}>
          {HERO_STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(26,111,212,0.12)', border: '1px solid rgba(26,111,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="#3d8fe0" />
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', color: '#E8EDF5', letterSpacing: '-0.02em' }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '999px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#fb9042', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>How It Works</span>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            From idea to full plan in three steps.
          </h2>
          <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            No templates, no guesswork. Just describe your project and let Acorn handle the rest.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            {
              step: '01', icon: MessageSquare, title: 'Describe Your Project',
              desc: 'Write a brief description of what you want to build — a sentence or a full paragraph. No technical detail required.',
              color: '#1A6FD4', bg: 'rgba(26,111,212,0.12)',
            },
            {
              step: '02', icon: Cpu, title: 'AI Builds the Plan',
              desc: 'Our specialized AI agents generate SRS, user personas, system architecture, task breakdowns, cost estimates, and risk analysis.',
              color: '#F97316', bg: 'rgba(249,115,22,0.1)',
            },
            {
              step: '03', icon: Rocket, title: 'Refine, Export & Ship',
              desc: 'Chat with your AI advisor to refine any section, then export to PDF, Confluence, or Jira — ready for your team.',
              color: '#1A6FD4', bg: 'rgba(26,111,212,0.12)',
            },
          ].map(({ step, icon: Icon, title, desc, color, bg }, idx) => (
            <div key={step} style={{ padding: '32px 28px', ...card(), position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}50`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute', top: '16px', right: '20px', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '80px', color: 'rgba(255,255,255,0.025)', lineHeight: 1, userSelect: 'none' }}>{step}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: bg, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} color={color} />
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{idx + 1}</span>
                </div>
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', marginBottom: '12px', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PHASES GRID ── */}
      <section style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', background: 'rgba(10,31,61,0.35)', borderTop: '1px solid rgba(26,111,212,0.1)', borderBottom: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)', borderRadius: '999px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Every Phase, Covered</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              The complete SDLC, automated.
            </h2>
            <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              From initial planning to deployment summary — every phase powered by purpose-built AI agents working in concert.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const isOrange = i >= 5;
              return (
                <div key={phase.id} style={{
                  padding: '20px', ...card({ border: `1px solid ${isOrange ? 'rgba(249,115,22,0.2)' : 'rgba(26,111,212,0.18)'}` }),
                  display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = isOrange ? 'rgba(249,115,22,0.45)' : 'rgba(26,111,212,0.45)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = isOrange ? '0 8px 24px rgba(249,115,22,0.12)' : '0 8px 24px rgba(26,111,212,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isOrange ? 'rgba(249,115,22,0.2)' : 'rgba(26,111,212,0.18)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `rgba(${isOrange ? '249,115,22' : '26,111,212'},0.14)`, border: `1px solid rgba(${isOrange ? '249,115,22' : '26,111,212'},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={isOrange ? '#F97316' : '#1A6FD4'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: isOrange ? '#fb9042' : '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Phase {i + 1}</div>
                      <div style={{ fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#E8EDF5', lineHeight: 1.2 }}>{phase.label}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, margin: 0 }}>{phase.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)', borderRadius: '999px', marginBottom: '16px' }}>
            <Cpu size={12} color="#3d8fe0" />
            <span style={{ fontSize: '12px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Intelligent Agents</span>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            Specialized AI for every deliverable.
          </h2>
          <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            Purpose-built agents collaborate behind the scenes to deliver expert-level outputs across your entire project.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { icon: FileText,   title: 'SRS Generator',     desc: 'Full software requirements specification with functional and non-functional requirements, acceptance criteria, and edge cases.', color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)' },
            { icon: Users,      title: 'Persona Builder',   desc: 'AI-generated user personas with detailed pain points, goals, motivations, and user stories mapped to your product.', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
            { icon: Shield,     title: 'Risk Analyzer',     desc: 'Proactive identification of technical, business, and operational risks with severity scoring and mitigation strategies.', color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)' },
            { icon: BarChart3,  title: 'Cost Estimator',    desc: 'Detailed budget breakdowns with team composition, hourly rates, timeline projections, and ROI forecasting.', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
            { icon: GitBranch,  title: 'Task Planner',      desc: 'Sprint-ready backlog with story points, priorities, dependencies, and acceptance criteria — Jira-ready on day one.', color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)' },
            { icon: TrendingUp, title: 'AI Explainability',  desc: 'Confidence scores and transparent reasoning trails for every AI output so your team can validate and trust the results.', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} style={{ padding: '26px', ...card(), transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}55`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: bg, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '10px', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ color: '#8899AA', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', background: 'rgba(10,31,61,0.35)', borderTop: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Trusted by product teams.
            </h2>
            <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px' }}>
              See what engineering leaders and product managers are saying.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { quote: 'Acorn cut our pre-dev planning phase from 3 weeks to 2 days. The SRS output is genuinely production-quality.', name: 'Sarah M.', role: 'VP Engineering', stars: 5 },
              { quote: 'The AI personas feature alone is worth it. No more guessing who our users are — we have data-backed profiles from day one.', name: 'James K.', role: 'Product Manager', stars: 5 },
              { quote: 'Risk analysis caught three architectural issues we would have missed. Saved us from a very painful sprint 4.', name: 'Priya L.', role: 'Tech Lead', stars: 5 },
            ].map(({ quote, name, role, stars }) => (
              <div key={name} style={{ padding: '28px', ...card(), display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: stars }).map((_, i) => <Star key={i} size={14} color="#F97316" fill="#F97316" />)}
                </div>
                <p style={{ color: '#C8D5E5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, fontStyle: 'italic', flex: 1 }}>"{quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(26,111,212,0.12)', paddingTop: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{name[0]}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', color: '#E8EDF5' }}>{name}</div>
                    <div style={{ color: '#8899AA', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 40px)', textAlign: 'center', background: 'linear-gradient(180deg, transparent, rgba(26,111,212,0.07) 50%, transparent)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '999px', marginBottom: '28px' }}>
            <Award size={14} color="#F97316" />
            <span style={{ fontSize: '13px', color: '#fb9042', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Free to get started — no card required</span>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 5vw, 54px)', marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Ready to build smarter?
          </h2>
          <p style={{ color: '#8899AA', fontSize: '18px', fontFamily: "'DM Sans', sans-serif", marginBottom: '40px', lineHeight: 1.7 }}>
            Join thousands of product teams who plan, architect, and ship better software with Acorn.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ padding: '16px 48px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '14px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 36px rgba(249,115,22,0.45)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(249,115,22,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 36px rgba(249,115,22,0.45)'; }}
            >
              <Rocket size={20} /> Start Building Free
            </button>
            <button onClick={() => navigate('/login')}
              style={{ padding: '16px 32px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.35)', borderRadius: '14px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '17px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.1)'; }}
            >
              Sign In <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(26,111,212,0.15)', background: 'rgba(10,20,35,0.6)' }}>
        {/* Top footer */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px clamp(20px, 5vw, 40px) 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px' }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>Acorn</span>
            </div>
            <p style={{ color: '#4a6070', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, maxWidth: '200px' }}>
              AI-powered project intelligence for modern software teams.
            </p>
          </div>

          {/* Product links */}
          <div>
            <div style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Product</div>
            {[
              { label: 'Features', onClick: () => scrollTo('features') },
              { label: 'SDLC Guide', onClick: () => navigate('/sdlc-guide') },
              { label: 'How It Works', onClick: () => scrollTo('how-it-works') },
            ].map(({ label, onClick }) => (
              <button key={label} onClick={onClick} style={{ display: 'block', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', padding: '4px 0', marginBottom: '4px', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Resources */}
          <div>
            <div style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Resources</div>
            {[
              { label: 'Documentation', onClick: () => navigate('/sdlc-guide') },
              { label: 'SDLC Guide', onClick: () => navigate('/sdlc-guide') },
              { label: 'Get Started', onClick: () => navigate('/register') },
            ].map(({ label, onClick }) => (
              <button key={label} onClick={onClick} style={{ display: 'block', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', padding: '4px 0', marginBottom: '4px', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Account */}
          <div>
            <div style={{ fontSize: '11px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Account</div>
            {[
              { label: 'Sign In', onClick: () => navigate('/login') },
              { label: 'Create Account', onClick: () => navigate('/register') },
            ].map(({ label, onClick }) => (
              <button key={label} onClick={onClick} style={{ display: 'block', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', padding: '4px 0', marginBottom: '4px', transition: 'color 0.2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px clamp(20px, 5vw, 40px)', borderTop: '1px solid rgba(26,111,212,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: '#4a6070', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
            © 2025 Acorn · Project Intelligence Platform
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy', 'Terms', 'Security'].map(item => (
              <span key={item} style={{ color: '#4a6070', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
