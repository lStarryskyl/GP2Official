import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, FileText, Layers, GitBranch, Download, Zap, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { AcornLogo } from './AcornLogo';

interface OnboardingScreenProps {
  onDone: () => void;
}

const PHASES = [
  { name: 'Planning',        icon: '📋' },
  { name: 'Requirements',    icon: '📄' },
  { name: 'System Design',   icon: '🏗️' },
  { name: 'Architecture',    icon: '⚙️' },
  { name: 'Development Plan',icon: '💻' },
  { name: 'Cost & Benefit',  icon: '💰' },
  { name: 'Risk Assessment', icon: '⚠️' },
  { name: 'Testing',         icon: '🧪' },
  { name: 'Deployment',      icon: '🚀' },
  { name: 'Maintenance',     icon: '🔧' },
  { name: 'Final Summary',   icon: '✅' },
];

const EXPORT_ITEMS = [
  { icon: FileText,  label: 'PDF Report',        color: '#F97316', desc: 'Polished stakeholder-ready document' },
  { icon: Download,  label: 'Markdown',           color: '#1A6FD4', desc: 'Developer-friendly plain-text format' },
  { icon: GitBranch, label: 'Jira Export',        color: '#0052CC', desc: 'Import tickets directly into your board' },
  { icon: Layers,    label: 'Confluence',         color: '#0065FF', desc: 'Publish specs to your team wiki instantly' },
];

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

const Slide1: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
      <div style={{
        width: '100px', height: '100px',
        borderRadius: '28px',
        background: 'rgba(249,115,22,0.12)',
        border: '1.5px solid rgba(249,115,22,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 60px rgba(249,115,22,0.18)',
      }}>
        <AcornLogo variant="mark" height={64} width={64} />
      </div>
    </div>
    <p style={{
      fontSize: 'clamp(10px, 2.5vw, 12px)',
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
      fontSize: 'clamp(28px, 6vw, 52px)',
      color: '#E8EDF5',
      letterSpacing: '-0.03em',
      lineHeight: 1.08,
      marginBottom: '20px',
    }}>
      AI-powered SDLC planning
    </h1>
    <p style={{
      color: '#8899AA',
      fontSize: 'clamp(15px, 2.2vw, 19px)',
      fontFamily: "'DM Sans', sans-serif",
      lineHeight: 1.7,
      marginBottom: '0',
    }}>
      From idea to production-ready plan in minutes — powered by Gemini AI,
      built for modern engineering teams.
    </p>
    <div style={{
      marginTop: '36px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'center',
    }}>
      {[
        { icon: Zap,    label: 'AI-generated specs'  },
        { icon: Shield, label: 'Structured & auditable' },
        { icon: Clock,  label: 'Minutes, not weeks'   },
      ].map(({ icon: Icon, label }) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px',
          borderRadius: '999px',
          background: 'rgba(26,111,212,0.1)',
          border: '1px solid rgba(26,111,212,0.25)',
          color: '#8BB8E8',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <Icon size={14} color="#1A6FD4" />
          {label}
        </div>
      ))}
    </div>
  </div>
);

const Slide2: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
    <p style={{
      fontSize: 'clamp(10px, 2.5vw, 12px)',
      color: '#F97316',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      marginBottom: '14px',
    }}>
      Complete coverage
    </p>
    <h1 style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: 'clamp(26px, 5vw, 44px)',
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
      marginBottom: '28px',
    }}>
      Every phase of your project lifecycle, automated end-to-end.
    </p>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '8px',
      textAlign: 'left',
    }}>
      {PHASES.map((phase, i) => (
        <div key={phase.name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '10px',
          background: i % 2 === 0 ? 'rgba(26,111,212,0.08)' : 'rgba(249,115,22,0.07)',
          border: `1px solid ${i % 2 === 0 ? 'rgba(26,111,212,0.2)' : 'rgba(249,115,22,0.2)'}`,
        }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>{phase.icon}</span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: '#C8D8E8',
          }}>
            {i + 1}. {phase.name}
          </span>
          <CheckCircle2 size={13} color="#3d8fe0" style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  </div>
);

const Slide3: React.FC = () => (
  <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto' }}>
    <p style={{
      fontSize: 'clamp(10px, 2.5vw, 12px)',
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
      fontSize: 'clamp(26px, 5vw, 44px)',
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
      marginBottom: '32px',
    }}>
      Structured specs your whole team can use — from first draft to stakeholder sign-off.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', textAlign: 'left' }}>
      {EXPORT_ITEMS.map(({ icon: Icon, label, color, desc }) => (
        <div key={label} style={{
          padding: '18px 20px',
          borderRadius: '14px',
          background: 'rgba(20,38,60,0.75)',
          border: `1px solid ${color}33`,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '10px',
            background: `${color}18`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <Icon size={18} color={color} />
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
        background: '#07080E',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(800px circle at 25% 35%, rgba(26,111,212,0.07), transparent 55%), radial-gradient(600px circle at 75% 65%, rgba(249,115,22,0.06), transparent 55%)',
        }}
      />

      {warpActive && !reducedMotion && (
        <div
          className="warp-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '760px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: slideVisible ? 1 : 0,
          transform: slideVisible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
          transition: reducedMotion
            ? 'opacity 0.2s'
            : 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <CurrentSlide />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '760px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          paddingTop: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slideIdx ? '28px' : '8px',
                height: '8px',
                borderRadius: '999px',
                background: i === slideIdx ? '#F97316' : 'rgba(255,255,255,0.2)',
                transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), background 0.35s',
              }}
            />
          ))}
        </div>

        <button
          className="onboarding-cta"
          onClick={advanceSlide}
          style={{
            padding: '15px 44px',
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
            boxShadow: '0 4px 28px rgba(249,115,22,0.4)',
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
            e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.4)';
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
              color: '#556677',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              transition: 'color 0.2s',
              touchAction: 'manipulation',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8899AA'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#556677'; }}
          >
            Skip intro
          </button>
        )}
      </div>

      <style>{`
        @keyframes warpStreak {
          0%   { opacity: 0; transform: scaleY(0.1) translateY(0); }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: scaleY(1)  translateY(-120vh); }
        }
        @keyframes warpPulse {
          0%   { opacity: 0; transform: scale(0.5); }
          50%  { opacity: 0.6; }
          100% { opacity: 0; transform: scale(2.5); }
        }

        .warp-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(249,115,22,0.25) 0%, rgba(26,111,212,0.15) 40%, transparent 70%);
          animation: warpPulse 0.65s ease-out forwards;
        }

        .warp-overlay::after {
          content: '';
          position: absolute;
          inset: -50%;
          background: repeating-conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255,255,255,0.04) 0.5deg,
            transparent 1deg,
            transparent 6deg
          );
          animation: warpPulse 0.65s ease-out forwards;
        }

        .onboarding-cta:active { transform: scale(0.97) !important; }

        @media (max-width: 639px) {
          .onboarding-cta {
            width: 100% !important;
            padding: 15px 24px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .warp-overlay { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;
