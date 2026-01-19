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
  Sparkles,
  Rocket,
  Shield
} from 'lucide-react';
import { AcornLogo } from '@/components/AcornLogo';
import { ROLE_OPTIONS } from '@/constants/roles';

const backgroundImages = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80',
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [currentBg, setCurrentBg] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    role: 'program_manager',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const passwordChecks = useMemo(() => ({
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  const parallaxX = (mousePosition.x - window.innerWidth / 2) * 0.02;
  const parallaxY = (mousePosition.y - window.innerHeight / 2) * 0.02;

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Animated Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              opacity: currentBg === index ? 1 : 0,
              transform: `translate(${parallaxX}px, ${parallaxY}px) scale(1.1)`,
            }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-br from-acorn-blue-900/80 via-acorn-blue-800/70 to-purple-900/60" />
        
        {/* Floating Orbs */}
        <div className="absolute w-96 h-96 rounded-full bg-acorn-orange-500/20 blur-3xl animate-float" style={{ top: '10%', left: '20%' }} />
        <div className="absolute w-72 h-72 rounded-full bg-purple-500/20 blur-3xl animate-float" style={{ bottom: '20%', right: '10%', animationDelay: '2s' }} />
        <div className="absolute w-64 h-64 rounded-full bg-acorn-blue-400/20 blur-3xl animate-float" style={{ top: '50%', left: '50%', animationDelay: '4s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center animate-fade-in-up">
            <div className="mb-8">
              <AcornLogo size="xl" />
            </div>
            <h1 className="text-4xl font-bold mb-6">Join Acorn Today</h1>
            <p className="text-xl text-white/80 mb-8">
              Start building amazing projects with AI-powered planning in minutes.
            </p>
            
            {/* Feature Cards */}
            <div className="space-y-4">
              {[
                { icon: Rocket, title: 'Quick Setup', desc: 'Get started in under 2 minutes', delay: '0s' },
                { icon: Sparkles, title: 'AI-Powered', desc: 'Smart requirements generation', delay: '1s' },
                { icon: Shield, title: 'Enterprise Ready', desc: 'Bank-level security', delay: '2s' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 animate-float"
                  style={{ animationDelay: item.delay }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-acorn-orange-500 to-acorn-orange-600 rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-white/70">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-acorn-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D3B66' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="absolute w-64 h-64 rounded-full bg-purple-200/30 blur-3xl top-10 right-10 animate-pulse-slow" />
        <div className="absolute w-48 h-48 rounded-full bg-acorn-orange-200/30 blur-3xl bottom-20 left-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6 animate-fade-in">
            <Link to="/" className="inline-block">
              <AcornLogo size={56} />
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-4">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      step >= s 
                        ? 'bg-gradient-to-br from-acorn-blue-500 to-acorn-blue-600 text-white scale-110' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${step >= s ? 'text-acorn-blue-600' : 'text-gray-400'}`}>
                      {s === 1 ? 'Profile' : 'Account'}
                    </span>
                  </div>
                  {s < 2 && (
                    <div className={`w-16 h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-acorn-blue-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 animate-scale-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 1 ? 'Create Your Profile' : 'Secure Your Account'}
              </h1>
              <p className="text-gray-500">
                {step === 1 ? 'Tell us about yourself' : 'Set up your login credentials'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-acorn-blue-500 transition-colors" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-acorn-blue-500 transition-colors" />
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Your Company"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all bg-white"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      {ROLE_OPTIONS.find((r) => r.id === formData.role)?.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => step1Valid && setStep(2)}
                    disabled={!step1Valid}
                    className="w-full bg-gradient-to-r from-acorn-blue-500 to-acorn-blue-600 hover:from-acorn-blue-600 hover:to-acorn-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-acorn-blue-500 transition-colors" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        placeholder="you@example.com"
                        className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:ring-4 focus:ring-acorn-blue-100 transition-all ${
                          touched.email && !validateEmail(formData.email) && formData.email
                            ? 'border-red-300' 
                            : 'border-gray-200 focus:border-acorn-blue-500'
                        }`}
                      />
                      {touched.email && validateEmail(formData.email) && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-scale-in" />
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-acorn-blue-500 transition-colors" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create a strong password"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                      />
                    </div>

                    {formData.password && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-fade-in">
                        <p className="text-xs font-medium text-gray-600 mb-3">Password must have:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'length', label: '8+ characters' },
                            { key: 'uppercase', label: 'Uppercase letter' },
                            { key: 'lowercase', label: 'Lowercase letter' },
                            { key: 'number', label: 'Number' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                passwordChecks[key as keyof typeof passwordChecks]
                                  ? 'bg-green-500 scale-110'
                                  : 'bg-gray-200'
                              }`}>
                                {passwordChecks[key as keyof typeof passwordChecks] && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className={`text-sm transition-colors ${
                                passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-600 font-medium' : 'text-gray-500'
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
                      className="flex-1 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 py-4 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !step2Valid}
                      className="flex-1 bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        <>
                          Create Account
                          <Sparkles className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-acorn-orange-500 hover:text-acorn-orange-600 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-gray-500 hover:text-acorn-blue-600 transition-colors inline-flex items-center gap-2 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
