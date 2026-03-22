import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  TreePine,
  Zap,
  Shield,
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  Star,
  Rocket,
  TrendingUp,
  Clock,
  Award,
  Cpu,
  Layers,
  GitBranch,
  ChevronDown,
} from 'lucide-react';

// ─── Acorn SVG ─────────────────────────────────────────────────────────────
const AcornSVG: React.FC<{ cracked?: boolean; className?: string }> = ({ cracked = false, className = '' }) => (
  <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {cracked ? (
      <>
        {/* Left half of cracked acorn */}
        <g transform="translate(-8, 4) rotate(-15, 40, 70)">
          <ellipse cx="40" cy="72" rx="22" ry="28" fill="#8B5E3C" />
          <ellipse cx="40" cy="44" rx="24" ry="14" fill="#5c4033" />
          <ellipse cx="40" cy="44" rx="18" ry="10" fill="#3d2b1f" />
          <rect x="37" y="30" width="6" height="16" rx="3" fill="#3d2b1f" />
        </g>
        {/* Right half */}
        <g transform="translate(8, 4) rotate(15, 40, 70)">
          <ellipse cx="40" cy="72" rx="22" ry="28" fill="#A0714E" />
          <ellipse cx="40" cy="44" rx="24" ry="14" fill="#6b4c35" />
          <ellipse cx="40" cy="44" rx="18" ry="10" fill="#4a3324" />
          <rect x="37" y="30" width="6" height="16" rx="3" fill="#4a3324" />
        </g>
        {/* Sparkle rays */}
        {[0,60,120,180,240,300].map((deg, i) => (
          <line key={i}
            x1="40" y1="70"
            x2={40 + Math.cos(deg * Math.PI/180) * 38}
            y2={70 + Math.sin(deg * Math.PI/180) * 38}
            stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"
            style={{ opacity: 0.7 + i * 0.05 }}
          />
        ))}
      </>
    ) : (
      <>
        {/* Cap */}
        <ellipse cx="40" cy="40" rx="28" ry="16" fill="#5c4033" />
        <ellipse cx="40" cy="40" rx="22" ry="11" fill="#3d2b1f" />
        {/* Stem */}
        <rect x="37" y="24" width="6" height="18" rx="3" fill="#3d2b1f" />
        {/* Body */}
        <ellipse cx="40" cy="68" rx="26" ry="32" fill="#8B5E3C" />
        <ellipse cx="40" cy="62" rx="22" ry="26" fill="#A0714E" />
        {/* Shine */}
        <ellipse cx="32" cy="55" rx="6" ry="8" fill="white" fillOpacity="0.12" />
      </>
    )}
  </svg>
);

// ─── Full Tree SVG (landing page) ─────────────────────────────────────────
const FullLandingTree: React.FC<{ onLeafClick: (id: string) => void; activeLeaf: string | null }> = ({
  onLeafClick,
  activeLeaf,
}) => {
  const contentLeaves = [
    { id: 'what',     x: 160,  y: 320, r: 52, label: 'What is\nAcorn?',   color: '#2A9D8F', textColor: '#fff' },
    { id: 'how',      x: 380,  y: 280, r: 52, label: 'How It\nWorks',      color: '#6B4C8A', textColor: '#fff' },
    { id: 'features', x: 580,  y: 310, r: 52, label: 'Features',           color: '#D4A017', textColor: '#0a150e' },
    { id: 'started',  x: 740,  y: 260, r: 52, label: 'Get\nStarted',       color: '#C1440E', textColor: '#fff' },
  ];

  const phaseLeaves = [
    { id: 'planning',              x: 110,  y: 190, r: 42, label: 'Planning',     color: '#D4A017', textColor: '#0a150e' },
    { id: 'feasibility_study',     x: 255,  y: 155, r: 42, label: 'Feasibility',  color: '#7BA05B', textColor: '#0a150e' },
    { id: 'requirements_gathering',x: 400,  y: 130, r: 42, label: 'Requirements', color: '#3d8a55', textColor: '#fff'    },
    { id: 'design',                x: 530,  y: 155, r: 42, label: 'Design',       color: '#6B4C8A', textColor: '#fff'    },
    { id: 'development',           x: 660,  y: 180, r: 42, label: 'Dev',          color: '#8B5E3C', textColor: '#fff'    },
    { id: 'summary',               x: 400,  y: 55,  r: 48, label: '★ Summary',    color: '#D4A017', textColor: '#0a150e' },
  ];

  const branches = [
    // trunk to content level
    [400, 500, 160, 320], [400, 500, 380, 280],
    [400, 500, 580, 310], [400, 500, 740, 260],
    // content to phase level
    [160, 320, 110, 190], [160, 320, 255, 155],
    [380, 280, 400, 130], [580, 310, 530, 155],
    [580, 310, 660, 180], [740, 260, 660, 180],
    // phase level to crown
    [255, 155, 400, 55], [530, 155, 400, 55],
    [400, 130, 400, 55],
  ];

  return (
    <svg
      width="100%" height="100%"
      viewBox="0 0 880 560"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '900px', margin: '0 auto', display: 'block' }}
    >
      {/* Roots */}
      <line x1="400" y1="560" x2="400" y2="500" stroke="#3d2b1f" strokeWidth="18" strokeLinecap="round" />
      <line x1="400" y1="540" x2="340" y2="560" stroke="#2c1810" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
      <line x1="400" y1="540" x2="460" y2="560" stroke="#2c1810" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="400" cy="558" rx="80" ry="6" fill="#1e4a28" fillOpacity="0.4" />

      {/* Trunk */}
      <line x1="400" y1="500" x2="400" y2="380" stroke="#5c4033" strokeWidth="14" strokeLinecap="round" />
      <line x1="400" y1="500" x2="400" y2="380" stroke="#8B5E3C" strokeWidth="8" strokeLinecap="round" opacity="0.4" />

      {/* Branches */}
      {branches.map(([x1, y1, x2, y2], i) => (
        <path key={i}
          d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
          stroke="#2d6a3f" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7"
        />
      ))}

      {/* Content leaves */}
      {contentLeaves.map(leaf => {
        const isActive = activeLeaf === leaf.id;
        return (
          <g key={leaf.id} onClick={() => onLeafClick(leaf.id)} style={{ cursor: 'pointer' }}>
            {isActive && <circle cx={leaf.x} cy={leaf.y} r={leaf.r + 16} fill={leaf.color} fillOpacity="0.18" />}
            <circle cx={leaf.x} cy={leaf.y} r={leaf.r}
              fill={leaf.color}
              stroke={isActive ? '#fff' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isActive ? 3 : 1}
              style={{ filter: isActive ? `drop-shadow(0 0 14px ${leaf.color}aa)` : 'none', transition: 'all 0.3s ease' }}
            />
            {leaf.label.split('\n').map((line, li) => (
              <text key={li}
                x={leaf.x} y={leaf.y + (li - (leaf.label.split('\n').length - 1) / 2) * 14}
                textAnchor="middle" fill={leaf.textColor}
                fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Phase leaves */}
      {phaseLeaves.map(leaf => {
        const isActive = activeLeaf === leaf.id;
        return (
          <g key={leaf.id} onClick={() => onLeafClick(leaf.id)} style={{ cursor: 'pointer' }}>
            {isActive && <circle cx={leaf.x} cy={leaf.y} r={leaf.r + 14} fill={leaf.color} fillOpacity="0.2" />}
            <circle cx={leaf.x} cy={leaf.y} r={leaf.r}
              fill={leaf.color}
              stroke={isActive ? '#fff' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isActive ? 2.5 : 1}
              style={{ filter: isActive ? `drop-shadow(0 0 10px ${leaf.color}99)` : 'none', transition: 'all 0.3s ease' }}
            />
            <text x={leaf.x} y={leaf.y + 4} textAnchor="middle"
              fill={leaf.textColor} fontSize="9.5" fontWeight="700"
              fontFamily="Inter, sans-serif" style={{ pointerEvents: 'none' }}
            >
              {leaf.label}
            </text>
          </g>
        );
      })}

      {/* Floating particles */}
      {[0,1,2,3,4].map(i => (
        <circle key={i}
          cx={100 + i * 160} cy={20 + (i % 3) * 12} r="3"
          fill="#4ade80" fillOpacity={0.25 + i * 0.08}
          style={{ animation: `float ${3 + i * 0.7}s ease-in-out ${i * 0.4}s infinite` }}
        />
      ))}
    </svg>
  );
};

// ─── Leaf tooltip panels ────────────────────────────────────────────────────
const LEAF_PANELS: Record<string, { title: string; body: React.ReactNode }> = {
  what: {
    title: 'What is Acorn?',
    body: (
      <div className="space-y-3">
        <p className="text-[#a8d5a8] text-sm leading-relaxed">
          Acorn is an AI-powered project planning platform that grows your idea from a seed into a full
          architectural plan — requirements, timelines, diagrams, and stakeholder analysis included.
        </p>
        <div className="flex flex-wrap gap-2">
          {['SRS Generation','Risk Analysis','Phase Flow','Team Collab'].map(t => (
            <span key={t} className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(42,157,143,0.2)', color: '#2A9D8F', border: '1px solid rgba(42,157,143,0.3)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  how: {
    title: 'How It Works',
    body: (
      <ol className="space-y-2 text-sm text-[#a8d5a8]">
        {['Describe your project idea', 'AI generates all 10 planning phases', 'Review, edit, and export to PDF/SRS', 'Deploy with a complete architecture plan'].map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: '#6B4C8A', color: '#fff' }}>{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    ),
  },
  features: {
    title: 'Features',
    body: (
      <div className="grid grid-cols-2 gap-2">
        {[
          ['AI Board Room', '8 specialized agents debate your architecture'],
          ['Conflict Detection', 'Scans requirements for contradictions'],
          ['Code Scaffold', 'Generates boilerplate for your tech stack'],
          ['Export Center', 'PDF, SRS, OpenAPI, ERD diagrams'],
        ].map(([t, d]) => (
          <div key={t} className="p-2 rounded-lg" style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
            <p className="text-xs font-bold text-[#D4A017]">{t}</p>
            <p className="text-xs text-[#6b9e7a] mt-0.5">{d}</p>
          </div>
        ))}
      </div>
    ),
  },
  started: {
    title: 'Get Started',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-[#a8d5a8]">Free tier available — no credit card required.</p>
        <div className="space-y-2">
          <button className="w-full py-2.5 rounded-xl text-sm font-bold text-[#0a150e] transition-all"
            style={{ background: 'linear-gradient(135deg, #C1440E, #e05a24)' }}
            onClick={() => window.location.href = '/register'}>
            Create Free Account →
          </button>
          <button className="w-full py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: 'rgba(193,68,14,0.4)', color: '#C1440E' }}
            onClick={() => window.location.href = '/login'}>
            Sign In
          </button>
        </div>
      </div>
    ),
  },
};

// ─── Main LandingPage ───────────────────────────────────────────────────────
type Stage = 'falling' | 'cracking' | 'welcome' | 'tree';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('falling');
  const [activeLeaf, setActiveLeaf] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    // Skip intro animation if user already passed through it
    if (sessionStorage.getItem('acorn_intro_done')) {
      setStage('tree');
      return;
    }
    // Sequence timing
    const t1 = setTimeout(() => setStage('cracking'), 2200);  // acorn hits ground
    const t2 = setTimeout(() => setStage('welcome'), 2800);   // crack → welcome text
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem('acorn_intro_done', '1');
    hasEnteredRef.current = true;
    setStage('tree');
    setActiveLeaf(null);
  };

  const handleLeafClick = (id: string) => {
    if (['planning','feasibility_study','requirements_gathering','design','development','summary'].includes(id)) {
      navigate('/register');
    } else {
      setActiveLeaf(prev => prev === id ? null : id);
    }
  };

  // ── Intro / welcome stage ────────────────────────────────────────────────
  if (stage === 'falling' || stage === 'cracking' || stage === 'welcome') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 80%, #0f2a18 0%, #060e09 100%)' }}
      >
        {/* Background particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${2 + (i % 4)}px`, height: `${2 + (i % 4)}px`,
                left: `${5 + i * 5.2}%`, top: `${10 + (i * 7.3) % 80}%`,
                background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#D4A017' : '#2A9D8F',
                opacity: 0.15 + (i % 5) * 0.04,
                animation: `float ${4 + i % 4}s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Forest floor silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0a150e 60%, transparent)' }}
        />

        {/* Acorn + crack animation */}
        <div className="relative flex flex-col items-center">
          <div style={{
            animation: stage === 'falling'
              ? 'acornFall 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
              : stage === 'cracking'
              ? 'acornShake 0.4s ease-in-out'
              : 'none',
          }}>
            <AcornSVG cracked={stage === 'cracking' || stage === 'welcome'} />
          </div>

          {/* Ground flash on impact */}
          {stage === 'cracking' && (
            <div className="absolute bottom-0 w-32 h-8 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(212,160,23,0.6) 0%, transparent 70%)',
                animation: 'impactFlash 0.5s ease-out forwards',
              }}
            />
          )}

          {/* Welcome text */}
          {stage === 'welcome' && (
            <div className="mt-10 text-center" style={{ animation: 'welcomeFadeIn 0.8s ease-out forwards' }}>
              <h1 className="text-5xl font-bold mb-3"
                style={{
                  background: 'linear-gradient(135deg, #4ade80, #D4A017, #2A9D8F)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                Welcome to Acorn
              </h1>
              <p className="text-[#6b9e7a] text-lg mb-8">Grow your project from a seed of an idea</p>
              <button
                onClick={handleEnter}
                className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #2d6a3f, #4ade80)',
                  color: '#0a150e',
                  boxShadow: '0 0 40px rgba(74,222,128,0.3)',
                }}
              >
                <TreePine className="w-5 h-5" />
                Enter the Forest
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes acornFall {
            0%   { transform: translateY(-220px) rotate(-20deg); opacity: 0; }
            60%  { transform: translateY(0px) rotate(5deg); opacity: 1; }
            75%  { transform: translateY(-30px) rotate(-3deg); }
            88%  { transform: translateY(0px) rotate(2deg); }
            95%  { transform: translateY(-8px) rotate(-1deg); }
            100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          }
          @keyframes acornShake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-6px) rotate(-5deg); }
            40% { transform: translateX(6px) rotate(5deg); }
            60% { transform: translateX(-4px) rotate(-3deg); }
            80% { transform: translateX(4px) rotate(3deg); }
          }
          @keyframes impactFlash {
            0%   { opacity: 1; transform: scale(0.5); }
            100% { opacity: 0; transform: scale(2); }
          }
          @keyframes welcomeFadeIn {
            0%   { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(-12px); }
          }
        `}</style>
      </div>
    );
  }

  // ── Tree stage — main landing page ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a150e] text-[#e8f5e0] overflow-x-hidden">

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 40 ? 'bg-[#0a150e]/90 backdrop-blur-md border-b border-[#1e4a28]/40' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { sessionStorage.removeItem('acorn_intro_done'); setStage('falling'); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#2d6a3f] flex items-center justify-center">
              <TreePine className="w-5 h-5 text-[#0a150e]" />
            </div>
            <span className="text-xl font-bold text-gradient-forest">Acorn</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {['Features', 'Pricing', 'Enterprise'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-[#6b9e7a] hover:text-[#4ade80] transition-colors font-medium">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-[#a8d5a8] hover:text-[#e8f5e0] font-medium text-sm transition-colors">Sign In</button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm px-5 py-2.5">
              Start Free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — The Tree IS the landing page */}
      <section className="relative pt-24 pb-16 min-h-screen flex flex-col">
        <div className="max-w-5xl mx-auto px-6 w-full text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <Sparkles className="w-3.5 h-3.5 text-[#4ade80]" />
            <span className="text-[#4ade80] text-xs font-bold tracking-widest">AI-POWERED PROJECT PLANNING</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="text-[#e8f5e0]">Your Project,</span>{' '}
            <span className="text-gradient-forest">Growing</span>
          </h1>
          <p className="text-[#6b9e7a] text-lg max-w-2xl mx-auto">
            Click the leaves below to explore. Each leaf is a phase of your project lifecycle.
          </p>
        </div>

        {/* Interactive Tree */}
        <div className="relative flex-1 flex items-center justify-center px-4" style={{ minHeight: '520px' }}>
          <div className="w-full" style={{ maxWidth: '880px' }}>
            <FullLandingTree onLeafClick={handleLeafClick} activeLeaf={activeLeaf} />
          </div>

          {/* Leaf info panel */}
          {activeLeaf && LEAF_PANELS[activeLeaf] && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-72 rounded-2xl p-5 z-20"
              style={{
                background: '#0f1f15',
                border: '1px solid #1e4a28',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                animation: 'panelSlide 0.25s ease-out',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#e8f5e0] text-base">{LEAF_PANELS[activeLeaf].title}</h3>
                <button onClick={() => setActiveLeaf(null)} className="text-[#4a7a56] hover:text-[#e8f5e0] text-lg leading-none transition-colors">×</button>
              </div>
              {LEAF_PANELS[activeLeaf].body}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pb-4 text-xs text-[#4a7a56]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: '#D4A017' }} />Content Sections</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: '#7BA05B' }} />Project Phases</span>
          <span className="flex items-center gap-1.5"><ChevronDown className="w-3 h-3" />Click leaves to explore</span>
        </div>

        {/* Scroll CTA */}
        <div className="flex justify-center mt-4 animate-bounce">
          <div className="flex flex-col items-center gap-1 text-[#4a7a56] text-xs cursor-pointer" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
            <span>Scroll to learn more</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(to bottom, #0a150e, #0f1f15)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { v: '10x', l: 'Faster Planning', c: '#4ade80' },
            { v: '500+', l: 'Enterprise Users', c: '#D4A017' },
            { v: '99.9%', l: 'Uptime', c: '#2A9D8F' },
            { v: '8', l: 'AI Agents', c: '#6B4C8A' },
          ].map(({ v, l, c }) => (
            <div key={l} className="text-center">
              <p className="text-4xl font-bold mb-1" style={{ color: c }}>{v}</p>
              <p className="text-[#6b9e7a] text-sm">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge mb-4"><Layers className="w-3.5 h-3.5" />PLATFORM CAPABILITIES</div>
            <h2 className="text-4xl font-bold text-[#e8f5e0] mb-4">Everything Your Project Needs</h2>
            <p className="text-[#6b9e7a] text-lg max-w-2xl mx-auto">From idea to architecture — all phases, all artifacts, all in one place</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Cpu,        title: 'AI Board Room',       desc: '8 specialized agents debate your architecture and reach consensus', color: '#2A9D8F' },
              { icon: Shield,     title: 'Security Audit Agent', desc: 'Scans your requirements for security gaps and compliance issues', color: '#C1440E' },
              { icon: GitBranch,  title: 'Conflict Detection',   desc: 'Automatically finds contradictions across your requirements', color: '#D4A017' },
              { icon: FileText,   title: 'SRS Generation',       desc: 'IEEE 830-compliant Software Requirements Specifications', color: '#6B4C8A' },
              { icon: BarChart3,  title: 'Analytics Dashboard',  desc: 'Real-time insights, burndown charts, risk heatmaps', color: '#7BA05B' },
              { icon: Zap,        title: 'Code Scaffold Agent',  desc: 'Generates boilerplate code for your entire chosen tech stack', color: '#8B5E3C' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-7 hover-lift group" style={{ borderColor: 'rgba(30,74,40,0.6)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-semibold text-[#e8f5e0] mb-2">{title}</h3>
                <p className="text-[#6b9e7a] text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phase Flow visual */}
      <section className="py-24 px-6" style={{ background: '#0f1f15' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="badge mb-4"><Award className="w-3.5 h-3.5" />10-PHASE WORKFLOW</div>
            <h2 className="text-4xl font-bold text-[#e8f5e0] mb-4">From Seed to Architecture</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Planning',      color: '#D4A017' },
              { label: 'Feasibility',   color: '#7BA05B' },
              { label: 'Requirements',  color: '#3d8a55' },
              { label: 'Validation',    color: '#5F7A8A' },
              { label: 'Design',        color: '#6B4C8A' },
              { label: 'Development',   color: '#8B5E3C' },
              { label: 'Tasks',         color: '#D4A017' },
              { label: 'Costs',         color: '#2A9D8F' },
              { label: 'Risks',         color: '#C1440E' },
              { label: 'Summary',       color: '#4ade80' },
            ].map(({ label, color }, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
                  {i + 1}. {label}
                </div>
                {i < 9 && <ArrowRight className="w-3 h-3 text-[#2d6a3f]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-[#e8f5e0] mb-4">Trusted by builders worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: 'Acorn cut our SRS writing time from 3 weeks to 2 hours. The AI agents actually understand software architecture.', name: 'Sarah K.', role: 'CTO, FinTech Startup' },
              { q: 'The conflict detection alone saved us from a $50k architecture mistake. It caught contradictions we missed in review.', name: 'James M.', role: 'Solutions Architect' },
              { q: 'Every phase flows into the next perfectly. Having the tree visualization makes it easy to see where we are at a glance.', name: 'Priya T.', role: 'Product Manager' },
            ].map(({ q, name, role }) => (
              <div key={name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#D4A017] text-[#D4A017]" />)}
                </div>
                <p className="text-[#a8d5a8] text-sm mb-4 leading-relaxed">"{q}"</p>
                <div>
                  <p className="font-semibold text-[#e8f5e0] text-sm">{name}</p>
                  <p className="text-[#6b9e7a] text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(74,222,128,0.06) 0%, transparent 70%)' }} />
            <Rocket className="w-12 h-12 mx-auto mb-6 text-[#4ade80]" />
            <h2 className="text-4xl font-bold text-[#e8f5e0] mb-4">Plant Your First Project Today</h2>
            <p className="text-[#6b9e7a] text-lg mb-10 max-w-xl mx-auto">
              Free tier available. No credit card required. Start growing in under 2 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => navigate('/register')} className="btn-primary text-lg px-12 py-5 group">
                <Sparkles className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/login')} className="btn-secondary text-lg px-10 py-5">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-[#1e4a28]/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#2d6a3f] flex items-center justify-center">
              <TreePine className="w-4 h-4 text-[#0a150e]" />
            </div>
            <span className="font-bold text-gradient-forest">Acorn</span>
          </div>
          <p className="text-[#6b9e7a] text-xs">© 2026 Acorn Technologies. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            {['Privacy','Terms','Contact'].map(l => (
              <a key={l} href="#" className="text-[#6b9e7a] hover:text-[#4ade80] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes panelSlide {
          from { opacity: 0; transform: translateY(-50%) translateX(20px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
