import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { AcornLogo } from '../components/AcornLogo';

const PHASES = [
  'Brief', 'Feasibility', 'Requirements', 'Validation',
  'Tech Stack', 'Architecture', 'Design', 'Planning',
  'Tasks', 'Costs', 'Risk', 'Testing', 'Deployment',
];

const TOTAL_MS = 4000;

export const SplashScreen: React.FC = () => {
  const navigate  = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const [readyToContinue, setReadyToContinue] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReadyToContinue(true), TOTAL_MS + 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const setSize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Star field
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      phase: Math.random() * Math.PI * 2,
      spd:   Math.random() * 0.4 + 0.15,
    }));

    function drawPill(x: number, y: number, label: string, color: string, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "600 11px 'DM Sans', sans-serif";
      const tw = ctx.measureText(label).width;
      const pw = tw + 22; const ph = 24; const r = 12;
      const px = x - pw / 2; const py = y - ph / 2;

      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.lineTo(px + pw - r, py);
      ctx.arcTo(px + pw, py, px + pw, py + r, r);
      ctx.lineTo(px + pw, py + ph - r);
      ctx.arcTo(px + pw, py + ph, px + pw - r, py + ph, r);
      ctx.lineTo(px + r, py + ph);
      ctx.arcTo(px, py + ph, px, py + ph - r, r);
      ctx.lineTo(px, py + r);
      ctx.arcTo(px, py, px + r, py, r);
      ctx.closePath();

      ctx.fillStyle   = color + '28';
      ctx.fill();
      ctx.strokeStyle = color + 'cc';
      ctx.lineWidth   = 1.2;
      ctx.stroke();

      ctx.fillStyle    = 'rgba(232,237,245,0.95)';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
      ctx.restore();
    }

    startRef.current = performance.now();

    const draw = (now: number) => {
      const W = canvas.width;
      const H = canvas.height;
      const elapsed  = now - startRef.current;
      const progress = Math.min(elapsed / TOTAL_MS, 1);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050D1A';
      ctx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        const tw = 0.3 + 0.7 * Math.abs(Math.sin((now / 1000) * s.spd + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,215,255,${tw * 0.5})`;
        ctx.fill();
      });

      // Center is exactly the middle of the canvas
      const cx = W / 2;
      const cy = H / 2;

      // Constant slow orbit — no speed ramp, just calm rotation
      const RPM  = 0.08; // revolutions per minute
      const tSec = elapsed / 1000;
      const baseAngle = tSec * RPM * Math.PI * 2;

      const R = Math.min(W, H) * 0.32; // single orbit ring

      // Orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(26,111,212,0.14)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Center glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
      g.addColorStop(0, 'rgba(249,115,22,0.20)');
      g.addColorStop(0.5, 'rgba(26,111,212,0.08)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // All 13 phases evenly spaced on the single orbit
      const N = PHASES.length;
      PHASES.forEach((label, i) => {
        const angle   = baseAngle + (i / N) * Math.PI * 2;
        const x       = cx + Math.cos(angle) * R;
        const y       = cy + Math.sin(angle) * R;
        const color   = i % 2 === 0 ? '#1A6FD4' : '#F97316';
        // Fade in staggered over first 30% of duration
        const fadeIn  = Math.min(Math.max((progress - (i / N) * 0.25) / 0.12, 0), 1);
        if (fadeIn < 0.02) return;

        // Draw connector from orbit ring edge toward center
        const edgeX = cx + Math.cos(angle) * (R - 14);
        const edgeY = cy + Math.sin(angle) * (R - 14);
        ctx.save();
        ctx.globalAlpha = fadeIn * 0.2;
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(edgeX, edgeY);
        ctx.lineTo(cx + Math.cos(angle) * R * 0.52, cy + Math.sin(angle) * R * 0.52);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        drawPill(x, y, label, color, fadeIn);
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', setSize);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#050D1A',
        cursor: 'default',
      }}
    >
      {/* Canvas — space + orbiting phases */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />

      {/* Logo — absolutely centered, above canvas */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        zIndex: 1,
      }}>
        <m.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.1 }}
        >
          <AcornLogo variant="mark" height={68} white />
        </m.div>
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.22em',
            color: '#4a6070', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          SDLC Intelligence Platform
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0, y: 14 }}
        animate={readyToContinue ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'absolute',
          right: '24px',
          bottom: '24px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: readyToContinue ? 'auto' : 'none',
        }}
      >
        <button
          onClick={() => navigate('/landing')}
          style={{
            padding: '8px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(26,111,212,0.4)',
            background: 'rgba(13,27,42,0.78)',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
            backdropFilter: 'blur(10px)',
          }}
        >
          Enter
        </button>
      </m.div>
    </div>
  );
};

export default SplashScreen;
