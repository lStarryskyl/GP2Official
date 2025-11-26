import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { Project, Requirement, Task, Artifact } from '@/types';
import {
  ArrowLeft,
  Loader2,
  Send,
  Save,
  Type,
  List,
  AlignLeft,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type DraftSection = 'overview' | 'requirements' | 'srs' | 'tasks' | 'risks' | 'costs';

const sectionConfig: Record<
  DraftSection,
  {
    title: string;
    description: string;
    phase?: string;
  }
> = {
  overview: {
    title: 'Project Brief Draft',
    description: 'Capture high-level goals, constraints, and success criteria.',
    phase: 'planning',
  },
  requirements: {
    title: 'Requirements Draft',
    description: 'Refine and expand requirement statements.',
    phase: 'requirements_gathering',
  },
  srs: {
    title: 'SRS Draft',
    description: 'Work on Software Requirements Specification content.',
    phase: 'design_architecture',
  },
  tasks: {
    title: 'Task Plan Draft',
    description: 'Break down work and dependencies.',
    phase: 'tasks',
  },
  risks: {
    title: 'Risk & Validation Draft',
    description: 'Track risks, mitigations, and validation notes.',
    phase: 'requirements_validation',
  },
  costs: {
    title: 'Cost & Benefit Draft',
    description: 'Estimate benefits, costs, and ROI assumptions.',
    phase: 'cost_benefit',
  },
};

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

export const AcornDraftPage: React.FC = () => {
  const { id, section } = useParams<{ id: string; section: DraftSection }>();
  const navigate = useNavigate();
  const sectionKey = (section || 'overview') as DraftSection;
  const config = sectionConfig[sectionKey];
  const [project, setProject] = useState<Project | null>(null);
  const [docContent, setDocContent] = useState('');
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [proj, reqs, tsk, arts] = await Promise.all([
          api.getProject(id),
          api.getRequirements(id),
          api.getTasks(id),
          api.getArtifacts(id),
        ]);
        setProject(proj);
        const storage = `acorn_draft_${proj.project_id || proj.id}_${sectionKey}`;
        setStorageKey(storage);
        const baseDoc = buildInitialDoc(sectionKey, proj, reqs, tsk, arts);
        const storedDoc = localStorage.getItem(storage);
        const nextDoc = storedDoc ?? baseDoc;
        setDocContent(nextDoc);
        if (!storedDoc) {
          localStorage.setItem(storage, nextDoc);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load draft data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, sectionKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, docContent);
  }, [docContent, storageKey]);

  const phaseId = config?.phase;

  const buildPreview = useMemo(() => {
    return docContent.trim() ? docContent : `Start drafting ${config.title} for ${project?.name || ''}.`;
  }, [docContent, config.title, project?.name]);

  const insertAtCursor = (snippet: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) {
      setDocContent((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      return;
    }
    const start = textarea.selectionStart ?? docContent.length;
    const end = textarea.selectionEnd ?? docContent.length;
    const before = docContent.slice(0, start);
    const after = docContent.slice(end);
    const next = `${before}${snippet}${after}`;
    setDocContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + snippet.length;
      textarea.selectionStart = caret;
      textarea.selectionEnd = caret;
    });
  };

  const toolActions = [
    {
      label: 'Heading',
      icon: Type,
      action: () => insertAtCursor('\n\n## New Heading\n'),
    },
    {
      label: 'Bullet List',
      icon: List,
      action: () => insertAtCursor('\n- Item 1\n- Item 2\n'),
    },
    {
      label: 'Paragraph',
      icon: AlignLeft,
      action: () => insertAtCursor('\n\nWrite a detailed paragraph here.\n'),
    },
  ];

  const handleDownloadDoc = () => {
    const blob = new Blob([docContent || buildPreview], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name || 'acorn'}-${sectionKey}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !id) return;
    const message = chatInput.trim();
    setChatInput('');
    const newMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: message };
    setChatMessages((prev) => [...prev, newMessage]);
    if (!phaseId) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'AI drafting is not configured for this section yet.',
        },
      ]);
      return;
    }
    setChatLoading(true);
    try {
      const response = await api.generatePhase(id, phaseId, message);
      const markdown = response.content?.content?.markdown || 'AI did not return content.';
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: markdown,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setDocContent((prev) => (prev.trim() ? `${prev}\n\n${markdown}` : markdown));
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: err.response?.data?.detail || 'Failed to ask Acorn Draft AI.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveLocal = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, docContent);
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 600);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div>
            <p className="text-xs uppercase text-gray-500">Acorn Draft</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {config.title} · {project.name}
            </h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}

        <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_350px]">
          <aside className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-800 tracking-wide uppercase">
                  Draft Tools
                </CardTitle>
              </CardHeader>
            </Card>
            <div className="space-y-2">
              {toolActions.map((tool) => (
                <Button
                  key={tool.label}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={tool.action}
                >
                  <tool.icon className="h-4 w-4 text-gray-500" />
                  {tool.label}
                </Button>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3 text-xs text-gray-500">
              Draft view updates local content only. Use the AI chat to insert fresh ideas or structure.
            </div>
          </aside>

          <Card className="min-h-[600px] flex flex-col">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                ref={textAreaRef}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={`Start drafting ${config.title.toLowerCase()} here...`}
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-gray-500">
                  Last edited just now · {docContent.length} characters
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownloadDoc}>
                    Download Markdown
                  </Button>
                  <Button onClick={handleSaveLocal} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save draft
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-auto">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{buildPreview}</ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Acorn Draft AI
              </CardTitle>
              <CardDescription>Chat with the AI to insert or refine content.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Start the conversation by asking what you need from this draft.
                  </p>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-50 text-blue-800 ml-auto max-w-[90%]'
                        : 'bg-gray-100 text-gray-800 mr-auto max-w-[90%]'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                      {msg.role === 'user' ? 'You' : 'Acorn Draft'}
                    </div>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
                  placeholder="Ask Acorn Draft to add content..."
                />
                <Button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-full mt-2"
                >
                  {chatLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

function buildInitialDoc(
  section: DraftSection,
  project: Project | null,
  requirements: Requirement[],
  tasks: Task[],
  artifacts: Artifact[]
): string {
  if (!project) return '';
  switch (section) {
    case 'requirements':
      if (!requirements.length) {
        return `# Requirements Draft\n\nStart documenting requirements for ${project.name}.`;
      }
      return [
        `# Requirements for ${project.name}`,
        '',
        ...requirements.map(
          (req, index) =>
            `${index + 1}. **${req.title}** (${req.type})\n   - ${req.description || 'Details TBD'}`
        ),
      ].join('\n');
    case 'srs': {
      const srsArtifact = artifacts.find((a) => a.type === 'SRS');
      if (srsArtifact?.content_json) {
        return JSON.stringify(srsArtifact.content_json, null, 2);
      }
      return `# SRS Draft\n\nIntroduce the system purpose, scope, and references for ${project.name}.`;
    }
    case 'tasks':
      if (!tasks.length) {
        return `# Task Plan Draft\n\nList epics, tasks, and owners here.`;
      }
      return [
        `# Task Plan for ${project.name}`,
        '',
        ...tasks.map(
          (task, index) =>
            `${index + 1}. ${task.title} (${task.status}) – ${task.estimate_hours}h\n   - ${task.description || ''}`
        ),
      ].join('\n');
    case 'risks':
      return `# Risk & Validation Draft\n\nCapture potential risks, mitigations, and validation plans for ${project.name}.`;
    case 'costs':
      return `# Cost & Benefit Draft\n\nOutline the benefits, cost assumptions, and ROI for ${project.name}.`;
    case 'overview':
    default:
      return `# ${project.name} Overview\n\n${project.description || 'Add project description here.'}\n\nBrief: ${
        project.brief_text || 'Add context...'
      }`;
  }
}

export default AcornDraftPage;
