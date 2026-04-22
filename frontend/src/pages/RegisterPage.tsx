import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import {
  User,
  Building2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Shield,
  Sparkles
} from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';

export const RegisterPage: React.FC = () => {
  const navigate                        = useNavigate();
  const { register, isLoading, error }  = useAuthStore();
  const [step, setStep]                 = useState(1);
  const [isVisible, setIsVisible]       = useState(false);
  const [formData, setFormData]         = useState({
    full_name: '',
    organization: '',
    role: 'program_manager',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const passwordChecks = useMemo(() => ({
    length:    formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number:    /[0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const validateEmail   = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const step1Valid = formData.full_name.length >= 2 && formData.organization.length >= 2;
  const step2Valid = validateEmail(formData.email) && isPasswordValid;

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

  const trustBadges = [
    { icon: Rocket,    label: 'Quick Setup',      desc: 'Get started in 2 minutes' },
    { icon: Sparkles,  label: 'AI-Powered',        desc: 'Smart planning intelligence' },
    { icon: Shield,    label: 'Enterprise Ready',  desc: 'Bank-level security' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: 'var(--brand-900)' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(26,111,212,0.12) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-15"
          style={{ top: '10%', left: '20%', backgroundColor: 'rgba(26,111,212,0.25)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-10"
          style={{ bottom: '20%', right: '30%', backgroundColor: 'rgba(26,46,69,0.4)' }} />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(26,111,212,0.08), var(--brand-900), var(--brand-900))' }} />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">
          {/* Logo */}
          <div className={`flex items-center gap-4 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <img src="/acorn-logo-light.png" alt="Acorn" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* Headline */}
          <h1 className={`text-5xl xl:text-6xl font-bold text-[var(--text-primary)] leading-[1.1] mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Plant the Seed of
            <span className="block mt-3" style={{ background: 'linear-gradient(to right, var(--blue-400), var(--blue-300))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Next Project</span>
          </h1>

          <p className={`text-xl text-[var(--text-muted)] mb-16 max-w-lg leading-relaxed transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Transform complex requirements into a living, growing plan with AI-powered project planning.
          </p>

          {/* Trust Badges */}
          <div className={`space-y-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {trustBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(26,46,69,0.25)',
                  border: '1px solid rgba(26,111,212,0.2)',
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(to bottom right, rgba(26,111,212,0.2), rgba(45,106,63,0.1))' }}>
                  <badge.icon className="w-6 h-6" style={{ color: 'var(--blue-400)' }} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{badge.label}</p>
                  <p className="text-sm text-[var(--text-muted)]">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/acorn-logo-light.png" alt="Acorn" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
            </Link>
          </div>

          {/* Progress Steps */}
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center gap-4">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        step >= s ? 'scale-110' : ''
                      }`}
                      style={{
                        background: step >= s ? 'linear-gradient(to bottom right, var(--blue-400), var(--blue-500))' : 'var(--brand-750)',
                        color: step >= s ? 'var(--brand-900)' : 'var(--text-muted)',
                        boxShadow: step >= s ? '0 10px 25px -5px rgba(26,111,212,0.3)' : 'none'
                      }}
                    >
                      {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${step >= s ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {s === 1 ? 'Profile' : 'Account'}
                    </span>
                  </div>
                  {s < 2 && (
                    <div
                      className="w-16 h-1 rounded-full transition-all duration-500"
                      style={{ backgroundColor: step >= 2 ? 'var(--blue-400)' : 'var(--brand-750)' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Register Card */}
          <div
            className={`rounded-3xl p-8 backdrop-blur-xl transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              backgroundColor: 'rgba(20,43,26,0.8)',
              border: '1px solid var(--brand-700)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                {step === 1 ? 'Create Your Profile' : 'Secure Your Account'}
              </h1>
              <p className="text-[var(--text-muted)]">
                {step === 1 ? 'Tell us about yourself' : 'Set up your login credentials'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--blue-400)] transition-colors" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        data-testid="register-fullname-input"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/30"
                        style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Organization</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--blue-400)] transition-colors" />
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Your Company"
                        data-testid="register-org-input"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/30"
                        style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Your Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      data-testid="register-role-select"
                      className="w-full px-4 py-4 rounded-xl text-[var(--text-primary)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/30"
                      style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id} style={{ backgroundColor: 'var(--brand-850)' }}>{role.label}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {ROLE_OPTIONS.find((r) => r.id === formData.role)?.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => step1Valid && setStep(2)}
                    disabled={!step1Valid}
                    data-testid="register-continue-btn"
                    className="w-full font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{
                      background: 'linear-gradient(to right, var(--blue-400), var(--blue-500))',
                      color: 'var(--brand-900)',
                      boxShadow: '0 10px 25px -5px rgba(26,111,212,0.3)'
                    }}
                  >
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5 inline group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--blue-400)] transition-colors" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        placeholder="you@example.com"
                        data-testid="register-email-input"
                        className="w-full pl-12 pr-12 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/30"
                        style={{
                          backgroundColor: 'var(--brand-850)',
                          border: touched.email && !validateEmail(formData.email) && formData.email
                            ? '1px solid rgba(239,68,68,0.5)'
                            : '1px solid var(--brand-700)'
                        }}
                      />
                      {touched.email && validateEmail(formData.email) && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--blue-400)]" />
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--blue-400)] transition-colors" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create a strong password"
                        data-testid="register-password-input"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/30"
                        style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                      />
                    </div>

                    {formData.password && (
                      <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}>
                        <p className="text-xs font-medium text-[var(--text-muted)] mb-3">Password must have:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'length',    label: '8+ characters' },
                            { key: 'uppercase', label: 'Uppercase letter' },
                            { key: 'lowercase', label: 'Lowercase letter' },
                            { key: 'number',    label: 'Number' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                  backgroundColor: passwordChecks[key as keyof typeof passwordChecks] ? 'var(--blue-400)' : 'var(--brand-750)',
                                  transform: passwordChecks[key as keyof typeof passwordChecks] ? 'scale(1.1)' : 'scale(1)'
                                }}
                              >
                                {passwordChecks[key as keyof typeof passwordChecks] && (
                                  <CheckCircle className="w-3 h-3 text-[var(--brand-900)]" />
                                )}
                              </div>
                              <span className={`text-sm transition-colors ${
                                passwordChecks[key as keyof typeof passwordChecks] ? 'text-[var(--blue-400)] font-medium' : 'text-[var(--text-muted)]'
                              }`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-xl text-[var(--text-muted)]"
                      style={{ border: '1px solid var(--brand-700)', backgroundColor: 'transparent' }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 inline" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !step2Valid}
                      data-testid="register-submit-btn"
                      className="flex-1 font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(to right, var(--blue-400), var(--blue-500))',
                        color: 'var(--brand-900)',
                        boxShadow: '0 10px 25px -5px rgba(26,111,212,0.3)'
                      }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-[var(--brand-900)] border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        <>
                          Create Account
                          <Sparkles className="ml-2 w-5 h-5 inline" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-8 text-center pt-6" style={{ borderTop: '1px solid var(--brand-700)' }}>
              <p className="text-[var(--text-muted)]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: 'var(--blue-400)' }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--blue-400)] transition-colors inline-flex items-center gap-2 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
