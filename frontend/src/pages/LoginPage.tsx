import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { AcornLogo } from '@/components/AcornLogo';

const backgroundImages = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=1920&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1920&q=80',
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [currentBg, setCurrentBg] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const errors = {
    email: touched.email && !validateEmail(formData.email) ? 'Please enter a valid email address' : '',
    password: touched.password && formData.password.length < 1 ? 'Password is required' : ''
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    
    if (!validateEmail(formData.email) || !formData.password) return;

    try {
      await login(formData.email, formData.password);
      navigate('/projects');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const parallaxX = (mousePosition.x - window.innerWidth / 2) * 0.02;
  const parallaxY = (mousePosition.y - window.innerHeight / 2) * 0.02;

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Animated Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Images with Crossfade */}
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
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-acorn-blue-900/80 via-acorn-blue-800/70 to-acorn-orange-900/60" />
        
        {/* Floating Orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full bg-acorn-orange-500/20 blur-3xl animate-float"
          style={{ top: '10%', left: '20%', animationDelay: '0s' }}
        />
        <div 
          className="absolute w-72 h-72 rounded-full bg-acorn-blue-400/20 blur-3xl animate-float"
          style={{ bottom: '20%', right: '10%', animationDelay: '2s' }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full bg-purple-500/20 blur-3xl animate-float"
          style={{ top: '50%', left: '50%', animationDelay: '4s' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center animate-fade-in-up">
            <div className="mb-8">
              <AcornLogo size={80} />
            </div>
            <h1 className="text-4xl font-bold mb-6">Welcome Back to Acorn</h1>
            <p className="text-xl text-white/80 mb-8">
              Continue building amazing projects with AI-powered planning tools.
            </p>
            
            {/* Floating Cards */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 animate-float" style={{ animationDelay: '0s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-acorn-orange-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">AI Generation Ready</p>
                    <p className="text-sm text-white/70">Your projects await</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-acorn-blue-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">10,000+ Projects</p>
                    <p className="text-sm text-white/70">Created this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
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

      {/* Right Side - Login Form */}
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
        <div className="absolute w-64 h-64 rounded-full bg-acorn-orange-200/30 blur-3xl top-10 right-10 animate-pulse-slow" />
        <div className="absolute w-48 h-48 rounded-full bg-acorn-blue-200/30 blur-3xl bottom-20 left-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8 animate-fade-in">
            <Link to="/" className="inline-block">
              <AcornLogo size={64} />
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 animate-scale-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
              <p className="text-gray-500">Welcome back to Acorn</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-acorn-blue-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={() => setTouched({ ...touched, email: true })}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-acorn-blue-100 transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-acorn-blue-500'
                    }`}
                  />
                  {touched.email && !errors.email && formData.email && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-scale-in" />
                  )}
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-acorn-blue-500 transition-colors" />
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    placeholder="Enter your password"
                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-acorn-blue-100 transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-acorn-blue-500'
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="text-right">
                <a href="#" className="text-sm text-acorn-blue-600 hover:text-acorn-blue-700 font-medium hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-acorn-orange-500 hover:text-acorn-orange-600 font-bold hover:underline">
                  Create Account
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
