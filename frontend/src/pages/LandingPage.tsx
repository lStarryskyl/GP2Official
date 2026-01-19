import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Cpu, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X,
  Sparkles,
  Layers,
  GitBranch,
  MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AcornLogo } from '@/components/AcornLogo';

const heroImages = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
  'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=1920&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
];

const featureImages = [
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
];

const testimonialImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80',
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    Object.values(observerRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const parallaxOffset = scrollY * 0.5;
  const mouseParallaxX = (mousePosition.x - window.innerWidth / 2) * 0.02;
  const mouseParallaxY = (mousePosition.y - window.innerHeight / 2) * 0.02;

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-acorn-blue-400/20 to-acorn-orange-400/20 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" 
        style={{ 
          backgroundColor: scrollY > 50 ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
          boxShadow: scrollY > 50 ? '0 4px 30px rgba(0,0,0,0.1)' : 'none'
        }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="hover:scale-110 transition-transform duration-300">
              <AcornLogo size={48} />
            </button>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Testimonials', 'Pricing'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`} 
                  className="text-gray-700 hover:text-acorn-blue-600 font-medium transition-all duration-300 hover:scale-105 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-acorn-orange-500 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')} 
                className="text-acorn-blue-600 font-medium hover:scale-105 transition-transform"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className="bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-medium px-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Get Started Free
              </Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((img, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                opacity: currentHeroImage === index ? 1 : 0,
                transform: `translateY(${parallaxOffset}px) translate(${mouseParallaxX}px, ${mouseParallaxY}px)`,
              }}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-acorn-blue-900/70 via-acorn-blue-900/50 to-white" />
            </div>
          ))}
        </div>

        {/* Animated Gradient Orbs */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-acorn-orange-500/30 to-transparent blur-3xl animate-pulse-slow"
          style={{ 
            top: '10%', 
            right: '10%',
            transform: `translate(${mouseParallaxX * 2}px, ${mouseParallaxY * 2}px)`,
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-acorn-blue-500/30 to-transparent blur-3xl animate-pulse-slow"
          style={{ 
            bottom: '20%', 
            left: '5%',
            animationDelay: '1s',
            transform: `translate(${-mouseParallaxX * 2}px, ${-mouseParallaxY * 2}px)`,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full mb-8 animate-fade-in-down border border-white/20"
            style={{ animationDelay: '0.2s' }}
          >
            <Sparkles className="w-5 h-5 text-acorn-orange-400 animate-pulse" />
            <span className="text-white font-medium">AI-Powered Project Planning Revolution</span>
          </div>

          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            Transform Ideas Into
            <span className="block bg-gradient-to-r from-acorn-orange-400 via-acorn-orange-500 to-acorn-orange-400 bg-clip-text text-transparent animate-gradient-x">
              Production-Ready Plans
            </span>
          </h1>

          <p 
            className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            Acorn uses advanced AI to convert your project ideas into comprehensive 
            requirements, stunning UML diagrams, and stakeholder-ready documentation.
          </p>

          <div 
            className="flex flex-wrap justify-center gap-6 animate-fade-in-up"
            style={{ animationDelay: '0.8s' }}
          >
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-bold px-10 py-6 text-lg shadow-2xl hover:shadow-acorn-lg transition-all duration-300 hover:scale-110 group"
            >
              Start Building Free
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-6 text-lg font-medium backdrop-blur-sm hover:scale-110 transition-all duration-300 group"
            >
              <Play className="mr-2 w-6 h-6 group-hover:scale-125 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <MousePointer2 className="w-8 h-8 text-white/60" />
          </div>
        </div>

        {/* Floating Tech Cards */}
        <div className="absolute bottom-20 left-10 hidden lg:block animate-float" style={{ animationDelay: '0s' }}>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-acorn-blue-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-bold">SRS Generated</p>
                <p className="text-sm text-white/70">Just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-40 right-10 hidden lg:block animate-float" style={{ animationDelay: '2s' }}>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-acorn-orange-500 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-bold">AI Analysis</p>
                <p className="text-sm text-white/70">98% Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Parallax */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D3B66' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        
        <div className="max-w-7xl mx-auto px-6">
          <div 
            id="stats"
            ref={(el) => (observerRefs.current['stats'] = el)}
            className={`grid md:grid-cols-4 gap-8 transition-all duration-1000 ${
              isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            {[
              { value: '10,000+', label: 'Projects Created', icon: Layers },
              { value: '500+', label: 'Teams Trust Us', icon: Shield },
              { value: '70%', label: 'Time Saved', icon: Zap },
              { value: '99.9%', label: 'Uptime', icon: CheckCircle },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className="text-center group cursor-pointer"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-acorn-blue-100 to-acorn-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <stat.icon className="w-8 h-8 text-acorn-blue-600" />
                </div>
                <p className="text-4xl font-bold text-acorn-blue-600 mb-2 group-hover:scale-110 transition-transform">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Images */}
      <section id="features" className="py-32 bg-gradient-to-b from-white to-acorn-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div 
            id="features-header"
            ref={(el) => (observerRefs.current['features-header'] = el)}
            className={`text-center mb-20 transition-all duration-1000 ${
              isVisible['features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <span className="inline-block px-4 py-2 bg-acorn-orange-100 text-acorn-orange-600 rounded-full text-sm font-medium mb-4">
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <span className="block text-acorn-blue-600">Software Planning Excellence</span>
            </h2>
          </div>

          <div className="space-y-32">
            {[
              {
                title: 'AI-Powered Requirements',
                description: 'Transform unstructured briefs into IEEE-compliant SRS documents. Our AI understands context, extracts entities, and generates comprehensive requirements automatically.',
                image: featureImages[0],
                icon: FileText,
                reverse: false,
              },
              {
                title: 'Intelligent Analysis',
                description: 'Advanced machine learning algorithms analyze your project scope, identify risks, and suggest optimizations. Get insights that would take weeks in minutes.',
                image: featureImages[1],
                icon: Cpu,
                reverse: true,
              },
              {
                title: 'Visual Documentation',
                description: 'Auto-generate stunning UML diagrams, flowcharts, and architecture visualizations. Export in multiple formats for any stakeholder.',
                image: featureImages[2],
                icon: BarChart3,
                reverse: false,
              },
              {
                title: 'Team Collaboration',
                description: 'Real-time collaboration with role-based access control. Track changes, manage versions, and keep everyone aligned.',
                image: featureImages[3],
                icon: GitBranch,
                reverse: true,
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                id={`feature-${index}`}
                ref={(el) => (observerRefs.current[`feature-${index}`] = el)}
                className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${
                  isVisible[`feature-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                } ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className={`space-y-6 ${feature.reverse ? 'lg:order-2' : ''}`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-acorn-blue-500 to-acorn-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-xl text-gray-600 leading-relaxed">{feature.description}</p>
                  <Button 
                    variant="outline" 
                    className="border-acorn-blue-200 text-acorn-blue-600 hover:bg-acorn-blue-50 group"
                  >
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
                <div className={`relative ${feature.reverse ? 'lg:order-1' : ''}`}>
                  <div className="absolute -inset-4 bg-gradient-to-r from-acorn-blue-500/20 to-acorn-orange-500/20 rounded-3xl blur-2xl animate-pulse-slow" />
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-80 object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-acorn-blue-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Timeline */}
      <section id="how-it-works" className="py-32 bg-acorn-blue-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-acorn-blue-600 via-acorn-blue-600/95 to-acorn-blue-600" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div 
            id="how-header"
            ref={(el) => (observerRefs.current['how-header'] = el)}
            className={`text-center mb-20 transition-all duration-1000 ${
              isVisible['how-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Three Steps to Success
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              From idea to production-ready documentation in minutes, not weeks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Input Your Brief',
                description: 'Paste your project brief, upload documents, or use our guided templates. Our AI understands natural language.',
                image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
              },
              {
                step: 2,
                title: 'AI Generation',
                description: 'Watch as our multi-agent AI system analyzes, extracts, and generates comprehensive documentation.',
                image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
              },
              {
                step: 3,
                title: 'Review & Export',
                description: 'Edit with inline tools, add explanations, and export to PDF, DOCX, or integrate with your favorite tools.',
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
              },
            ].map((item, index) => (
              <div
                key={item.step}
                id={`step-${index}`}
                ref={(el) => (observerRefs.current[`step-${index}`] = el)}
                className={`group transition-all duration-1000 ${
                  isVisible[`step-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2">
                  <div className="absolute -top-6 left-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-acorn-orange-500 to-acorn-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      {item.step}
                    </div>
                  </div>
                  <div className="mt-6 mb-6 overflow-hidden rounded-xl">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-white/80 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials with Carousel */}
      <section id="testimonials" className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div 
            id="testimonials-header"
            ref={(el) => (observerRefs.current['testimonials-header'] = el)}
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible['testimonials-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
            }`}
          >
            <span className="inline-block px-4 py-2 bg-acorn-blue-100 text-acorn-blue-600 rounded-full text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Loved by Teams Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Acorn reduced our requirements gathering time by 70%. The AI suggestions are remarkably accurate and saved us countless hours.',
                author: 'Sarah Chen',
                role: 'VP of Engineering, TechFlow',
                image: testimonialImages[0],
              },
              {
                quote: 'Finally, a tool that understands software planning. Our stakeholders love the professional documentation it generates.',
                author: 'Marcus Johnson',
                role: 'Product Director, Innovate Labs',
                image: testimonialImages[1],
              },
              {
                quote: 'The UML diagram generation alone is worth it. What used to take days now takes minutes with perfect accuracy.',
                author: 'Emily Rodriguez',
                role: 'Tech Lead, StartupXYZ',
                image: testimonialImages[2],
              },
            ].map((testimonial, index) => (
              <div
                key={testimonial.author}
                id={`testimonial-${index}`}
                ref={(el) => (observerRefs.current[`testimonial-${index}`] = el)}
                className={`bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
                  isVisible[`testimonial-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-acorn-orange-500 text-acorn-orange-500" />
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-14 h-14 rounded-full object-cover ring-4 ring-acorn-blue-100"
                  />
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Parallax Background */}
      <section className="relative py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&q=80')`,
            transform: `translateY(${(scrollY - 3000) * 0.2}px)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-acorn-blue-900/95 to-acorn-blue-800/95" />
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div 
            id="cta"
            ref={(el) => (observerRefs.current['cta'] = el)}
            className={`transition-all duration-1000 ${
              isVisible['cta'] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Ready to Transform Your
              <span className="block text-acorn-orange-400">Project Planning?</span>
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Join thousands of teams already using Acorn to build better software, faster.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700 text-white font-bold px-12 py-6 text-xl shadow-2xl hover:shadow-acorn-lg transition-all duration-300 hover:scale-110"
            >
              Start Building Free Today
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <p className="text-white/60 mt-6">No credit card required • Free 14-day trial</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-acorn-blue-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <AcornLogo size={48} />
              <p className="mt-4 text-acorn-blue-200">
                AI-powered project planning for modern teams.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-bold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-acorn-blue-200 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-acorn-blue-800 pt-8 text-center text-acorn-blue-300">
            <p>© 2024 Acorn. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
