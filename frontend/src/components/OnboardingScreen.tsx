import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, FileText, Download, Zap, Shield, Clock, GitBranch, Layers } from 'lucide-react';
import { AcornLogo } from './AcornLogo';

interface OnboardingScreenProps {
  onDone: () => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

const TIMELINE_PHASES = [
  { num: 1,  label: 'Planning',          desc: 'Define scope, team, and objectives',         color: '#F97316' },
  { num: 2,  label: 'Requirements',      desc: 'Generate IEEE-compliant SRS automatically',  color: '#1A6FD4' },
  { num: 3,  label: 'Architecture',      desc: 'System design and component diagrams',       color: '#F97316' },
  { num: 4,  label: 'Development Plan',  desc: 'Sprint plans, tasks, and effort estimates',  color: '#1A6FD4' },
];

const Slide1: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
      <div style={{
        width: '96px', height: '96px',
        borderRadius: '26px',
        background: 'rgba(249,115,22,0.12)',
        border: '1.5px solid rgba(249,115,22,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 60px rgba(249,115,22,0.18)',
      }}>
        <AcornLogo variant="mark" height={60} width={60} />
      </div>
    </div>

    <p style={{
      fontSize: '11px',
      color: '#F97316',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '16px',
    }}>
      Welcome to Acorn
    </p>

    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(28px, 6vw, 50px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.08,
      marginBottom: '18px',
    }}>
      AI-powered SDLC planning
    </h1>

    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(15px, 2.2vw, 18px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.7,
      marginBottom: '32px',
    }}>
      Idea to production-ready plan in minutes.
    </p>

    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      justifyContent: 'center',
    }}>
      {[
        { icon: Zap,    label: 'AI-generated specs'    },
        { icon: Shield, label: 'Structured & auditable' },
        { icon: Clock,  label: 'Minutes, not weeks'    },
      ].map(({ icon: Icon, label }) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '8px 16px',
          borderRadius: '999px',
          background: 'rgba(26,111,212,0.1)',
          border: '1px solid rgba(26,111,212,0.25)',
          color: '#8BB8E8',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <Icon size={13} color="#1A6FD4" />
          {label}
        </div>
      ))}
    </div>
  </div>
);

const Slide2: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
    <p style={{
      fontSize: '11px',
      color: '#F97316',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '14px',
    }}>
      Complete lifecycle coverage
    </p>

    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(26px, 5.5vw, 44px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      marginBottom: '10px',
    }}>
      11 AI-driven phases
    </h1>

    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(13px, 1.8vw, 16px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.6,
      marginBottom: '30px',
    }}>
      Every stage of your project lifecycle — automated end-to-end.
    </p>

    <div style={{ position: 'relative', textAlign: 'left' }}>
      {TIMELINE_PHASES.map((phase, i) => (
        <div key={phase.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              background: `${phase.color}18`,
              border: `2px solid ${phase.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              color: phase.color,
              flexShrink: 0,
              zIndex: 1,
            }}>
              {phase.num}
            </div>
            {i < TIMELINE_PHASES.length - 1 && (
              <div style={{
                width: '2px',
                flex: 1,
                minHeight: '28px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                margin: '4px 0',
              }} />
            )}
          </div>

          <div style={{
            flex: 1,
            paddingLeft: '16px',
            paddingBottom: i < TIMELINE_PHASES.length - 1 ? '20px' : '0',
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(14px, 2vw, 16px)',
              color: '#E8EDF5',
              marginBottom: '4px',
            }}>
              {phase.label}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(12px, 1.6vw, 14px)',
              color: '#7788AA',
              lineHeight: 1.5,
            }}>
              {phase.desc}
            </div>
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '16px',
        paddingLeft: '52px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: '#556677',
        fontStyle: 'italic',
      }}>
        + 7 more phases: Risk, Testing, Deployment, Maintenance & more
      </div>
    </div>
  </div>
);

const Slide3: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto' }}>
    <p style={{
      fontSize: '11px',
      color: '#F97316',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '14px',
    }}>
      Ready to ship
    </p>

    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(26px, 5.5vw, 44px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      marginBottom: '14px',
    }}>
      Export &amp; collaborate
    </h1>

    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(13px, 1.8vw, 17px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.65,
      marginBottom: '30px',
    }}>
      PDF, Markdown, Confluence &amp; Jira.
      Structured specs your whole team can use.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
      {[
        { icon: FileText,  label: 'PDF Report',   color: '#F97316', desc: 'Polished stakeholder-ready document'    },
        { icon: Download,  label: 'Markdown',      color: '#1A6FD4', desc: 'Developer-friendly plain-text format'   },
        { icon: GitBranch, label: 'Jira Export',   color: '#0065FF', desc: 'Import tickets straight into your board' },
        { icon: Layers,    label: 'Confluence',    color: '#0052CC', desc: 'Publish specs to your team wiki instantly' },
      ].map(({ icon: Icon, label, color, desc }) => (
        <div key={label} style={{
          padding: '16px 18px',
          borderRadius: '14px',
          background: 'rgba(20,38,60,0.75)',
          border: `1px solid ${color}33`,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: '38px', height: '38px',
            borderRadius: '10px',
            background: `${color}18`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '10px',
          }}>
            <Icon size={17} color={color} />
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '14px',
            color: '#E8EDF5',
            marginBottom: '4px',
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            color: '#7788AA',
            lineHeight: 1.5,
          }}>
            {desc}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SLIDES = [Slide1, Slide2, Slide3];
const SLIDE_COUNT = SLIDES.length;
const WARP_STREAK_COUNT = 20;

interface WarpOverlayProps {
  active: boolean;
}

const WarpOverlay: React.FC<WarpOverlayProps> = ({ active }) => {
  const streaks = useMemo(() =>
    Array.from({ length: WARP_STREAK_COUNT }, (_, i) => ({
      angle: (i / WARP_STREAK_COUNT) * 360,
      delay: Math.floor(i / 4) * 30,
      length: 55 + (i % 4) * 18,
      thickness: i % 5 === 0 ? 2 : 1,
      opacity: 0.25 + (i % 4) * 0.12,
      isOrange: i % 3 === 0,
    })), []);

  if (!active) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex: 10,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        width: '240px', height: '240px',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, rgba(26,111,212,0.15) 45%, transparent 70%)',
        animation: 'warpGlow 0.65s ease-out forwards',
      }} />

      {streaks.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${s.length}vmax`,
            height: `${s.thickness}px`,
            transformOrigin: '0% 50%',
            ['--angle' as string]: `${s.angle}deg`,
            background: s.isOrange
              ? 'linear-gradient(to right, rgba(249,115,22,0.9), rgba(249,115,22,0.1), transparent)'
              : 'linear-gradient(to right, rgba(200,225,255,0.7), rgba(26,111,212,0.2), transparent)',
            animation: `warpStreak 0.65s cubic-bezier(0.22,1,0.36,1) ${s.delay}ms forwards`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const [visible, setVisible] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [warpActive, setWarpActive] = useState(false);
  const [slideVisible, setSlideVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const advancingRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const advanceSlide = () => {
    if (advancingRef.current) return;
    const next = slideIdx + 1;
    if (next >= SLIDE_COUNT) {
      onDone();
      return;
    }
    advancingRef.current = true;

    if (reducedMotion) {
      setSlideVisible(false);
      setTimeout(() => {
        setSlideIdx(next);
        setSlideVisible(true);
        advancingRef.current = false;
      }, 200);
    } else {
      setSlideVisible(false);
      setWarpActive(true);
      setTimeout(() => {
        setSlideIdx(next);
      }, 300);
      setTimeout(() => {
        setWarpActive(false);
        setSlideVisible(true);
        advancingRef.current = false;
      }, 650);
    }
  };

  const CurrentSlide = SLIDES[slideIdx];
  const isLast = slideIdx === SLIDE_COUNT - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(20px, 4vw, 60px) clamp(16px, 4vw, 48px)',
        background: '#070C14',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(800px circle at 25% 35%, rgba(26,111,212,0.07), transparent 55%), radial-gradient(600px circle at 75% 65%, rgba(249,115,22,0.05), transparent 55%)',
      }} />

      <WarpOverlay active={warpActive && !reducedMotion} />

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '720px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: slideVisible ? 1 : 0,
          transform: slideVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: reducedMotion
            ? 'opacity 0.2s'
            : 'opacity 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <CurrentSlide />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
          paddingTop: '24px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slideIdx ? '26px' : '7px',
                height: '7px',
                borderRadius: '999px',
                background: i === slideIdx ? '#F97316' : 'rgba(255,255,255,0.18)',
                transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), background 0.35s',
              }}
            />
          ))}
        </div>

        <button
          className="onboarding-cta"
          onClick={advanceSlide}
          style={{
            padding: '14px 44px',
            background: 'linear-gradient(135deg, #F97316, #cc4900)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 28px rgba(249,115,22,0.38)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            minHeight: '52px',
            touchAction: 'manipulation',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(249,115,22,0.55)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.38)';
          }}
        >
          {isLast ? 'Start building' : 'Next'}
          <ArrowRight size={18} />
        </button>

        {!isLast && (
          <button
            onClick={onDone}
            style={{
              background: 'none',
              border: 'none',
              color: '#4A5A6A',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              transition: 'color 0.2s',
              touchAction: 'manipulation',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8899AA'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4A5A6A'; }}
          >
            Skip intro
          </button>
        )}
      </div>

      <style>{`
        @keyframes warpStreak {
          0%   { transform: rotate(var(--angle, 0deg)) scaleX(0.01); opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: rotate(var(--angle, 0deg)) scaleX(1);    opacity: 0; }
        }

        @keyframes warpGlow {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
        }

        .onboarding-cta:active { transform: scale(0.97) !important; }

        @media (max-width: 639px) {
          .onboarding-cta {
            width: 100% !important;
            padding: 14px 24px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .warp-overlay,
          .warp-overlay * { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;
