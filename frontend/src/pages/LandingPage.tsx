import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Cpu, 
  CheckCircle, 
  ArrowRight,
  Star,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X,
  Sparkles,
  Layers,
  GitBranch,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AcornLogo } from '@/components/AcornLogo';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
      { threshold: 0.1 }
    );

    Object.values(observerRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <AcornLogo size={40} />
              <span className="font-bold text-xl text-acorn-blue-600">Acorn</span>
            </button>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How It Works', 'Testimonials'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`} 
                  className="text-gray-700 hover:text-acorn-blue-600 font-medium transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')} 
                className="text-acorn-blue-600 font-medium"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-medium px-6"
              >
                Get Started Free
              </Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4">
            <div className="flex flex-col gap-4">
              {['Features', 'How It Works', 'Testimonials'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-gray-700 font-medium py-2">
                  {item}
                </a>
              ))}
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">Sign In</Button>
              <Button onClick={() => navigate('/register')} className="w-full bg-acorn-orange-500 text-white">Get Started</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-acorn-blue-50 text-acorn-blue-600 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Project Planning
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform Ideas Into
                <span className="text-acorn-orange-500 block">Production-Ready Plans</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Acorn uses advanced AI to convert your project briefs into comprehensive 
                requirements, UML diagrams, and stakeholder-ready documentation.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-bold px-8 py-4 text-lg"
                >
                  Start Building Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="border-2 border-acorn-blue-200 text-acorn-blue-600 px-8 py-4 text-lg font-medium"
                >
                  Sign In
                </Button>
              </div>

              <div className="flex gap-8 pt-4">
                {[
                  { value: '10,000+', label: 'Projects' },
                  { value: '500+', label: 'Teams' },
                  { value: '70%', label: 'Time Saved' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-acorn-blue-600">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 overflow-hidden">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="ml-2 text-sm text-gray-500">requirements.srs</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-16 bg-acorn-blue-100 border-2 border-acorn-blue-300 rounded-lg flex items-center justify-center text-sm font-medium text-acorn-blue-700">
                        User
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      <div className="w-32 h-16 bg-acorn-orange-100 border-2 border-acorn-orange-300 rounded-lg flex items-center justify-center text-sm font-medium text-acorn-orange-700">
                        System
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-8">
                      <div className="w-28 h-12 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center text-xs font-medium text-green-700">
                        Login
                      </div>
                      <div className="w-28 h-12 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center text-xs font-medium text-green-700">
                        Dashboard
                      </div>
                      <div className="w-28 h-12 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center text-xs font-medium text-green-700">
                        Reports
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-full h-12 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center text-sm font-medium text-purple-700">
                        Database Layer
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-3 -right-3 bg-acorn-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  AI Generated
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div 
            id="features-header"
            ref={(el) => (observerRefs.current['features-header'] = el)}
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible['features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="inline-block px-4 py-2 bg-acorn-blue-50 text-acorn-blue-600 rounded-full text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Software Planning
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From requirements to deployment, Acorn handles every phase of your project planning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: 'SRS Generation', desc: 'IEEE-compliant requirements documents generated automatically from your brief.' },
              { icon: GitBranch, title: 'UML Diagrams', desc: 'Use case, class, sequence, and ERD diagrams created with AI precision.' },
              { icon: BarChart3, title: 'Cost Analysis', desc: 'Detailed cost breakdowns, ROI projections, and budget planning.' },
              { icon: Users, title: 'Team Collaboration', desc: 'Real-time collaboration with role-based access and version control.' },
            ].map((feature, index) => (
              <div
                key={feature.title}
                id={`feature-${index}`}
                ref={(el) => (observerRefs.current[`feature-${index}`] = el)}
                className={`bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-acorn-blue-100 transition-all duration-300 ${
                  isVisible[`feature-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-acorn-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-acorn-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div 
            id="how-header"
            ref={(el) => (observerRefs.current['how-header'] = el)}
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible['how-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="inline-block px-4 py-2 bg-acorn-orange-50 text-acorn-orange-600 rounded-full text-sm font-medium mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Three Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From idea to production-ready documentation in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Input Your Brief', desc: 'Paste your project description or upload existing documents. Our AI understands natural language.', icon: FileText },
              { step: 2, title: 'AI Generation', desc: 'Watch as our multi-agent AI analyzes, extracts entities, and generates comprehensive documentation.', icon: Cpu },
              { step: 3, title: 'Review & Export', desc: 'Edit with inline tools, add explanations, and export to PDF, DOCX, or integrate with your tools.', icon: CheckCircle },
            ].map((item, index) => (
              <div
                key={item.step}
                id={`step-${index}`}
                ref={(el) => (observerRefs.current[`step-${index}`] = el)}
                className={`bg-white rounded-xl p-8 border border-gray-100 relative transition-all duration-700 ${
                  isVisible[`step-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="absolute -top-4 left-8 w-8 h-8 bg-acorn-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
                <div className="pt-4">
                  <div className="w-12 h-12 bg-acorn-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-acorn-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div 
            id="testimonials-header"
            ref={(el) => (observerRefs.current['testimonials-header'] = el)}
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible['testimonials-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="inline-block px-4 py-2 bg-acorn-blue-50 text-acorn-blue-600 rounded-full text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Loved by Teams Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: 'Acorn reduced our requirements gathering time by 70%. The AI suggestions are remarkably accurate.', author: 'Sarah Chen', role: 'VP of Engineering' },
              { quote: 'Finally, a tool that understands software planning. Our stakeholders love the professional documentation.', author: 'Marcus Johnson', role: 'Product Director' },
              { quote: 'The UML diagram generation alone is worth it. What used to take days now takes minutes.', author: 'Emily Rodriguez', role: 'Tech Lead' },
            ].map((testimonial, index) => (
              <div
                key={testimonial.author}
                id={`testimonial-${index}`}
                ref={(el) => (observerRefs.current[`testimonial-${index}`] = el)}
                className={`bg-white rounded-xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-500 ${
                  isVisible[`testimonial-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-acorn-orange-400 text-acorn-orange-400" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-acorn-blue-100 rounded-full flex items-center justify-center text-acorn-blue-600 font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
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

      {/* CTA Section */}
      <section className="py-24 bg-acorn-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Project Planning?
          </h2>
          <p className="text-xl text-acorn-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using Acorn to build better software, faster.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-bold px-10 py-4 text-lg"
          >
            Start Building Free Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-acorn-blue-200 mt-4 text-sm">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AcornLogo size={32} />
                <span className="font-bold text-lg">Acorn</span>
              </div>
              <p className="text-gray-400">
                AI-powered project planning for modern teams.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Integrations'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-bold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>© 2024 Acorn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
export { LandingPage };
