import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { Project, UxFlowArtifact } from '@/types';
import { ArrowLeft, Loader2, Sparkles, Share2 } from 'lucide-react';

export const UxFlowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [uxFlow, setUxFlow] = useState<UxFlowArtifact | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingDiagram, setSyncingDiagram] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const proj = await api.getProject(id);
        setProject(proj);
      } catch {
        setProject(null);
      }

      try {
        const doc = await api.getUxFlow(id);
        setUxFlow(doc);
      } catch {
        // Not generated yet
        setUxFlow(null);
      } finally {
        setLoadingDoc(false);
      }
    };

    load();
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return;
    setIsGenerating(true);
    setError(null);
    try {
      const doc = await api.generateUxFlow(id);
      setUxFlow(doc);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate UX flow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncDiagram = async () => {
    if (!id) return;
    setSyncingDiagram(true);
    setError(null);
    try {
      await api.syncUxFlowToDiagram(id);
      navigate(`/projects/${id}/diagram-studio`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sync UX flow into the diagram canvas');
    } finally {
      setSyncingDiagram(false);
    }
  };

  const markdown = uxFlow?.content_json?.markdown || '';

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase text-[var(--text-muted)]">UX Flow</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {project?.name || 'Project'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>AI-Generated UX Flow</CardTitle>
              <p className="text-xs text-[var(--text-muted)]">
                End-to-end user flow, IA, and UX spec based on your project brief and requirements.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={isGenerating} className="shrink-0">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate UX Flow
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSyncDiagram}
                disabled={!markdown || syncingDiagram}
                className="shrink-0"
              >
                {syncingDiagram ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending to Diagram Studio...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Send to Diagram Studio
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                {error}
              </div>
            )}
            {loadingDoc ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : !markdown ? (
              <div className="text-sm text-[var(--text-muted)]">
                No UX flow has been generated for this project yet. Click{" "}
                <span className="font-semibold">Generate UX Flow</span> to create one.
              </div>
              ) : (
                <div className="border border-[var(--brand-700)] rounded-lg bg-[#152238] max-h-[70vh] overflow-auto p-4 prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UxFlowPage;
