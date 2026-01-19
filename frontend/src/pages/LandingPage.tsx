import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  FileText,
  GitBranch,
  Layers,
  CheckCircle2,
  Star,
  Play,
  ChevronRight,
  Cpu,
  Target,
  Rocket,
  Building2,
  Globe,
  Lock,
  TrendingUp,
  Award,
  Clock,
  Briefcase
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 5000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const features = [
    {
      icon: Cpu,
      title: 'AI-Powered Analysis',
      description: 'Enterprise-grade AI generates comprehensive project documentation in minutes',
      metrics: '10x faster planning'
    },
    {
      icon: FileText,
      title: 'SRS Generation',
      description: 'Automatically generate Software Requirements Specifications with audit trails',
      metrics: '100% compliance'
    },
    {
      icon: Users,
      title: 'Stakeholder Management',
      description: 'Negotiate requirements and track stakeholder impact across teams',
      metrics: 'Full visibility'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time insights into project health, progress, and team performance',
      metrics: 'Data-driven'
    }
  ];

  const stats = [
    { value: '500+', label: 'Enterprise Clients', icon: Building2 },
    { value: '10M+', label: 'Documents Generated', icon: FileText },
    { value: '99.9%', label: 'Uptime SLA', icon: Shield },
    { value: '24/7', label: 'Support', icon: Clock }
  ];

  const capabilities = [
    { title: 'Persona Generation', desc: 'Create detailed user personas and stories', icon: Users },
    { title: 'SRS Audit', desc: 'Automated compliance and quality checks', icon: CheckCircle2 },
    { title: 'Impact Analysis', desc: 'Stakeholder negotiation tracking', icon: TrendingUp },
    { title: 'Export Center', desc: 'PDF, DOCX, PowerPoint exports', icon: FileText },
    { title: 'Kanban Board', desc: 'Visual task management', icon: Layers },
    { title: 'Team Collaboration', desc: 'Real-time team features', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        
        {/* Floating Orbs */}
        <div 
          className="glow-orb glow-orb-gold w-[800px] h-[800px] animate-float"
          style={{ 
            top: '-20%', 
            right: '-10%',
            transform: `translateY(${scrollY * 0.1}px)`
          }} 
        />
        <div 
          className="glow-orb glow-orb-navy w-[600px] h-[600px]"
          style={{ 
            bottom: '10%', 
            left: '-15%',
            animationDelay: '3s',
            transform: `translateY(${-scrollY * 0.05}px)`
          }} 
        />
        <div 
          className="glow-orb glow-orb-gold w-[400px] h-[400px] animate-morph"
          style={{ 
            top: '60%', 
            right: '20%',
            opacity: 0.5
          }} 
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrollY > 50 ? 'bg-[#0a0f1a]/90 backdrop-blur-lg border-b border-[#1e3a5f]/30' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`flex items-center justify-between h-20 transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37] to-[#9a7b24] rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-all duration-500" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="w-6 h-6 text-[#0a0f1a]" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient-gold">Acorn</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-[#d4af37] transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-400 hover:text-[#d4af37] transition-colors font-medium">Pricing</a>
              <a href="#enterprise" className="text-gray-400 hover:text-[#d4af37] transition-colors font-medium">Enterprise</a>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-gray-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              {/* Enterprise Badge */}
              <div 
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 mb-8 animate-reveal-up`}
              >
                <Award className="w-4 h-4 text-[#d4af37]" />
                <span className="text-[#d4af37] text-sm font-semibold tracking-wide">ENTERPRISE-GRADE AI PLATFORM</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-8 animate-reveal-up delay-100">
                <span className="text-white">Transform Project</span>
                <br />
                <span className="text-gradient-gold">Planning Forever</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl animate-reveal-up delay-200">
                Acorn leverages advanced AI to generate comprehensive project documentation, 
                stakeholder analysis, and compliance-ready specifications in minutes.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12 animate-reveal-up delay-300">
                <button 
                  onClick={() => navigate('/register')}
                  className="btn-primary text-lg px-10 py-5 group"
                >
                  <Rocket className="w-5 h-5" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-secondary text-lg px-10 py-5 group"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 animate-reveal-up delay-400">
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#0d1525] border-2 border-[#0a0f1a] flex items-center justify-center text-xs font-bold text-[#d4af37]"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Trusted by 500+ enterprises</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative animate-dramatic delay-200">
                {/* Main Card */}
                <div className="card p-8 relative overflow-hidden">
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 animate-shimmer" />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">Project Analysis</h3>
                      <div className="badge">
                        <Zap className="w-3 h-3" />
                        AI Powered
                      </div>
                    </div>
                    
                    {/* Feature Cards */}
                    <div className="space-y-4">
                      {features.map((feature, index) => {
                        const Icon = feature.icon;
                        const isActive = activeFeature === index;
                        
                        return (
                          <div 
                            key={index}
                            className={`p-4 rounded-xl transition-all duration-500 cursor-pointer ${
                              isActive 
                                ? 'bg-[#d4af37]/10 border border-[#d4af37]/30' 
                                : 'bg-[#111b2e]/50 border border-transparent hover:border-[#1e3a5f]'
                            }`}
                            onClick={() => setActiveFeature(index)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                isActive 
                                  ? 'bg-gradient-to-br from-[#d4af37] to-[#9a7b24]' 
                                  : 'bg-[#1e3a5f]'
                              }`}>
                                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0a0f1a]' : 'text-gray-400'}`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                  {feature.title}
                                </h4>
                                <p className={`text-sm transition-colors ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                                  {feature.metrics}
                                </p>
                              </div>
                              {isActive && (
                                <CheckCircle2 className="w-5 h-5 text-[#d4af37] animate-elastic" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-6 pt-6 border-t border-[#1e3a5f]">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Analysis Progress</span>
                        <span className="text-[#d4af37] font-semibold">87%</span>
                      </div>
                      <div className="h-2 bg-[#1e3a5f] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d77a] rounded-full transition-all duration-1000"
                          style={{ width: '87%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -top-6 -right-6 card p-4 animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">+147%</p>
                      <p className="text-xs text-gray-500">Productivity</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-6 card p-4 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#d4af37]/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">2.5h</p>
                      <p className="text-xs text-gray-500">Avg. Time Saved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="text-center animate-reveal-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 mb-4">
                    <Icon className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-500 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section id="features" className="py-24 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge mb-6 animate-reveal-up">
              <Layers className="w-4 h-4" />
              COMPREHENSIVE FEATURES
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 animate-reveal-up delay-100">
              Everything You Need to
              <span className="text-gradient-gold"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto animate-reveal-up delay-200">
              Enterprise-grade tools designed for complex project requirements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <div 
                  key={index}
                  className="card p-8 hover-lift group animate-reveal-up"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#111b2e] flex items-center justify-center mb-6 group-hover:from-[#d4af37] group-hover:to-[#9a7b24] transition-all duration-500">
                    <Icon className="w-6 h-6 text-[#d4af37] group-hover:text-[#0a0f1a] transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{cap.title}</h3>
                  <p className="text-gray-400">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="border-animated p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 via-transparent to-[#3b82f6]/5" />
            
            <div className="relative">
              <div className="badge mb-8 animate-reveal-scale">
                <Rocket className="w-4 h-4" />
                GET STARTED TODAY
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 animate-reveal-up delay-100">
                Ready to Transform Your
                <span className="text-gradient-gold"> Project Planning?</span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-reveal-up delay-200">
                Join leading enterprises using Acorn to streamline their project documentation 
                and stakeholder management.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 animate-reveal-up delay-300">
                <button 
                  onClick={() => navigate('/register')}
                  className="btn-primary text-lg px-12 py-5 group"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
                <button 
                  onClick={() => {}}
                  className="btn-secondary text-lg px-12 py-5"
                >
                  <Briefcase className="w-5 h-5" />
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-[#1e3a5f]/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#9a7b24] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#0a0f1a]" />
              </div>
              <span className="text-xl font-bold text-gradient-gold">Acorn</span>
            </div>
            
            <p className="text-gray-500 text-sm">
              © 2025 Acorn Technologies. All rights reserved.
            </p>
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm font-medium">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm font-medium">Terms</a>
              <a href="#" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm font-medium">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
