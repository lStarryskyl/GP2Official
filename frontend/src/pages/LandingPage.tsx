import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Shield, BarChart3, Users, FileText,
  CheckCircle2, Star, Rocket, TrendingUp, Clock, Award, Cpu, Layers,
  GitBranch, MessageSquare, DollarSign, AlertTriangle,
  ClipboardList, Search, FlaskConical, Code2, LayoutDashboard, ChevronRight,
} from 'lucide-react';
import { AcornLogo } from '../components/AcornLogo';
import OnboardingScreen from '../components/OnboardingScreen';

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

// ─── Responsive helper ───────────────────────────────────────────────────────
function useIsMobile(breakpoint: number = 600): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// ─── Splash Screen ───────────────────────────────────────────────────────────
interface SplashProps { onEnter: () => void; onViewDocs: () => void; onComplete?: () => void; onSkip?: () => void; }

const SPLASH_STATS = [
  { value: '10x', label: 'Faster planning' },
  { value: '100%', label: 'SDLC coverage' },
  { value: '< 5 min', label: 'From idea to SRS' },
];


function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function useReveal<T extends HTMLElement>(threshold = 0.15): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown];
}

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  className?: string;
  y?: number;
}
const Reveal: React.FC<RevealProps> = ({ children, delay = 0, as = 'div', style, className, y = 24 }) => {
  const reduced = usePrefersReducedMotion();
  const [ref, shown] = useReveal<HTMLElement>();
  const Tag = as as React.ElementType;
  if (reduced) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

const WaveReveal: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties; delay?: number }> = ({ children, className, style, delay = 0 }) => {
  const reduced = usePrefersReducedMotion();
  const [ref, shown] = useReveal<HTMLDivElement>(0.1);
  if (reduced) {
    return (
      <div className={`${className || ''} wave-revealed`} style={style}>
        {children}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={`${className || ''} ${shown ? 'wave-revealed' : ''}`}
      style={delay > 0 ? { ...style, '--wave-delay': `${delay}ms` } as React.CSSProperties : style}
    >
      {children}
    </div>
  );
};

const HeadingReveal: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const reduced = usePrefersReducedMotion();
  const [ref, shown] = useReveal<HTMLDivElement>(0.1);
  if (reduced) {
    return (
      <div className="heading-reveal heading-revealed" style={style}>
        {children}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={`heading-reveal ${shown ? 'heading-revealed' : ''}`}
      style={style}
    >
      {children}
    </div>
  );
};

interface TiltProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  max?: number;
  scale?: number;
  glow?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}
const Tilt: React.FC<TiltProps> = ({ children, className, style, max = 8, scale = 1.02, glow, onMouseEnter, onMouseLeave }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * (max * 2);
    const ry = (px - 0.5) * (max * 2);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
  }, [max, scale, reduced]);

  const handleLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el) el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
    onMouseLeave?.(e);
  }, [onMouseLeave]);

  return (
    <div
      ref={ref}
      className={`tilt-card ${className || ''}`}
      style={{
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s, box-shadow 0.3s',
        transformStyle: 'preserve-3d',
        position: 'relative',
        '--glow-color': glow || 'rgba(26,111,212,0.18)',
        ...style,
      } as React.CSSProperties & Record<string, string>}
      onMouseMove={handleMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
};

interface PipelineProps { compact?: boolean; }
const SDLCPipeline: React.FC<PipelineProps> = ({ compact = false }) => {
  const isMobile = useIsMobile(720);
  const reduced = usePrefersReducedMotion();
  const cols = isMobile ? 2 : (compact ? 6 : 6);
  const cellGap = isMobile ? 10 : 14;

  return (
    <div className="sdlc-pipeline" style={{ width: '100%', position: 'relative' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: `${cellGap}px`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          const isOrange = i >= 5;
          const accent = isOrange ? '#F97316' : '#1A6FD4';
          const accent2 = isOrange ? '#fb9042' : '#3d8fe0';
          return (
            <div
              key={phase.id}
              className="sdlc-pipe-node"
              style={{
                position: 'relative',
                padding: isMobile ? '12px 10px' : '14px 12px',
                borderRadius: '14px',
                background: `linear-gradient(155deg, rgba(${isOrange ? '249,115,22' : '26,111,212'},0.10), rgba(13,27,42,0.6))`,
                border: `1px solid rgba(${isOrange ? '249,115,22' : '26,111,212'},0.32)`,
                boxShadow: `0 4px 18px rgba(${isOrange ? '249,115,22' : '26,111,212'},0.10)`,
                display: 'flex', flexDirection: 'column', gap: '8px',
                animation: reduced ? 'none' : `sdlcNodeIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.04 * i}s both`,
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(140px circle at var(--mx, 50%) var(--my, 50%), rgba(${isOrange ? '249,115,22' : '61,143,224'},0.20), transparent 70%)`,
                  opacity: 0, transition: 'opacity 0.25s', pointerEvents: 'none',
                }}
                className="sdlc-pipe-glow"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: `linear-gradient(135deg, ${accent}, ${accent2})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 12px ${accent}55`,
                  flexShrink: 0,
                }}>
                  <Icon size={14} color="#fff" strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '9px', color: accent2,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '12px' : '13px',
                    fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#E8EDF5',
                    letterSpacing: '-0.01em', lineHeight: 1.15, marginTop: '3px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {phase.label}
                  </div>
                </div>
              </div>
              <div style={{
                height: '3px', borderRadius: '999px', position: 'relative', overflow: 'hidden',
                background: `rgba(${isOrange ? '249,115,22' : '26,111,212'},0.18)`,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  width: '50%',
                  animation: reduced ? 'none' : `sdlcShimmer 2.2s ease-in-out ${0.1 * i}s infinite`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes sdlcNodeIn {
          from { opacity: 0; transform: translateY(14px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sdlcShimmer {
          0%   { transform: translateX(-110%); }
          60%  { transform: translateX(220%); }
          100% { transform: translateX(220%); }
        }
        .sdlc-pipe-node:hover .sdlc-pipe-glow { opacity: 1 !important; }
        .sdlc-pipe-node {
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .sdlc-pipe-node:hover {
          transform: translateY(-3px);
        }
      `}</style>
    </div>
  );
};

const SPLASH_PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.3;
  const dist = 38 + (i * 7) % 28;
  return {
    id: i,
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    size: 2 + (i % 4),
    delay: 0.05 + (i % 10) * 0.04,
    color: i % 3 === 0 ? '#F97316' : i % 3 === 1 ? '#1A6FD4' : '#3d8fe0',
  };
});

const SplashScreen: React.FC<SplashProps> = ({ onEnter, onViewDocs, onComplete, onSkip }) => {
  const isMobile = useIsMobile(600);
  const reducedMotion = usePrefersReducedMotion();
  const [skipped, setSkipped] = useState(false);

  // Never auto-dismiss for reduced-motion — user must click Enter or Skip.
  // (Previously 200ms auto-complete was making the splash disappear instantly.)

  const skip = () => {
    setSkipped(true);
    onComplete?.();
    onSkip?.();
  };

  const stageClass = `splash-stage${skipped ? ' is-instant' : ''}`;

  const logoSize = isMobile ? 96 : 128;
  const haloSize = isMobile ? 240 : 360;
  const orbitSize = isMobile ? 320 : 520;
  const orbitRadius = orbitSize / 2 - (isMobile ? 22 : 28);

  return (
    <div
      role="dialog"
      aria-label="Acorn intro"
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 40%, #14315e 0%, #0a1a30 45%, #05080f 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: isMobile ? '24px 16px' : '32px',
        textAlign: 'center',
      }}
    >
      <div className="splash-stars" aria-hidden />
      <div className="splash-aurora splash-aurora-blue" aria-hidden />
      <div className="splash-aurora splash-aurora-orange" aria-hidden />

      <button
        onClick={skip}
        aria-label="Skip intro"
        style={{
          position: 'absolute',
          top: isMobile ? '14px' : '22px',
          right: isMobile ? '14px' : '24px',
          padding: '8px 16px',
          background: 'rgba(232,237,245,0.06)',
          border: '1px solid rgba(232,237,245,0.18)',
          borderRadius: '999px',
          color: '#cdd5e0',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: '12px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          zIndex: 5,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,237,245,0.14)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,237,245,0.06)'; e.currentTarget.style.color = '#cdd5e0'; }}
      >
        Skip →
      </button>

      <div
        className={stageClass}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '760px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        <div
          className="splash-logo-wrap"
          style={{ position: 'relative', width: orbitSize, height: orbitSize, marginBottom: isMobile ? '4px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="splash-halo" style={{ width: haloSize, height: haloSize }} aria-hidden />
          <div className="splash-ring splash-ring-1" style={{ width: haloSize, height: haloSize }} aria-hidden />
          <div className="splash-ring splash-ring-2" style={{ width: haloSize, height: haloSize }} aria-hidden />
          <div className="splash-ring splash-ring-3" style={{ width: haloSize, height: haloSize }} aria-hidden />

          {/* ── Inner orbit ring: 3 nodes, 6s/rev ── */}
          {!skipped && (() => {
            const innerR = isMobile ? 62 : 92;
            const innerNodes = [
              { color: '#3d8fe0', delay: 0 },
              { color: '#F97316', delay: 2 },
              { color: '#3d8fe0', delay: 4 },
            ];
            return (
              <div
                aria-hidden
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 0, height: 0,
                  animation: `splashOrbitFade 0.7s ease-out 0.3s forwards, splashInnerSpin 6s linear 0.3s infinite`,
                }}
              >
                {innerNodes.map((n, i) => {
                  const ang = (i / innerNodes.length) * Math.PI * 2;
                  const ix = innerR * Math.cos(ang);
                  const iy = innerR * Math.sin(ang);
                  return (
                    <div key={i} style={{
                      position: 'absolute',
                      top: iy, left: ix,
                      width: isMobile ? 10 : 13, height: isMobile ? 10 : 13,
                      borderRadius: '50%',
                      background: n.color,
                      boxShadow: `0 0 10px ${n.color}cc`,
                      transform: 'translate(-50%, -50%)',
                      animation: `splashInnerCounterSpin 6s linear 0.3s infinite`,
                    }} />
                  );
                })}
              </div>
            );
          })()}

          {/* ── Middle orbit ring: 5 nodes, 10s/rev ── */}
          {!skipped && (() => {
            const midR = isMobile ? 108 : 160;
            const midNodes = [
              { color: '#1A6FD4' }, { color: '#F97316' }, { color: '#3d8fe0' },
              { color: '#fb9042' }, { color: '#1A6FD4' },
            ];
            return (
              <div
                aria-hidden
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 0, height: 0,
                  animation: `splashOrbitFade 0.8s ease-out 0.5s forwards, splashMidSpin 10s linear 0.5s infinite`,
                }}
              >
                {midNodes.map((n, i) => {
                  const ang = (i / midNodes.length) * Math.PI * 2;
                  const mx = midR * Math.cos(ang);
                  const my = midR * Math.sin(ang);
                  return (
                    <div key={i} style={{
                      position: 'absolute',
                      top: my, left: mx,
                      width: isMobile ? 8 : 10, height: isMobile ? 8 : 10,
                      borderRadius: '50%',
                      background: n.color,
                      boxShadow: `0 0 8px ${n.color}bb`,
                      transform: 'translate(-50%, -50%)',
                      animation: `splashMidCounterSpin 10s linear 0.5s infinite`,
                    }} />
                  );
                })}
              </div>
            );
          })()}

          {/* SVG beams from each orbital node into center */}
          {!skipped && (
            <svg
              className="splash-beams"
              aria-hidden
              width={orbitSize}
              height={orbitSize}
              viewBox={`0 0 ${orbitSize} ${orbitSize}`}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <defs>
                <radialGradient id="beamGradBlue" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3d8fe0" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3d8fe0" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="beamGradOrange" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                </radialGradient>
              </defs>
              {PHASES.map((_, i) => {
                const angle = ((i / PHASES.length) * 360 - 90) * Math.PI / 180;
                const cx = orbitSize / 2;
                const cy = orbitSize / 2;
                const x = cx + orbitRadius * Math.cos(angle);
                const y = cy + orbitRadius * Math.sin(angle);
                const isOrange = i >= 5;
                return (
                  <line
                    key={i}
                    className="splash-beam"
                    x1={cx} y1={cy} x2={x} y2={y}
                    stroke={isOrange ? '#F97316' : '#3d8fe0'}
                    strokeWidth={1.2}
                    strokeOpacity={0.4}
                    strokeDasharray="6 4"
                    style={{ animationDelay: `${0.6 + i * 0.06}s` }}
                  />
                );
              })}
            </svg>
          )}

          {/* Orbital phase nodes */}
          {!skipped && (
            <div
              className="splash-orbit-wrap"
              aria-hidden
              style={{
                position: 'absolute',
                width: orbitSize, height: orbitSize,
                pointerEvents: 'none',
              }}
            >
              {PHASES.map((phase, i) => {
                const PhaseIcon = phase.icon;
                const isOrange = i >= 5;
                const accent = isOrange ? '#F97316' : '#3d8fe0';
                const angle = (i / PHASES.length) * 360;
                const dotSize = isMobile ? 32 : 44;
                return (
                  <div
                    key={phase.id}
                    className="splash-orbit-node"
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      width: 0, height: 0,
                      transform: `rotate(${angle}deg) translate(${orbitRadius}px) rotate(-${angle}deg)`,
                      animationDelay: `${0.45 + i * 0.04}s`,
                    }}
                  >
                    <div className="splash-orbit-dot" style={{
                      width: dotSize, height: dotSize,
                      borderRadius: dotSize * 0.28,
                      background: `linear-gradient(135deg, ${accent}, ${isOrange ? '#cc4900' : '#1452a0'})`,
                      border: `1.5px solid ${accent}`,
                      boxShadow: `0 0 ${dotSize * 0.7}px ${accent}aa, inset 0 0 ${dotSize * 0.3}px rgba(255,255,255,0.18)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'absolute', top: 0, left: 0,
                      transform: 'translate(-50%, -50%)',
                    }}>
                      <PhaseIcon size={dotSize * 0.45} color="#fff" strokeWidth={2.4} />
                      <div style={{
                        position: 'absolute',
                        bottom: -16, left: '50%', transform: 'translateX(-50%)',
                        fontSize: '8px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: accent,
                        letterSpacing: '0.1em',
                        fontWeight: 700,
                        textShadow: `0 0 8px ${accent}`,
                      }}>{String(i + 1).padStart(2, '0')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!reducedMotion && !skipped && SPLASH_PARTICLES.map(p => (
            <span
              key={p.id}
              className="splash-particle"
              style={{
                width: p.size, height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                animationDelay: `${p.delay}s`,
              } as React.CSSProperties & Record<string, string | number>}
            />
          ))}

          <div
            className="splash-logo"
            style={{
              width: logoSize, height: logoSize,
            }}
          >
            <AcornLogo variant="mark" height="100%" width="100%" />
          </div>
        </div>

        {/* Boot terminal */}
        {!reducedMotion && !skipped && (
          <div className="splash-boot" aria-hidden style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginTop: isMobile ? '10px' : '14px',
            padding: '6px 14px',
            background: 'rgba(13,27,42,0.6)',
            border: '1px solid rgba(26,111,212,0.3)',
            borderRadius: '999px',
            backdropFilter: 'blur(8px)',
            opacity: 0,
            animation: 'splashBootIn 0.6s ease-out 1.4s forwards',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#3d8fe0', boxShadow: '0 0 10px #3d8fe0',
              animation: 'splashBootPulse 1.2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: isMobile ? '10px' : '11px',
              color: '#9bbbe0',
              letterSpacing: '0.08em',
            }}>
              <span className="splash-boot-typer">SDLC_AGENTS_ONLINE · 11/11 PHASES READY</span>
            </span>
          </div>
        )}

        <p
          className="splash-tagline"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: isMobile ? '11px' : '13px',
            color: '#8da4c4',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Project Intelligence Platform
        </p>

        <div
          className="splash-headline"
          style={{
            marginTop: isMobile ? '28px' : '36px',
            padding: '0 8px',
            maxWidth: '640px',
          }}
        >
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            fontSize: isMobile ? '22px' : 'clamp(26px, 3.4vw, 38px)',
            color: '#E8EDF5', lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0,
          }}>
            Your entire SDLC,{' '}
            <span style={{
              background: 'linear-gradient(120deg, #3d8fe0, #F97316)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              generated in minutes.
            </span>
          </h2>
          <p style={{
            color: '#8899AA', fontSize: isMobile ? '13px' : '15px',
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: '520px', margin: '14px auto 0', lineHeight: 1.6,
          }}>
            Eleven phases. One conversation. Requirements, architecture, tasks, costs, and risks — all automated.
          </p>
        </div>

        <div className="splash-cta" style={{
          display: 'flex', gap: '12px', marginTop: isMobile ? '24px' : '32px',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <button
            onClick={onEnter}
            className="splash-enter-btn"
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #F97316, #cc4900)',
              border: 'none', borderRadius: '12px', cursor: 'pointer',
              color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 6px 32px rgba(249,115,22,0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(249,115,22,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(249,115,22,0.5)'; }}
          >
            <span className="splash-enter-shimmer" aria-hidden />
            <ArrowRight size={18} /> Start Building Free
          </button>
        </div>

        <div className="splash-stats" style={{
          display: 'flex', gap: isMobile ? '20px' : '36px', marginTop: '24px',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {SPLASH_STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', color: '#F97316' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#5a7088', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splashStarsDrift {
          from { background-position: 0 0, 0 0; }
          to   { background-position: 400px 200px, -300px 150px; }
        }
        @keyframes splashAuroraA {
          0%, 100% { transform: translate3d(-10%, -10%, 0) scale(1); opacity: 0.55; }
          50%      { transform: translate3d(8%, 6%, 0) scale(1.15); opacity: 0.75; }
        }
        @keyframes splashAuroraB {
          0%, 100% { transform: translate3d(8%, 12%, 0) scale(1.05); opacity: 0.4; }
          50%      { transform: translate3d(-6%, -8%, 0) scale(1.2); opacity: 0.6; }
        }
        @keyframes splashLogoIn {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(-12deg); filter: blur(12px); }
          60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.12) rotate(2deg); filter: blur(0); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0); filter: blur(0); }
        }
        @keyframes splashLogoPulse {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(26,111,212,0.55)) drop-shadow(0 0 55px rgba(249,115,22,0.35)); }
          50%      { filter: drop-shadow(0 0 50px rgba(26,111,212,0.8)) drop-shadow(0 0 90px rgba(249,115,22,0.55)); }
        }
        @keyframes splashHaloIn {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          70%  { opacity: 0.9; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes splashRing {
          0%   { opacity: 0.7; transform: translate(-50%, -50%) scale(0.4); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.6); }
        }
        @keyframes splashClimaxBurst {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          40%  { opacity: 0.9; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
        }
        @keyframes splashParticle {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); }
        }
        @keyframes splashRise {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .splash-stars {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.55) 50%, transparent 51%),
            radial-gradient(1.5px 1.5px at 78% 32%, rgba(255,255,255,0.45) 50%, transparent 51%),
            radial-gradient(1px 1px at 32% 72%, rgba(255,255,255,0.5) 50%, transparent 51%),
            radial-gradient(1px 1px at 88% 84%, rgba(255,255,255,0.4) 50%, transparent 51%),
            radial-gradient(1.5px 1.5px at 56% 12%, rgba(255,255,255,0.5) 50%, transparent 51%),
            radial-gradient(1px 1px at 22% 92%, rgba(255,255,255,0.35) 50%, transparent 51%),
            radial-gradient(1px 1px at 68% 58%, rgba(255,255,255,0.45) 50%, transparent 51%);
          background-size: 600px 600px, 600px 600px, 600px 600px, 600px 600px, 600px 600px, 600px 600px, 600px 600px;
          opacity: 0; animation: splashFadeIn 0.6s ease forwards, splashStarsDrift 60s linear infinite;
        }
        .splash-aurora {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
          will-change: transform, opacity;
        }
        .splash-aurora-blue {
          width: 70vmax; height: 70vmax; top: -20%; left: -15%;
          background: radial-gradient(circle, rgba(26,111,212,0.55), transparent 65%);
          animation: splashAuroraA 14s ease-in-out infinite;
        }
        .splash-aurora-orange {
          width: 60vmax; height: 60vmax; bottom: -25%; right: -20%;
          background: radial-gradient(circle, rgba(249,115,22,0.4), transparent 65%);
          animation: splashAuroraB 16s ease-in-out infinite;
        }

        .splash-logo {
          position: absolute; top: 50%; left: 50%;
          display: flex; align-items: center; justify-content: center;
          will-change: transform, opacity, filter;
          animation: splashLogoIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both,
                     splashLogoPulse 2.4s ease-in-out 1.6s infinite;
          background: none;
          border-radius: 0;
        }
        .splash-halo {
          position: absolute; top: 50%; left: 50%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,111,212,0.45) 0%, rgba(249,115,22,0.18) 35%, transparent 70%);
          will-change: transform, opacity;
          animation: splashHaloIn 1.2s ease-out both;
        }
        .splash-ring {
          position: absolute; top: 50%; left: 50%;
          width: 100%; height: 100%; border-radius: 50%;
          border: 1.5px solid rgba(61,143,224,0.45);
          opacity: 0; will-change: transform, opacity;
        }
        .splash-ring-2 { border-color: rgba(249,115,22,0.4); }
        .splash-ring-3 { border-color: rgba(255,255,255,0.25); }
        .splash-ring-1 { animation: splashRing 2.2s ease-out 0.4s infinite; }
        .splash-ring-2 { animation: splashRing 2.2s ease-out 1.0s infinite; }
        .splash-ring-3 { animation: splashClimaxBurst 1.0s ease-out 0.9s 1; }

        .splash-particle {
          position: absolute; top: 50%; left: 50%; border-radius: 50%;
          opacity: 0; transform: translate(-50%, -50%) scale(0);
          will-change: transform, opacity;
          animation: splashParticle 1.6s ease-out both;
        }

        .splash-tagline {
          will-change: transform, opacity;
          animation: splashRise 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.95s both;
        }
        .splash-headline {
          will-change: transform, opacity;
          animation: splashRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) 1.5s both;
        }
        .splash-cta {
          will-change: transform, opacity;
          animation: splashRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 2.4s both;
        }
        .splash-enter-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%);
          background-size: 200% 100%;
          background-position: 200% 0;
          border-radius: inherit;
          pointer-events: none;
          transition: background-position 0s;
        }
        .splash-enter-btn:hover .splash-enter-shimmer {
          background-position: -200% 0;
          transition: background-position 0.55s ease;
        }
        .splash-stats {
          will-change: transform, opacity;
          animation: splashRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 2.7s both;
        }

        .splash-stage.is-instant .splash-logo,
        .splash-stage.is-instant .splash-halo,
        .splash-stage.is-instant .splash-tagline,
        .splash-stage.is-instant .splash-headline,
        .splash-stage.is-instant .splash-cta,
        .splash-stage.is-instant .splash-stats {
          animation-delay: 0s !important;
          animation-duration: 0.25s !important;
        }
        .splash-stage.is-instant .splash-ring,
        .splash-stage.is-instant .splash-particle,
        .splash-stage.is-instant .splash-orbit-wrap {
          display: none !important;
        }

        .splash-orbit-wrap {
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(0deg);
          opacity: 0;
          animation: splashOrbitFade 0.9s ease-out 0.6s forwards,
                     splashOrbitSpin 38s linear 0.6s infinite;
        }
        @keyframes splashOrbitFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splashOrbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes splashInnerSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes splashInnerCounterSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes splashMidSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes splashMidCounterSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        .splash-orbit-node {
          opacity: 0;
          animation: splashOrbitNodeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes splashOrbitNodeIn {
          0%   { opacity: 0; filter: blur(6px); }
          60%  { opacity: 0.6; filter: blur(2px); }
          100% { opacity: 1; filter: blur(0); }
        }
        .splash-orbit-dot {
          animation: splashOrbitCounter 38s linear 0.6s infinite;
          transform-origin: center;
        }
        @keyframes splashOrbitCounter {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        .splash-beams {
          opacity: 0;
          animation: splashBeamsFade 1.2s ease-out 0.8s forwards;
        }
        @keyframes splashBeamsFade {
          from { opacity: 0; }
          to   { opacity: 0.55; }
        }
        .splash-beam {
          stroke-dashoffset: 0;
          animation: splashBeamFlow 3s linear infinite;
        }
        @keyframes splashBeamFlow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -40; }
        }
        .splash-logo-scan {
          background-size: 250% 100% !important;
          background-position: 200% 0 !important;
          animation: splashLogoScan 3.4s ease-in-out 1s infinite;
        }
        @keyframes splashLogoScan {
          0%   { background-position: 200% 0; }
          50%  { background-position: -100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes splashBootIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashBootPulse {
          0%, 100% { opacity: 0.6; transform: scale(0.85); }
          50%      { opacity: 1; transform: scale(1.2); }
        }
        .splash-boot-typer {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 1.5px solid #3d8fe0;
          width: 0;
          animation: splashBootType 2s steps(40, end) 1.6s forwards,
                     splashBootCaret 0.8s step-end 1.6s 6;
        }
        @keyframes splashBootType {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes splashBootCaret {
          50% { border-color: transparent; }
        }

        @media (prefers-reduced-motion: reduce) {
          .splash-stars, .splash-aurora-blue, .splash-aurora-orange { animation: none !important; opacity: 0.5; }
          .splash-logo, .splash-halo,
          .splash-tagline, .splash-headline, .splash-cta, .splash-stats {
            animation: none !important;
            opacity: 1 !important;
          }
          .splash-logo, .splash-halo {
            transform: translate(-50%, -50%) !important;
          }
          .splash-ring, .splash-particle { display: none !important; }
          /* Orbit must always be visible — override opacity-0 start state */
          .splash-orbit-wrap, .splash-orbit-node, .splash-orbit-dot { opacity: 1 !important; }
        }
      `}</style>
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

// ─── Orbital Ring ─────────────────────────────────────────────────────────────
const OrbitalRing: React.FC<{
  reducedMotion: boolean;
}> = ({ reducedMotion }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  // Track actual ring rotation angle so label/card positions stay correct
  const [ringAngleDeg, setRingAngleDeg] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (reducedMotion) return;
    const intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setRingAngleDeg(((elapsed / 45) * 360) % 360);
    }, 200);
    return () => clearInterval(intervalId);
  }, [reducedMotion]);

  const SIZE = 560;
  const R = 228;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  const handleNodeClick = (i: number) => {
    setSelectedIdx(prev => prev === i ? null : i);
  };

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}
      onClick={e => { if (e.target === e.currentTarget) setSelectedIdx(null); }}
    >
      {/* Orbit guide ring */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: R * 2, height: R * 2,
        border: '1px solid rgba(61,143,224,0.13)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* SVG bezier beams from each node to center */}
      <svg
        aria-hidden
        width={SIZE} height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
      >
        {PHASES.map((_, i) => {
          const angle = ((i / PHASES.length) * 360 - 90) * Math.PI / 180;
          const nx = CX + R * Math.cos(angle);
          const ny = CY + R * Math.sin(angle);
          const mx = (CX + nx) / 2 + (ny - CY) * 0.18;
          const my = (CY + ny) / 2 - (nx - CX) * 0.18;
          const isOrange = i >= 5;
          const isHov = hoveredIdx === i;
          return (
            <path
              key={i}
              d={`M ${CX} ${CY} Q ${mx} ${my} ${nx} ${ny}`}
              stroke={isOrange ? '#F97316' : '#3d8fe0'}
              strokeWidth={isHov ? 2 : 1}
              strokeOpacity={isHov ? 0.7 : 0.22}
              strokeDasharray={reducedMotion ? undefined : '6 5'}
              fill="none"
              style={{ transition: 'stroke-opacity 0.22s, stroke-width 0.22s' }}
            />
          );
        })}
      </svg>

      {/* Central Acorn logo */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 2,
        filter: 'drop-shadow(0 0 20px rgba(26,111,212,0.55)) drop-shadow(0 0 36px rgba(249,115,22,0.28))',
      }}>
        <AcornLogo variant="mark" height={70} white />
      </div>

      {/* Rotating orbit wrapper — counter-rotates node content to stay upright */}
      <div
        style={{
          position: 'absolute', inset: 0,
          animation: reducedMotion ? 'none' : 'orbitRingSpin 45s linear infinite',
        }}
      >
      {PHASES.map((phase, i) => {
        const PhaseIcon = phase.icon;
        const staticAngleDeg = (i / PHASES.length) * 360 - 90;
        const angle = staticAngleDeg * Math.PI / 180;
        const nx = CX + R * Math.cos(angle);
        const ny = CY + R * Math.sin(angle);
        // Effective position after ring rotation — used for label/card placement
        const effectiveAngleRad = (staticAngleDeg + ringAngleDeg) * Math.PI / 180;
        const effectiveNx = CX + R * Math.cos(effectiveAngleRad);
        const effectiveNy = CY + R * Math.sin(effectiveAngleRad);
        const isOrange = i >= 5;
        const accent = isOrange ? '#F97316' : '#3d8fe0';
        const darkAccent = isOrange ? '#cc4900' : '#1452a0';
        const isHov = hoveredIdx === i;
        const isSel = selectedIdx === i;
        const NODE = 44;
        const inBottom = effectiveNy > CY + 30;
        const tipX = effectiveNx < CX - 70 ? '0%' : effectiveNx > CX + 70 ? '-100%' : '-50%';

        return (
          <div
            key={phase.id}
            style={{
              position: 'absolute',
              top: ny, left: nx,
              transform: 'translate(-50%, -50%)',
              zIndex: isSel ? 10 : 3,
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => handleNodeClick(i)}
          >
          {/* Counter-rotate content so icons + labels stay upright */}
          <div style={{ animation: reducedMotion ? 'none' : 'orbitRingCounterSpin 45s linear infinite' }}>
            {/* Node dot */}
            <div style={{
              width: NODE, height: NODE,
              borderRadius: Math.round(NODE * 0.28),
              background: `linear-gradient(135deg, ${accent}, ${darkAccent})`,
              border: isSel ? `2px solid ${accent}` : `1.5px solid ${accent}`,
              boxShadow: isSel
                ? `0 0 40px ${accent}ee, 0 0 70px ${accent}55, inset 0 0 18px rgba(255,255,255,0.28)`
                : isHov
                  ? `0 0 30px ${accent}cc, 0 0 54px ${accent}44, inset 0 0 14px rgba(255,255,255,0.22)`
                  : `0 0 14px ${accent}66, inset 0 0 8px rgba(255,255,255,0.12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transform: isSel ? 'scale(1.4)' : isHov ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s',
              animation: reducedMotion ? 'none' : `orbPulse ${2.6 + (i % 3) * 0.4}s ease-in-out ${i * 0.22}s infinite`,
            }}>
              <PhaseIcon size={Math.round(NODE * 0.45)} color="#fff" strokeWidth={2.4} />
            </div>

            {/* Phase label — always visible */}
            <div style={{
              position: 'absolute',
              top: inBottom ? 'auto' : '108%',
              bottom: inBottom ? '108%' : 'auto',
              left: '50%', transform: `translateX(${tipX})`,
              marginTop: inBottom ? 0 : '2px',
              marginBottom: inBottom ? '2px' : 0,
              fontSize: '8.5px',
              fontFamily: "'JetBrains Mono', monospace",
              color: accent,
              letterSpacing: '0.07em',
              fontWeight: 700,
              textShadow: `0 0 8px ${accent}99`,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              opacity: 1,
            }}>{phase.label}</div>

            {/* Detail card — appears on click, persists until dismissed */}
            {isSel && (
              <div style={{
                position: 'absolute',
                top: inBottom ? 'auto' : 'calc(100% + 36px)',
                bottom: inBottom ? 'calc(100% + 36px)' : 'auto',
                left: '50%', transform: `translateX(${tipX})`,
                background: 'rgba(6,16,32,0.98)',
                border: `1.5px solid ${accent}66`,
                borderRadius: '14px',
                padding: '16px 18px',
                zIndex: 30,
                pointerEvents: 'auto',
                boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 22px ${accent}25`,
                minWidth: '200px',
                maxWidth: '230px',
                backdropFilter: 'blur(12px)',
                animation: 'heroSlideUp 0.22s cubic-bezier(0.22,1,0.36,1) forwards',
              }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `linear-gradient(135deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PhaseIcon size={14} color={accent} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: accent, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Phase {i + 1}</div>
                    <div style={{ fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#E8EDF5', lineHeight: 1.1 }}>{phase.label}</div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '1px', background: `linear-gradient(90deg, ${accent}44, transparent)`, marginBottom: '10px' }} />
                <p style={{ fontSize: '12px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, margin: 0 }}>{phase.desc}</p>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}` }} />
                  <span style={{ fontSize: '10px', color: accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>AI-powered · Auto-generated</span>
                </div>
              </div>
            )}
          </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const [showSplash, setShowSplash] = useState(true);
  // Reduced-motion users skip the splash entirely — start them straight in onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => reducedMotion);
  const [heroReady, setHeroReady] = useState(() => reducedMotion);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highlightedPhaseId, setHighlightedPhaseId] = useState<string | null>(null);
  const isMobile = useIsMobile(600);

  const handlePhaseNodeClick = useCallback((phaseId: string) => {
    document.getElementById('phases')?.scrollIntoView({ behavior: 'smooth' });
    setHighlightedPhaseId(phaseId);
    setTimeout(() => setHighlightedPhaseId(null), 1600);
  }, []);

  useEffect(() => {
    if (!showSplash && !showOnboarding && location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [showSplash, showOnboarding, location.hash]);

  useEffect(() => {
    if (!showSplash && !showOnboarding) {
      const t = setTimeout(() => setHeroReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [showSplash, showOnboarding]);

  const handleSplashDone = () => {
    setShowSplash(false);
    setShowOnboarding(true);
  };

  const handleOnboardingDone = () => {
    setShowOnboarding(false);
  };

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={handleSplashDone}
        onEnter={handleSplashDone}
        onSkip={() => { setShowSplash(false); setShowOnboarding(true); }}
        onViewDocs={() => { navigate('/sdlc-guide'); }}
      />
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onDone={handleOnboardingDone} />;
  }

  const card = (style?: React.CSSProperties): React.CSSProperties => ({
    background: 'rgba(26,46,69,0.6)',
    border: '1px solid rgba(26,111,212,0.2)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
    ...style,
  });

  return (
    <div style={{ minHeight: '100vh', color: '#E8EDF5' }}>
      {/* Layer 1: solid dark base (below everything) */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: '#0D1B2A', zIndex: -2 }} />
      {/* Layer 2: space stars + aurora — behind page content */}
      <div className="splash-stars" aria-hidden style={{ position: 'fixed', zIndex: -1 }} />
      <div className="splash-aurora splash-aurora-blue" aria-hidden style={{ position: 'fixed', zIndex: -1 }} />
      <div className="splash-aurora splash-aurora-orange" aria-hidden style={{ position: 'fixed', zIndex: -1 }} />

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
        @media (max-width: 768px) {
          .lp-footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .lp-footer-bottom { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .lp-flowchart-card { padding: 20px 14px !important; }
          .lp-hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .lp-hero-ctas button { width: 100% !important; justify-content: center !important; }
        }
        @keyframes orbPulse {
          0%, 100% { filter: brightness(0.85); }
          50%       { filter: brightness(1.25); }
        }
        @keyframes orbitRingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitRingCounterSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes heroWordIn {
          from { opacity: 0; transform: translateY(28px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .lp-orbital-ring { display: block; }
        .lp-pipeline-fallback { display: none; }
        @media (max-width: 700px) {
          .lp-orbital-ring { display: none !important; }
          .lp-pipeline-fallback { display: block !important; }
        }
        @keyframes phaseHighlight {
          0%   { box-shadow: 0 0 0 2px rgba(249,115,22,0.8), 0 0 28px rgba(249,115,22,0.5); }
          70%  { box-shadow: 0 0 0 2px rgba(249,115,22,0.5), 0 0 16px rgba(249,115,22,0.3); }
          100% { box-shadow: none; }
        }
        .phase-card-highlighted {
          animation: phaseHighlight 1.6s ease-out forwards !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-stars  { animation: none !important; opacity: 1 !important; }
          .splash-aurora { animation: none !important; opacity: 0.5 !important; }
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
          <AcornLogo height={40} white />
        </div>

        {/* Desktop nav links */}
        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          <button onClick={() => scrollTo('pricing')} style={{ padding: '8px 14px', background: 'none', border: 'none', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', cursor: 'pointer', borderRadius: '8px', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8899AA'; }}
          >
            Pricing
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
          { label: 'Features', action: () => { scrollTo('features'); setMobileMenuOpen(false); } },
          { label: 'How It Works', action: () => { scrollTo('how-it-works'); setMobileMenuOpen(false); } },
          { label: 'Pricing', action: () => { scrollTo('pricing'); setMobileMenuOpen(false); } },
          { label: 'Sign In', action: () => { navigate('/login'); setMobileMenuOpen(false); } },
        ].map(({ label, action }) => (
          <button key={label} onClick={action} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(26,111,212,0.1)', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <style>{`
          @keyframes heroSlideUp {
            from { opacity: 0; transform: translateY(40px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '28px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
            background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.3)', borderRadius: '999px',
            opacity: heroReady ? 1 : 0,
            animation: heroReady ? 'heroSlideUp 700ms cubic-bezier(0.22,1,0.36,1) 0ms forwards' : 'none',
          }}>
            <Sparkles size={14} color="#3d8fe0" />
            <span style={{ fontSize: '13px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.02em' }}>AI-Powered Planning Platform</span>
          </div>

          {/* Headline — word-by-word reveal */}
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 6vw, 68px)', lineHeight: 1.15, maxWidth: '820px', letterSpacing: '-0.03em', margin: '0 auto 20px' }}>
              {reducedMotion ? (
                <>
                  Ship better software,{' '}
                  <span style={{ background: 'linear-gradient(135deg, #1A6FD4 30%, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    10x faster.
                  </span>
                </>
              ) : (
                <>
                  {['Ship', 'better', 'software,'].map((word, i) => (
                    <span
                      key={word}
                      style={{
                        display: 'inline-block',
                        opacity: heroReady ? undefined : 0,
                        animation: heroReady ? `heroWordIn 600ms cubic-bezier(0.22,1,0.36,1) ${i * 80}ms both` : 'none',
                        marginRight: '0.25em',
                      }}
                    >
                      {word}
                    </span>
                  ))}{' '}
                  <span style={{ background: 'linear-gradient(135deg, #1A6FD4 30%, #F97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                    {['10x', 'faster.'].map((word, i) => (
                      <span
                        key={word}
                        style={{
                          display: 'inline-block',
                          opacity: heroReady ? undefined : 0,
                          animation: heroReady ? `heroWordIn 600ms cubic-bezier(0.22,1,0.36,1) ${(3 + i) * 80}ms both` : 'none',
                          marginRight: i === 0 ? '0.25em' : 0,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </h1>
            <p style={{
              color: '#8899AA', fontSize: 'clamp(15px, 2vw, 18px)', fontFamily: "'DM Sans', sans-serif",
              maxWidth: '580px', lineHeight: 1.75, margin: '0 auto',
              opacity: heroReady ? 1 : 0,
              animation: heroReady ? 'heroWordIn 700ms cubic-bezier(0.22,1,0.36,1) 440ms both' : 'none',
            }}>
              Describe your project in plain language. Acorn generates a complete, production-ready SDLC plan — requirements, architecture, tasks, risk analysis, and cost estimates — in under five minutes.
            </p>
          </div>

          {/* CTAs */}
          <div className="lp-hero-ctas" style={{
            display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
            opacity: heroReady ? 1 : 0,
            animation: heroReady ? 'heroSlideUp 700ms cubic-bezier(0.22,1,0.36,1) 160ms forwards' : 'none',
          }}>
            <button onClick={() => navigate('/register')}
              style={{ padding: '15px 36px', background: 'linear-gradient(135deg, #F97316, #cc4900)', border: 'none', borderRadius: '12px', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 28px rgba(249,115,22,0.4)', transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(249,115,22,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.4)'; }}
            >
              <Rocket size={18} /> Start Building Free
            </button>
          </div>

          {/* Orbital ring (desktop) / Pipeline fallback (mobile) */}
          <div style={{
            width: '100%', marginTop: '24px',
            opacity: heroReady ? 1 : 0,
            animation: heroReady ? 'heroSlideUp 700ms cubic-bezier(0.22,1,0.36,1) 240ms forwards' : 'none',
          }}>
            {/* Desktop: interactive orbital ring */}
            <div className="lp-orbital-ring">
              <OrbitalRing reducedMotion={reducedMotion} />
            </div>

            {/* Mobile (<700px): original pipeline card */}
            <div className="lp-pipeline-fallback">
              <Reveal delay={0} y={0} className="lp-flowchart-card" style={{ padding: '20px 14px', ...card({ borderColor: 'rgba(26,111,212,0.25)' }), width: '100%', position: 'relative', overflow: 'hidden' }}>
                <div aria-hidden style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
                  background: 'radial-gradient(800px circle at 30% 0%, rgba(26,111,212,0.15), transparent 60%), radial-gradient(600px circle at 90% 100%, rgba(249,115,22,0.12), transparent 60%)',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', position: 'relative' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1A6FD4', boxShadow: '0 0 10px #1A6FD4' }} />
                  <p style={{ fontSize: '11px', color: '#cdd5e0', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>
                    Complete SDLC Pipeline · 11 Phases
                  </p>
                </div>
                <div style={{ position: 'relative' }}>
                  <SDLCPipeline />
                </div>
              </Reveal>
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
        <HeadingReveal style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '999px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: '#fb9042', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>How It Works</span>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            From idea to full plan in three steps.
          </h2>
          <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            No templates, no guesswork. Just describe your project and let Acorn handle the rest.
          </p>
        </HeadingReveal>

        <WaveReveal delay={0} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
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
            <div key={step}>
              <Tilt
                glow={`${color}33`}
                style={{ padding: '32px 28px', ...card(), position: 'relative', overflow: 'hidden', height: '100%' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}60`; (e.currentTarget as HTMLElement).style.boxShadow = `0 18px 48px ${color}25`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div aria-hidden style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), ${color}20, transparent 70%)`,
                }} />
                <div style={{ position: 'absolute', top: '16px', right: '20px', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '80px', color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>{step}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', position: 'relative' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: bg, border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `inset 0 0 18px ${color}22` }}>
                    <Icon size={24} color={color} />
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${color}66` }}>
                    <span style={{ color: '#fff', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>{idx + 1}</span>
                  </div>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', marginBottom: '12px', letterSpacing: '-0.01em', position: 'relative' }}>{title}</h3>
                <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.75, position: 'relative' }}>{desc}</p>
              </Tilt>
            </div>
          ))}
        </WaveReveal>
      </section>

      {/* ── PHASES GRID ── */}
      <section id="phases" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', background: 'rgba(10,31,61,0.35)', borderTop: '1px solid rgba(26,111,212,0.1)', borderBottom: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <HeadingReveal style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)', borderRadius: '999px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Every Phase, Covered</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              The complete SDLC, automated.
            </h2>
            <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
              From initial planning to deployment summary — every phase powered by purpose-built AI agents working in concert.
            </p>
          </HeadingReveal>

          <WaveReveal delay={0} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const isOrange = i >= 5;
              const accent = isOrange ? '#F97316' : '#1A6FD4';
              const isHighlighted = highlightedPhaseId === phase.id;
              return (
                <div key={phase.id}>
                  <Tilt
                    max={6}
                    scale={1.025}
                    className={isHighlighted ? 'phase-card-highlighted' : undefined}
                    style={{
                      padding: '20px', ...card({ border: `1px solid ${isOrange ? 'rgba(249,115,22,0.22)' : 'rgba(26,111,212,0.2)'}` }),
                      display: 'flex', flexDirection: 'column', gap: '12px', height: '100%',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = isOrange ? 'rgba(249,115,22,0.55)' : 'rgba(26,111,212,0.55)'; (e.currentTarget as HTMLElement).style.boxShadow = isOrange ? '0 14px 32px rgba(249,115,22,0.18)' : '0 14px 32px rgba(26,111,212,0.2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isOrange ? 'rgba(249,115,22,0.22)' : 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <div aria-hidden style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: `radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), ${accent}1f, transparent 65%)`,
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `linear-gradient(135deg, ${accent}33, ${accent}10)`, border: `1px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `inset 0 0 12px ${accent}22` }}>
                        <Icon size={16} color={isOrange ? '#fb9042' : '#3d8fe0'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: isOrange ? '#fb9042' : '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>Phase {i + 1}</div>
                        <div style={{ fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#E8EDF5', lineHeight: 1.2 }}>{phase.label}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.65, margin: 0, position: 'relative' }}>{phase.desc}</p>
                  </Tilt>
                </div>
              );
            })}
          </WaveReveal>
        </div>
      </section>

      {/* ── AI FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', maxWidth: '1200px', margin: '0 auto' }}>
        <HeadingReveal style={{ textAlign: 'center', marginBottom: '56px' }}>
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
        </HeadingReveal>

        <WaveReveal delay={0} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { icon: FileText,   title: 'SRS Generator',     desc: 'Full software requirements specification with functional and non-functional requirements, acceptance criteria, and edge cases.', color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)' },
            { icon: Users,      title: 'Persona Builder',   desc: 'AI-generated user personas with detailed pain points, goals, motivations, and user stories mapped to your product.', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
            { icon: Shield,     title: 'Risk Analyzer',     desc: 'Proactive identification of technical, business, and operational risks with severity scoring and mitigation strategies.', color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)' },
            { icon: BarChart3,  title: 'Cost Estimator',    desc: 'Detailed budget breakdowns with team composition, hourly rates, timeline projections, and ROI forecasting.', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
            { icon: GitBranch,  title: 'Task Planner',      desc: 'Sprint-ready backlog with story points, priorities, dependencies, and acceptance criteria — Jira-ready on day one.', color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)' },
            { icon: TrendingUp, title: 'AI Explainability',  desc: 'Confidence scores and transparent reasoning trails for every AI output so your team can validate and trust the results.', color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
          ].map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div key={title}>
              <Tilt
                max={7}
                glow={`${color}40`}
                style={{ padding: '26px', ...card(), height: '100%', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}66`; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 38px ${color}25`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div aria-hidden style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: `radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), ${color}24, transparent 65%)`,
                }} />
                <div style={{
                  width: '48px', height: '48px', borderRadius: '13px',
                  background: `linear-gradient(135deg, ${color}45, ${color}15)`,
                  border: `1px solid ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px', position: 'relative',
                  boxShadow: `inset 0 0 14px ${color}22, 0 6px 20px ${color}25`,
                }}>
                  <Icon size={22} color="#fff" strokeWidth={2.2} />
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '10px', letterSpacing: '-0.01em', position: 'relative' }}>{title}</h3>
                <p style={{ color: '#8899AA', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, position: 'relative' }}>{desc}</p>
              </Tilt>
            </div>
          ))}
        </WaveReveal>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', background: 'rgba(10,31,61,0.35)', borderTop: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <HeadingReveal style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Trusted by product teams.
            </h2>
            <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px' }}>
              See what engineering leaders and product managers are saying.
            </p>
          </HeadingReveal>
          <WaveReveal delay={0} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { quote: 'Acorn cut our pre-dev planning phase from 3 weeks to 2 days. The SRS output is genuinely production-quality.', name: 'Sarah M.', role: 'VP Engineering', stars: 5 },
              { quote: 'The AI personas feature alone is worth it. No more guessing who our users are — we have data-backed profiles from day one.', name: 'James K.', role: 'Product Manager', stars: 5 },
              { quote: 'Risk analysis caught three architectural issues we would have missed. Saved us from a very painful sprint 4.', name: 'Priya L.', role: 'Tech Lead', stars: 5 },
            ].map(({ quote, name, role, stars }, i) => (
              <div key={name}>
                <Tilt
                  max={5}
                  scale={1.015}
                  glow="rgba(249,115,22,0.25)"
                  style={{ padding: '28px', ...card(), display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 36px rgba(249,115,22,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,111,212,0.2)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <div aria-hidden style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(249,115,22,0.18), transparent 65%)',
                  }} />
                  <div style={{ position: 'absolute', top: '14px', right: '20px', fontFamily: "'Syne', sans-serif", fontSize: '90px', color: 'rgba(249,115,22,0.07)', lineHeight: 1, userSelect: 'none', fontWeight: 800 }}>"</div>
                  <div style={{ display: 'flex', gap: '3px', position: 'relative' }}>
                    {Array.from({ length: stars }).map((_, j) => <Star key={j} size={14} color="#F97316" fill="#F97316" />)}
                  </div>
                  <p style={{ color: '#C8D5E5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8, fontStyle: 'italic', flex: 1, position: 'relative' }}>"{quote}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(26,111,212,0.12)', paddingTop: '16px', position: 'relative' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(26,111,212,0.4)' }}>
                      <span style={{ color: '#fff', fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', color: '#E8EDF5' }}>{name}</div>
                      <div style={{ color: '#8899AA', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>{role}</div>
                    </div>
                  </div>
                </Tilt>
              </div>
            ))}
          </WaveReveal>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: 'clamp(60px, 8vw, 96px) clamp(20px, 5vw, 40px)', background: 'rgba(10,31,61,0.35)', borderTop: '1px solid rgba(26,111,212,0.1)', borderBottom: '1px solid rgba(26,111,212,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <HeadingReveal style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '999px', marginBottom: '16px' }}>
              <DollarSign size={12} color="#fb9042" />
              <span style={{ fontSize: '12px', color: '#fb9042', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pricing</span>
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
              Simple, transparent pricing.
            </h2>
            <p style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '16px', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              Start free and scale when you're ready. No hidden fees, no surprises.
            </p>
          </HeadingReveal>

          <WaveReveal delay={0} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>

            {/* Free Tier */}
            <div style={{
              padding: '36px 32px',
              background: 'rgba(26,46,69,0.6)',
              border: '1px solid rgba(26,111,212,0.25)',
              borderRadius: '20px',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', gap: '0',
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: '#3d8fe0', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Free</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '48px', color: '#E8EDF5', lineHeight: 1 }}>$0</span>
                  <span style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', paddingBottom: '8px' }}>/month</span>
                </div>
                <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  Everything you need to get started — no credit card required.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
                {[
                  '3 active projects',
                  'All 11 SDLC phases',
                  'AI-generated requirements & SRS',
                  'Architecture & system design',
                  'Task & sprint planning',
                  'Risk and cost analysis',
                  'PDF export',
                  'Community support',
                ].map(feature => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#3d8fe0" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#C8D5E5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/register')}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: 'rgba(26,111,212,0.12)', border: '1px solid rgba(26,111,212,0.4)',
                  color: '#3d8fe0', fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.22)'; e.currentTarget.style.borderColor = 'rgba(26,111,212,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,111,212,0.12)'; e.currentTarget.style.borderColor = 'rgba(26,111,212,0.4)'; }}
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div style={{
              padding: '36px 32px',
              background: 'rgba(26,46,69,0.75)',
              border: '2px solid rgba(249,115,22,0.5)',
              borderRadius: '20px',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column', gap: '0',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 40px rgba(249,115,22,0.12)',
            }}>
              {/* Popular badge */}
              <div style={{
                position: 'absolute', top: '20px', right: '20px',
                padding: '4px 12px',
                background: 'linear-gradient(135deg, #F97316, #cc4900)',
                borderRadius: '999px',
                fontSize: '11px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Most Popular
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: '#fb9042', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Pro</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '48px', color: '#E8EDF5', lineHeight: 1 }}>$29</span>
                  <span style={{ color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', paddingBottom: '8px' }}>/month</span>
                </div>
                <p style={{ color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  For teams serious about shipping production-quality software, faster.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
                {[
                  'Unlimited projects',
                  'Everything in Free',
                  'Priority AI processing',
                  'Confluence & Jira export',
                  'Bring your own AI key',
                  'Team collaboration (up to 5)',
                  'Analytics dashboard',
                  'Priority email support',
                ].map((feature, i) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color={i === 1 ? '#8899AA' : '#F97316'} style={{ flexShrink: 0 }} />
                    <span style={{ color: '#C8D5E5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/register')}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F97316, #cc4900)',
                  border: 'none',
                  color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(249,115,22,0.4)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(249,115,22,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.4)'; }}
              >
                Start Pro Free Trial
              </button>
            </div>

          </WaveReveal>

          <div style={{ textAlign: 'center', marginTop: '36px' }} />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 40px)', textAlign: 'center', background: 'linear-gradient(180deg, transparent, rgba(26,111,212,0.07) 50%, transparent)' }}>
        <Reveal y={32}>
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
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(26,111,212,0.15)', background: 'rgba(10,20,35,0.6)' }}>
        {/* Top footer */}
        <Reveal y={16}>
        <div className="lp-footer-grid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px clamp(20px, 5vw, 40px) 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px' }}>
          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AcornLogo height={36} white />
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
              { label: 'How It Works', onClick: () => scrollTo('how-it-works') },
              { label: 'Pricing', onClick: () => scrollTo('pricing') },
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
        </Reveal>

        {/* Bottom bar */}
        <Reveal y={8} delay={100}>
        <div className="lp-footer-bottom" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px clamp(20px, 5vw, 40px)', borderTop: '1px solid rgba(26,111,212,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
        </Reveal>
      </footer>
    </div>
  );
};

export default LandingPage;
