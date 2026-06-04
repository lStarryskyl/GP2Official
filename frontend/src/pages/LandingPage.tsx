import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight, Sparkles, Shield, FileText, CheckCircle2,
  Layers, GitBranch, DollarSign, AlertTriangle, ClipboardList,
  Search, FlaskConical, Code2, LayoutDashboard, Rocket,
} from 'lucide-react';
import { AcornLogo } from '../components/AcornLogo';

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const PHASES = [
  { id: 'brief',        label: 'Brief',        icon: ClipboardList,  color: '#1A6FD4', desc: 'Define goals, scope, and roadmap with AI-assisted project framing.' },
  { id: 'feasibility',  label: 'Feasibility',  icon: Search,         color: '#2d88e8', desc: 'Validate technical and business viability before committing resources.' },
  { id: 'requirements', label: 'Requirements', icon: FileText,       color: '#3d8fe0', desc: 'Generate detailed SRS with functional and non-functional requirements.' },
  { id: 'validation',   label: 'Validation',   icon: CheckCircle2,   color: '#1A6FD4', desc: 'Ensure requirements are complete, consistent, and stakeholder-approved.' },
  { id: 'tech-stack',   label: 'Tech Stack',   icon: Code2,          color: '#1A6FD4', desc: 'AI selects the optimal technology stack for your use case and constraints.' },
  { id: 'architecture', label: 'Architecture', icon: Layers,         color: '#2d88e8', desc: 'Architecture diagrams, data models, and API contracts auto-generated.' },
  { id: 'design',       label: 'Design',       icon: Sparkles,       color: '#F97316', desc: 'UI/UX design tokens, component specs, and design system scaffolding.' },
  { id: 'planning',     label: 'Planning',     icon: LayoutDashboard,color: '#F97316', desc: 'Sprint breakdowns, story points, and Gantt charts generated automatically.' },
  { id: 'tasks',        label: 'Tasks',        icon: GitBranch,      color: '#fb9042', desc: 'Prioritized backlog with dependencies, owners, and acceptance criteria.' },
  { id: 'costs',        label: 'Costs',        icon: DollarSign,     color: '#F97316', desc: 'Detailed budget forecasts with ROI projections and resource planning.' },
  { id: 'risk',         label: 'Risk',         icon: AlertTriangle,  color: '#fb9042', desc: 'Proactive risk identification with impact scores and mitigation plans.' },
  { id: 'testing',      label: 'Testing',      icon: FlaskConical,   color: '#2A9D8F', desc: 'Test strategy, coverage plans, and QA checklists generated automatically.' },
  { id: 'deployment',   label: 'Deployment',   icon: Rocket,         color: '#F97316', desc: 'CI/CD pipeline config, environment setup, and go-live checklist.' },
];

const FEATURES = [
  { icon: Shield,       title: 'Enterprise Grade', desc: 'SOC-2 compliant, SSO, audit logs, and role-based access control.' },
  { icon: Sparkles,     title: 'Multi-Model AI',   desc: 'Orchestrates GPT-4, Gemini, and Claude for best-in-class output.' },
  { icon: FlaskConical, title: 'Full SDLC',        desc: 'Every phase from idea to deployment, covered end-to-end.' },
];

// ─── Motion variants ──────────────────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

const navVariants = {
  initial: { y: -60, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 24, delay: 0.1 } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

const exitItem = {
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: EASE_OUT } },
};

// ─── Canvas background (drifting pipeline nodes) ──────────────────────────────

const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const nodes = PHASES.map((p, i) => ({
      x: (Math.random() * 0.7 + 0.15) * W,
      y: (Math.random() * 0.7 + 0.15) * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      phase: (Math.random() * Math.PI * 2),
      label: p.label,
      color: p.color,
      idx: i,
    }));

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Update positions with sine drift
      nodes.forEach(n => {
        n.x += n.vx + Math.sin(t + n.phase) * 0.15;
        n.y += n.vy + Math.cos(t + n.phase * 1.3) * 0.12;
        if (n.x < 60) { n.x = 60; n.vx *= -1; }
        if (n.x > W - 60) { n.x = W - 60; n.vx *= -1; }
        if (n.y < 40) { n.y = 40; n.vy *= -1; }
        if (n.y > H - 40) { n.y = H - 40; n.vy *= -1; }
      });

      // Draw connections between adjacent nodes (by index proximity)
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 280;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          ctx.strokeStyle = `rgba(26,111,212,${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = n.color + '66';
        ctx.fill();
        ctx.strokeStyle = n.color + 'aa';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', opacity: 0.6,
      }}
    />
  );
};

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

const InViewStagger: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });
  return (
    <m.div
      ref={ref}
      className={className}
      style={style}
      variants={staggerContainer}
      initial="initial"
      animate={inView ? 'animate' : 'initial'}
    >
      {children}
    </m.div>
  );
};

// ─── Phase card ───────────────────────────────────────────────────────────────

const PhaseCard: React.FC<{ phase: typeof PHASES[0]; index: number }> = ({ phase }) => {
  const Icon = phase.icon;
  const isOrange = ['design', 'planning', 'tasks', 'costs', 'risk', 'deployment'].includes(phase.id);

  return (
    <m.div
      variants={staggerItem}
      whileHover={{ y: -4, borderColor: phase.color + 'cc', transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '20px 18px',
        borderRadius: 16,
        background: `linear-gradient(145deg, rgba(${isOrange ? '249,115,22' : '26,111,212'},0.08) 0%, rgba(13,27,42,0.5) 100%)`,
        border: `1px solid rgba(${isOrange ? '249,115,22' : '26,111,212'},0.22)`,
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `linear-gradient(135deg, ${phase.color}, ${phase.color}bb)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14, boxShadow: `0 4px 12px ${phase.color}44`,
      }}>
        <Icon size={16} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
        color: '#E8EDF5', marginBottom: 8, letterSpacing: '-0.01em',
      }}>
        {phase.label}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, lineHeight: 1.55,
        color: '#8899AA',
      }}>
        {phase.desc}
      </div>
    </m.div>
  );
};

// ─── Feature card ─────────────────────────────────────────────────────────────

const FeatureCard: React.FC<{ feature: typeof FEATURES[0] }> = ({ feature }) => {
  const Icon = feature.icon;
  return (
    <m.div
      variants={staggerItem}
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      style={{
        padding: '32px 28px', borderRadius: 20,
        background: 'rgba(10,21,37,0.7)',
        border: '1px solid rgba(26,111,212,0.18)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(26,111,212,0.25), rgba(26,111,212,0.08))',
        border: '1px solid rgba(26,111,212,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <Icon size={22} color="#1A6FD4" strokeWidth={1.8} />
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17,
        color: '#E8EDF5', marginBottom: 10, letterSpacing: '-0.01em',
      }}>
        {feature.title}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.6, color: '#8899AA' }}>
        {feature.desc}
      </div>
    </m.div>
  );
};

// ─── Main LandingPage ─────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroLine1Ref = useRef<HTMLDivElement>(null);
  const heroLine2Ref = useRef<HTMLDivElement>(null);

  return (
    <m.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      style={{ minHeight: '100vh', background: '#050D1A', color: '#E8EDF5', overflowX: 'hidden' }}
    >
      {/* ── Nav ── */}
      <m.nav
        variants={navVariants}
        initial="initial"
        animate="animate"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 clamp(20px, 5vw, 60px)',
          height: 64,
          background: 'rgba(5,13,26,0.82)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(26,111,212,0.1)',
        }}
      >
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/landing')}>
          <AcornLogo height={30} white />
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="lp-nav-desktop">
          {['Docs', 'Pricing', 'Sign in'].map(label => (
            <button
              key={label}
              onClick={() => {
                if (label === 'Sign in') navigate('/login');
                else if (label === 'Docs') navigate('/docs');
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                color: '#8899AA', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E8EDF5'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8899AA'; }}
            >
              {label}
            </button>
          ))}
          <m.button
            whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            style={{
              padding: '8px 20px', borderRadius: 999,
              background: 'linear-gradient(135deg, #F97316, #e85d04)',
              border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
              color: '#fff', letterSpacing: '0.01em',
            }}
          >
            Get started
          </m.button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lp-nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#E8EDF5', display: 'none', padding: 8,
          }}
        >
          <div style={{ width: 20, height: 2, background: '#E8EDF5', marginBottom: 5, borderRadius: 2 }} />
          <div style={{ width: 20, height: 2, background: '#E8EDF5', marginBottom: 5, borderRadius: 2 }} />
          <div style={{ width: 14, height: 2, background: '#E8EDF5', borderRadius: 2 }} />
        </button>
      </m.nav>

      {/* ── Mobile menu overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
              background: 'rgba(5,13,26,0.97)', padding: '24px 32px 32px',
              borderBottom: '1px solid rgba(26,111,212,0.15)',
            }}
          >
            {['Docs', 'Pricing', 'Sign in', 'Get started'].map((label, i) => (
              <m.button
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, ease: EASE_OUT, duration: 0.3 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (label === 'Sign in') navigate('/login');
                  else if (label === 'Get started') navigate('/register');
                  else if (label === 'Docs') navigate('/docs');
                }}
                style={{
                  display: 'block', width: '100%', background: 'none', border: 'none',
                  textAlign: 'left', padding: '14px 0', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500,
                  color: label === 'Get started' ? '#F97316' : '#E8EDF5',
                  borderBottom: '1px solid rgba(26,111,212,0.08)',
                }}
              >
                {label}
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(100px, 12vh, 140px) clamp(20px, 6vw, 80px) clamp(80px, 10vh, 120px)',
        textAlign: 'center', overflow: 'hidden',
      }}>
        {/* Canvas drifting nodes */}
        <HeroCanvas />

        {/* Gradient veil over canvas */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(5,13,26,0.3) 0%, rgba(5,13,26,0.75) 100%)',
        }} />

        {/* Glow orbs */}
        <div aria-hidden style={{ position: 'absolute', top: '15%', left: '8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,111,212,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: '10%', right: '8%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
          {/* Badge */}
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999, marginBottom: 32,
              background: 'rgba(26,111,212,0.12)',
              border: '1px solid rgba(26,111,212,0.3)',
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              color: '#3d8fe0', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
            AI-Powered SDLC Platform
          </m.div>

          {/* Headline — two lines animating from opposite sides */}
          <div style={{ overflow: 'hidden', marginBottom: 8 }}>
            <m.div
              ref={heroLine1Ref}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.7, ease: EASE_OUT }}
              style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 'clamp(36px, 6vw, 76px)',
                letterSpacing: '-0.04em', lineHeight: 1.05, color: '#E8EDF5',
              }}
            >
              From idea to
            </m.div>
          </div>
          <div style={{ overflow: 'hidden', marginBottom: 28 }}>
            <m.div
              ref={heroLine2Ref}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.57, duration: 0.7, ease: EASE_OUT }}
              style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 'clamp(36px, 6vw, 76px)',
                letterSpacing: '-0.04em', lineHeight: 1.05,
                background: 'linear-gradient(135deg, #1A6FD4 0%, #F97316 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              deployment in minutes
            </m.div>
          </div>

          {/* Subtext */}
          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.6, ease: EASE_OUT }}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(15px, 1.8vw, 19px)',
              color: '#8899AA', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 44px',
            }}
          >
            Acorn orchestrates multi-model AI to automate every SDLC phase —
            requirements, architecture, planning, costs, testing, and deployment.
          </m.p>

          {/* CTAs */}
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.88, type: 'spring', stiffness: 260, damping: 20 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <m.button
              whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                border: '1px solid rgba(26,111,212,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                color: '#fff', willChange: 'transform',
              }}
            >
              Start building free <ArrowRight size={16} />
            </m.button>
            <m.button
              whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/docs')}
              style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'transparent',
                border: '1px solid rgba(26,111,212,0.25)',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
                color: '#8899AA', willChange: 'transform',
              }}
            >
              View docs
            </m.button>
          </m.div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section style={{
        padding: 'clamp(60px, 8vh, 100px) clamp(20px, 6vw, 80px)',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <InViewStagger style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {FEATURES.map(f => <FeatureCard key={f.title} feature={f} />)}
        </InViewStagger>
      </section>

      {/* ── Phase grid ── */}
      <section style={{
        padding: 'clamp(60px, 8vh, 100px) clamp(20px, 6vw, 80px)',
        background: 'rgba(10,21,37,0.5)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <InViewStagger>
            <m.div variants={staggerItem} style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.18em',
                color: '#1A6FD4', textTransform: 'uppercase', marginBottom: 14,
              }}>
                All 13 SDLC Phases
              </div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.03em',
                color: '#E8EDF5', marginBottom: 16,
              }}>
                Every phase. One platform.
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 16,
                color: '#8899AA', lineHeight: 1.65, maxWidth: 520, margin: '0 auto',
              }}>
                From initial brief to production deployment, every step is AI-assisted,
                connected, and traceable.
              </p>
            </m.div>
          </InViewStagger>

          <InViewStagger style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {PHASES.map((phase, i) => (
              <PhaseCard key={phase.id} phase={phase} index={i} />
            ))}
          </InViewStagger>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section style={{ padding: 'clamp(80px, 10vh, 120px) clamp(20px, 6vw, 80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <InViewStagger>
            <m.div variants={staggerItem} style={{
              padding: 'clamp(40px, 6vh, 64px) clamp(24px, 5vw, 64px)',
              borderRadius: 24, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(26,111,212,0.15) 0%, rgba(249,115,22,0.08) 100%)',
              border: '1px solid rgba(26,111,212,0.25)',
            }}>
              <div aria-hidden style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: 'clamp(24px, 3.5vw, 40px)', letterSpacing: '-0.03em',
                color: '#E8EDF5', marginBottom: 16,
              }}>
                Ready to ship faster?
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#8899AA', marginBottom: 32, lineHeight: 1.6 }}>
                Join teams using Acorn to turn ideas into production-grade software plans in minutes.
              </p>
              <m.button
                whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
                style={{
                  padding: '14px 36px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #F97316, #e85d04)',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600,
                  color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 10,
                  willChange: 'transform',
                }}
              >
                Get started for free <ArrowRight size={16} />
              </m.button>
            </m.div>
          </InViewStagger>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(26,111,212,0.1)',
        padding: 'clamp(32px, 5vh, 48px) clamp(20px, 6vw, 80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <AcornLogo height={24} white />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4a6070' }}>
            © 2025 Acorn
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Docs', 'Privacy', 'Terms'].map(item => (
            <button
              key={item}
              onClick={() => item === 'Docs' && navigate('/docs')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4a6070',
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </footer>

      {/* ── Responsive nav styles ── */}
      <style>{`
        @media (max-width: 640px) {
          .lp-nav-desktop { display: none !important; }
          .lp-nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </m.div>
  );
};

export default LandingPage;
