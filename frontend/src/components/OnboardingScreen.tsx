import React, { useEffect, useState } from 'react';
import { FileText, Layers, GitBranch, Download, ArrowRight } from 'lucide-react';

interface OnboardingScreenProps {
  onDone: () => void;
}

const FEATURE_CARDS = [
  {
    icon: FileText,
    title: 'AI Requirements',
    desc: 'Describe your project in plain English; Acorn generates a full IEEE-compliant SRS.',
    color: '#1A6FD4',
    bg: 'rgba(26,111,212,0.12)',
    border: 'rgba(26,111,212,0.3)',
  },
  {
    icon: Layers,
    title: '10 SDLC Phases',
    desc: 'Planning through Final Summary, each powered by Gemini AI with streaming output.',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.3)',
  },
  {
    icon: GitBranch,
    title: 'Diagram Studio',
    desc: 'Interactive canvas for system architecture, UML, and data-flow diagrams.',
    color: '#1A6FD4',
    bg: 'rgba(26,111,212,0.12)',
    border: 'rgba(26,111,212,0.3)',
  },
  {
    icon: Download,
    title: 'Export & Share',
    desc: 'Download your full project as PDF or Markdown — structured and ready for stakeholders.',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.3)',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

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
        padding: 'clamp(16px, 4vw, 48px)',
        background: 'rgba(7, 14, 24, 0.97)',
        backdropFilter: 'blur(20px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(900px circle at 20% 30%, rgba(26,111,212,0.08), transparent 55%), radial-gradient(700px circle at 80% 70%, rgba(249,115,22,0.07), transparent 55%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '780px', textAlign: 'center' }}>
        <p
          style={{
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            color: '#3d8fe0',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Welcome to Acorn
        </p>

        <h1
          className="onboarding-headline"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(24px, 6vw, 44px)',
            color: '#E8EDF5',
            letterSpacing: '-0.02em',
            marginBottom: '10px',
            lineHeight: 1.1,
          }}
        >
          Built for engineering teams
        </h1>

        <p
          style={{
            color: '#8899AA',
            fontSize: 'clamp(13px, 2vw, 16px)',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 'clamp(24px, 4vw, 40px)',
            lineHeight: 1.65,
          }}
        >
          Everything you need to go from idea to production-ready plan.
        </p>

        <div className="onboarding-grid" style={{ marginBottom: 'clamp(24px, 4vw, 40px)', textAlign: 'left' }}>
          {FEATURE_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                style={{
                  padding: 'clamp(16px, 3vw, 24px)',
                  background: 'rgba(20,38,60,0.7)',
                  border: `1px solid ${card.border}`,
                  borderRadius: '16px',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  opacity: 0,
                  animation: `onboardCardIn 0.55s cubic-bezier(0.22,1,0.36,1) ${idx * 80}ms forwards`,
                  minHeight: '44px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    borderRadius: '12px',
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} color={card.color} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 'clamp(14px, 2vw, 15px)',
                      color: '#E8EDF5',
                      marginBottom: '6px',
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      color: '#8899AA',
                      fontSize: 'clamp(12px, 1.8vw, 13px)',
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.65,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="onboarding-cta"
          onClick={onDone}
          style={{
            padding: '16px 44px',
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
            boxShadow: '0 4px 28px rgba(249,115,22,0.45)',
            transition: 'all 0.25s',
            opacity: 0,
            animation: 'onboardCardIn 0.55s cubic-bezier(0.22,1,0.36,1) 400ms forwards',
            minHeight: '52px',
            touchAction: 'manipulation',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(249,115,22,0.55)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 28px rgba(249,115,22,0.45)';
          }}
        >
          Start building <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        @keyframes onboardCardIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .onboarding-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
          gap: 14px;
        }

        @media (max-width: 639px) {
          .onboarding-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .onboarding-cta {
            width: 100% !important;
            padding: 16px 24px !important;
          }

          .onboarding-headline {
            font-size: clamp(22px, 8vw, 32px) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingScreen;
