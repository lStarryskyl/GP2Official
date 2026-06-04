import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { AcornLogo } from '@/components/AcornLogo';
import { AlertCircle, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, User, Building2, Mail, Lock } from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
  return score;
}

const STRENGTH_COLORS = ['#ef4444', '#F97316', '#1A6FD4', '#22c55e'];
const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// ─── Orbital canvas (same as LoginPage) ──────────────────────────────────────

const ORBIT_LABELS = [
  'Brief', 'Feasibility', 'Requirements', 'Validation',
  'Tech Stack', 'Architecture', 'Design', 'Planning',
  'Tasks', 'Costs', 'Risk', 'Testing', 'Deployment',
];

const OrbitalCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const N = ORBIT_LABELS.length;
    const baseColors = ['#1A6FD4', '#F97316'];

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
        return { x: cx + Math.cos(angle) * ring, y: cy + Math.sin(angle) * ring, label, color: baseColors[i % 2] };
      });

      [R1, R2].forEach(r => {
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(26,111,212,0.08)'; ctx.lineWidth = 1; ctx.stroke();
      });

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]; const b = nodes[(i + 2) % nodes.length];
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = R2 * 1.1;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.14;
          ctx.strokeStyle = `rgba(26,111,212,${alpha})`; ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R1 * 0.4);
      grad.addColorStop(0, 'rgba(26,111,212,0.1)'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, R1 * 0.4, 0, Math.PI * 2); ctx.fill();

      nodes.forEach(n => {
        const label = n.label;
        ctx.font = "600 11px 'DM Sans', sans-serif";
        const tw = ctx.measureText(label).width;
        const pw = tw + 20; const ph = 22;
        const px = n.x - pw / 2; const py = n.y - ph / 2; const r = ph / 2;
        ctx.beginPath();
        ctx.moveTo(px + r, py); ctx.lineTo(px + pw - r, py);
        ctx.arcTo(px + pw, py, px + pw, py + r, r);
        ctx.lineTo(px + pw, py + ph - r);
        ctx.arcTo(px + pw, py + ph, px + pw - r, py + ph, r);
        ctx.lineTo(px + r, py + ph);
        ctx.arcTo(px, py + ph, px, py + ph - r, r);
        ctx.lineTo(px, py + r); ctx.arcTo(px, py, px + r, py, r);
        ctx.closePath();
        ctx.fillStyle = n.color + '22'; ctx.fill();
        ctx.strokeStyle = n.color + '88'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = 'rgba(232,237,245,0.85)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, n.x, n.y); ctx.textBaseline = 'alphabetic';
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

// ─── Animated checkbox ────────────────────────────────────────────────────────

const AnimatedCheckbox: React.FC<{ checked: boolean; onChange: () => void; id: string }> = ({ checked, onChange, id }) => (
  <label htmlFor={id} className="anim-checkbox-label">
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="anim-checkbox-input" />
    <span className={`anim-checkbox-box${checked ? ' checked' : ''}`} aria-hidden>
      <svg viewBox="0 0 16 16" width="16" height="16">
        <polyline
          className="anim-check-mark"
          points="2.5,8 6.5,12 13.5,4"
          fill="none" stroke="#fff" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </span>
  </label>
);

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepPips: React.FC<{ step: number }> = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
    {[1, 2].map(s => (
      <React.Fragment key={s}>
        <m.div
          animate={{
            background: step >= s
              ? 'linear-gradient(135deg, #1A6FD4, #3d8fe0)'
              : 'rgba(26,46,69,0.6)',
            boxShadow: step >= s ? '0 4px 14px rgba(26,111,212,0.35)' : 'none',
          }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
            color: step >= s ? '#fff' : '#8899AA',
            border: step >= s ? 'none' : '1px solid rgba(26,111,212,0.22)',
          }}
        >
          {step > s ? '✓' : s}
        </m.div>
        {s < 2 && (
          <m.div
            animate={{ background: step >= 2 ? '#1A6FD4' : 'rgba(26,111,212,0.2)' }}
            transition={{ duration: 0.4 }}
            style={{ width: 40, height: 2, borderRadius: 999 }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Register page ────────────────────────────────────────────────────────────

const fieldVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.22, ease: EASE_OUT } },
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', organization: '', role: 'program_manager', email: '', password: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  const passwordChecks = useMemo(() => ({
    length:    formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number:    /[0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const step1Valid = formData.full_name.length >= 2 && formData.organization.length >= 2;
  const step2Valid = validateEmail(formData.email) && isPasswordValid && termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2Valid) return;
    try {
      await register(formData);
      navigate('/projects');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#050D1A', overflow: 'hidden' }}>

      {/* ── Left panel — canvas ── */}
      <div className="auth-left-panel" style={{
        flex: '0 0 60%', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #050D1A 0%, #0a1525 100%)',
        borderRight: '1px solid rgba(26,111,212,0.12)',
      }}>
        <OrbitalCanvas />
        <div style={{ position: 'absolute', bottom: 48, left: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AcornLogo height={28} white />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4a6070', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            SDLC Intelligence Platform
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: '0 0 40%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(32px, 4vw, 56px)', overflowY: 'auto',
      }}>
        <m.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 32 }}>
            <AcornLogo height={32} white />
          </div>

          <StepPips step={step} />

          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26,
            color: '#E8EDF5', marginBottom: 6, textAlign: 'center', letterSpacing: '-0.02em',
          }}>
            {step === 1 ? 'Create your profile' : 'Secure your account'}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8899AA',
            marginBottom: 28, textAlign: 'center',
          }}>
            {step === 1 ? 'Tell us about yourself' : 'Set up your login credentials'}
          </p>

          {/* Global error */}
          <AnimatePresence>
            {error && (
              <m.div
                key="reg-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
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
                  {error as string}
                </span>
              </m.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <m.div
                  key="step1"
                  variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  <m.div variants={fieldVariants} className="fl-group">
                    <User size={15} className="fl-icon" />
                    <input
                      type="text" id="reg-name" value={formData.full_name}
                      onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder=" " className="fl-input fl-input-icon"
                      data-testid="register-fullname-input"
                    />
                    <label htmlFor="reg-name" className="fl-label fl-label-icon">Full name</label>
                  </m.div>

                  <m.div variants={fieldVariants} className="fl-group">
                    <Building2 size={15} className="fl-icon" />
                    <input
                      type="text" id="reg-org" value={formData.organization}
                      onChange={e => setFormData({ ...formData, organization: e.target.value })}
                      placeholder=" " className="fl-input fl-input-icon"
                      data-testid="register-org-input"
                    />
                    <label htmlFor="reg-org" className="fl-label fl-label-icon">Organization</label>
                  </m.div>

                  <m.div variants={fieldVariants}>
                    <label style={{
                      display: 'block', fontSize: 12, color: '#8899AA',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                      marginBottom: 8, letterSpacing: '0.04em',
                    }}>
                      Your role
                    </label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      data-testid="register-role-select"
                      style={{
                        width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                        background: 'rgba(26,46,69,0.5)', border: '1px solid rgba(26,111,212,0.22)',
                        borderRadius: 12, color: '#E8EDF5',
                        fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: 'none', cursor: 'pointer',
                        transition: 'border-color 0.25s, box-shadow 0.25s',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#1A6FD4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.18)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.22)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.id} value={role.id} style={{ background: '#0D1B2A' }}>{role.label}</option>
                      ))}
                    </select>
                    <p style={{ marginTop: 6, fontSize: 12, color: '#4a6070', fontFamily: "'DM Sans', sans-serif" }}>
                      {ROLE_OPTIONS.find(r => r.id === formData.role)?.description}
                    </p>
                  </m.div>

                  <m.div variants={fieldVariants}>
                    <m.button
                      type="button"
                      onClick={() => step1Valid && setStep(2)}
                      disabled={!step1Valid}
                      whileTap={{ scale: 0.97 }}
                      data-testid="register-continue-btn"
                      style={{
                        width: '100%', padding: 15, borderRadius: 12,
                        background: step1Valid ? 'linear-gradient(135deg, #1A6FD4, #3d8fe0)' : 'rgba(26,46,69,0.5)',
                        border: 'none', cursor: step1Valid ? 'pointer' : 'not-allowed',
                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
                        color: step1Valid ? '#fff' : '#8899AA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: step1Valid ? '0 4px 20px rgba(26,111,212,0.4)' : 'none',
                        transition: 'box-shadow 0.25s',
                      }}
                    >
                      Continue <ArrowRight size={16} />
                    </m.button>
                  </m.div>
                </m.div>
              )}

              {step === 2 && (
                <m.div
                  key="step2"
                  variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
                  initial="initial" animate="animate" exit="exit"
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  <m.div variants={fieldVariants} className="fl-group">
                    <Mail size={15} className="fl-icon" />
                    <input
                      type="email" id="reg-email" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      onBlur={() => setTouched({ ...touched, email: true })}
                      placeholder=" " className="fl-input fl-input-icon"
                      data-testid="register-email-input"
                      style={{ borderColor: touched.email && !validateEmail(formData.email) && formData.email ? 'rgba(239,68,68,0.5)' : undefined }}
                    />
                    <label htmlFor="reg-email" className="fl-label fl-label-icon">Email address</label>
                  </m.div>

                  <m.div variants={fieldVariants}>
                    <div className="fl-group">
                      <Lock size={15} className="fl-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="reg-password" value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder=" " className="fl-input fl-input-icon fl-input-pw"
                        data-testid="register-password-input"
                      />
                      <label htmlFor="reg-password" className="fl-label fl-label-icon">Password</label>
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="fl-eye-btn" aria-label={showPassword ? 'Hide' : 'Show'}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {formData.password && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                          {[0, 1, 2, 3].map(seg => (
                            <div key={seg} style={{
                              flex: 1, height: 4, borderRadius: 999,
                              background: seg < passwordStrength ? STRENGTH_COLORS[passwordStrength - 1] : 'rgba(26,46,69,0.8)',
                              transition: 'background 0.4s',
                              boxShadow: seg < passwordStrength ? `0 0 6px ${STRENGTH_COLORS[passwordStrength - 1]}88` : 'none',
                            }} />
                          ))}
                        </div>
                        <p style={{
                          fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                          color: passwordStrength > 0 ? STRENGTH_COLORS[passwordStrength - 1] : '#8899AA',
                          transition: 'color 0.3s',
                        }}>
                          {passwordStrength > 0 ? STRENGTH_LABELS[passwordStrength - 1] : 'Enter a password'}
                          {' — '}<span style={{ color: '#8899AA' }}>8+ chars, uppercase, number required</span>
                        </p>
                      </div>
                    )}
                  </m.div>

                  <m.label
                    variants={fieldVariants}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingTop: 4 }}
                  >
                    <AnimatedCheckbox id="terms-check" checked={termsAccepted} onChange={() => setTermsAccepted(v => !v)} />
                    <span style={{ fontSize: 13, color: '#8899AA', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55, marginTop: 1 }}>
                      I agree to the{' '}
                      <a href="/terms" style={{ color: '#3d8fe0', textDecoration: 'none' }}>Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" style={{ color: '#3d8fe0', textDecoration: 'none' }}>Privacy Policy</a>
                    </span>
                  </m.label>

                  <m.div variants={fieldVariants} style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      type="button" onClick={() => setStep(1)}
                      style={{
                        flex: '0 0 auto', padding: '14px 20px', background: 'rgba(26,46,69,0.4)',
                        border: '1px solid rgba(26,111,212,0.22)', borderRadius: 12, color: '#8899AA',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,46,69,0.7)'; (e.currentTarget as HTMLElement).style.color = '#E8EDF5'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,46,69,0.4)'; (e.currentTarget as HTMLElement).style.color = '#8899AA'; }}
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                    <m.button
                      type="submit"
                      disabled={isLoading || !step2Valid}
                      whileTap={{ scale: 0.97 }}
                      data-testid="register-submit-btn"
                      style={{
                        flex: 1, padding: 15, borderRadius: 12,
                        background: step2Valid ? 'linear-gradient(135deg, #1A6FD4, #3d8fe0)' : 'rgba(26,46,69,0.5)',
                        border: 'none', cursor: (isLoading || !step2Valid) ? 'not-allowed' : 'pointer',
                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
                        color: step2Valid ? '#fff' : '#8899AA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: (isLoading || !step2Valid) ? 0.65 : 1,
                        boxShadow: step2Valid ? '0 4px 20px rgba(26,111,212,0.4)' : 'none',
                        transition: 'box-shadow 0.25s',
                      }}
                    >
                      {isLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : 'Create Account'}
                    </m.button>
                  </m.div>
                </m.div>
              )}
            </AnimatePresence>
          </form>

          <p style={{
            textAlign: 'center', marginTop: 28,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8899AA',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3d8fe0', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#4a6070', textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          </div>
        </m.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .fl-group { position: relative; }
        .fl-icon {
          position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
          color: #8899AA; pointer-events: none; z-index: 1; transition: color 0.2s;
        }
        .fl-group:focus-within .fl-icon { color: #1A6FD4; }

        .fl-input {
          width: 100%; padding: 20px 16px 8px; box-sizing: border-box;
          background: rgba(26,46,69,0.45); border: 1px solid rgba(26,111,212,0.2);
          border-radius: 12px; color: #E8EDF5; font-size: 15px;
          font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.25s, box-shadow 0.25s; caret-color: #3d8fe0;
        }
        .fl-input:focus { border-color: #1A6FD4; box-shadow: 0 0 0 3px rgba(26,111,212,0.16); }
        .fl-input::placeholder { color: transparent; }
        .fl-input-icon { padding-left: 42px; }
        .fl-input-pw { padding-right: 46px; }

        .fl-label {
          position: absolute; left: 16px; top: 14px; color: #8899AA;
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          pointer-events: none; transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .fl-label-icon { left: 42px; }
        .fl-input:focus ~ .fl-label, .fl-input:not(:placeholder-shown) ~ .fl-label {
          top: 7px; font-size: 11px; color: #1A6FD4; letter-spacing: 0.04em; font-weight: 600; left: 16px;
        }

        .fl-eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #8899AA; cursor: pointer; padding: 4px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .fl-eye-btn:hover { color: #E8EDF5; }

        .anim-checkbox-label { display: inline-flex; align-items: center; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
        .anim-checkbox-input { position: absolute; opacity: 0; width: 0; height: 0; }
        .anim-checkbox-box {
          width: 20px; height: 20px; border-radius: 6px; border: 2px solid rgba(26,111,212,0.4);
          background: rgba(26,46,69,0.5); display: flex; align-items: center; justify-content: center;
          transition: background 0.25s, border-color 0.25s, box-shadow 0.25s; flex-shrink: 0;
        }
        .anim-checkbox-box.checked { background: #1A6FD4; border-color: #1A6FD4; box-shadow: 0 0 10px rgba(26,111,212,0.45); }
        .anim-check-mark { stroke-dasharray: 18; stroke-dashoffset: 18; transition: stroke-dashoffset 0.3s cubic-bezier(0.22,1,0.36,1) 0.05s; }
        .anim-checkbox-box.checked .anim-check-mark { stroke-dashoffset: 0; }

        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
          .auth-mobile-logo { display: block !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-check-mark { transition: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </div>
  );
};
