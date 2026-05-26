import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { AcornLogo } from '../components/AcornLogo';

/* ── Animated SDLC pipeline on the left panel ── */
const PIPELINE_NODES = ['Brief', 'Requirements', 'SRS', 'Design', 'Tasks', 'Deploy'];

const PipelineAnimation: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % (PIPELINE_NODES.length * 2 + 4)), 600);
    return () => clearInterval(id);
  }, []);

  const nodeVisible = (i: number) => step >= i * 2;
  const lineVisible = (i: number) => step >= i * 2 + 1;

  return (
    <svg width="100%" height="200" viewBox="0 0 520 200" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow-blue">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {PIPELINE_NODES.map((label, i) => {
        const x = 20 + i * 84;
        const show = nodeVisible(i);
        const isLast = i === PIPELINE_NODES.length - 1;
        const isActive = step >= PIPELINE_NODES.length * 2 + 1 && i === PIPELINE_NODES.length - 1;
        return (
          <g key={label}>
            {/* Connector line */}
            {!isLast && lineVisible(i) && (
              <line
                x1={x + 64} y1={70} x2={x + 84} y2={70}
                stroke="#F97316" strokeWidth="2.5"
                strokeDasharray="60" strokeDashoffset="0"
                style={{ animation: 'pipelineDraw 0.35s ease forwards' }}
              />
            )}
            {/* Node box */}
            {show && (
              <g style={{ animation: 'nodeAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                <rect
                  x={x} y={50} width={64} height={38} rx={8}
                  fill={isActive ? '#F97316' : '#1A6FD4'}
                  opacity={0.92}
                  filter="url(#glow-blue)"
                />
                <text x={x + 32} y={74} textAnchor="middle"
                  fill="#fff" fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="600">
                  {label}
                </text>
                {/* Arrow head */}
                {!isLast && (
                  <polygon
                    points={`${x+64},66 ${x+72},70 ${x+64},74`}
                    fill="#F97316" opacity={lineVisible(i) ? 1 : 0}
                  />
                )}
              </g>
            )}
          </g>
        );
      })}
      {/* "Acorn AI" label below */}
      {step >= PIPELINE_NODES.length * 2 + 2 && (
        <text x="260" y="140" textAnchor="middle"
          fill="rgba(26,111,212,0.6)" fontSize="13"
          fontFamily="Syne, sans-serif" fontWeight="700" letterSpacing="0.15em"
          style={{ animation: 'revealUp 0.6s ease forwards' }}>
          POWERED BY GEMINI AI
        </text>
      )}
    </svg>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();

  const [formData, setFormData]         = useState({ email: '', password: '' });
  const [error, setError]               = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState<string | null>(null);

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

  const inputStyle = (name: string): React.CSSProperties => ({
    width: '100%', padding: '13px 16px 13px 44px',
    background: 'var(--brand-800)',
    border: `1px solid ${focused === name ? 'var(--blue-500)' : 'rgba(26,111,212,0.25)'}`,
    borderRadius: '10px', color: 'var(--text-primary)',
    fontSize: '15px', fontFamily: "'DM Sans', sans-serif",
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === name ? '0 0 0 3px rgba(26,111,212,0.18)' : 'none',
    boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--brand-900)' }}>

      {/* ── Left: animated canvas ── */}
      <div style={{
        width: '50%', display: 'none', flexDirection: 'column',
        background: 'linear-gradient(160deg, #0d2b52 0%, #0D1B2A 60%, #111f30 100%)',
        borderRight: '1px solid rgba(26,111,212,0.2)',
        padding: '40px', position: 'relative', overflow: 'hidden',
      }} className="lg:flex flex-col">
        {/* Grid overlay */}
        <div className="bg-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div className="glow-orb glow-orb-forest" style={{ width: '400px', height: '400px', top: '10%', left: '-10%' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
          <AcornLogo height={44} white />
        </div>

        {/* Centre content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.2 }}>
            AI-Powered<br />Project Planning
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontFamily: "'DM Sans', sans-serif", marginBottom: '48px', lineHeight: 1.7 }}>
            Describe your project and Acorn generates a complete SDLC plan — requirements, SRS, designs, tasks, risk analysis, and cost estimates.
          </p>
          <PipelineAnimation />
        </div>

        {/* Bottom tagline */}
        <p style={{ color: 'var(--text-faint)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", position: 'relative', zIndex: 1 }}>
          Trusted by product teams worldwide
        </p>
      </div>

      {/* ── Right: login form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--brand-900)',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }} className="animate-reveal-up">
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }} className="lg:hidden">
            <AcornLogo height={38} white />
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontFamily: "'DM Sans', sans-serif", marginBottom: '32px' }}>
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div className="delay-100 animate-reveal-up" style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email" name="email" placeholder="you@company.com"
                value={formData.email}
                onChange={e => { setFormData(p => ({ ...p, email: e.target.value })); setError(null); }}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                style={inputStyle('email')}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="delay-200 animate-reveal-up" style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-faint)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'} name="password" placeholder="Your password"
                value={formData.password}
                onChange={e => { setFormData(p => ({ ...p, password: e.target.value })); setError(null); }}
                onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                style={{ ...inputStyle('password'), paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: '4px' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="delay-300 animate-reveal-up"
              style={{
                width: '100%', padding: '14px',
                background: isLoading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #F97316, #cc4900)',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
                transition: 'all 0.2s',
                marginTop: '4px',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLoading ? <Loader2 size={18} style={{ animation: 'rotate-slow 1s linear infinite' }} /> : <><ArrowRight size={18} />Sign In</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--blue-300)', fontWeight: 600, textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
