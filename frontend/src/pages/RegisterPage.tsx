import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, CheckCircle, Code, Layers, Boxes, ArrowRight, XCircle } from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';
import { AcornLogo } from '@/components/AcornLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    organization: '',
    role: 'program_manager',
  });

  const passwordChecks = useMemo(() => ({
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      return;
    }
    try {
      await register(formData);
      navigate('/projects');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const benefits = [
    { icon: Code, text: 'AI-powered requirements extraction', delay: '0s' },
    { icon: Layers, text: 'Stakeholder-ready documentation', delay: '0.1s' },
    { icon: Boxes, text: 'Automated UML diagrams', delay: '0.2s' },
    { icon: CheckCircle, text: 'Smart task planning', delay: '0.3s' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full blur-3xl animate-float" style={{ top: '10%', right: '10%' }} />
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-float" style={{ bottom: '10%', left: '15%', animationDelay: '3s' }} />
        <div className="absolute w-[300px] h-[300px] bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-3xl animate-float" style={{ top: '50%', left: '50%', animationDelay: '1.5s' }} />
      </div>

      {/* Animated Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(251, 146, 60, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 146, 60, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Benefits & Image */}
          <div className="hidden lg:block space-y-8">
            <div className="text-center lg:text-left mb-8 animate-slideInLeft">
              <Link to="/" className="inline-block hover:scale-105 transition-transform mb-6">
                <AcornLogo size={64} />
              </Link>
            </div>

            {/* Software Architecture Image */}
            <div className="relative group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=600&h=400&fit=crop" 
                  alt="Software Architecture Planning" 
                  className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white">
                    <Layers className="w-5 h-5 animate-pulse" />
                    <span className="font-semibold">System Architecture Design</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                Start Growing Your Projects Today
              </h2>
              <p className="text-lg text-gray-600 animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                Join teams already using Acorn to streamline their software planning.
              </p>
            </div>
            
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-3 group animate-slideInLeft"
                  style={{ animationDelay: benefit.delay }}
                >
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all">
                      <benefit.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-amber-700 transition-colors">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Form */}
          <div className="animate-slideInRight">
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-block hover:scale-105 transition-transform">
                <AcornLogo size={56} />
              </Link>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 animate-gradient-shift transition"></div>
              
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-amber-100">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 animate-bounce-slow">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
                  <p className="text-gray-600 mt-1">Get started in less than a minute</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm animate-shake">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <Input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600 w-0 group-focus-within:w-full transition-all duration-500"></div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <Input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Your Company"
                      required
                      className="border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600 w-0 group-focus-within:w-full transition-all duration-500"></div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full border-2 border-amber-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all bg-white"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {ROLE_OPTIONS.find((role) => role.id === formData.role)?.description}
                    </p>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className="border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600 w-0 group-focus-within:w-full transition-all duration-500"></div>
                  </div>

                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a strong password"
                      required
                      className={`border-2 ${formData.password && !isPasswordValid ? 'border-red-300' : 'border-amber-200'} focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all`}
                    />
                    {formData.password && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">Password requirements:</p>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { key: 'length', label: '8+ characters' },
                            { key: 'uppercase', label: 'Uppercase letter' },
                            { key: 'lowercase', label: 'Lowercase letter' },
                            { key: 'number', label: 'Number' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1">
                              {passwordChecks[key as keyof typeof passwordChecks] ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-gray-300" />
                              )}
                              <span className={`text-xs ${passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-600' : 'text-gray-400'}`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02] group relative overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></div>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 inline-block group-hover:rotate-12 transition-transform" />
                        Create Account
                        <ArrowRight className="w-5 h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-all">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
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

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-gradient-shift { 
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
};
