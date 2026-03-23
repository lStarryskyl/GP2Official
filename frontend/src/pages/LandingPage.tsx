import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';

// ── Acorn SVG ────────────────────────────────────────────────────────────────
const AcornSVG: React.FC<{ cracked?: boolean; size?: number }> = ({ cracked = false, size = 90 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 90 108" fill="none" xmlns="http://www.w3.org/2000/svg">
    {cracked ? (
      <>
        <g transform="translate(-10, 5) rotate(-18, 45, 80)">
          <ellipse cx="45" cy="82" rx="25" ry="30" fill="#8B5E3C" />
          <ellipse cx="45" cy="50" rx="27" ry="16" fill="#3d2412" />
          <ellipse cx="45" cy="50" rx="20" ry="11" fill="#221508" />
          <rect x="42" y="34" width="6" height="18" rx="3" fill="#221508" />
        </g>
        <g transform="translate(10, 5) rotate(18, 45, 80)">
          <ellipse cx="45" cy="82" rx="25" ry="30" fill="#c8895a" />
          <ellipse cx="45" cy="50" rx="27" ry="16" fill="#5c3820" />
          <ellipse cx="45" cy="50" rx="20" ry="11" fill="#3d2412" />
          <rect x="42" y="34" width="6" height="18" rx="3" fill="#3d2412" />
        </g>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <line key={i}
            x1="45" y1="80"
            x2={45 + Math.cos(deg * Math.PI / 180) * 42}
            y2={80 + Math.sin(deg * Math.PI / 180) * 42}
            stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round"
            opacity={0.6 + i * 0.06}
          />
        ))}
        <ellipse cx="45" cy="80" rx="8" ry="8" fill="#D4A017" fillOpacity="0.3" />
      </>
    ) : (
      <>
        <ellipse cx="45" cy="44" rx="30" ry="18" fill="#3d2412" />
        <ellipse cx="45" cy="44" rx="24" ry="12" fill="#221508" />
        <rect x="42" y="26" width="6" height="20" rx="3" fill="#221508" />
        <ellipse cx="45" cy="78" rx="28" ry="34" fill="#8B5E3C" />
        <ellipse cx="45" cy="70" rx="24" ry="28" fill="#c8895a" />
        <ellipse cx="36" cy="62" rx="7" ry="10" fill="rgba(255,255,255,0.1)" />
      </>
    )}
  </svg>
);

// ── Shared leaf/acorn path helpers ───────────────────────────────────────────

/** Returns a leaf-shaped SVG path centered at (cx, cy) with given half-size.
 *  The leaf points upward (tip at the top). */
const leafPath = (cx: number, cy: number, rx: number, ry: number): string => {
  const t = cy - ry;      // tip
  const b = cy + ry * 0.55; // base
  const ml = cx - rx * 0.92;
  const mr = cx + rx * 0.92;
  return (
    `M ${cx} ${t} ` +
    `C ${mr} ${t + ry * 0.35}, ${mr} ${b - ry * 0.2}, ${cx} ${b} ` +
    `C ${ml} ${b - ry * 0.2}, ${ml} ${t + ry * 0.35}, ${cx} ${t} Z`
  );
};

/** Acorn cap + body centered at (cx, cy), radius r */
const AcornNode: React.FC<{
  cx: number; cy: number; r: number;
  active?: boolean; fill?: string;
}> = ({ cx, cy, r, active, fill = '#c8870f' }) => (
  <g>
    <ellipse cx={cx} cy={cy + r * 0.38} rx={r * 0.82} ry={r * 0.75}
      fill={fill}
      style={{ filter: active ? `drop-shadow(0 0 10px ${fill}bb)` : 'none', transition: 'all 0.3s ease' }}
    />
    <ellipse cx={cx} cy={cy + r * 0.38} rx={r * 0.65} ry={r * 0.6}
      fill={fill === '#c8870f' ? '#e8bf40' : fill}
      fillOpacity="0.6"
    />
    <ellipse cx={cx} cy={cy - r * 0.35} rx={r * 0.9} ry={r * 0.42}
      fill="#3d2412"
    />
    <ellipse cx={cx} cy={cy - r * 0.35} rx={r * 0.72} ry={r * 0.3}
      fill="#221508"
    />
    <rect x={cx - r * 0.14} y={cy - r * 0.85} width={r * 0.28} height={r * 0.55}
      rx={r * 0.1} fill="#221508"
    />
    <ellipse cx={cx - r * 0.28} cy={cy + r * 0.12} rx={r * 0.16} ry={r * 0.24}
      fill="rgba(255,255,255,0.1)"
    />
  </g>
);

// ── Big Interactive Tree ──────────────────────────────────────────────────────
const LandingTree: React.FC<{
  onLeafClick: (id: string) => void;
  activeLeaf: string | null;
}> = ({ onLeafClick, activeLeaf }) => {
  const phases = [
    { id: 'planning',       x: 100, y: 200, rx: 46, ry: 54, label: 'Planning',      fill: '#D4A017', text: '#0c0702' },
    { id: 'feasibility',    x: 250, y: 160, rx: 44, ry: 52, label: 'Feasibility',    fill: '#5a9e6a', text: '#0c0702' },
    { id: 'requirements',   x: 400, y: 130, rx: 50, ry: 58, label: 'Requirements',   fill: '#3d7a4a', text: '#f0e4c8' },
    { id: 'design',         x: 545, y: 158, rx: 44, ry: 52, label: 'Design',         fill: '#6B4C8A', text: '#f0e4c8' },
    { id: 'development',    x: 685, y: 195, rx: 44, ry: 52, label: 'Development',    fill: '#8B5E3C', text: '#f0e4c8' },
  ];

  const infoLeaves = [
    { id: 'what',     x: 140,  y: 330, rx: 54, ry: 62, label: 'What is\nAcorn?',   fill: '#2A9D8F', text: '#f0e4c8' },
    { id: 'how',      x: 360,  y: 295, rx: 54, ry: 62, label: 'How It\nWorks',     fill: '#5c3820', text: '#f0e4c8' },
    { id: 'features', x: 580,  y: 320, rx: 54, ry: 62, label: 'Features',          fill: '#3d2412', text: '#D4A017' },
    { id: 'start',    x: 740,  y: 270, rx: 54, ry: 62, label: 'Get\nStarted',      fill: '#c1440e', text: '#f0e4c8' },
  ];

  const branches = [
    [400, 510, 140, 330], [400, 510, 360, 295],
    [400, 510, 580, 320], [400, 510, 740, 270],
    [140, 330, 100, 200], [140, 330, 250, 160],
    [360, 295, 400, 130], [580, 320, 545, 158],
    [580, 320, 685, 195], [740, 270, 685, 195],
    [250, 160, 400, 52], [545, 158, 400, 52],
    [400, 130, 400, 52],
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 880 570" preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 920, margin: '0 auto', display: 'block' }}>

      <style>{`
        @keyframes leafRustle {
          0%, 100% { transform-box: fill-box; transform-origin: center bottom; transform: rotate(0deg) scale(1); }
          25%       { transform-box: fill-box; transform-origin: center bottom; transform: rotate(-4deg) scale(1.06); }
          75%       { transform-box: fill-box; transform-origin: center bottom; transform: rotate(4deg) scale(1.05); }
        }
        .leaf-rustle:hover path, .leaf-rustle:hover ellipse {
          animation: leafRustle 0.5s ease-in-out;
        }
      `}</style>

      {/* Shadow */}
      <ellipse cx="400" cy="568" rx="100" ry="8" fill="#0c0702" fillOpacity="0.8" />

      {/* Roots */}
      {[[400,555,330,568,12],[400,555,470,568,12],[400,560,280,568,8],[400,562,520,568,8],[400,565,230,568,6],[400,565,565,568,6]].map(
        ([x1,y1,x2,y2,w],i) => (
          <path key={i}
            d={`M ${x1} ${y1} Q ${(x1+x2)/2} ${y1+4} ${x2} ${y2}`}
            stroke="#1a1008" strokeWidth={w} fill="none" strokeLinecap="round" opacity={0.9-i*0.1} />
        )
      )}

      {/* Trunk — tapered via two overlapping paths */}
      <path d="M 385 555 C 388 530, 392 500, 390 450 C 388 420, 392 390, 390 340"
        stroke="#2c1b0e" strokeWidth="28" fill="none" strokeLinecap="round" />
      <path d="M 415 555 C 412 530, 408 500, 410 450 C 412 420, 408 390, 410 340"
        stroke="#2c1b0e" strokeWidth="22" fill="none" strokeLinecap="round" />
      <path d="M 400 555 C 398 530, 402 500, 400 450 C 398 400, 402 370, 400 340"
        stroke="#5c3820" strokeWidth="11" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 400 555 C 398 530, 402 500, 400 450"
        stroke="#8B5E3C" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.3" />

      {/* Branches — organic S-curves */}
      {branches.map(([x1, y1, x2, y2], i) => {
        const cp1x = x1 + (x2 - x1) * 0.15;
        const cp1y = y1 - 20;
        const cp2x = x2 - (x2 - x1) * 0.15;
        const cp2y = y2 + 20;
        const thick = i < 4 ? 4.5 : 3;
        return (
          <path key={i}
            d={`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`}
            stroke="#3d2412" strokeWidth={thick} fill="none" strokeLinecap="round" opacity="0.85"
          />
        );
      })}

      {/* Info leaves — organic leaf shapes */}
      {infoLeaves.map(leaf => {
        const active = activeLeaf === leaf.id;
        return (
          <g key={leaf.id} onClick={() => onLeafClick(leaf.id)} style={{ cursor: 'pointer' }}
            className="leaf-rustle">
            {/* Glow halo */}
            <ellipse cx={leaf.x} cy={leaf.y} rx={leaf.rx + 18} ry={leaf.ry + 18}
              fill={leaf.fill} fillOpacity={active ? 0.18 : 0.05}
              style={{ transition: 'all 0.35s ease' }}
            />
            {/* Leaf body */}
            <path
              d={leafPath(leaf.x, leaf.y, leaf.rx, leaf.ry)}
              fill={leaf.fill}
              stroke={active ? '#D4A017' : 'rgba(212,160,23,0.2)'}
              strokeWidth={active ? 2.5 : 1}
              style={{ filter: active ? `drop-shadow(0 0 14px ${leaf.fill}aa)` : 'none', transition: 'all 0.3s ease' }}
            />
            {/* Mid-rib */}
            <line
              x1={leaf.x} y1={leaf.y - leaf.ry * 0.8}
              x2={leaf.x} y2={leaf.y + leaf.ry * 0.4}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"
            />
            {/* Side veins */}
            <line x1={leaf.x} y1={leaf.y - leaf.ry * 0.3} x2={leaf.x - leaf.rx * 0.55} y2={leaf.y + leaf.ry * 0.15}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
            <line x1={leaf.x} y1={leaf.y - leaf.ry * 0.3} x2={leaf.x + leaf.rx * 0.55} y2={leaf.y + leaf.ry * 0.15}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
            {leaf.label.split('\n').map((line, li) => (
              <text key={li}
                x={leaf.x} y={leaf.y + (li - (leaf.label.split('\n').length - 1) / 2) * 14}
                textAnchor="middle" fill={leaf.text}
                fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}>
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Phase leaves (upper tree) — leaf shapes */}
      {phases.map(leaf => {
        const active = activeLeaf === leaf.id;
        return (
          <g key={leaf.id} onClick={() => onLeafClick(leaf.id)} style={{ cursor: 'pointer' }}
            className="leaf-rustle">
            <ellipse cx={leaf.x} cy={leaf.y} rx={leaf.rx + 16} ry={leaf.ry + 16}
              fill={leaf.fill} fillOpacity={active ? 0.2 : 0.07}
              style={{ transition: 'all 0.35s ease' }}
            />
            <path
              d={leafPath(leaf.x, leaf.y, leaf.rx, leaf.ry)}
              fill={leaf.fill}
              stroke={active ? '#f5df90' : 'rgba(255,255,255,0.12)'}
              strokeWidth={active ? 2.5 : 1}
              style={{ filter: active ? `drop-shadow(0 0 12px ${leaf.fill}bb)` : 'none', transition: 'all 0.3s ease' }}
            />
            <line x1={leaf.x} y1={leaf.y - leaf.ry * 0.8} x2={leaf.x} y2={leaf.y + leaf.ry * 0.4}
              stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1={leaf.x} y1={leaf.y - leaf.ry * 0.2} x2={leaf.x - leaf.rx * 0.5} y2={leaf.y + leaf.ry * 0.1}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeLinecap="round" />
            <line x1={leaf.x} y1={leaf.y - leaf.ry * 0.2} x2={leaf.x + leaf.rx * 0.5} y2={leaf.y + leaf.ry * 0.1}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeLinecap="round" />
            <text x={leaf.x} y={leaf.y + 6} textAnchor="middle"
              fill={leaf.text} fontSize="9.5" fontWeight="700"
              fontFamily="Inter, sans-serif" style={{ pointerEvents: 'none' }}>
              {leaf.label}
            </text>
          </g>
        );
      })}

      {/* Summary — real acorn at the top */}
      <g onClick={() => onLeafClick('summary')} style={{ cursor: 'pointer' }}>
        <ellipse cx="400" cy="52" rx="66" ry="66"
          fill="#c8870f" fillOpacity={activeLeaf === 'summary' ? 0.22 : 0.08}
          style={{ transition: 'all 0.35s ease' }}
        />
        <AcornNode cx={400} cy={52} r={50} active={activeLeaf === 'summary'} fill="#c8870f" />
        <text x="400" y="68" textAnchor="middle"
          fill="#0c0702" fontSize="9" fontWeight="800" fontFamily="Inter, sans-serif"
          style={{ pointerEvents: 'none' }}>
          Summary
        </text>
      </g>

      {/* Floating dust motes */}
      {[0,1,2,3,4].map(i => (
        <ellipse key={i} cx={80 + i * 175} cy={25 + (i%3)*15} rx={2 + i%2} ry={2 + i%2}
          fill="#D4A017" fillOpacity={0.15 + i*0.05}
          style={{ animation: `float ${4+i*0.7}s ease-in-out ${i*0.4}s infinite` }}
        />
      ))}
    </svg>
  );
};

// ── Leaf info panels ──────────────────────────────────────────────────────────
const PANELS: Record<string, { title: string; body: React.ReactNode }> = {
  what: {
    title: 'What is Acorn?',
    body: (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed" style={{ color: '#c8b090' }}>
          Acorn is an AI-powered project planning platform that grows your idea from a seed into a full
          architectural plan — requirements, timelines, diagrams, and stakeholder analysis.
        </p>
        <div className="flex flex-wrap gap-2">
          {['SRS Generation', 'Risk Analysis', 'Phase Flow', 'Team Collab'].map(t => (
            <span key={t} className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(42,157,143,0.15)', color: '#3bbcad', border: '1px solid rgba(42,157,143,0.3)' }}>
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
      <ol className="space-y-2 text-sm" style={{ color: '#c8b090' }}>
        {['Describe your project idea', 'AI generates all 10 planning phases', 'Review, edit, and export to PDF/SRS', 'Deploy with a complete architecture plan'].map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: '#5c3820', color: '#D4A017' }}>{i + 1}</span>
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
          ['AI Board Room', '8 agents debate your architecture'],
          ['Conflict Detection', 'Scans for contradictions'],
          ['Code Scaffold', 'Generates boilerplate code'],
          ['Export Center', 'PDF, SRS, OpenAPI, ERD'],
        ].map(([t, d]) => (
          <div key={t} className="p-2 rounded-lg" style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.18)' }}>
            <p className="text-xs font-bold" style={{ color: '#D4A017' }}>{t}</p>
            <p className="text-xs mt-0.5" style={{ color: '#8a7055' }}>{d}</p>
          </div>
        ))}
      </div>
    ),
  },
  start: {
    title: 'Get Started',
    body: (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: '#c8b090' }}>Free tier available — no credit card required.</p>
        <div className="space-y-2">
          <button className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #D4A017, #a86d0e)', color: '#130c07' }}
            onClick={() => window.location.href = '/register'}>
            Create Free Account →
          </button>
          <button className="w-full py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: 'rgba(212,160,23,0.35)', color: '#D4A017' }}
            onClick={() => window.location.href = '/login'}>
            Sign In
          </button>
        </div>
      </div>
    ),
  },
};

// ── Main ─────────────────────────────────────────────────────────────────────
type Stage = 'falling' | 'cracking' | 'welcome' | 'tree';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>(
    sessionStorage.getItem('acorn_intro_done') ? 'tree' : 'falling'
  );
  const [activeLeaf, setActiveLeaf] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (stage === 'tree') return;
    const t1 = setTimeout(() => setStage('cracking'), 2200);
    const t2 = setTimeout(() => setStage('welcome'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem('acorn_intro_done', '1');
    setStage('tree');
  };

  const handleLeafClick = (id: string) => {
    const phaseIds = ['planning', 'feasibility', 'requirements', 'design', 'development', 'summary'];
    if (phaseIds.includes(id)) {
      navigate('/register');
    } else {
      setActiveLeaf(prev => prev === id ? null : id);
    }
  };

  // ── Intro stages ─────────────────────────────────────────────────────────
  if (stage !== 'tree') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 80%, #1a1008 0%, #0c0702 100%)' }}>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${1 + i % 3}px`, height: `${1 + i % 3}px`,
                left: `${5 + i * 4}%`, top: `${5 + (i * 8.3) % 85}%`,
                background: i % 3 === 0 ? '#D4A017' : i % 3 === 1 ? '#c8895a' : '#5a9e6a',
                opacity: 0.1 + (i % 5) * 0.04,
                animation: `float ${4 + i % 4}s ease-in-out ${i * 0.3}s infinite`,
              }} />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0c0702 60%, transparent)' }} />

        <div className="relative flex flex-col items-center">
          <div style={{
            animation: stage === 'falling'
              ? 'acornFall 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
              : stage === 'cracking' ? 'acornShake 0.4s ease-in-out' : 'none',
          }}>
            <AcornSVG cracked={stage === 'cracking' || stage === 'welcome'} size={100} />
          </div>

          {stage === 'cracking' && (
            <div className="absolute bottom-0 w-40 h-10 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(212,160,23,0.7) 0%, transparent 70%)',
                animation: 'impactFlash 0.5s ease-out forwards',
              }} />
          )}

          {stage === 'welcome' && (
            <div className="mt-10 text-center" style={{ animation: 'welcomeFadeIn 0.8s ease-out forwards' }}>
              <h1 className="text-5xl font-bold mb-3" style={{
                background: 'linear-gradient(135deg, #D4A017, #e8bf40, #c8895a)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Welcome to Acorn
              </h1>
              <p className="text-lg mb-8" style={{ color: '#8a7055' }}>Grow your project from a seed of an idea</p>
              <button onClick={handleEnter}
                className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #D4A017, #c8870f)',
                  color: '#0c0702',
                  boxShadow: '0 0 40px rgba(212,160,23,0.35)',
                }}>
                🌳 Enter the Forest
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes acornFall {
            0%   { transform: translateY(-240px) rotate(-20deg); opacity: 0; }
            60%  { transform: translateY(0px) rotate(5deg); opacity: 1; }
            75%  { transform: translateY(-30px) rotate(-3deg); }
            88%  { transform: translateY(0px) rotate(2deg); }
            95%  { transform: translateY(-8px) rotate(-1deg); }
            100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          }
          @keyframes acornShake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-8px) rotate(-5deg); }
            40% { transform: translateX(8px) rotate(5deg); }
            60% { transform: translateX(-5px) rotate(-3deg); }
            80% { transform: translateX(5px) rotate(3deg); }
          }
          @keyframes impactFlash {
            0%   { opacity: 1; transform: scale(0.5); }
            100% { opacity: 0; transform: scale(2.5); }
          }
          @keyframes welcomeFadeIn {
            0%   { opacity: 0; transform: translateY(24px); }
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

  // ── Tree stage ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0c0702', color: '#f0e4c8' }}>

      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrollY > 40 ? 'backdrop-blur-md' : ''
      }`}
        style={{ background: scrollY > 40 ? 'rgba(12,7,2,0.92)' : 'transparent', borderBottom: scrollY > 40 ? '1px solid #3d2412' : 'none' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
          <div className="flex items-center gap-3 cursor-pointer"
            onClick={() => { sessionStorage.removeItem('acorn_intro_done'); setStage('falling'); }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #2c1b0e, #3d2412)' }}>🌰</div>
            <span className="text-xl font-bold text-gradient-forest">Acorn</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {['Features', 'Pricing', 'Enterprise'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="font-medium transition-colors"
                style={{ color: '#8a7055' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D4A017')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8a7055')}>
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 font-medium text-sm transition-colors"
              style={{ color: '#c8b090' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0e4c8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#c8b090')}>
              Sign In
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm px-5 py-2.5">
              Start Free <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — The Living Tree */}
      <section className="relative pt-24 pb-16 min-h-screen flex flex-col">
        <div className="max-w-5xl mx-auto px-6 w-full text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#D4A017' }} />
            <span className="text-xs font-bold tracking-widest" style={{ color: '#D4A017' }}>AI-POWERED PROJECT PLANNING</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span style={{ color: '#f0e4c8' }}>Your Project,</span>{' '}
            <span className="text-gradient-forest">Growing</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#8a7055' }}>
            Click the leaves to explore. Phase leaves grow into golden acorns as you complete them.
          </p>
        </div>

        {/* Interactive Tree */}
        <div className="relative flex-1 flex items-center justify-center px-4" style={{ minHeight: 520 }}>
          <div className="w-full" style={{ maxWidth: 900 }}>
            <LandingTree onLeafClick={handleLeafClick} activeLeaf={activeLeaf} />
          </div>

          {/* Info panel */}
          {activeLeaf && PANELS[activeLeaf] && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl p-5 z-20"
              style={{
                width: 280,
                background: '#1a1008',
                border: '1px solid rgba(212,160,23,0.25)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                animation: 'panelSlide 0.25s ease-out',
              }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base" style={{ color: '#f0e4c8' }}>{PANELS[activeLeaf].title}</h3>
                <button onClick={() => setActiveLeaf(null)} className="text-xl leading-none transition-colors"
                  style={{ color: '#5c3820' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f0e4c8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#5c3820')}>×</button>
              </div>
              {PANELS[activeLeaf].body}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 pb-2 text-xs" style={{ color: '#5c3820' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#3d7a4a' }} /> Phase Leaves
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#D4A017' }} /> Info Sections
          </span>
          <span className="flex items-center gap-1.5">
            <ChevronDown className="w-3 h-3" /> Click to explore
          </span>
        </div>

        <div className="flex justify-center mt-4 animate-bounce">
          <div className="flex flex-col items-center gap-1 text-xs cursor-pointer"
            style={{ color: '#5c3820' }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
            <span>Scroll for more</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(to bottom, #0c0702, #130c07)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { v: '10x', l: 'Faster Planning',  c: '#D4A017' },
            { v: '500+', l: 'Teams Using It',   c: '#5a9e6a' },
            { v: '99.9%', l: 'Uptime',          c: '#2A9D8F' },
            { v: '10',  l: 'Planning Phases',   c: '#8B5E3C' },
          ].map(({ v, l, c }) => (
            <div key={l} className="text-center">
              <div className="text-4xl font-bold mb-1" style={{ color: c }}>{v}</div>
              <div className="text-sm" style={{ color: '#8a7055' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" style={{ background: '#130c07' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gradient-forest">What Grows in the Forest</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🌳', title: 'AI Phase Tree', desc: '10 phases from feasibility to deployment, all AI-generated from your idea' },
              { emoji: '🍃', title: 'Living Documents', desc: 'SRS, requirements, and diagrams update automatically as your project evolves' },
              { emoji: '🌰', title: 'Export & Deploy', desc: 'Export to PDF, SRS, OpenAPI specs, ERD diagrams — ready for your team' },
              { emoji: '🦉', title: 'AI Board Room', desc: '8 specialized AI agents debate and refine your architecture decisions' },
              { emoji: '🌿', title: 'Conflict Detection', desc: 'Automatically scans requirements for contradictions and gaps' },
              { emoji: '🪵', title: 'Code Scaffold', desc: 'Generates project boilerplate for your chosen tech stack' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2"
                style={{ background: '#1a1008', border: '1px solid #3d2412' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,160,23,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#3d2412')}>
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-bold mb-2" style={{ color: '#f0e4c8' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8a7055' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(to bottom, #130c07, #0c0702)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🌳</div>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#f0e4c8' }}>Plant Your First Seed</h2>
          <p className="text-lg mb-8" style={{ color: '#8a7055' }}>
            From a single idea to a complete project plan in minutes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => navigate('/register')} className="btn-primary text-lg px-8 py-4">
              Start Free Today <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary text-lg px-8 py-4">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm" style={{ color: '#5c3820', borderTop: '1px solid #221508' }}>
        <p>© 2026 Acorn — AI Project Planning Platform 🌰</p>
      </footer>
    </div>
  );
};

export default LandingPage;
