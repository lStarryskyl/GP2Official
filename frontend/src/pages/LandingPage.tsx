import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  ArrowRight,
  Check,
  Cpu,
  ShieldCheck,
  Globe,
  Users,
  Star,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Analysis',
    description: 'Transform project briefs into comprehensive requirements using advanced AI',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: Target,
    title: 'Stakeholder Ready Docs',
    description: 'Generate professional SRS documents that meet industry expectations',
    color: 'from-green-500 to-emerald-600'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Reduce planning time from weeks to minutes with automated workflows',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: TrendingUp,
    title: 'Smart Insights',
    description: 'Get actionable recommendations and risk analysis for your projects',
    color: 'from-purple-500 to-pink-600'
  }
];

const benefits = [
  'Automated Requirements Extraction',
  'UML Diagram Generation',
  'Task Breakdown & Planning',
  'Risk Analysis & Mitigation',
  'Cost Estimation',
  'Team Collaboration Tools'
];

const workflowStages = [
  {
    title: 'Planning Seeds',
    description: 'Capture briefs, upload artifacts, and let Acorn map the scope.',
    icon: Target,
    badge: 'Phase 01'
  },
  {
    title: 'Design & Intelligence',
    description: 'AI multi-agents generate requirements, UML, and tasks in sync.',
    icon: Cpu,
    badge: 'Phase 02'
  },
  {
    title: 'Validation & Iteration',
    description: 'Collaborate with Acorn Draft, refine diagrams, and approve.',
    icon: ShieldCheck,
    badge: 'Phase 03'
  },
  {
    title: 'Launch & Share',
    description: 'Export stakeholder-ready docs, Trello tasks, and Gantt timelines.',
    icon: Globe,
    badge: 'Phase 04'
  }
];

const stats = [
  { value: '95%', label: 'Faster planning cycles' },
  { value: '40+', label: 'Diagrams per project' },
  { value: '12x', label: 'Requirement coverage' },
  { value: '500+', label: 'Teams scaling with Acorn' }
];

const testimonials = [
  {
    quote:
      'Acorn feels like having a full requirements team on call. The AI understands context and keeps everyone aligned.',
    author: 'Sofia Martins',
    role: 'Head of Delivery, Northwind',
    color: 'from-amber-500/80 to-orange-500/80'
  },
  {
    quote:
      'We replaced messy doc stacks with a living canvas + Draft workspace. Stakeholders finally see progress in real time.',
    author: 'Noah Patel',
    role: 'Program Director, Rivendell Labs',
    color: 'from-purple-500/80 to-pink-500/80'
  }
];

const logoMarquee = ['Trello', 'Linear', 'Jira', 'Notion', 'Slack'];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[520px] h-[520px] bg-gradient-to-br from-amber-400/25 to-orange-500/25 rounded-full blur-3xl animate-orb"
          style={{ top: '8%', left: '4%', animationDelay: '0s' }}
        />
        <div
          className="absolute w-[420px] h-[420px] bg-gradient-to-br from-orange-400/25 to-red-500/25 rounded-full blur-3xl animate-orb"
          style={{ top: '48%', right: '8%', animationDelay: '2s' }}
        />
        <div
          className="absolute w-[360px] h-[360px] bg-gradient-to-br from-yellow-400/25 to-amber-500/25 rounded-full blur-3xl animate-orb"
          style={{ bottom: '6%', left: '20%', animationDelay: '4s' }}
        />
      </div>

      <nav className="relative z-10 px-6 py-4 backdrop-blur-sm bg-white/30 border-b border-amber-200/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/') }>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <img
                src="https://images.unsplash.com/photo-1569977562541-024dd41514fc?w=100&h=100&fit=crop"
                alt="Acorn Logo"
                className="relative w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 group-hover:scale-110 transition-transform"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
              Acorn
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="hover:bg-amber-100/50 text-amber-900 font-medium"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slideInLeft">
            <div className="inline-flex items-center px-4 py-2 bg-amber-100 rounded-full border border-amber-300 animate-pulse-slow">
              <Sparkles className="w-4 h-4 text-amber-600 mr-2" />
              <span className="text-sm font-medium text-amber-800">AI-Powered Planning Platform</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent animate-gradient">
                Plant the Seeds
              </span>
              <br />
              <span className="text-gray-800">of Perfect Projects</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Transform your project ideas into comprehensive, production-ready plans with the power of AI.
              From concept to execution, Acorn grows with your vision.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
              >
                Start Growing
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-amber-500 text-amber-700 hover:bg-amber-50 px-8 py-6 text-lg font-semibold"
              >
                Watch Demo
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              {stats.slice(0, 2).map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-amber-100 shadow-lg animate-fadeIn"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <p className="text-3xl font-bold text-amber-700">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-slideInRight">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-3xl blur-2xl animate-pulse-slow" />
              <img
                src="https://images.unsplash.com/photo-1581092335331-5e00ac65e934?w=800&h=600&fit=crop"
                alt="Software Planning & Requirements"
                className="relative rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-3xl flex items-center justify-center">
                <div className="text-white text-center p-6 bg-black/40 backdrop-blur-sm rounded-2xl">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-semibold">AI-Powered Requirements Analysis</p>
                </div>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-4 animate-float-delay">
                <Users className="w-10 h-10 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-500">Collaborators live</p>
                  <p className="text-lg font-semibold text-gray-800">17 teams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800">Why Choose Acorn?</h2>
          <p className="text-xl text-gray-600">Powerful features that help your projects thrive</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-amber-200/50 animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold text-amber-600">IMMERSIVE JOURNEY</p>
            <h2 className="text-4xl font-bold text-gray-900">Each phase unlocks the next level of clarity</h2>
            <p className="text-lg text-gray-600">
              Acorn orchestrates planning as a guided experience. Watch the canvas evolve from fuzzy briefs to crystal-clear delivery plans.
            </p>
            <div className="space-y-4 border-l-2 border-amber-300 pl-6">
              {workflowStages.map((stage, idx) => (
                <div key={stage.title} className="relative">
                  <div className="absolute -left-[74px] top-1 text-xs font-semibold text-amber-500">{stage.badge}</div>
                  <div className="flex items-start gap-4 animate-fadeIn" style={{ animationDelay: `${idx * 0.15}s` }}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <stage.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{stage.title}</p>
                      <p className="text-gray-600 text-sm">{stage.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/80 backdrop-blur rounded-3xl shadow-2xl border border-amber-100 p-8 space-y-6 animate-tilt">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Live Requirements Canvas</p>
                  <p className="text-3xl font-bold text-amber-700">54 nodes evolving</p>
                </div>
                <div className="px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">Synced</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5 text-white space-y-2 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-white/70">What-if Insight</p>
                <p className="text-xl font-semibold">"Add mobile scope"</p>
                <p className="text-white/90 text-sm">Impact: +2 sprints, +18% cost. Recommended to split backlog.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-12 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-white">Everything You Need to Succeed</h2>
              <p className="text-xl text-amber-50">From initial concept to final delivery, Acorn provides all the tools you need.</p>

              <div className="grid gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-white">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-6 border border-amber-200/50">
              <p className="text-amber-100 text-sm uppercase tracking-widest mb-4">HOW IT WORKS</p>
              <div className="space-y-4">
                {[
                  { step: '01', title: 'Capture & Brief', text: 'Provide a short prompt or upload context files.' },
                  { step: '02', title: 'AI Planning', text: 'Acorn orchestrates requirements, tasks, and diagrams.' },
                  { step: '03', title: 'Human Review', text: 'Use Acorn Draft + diagram studio to refine outputs.' },
                  { step: '04', title: 'Share & Ship', text: 'Export stakeholder-ready docs and traceability.' }
                ].map((item) => (
                  <div key={item.step} className="bg-white/5 rounded-xl px-4 py-3">
                    <p className="text-amber-200 text-xs">{item.step}</p>
                    <p className="text-white text-lg font-semibold">{item.title}</p>
                    <p className="text-amber-50">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10">
          {testimonials.map((item, index) => (
            <div
              key={item.author}
              className={`relative bg-gradient-to-br ${item.color} rounded-3xl p-8 text-white shadow-2xl overflow-hidden animate-fadeIn`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <Quote className="w-10 h-10 mb-4 opacity-70" />
              <p className="text-xl leading-relaxed mb-6">{item.quote}</p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/30 flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">{item.author}</p>
                  <p className="text-sm text-white/80">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <p className="text-center text-sm font-semibold text-amber-600 mb-4">INTEGRATIONS & COMPANIONS</p>
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white/80">
          <div className="flex items-center gap-12 py-8 animate-marquee">
            {logoMarquee.map((logo) => (
              <div key={logo} className="text-2xl font-semibold text-amber-500 tracking-wider">{logo}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-20 max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur rounded-3xl shadow-2xl border border-amber-100 p-10 text-center space-y-6">
          <p className="text-sm font-semibold text-amber-600">READY TO PLANT SOMETHING BIG?</p>
          <h2 className="text-4xl font-bold text-gray-900">Launch your smartest project in minutes</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join product teams, consultancies, and innovation labs already using Acorn to deliver stakeholder-ready plans with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Create an Account
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/projects')}
              className="text-amber-700 hover:bg-amber-50 px-8 py-6 text-lg font-semibold"
            >
              Explore the Product
            </Button>
          </div>
        </div>
      </section>

      <style>
        {`
          @keyframes orbFloat {
            0% { transform: translate3d(0, 0, 0) scale(1); }
            50% { transform: translate3d(0, -30px, 0) scale(1.05); }
            100% { transform: translate3d(0, 0, 0) scale(1); }
          }
          .animate-orb {
            animation: orbFloat 12s ease-in-out infinite;
          }
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradientMove 6s ease infinite;
          }
          @keyframes pulseSlow {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
          .animate-pulse-slow {
            animation: pulseSlow 4s ease-in-out infinite;
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-40px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-slideInLeft { animation: slideInLeft 0.8s ease-out both; }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-slideInRight { animation: slideInRight 0.8s ease-out both; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn { animation: fadeIn 0.8s ease-out both; }
          @keyframes floatDelay {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          .animate-float-delay { animation: floatDelay 5s ease-in-out infinite; }
          @keyframes tilt {
            0%, 100% { transform: rotate(-1deg); }
            50% { transform: rotate(1deg); }
          }
          .animate-tilt { animation: tilt 10s ease-in-out infinite; }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            width: max-content;
            animation: marquee 15s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
