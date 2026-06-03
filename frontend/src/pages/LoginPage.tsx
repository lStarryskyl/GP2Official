import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { AcornLogo } from '../components/AcornLogo';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { if (isAuthenticated) navigate('/projects'); }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.email || !formData.password) { setError('Please fill in all fields'); return; }
    try {
      await login(formData.email, formData.password);
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
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

      <div className="login-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <AcornLogo height={40} white />
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '26px',
          color: '#E8EDF5', marginBottom: '6px', textAlign: 'center', letterSpacing: '-0.02em',
        }}>
          Welcome back
        </h1>
        <p style={{
          color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
          marginBottom: '32px', textAlign: 'center',
        }}>
          Sign in to your workspace
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            marginBottom: '20px',
          }}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ color: '#fca5a5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="fl-group">
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
          </div>

          <div className="fl-group">
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
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="fl-eye-btn"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="login-submit-btn">
            <span className="login-shimmer" aria-hidden />
            {isLoading
              ? <Loader2 size={18} style={{ animation: 'rotate-slow 1s linear infinite' }} />
              : 'Sign In'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '28px',
          color: '#8899AA', fontSize: '14px', fontFamily: "'DM Sans', sans-serif",
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#3d8fe0', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
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

        .login-card {
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

        .fl-input:focus ~ .fl-label,
        .fl-input:not(:placeholder-shown) ~ .fl-label {
          top: 7px;
          font-size: 11px;
          color: #1A6FD4;
          letter-spacing: 0.04em;
          font-weight: 600;
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

        .login-submit-btn {
          position: relative;
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #1A6FD4 0%, #3d8fe0 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: box-shadow 0.25s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(26,111,212,0.4);
          margin-top: 4px;
        }

        .login-submit-btn:hover:not(:disabled) {
          box-shadow: 0 10px 36px rgba(26,111,212,0.55);
          transform: translateY(-2px);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-shimmer {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transition: left 0.55s ease;
          pointer-events: none;
        }

        .login-submit-btn:hover:not(:disabled) .login-shimmer {
          left: 100%;
        }

        @media (max-width: 480px) {
          .login-card { padding: 28px 20px; border-radius: 18px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-card { animation: none !important; opacity: 1 !important; }
          .fl-label, .fl-input, .login-submit-btn { transition: none !important; }
          .login-shimmer { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
