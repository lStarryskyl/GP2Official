import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Loader2,
  Code,
  Server,
  Database,
  Globe,
  Shield,
  Zap,
  Box,
  GitBranch,
  Layers,
  Terminal,
  FolderTree,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
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
}

export const DevelopmentPhase: React.FC<DevelopmentPhaseProps> = ({
  projectId,
  onGenerate,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'flow' | 'structure' | 'components'>('stack');
  const [expandedCategory, setExpandedCategory] = useState<Set<string>>(new Set(['frontend', 'backend']));

  const initialTechStack: TechStackMap = {
    frontend: [
      { name: 'React', category: 'Framework', description: 'Component-based UI library', icon: '⚛️', recommended: true },
      { name: 'TypeScript', category: 'Language', description: 'Type-safe JavaScript', icon: '📘', recommended: true },
      { name: 'TailwindCSS', category: 'Styling', description: 'Utility-first CSS framework', icon: '🎨', recommended: true },
      { name: 'Vite', category: 'Build Tool', description: 'Next-gen frontend tooling', icon: '⚡', recommended: true },
      { name: 'React Router', category: 'Routing', description: 'Declarative routing', icon: '🛤️', recommended: true },
    ],
    backend: [
      { name: 'Django', category: 'Framework', description: 'Python web framework', icon: '🐍', recommended: true },
      { name: 'Django REST Framework', category: 'API', description: 'REST API toolkit', icon: '🔌', recommended: true },
      { name: 'Celery', category: 'Task Queue', description: 'Distributed task queue', icon: '🥬', recommended: true },
      { name: 'Redis', category: 'Cache', description: 'In-memory data store', icon: '⚡', recommended: true },
    ],
    database: [
      { name: 'PostgreSQL', category: 'Primary DB', description: 'Relational database', icon: '🐘', recommended: true },
      { name: 'Redis', category: 'Cache', description: 'Caching layer', icon: '🔴', recommended: true },
    ],
    infrastructure: [
      { name: 'Docker', category: 'Containerization', description: 'Container platform', icon: '🐳', recommended: true },
      { name: 'AWS / GCP', category: 'Cloud', description: 'Cloud infrastructure', icon: '☁️', recommended: true },
      { name: 'Nginx', category: 'Web Server', description: 'Reverse proxy', icon: '🌐', recommended: true },
      { name: 'GitHub Actions', category: 'CI/CD', description: 'Automation pipeline', icon: '🔄', recommended: true },
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
  const [newTech, setNewTech] = useState<TechStackItem>({
    name: '',
    category: Object.keys(initialTechStack)[0] || 'frontend',
    description: '',
    icon: '✨',
    recommended: false,
  });
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

  const toggleCategory = (category: string) => {
    setExpandedCategory((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleAddTech = () => {
    if (!newTech.name.trim() || !newTech.description.trim()) return;
    setTechStackData((prev) => {
      const next: TechStackMap = {
        ...prev,
        [newTech.category]: [newTech, ...(prev[newTech.category] || [])],
      };
      persistDevelopment(next, bestPractices, watchOuts);
      return next;
    });
    setNewTech((prev) => ({ ...prev, name: '', description: '' }));
    setExpandedCategory((prev) => new Set(prev).add(newTech.category));
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

  const resolvedComponents = React.useMemo(() => {
    if (componentsAi && componentsAi.length) {
      return [
        {
          layer: 'Components',
          description: 'AI-generated component breakdown based on the development phase.',
          items: componentsAi,
          color: 'purple' as const,
        },
      ];
    }
    return componentBreakdown;
  }, [componentsAi]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'stack', label: 'Tech Stack', icon: Layers },
          { id: 'flow', label: 'System Flow', icon: GitBranch },
          { id: 'structure', label: 'Folder Structure', icon: FolderTree },
          { id: 'components', label: 'Components', icon: Box },
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
          {Object.entries(techStackData).map(([category, items]) => {
            const isExpanded = expandedCategory.has(category);
            const categoryIcons: Record<string, React.ReactNode> = {
              frontend: <Globe className="h-5 w-5" />,
              backend: <Server className="h-5 w-5" />,
              database: <Database className="h-5 w-5" />,
              infrastructure: <Box className="h-5 w-5" />,
            };

            return (
              <Card key={category}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCategory(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCategory(category);
                    }
                  }}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      {categoryIcons[category]}
                    </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Add Custom Technology</CardTitle>
            <CardDescription>Capture bespoke stack choices for this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Technology name"
                value={newTech.name}
                onChange={(e) => setNewTech((prev) => ({ ...prev, name: e.target.value }))}
              />
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={newTech.category}
                onChange={(e) => setNewTech((prev) => ({ ...prev, category: e.target.value }))}
              >
                {Object.keys(techStackData).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Emoji/Icon"
                value={newTech.icon}
                onChange={(e) => setNewTech((prev) => ({ ...prev, icon: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={newTech.recommended}
                  onChange={(e) => setNewTech((prev) => ({ ...prev, recommended: e.target.checked }))}
                />
                Recommended
              </label>
            </div>
            <textarea
              className="border rounded-lg px-3 py-2 text-sm w-full"
              rows={3}
              placeholder="Why is this technology needed?"
              value={newTech.description}
              onChange={(e) => setNewTech((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Button onClick={handleAddTech} disabled={!newTech.name.trim() || !newTech.description.trim()}>
              Add to Stack
            </Button>
          </CardContent>
        </Card>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                      <p className="text-sm text-gray-500">{items.length} technologies</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item, idx) => (
                        <div
                          key={item.name}
                          className="p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-emerald-600"
                              onClick={() => handleToggleRecommended(category, idx)}
                            >
                              {item.recommended ? 'Recommended ✓' : 'Mark Recommended'}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">{item.description}</p>
                          <Badge variant="secondary" className="mt-2 text-xs">{item.category}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-red-500 mt-1"
                            onClick={() => handleDeleteTech(category, idx)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* System Flow Tab */}
      {activeTab === 'flow' && (
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

      {/* Components Tab */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          {resolvedComponents.map((layer) => {
            const colors = colorMap[layer.color];
            return (
              <Card key={layer.layer} className={`border-l-4 ${colors.border}`}>
                <CardHeader className={colors.bg}>
                  <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
                    <Box className="h-5 w-5" />
                    {layer.layer}
                  </CardTitle>
                  <CardDescription>{layer.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {layer.items.map((item) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} font-mono text-sm`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Generate Section */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI Development Assistant
          </CardTitle>
          <CardDescription>Generate code templates, architecture recommendations, and more</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => onGenerate('Generate optimized tech stack recommendation')} disabled={isGenerating}>
              <Layers className="mr-2 h-4 w-4" /> Tech Stack
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate API endpoint code templates')}>
              <Code className="mr-2 h-4 w-4" /> API Code
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate database schema migrations')}>
              <Database className="mr-2 h-4 w-4" /> Migrations
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate Docker deployment configuration')}>
              <Terminal className="mr-2 h-4 w-4" /> Docker
            </Button>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 text-emerald-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
        </CardContent>
      </Card>

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
