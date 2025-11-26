import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { Artifact, Project } from '@/types';
import { ArrowLeft, Loader2, MessageSquare, RefreshCcw, Save, Sparkles } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const umlTypes = [
  { id: 'use_case', label: 'Use Case Diagram' },
  { id: 'class_diagram', label: 'Class Diagram' },
  { id: 'sequence', label: 'Sequence Diagram' },
];

const normalizeType = (type?: string) => {
  const normalized = (type || '').toLowerCase();
  const found = umlTypes.find((t) => t.id === normalized);
  return found?.id || 'use_case';
};

export const UmlDiagramEditorPage: React.FC = () => {
  const { id: projectIdParam, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const umlType = useMemo(() => normalizeType(type), [type]);

  const [project, setProject] = useState<Project | null>(null);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [plantuml, setPlantuml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'You are editing the generated UML. Ask me to add, remove, rename, or connect elements and I will update the PlantUML.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const projectId = projectIdParam!;

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [proj, diag] = await Promise.all([
          api.getProject(projectId),
          api.getUmlDiagram(projectId, umlType),
        ]);
        setProject(proj);
        setArtifact(diag);
        const source = diag.content_json?.plantuml || '';
        setPlantuml(source);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load diagram');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, umlType]);

  const currentTypeInfo = umlTypes.find((t) => t.id === umlType)!;
  const diagramLabel = currentTypeInfo.label;
  const previewUrl = artifact?.metadata?.plantuml_svg_url;

  const handleSave = async () => {
    if (!projectId || !plantuml.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.saveUmlDiagram(projectId, umlType, plantuml);
      setArtifact(updated);
      setPlantuml(updated.content_json?.plantuml || plantuml);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save diagram');
    } finally {
      setSaving(false);
    }
  };

  const handleChatSend = async () => {
    if (!projectId || !chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput('');
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    setError(null);
    try {
      const updated = await api.chatUmlDiagram(projectId, umlType, content);
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: 'Diagram updated. Review the changes in the PlantUML source and preview.',
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setArtifact(updated);
      setPlantuml(updated.content_json?.plantuml || plantuml);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AI edit failed');
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetToGenerated = () => {
    if (artifact?.content_json?.plantuml) {
      setPlantuml(artifact.content_json.plantuml);
      setError(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Editing</p>
            <p className="text-sm font-semibold text-gray-900">
              {diagramLabel} · {project?.name || 'Project'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_320px]">
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>PlantUML Source</CardTitle>
                <p className="text-xs text-gray-500">
                  Edit the generated code directly. Save to keep changes with the project.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetToGenerated} disabled={!artifact}>
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !plantuml.trim()}>
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <textarea
                className="w-full h-[640px] border border-gray-200 rounded-md px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={plantuml}
                onChange={(e) => setPlantuml(e.target.value)}
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Diagram Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="border border-gray-200 rounded-lg bg-white flex-1 flex items-center justify-center overflow-auto min-h-[640px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`${diagramLabel} preview`}
                    className="max-w-full max-h-full object-contain bg-white"
                  />
                ) : plantuml ? (
                  <pre className="p-4 text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {plantuml}
                  </pre>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No preview available. Add valid PlantUML and save to generate a diagram.
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="mt-2 text-xs text-gray-500">
                  Rendered via public PlantUML server. If the image looks stale, click Save to regenerate.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Diagram Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
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
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                ))}
              </div>
              <div>
                <textarea
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[90px] resize-none"
                  placeholder="e.g. Add a Payment Service between API and Database and connect the relationships"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-full mt-2"
                >
                  {chatLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying changes...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Instruction
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

export default UmlDiagramEditorPage;
