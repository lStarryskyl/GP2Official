import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { AcornLogo } from '../components/AcornLogo';

const PHASES = [
  'Brief', 'Feasibility', 'Requirements', 'Validation',
  'Tech Stack', 'Architecture', 'Design', 'Planning',
  'Tasks', 'Costs', 'Risk', 'Testing', 'Deployment',
];

const TOTAL_MS = 3400;

export const SplashScreen: React.FC = () => {
  const navigate   = useNavigate();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const startRef   = useRef<number>(0);

  // Navigate away after animation
  useEffect(() => {
    const t = setTimeout(() => navigate('/landing'), TOTAL_MS + 500);
    return () => clearTimeout(t);
  }, [navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Star field
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.3 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.15,
    }));

    // Draw a pill node
    function drawPill(x: number, y: number, label: string, color: string, alpha: number, glow: number) {
      ctx.font = "600 12px 'DM Sans', sans-serif";
      const tw = ctx.measureText(label).width;
      const pw = tw + 24; const ph = 26; const r = 13;
      const px = x - pw / 2; const py = y - ph / 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      if (glow > 0.1) { ctx.shadowColor = color; ctx.shadowBlur = 16 * glow; }

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
      ctx.fillStyle   = color + '30';
      ctx.fill();
      ctx.strokeStyle = color + 'dd';
      ctx.lineWidth   = 1.2;
      ctx.shadowBlur  = 0;
      ctx.stroke();

      ctx.fillStyle = 'rgba(232,237,245,0.95)';
      ctx.textAlign = 'center';
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
        const twinkle = 0.25 + 0.75 * Math.abs(Math.sin((now / 1000) * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,255,${twinkle * 0.55})`;
        ctx.fill();
      });

      const cx = W / 2;
      const cy = H / 2;

      // Speed ramps — slow then fast
      const speed = 0.25 + progress * 3.8;
      const t = (now / 1000) * speed;

      const R1 = Math.min(W, H) * 0.27;
      const R2 = Math.min(W, H) * 0.42;
      const N  = PHASES.length;

      // Orbit rings
      [R1, R2].forEach((r, ri) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ri === 0
          ? 'rgba(26,111,212,0.14)'
          : 'rgba(249,115,22,0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Center glow behind logo
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R1 * 0.6);
      grad.addColorStop(0, 'rgba(249,115,22,0.22)');
      grad.addColorStop(0.5, 'rgba(26,111,212,0.10)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R1 * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Phase nodes
      const nodes = PHASES.map((label, i) => {
        const ring   = i % 2 === 0 ? R1 : R2;
        const dir    = i % 2 === 0 ? 1 : -0.75;
        const offset = (i / N) * Math.PI * 2;
        const angle  = t * dir + offset;
        const color  = i % 2 === 0 ? '#1A6FD4' : '#F97316';
        const fadeIn = Math.min(Math.max((progress - (i / N) * 0.22) / 0.1, 0), 1);
        const glow   = Math.max(0, Math.sin((now / 700) + i)) * 0.7;
        return {
          x: cx + Math.cos(angle) * ring,
          y: cy + Math.sin(angle) * ring,
          label, color, alpha: fadeIn, glow,
        };
      });

      // Dashed connectors
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i]; const b = nodes[i + 1];
        if (a.alpha < 0.1 || b.alpha < 0.1) continue;
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < R2 * 1.4) {
          const al = Math.min(a.alpha, b.alpha) * (1 - dist / (R2 * 1.4)) * 0.28;
          ctx.strokeStyle = `rgba(26,111,212,${al})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 7]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      nodes.forEach(n => {
        if (n.alpha < 0.02) return;
        drawPill(n.x, n.y, n.label, n.color, n.alpha, n.glow);
      });

      // Exit fade overlay
      if (progress >= 0.9) {
        const fadeOut = (progress - 0.9) / 0.1;
        ctx.fillStyle = `rgba(5,13,26,${fadeOut})`;
        ctx.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#050D1A' }}>
      {/* Canvas — space scene + orbiting phases */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />

      {/* Acorn logo — real SVG centered, sits above canvas */}
      <m.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          pointerEvents: 'none',
        }}
      >
        <AcornLogo variant="mark" height={72} white />
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10, letterSpacing: '0.2em',
            color: '#4a6070', textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          SDLC Intelligence Platform
        </m.div>
      </m.div>
    </div>
  );
};

export default SplashScreen;
