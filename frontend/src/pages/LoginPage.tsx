import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { AcornLogo } from '../components/AcornLogo';

// ─── Orbital canvas ────────────────────────────────────────────────────────────

const ORBIT_LABELS = [
  'Brief', 'Feasibility', 'Requirements', 'Validation',
  'Tech Stack', 'Architecture', 'Design', 'Planning',
  'Tasks', 'Costs', 'Risk', 'Testing', 'Deployment',
];

const BLUE = '#1A6FD4';
const ORANGE = '#F97316';

const OrbitalCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = ORBIT_LABELS.length;
    const baseColors = [BLUE, ORANGE];

    let t = 0;
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.006;

      const cx = W / 2;
      const cy = H / 2;
      const R1 = Math.min(W, H) * 0.28;
      const R2 = Math.min(W, H) * 0.42;

      const nodes = ORBIT_LABELS.map((label, i) => {
        const ring = i % 2 === 0 ? R1 : R2;
        const speed = i % 2 === 0 ? 1 : -0.7;
        const offset = (i / N) * Math.PI * 2;
        const angle = t * speed + offset;
        return {
          x: cx + Math.cos(angle) * ring,
          y: cy + Math.sin(angle) * ring,
          label,
          color: baseColors[i % 2],
        };
      });

      // Orbit rings
      [R1, R2].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(26,111,212,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Connections between adjacent nodes of same ring
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const b = nodes[(i + 2) % nodes.length];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = R2 * 1.1;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          ctx.strokeStyle = `rgba(26,111,212,${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Center glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R1 * 0.5);
      grad.addColorStop(0, 'rgba(249,115,22,0.18)');
      grad.addColorStop(0.5, 'rgba(26,111,212,0.08)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R1 * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Nodes — pill shape with label
      nodes.forEach(n => {
        const label = n.label;
        ctx.font = "600 11px 'DM Sans', sans-serif";
        const tw = ctx.measureText(label).width;
        const pw = tw + 20;
        const ph = 22;
        const px = n.x - pw / 2;
        const py = n.y - ph / 2;
        const r  = ph / 2;

        // Pill background
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
        ctx.fillStyle = n.color + '22';
        ctx.fill();
        ctx.strokeStyle = n.color + '88';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label text
        ctx.fillStyle = 'rgba(232,237,245,0.85)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, n.x, n.y);
        ctx.textBaseline = 'alphabetic';
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {/* Acorn mark centered in orbit */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AcornLogo variant="mark" height={54} white />
      </div>
    </div>
  );
};

// ─── Form field ────────────────────────────────────────────────────────────────

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const fieldVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

// ─── Login page ────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/projects'); }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.email || !formData.password) { setError('Please fill in all fields'); return; }
    try {
      setSubmitted(true);
      await login(formData.email, formData.password);
      navigate('/projects');
    } catch (err: any) {
      setSubmitted(false);
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#050D1A', overflow: 'hidden',
    }}>
      {/* ── Left panel — canvas ── */}
      <div className="auth-left-panel" style={{
        flex: '0 0 60%', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #050D1A 0%, #0a1525 100%)',
        borderRight: '1px solid rgba(26,111,212,0.12)',
      }}>
        <OrbitalCanvas />
        {/* Brand overlay */}
        <div style={{
          position: 'absolute', bottom: 48, left: 48,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <AcornLogo height={28} white />
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            color: '#4a6070', letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            SDLC Intelligence Platform
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: '0 0 40%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px, 5vw, 64px)',
      }}>
        <m.div
          initial={{ opacity: 0, x: 40 }}
          animate={submitted ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
          transition={{ duration: submitted ? 0.3 : 0.55, ease: EASE_OUT }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* Mobile logo — hidden on desktop */}
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 32 }}>
            <AcornLogo height={32} white />
          </div>

          <m.div
            variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            initial="initial"
            animate="animate"
          >
            <m.div variants={fieldVariants}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28,
                color: '#E8EDF5', marginBottom: 6, letterSpacing: '-0.02em',
              }}>
                Welcome back
              </h1>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8899AA', marginBottom: 36,
              }}>
                Sign in to your workspace
              </p>
            </m.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <m.div
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)',
                    overflow: 'hidden',
                  }}
                >
                  <AlertCircle size={15} color="#ef4444" />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#fca5a5' }}>
                    {error}
                  </span>
                </m.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <m.div variants={fieldVariants} className="fl-group">
                <input
                  type="email"
                  id="login-email"
                  value={formData.email}
                  onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); setError(null); }}
                  autoComplete="email"
                  className="fl-input"
                  placeholder=" "
                />
                <label htmlFor="login-email" className="fl-label">Email address</label>
              </m.div>

              <m.div variants={fieldVariants} className="fl-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={formData.password}
                  onChange={e => { setFormData(p => ({ ...p, password: e.target.value })); setError(null); }}
                  autoComplete="current-password"
                  className="fl-input fl-input-pw"
                  placeholder=" "
                />
                <label htmlFor="login-password" className="fl-label">Password</label>
                <button type="button" onClick={() => setShowPassword(v => !v)} className="fl-eye-btn">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </m.div>

              <m.div variants={fieldVariants}>
                <m.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                    border: '1px solid rgba(26,111,212,0.4)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, opacity: isLoading ? 0.65 : 1,
                    boxShadow: '0 4px 20px rgba(26,111,212,0.35)',
                  }}
                >
                  {isLoading
                    ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                    : 'Sign In'}
                </m.button>
              </m.div>
            </form>

            <m.p
              variants={fieldVariants}
              style={{
                textAlign: 'center', marginTop: 28,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8899AA',
              }}
            >
              No account?{' '}
              <Link to="/register" style={{ color: '#3d8fe0', fontWeight: 600, textDecoration: 'none' }}>
                Create one free
              </Link>
            </m.p>

            <m.div variants={fieldVariants} style={{ textAlign: 'center', marginTop: 12 }}>
              <Link
                to="/landing"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4a6070', textDecoration: 'none' }}
              >
                ← Back to Home
              </Link>
            </m.div>
          </m.div>
        </m.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .fl-group { position: relative; }

        .fl-input {
          width: 100%; padding: 20px 16px 8px; box-sizing: border-box;
          background: rgba(26,46,69,0.45); border: 1px solid rgba(26,111,212,0.2);
          border-radius: 12px; color: #E8EDF5; font-size: 15px;
          font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.25s, box-shadow 0.25s; caret-color: #3d8fe0;
        }
        .fl-input:focus { border-color: #1A6FD4; box-shadow: 0 0 0 3px rgba(26,111,212,0.16); }
        .fl-input::placeholder { color: transparent; }
        .fl-input-pw { padding-right: 46px; }

        .fl-label {
          position: absolute; left: 16px; top: 14px; color: #8899AA;
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          pointer-events: none; transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .fl-input:focus ~ .fl-label, .fl-input:not(:placeholder-shown) ~ .fl-label {
          top: 7px; font-size: 11px; color: #1A6FD4; letter-spacing: 0.04em; font-weight: 600;
        }

        .fl-eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #8899AA; cursor: pointer;
          padding: 4px; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .fl-eye-btn:hover { color: #E8EDF5; }

        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
          .auth-mobile-logo { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
