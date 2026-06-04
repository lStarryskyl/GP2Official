import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnimatePresence,
  animate,
  m,
  useInView,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  Layers,
  Rocket,
} from 'lucide-react';
import { AcornLogo } from '@/components/AcornLogo';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const PARTNERS = ['Vertex Labs', 'Meridian Cloud', 'Northstar Ops', 'Signal Forge', 'Bluebeam Studio', 'Atlas Systems'];

const HERO_REQUIREMENTS = [
  'REQ-01 Authentication, SSO, and role-based access',
  'REQ-07 Requirement traceability through deployment',
  'REQ-12 AI-assisted delivery plan with cost forecast',
  'REQ-18 Release checklist, QA scope, and rollout guardrails',
];

const BENTO_CARDS = [
  { id: 'brief', title: 'Brief', label: 'Input', span: '1 / span 5', row: '1 / span 2' },
  { id: 'reqs', title: 'Feasibility + Requirements', label: 'Output', span: '6 / span 4', row: '1 / span 1' },
  { id: 'stack', title: 'Tech Stack', label: 'Stack', span: '10 / span 3', row: '1 / span 1' },
  { id: 'arch', title: 'Architecture', label: 'System', span: '1 / span 4', row: '3 / span 1' },
  { id: 'design', title: 'Design Tokens', label: 'Brand', span: '5 / span 4', row: '3 / span 1' },
  { id: 'plan', title: 'Planning', label: 'Timeline', span: '9 / span 4', row: '2 / span 2' },
  { id: 'cost', title: 'Cost Estimate', label: 'Budget', span: '1 / span 3', row: '4 / span 1' },
  { id: 'risk', title: 'Risk Matrix', label: 'Risk', span: '4 / span 4', row: '4 / span 1' },
  { id: 'test', title: 'Testing', label: 'QA', span: '8 / span 3', row: '4 / span 1' },
  { id: 'deploy', title: 'Deployment', label: 'Delivery', span: '11 / span 2', row: '4 / span 1' },
];

const PHASE_STEPS = [
  {
    id: 'planning',
    pill: 'Planning',
    status: 'Sequencing',
    confidence: '94%',
    tokens: '1.8k',
    actions: ['Roadmap', 'Milestones', 'Assumptions'],
    lines: [
      'Scope mapped into 3 delivery waves with owner checkpoints.',
      'Critical path runs through onboarding, permissions, and billing.',
      'Recommended sprint cadence: 2 weeks, 6 sprint MVP plan.',
    ],
  },
  {
    id: 'requirements',
    pill: 'Requirements',
    status: 'Reviewed',
    confidence: '97%',
    tokens: '2.6k',
    actions: ['SRS', 'NFRs', 'Traceability'],
    lines: [
      '47 requirements generated across functional and non-functional groups.',
      'Performance target: P95 response time under 300ms at 2k concurrent users.',
      'Accessibility scope includes WCAG 2.1 AA for primary user journeys.',
    ],
  },
  {
    id: 'architecture',
    pill: 'Architecture',
    status: 'Ready',
    confidence: '91%',
    tokens: '2.1k',
    actions: ['Services', 'Data model', 'APIs'],
    lines: [
      'Recommended split: React frontend, Django API, PostgreSQL core store.',
      'Queue-backed notifications isolate spikes from transactional traffic.',
      'Deployment topology supports staging parity and blue-green rollout.',
    ],
  },
  {
    id: 'testing',
    pill: 'Testing',
    status: 'Drafted',
    confidence: '89%',
    tokens: '1.5k',
    actions: ['Coverage', 'Test matrix', 'Release gates'],
    lines: [
      'Coverage target set to 85% for domain logic and integration boundaries.',
      'Regression suite prioritizes payments, permissions, and project exports.',
      'Release gate blocks production if smoke, security, or migration checks fail.',
    ],
  },
];

function useTypewriter(text: string, active = true, charsPerSecond = 42) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!active) {
      setDisplay('');
      return undefined;
    }

    let frame = 0;
    let start = 0;

    const tick = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const nextLength = Math.min(text.length, Math.floor((elapsed / 1000) * charsPerSecond));
      setDisplay(text.slice(0, nextLength));
      if (nextLength < text.length) frame = requestAnimationFrame(tick);
    };

    setDisplay('');
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, charsPerSecond, text]);

  return display;
}

const MetricCounter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
}> = ({ value, prefix = '', suffix = '', decimals = 0, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => latest.toFixed(decimals));
  const [display, setDisplay] = useState(`0${suffix}`);

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(motionValue, value, { duration: 1.1, ease: EASE_OUT });
    return () => controls.stop();
  }, [inView, motionValue, value]);

  useEffect(() => {
    return rounded.on('change', (latest) => {
      setDisplay(`${prefix}${latest}${suffix}`);
    });
  }, [prefix, rounded, suffix]);

  return (
    <div ref={ref} className="lp-stat-block">
      <div className="lp-stat-value">{display}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
};

const ProductDemoCard: React.FC = () => {
  const brief = useTypewriter(
    'Build a collaboration platform for student capstone teams with role-based access, document exports, planning workflows, and deployment guidance.',
    true,
    44,
  );
  const [visibleLineCount, setVisibleLineCount] = useState(0);

  useEffect(() => {
    setVisibleLineCount(0);
    const interval = window.setInterval(() => {
      setVisibleLineCount((current) => {
        if (current >= HERO_REQUIREMENTS.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 550);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="lp-demo-shell">
      <div className="lp-demo-chrome">
        <span />
        <span />
        <span />
      </div>
      <div className="lp-demo-body">
        <div className="lp-demo-label">// project brief</div>
        <div className="lp-demo-brief">
          {brief}
          <span className="lp-cursor" />
        </div>

        <div className="lp-demo-divider" />

        <div className="lp-demo-header-row">
          <span className="lp-demo-label">generated outputs</span>
          <span className="lp-demo-badge">live stream</span>
        </div>

        <div className="lp-demo-stream">
          <AnimatePresence initial={false}>
            {HERO_REQUIREMENTS.slice(0, visibleLineCount).map((line) => (
              <m.div
                key={line}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="lp-demo-line"
              >
                <span className="lp-demo-dot" />
                <span>{line}</span>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [navSolid, setNavSolid] = useState(false);
  const [activePhase, setActivePhase] = useState(PHASE_STEPS[0].id);
  const activePhaseData = useMemo(
    () => PHASE_STEPS.find((step) => step.id === activePhase) || PHASE_STEPS[0],
    [activePhase],
  );

  useEffect(() => {
    const handleScroll = () => setNavSolid(window.scrollY > 80);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const phasePreview = useTypewriter(activePhaseData.lines.join(' '), true, 52);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="lp-page"
    >
      <style>{`
        .lp-page {
          --lp-navy: #0D1B2A;
          --lp-navy-deep: #111f30;
          --lp-navy-darkest: #050D16;
          --lp-surface: rgba(17,31,48,0.88);
          --lp-surface-2: rgba(21,37,56,0.92);
          --lp-border: rgba(26,111,212,0.18);
          --lp-blue: #1A6FD4;
          --lp-blue-soft: #3d8fe0;
          --lp-orange: #F97316;
          --lp-orange-soft: #fb9042;
          --lp-text: #E8EDF5;
          --lp-muted: #8899AA;
          --lp-faint: #4a6070;
          min-height: 100vh;
          color: var(--lp-text);
          background:
            radial-gradient(circle at 8% 10%, rgba(249,115,22,0.16), transparent 24%),
            radial-gradient(circle at 84% 14%, rgba(26,111,212,0.14), transparent 28%),
            radial-gradient(circle at 68% 62%, rgba(61,143,224,0.08), transparent 30%),
            linear-gradient(180deg, var(--lp-navy-darkest) 0%, var(--lp-navy) 38%, #101f31 100%);
          position: relative;
          overflow-x: hidden;
        }
        .lp-page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.32;
          background-image:
            radial-gradient(rgba(17,33,67,0.08) 1px, transparent 1px);
          background-size: 18px 18px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.05) 35%, transparent 85%);
        }
        .lp-shell {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 120;
          transition: background 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
        }
        .lp-nav-inner {
          width: min(1180px, calc(100% - 28px));
          margin: 14px auto 0;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-radius: 999px;
          border: 1px solid var(--lp-border);
          background: rgba(13,27,42,0.82);
          backdrop-filter: blur(18px) saturate(180%);
          box-shadow: 0 18px 50px rgba(0,0,0,0.24);
        }
        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }
        .lp-nav-link {
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--lp-muted);
        }
        .lp-cta-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          padding: 12px 20px;
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, var(--lp-orange), var(--lp-orange-soft) 42%, var(--lp-blue) 100%);
          box-shadow: 0 14px 32px rgba(26,111,212,0.18);
        }
        .lp-section {
          padding: 100px 0;
        }
        .lp-hero {
          padding-top: 148px;
          padding-bottom: 88px;
        }
        .lp-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: 48px;
          align-items: center;
        }
        .lp-hero-copy {
          max-width: 590px;
        }
        .lp-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lp-faint);
        }
        .lp-display {
          font-family: 'Syne', sans-serif;
          font-size: clamp(48px, 6vw, 82px);
          line-height: 1.02;
          letter-spacing: -0.04em;
          font-weight: 700;
          color: var(--lp-text);
          margin: 18px 0 20px;
        }
        .lp-gradient-word {
          background: linear-gradient(135deg, var(--lp-blue) 0%, var(--lp-blue-soft) 58%, var(--lp-orange) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-hero-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px;
          line-height: 1.72;
          color: var(--lp-muted);
          max-width: 560px;
        }
        .lp-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 28px;
        }
        .lp-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 999px;
          border: 1px solid var(--lp-border);
          background: rgba(17,31,48,0.84);
          color: var(--lp-text);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
        }
        .lp-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 24px;
          color: var(--lp-faint);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
        }
        .lp-hero-visual {
          position: relative;
        }
        .lp-hero-visual::before {
          content: '';
          position: absolute;
          inset: 10% -10% -8% 16%;
          background: radial-gradient(circle, rgba(26,111,212,0.24), transparent 62%);
          filter: blur(30px);
          pointer-events: none;
        }
        .lp-demo-shell {
          position: relative;
          border-radius: 28px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(249,115,22,0.58), rgba(26,111,212,0.42), rgba(61,143,224,0.4));
          box-shadow: 0 34px 80px rgba(13,27,42,0.14);
        }
        .lp-demo-shell::after {
          content: '';
          position: absolute;
          inset: 18px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.14);
          pointer-events: none;
        }
        .lp-demo-chrome {
          display: flex;
          gap: 8px;
          padding: 18px 20px 0;
        }
        .lp-demo-chrome span {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.7);
        }
        .lp-demo-body {
          margin: 12px;
          border-radius: 22px;
          background:
            linear-gradient(180deg, rgba(13,27,42,0.96), rgba(17,31,48,0.94));
          padding: 22px;
          color: #edf3ff;
        }
        .lp-demo-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(220,229,255,0.58);
        }
        .lp-demo-brief {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          min-height: 104px;
          margin-top: 14px;
          color: #f9fbff;
        }
        .lp-cursor {
          display: inline-block;
          width: 9px;
          height: 18px;
          margin-left: 3px;
          border-radius: 2px;
          background: linear-gradient(180deg, var(--lp-orange), var(--lp-blue));
          animation: lpBlink 0.9s ease-in-out infinite;
          vertical-align: text-bottom;
        }
        .lp-demo-divider {
          height: 1px;
          margin: 18px 0 16px;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0));
        }
        .lp-demo-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .lp-demo-badge {
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #fdb07a;
        }
        .lp-demo-stream {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 188px;
        }
        .lp-demo-line {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(237,243,255,0.88);
        }
        .lp-demo-dot {
          width: 10px;
          height: 10px;
          margin-top: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(135deg, var(--lp-orange), var(--lp-blue));
        }
        .lp-marquee-wrap {
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
        }
        .lp-marquee-track {
          display: flex;
          width: max-content;
          animation: lpMarquee 24s linear infinite;
        }
        .lp-marquee-item {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--lp-faint);
          padding-right: 44px;
          white-space: nowrap;
        }
        .lp-section-head {
          max-width: 620px;
          margin-bottom: 34px;
        }
        .lp-section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(30px, 3.6vw, 52px);
          line-height: 1.04;
          letter-spacing: -0.03em;
          color: var(--lp-text);
          margin: 14px 0 14px;
        }
        .lp-section-copy {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          line-height: 1.72;
          color: var(--lp-muted);
        }
        .lp-bento-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 1px;
          background: linear-gradient(180deg, rgba(26,111,212,0.18), rgba(249,115,22,0.18));
          border: 1px solid var(--lp-border);
          border-radius: 28px;
          padding: 1px;
          overflow: hidden;
        }
        .lp-bento-card {
          background:
            linear-gradient(180deg, rgba(17,31,48,0.96), rgba(21,37,56,0.96));
          padding: 26px;
          min-height: 170px;
        }
        .lp-bento-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lp-faint);
        }
        .lp-bento-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          letter-spacing: -0.03em;
          color: var(--lp-text);
          margin: 12px 0 12px;
        }
        .lp-mini-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .lp-mini-pill {
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(26,111,212,0.14);
          border: 1px solid rgba(26,111,212,0.22);
          color: var(--lp-blue-soft);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
        }
        .lp-node-map {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 82px;
        }
        .lp-node-map svg {
          width: 100%;
          max-width: 180px;
          height: 82px;
        }
        .lp-stepper-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
          gap: 22px;
          align-items: start;
        }
        .lp-pill-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }
        .lp-pill-row::-webkit-scrollbar {
          display: none;
        }
        .lp-pill {
          border: 1px solid var(--lp-border);
          background: rgba(17,31,48,0.84);
          padding: 11px 16px;
          border-radius: 999px;
          cursor: pointer;
          color: var(--lp-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }
        .lp-pill-active {
          background: linear-gradient(135deg, var(--lp-blue), var(--lp-blue-soft));
          color: #fff;
          border-color: transparent;
          box-shadow: 0 16px 34px rgba(26,111,212,0.22);
        }
        .lp-phase-panel {
          margin-top: 18px;
          border-radius: 26px;
          padding: 24px;
          background: rgba(17,31,48,0.88);
          border: 1px solid var(--lp-border);
          box-shadow: 0 24px 56px rgba(0,0,0,0.22);
        }
        .lp-phase-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 18px;
        }
        .lp-phase-stream {
          min-height: 178px;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(13,27,42,0.96), rgba(17,31,48,0.96));
          border: 1px solid var(--lp-border);
          padding: 20px;
        }
        .lp-phase-meta {
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(17,31,48,0.95), rgba(21,37,56,0.95));
          border: 1px solid var(--lp-border);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lp-meta-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--lp-muted);
        }
        .lp-meta-value {
          font-weight: 700;
          color: var(--lp-text);
        }
        .lp-action-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(13,27,42,0.84);
          border: 1px solid var(--lp-border);
          color: var(--lp-muted);
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .lp-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 30px;
        }
        .lp-step-card {
          padding-top: 16px;
          border-top: 1px solid rgba(26,111,212,0.12);
          position: relative;
        }
        .lp-step-number {
          font-family: 'DM Mono', monospace;
          font-size: 46px;
          line-height: 1;
          color: rgba(26,111,212,0.16);
          margin-bottom: 12px;
        }
        .lp-step-title {
          font-family: 'Syne', sans-serif;
          font-size: 30px;
          letter-spacing: -0.03em;
          color: var(--lp-text);
          margin-bottom: 10px;
        }
        .lp-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-top: 1px solid rgba(26,111,212,0.12);
          border-bottom: 1px solid rgba(26,111,212,0.12);
        }
        .lp-stat-block {
          padding: 28px 20px;
          text-align: center;
          border-right: 1px solid rgba(26,111,212,0.12);
        }
        .lp-stat-block:last-child {
          border-right: none;
        }
        .lp-stat-value {
          font-family: 'DM Mono', monospace;
          font-size: clamp(34px, 5vw, 56px);
          color: var(--lp-text);
        }
        .lp-stat-label {
          margin-top: 10px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--lp-faint);
        }
        .lp-cta-panel {
          text-align: center;
          padding: 72px 24px;
          border-radius: 36px;
          border: 1px solid var(--lp-border);
          background:
            radial-gradient(circle at 50% 0%, rgba(26,111,212,0.22), transparent 46%),
            linear-gradient(180deg, rgba(13,27,42,0.96), rgba(17,31,48,0.96));
          box-shadow: 0 28px 64px rgba(0,0,0,0.24);
        }
        .lp-footer {
          padding: 0 0 56px;
        }
        .lp-footer-shell {
          border-top: 1px solid rgba(26,111,212,0.12);
          padding-top: 26px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .lp-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .lp-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
        }
        .lp-footer-link,
        .lp-footer-copy {
          border: none;
          background: transparent;
          padding: 0;
          color: var(--lp-faint);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        @keyframes lpBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes lpMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (max-width: 1080px) {
          .lp-hero-grid,
          .lp-stepper-shell,
          .lp-phase-grid {
            grid-template-columns: 1fr;
          }
          .lp-bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .lp-bento-card {
            grid-column: auto !important;
            grid-row: auto !important;
            min-height: auto;
          }
          .lp-steps-grid,
          .lp-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .lp-stat-block:nth-child(2) {
            border-right: none;
          }
        }
        @media (max-width: 760px) {
          .lp-shell {
            width: min(100% - 24px, 1180px);
          }
          .lp-nav-inner {
            margin-top: 10px;
            border-radius: 24px;
            padding: 14px 16px;
            flex-wrap: wrap;
          }
          .lp-nav-links {
            order: 3;
            width: 100%;
            justify-content: space-between;
            gap: 14px;
          }
          .lp-section {
            padding: 72px 0;
          }
          .lp-hero {
            padding-top: 138px;
            padding-bottom: 56px;
          }
          .lp-display {
            font-size: clamp(40px, 15vw, 64px);
          }
          .lp-demo-shell {
            border-radius: 24px;
          }
          .lp-bento-grid,
          .lp-steps-grid,
          .lp-stats-grid {
            grid-template-columns: 1fr;
          }
          .lp-stat-block {
            border-right: none;
            border-bottom: 1px solid rgba(26,111,212,0.12);
          }
          .lp-stat-block:last-child {
            border-bottom: none;
          }
          .lp-phase-panel {
            padding: 18px;
          }
          .lp-footer-row {
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="lp-nav">
        <div
          className="lp-nav-inner"
          style={navSolid ? { background: 'rgba(13,27,42,0.92)', borderColor: 'rgba(26,111,212,0.22)', boxShadow: '0 18px 56px rgba(0,0,0,0.3)' } : undefined}
        >
          <button
            onClick={() => scrollToId('top')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Go to top"
          >
            <AcornLogo height={34} />
          </button>

          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={() => scrollToId('how-it-works')}>How it works</button>
            <button className="lp-nav-link" onClick={() => scrollToId('phases')}>Phases</button>
            <button className="lp-nav-link" onClick={() => navigate('/docs')}>Docs</button>
            <button className="lp-nav-link" onClick={() => navigate('/login')}>Sign in</button>
          </div>

          <button className="lp-cta-pill" onClick={() => navigate('/register')}>
            Start Building <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <section id="top" className="lp-section lp-hero">
        <div className="lp-shell">
          <div className="lp-hero-grid">
            <div className="lp-hero-copy">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
                className="lp-label"
              >
                // AI-powered sdlc platform
              </m.div>

              <m.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: EASE_OUT }}
                className="lp-display"
              >
                From brief
                <br />
                to <span className="lp-gradient-word">production.</span>
              </m.h1>

              <m.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.45, ease: EASE_OUT }}
                className="lp-hero-body"
              >
                Paste a project brief. Get requirements, architecture, task boards, cost estimates,
                export-ready documents, and delivery guidance in one connected workspace.
              </m.p>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45, ease: EASE_OUT }}
                className="lp-hero-actions"
              >
                <button className="lp-cta-pill" onClick={() => navigate('/register')}>
                  Start Building <ArrowRight size={16} />
                </button>
                <button className="lp-secondary-btn" onClick={() => scrollToId('phases')}>
                  See how it works <ChevronRight size={16} />
                </button>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.45, ease: EASE_OUT }}
                className="lp-trust"
              >
                <span><Check size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />No setup</span>
                <span><Check size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />Real output, not mockups</span>
                <span><Check size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />All 13 SDLC phases</span>
              </m.div>
            </div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.55, ease: EASE_OUT }}
              className="lp-hero-visual"
            >
              <ProductDemoCard />
            </m.div>
          </div>
        </div>
      </section>

      <section className="lp-section" style={{ paddingTop: 0, paddingBottom: 24 }}>
        <div className="lp-shell" style={{ textAlign: 'center' }}>
          <div className="lp-label" style={{ marginBottom: 18 }}>Trusted by engineering teams</div>
          <div className="lp-marquee-wrap">
            <div className="lp-marquee-track">
              {[...PARTNERS, ...PARTNERS].map((name, index) => (
                <span key={`${name}-${index}`} className="lp-marquee-item">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="lp-section">
        <div className="lp-shell">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -60px 0px' }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="lp-section-head"
          >
            <div className="lp-label">// how it works</div>
            <h2 className="lp-section-title">One brief. Full delivery motion.</h2>
            <p className="lp-section-copy">
              The landing page now leads with the product itself: structured inputs, generated plans,
              connected phases, and a cleaner visual rhythm instead of generic AI-site patterns.
            </p>
          </m.div>

          <div className="lp-bento-grid">
            {BENTO_CARDS.map((card, index) => (
              <m.div
                key={card.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: EASE_OUT }}
                className="lp-bento-card"
                style={{ gridColumn: card.span, gridRow: card.row }}
              >
                <div className="lp-bento-label">{card.label}</div>
                <div className="lp-bento-title">{card.title}</div>

                {card.id === 'brief' && (
                  <>
                    <p className="lp-section-copy" style={{ fontSize: 15 }}>
                      GP2 turns messy project context into structured planning artifacts without making the UI feel synthetic.
                    </p>
                    <div className="lp-demo-line" style={{ marginTop: 18, color: 'var(--lp-muted)' }}>
                      <span className="lp-demo-dot" />
                      <span>Multi-role collaboration platform for capstone project delivery.</span>
                    </div>
                  </>
                )}

                {card.id === 'reqs' && (
                  <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
                    <div>
                      <div className="lp-label" style={{ color: 'var(--lp-orange)' }}>confidence</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, color: 'var(--lp-text)' }}>92%</div>
                    </div>
                    <div>
                      <div className="lp-label" style={{ color: 'var(--lp-blue)' }}>requirements</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, color: 'var(--lp-text)' }}>47</div>
                    </div>
                  </div>
                )}

                {card.id === 'stack' && (
                  <div className="lp-mini-pill-row" style={{ marginTop: 16 }}>
                    <span className="lp-mini-pill">React</span>
                    <span className="lp-mini-pill">Django</span>
                    <span className="lp-mini-pill">PostgreSQL</span>
                  </div>
                )}

                {card.id === 'arch' && (
                  <div className="lp-node-map">
                    <svg viewBox="0 0 180 82" fill="none">
                      <path d="M30 42h55M96 24l26 18M96 60l26-18" stroke="rgba(26,111,212,0.52)" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="28" cy="42" r="10" fill="#F97316" />
                      <circle cx="88" cy="24" r="10" fill="#1A6FD4" />
                      <circle cx="88" cy="60" r="10" fill="#3d8fe0" />
                      <circle cx="132" cy="42" r="12" fill="#0D1B2A" opacity="0.9" />
                    </svg>
                  </div>
                )}

                {card.id === 'design' && (
                  <div className="lp-mini-pill-row" style={{ marginTop: 16 }}>
                    <span className="lp-mini-pill" style={{ background: '#0D1B2A', color: '#fff' }}>#0D1B2A</span>
                    <span className="lp-mini-pill" style={{ background: '#1A6FD4', color: '#fff' }}>#1A6FD4</span>
                    <span className="lp-mini-pill" style={{ background: '#F97316', color: '#fff' }}>#F97316</span>
                    <span className="lp-mini-pill" style={{ background: '#3d8fe0', color: '#fff' }}>#3D8FE0</span>
                  </div>
                )}

                {card.id === 'plan' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                    {['Discovery', 'Scope', 'Build', 'QA'].map((bar, idx) => (
                      <div key={bar} style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: 12, alignItems: 'center' }}>
                        <span className="lp-label" style={{ color: 'var(--lp-faint)' }}>{bar}</span>
                        <div style={{ height: 10, borderRadius: 999, background: 'rgba(26,111,212,0.12)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${[28, 46, 82, 52][idx]}%`,
                              height: '100%',
                              borderRadius: 999,
                              background: 'linear-gradient(90deg, #F97316, #1A6FD4)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {card.id === 'cost' && (
                  <div style={{ marginTop: 18, fontFamily: "'DM Mono', monospace", fontSize: 28, color: 'var(--lp-orange)' }}>
                    $86,700 estimated
                  </div>
                )}

                {card.id === 'risk' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                    {[
                      ['Delivery dependencies', '#F97316'],
                      ['Scope churn risk', '#1A6FD4'],
                    ].map(([text, color]) => (
                      <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--lp-muted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color as string }} />
                        {text}
                      </div>
                    ))}
                  </div>
                )}

                {card.id === 'test' && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, color: 'var(--lp-text)' }}>85%</div>
                    <div className="lp-section-copy" style={{ fontSize: 14 }}>coverage target</div>
                  </div>
                )}

                {card.id === 'deploy' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 20, color: 'var(--lp-muted)', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                    <span>CI</span>
                    <ChevronRight size={14} />
                    <span>Staging</span>
                    <ChevronRight size={14} />
                    <span>Prod</span>
                  </div>
                )}
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section id="phases" className="lp-section">
        <div className="lp-shell">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -60px 0px' }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="lp-section-head"
          >
            <div className="lp-label">// phase stepper</div>
            <h2 className="lp-section-title">Preview the workflow before users log in.</h2>
            <p className="lp-section-copy">
              This keeps the landing page product-first. Each pill exposes a real phase outcome instead of a marketing card wall.
            </p>
          </m.div>

          <div className="lp-stepper-shell">
            <div>
              <div className="lp-pill-row">
                {PHASE_STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setActivePhase(step.id)}
                    className={`lp-pill${step.id === activePhase ? ' lp-pill-active' : ''}`}
                  >
                    {step.pill}
                  </button>
                ))}
              </div>

              <div className="lp-phase-panel">
                <AnimatePresence mode="wait">
                  <m.div
                    key={activePhaseData.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="lp-phase-grid"
                  >
                    <div className="lp-phase-stream">
                      <div className="lp-label" style={{ marginBottom: 12 }}>streaming output</div>
                      <div className="lp-section-copy" style={{ color: 'var(--lp-muted)' }}>
                        {phasePreview}
                        <span className="lp-cursor" style={{ width: 8, height: 16 }} />
                      </div>
                    </div>

                    <div className="lp-phase-meta">
                      <div className="lp-label">metadata</div>
                      <div className="lp-meta-row">
                        <span>Status</span>
                        <span className="lp-meta-value">{activePhaseData.status}</span>
                      </div>
                      <div className="lp-meta-row">
                        <span>Confidence</span>
                        <span className="lp-meta-value">{activePhaseData.confidence}</span>
                      </div>
                      <div className="lp-meta-row">
                        <span>Token count</span>
                        <span className="lp-meta-value">{activePhaseData.tokens}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {activePhaseData.actions.map((action) => (
                          <span key={action} className="lp-action-chip">{action}</span>
                        ))}
                      </div>
                    </div>
                  </m.div>
                </AnimatePresence>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { icon: ClipboardList, title: 'Brief in', copy: 'Start with loose notes, a pasted brief, or an already-scoped idea.' },
                { icon: Layers, title: 'Phases connected', copy: 'Outputs stay linked across requirements, planning, costs, and release prep.' },
                { icon: Rocket, title: 'Ship-ready artifacts', copy: 'Export the work into documents, boards, and operational next steps.' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06, duration: 0.4, ease: EASE_OUT }}
                    style={{
                      padding: 22,
                      borderRadius: 22,
                      background: 'rgba(17,31,48,0.86)',
                      border: '1px solid rgba(26,111,212,0.18)',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(249,115,22,0.16), rgba(26,111,212,0.16))', marginBottom: 16 }}>
                      <Icon size={18} color="#3d8fe0" />
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, letterSpacing: '-0.03em', color: 'var(--lp-text)', marginBottom: 8 }}>{item.title}</div>
                    <div className="lp-section-copy" style={{ fontSize: 15 }}>{item.copy}</div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-shell">
          <div className="lp-steps-grid">
            {[
              ['01', 'Write your brief', 'Bring rough notes, project goals, or stakeholder asks. The system is designed to absorb messy starting points.'],
              ['02', 'AI builds the SDLC', 'Phases generate in sequence so requirements, planning, architecture, and delivery stay coherent together.'],
              ['03', 'Ship with confidence', 'Export the artifacts, validate the plan, and move into execution with less translation overhead.'],
            ].map(([num, title, copy], index) => (
              <m.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                transition={{ delay: index * 0.06, duration: 0.4, ease: EASE_OUT }}
                className="lp-step-card"
              >
                <div className="lp-step-number">{num}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-section-copy">{copy}</div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" style={{ paddingTop: 24 }}>
        <div className="lp-shell">
          <div className="lp-stats-grid">
            <MetricCounter value={13} label="SDLC phases covered" />
            <MetricCounter value={47} suffix="+" label="Avg. requirements generated" />
            <MetricCounter value={3} prefix="< " label="Avg. full generation time (min)" />
            <MetricCounter value={100} suffix="%" label="Real output, not templates" />
          </div>
        </div>
      </section>

      <section id="cta" className="lp-section">
        <div className="lp-shell">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -60px 0px' }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="lp-cta-panel"
          >
            <div className="lp-label" style={{ marginBottom: 16 }}>Ready when you are</div>
            <div className="lp-display" style={{ fontSize: 'clamp(42px, 6vw, 72px)', margin: 0 }}>
              Ready to ship faster?
            </div>
            <p className="lp-section-copy" style={{ maxWidth: 560, margin: '16px auto 28px' }}>
              Your first project is free. Start with the landing experience, then carry the same visual confidence into the workspace.
            </p>
            <button className="lp-cta-pill" onClick={() => navigate('/register')}>
              Start Building <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="lp-footer-link"
              style={{ display: 'block', margin: '18px auto 0', cursor: 'pointer' }}
            >
              Or explore the docs →
            </button>
          </m.div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-shell">
            <div className="lp-footer-row">
              <AcornLogo height={30} />
              <div className="lp-footer-links">
                <button className="lp-footer-link" onClick={() => navigate('/docs')}>Docs</button>
                <button className="lp-footer-link" onClick={() => window.open('https://github.com', '_blank', 'noopener,noreferrer')}>GitHub</button>
                <button className="lp-footer-link">Privacy</button>
                <button className="lp-footer-link">Terms</button>
              </div>
            </div>
            <div className="lp-footer-row">
              <span className="lp-footer-copy">© 2026 Acorn</span>
              <span className="lp-footer-copy">Built with the GP2 SDLC platform</span>
            </div>
          </div>
        </div>
      </footer>
    </m.div>
  );
};

export default LandingPage;
