import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Requirement } from '@/types';
import {
  Sparkles,
  Server,
  Database,
  Globe,
  Shield,
  Zap,
  Box,
  GitBranch,
  Layers,
  FolderTree,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { api } from '@/lib/api';

interface TechStackItem {
  name: string;
  category: string;
  description: string;
  icon: string;
  recommended: boolean;
}

type TechStackMap = Record<string, TechStackItem[]>;

interface DevelopmentPhaseProps {
  projectId: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  requirements?: Requirement[];
  content?: string;
}

export const DevelopmentPhase: React.FC<DevelopmentPhaseProps> = ({
  projectId,
  onGenerate,
  isGenerating,
  requirements,
  content,
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'flow' | 'structure'>('stack');
  const [stackFilter, setStackFilter] = useState('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  const initialTechStack: TechStackMap = {
    frontend: [
      { name: 'React', category: 'Framework', description: 'Component-based UI library', icon: '', recommended: true },
      { name: 'TypeScript', category: 'Language', description: 'Type-safe JavaScript', icon: '', recommended: true },
      { name: 'TailwindCSS', category: 'Styling', description: 'Utility-first CSS framework', icon: '', recommended: true },
      { name: 'Vite', category: 'Build Tool', description: 'Next-gen frontend tooling', icon: '', recommended: true },
      { name: 'React Router', category: 'Routing', description: 'Declarative routing', icon: '', recommended: true },
    ],
    backend: [
      { name: 'Django', category: 'Framework', description: 'Python web framework', icon: '', recommended: true },
      { name: 'Django REST Framework', category: 'API', description: 'REST API toolkit', icon: '', recommended: true },
      { name: 'Celery', category: 'Task Queue', description: 'Distributed task queue', icon: '', recommended: true },
      { name: 'Redis', category: 'Cache', description: 'In-memory data store', icon: '', recommended: true },
    ],
    database: [
      { name: 'PostgreSQL', category: 'Primary DB', description: 'Relational database', icon: '', recommended: true },
      { name: 'Redis', category: 'Cache', description: 'Caching layer', icon: '', recommended: true },
    ],
    infrastructure: [
      { name: 'Docker', category: 'Containerization', description: 'Container platform', icon: '', recommended: true },
      { name: 'AWS / GCP', category: 'Cloud', description: 'Cloud infrastructure', icon: '', recommended: true },
      { name: 'Nginx', category: 'Web Server', description: 'Reverse proxy', icon: '', recommended: true },
      { name: 'GitHub Actions', category: 'CI/CD', description: 'Automation pipeline', icon: '', recommended: true },
    ],
  };

  const flowSteps = [
    { id: 1, name: 'Client Request', description: 'User initiates action in browser', icon: Globe, color: 'blue' },
    { id: 2, name: 'API Gateway', description: 'Request routing & authentication', icon: Shield, color: 'amber' },
    { id: 3, name: 'Load Balancer', description: 'Distribute traffic across instances', icon: Zap, color: 'purple' },
    { id: 4, name: 'Application Server', description: 'Business logic processing', icon: Server, color: 'emerald' },
    { id: 5, name: 'Database', description: 'Data persistence layer', icon: Database, color: 'red' },
    { id: 6, name: 'Cache Layer', description: 'Fast data retrieval', icon: Zap, color: 'orange' },
    { id: 7, name: 'Response', description: 'JSON response to client', icon: ArrowRight, color: 'cyan' },
  ];

  const componentBreakdown = [
    {
      layer: 'Controllers',
      description: 'Handle HTTP requests and responses',
      items: ['AuthController', 'ProjectController', 'RequirementController', 'TaskController'],
      color: 'blue',
    },
    {
      layer: 'Services',
      description: 'Business logic and orchestration',
      items: ['AuthService', 'ProjectService', 'AIService', 'NotificationService'],
      color: 'emerald',
    },
    {
      layer: 'Repositories',
      description: 'Data access abstraction',
      items: ['UserRepository', 'ProjectRepository', 'RequirementRepository', 'TaskRepository'],
      color: 'purple',
    },
    {
      layer: 'Entities / Models',
      description: 'Domain objects and ORM models',
      items: ['User', 'Project', 'Requirement', 'Task', 'Artifact'],
      color: 'amber',
    },
  ];

  const folderStructure = `
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── phases/      # Phase-specific components
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Route pages
│   │   ├── lib/             # Utilities and API client
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript interfaces
│   │   └── constants/       # App constants
│   └── public/              # Static assets
│
├── backend/
│   ├── api/
│   │   ├── views/           # API endpoints
│   │   ├── serializers/     # Data serialization
│   │   ├── models/          # Database models
│   │   └── services/        # Business logic
│   ├── core/                # Core settings
│   └── utils/               # Helper functions
│
├── docker/                  # Docker configuration
├── docs/                    # Documentation
└── tests/                   # Test suites
  `.trim();

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
    amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
    red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700' },
  };

  const [techStackData, setTechStackData] = useState<TechStackMap>(initialTechStack);
  const [bestPractices, setBestPractices] = useState<string[]>([
    'Use connection pooling for database',
    'Implement Redis caching for hot data',
    'Enable gzip compression for API responses',
    'Use CDN for static assets',
    'Implement lazy loading in frontend',
  ]);
  const [watchOuts, setWatchOuts] = useState<string[]>([
    'N+1 query problems in ORM',
    'Memory leaks in long-running processes',
    'Unbounded pagination queries',
    'Missing database indexes',
    'Synchronous blocking operations',
  ]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState({
    bestPractices: bestPractices.join('\n'),
    watchOuts: watchOuts.join('\n'),
  });
  const [flowStepsAi, setFlowStepsAi] = useState<string[] | null>(null);
  const [folderStructureAi, setFolderStructureAi] = useState<string | null>(null);
  const [componentsAi, setComponentsAi] = useState<string[] | null>(null);

  const suggestedTechs = React.useMemo(() => {
    const suggestions: { label: string; details: string }[] = [];

    let corpus = '';
    if (requirements && requirements.length) {
      corpus +=
        '\n' +
        requirements
          .map((r) => `${r.title} ${r.description}`)
          .join(' \n ')
          .toLowerCase();
    }

    // Also look at the existing development plan data (stack, flow, structure, components)
    Object.values(techStackData).forEach((items) => {
      items.forEach((item) => {
        corpus += `\n${item.name} ${item.description} ${item.category}`.toLowerCase();
      });
    });

    if (flowStepsAi && flowStepsAi.length) {
      corpus += '\n' + flowStepsAi.join(' \n ').toLowerCase();
    }
    if (folderStructureAi) {
      corpus += '\n' + folderStructureAi.toLowerCase();
    }
    if (componentsAi && componentsAi.length) {
      corpus += '\n' + componentsAi.join(' \n ').toLowerCase();
    }
    if (content) {
      corpus += '\n' + content.toLowerCase();
    }

    const text = corpus;

    const add = (label: string, details: string) => {
      if (!suggestions.find((s) => s.label === label)) {
        suggestions.push({ label, details });
      }
    };

    if (text.includes('mobile') || text.includes('android') || text.includes('ios')) {
      add(
        'Mobile stack',
        'Explore Flutter, React Native, Kotlin/Android, Swift/iOS, and Expo for cross-platform mobile apps.'
      );
    }

    if (
      text.includes('web app') ||
      text.includes('webapp') ||
      text.includes('web portal') ||
      text.includes('dashboard') ||
      text.includes('frontend')
    ) {
      add(
        'Web frontend',
        'Explore React + TypeScript, Next.js, Vue 3, Nuxt, Angular, and SvelteKit for modern web frontends.'
      );
    }

    if (text.includes('api') || text.includes('rest') || text.includes('graphql') || text.includes('backend')) {
      add(
        'Web backend / API',
        'Compare Django REST/DRF, FastAPI, Node.js/Express, NestJS, Laravel, Ruby on Rails, and Spring Boot for APIs.'
      );
    }

    if (text.includes('ecommerce') || text.includes('payments') || text.includes('subscription')) {
      add(
        'Payments & billing',
        'Look at Stripe, Braintree, Paddle, and PayPal SDKs, plus PCI/GDPR and subscription billing patterns.'
      );
    }

    if (text.includes('realtime') || text.includes('real-time') || text.includes('chat') || text.includes('notifications')) {
      add(
        'Realtime & messaging',
        'Compare WebSockets, Socket.IO, SignalR, GraphQL subscriptions, and services like Pusher/Ably/Fanout.'
      );
    }

    if (
      text.includes('database') ||
      text.includes('sql') ||
      text.includes('postgres') ||
      text.includes('mysql') ||
      text.includes('mongodb') ||
      text.includes('no-sql') ||
      text.includes('nosql')
    ) {
      add(
        'Databases & storage',
        'Compare PostgreSQL, MySQL/MariaDB, SQLite, MongoDB, and Redis, plus ORMs like Prisma, TypeORM, SQLAlchemy, and Eloquent.'
      );
    }

    if (
      text.includes('docker') ||
      text.includes('kubernetes') ||
      text.includes('k8s') ||
      text.includes('aws') ||
      text.includes('gcp') ||
      text.includes('azure') ||
      text.includes('ci/cd') ||
      text.includes('pipeline')
    ) {
      add(
        'Infrastructure & DevOps',
        'Explore Docker, docker-compose, Kubernetes, AWS/GCP/Azure basics, and CI/CD with GitHub Actions, GitLab CI, or CircleCI.'
      );
    }

    // Language / framework bias
    if (text.includes('django') || text.includes('fastapi') || text.includes('python')) {
      add(
        'Python backend focus',
        'Go deeper into Django, Django REST Framework, FastAPI, SQLAlchemy/ORMs, and Celery/Redis for async tasks.'
      );
    }
    if (text.includes('laravel') || text.includes('php')) {
      add(
        'PHP / Laravel',
        'Explore Laravel (Eloquent, queues, events), Symfony components, and modern PHP 8+ features.'
      );
    }
    if (text.includes('nestjs') || text.includes('nest.js') || text.includes('typescript backend')) {
      add(
        'Node / NestJS',
        'Go deeper into NestJS modules, providers, controllers, decorators, and testing with Jest.'
      );
    }
    if (text.includes('express') || text.includes('node.js') || text.includes('nodejs')) {
      add(
        'Node / Express',
        'Strengthen Express fundamentals: routing, middleware, validation (Joi/Zod), and structured controllers/services.'
      );
    }

    return suggestions;
  }, [requirements, techStackData, flowStepsAi, folderStructureAi, componentsAi, content]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getDevelopment(projectId);
        if (cancelled) return;

        if (Array.isArray(data.stack) && data.stack.length > 0) {
          const next: TechStackMap = { ...initialTechStack };
          data.stack.forEach((raw: any) => {
            const category = raw.category || 'frontend';
            const item: TechStackItem = {
              name: raw.name || '',
              category,
              description: raw.description || '',
              icon: raw.icon || '✨',
              recommended: !!raw.recommended,
            };
            if (!next[category]) next[category] = [];
            next[category] = [item, ...next[category]];
          });
          setTechStackData(next);
        }

        if (data.notes && typeof data.notes === 'object') {
          const bp = Array.isArray(data.notes.bestPractices)
            ? data.notes.bestPractices
            : typeof data.notes.bestPractices === 'string'
            ? data.notes.bestPractices.split('\n').map((s: string) => s.trim()).filter(Boolean)
            : bestPractices;
          const wo = Array.isArray(data.notes.watchOuts)
            ? data.notes.watchOuts
            : typeof data.notes.watchOuts === 'string'
            ? data.notes.watchOuts.split('\n').map((s: string) => s.trim()).filter(Boolean)
            : watchOuts;

          setBestPractices(bp);
          setWatchOuts(wo);
          setNotesDraft({
            bestPractices: bp.join('\n'),
            watchOuts: wo.join('\n'),
          });

          if (Array.isArray((data.notes as any).flowSteps)) {
            setFlowStepsAi((data.notes as any).flowSteps as string[]);
          }
          if (typeof (data.notes as any).folderStructure === 'string') {
            setFolderStructureAi((data.notes as any).folderStructure as string);
          }
          if (Array.isArray((data.notes as any).components)) {
            setComponentsAi((data.notes as any).components as string[]);
          }
        }
      } catch (err) {
        console.error('Failed to load development data', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persistDevelopment = async (nextStack: TechStackMap, nextBest: string[], nextWatch: string[]) => {
    if (!projectId) return;
    const flatStack: any[] = [];
    Object.entries(nextStack).forEach(([category, items]) => {
      items.forEach((item) => {
        flatStack.push({
          name: item.name,
          category: item.category || category,
          description: item.description,
          icon: item.icon,
          recommended: item.recommended,
        });
      });
    });
    const notes = {
      bestPractices: nextBest,
      watchOuts: nextWatch,
    };
    try {
      await api.saveDevelopment(projectId, { stack: flatStack, notes });
    } catch (err) {
      console.error('Failed to save development data', err);
    }
  };

  const handleToggleRecommended = (category: string, idx: number) => {
    setTechStackData((prev) => {
      const next: TechStackMap = {
        ...prev,
        [category]: prev[category].map((item, i) =>
          i === idx ? { ...item, recommended: !item.recommended } : item
        ),
      };
      persistDevelopment(next, bestPractices, watchOuts);
      return next;
    });
  };

  const handleDeleteTech = (category: string, idx: number) => {
    setTechStackData((prev) => {
      const next: TechStackMap = {
        ...prev,
        [category]: prev[category].filter((_, i) => i !== idx),
      };
      persistDevelopment(next, bestPractices, watchOuts);
      return next;
    });
  };

  const startEditingNotes = () => {
    setNotesDraft({
      bestPractices: bestPractices.join('\n'),
      watchOuts: watchOuts.join('\n'),
    });
    setEditingNotes(true);
  };

  const saveNotes = () => {
    const nextBest = notesDraft.bestPractices
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const nextWatch = notesDraft.watchOuts
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    setBestPractices(nextBest);
    setWatchOuts(nextWatch);
    persistDevelopment(techStackData, nextBest, nextWatch);
    setEditingNotes(false);
  };

  const resolvedFlowSteps = React.useMemo(() => {
    if (flowStepsAi && flowStepsAi.length) {
      return flowStepsAi.map((raw, index) => {
        const [namePart, descPart] = raw.split(':');
        const name = (namePart || `Step ${index + 1}`).trim();
        const description = (descPart || name).trim();
        return {
          id: index + 1,
          name,
          description,
          icon: GitBranch,
          color: 'emerald' as const,
        };
      });
    }
    return flowSteps;
  }, [flowStepsAi]);

  const resolvedFolderStructure = folderStructureAi || folderStructure;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'stack', label: 'Tech Stack', icon: Layers },
          { id: 'flow', label: 'System Flow', icon: GitBranch },
          { id: 'structure', label: 'Folder Structure', icon: FolderTree },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tech Stack Tab */}
      {activeTab === 'stack' && (
        <div className="space-y-4">
          {suggestedTechs.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 text-base">
                  <Sparkles className="h-4 w-4" />
                  Suggested technologies to learn
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Based on your current requirements (features, platforms, and constraints).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {suggestedTechs.map((s) => (
                  <div
                    key={s.label}
                    className="px-3 py-2 rounded-lg bg-white shadow-sm border border-emerald-200 max-w-xs"
                  >
                    <div className="text-xs font-semibold text-emerald-800 mb-1">{s.label}</div>
                    <div className="text-[11px] text-emerald-700 leading-snug">{s.details}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {suggestedTechs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Learning roadmap</CardTitle>
                <CardDescription className="text-xs">
                  High-level steps you can follow to grow your stack skills for this project.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-1 text-xs text-gray-700 list-decimal list-inside">
                  {suggestedTechs.map((s, idx) => {
                    const level: 'Beginner' | 'Intermediate' | 'Advanced' =
                      idx <= 2 ? 'Beginner' : idx <= 5 ? 'Intermediate' : 'Advanced';
                    const levelClass =
                      level === 'Beginner'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : level === 'Intermediate'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200';
                    return (
                      <li key={s.label} className="flex flex-wrap items-start gap-2">
                        <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${levelClass}`}>
                          {level}
                        </span>
                        <span>
                          <span className="font-semibold">{s.label}:</span> {s.details}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}

          {suggestedTechs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">This week&apos;s focus</CardTitle>
                <CardDescription className="text-xs">
                  Start with these 1–3 roadmap areas and ship a small vertical slice using them.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 text-xs text-gray-700">
                {suggestedTechs.slice(0, 3).map((s) => (
                  <div key={s.label} className="p-2 rounded-lg border border-[#1e3a5f] bg-white">
                    <div className="font-semibold mb-0.5">{s.label}</div>
                    <div className="text-[11px] leading-snug">{s.details}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stack filters */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3">
              <input
                className="border rounded-lg px-3 py-1.5 text-xs flex-1 min-w-[160px]"
                placeholder="Filter technologies by name or description"
                value={stackFilter}
                onChange={(e) => setStackFilter(e.target.value)}
              />
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={showRecommendedOnly}
                  onChange={(e) => setShowRecommendedOnly(e.target.checked)}
                />
                Show recommended only
              </label>
            </CardContent>
          </Card>

          {Object.entries(techStackData).map(([category, items]) => {
            const categoryIcons: Record<string, React.ReactNode> = {
              frontend: <Globe className="h-5 w-5" />,
              backend: <Server className="h-5 w-5" />,
              database: <Database className="h-5 w-5" />,
              infrastructure: <Box className="h-5 w-5" />,
            };

            const filter = stackFilter.trim().toLowerCase();
            const visibleItems = items.filter((item) => {
              if (showRecommendedOnly && !item.recommended) return false;
              if (!filter) return true;
              const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase();
              return haystack.includes(filter);
            });

            return (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {categoryIcons[category]}
                    <span className="capitalize">{category}</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    {visibleItems.length} of {items.length} technologies in this layer
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleItems.map((item, idx) => (
                      <div
                        key={item.name}
                        className="p-3 rounded-xl border border-[#1e3a5f] bg-white hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[10px] text-emerald-600 px-1 h-6"
                            onClick={() => handleToggleRecommended(category, idx)}
                          >
                            {item.recommended ? 'Recommended' : 'Mark' }
                          </Button>
                        </div>
                        <p className="text-[11px] text-gray-600 mb-1">{item.description}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.category}
                        </Badge>
                        <div className="mt-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[10px] text-red-500 px-1 h-6"
                            onClick={() => handleDeleteTech(category, idx)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* System Flow Tab */}
      {activeTab === 'flow' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-emerald-600" />
                Request Flow Diagram
              </CardTitle>
              <CardDescription>How a request flows through the system</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {/* Flow Steps */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {resolvedFlowSteps.map((step, idx) => {
                    const colors = colorMap[step.color];
                    return (
                      <React.Fragment key={step.id}>
                        <div className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg} min-w-[140px]`}>
                          <div className="flex items-center gap-2 mb-2">
                            <step.icon className={`h-5 w-5 ${colors.text}`} />
                            <span className={`font-medium ${colors.text}`}>{step.name}</span>
                          </div>
                          <p className="text-xs text-gray-600">{step.description}</p>
                        </div>
                        {idx < resolvedFlowSteps.length - 1 && (
                          <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Flow Legend */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-3">Flow Details</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Request Path</h5>
                      <ol className="space-y-1 text-gray-600">
                        <li>1. Client sends HTTP request</li>
                        <li>2. API Gateway validates JWT token</li>
                        <li>3. Load balancer routes to healthy instance</li>
                        <li>4. Application processes business logic</li>
                      </ol>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Response Path</h5>
                      <ol className="space-y-1 text-gray-600">
                        <li>5. Check cache for existing data</li>
                        <li>6. Query database if cache miss</li>
                        <li>7. Serialize response to JSON</li>
                        <li>8. Return to client with headers</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Methodology tips</CardTitle>
              <CardDescription className="text-xs">
                How to think about request/response flows for different API styles.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-gray-700 space-y-2">
              <div>
                <p className="font-semibold mb-1">REST APIs</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Model flows around resources (e.g. <code>/users</code>, <code>/workouts</code>).</li>
                  <li>Use HTTP verbs to describe intent: GET (read), POST (create), PUT/PATCH (update), DELETE (remove).</li>
                  <li>Keep the flow stateless: every request carries auth and context.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">GraphQL</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Think in queries and mutations hitting a single <code>/graphql</code> endpoint.</li>
                  <li>Flow is: client builds query → GraphQL server resolves fields → data loaders/services hit DB.</li>
                  <li>Design resolvers to reuse the same services as REST controllers.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Event-driven</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Requests become events on a bus (e.g. "WorkoutCreated"), consumed by multiple services.</li>
                  <li>Draw flows as publish → broker → subscribers, not just client → server.</li>
                  <li>Use this style for decoupled background work (notifications, analytics, billing).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Folder Structure Tab */}
      {activeTab === 'structure' && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-purple-600" />
                Project Folder Structure
              </CardTitle>
              <CardDescription>Recommended directory organization</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-6 bg-gray-900 text-gray-100 text-sm font-mono overflow-x-auto">
              {resolvedFolderStructure}
            </pre>
          </CardContent>
        </Card>
      )}

      {content && (() => {
        const lines = content.split('\n').map((line) => line.trim());
        let endpointLines = lines
          .filter((line) => /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+\//i.test(line))
          .map((line) => line.replace(/^[-*]\s*/, ''));

        // Fallback: look for backticked /api/... style routes even if no HTTP verb is present
        if (endpointLines.length === 0) {
          const routeCandidates: string[] = [];
          const routeLineRegex = /`\/(?!\/)[^`]+`/g; // backticked paths starting with /
          lines.forEach((line) => {
            let match: RegExpExecArray | null;
            while ((match = routeLineRegex.exec(line)) !== null) {
              const raw = match[0].replace(/`/g, '');
              routeCandidates.push(raw);
            }
          });
          if (routeCandidates.length) {
            endpointLines = Array.from(new Set(routeCandidates));
          }
        }

        return (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4" />
                API Endpoints
              </CardTitle>
              <CardDescription>
                Extracted from the development plan. Shows routes like <code>GET /route</code> or <code>/api/users/me</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {endpointLines.length > 0 ? (
                endpointLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 border-b last:border-b-0 text-xs font-mono"
                  >
                    <span>{line}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">
                  No explicit HTTP verb routes found in the markdown. Ask AI to list endpoints like <code>GET /projects</code>.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Components summary intentionally removed for a simpler System Flow + Folder Structure view */}

      {/* Performance Notes */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            Performance & Scalability Notes
          </CardTitle>
          <Button variant="outline" size="sm" onClick={editingNotes ? saveNotes : startEditingNotes}>
            {editingNotes ? 'Save Notes' : 'Edit Notes'}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Best Practices
              </h4>
              {editingNotes ? (
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={6}
                  value={notesDraft.bestPractices}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, bestPractices: e.target.value }))}
                />
              ) : (
                <ul className="space-y-2 text-sm text-gray-600">
                  {bestPractices.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Watch Out For
              </h4>
              {editingNotes ? (
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={6}
                  value={notesDraft.watchOuts}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, watchOuts: e.target.value }))}
                />
              ) : (
                <ul className="space-y-2 text-sm text-gray-600">
                  {watchOuts.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gray-600" />
            Development Phase Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {Object.values(techStackData).flat().length}
              </div>
              <div className="text-sm text-blue-600">Technologies</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <div className="text-2xl font-bold text-emerald-700">4</div>
              <div className="text-sm text-emerald-600">Layers</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-700">
                {componentBreakdown.reduce((a, c) => a + c.items.length, 0)}
              </div>
              <div className="text-sm text-purple-600">Components</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-700">7</div>
              <div className="text-sm text-amber-600">Flow Steps</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevelopmentPhase;
