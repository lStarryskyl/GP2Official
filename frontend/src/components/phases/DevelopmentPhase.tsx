import React, { useState, useEffect, useRef } from 'react';
import { useReveal } from '@/hooks/useReveal';
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

interface DevelopmentNotes {
  bestPractices?: string[] | string;
  watchOuts?: string[] | string;
  flowSteps?: string[];
  folderStructure?: string;
  components?: string[];
  requestPath?: string[];
  responsePath?: string[];
}

interface RawStackItem {
  name?: string;
  category?: string;
  description?: string;
  icon?: string;
  recommended?: boolean;
}

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
  const [stackRevealRef, stackVisible] = useReveal<HTMLDivElement>(0.05);

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
      color: 'blue',
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

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-900/30', border: 'border-blue-600/50', text: 'text-blue-300' },
    purple: { bg: 'bg-purple-900/30', border: 'border-purple-600/50', text: 'text-purple-300' },
    amber: { bg: 'bg-amber-900/30', border: 'border-amber-600/50', text: 'text-amber-300' },
    red: { bg: 'bg-red-900/30', border: 'border-red-600/50', text: 'text-red-300' },
    orange: { bg: 'bg-orange-900/30', border: 'border-orange-600/50', text: 'text-orange-300' },
    cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-600/50', text: 'text-cyan-300' },
  };

  const [techStackData, setTechStackData] = useState<TechStackMap>(initialTechStack);
  const [bestPractices, setBestPractices] = useState<string[]>([]);
  const [watchOuts, setWatchOuts] = useState<string[]>([]);
  const [requestPath, setRequestPath] = useState<string[]>([]);
  const [responsePath, setResponsePath] = useState<string[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState({
    bestPractices: '',
    watchOuts: '',
  });
  const [flowStepsAi, setFlowStepsAi] = useState<string[] | null>(null);
  const [folderStructureAi, setFolderStructureAi] = useState<string | null>(null);
  const [componentsAi, setComponentsAi] = useState<string[] | null>(null);
  const [developmentLoaded, setDevelopmentLoaded] = useState(false);
  const lastAppliedContentRef = useRef<string | null>(null);

  const parsedFromContent = React.useMemo(() => {
    const result = {
      bestPractices: [] as string[],
      watchOuts: [] as string[],
      requestPath: [] as string[],
      responsePath: [] as string[],
      folderStructure: null as string | null,
      flowSteps: [] as string[],
    };
    if (!content) return result;

    const lines = content.split('\n');
    const sectionRegex = /^(#{1,6})\s+(.+?)\s*$/;
    type Section = { title: string; level: number; lines: string[] };
    const sections: Section[] = [];
    let current: Section | null = null;
    for (const line of lines) {
      const m = line.match(sectionRegex);
      if (m) {
        current = { title: m[2].trim(), level: m[1].length, lines: [] };
        sections.push(current);
      } else if (current) {
        current.lines.push(line);
      }
    }

    const findSection = (matcher: (title: string) => boolean): Section | undefined =>
      sections.find((s) => matcher(s.title.toLowerCase()));

    const bulletRegex = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
    const collectBullets = (sec: Section | undefined): string[] => {
      if (!sec) return [];
      const out: string[] = [];
      for (const l of sec.lines) {
        const trimmed = l.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('#')) break;
        const bm = trimmed.match(bulletRegex);
        if (bm) out.push(bm[1].trim());
      }
      return out;
    };

    const bp = findSection((t) => t.includes('best practice'));
    const wo = findSection((t) => t.includes('watch out') || t.includes('pitfall') || t.includes('common mistake'));
    const rp = findSection((t) => t.includes('request path'));
    const resp = findSection((t) => t.includes('response path'));
    const flow = findSection((t) => t === 'flow' || t.includes('development flow') || t.includes('system flow') || t.includes('request flow'));
    const folder = findSection((t) => t.includes('folder structure') || t.includes('directory structure') || t.includes('project structure'));

    result.bestPractices = collectBullets(bp);
    result.watchOuts = collectBullets(wo);
    result.requestPath = collectBullets(rp);
    result.responsePath = collectBullets(resp);
    result.flowSteps = collectBullets(flow);

    if (folder) {
      const text = folder.lines.join('\n');
      const codeMatch = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      if (codeMatch) {
        result.folderStructure = codeMatch[1].trimEnd();
      } else {
        const treeLines = folder.lines.filter((l) => /[├└│─]/.test(l) || /^\s*\w[\w./-]*\/?\s*$/.test(l));
        if (treeLines.length >= 3) {
          result.folderStructure = treeLines.join('\n');
        }
      }
    }

    return result;
  }, [content]);

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
          (data.stack as RawStackItem[]).forEach((raw) => {
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
          const notes = data.notes as DevelopmentNotes;
          const bp = Array.isArray(notes.bestPractices)
            ? notes.bestPractices
            : typeof notes.bestPractices === 'string'
            ? notes.bestPractices.split('\n').map((s) => s.trim()).filter(Boolean)
            : [];
          const wo = Array.isArray(notes.watchOuts)
            ? notes.watchOuts
            : typeof notes.watchOuts === 'string'
            ? notes.watchOuts.split('\n').map((s) => s.trim()).filter(Boolean)
            : [];

          setBestPractices(bp);
          setWatchOuts(wo);
          setNotesDraft({
            bestPractices: bp.join('\n'),
            watchOuts: wo.join('\n'),
          });

          if (Array.isArray(notes.flowSteps)) setFlowStepsAi(notes.flowSteps);
          if (typeof notes.folderStructure === 'string') setFolderStructureAi(notes.folderStructure);
          if (Array.isArray(notes.components)) setComponentsAi(notes.components);
          if (Array.isArray(notes.requestPath)) setRequestPath(notes.requestPath);
          if (Array.isArray(notes.responsePath)) setResponsePath(notes.responsePath);
        }
      } catch (err) {
        console.error('Failed to load development data', err);
      } finally {
        if (!cancelled) setDevelopmentLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persistDevelopment = async (
    nextStack: TechStackMap,
    nextBest: string[],
    nextWatch: string[],
    extras?: {
      flowSteps?: string[] | null;
      folderStructure?: string | null;
      components?: string[] | null;
      requestPath?: string[];
      responsePath?: string[];
    }
  ) => {
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
    const notes: DevelopmentNotes = {
      bestPractices: nextBest,
      watchOuts: nextWatch,
      requestPath: extras?.requestPath ?? requestPath,
      responsePath: extras?.responsePath ?? responsePath,
    };
    const flowVal = extras?.flowSteps !== undefined ? extras.flowSteps : flowStepsAi;
    if (flowVal && flowVal.length) notes.flowSteps = flowVal;
    const folderVal = extras?.folderStructure !== undefined ? extras.folderStructure : folderStructureAi;
    if (folderVal) notes.folderStructure = folderVal;
    const compsVal = extras?.components !== undefined ? extras.components : componentsAi;
    if (compsVal && compsVal.length) notes.components = compsVal;
    try {
      await api.saveDevelopment(projectId, { stack: flatStack, notes });
    } catch (err) {
      console.error('Failed to save development data', err);
    }
  };

  // When the AI markdown content surfaces structured sections, hydrate state
  // and persist them so the Development phase reflects this project's plan
  // instead of static placeholder text.
  //
  // Apply rules:
  //   - Wait until saved dev data has loaded (so we never overwrite stored
  //     values with empty defaults on mount).
  //   - On the first apply for any given content payload: refresh sections
  //     from the parsed plan (regeneration should update stale notes).
  //   - For the same content payload, only fill missing sections so we do
  //     not clobber the user's manual edits between renders.
  useEffect(() => {
    if (!projectId) return;
    if (!developmentLoaded) return;
    if (!content) return;

    const isNewContent = lastAppliedContentRef.current !== content;
    const apply = (parsed: string[] | string | null, current: string[] | string | null) => {
      if (parsed === null || (Array.isArray(parsed) && parsed.length === 0) || parsed === '') return false;
      if (isNewContent) return true;
      if (Array.isArray(current)) return current.length === 0;
      return !current;
    };

    const updates: {
      bp?: string[];
      wo?: string[];
      req?: string[];
      res?: string[];
      flow?: string[];
      folder?: string;
    } = {};
    if (apply(parsedFromContent.bestPractices, bestPractices)) updates.bp = parsedFromContent.bestPractices;
    if (apply(parsedFromContent.watchOuts, watchOuts)) updates.wo = parsedFromContent.watchOuts;
    if (apply(parsedFromContent.requestPath, requestPath)) updates.req = parsedFromContent.requestPath;
    if (apply(parsedFromContent.responsePath, responsePath)) updates.res = parsedFromContent.responsePath;
    if (apply(parsedFromContent.flowSteps, flowStepsAi)) updates.flow = parsedFromContent.flowSteps;
    if (apply(parsedFromContent.folderStructure, folderStructureAi)) {
      updates.folder = parsedFromContent.folderStructure as string;
    }

    lastAppliedContentRef.current = content;

    if (Object.keys(updates).length === 0) return;

    const nextBest = updates.bp ?? bestPractices;
    const nextWatch = updates.wo ?? watchOuts;
    const nextReq = updates.req ?? requestPath;
    const nextRes = updates.res ?? responsePath;
    const nextFlow = updates.flow ?? flowStepsAi;
    const nextFolder = updates.folder ?? folderStructureAi;

    if (updates.bp) setBestPractices(nextBest);
    if (updates.wo) setWatchOuts(nextWatch);
    if (updates.req) setRequestPath(nextReq);
    if (updates.res) setResponsePath(nextRes);
    if (updates.flow) setFlowStepsAi(nextFlow ?? null);
    if (updates.folder) setFolderStructureAi(nextFolder ?? null);
    if (updates.bp || updates.wo) {
      setNotesDraft({
        bestPractices: nextBest.join('\n'),
        watchOuts: nextWatch.join('\n'),
      });
    }
    persistDevelopment(techStackData, nextBest, nextWatch, {
      flowSteps: nextFlow,
      folderStructure: nextFolder,
      requestPath: nextReq,
      responsePath: nextRes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedFromContent, projectId, developmentLoaded, content]);

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
      bestPractices: (bestPractices.length > 0 ? bestPractices : parsedFromContent.bestPractices).join('\n'),
      watchOuts: (watchOuts.length > 0 ? watchOuts : parsedFromContent.watchOuts).join('\n'),
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
    const source = flowStepsAi && flowStepsAi.length ? flowStepsAi : parsedFromContent.flowSteps;
    if (!source || source.length === 0) return [];
    return source.map((raw, index) => {
      const [namePart, descPart] = raw.split(':');
      const name = (namePart || `Step ${index + 1}`).trim();
      const description = (descPart || name).trim();
      return {
        id: index + 1,
        name,
        description,
        icon: GitBranch,
        color: 'blue' as const,
      };
    });
  }, [flowStepsAi, parsedFromContent.flowSteps]);

  const resolvedFolderStructure = folderStructureAi || parsedFromContent.folderStructure || '';
  const resolvedRequestPath = requestPath.length > 0 ? requestPath : parsedFromContent.requestPath;
  const resolvedResponsePath = responsePath.length > 0 ? responsePath : parsedFromContent.responsePath;
  const resolvedBestPractices = bestPractices.length > 0 ? bestPractices : parsedFromContent.bestPractices;
  const resolvedWatchOuts = watchOuts.length > 0 ? watchOuts : parsedFromContent.watchOuts;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-[var(--brand-850)] border border-[var(--brand-700)] p-1 rounded-xl w-fit">
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
                ? 'bg-[var(--brand-700)] shadow text-white'
                : 'text-gray-400 hover:text-gray-200'
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
            <Card className="border-blue-700/40 bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-200 text-base">
                  <Sparkles className="h-4 w-4" />
                  Suggested technologies to learn
                </CardTitle>
                <CardDescription className="text-blue-300">
                  Based on your current requirements (features, platforms, and constraints).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {suggestedTechs.map((s) => (
                  <div
                    key={s.label}
                    className="px-3 py-2 rounded-lg bg-[var(--brand-800)] border border-blue-700/40 max-w-xs"
                  >
                    <div className="text-xs font-semibold text-blue-200 mb-1">{s.label}</div>
                    <div className="text-[11px] text-blue-300 leading-snug">{s.details}</div>
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
                <ol className="space-y-1 text-xs text-gray-300 list-decimal list-inside">
                  {suggestedTechs.map((s, idx) => {
                    const level: 'Beginner' | 'Intermediate' | 'Advanced' =
                      idx <= 2 ? 'Beginner' : idx <= 5 ? 'Intermediate' : 'Advanced';
                    const levelClass =
                      level === 'Beginner'
                        ? 'bg-blue-900/20 text-blue-300 border-blue-700/40'
                        : level === 'Intermediate'
                        ? 'bg-amber-900/20 text-amber-300 border-amber-700/40'
                        : 'bg-purple-900/20 text-purple-300 border-purple-700/40';
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
              <CardContent className="pt-0 space-y-2 text-xs text-gray-300">
                {suggestedTechs.slice(0, 3).map((s) => (
                  <div key={s.label} className="p-2 rounded-lg border border-[var(--brand-700)] bg-[var(--brand-800)]">
                    <div className="font-semibold mb-0.5 text-gray-200">{s.label}</div>
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
                className="border border-[var(--brand-700)] rounded-lg px-3 py-1.5 text-xs flex-1 min-w-[160px] bg-[#152238] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Filter technologies by name or description"
                value={stackFilter}
                onChange={(e) => setStackFilter(e.target.value)}
              />
              <label className="flex items-center gap-1 text-xs text-gray-400">
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
                  <div ref={stackRevealRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-container" style={{ opacity: stackVisible ? undefined : 0 }}>
                    {visibleItems.map((item, idx) => (
                      <div
                        key={item.name}
                        className="p-3 rounded-xl phase-card-hover"
                        style={{
                          border: item.recommended
                            ? '2px solid rgba(59,130,246,0.5)'
                            : '1px solid var(--brand-700)',
                          background: item.recommended
                            ? 'rgba(59,130,246,0.06)'
                            : 'var(--brand-850)',
                          boxShadow: item.recommended ? '0 0 0 1px rgba(59,130,246,0.15)' : 'none',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-200 text-sm">{item.name}</span>
                          <div className="flex items-center gap-1">
                            {item.recommended && (
                              <span
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.category}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[10px] text-blue-400 px-1 h-6"
                              onClick={() => handleToggleRecommended(category, idx)}
                              title={item.recommended ? 'Remove recommended status' : 'Mark as recommended'}
                            >
                              {item.recommended ? 'Unmark' : 'Mark'}
                            </Button>
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
            <CardHeader className="bg-gradient-to-r from-blue-900/20 to-blue-900/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-400" />
                Request Flow Diagram
              </CardTitle>
              <CardDescription>How a request flows through the system</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {resolvedFlowSteps.length === 0 && (
                  <div className="text-sm text-gray-400 mb-4">
                    No flow steps generated yet. Generate a Development Plan to render a system flow tailored to this
                    project.
                  </div>
                )}
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
                <div className="mt-6 p-4 bg-[var(--brand-850)] rounded-xl border border-[var(--brand-700)]">
                  <h4 className="font-medium text-gray-200 mb-3">Flow Details</h4>
                  {resolvedRequestPath.length === 0 && resolvedResponsePath.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Request and response paths will appear here once you generate a Development Plan for this project.
                    </p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-300 mb-2">Request Path</h5>
                        {resolvedRequestPath.length > 0 ? (
                          <ol className="space-y-1 text-gray-400">
                            {resolvedRequestPath.map((step, idx) => (
                              <li key={idx}>
                                {idx + 1}. {step}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-xs text-gray-500">No request path generated yet.</p>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-300 mb-2">Response Path</h5>
                        {resolvedResponsePath.length > 0 ? (
                          <ol className="space-y-1 text-gray-400">
                            {resolvedResponsePath.map((step, idx) => (
                              <li key={idx}>
                                {resolvedRequestPath.length + idx + 1}. {step}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-xs text-gray-500">No response path generated yet.</p>
                        )}
                      </div>
                    </div>
                  )}
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
            <CardContent className="pt-0 text-xs text-gray-400 space-y-2">
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
          <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)] flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <FolderTree className="h-5 w-5 text-purple-400" />
                Project Folder Structure
              </CardTitle>
              <CardDescription className="text-gray-400">Recommended directory organization</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {resolvedFolderStructure ? (
              <pre className="p-6 bg-gray-900 text-gray-100 text-sm font-mono overflow-x-auto">
                {resolvedFolderStructure}
              </pre>
            ) : (
              <div className="p-6 text-sm text-gray-400">
                No folder structure has been generated for this project yet. Generate a Development Plan to see a tree
                tailored to your chosen stack.
              </div>
            )}
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
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-orange-400" />
            Performance & Scalability Notes
          </CardTitle>
          <Button variant="outline" size="sm" onClick={editingNotes ? saveNotes : startEditingNotes}>
            {editingNotes ? 'Save Notes' : 'Edit Notes'}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400" />
                Best Practices
              </h4>
              {editingNotes ? (
                <textarea
                  className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm bg-[#152238] text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  rows={6}
                  value={notesDraft.bestPractices}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, bestPractices: e.target.value }))}
                />
              ) : resolvedBestPractices.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-400">
                  {resolvedBestPractices.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">
                  Generate a Development Plan to populate stack-specific best practices, or click Edit Notes to add your own.
                </p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                Watch Out For
              </h4>
              {editingNotes ? (
                <textarea
                  className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm bg-[#152238] text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  rows={6}
                  value={notesDraft.watchOuts}
                  onChange={(e) => setNotesDraft((prev) => ({ ...prev, watchOuts: e.target.value }))}
                />
              ) : resolvedWatchOuts.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-400">
                  {resolvedWatchOuts.map((note, idx) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">
                  Generate a Development Plan to populate stack-specific pitfalls, or click Edit Notes to add your own.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            Development Phase Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-700/40 text-center">
              <div className="text-2xl font-bold text-blue-300">
                {Object.values(techStackData).flat().length}
              </div>
              <div className="text-sm text-blue-400">Technologies</div>
            </div>
            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-700/40 text-center">
              <div className="text-2xl font-bold text-blue-300">4</div>
              <div className="text-sm text-blue-400">Layers</div>
            </div>
            <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-700/40 text-center">
              <div className="text-2xl font-bold text-purple-300">
                {componentBreakdown.reduce((a, c) => a + c.items.length, 0)}
              </div>
              <div className="text-sm text-purple-400">Components</div>
            </div>
            <div className="p-4 bg-orange-900/20 rounded-xl border border-orange-700/40 text-center">
              <div className="text-2xl font-bold text-orange-300">{resolvedFlowSteps.length}</div>
              <div className="text-sm text-orange-400">Flow Steps</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevelopmentPhase;
