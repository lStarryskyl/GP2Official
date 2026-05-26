import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AcornLogo } from '@/components/AcornLogo';
import { AlertCircle, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, User, Building2, Mail, Lock } from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';

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

const AnimatedCheckbox: React.FC<{ checked: boolean; onChange: () => void; id: string }> = ({ checked, onChange, id }) => (
  <label htmlFor={id} className="anim-checkbox-label">
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="anim-checkbox-input" />
    <span className={`anim-checkbox-box${checked ? ' checked' : ''}`} aria-hidden>
      <svg viewBox="0 0 16 16" width="16" height="16">
        <polyline
          className="anim-check-mark"
          points="2.5,8 6.5,12 13.5,4"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  </label>
);

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    role: 'program_manager',
    email: '',
    password: '',
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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#070C14', position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      <div className="splash-stars" aria-hidden style={{ position: 'fixed', zIndex: 0, inset: 0 }} />
      <div className="splash-aurora splash-aurora-blue" aria-hidden style={{ position: 'fixed', zIndex: 0 }} />
      <div className="splash-aurora splash-aurora-orange" aria-hidden style={{ position: 'fixed', zIndex: 0 }} />

      <div className="reg-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <Link to="/">
            <AcornLogo height={38} white />
          </Link>
        </div>

        {/* Step pips */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                width: s === step ? '32px' : '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px',
                background: step >= s
                  ? 'linear-gradient(135deg, #1A6FD4, #3d8fe0)'
                  : 'rgba(26,46,69,0.6)',
                color: step >= s ? '#fff' : '#8899AA',
                border: step >= s ? 'none' : '1px solid rgba(26,111,212,0.22)',
                boxShadow: step >= s ? '0 4px 14px rgba(26,111,212,0.35)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
              }}>
                {step > s ? '✓' : s}
              </div>
              {s < 2 && (
                <div style={{
                  width: '40px', height: '2px', borderRadius: '999px',
                  background: step >= 2 ? '#1A6FD4' : 'rgba(26,111,212,0.2)',
                  transition: 'background 0.4s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px',
          color: '#E8EDF5', marginBottom: '6px', textAlign: 'center', letterSpacing: '-0.02em',
        }}>
          {step === 1 ? 'Create your profile' : 'Secure your account'}
        </h1>
        <p style={{
          color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
          marginBottom: '28px', textAlign: 'center',
        }}>
          {step === 1 ? 'Tell us about yourself' : 'Set up your login credentials'}
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            marginBottom: '20px',
          }}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ color: '#fca5a5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{error as string}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {step === 1 && (
            <>
              <div className="fl-group">
                <User size={15} className="fl-icon" />
                <input
                  type="text"
                  id="reg-name"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder=" "
                  className="fl-input fl-input-icon"
                  data-testid="register-fullname-input"
                />
                <label htmlFor="reg-name" className="fl-label fl-label-icon">Full name</label>
              </div>

              <div className="fl-group">
                <Building2 size={15} className="fl-icon" />
                <input
                  type="text"
                  id="reg-org"
                  value={formData.organization}
                  onChange={e => setFormData({ ...formData, organization: e.target.value })}
                  placeholder=" "
                  className="fl-input fl-input-icon"
                  data-testid="register-org-input"
                />
                <label htmlFor="reg-org" className="fl-label fl-label-icon">Organization</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: '8px', letterSpacing: '0.04em' }}>
                  Your role
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  data-testid="register-role-select"
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(26,46,69,0.5)',
                    border: '1px solid rgba(26,111,212,0.22)',
                    borderRadius: '12px', color: '#E8EDF5',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '15px',
                    outline: 'none', cursor: 'pointer',
                    transition: 'border-color 0.25s, box-shadow 0.25s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1A6FD4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.18)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.22)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.id} value={role.id} style={{ background: '#0D1B2A' }}>{role.label}</option>
                  ))}
                </select>
                <p style={{ marginTop: '6px', fontSize: '12px', color: '#4a6070', fontFamily: "'DM Sans', sans-serif" }}>
                  {ROLE_OPTIONS.find((r) => r.id === formData.role)?.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => step1Valid && setStep(2)}
                disabled={!step1Valid}
                data-testid="register-continue-btn"
                className="reg-submit-btn"
                style={{ marginTop: '4px' }}
              >
                <span className="reg-shimmer" aria-hidden />
                Continue <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="fl-group">
                <Mail size={15} className="fl-icon" />
                <input
                  type="email"
                  id="reg-email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  placeholder=" "
                  className="fl-input fl-input-icon"
                  data-testid="register-email-input"
                  style={{
                    borderColor: touched.email && !validateEmail(formData.email) && formData.email
                      ? 'rgba(239,68,68,0.5)' : undefined,
                  }}
                />
                <label htmlFor="reg-email" className="fl-label fl-label-icon">Email address</label>
              </div>

              <div>
                <div className="fl-group">
                  <Lock size={15} className="fl-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder=" "
                    className="fl-input fl-input-icon fl-input-pw"
                    data-testid="register-password-input"
                  />
                  <label htmlFor="reg-password" className="fl-label fl-label-icon">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="fl-eye-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {formData.password && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '6px' }}>
                      {[0, 1, 2, 3].map(seg => (
                        <div
                          key={seg}
                          style={{
                            flex: 1, height: '4px', borderRadius: '999px',
                            background: seg < passwordStrength
                              ? STRENGTH_COLORS[passwordStrength - 1]
                              : 'rgba(26,46,69,0.8)',
                            transition: 'background 0.4s',
                            boxShadow: seg < passwordStrength
                              ? `0 0 6px ${STRENGTH_COLORS[passwordStrength - 1]}88`
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <p style={{
                      fontSize: '12px', fontFamily: "'DM Sans', sans-serif",
                      color: passwordStrength > 0 ? STRENGTH_COLORS[passwordStrength - 1] : '#8899AA',
                      transition: 'color 0.3s',
                    }}>
                      {passwordStrength > 0 ? STRENGTH_LABELS[passwordStrength - 1] : 'Enter a password'}
                      {' — '}
                      <span style={{ color: '#8899AA' }}>
                        8+ chars, uppercase, number required
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                cursor: 'pointer', paddingTop: '4px',
              }}>
                <AnimatedCheckbox
                  id="terms-check"
                  checked={termsAccepted}
                  onChange={() => setTermsAccepted(v => !v)}
                />
                <span style={{ fontSize: '13px', color: '#8899AA', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55, marginTop: '1px' }}>
                  I agree to the{' '}
                  <a href="/terms" style={{ color: '#3d8fe0', textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" style={{ color: '#3d8fe0', textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: '0 0 auto', padding: '14px 20px',
                    background: 'rgba(26,46,69,0.4)',
                    border: '1px solid rgba(26,111,212,0.22)',
                    borderRadius: '12px', color: '#8899AA',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                    fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,46,69,0.7)'; (e.currentTarget as HTMLElement).style.color = '#E8EDF5'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,46,69,0.4)'; (e.currentTarget as HTMLElement).style.color = '#8899AA'; }}
                >
                  <ArrowLeft size={15} /> Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !step2Valid}
                  data-testid="register-submit-btn"
                  className="reg-submit-btn"
                  style={{ flex: 1 }}
                >
                  <span className="reg-shimmer" aria-hidden />
                  {isLoading
                    ? <><Loader2 size={17} style={{ animation: 'rotate-slow 1s linear infinite' }} /> Creating...</>
                    : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        <p style={{
          textAlign: 'center', marginTop: '28px',
          color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3d8fe0', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <Link to="/" style={{
            color: '#4a6070', fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8899AA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a6070'; }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes cardUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .reg-card {
          padding: 40px 36px;
          background: rgba(13,27,42,0.78);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(26,111,212,0.25);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
          animation: cardUp 700ms cubic-bezier(0.22,1,0.36,1) both;
        }

        .fl-group {
          position: relative;
        }

        .fl-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #8899AA;
          pointer-events: none;
          z-index: 1;
          transition: color 0.2s;
        }

        .fl-group:focus-within .fl-icon {
          color: #1A6FD4;
        }

        .fl-input {
          width: 100%;
          padding: 20px 16px 8px;
          background: rgba(26,46,69,0.5);
          border: 1px solid rgba(26,111,212,0.22);
          border-radius: 12px;
          color: #E8EDF5;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          box-sizing: border-box;
          caret-color: #3d8fe0;
        }

        .fl-input-icon {
          padding-left: 42px;
        }

        .fl-input-pw {
          padding-right: 46px;
        }

        .fl-input:focus {
          border-color: #1A6FD4;
          box-shadow: 0 0 0 3px rgba(26,111,212,0.18);
        }

        .fl-input::placeholder { color: transparent; }

        .fl-label {
          position: absolute;
          left: 16px;
          top: 14px;
          color: #8899AA;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          transform-origin: left top;
        }

        .fl-label-icon {
          left: 42px;
        }

        .fl-input:focus ~ .fl-label,
        .fl-input:not(:placeholder-shown) ~ .fl-label {
          top: 7px;
          font-size: 11px;
          color: #1A6FD4;
          letter-spacing: 0.04em;
          font-weight: 600;
          left: 16px;
        }

        .fl-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #8899AA;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .fl-eye-btn:hover { color: #E8EDF5; }

        .reg-submit-btn {
          position: relative;
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #1A6FD4 0%, #3d8fe0 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: box-shadow 0.25s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(26,111,212,0.4);
        }

        .reg-submit-btn:hover:not(:disabled) {
          box-shadow: 0 10px 36px rgba(26,111,212,0.55);
          transform: translateY(-2px);
        }

        .reg-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reg-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transition: left 0.55s ease;
          pointer-events: none;
        }

        .reg-submit-btn:hover:not(:disabled) .reg-shimmer {
          left: 100%;
        }

        /* Animated checkbox */
        .anim-checkbox-label {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .anim-checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .anim-checkbox-box {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid rgba(26,111,212,0.4);
          background: rgba(26,46,69,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
          flex-shrink: 0;
        }

        .anim-checkbox-box.checked {
          background: #1A6FD4;
          border-color: #1A6FD4;
          box-shadow: 0 0 10px rgba(26,111,212,0.45);
        }

        .anim-check-mark {
          stroke-dasharray: 18;
          stroke-dashoffset: 18;
          transition: stroke-dashoffset 0.3s cubic-bezier(0.22,1,0.36,1) 0.05s;
        }

        .anim-checkbox-box.checked .anim-check-mark {
          stroke-dashoffset: 0;
        }

        @media (max-width: 480px) {
          .reg-card { padding: 28px 18px; border-radius: 18px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .reg-card { animation: none !important; opacity: 1 !important; }
          .anim-check-mark { transition: none !important; stroke-dashoffset: 0 !important; }
          .reg-shimmer { display: none !important; }
        }
      `}</style>
    </div>
  );
};
