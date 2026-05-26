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
  { num: 1,  label: 'Planning',          desc: 'Define scope, team, and objectives',         color: '#3d8fe0' },
  { num: 2,  label: 'Requirements',      desc: 'Generate IEEE-compliant SRS automatically',  color: '#1A6FD4' },
  { num: 3,  label: 'Architecture',      desc: 'System design and component diagrams',       color: '#3d8fe0' },
  { num: 4,  label: 'Development Plan',  desc: 'Sprint plans, tasks, and effort estimates',  color: '#1A6FD4' },
];

const Slide1: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
      <div style={{
        width: '88px', height: '88px',
        borderRadius: '24px',
        background: 'rgba(26,111,212,0.12)',
        border: '1.5px solid rgba(26,111,212,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 60px rgba(26,111,212,0.2)',
      }}>
        <AcornLogo variant="mark" height={56} width={56} />
      </div>
    </div>

    <p style={{
      fontSize: '11px',
      color: '#3d8fe0',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '14px',
    }}>
      Welcome to Acorn
    </p>

    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(26px, 5.5vw, 46px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.08,
      marginBottom: '16px',
    }}>
      AI-powered SDLC planning
    </h1>

    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(14px, 2vw, 17px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.7,
      marginBottom: '28px',
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
          <Icon size={13} color="#3d8fe0" />
          {label}
        </div>
      ))}
    </div>
  </div>
);

const Slide2: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
    <p style={{
      fontSize: '11px',
      color: '#3d8fe0',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '12px',
    }}>
      Complete lifecycle coverage
    </p>

    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(24px, 5vw, 40px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      marginBottom: '10px',
    }}>
      11 AI-driven phases
    </h1>

    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(13px, 1.8vw, 15px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.6,
      marginBottom: '24px',
    }}>
      Every stage of your project lifecycle — automated end-to-end.
    </p>

    <div style={{ position: 'relative', textAlign: 'left' }}>
      {TIMELINE_PHASES.map((phase, i) => (
        <div key={phase.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
            <div style={{
              width: '30px', height: '30px',
              borderRadius: '50%',
              background: `${phase.color}18`,
              border: `2px solid ${phase.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '12px',
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
                minHeight: '24px',
                background: 'linear-gradient(to bottom, rgba(26,111,212,0.25), rgba(26,111,212,0.06))',
                margin: '4px 0',
              }} />
            )}
          </div>

          <div style={{
            flex: 1,
            paddingLeft: '16px',
            paddingBottom: i < TIMELINE_PHASES.length - 1 ? '18px' : '0',
          }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(13px, 1.8vw, 15px)',
              color: '#E8EDF5',
              marginBottom: '3px',
            }}>
              {phase.label}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(12px, 1.5vw, 13px)',
              color: '#7788AA',
              lineHeight: 1.5,
            }}>
              {phase.desc}
            </div>
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '14px',
        paddingLeft: '52px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        color: '#4A5A6A',
        fontStyle: 'italic',
      }}>
        + 7 more phases: Risk, Testing, Deployment, Maintenance &amp; more
      </div>
    </div>
  </div>
);

const Slide3: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
    <p style={{
      fontSize: '11px',
      color: '#3d8fe0',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '12px',
    }}>
      Ready to ship
    </p>

    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(24px, 5vw, 40px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      marginBottom: '12px',
    }}>
      Export &amp; collaborate
    </h1>

    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(13px, 1.8vw, 16px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.65,
      marginBottom: '24px',
    }}>
      PDF, Markdown, Confluence &amp; Jira.
      Structured specs your whole team can use.
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
      {[
        { icon: FileText,  label: 'PDF Report',   color: '#3d8fe0', desc: 'Polished stakeholder-ready document'    },
        { icon: Download,  label: 'Markdown',      color: '#1A6FD4', desc: 'Developer-friendly plain-text format'   },
        { icon: GitBranch, label: 'Jira Export',   color: '#3d8fe0', desc: 'Import tickets straight into your board' },
        { icon: Layers,    label: 'Confluence',    color: '#1A6FD4', desc: 'Publish specs to your team wiki instantly' },
      ].map(({ icon: Icon, label, color, desc }) => (
        <div key={label} style={{
          padding: '14px 16px',
          borderRadius: '14px',
          background: 'rgba(13,27,42,0.6)',
          border: `1px solid ${color}30`,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '10px',
            background: `${color}18`,
            border: `1px solid ${color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '8px',
          }}>
            <Icon size={15} color={color} />
          </div>
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '13px',
            color: '#E8EDF5',
            marginBottom: '4px',
          }}>
            {label}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '11px',
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
      isBlue: i % 3 !== 0,
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
        background: 'radial-gradient(circle, rgba(26,111,212,0.4) 0%, rgba(61,143,224,0.15) 45%, transparent 70%)',
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
            background: s.isBlue
              ? 'linear-gradient(to right, rgba(61,143,224,0.9), rgba(26,111,212,0.2), transparent)'
              : 'linear-gradient(to right, rgba(200,225,255,0.7), rgba(26,111,212,0.15), transparent)',
            animation: `warpStreak 0.65s cubic-bezier(0.22,1,0.36,1) ${s.delay}ms forwards`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
};

const SWIPE_THRESHOLD = 60;
const VERTICAL_SWIPE_THRESHOLD = 80;

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const [visible, setVisible] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [warpActive, setWarpActive] = useState(false);
  const [slideVisible, setSlideVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();
  const advancingRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const transition = (toIdx: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    if (reducedMotion) {
      setSlideVisible(false);
      setTimeout(() => {
        setSlideIdx(toIdx);
        setSlideVisible(true);
        advancingRef.current = false;
      }, 200);
    } else {
      setSlideVisible(false);
      setWarpActive(true);
      setTimeout(() => {
        setSlideIdx(toIdx);
      }, 300);
      setTimeout(() => {
        setWarpActive(false);
        setSlideVisible(true);
        advancingRef.current = false;
      }, 650);
    }
  };

  const advanceSlide = () => {
    const next = slideIdx + 1;
    if (next >= SLIDE_COUNT) {
      onDone();
      return;
    }
    transition(next);
  };

  const retreatSlide = () => {
    if (slideIdx === 0) return;
    transition(slideIdx - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDy >= VERTICAL_SWIPE_THRESHOLD && absDy > absDx) {
      if (dy > 0) {
        onDone();
      } else {
        transition(0);
      }
      return;
    }

    if (absDx < SWIPE_THRESHOLD) return;
    if (dx < 0) {
      advanceSlide();
    } else {
      retreatSlide();
    }
  };

  const CurrentSlide = SLIDES[slideIdx];
  const isLast = slideIdx === SLIDE_COUNT - 1;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
      {/* Space background — stars + aurora */}
      <div className="splash-stars" aria-hidden style={{ position: 'absolute', zIndex: 0 }} />
      <div className="splash-aurora splash-aurora-blue" aria-hidden style={{ position: 'absolute', zIndex: 0 }} />
      <div className="splash-aurora splash-aurora-orange" aria-hidden style={{ position: 'absolute', zIndex: 0 }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        background:
          'radial-gradient(800px circle at 25% 35%, rgba(26,111,212,0.14), transparent 55%), radial-gradient(600px circle at 75% 65%, rgba(61,143,224,0.07), transparent 55%)',
      }} />

      <WarpOverlay active={warpActive && !reducedMotion} />

      {/* Frosted-glass card */}
      <div
        className="onboarding-card"
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '640px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Slide content area */}
        <div
          style={{
            opacity: slideVisible ? 1 : 0,
            transform: slideVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
            transition: reducedMotion
              ? 'opacity 0.2s'
              : 'opacity 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.42s cubic-bezier(0.22,1,0.36,1)',
            marginBottom: '28px',
          }}
        >
          <CurrentSlide />
        </div>

        {/* Controls: step dots + CTA + skip */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === slideIdx ? '26px' : '7px',
                  height: '7px',
                  borderRadius: '999px',
                  background: i === slideIdx ? '#1A6FD4' : 'rgba(255,255,255,0.18)',
                  boxShadow: i === slideIdx ? '0 0 8px rgba(26,111,212,0.6)' : 'none',
                  transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), background 0.35s, box-shadow 0.35s',
                }}
              />
            ))}
          </div>

          {/* Primary CTA — blue with shimmer */}
          <button
            className="onboarding-cta"
            onClick={advanceSlide}
          >
            <span className="onboarding-shimmer" aria-hidden />
            {isLast ? 'Start building' : 'Next'}
            <ArrowRight size={18} />
          </button>

          {!isLast && (
            <button
              onClick={onDone}
              className="onboarding-skip"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cardUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .onboarding-card {
          padding: clamp(28px, 4vw, 44px) clamp(24px, 4vw, 44px);
          background: rgba(13,27,42,0.78);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(26,111,212,0.25);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04);
          animation: cardUp 700ms cubic-bezier(0.22,1,0.36,1) both;
        }

        .onboarding-cta {
          position: relative;
          padding: 14px 44px;
          background: linear-gradient(135deg, #1A6FD4 0%, #3d8fe0 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 24px rgba(26,111,212,0.42);
          transition: transform 0.2s, box-shadow 0.25s;
          min-height: 52px;
          touch-action: manipulation;
          overflow: hidden;
        }

        .onboarding-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(26,111,212,0.58);
        }

        .onboarding-cta:active {
          transform: scale(0.97) !important;
        }

        .onboarding-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transition: left 0.55s ease;
          pointer-events: none;
        }

        .onboarding-cta:hover .onboarding-shimmer {
          left: 100%;
        }

        .onboarding-skip {
          background: none;
          border: none;
          color: #4A5A6A;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
          touch-action: manipulation;
        }

        .onboarding-skip:hover { color: #8899AA; }

        @keyframes warpStreak {
          0%   { transform: rotate(var(--angle, 0deg)) scaleX(0.01); opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: rotate(var(--angle, 0deg)) scaleX(1); opacity: 0; }
        }

        @keyframes warpGlow {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
        }

        @media (max-width: 639px) {
          .onboarding-cta {
            width: 100% !important;
            padding: 14px 24px !important;
          }
          .onboarding-card {
            border-radius: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .onboarding-card { animation: none !important; opacity: 1 !important; }
          .onboarding-cta, .onboarding-skip { transition: none !important; }
          .onboarding-shimmer { display: none !important; }
          .warp-overlay,
          .warp-overlay * { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;
