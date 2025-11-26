import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, Zap, Shield, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/projects');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-float" style={{ top: '15%', left: '5%' }} />
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-float" style={{ top: '60%', right: '10%', animationDelay: '2s' }} />
        <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-3xl animate-float" style={{ bottom: '20%', left: '40%', animationDelay: '4s' }} />
      </div>
      
      {/* Animated Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(251, 146, 60, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 146, 60, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Image & Logo */}
          <div className="hidden lg:block space-y-6 animate-slideInLeft">
            <div className="text-center lg:text-left">
              <Link to="/" className="inline-flex items-center space-x-3 group mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                  <img 
                    src="https://images.unsplash.com/photo-1569977562541-024dd41514fc?w=100&h=100&fit=crop" 
                    alt="Acorn" 
                    className="relative w-16 h-16 rounded-full object-cover ring-2 ring-amber-400 group-hover:scale-110 transition-transform"
                  />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">Acorn</span>
              </Link>
              <p className="text-xl text-gray-700 font-medium mb-4">Welcome back to your AI-powered planning platform</p>
            </div>
            
            {/* Architecture Image */}
            <div className="relative group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1664526937033-fe2c11f1be25?w=600&h=400&fit=crop" 
                  alt="System Architecture" 
                  className="w-full h-80 object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                  <div className="flex items-center gap-2 text-white">
                    <Shield className="w-6 h-6 animate-pulse" />
                    <span className="font-bold text-lg">Secure & Scalable Architecture</span>
                  </div>
                  <p className="text-white/90 text-sm">Build enterprise-grade software with AI-powered planning</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center animate-bounce-slow">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">AI-Powered Planning</h3>
                  <p className="text-sm text-gray-600">Generate comprehensive requirements, architecture diagrams, and project plans in minutes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="animate-slideInRight">
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                  <img 
                    src="https://images.unsplash.com/photo-1569977562541-024dd41514fc?w=100&h=100&fit=crop" 
                    alt="Acorn" 
                    className="relative w-16 h-16 rounded-full object-cover ring-2 ring-amber-400 group-hover:scale-110 transition-transform"
                  />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">Acorn</span>
              </Link>
              <p className="mt-2 text-gray-600">Plant the seeds of perfect projects</p>
            </div>

            {/* Login Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 animate-gradient-shift transition"></div>
              
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-100">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 animate-bounce-slow">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                  <p className="text-gray-600 mt-1">Sign in to continue growing</p>
                </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? 'Signing in...' : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-semibold">
                Get Started Free
              </Link>
            </p>
          </div>

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-amber-600 transition-colors inline-flex items-center gap-1 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </Link>
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes slideInLeft {
          0% { transform: translateX(-100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes bounceGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slideInLeft { animation: slideInLeft 0.8s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.8s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-gradient-shift { 
          background-size: 200% 200%; 
          animation: gradientShift 3s ease infinite; 
        }
        .animate-bounce-slow { animation: bounceGentle 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};
