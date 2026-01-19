import React, { useState, useEffect } from 'react';
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
  Rocket
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Track mouse for gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Cpu,
      title: 'AI-Powered Planning',
      description: 'Generate comprehensive project plans with intelligent AI that understands your requirements',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Target,
      title: 'Requirements Analysis',
      description: 'Automatically extract and organize requirements from your project brief',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: GitBranch,
      title: 'Roadmap Generation',
      description: 'Create detailed project roadmaps with milestones and dependencies',
      gradient: 'from-amber-400 to-yellow-500'
    },
    {
      icon: BarChart3,
      title: 'Feasibility Studies',
      description: 'Get AI-generated feasibility analysis for technical and business viability',
      gradient: 'from-orange-600 to-amber-500'
    }
  ];

  const stats = [
    { value: '10x', label: 'Faster Planning' },
    { value: '85%', label: 'Time Saved' },
    { value: '500+', label: 'Projects Created' },
    { value: '99%', label: 'Satisfaction' }
  ];

  const phases = [
    { name: 'Planning', icon: FileText, color: 'amber' },
    { name: 'Feasibility', icon: BarChart3, color: 'orange' },
    { name: 'Requirements', icon: Layers, color: 'yellow' },
    { name: 'Design', icon: GitBranch, color: 'amber' },
    { name: 'Development', icon: Cpu, color: 'orange' },
    { name: 'Launch', icon: Rocket, color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        
        {/* Floating Orbs */}
        <div 
          className="glow-orb"
          style={{ 
            top: '10%', 
            left: '20%',
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }} 
        />
        <div 
          className="glow-orb"
          style={{ 
            bottom: '20%', 
            right: '10%',
            animationDelay: '4s',
            transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`
          }} 
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient-gold">Acorn</span>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-slate-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="btn-premium"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '0.1s' }}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">AI-Powered Project Management</span>
            </div>

            {/* Headline */}
            <h1 
              className={`text-5xl md:text-7xl font-bold leading-tight mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '0.2s' }}
            >
              Transform Ideas Into
              <span className="block mt-2 text-gradient-gold">
                Actionable Plans
              </span>
            </h1>

            {/* Subheadline */}
            <p 
              className={`text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '0.3s' }}
            >
              Acorn uses advanced AI to generate comprehensive project documentation, 
              roadmaps, and feasibility studies in minutes, not weeks.
            </p>

            {/* CTA Buttons */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '0.4s' }}
            >
              <button 
                onClick={() => navigate('/register')}
                className="btn-premium text-lg px-8 py-4 group"
              >
                <Sparkles className="w-5 h-5" />
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-ghost text-lg px-8 py-4 group"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div 
              className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '0.5s' }}
            >
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center group"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className="text-4xl font-bold text-gradient-gold mb-1 group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="text-gradient-gold"> Succeed</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              From initial concept to detailed execution plan, Acorn guides you through every phase
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === index;
                
                return (
                  <div 
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 shadow-lg shadow-amber-500/10' 
                        : 'hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                        <p className={`text-slate-400 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                          {feature.description}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform duration-300 ${isActive ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Visual */}
            <div className="relative">
              <div className="card-premium p-8 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
                
                {/* Phase Flow */}
                <div className="relative">
                  <div className="text-sm text-amber-400 font-medium mb-6">Project Phases</div>
                  <div className="space-y-4">
                    {phases.map((phase, index) => {
                      const Icon = phase.icon;
                      const isActive = index <= activeFeature;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                            isActive 
                              ? 'bg-slate-800/50 border border-amber-500/20' 
                              : 'opacity-40'
                          }`}
                          style={{ 
                            transitionDelay: `${index * 0.1}s`,
                            transform: isActive ? 'translateX(0)' : 'translateX(-10px)'
                          }}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isActive ? 'bg-amber-500' : 'bg-slate-700'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className={`font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>
                            {phase.name}
                          </span>
                          {isActive && index <= activeFeature && (
                            <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto animate-scale-in" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-premium p-12 text-center relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10" />
            
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 mb-6">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">Start Building Today</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Ready to Transform Your
                <span className="text-gradient-gold"> Project Planning?</span>
              </h2>
              
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of teams using Acorn to streamline their project documentation workflow.
              </p>
              
              <button 
                onClick={() => navigate('/register')}
                className="btn-premium text-lg px-10 py-4 group"
              >
                <Rocket className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gradient-gold">Acorn</span>
            </div>
            
            <p className="text-slate-500 text-sm">
              © 2025 Acorn. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">Terms</a>
              <a href="#" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
