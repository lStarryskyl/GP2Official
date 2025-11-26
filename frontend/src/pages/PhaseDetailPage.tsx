import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Artifact, Project } from '@/types';
import { phaseConfigs, getPhaseConfig } from '@/constants/phases';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Download, Loader2, Share2, Sparkles } from 'lucide-react';

export const PhaseDetailPage: React.FC = () => {
  const { id, phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingCanvas, setSyncingCanvas] = useState(false);
  const phaseConfig = getPhaseConfig(phaseId || '');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [proj, arts, status] = await Promise.all([
          api.getProject(id),
          api.getArtifacts(id),
          api.getPhaseStatus(id),
        ]);
        setProject(proj);
        setArtifacts(arts);
        setPhaseStatus(status.phases);
      } catch (err) {
        setError('Failed to load phase info');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const phaseMarkdown = useMemo(() => {
    if (!phaseId) return '';
    const artifact = artifacts.find(
      (art) => art.type === `PHASE_${phaseId.toUpperCase()}`
    );
    return artifact?.content_json?.markdown || '';
  }, [artifacts, phaseId]);

  const handleGenerate = async () => {
    if (!id || !phaseId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.generatePhase(id, phaseId, input);
      setPhaseStatus(response.phase_status);
      const updatedArtifacts = await api.getArtifacts(id);
      setArtifacts(updatedArtifacts);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate phase output');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenCanvas = async () => {
    if (!id || !phaseConfig) return;
    setSyncingCanvas(true);
    setError(null);
    try {
      await api.syncDiagramCanvas(id, phaseConfig.canvasMode);
      const params = phaseConfig.canvasMode === 'freeform' ? '' : `?mode=${phaseConfig.canvasMode}`;
      navigate(`/projects/${id}/diagram-studio${params}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to open canvas');
    } finally {
      setSyncingCanvas(false);
    }
  };

  const handleDownload = () => {
    if (!phaseMarkdown || !phaseConfig || !project) return;
    const blob = new Blob([phaseMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-${phaseConfig.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!project || !phaseConfig) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Phase not found</h2>
          <Button onClick={() => navigate(`/projects/${id}`)}>Back to Project</Button>
        </div>
      </Layout>
    );
  }

  const status = phaseStatus[phaseConfig.id] || 'locked';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Phase</p>
            <p className="text-lg font-semibold text-gray-900">
              {phaseConfig.title} · {project.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{phaseConfig.title}</CardTitle>
                <CardDescription>{phaseConfig.description}</CardDescription>
              </div>
              <Badge>{status.replace('_', ' ')}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]"
                placeholder="Describe what you need from the AI for this phase..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={handleGenerate} disabled={isGenerating || status === 'locked'}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Working...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Chat with AI
                  </>
                )}
              </Button>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Phase document preview</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!phaseMarkdown}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Markdown
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg bg-white p-4 min-h-[300px]">
                {phaseMarkdown ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No document generated yet. Ask the AI to produce the document for this phase.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Canvas</CardTitle>
                <CardDescription>Edit this phase visually.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenCanvas}
                  disabled={syncingCanvas}
                >
                  {syncingCanvas ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening canvas...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Open Diagram Canvas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phase Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {phaseConfigs.map((cfg) => (
                  <div key={cfg.id} className="flex items-center justify-between">
                    <span>{cfg.title}</span>
                    <Badge
                      variant={
                        phaseStatus[cfg.id] === 'completed'
                          ? 'success'
                          : phaseStatus[cfg.id] === 'ready'
                          ? 'default'
                          : phaseStatus[cfg.id] === 'in_progress'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {phaseStatus[cfg.id] || 'locked'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PhaseDetailPage;
