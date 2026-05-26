import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Loader2,
  Database,
  GitBranch,
  Layers,
  Box,
  ArrowRight,
  Code,
  Download,
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getPlantUMLUrl, DIAGRAM_TEMPLATES, DiagramType } from '@/lib/plantuml';

// Extended template info for UI display
const DIAGRAM_INFO: Record<DiagramType, { name: string; description: string }> = {
  use_case: { name: 'Use Case', description: 'Actors and goals' },
  erd: { name: 'ERD', description: 'Database schema' },
  class: { name: 'Class', description: 'OOP structure' },
  sequence: { name: 'Sequence', description: 'Interactions' },
  state: { name: 'State', description: 'Transitions' },
  activity: { name: 'Activity', description: 'Workflow' },
};

interface DesignPhaseProps {
  projectId: string;
  onOpenCanvas: () => void;
}

export const DesignPhase: React.FC<DesignPhaseProps> = ({
  projectId,
  onOpenCanvas,
}) => {
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramType>('use_case');
  const [diagramUrl, setDiagramUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSuccess, setChatSuccess] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isUmlGenerating, setIsUmlGenerating] = useState(false);
  const [diagramCodes, setDiagramCodes] = useState<Record<DiagramType, string>>(() => {
    const initial: Partial<Record<DiagramType, string>> = {};
    (Object.keys(DIAGRAM_TEMPLATES) as DiagramType[]).forEach((key) => {
      initial[key] = DIAGRAM_TEMPLATES[key];
    });
    return initial as Record<DiagramType, string>;
  });

  // Get current template code and info
  const currentCode = diagramCodes[selectedDiagram] || DIAGRAM_TEMPLATES[selectedDiagram];
  const currentInfo = DIAGRAM_INFO[selectedDiagram];

  const mapDiagramToUmlType = (type: DiagramType): string => {
    switch (type) {
      case 'use_case':
        return 'use_case';
      case 'class':
        return 'class_diagram';
      case 'sequence':
        return 'sequence';
      case 'erd':
        return 'erd';
      case 'state':
        return 'state_machine';
      case 'activity':
        return 'activity';
      default:
        return 'use_case';
    }
  };

  const renderDiagram = async (code: string) => {
    setIsRendering(true);
    setRenderError(null);
    setImgLoading(true);
    try {
      const url = getPlantUMLUrl(code, 'svg');
      setDiagramUrl(url);
    } catch (error) {
      console.error('Failed to encode diagram:', error);
      setRenderError('Failed to encode diagram. Check the PlantUML syntax in the code panel below.');
      setImgLoading(false);
    } finally {
      setIsRendering(false);
    }
  };

  // Load existing UML for the selected diagram type and render it
  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      const umlType = mapDiagramToUmlType(selectedDiagram);
      try {
        const artifact = await api.getUmlDiagram(projectId, umlType);
        const plantuml = (artifact.content_json as any)?.plantuml;
        if (plantuml && typeof plantuml === 'string') {
          setDiagramCodes((prev) => ({ ...prev, [selectedDiagram]: plantuml }));
          await renderDiagram(plantuml);
          return;
        }
      } catch {
        // If no UML exists yet, fall back to local template
      }
      const fallback = diagramCodes[selectedDiagram] || DIAGRAM_TEMPLATES[selectedDiagram];
      await renderDiagram(fallback);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, selectedDiagram]);

  const handleRetry = () => {
    renderDiagram(currentCode);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
  };

  const handleChatSubmit = async () => {
    if (!projectId || !chatInput.trim()) return;
    const umlType = mapDiagramToUmlType(selectedDiagram);
    const message = `Update the existing PlantUML ${selectedDiagram} diagram based on this request: "${chatInput.trim()}"`;
    const savedInput = chatInput.trim();
    setChatInput('');
    setChatError(null);
    setChatSuccess(false);
    setIsUmlGenerating(true);
    try {
      const artifact = await api.chatUmlDiagram(projectId, umlType, message);
      const plantuml = (artifact.content_json as any)?.plantuml || '';
      if (plantuml) {
        setDiagramCodes((prev) => ({ ...prev, [selectedDiagram]: plantuml }));
        await renderDiagram(plantuml);
        setChatSuccess(true);
        setTimeout(() => setChatSuccess(false), 3000);
      } else {
        setChatError('AI returned an empty response. Try rephrasing your request.');
      }
    } catch (error: any) {
      console.error('Failed to apply chat update to UML diagram:', error);
      const status = error?.response?.status;
      if (status === 400) {
        setChatError(`Diagram type not supported for AI editing. Try Use Case, ERD, Class, or Sequence.`);
      } else if (status === 401 || status === 403) {
        setChatError('Authentication error. Please refresh and try again.');
      } else {
        setChatError(`AI edit failed — try again or rephrase: "${savedInput}"`);
      }
    } finally {
      setIsUmlGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDiagram}-diagram.puml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const diagramTypes = Object.keys(DIAGRAM_TEMPLATES) as DiagramType[];

  const getIcon = (type: DiagramType) => {
    const icons: Record<DiagramType, React.ReactNode> = {
      use_case: <Layers className="h-5 w-5" />,
      erd: <Database className="h-5 w-5" />,
      class: <Box className="h-5 w-5" />,
      sequence: <ArrowRight className="h-5 w-5" />,
      state: <GitBranch className="h-5 w-5" />,
      activity: <Code className="h-5 w-5" />,
    };
    return icons[type];
  };

  return (
    <div className="space-y-6">
      {/* AI ASSISTANT */}
      <Card className="border-blue-700/40 bg-blue-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-white">
            <div className="p-2.5 bg-blue-900/40 rounded-xl">
              <Bot className="h-6 w-6 text-blue-400" />
            </div>
            AI Design Assistant
          </CardTitle>
          <CardDescription className="text-base text-gray-400">
            Describe what diagram you need, and AI will generate it for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Chat Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => { setChatInput(e.target.value); setChatError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="e.g., Add a payment gateway to the class diagram..."
              className="flex-1 px-4 py-3 text-base border border-[var(--brand-700)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-[#152238] text-white placeholder-gray-500"
            />
            <Button
              onClick={handleChatSubmit}
              disabled={isUmlGenerating || !chatInput.trim()}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUmlGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>

          {isUmlGenerating && (
            <div className="flex items-center gap-3 py-3 px-4 bg-blue-900/20 rounded-xl border border-blue-700/40">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400 flex-shrink-0" />
              <span className="text-blue-300 text-sm">AI is updating your diagram…</span>
            </div>
          )}
          {chatSuccess && (
            <div className="flex items-center gap-3 py-3 px-4 bg-green-900/20 rounded-xl border border-green-700/40">
              <span className="text-green-400 text-sm font-medium">✓ Diagram updated successfully</span>
            </div>
          )}
          {chatError && (
            <div className="flex items-start gap-3 py-3 px-4 bg-red-900/20 rounded-xl border border-red-700/40">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-red-300 text-sm">{chatError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIAGRAM TYPE SELECTOR */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {diagramTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedDiagram(type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              selectedDiagram === type
                ? 'bg-blue-600/20 text-blue-300 ring-2 ring-blue-500/50'
                : 'bg-[#152238] text-gray-400 hover:bg-blue-900/20 border border-[var(--brand-700)] hover:border-blue-700/60'
            }`}
          >
            {getIcon(type)}
            {DIAGRAM_INFO[type].name}
          </button>
        ))}
      </div>

      {/* LARGE DIAGRAM PREVIEW */}
      <Card className="overflow-hidden border-[var(--brand-700)]">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5 bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg text-white">{currentInfo.name} Diagram</CardTitle>
            <Badge variant="secondary" className="bg-[var(--brand-700)] text-gray-300">{currentInfo.description}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-[#152238] rounded-lg border border-[var(--brand-700)] px-2 py-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[var(--brand-700)]" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                <ZoomOut className="h-4 w-4 text-gray-400" />
              </Button>
              <span className="text-xs font-medium w-12 text-center text-gray-300">{zoom}%</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[var(--brand-700)]" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setZoom(100)} className="border-[var(--brand-700)] text-gray-300 hover:bg-[var(--brand-700)]">
              <Maximize2 className="h-4 w-4 mr-1" />
              Fit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="border-[var(--brand-700)] text-gray-300 hover:bg-[var(--brand-700)]">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Diagram Display - LARGE */}
          <div
            className="bg-[#152238] overflow-auto flex items-center justify-center relative"
            style={{ minHeight: '600px', maxHeight: '80vh' }}
          >
            {(isRendering || imgLoading) && !renderError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#152238] z-10">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                <p className="text-gray-400 text-sm">
                  {isRendering ? 'Encoding diagram…' : 'Fetching diagram from PlantUML server…'}
                </p>
              </div>
            )}
            {renderError ? (
              <div className="flex flex-col items-center gap-4 text-red-400 p-8">
                <AlertTriangle className="h-14 w-14" />
                <p className="text-lg font-medium">Diagram Error</p>
                <p className="text-sm text-gray-400 text-center max-w-md">{renderError}</p>
                <div className="flex gap-3 mt-2">
                  <Button onClick={handleRetry} variant="outline" size="sm" className="border-[var(--brand-700)] text-gray-300">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={() => setShowCode(true)} variant="outline" size="sm" className="border-[var(--brand-700)] text-gray-300">
                    <Code className="h-4 w-4 mr-2" />
                    View Code
                  </Button>
                </div>
              </div>
            ) : diagramUrl ? (
              <img
                src={diagramUrl}
                alt={`${currentInfo.name} Diagram`}
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  opacity: imgLoading ? 0 : 1,
                  transition: 'opacity 0.3s ease, transform 0.2s ease',
                }}
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgLoading(false);
                  setRenderError(
                    'PlantUML server could not render this diagram. ' +
                    'Check for syntax errors in the code panel, or click Retry.'
                  );
                }}
              />
            ) : !isRendering && !imgLoading ? (
              <div className="flex flex-col items-center gap-4 text-gray-500">
                <Layers className="h-20 w-20" />
                <p className="text-lg">Select a diagram type to preview</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* COLLAPSIBLE CODE SECTION */}
      <Card className="border-[var(--brand-700)]">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--brand-800)] transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-300">PlantUML Code</span>
            <Badge variant="secondary" className="bg-[var(--brand-700)] text-gray-400">Advanced</Badge>
          </div>
          {showCode ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>
        {showCode && (
          <CardContent className="border-t border-[var(--brand-700)] pt-4">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
            <pre className="bg-[#0a1628] text-blue-200 p-4 rounded-lg overflow-auto max-h-64 text-sm font-mono leading-relaxed border border-[var(--brand-700)]">
              {currentCode}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onOpenCanvas}
          className="border-[var(--brand-700)] text-gray-300 hover:bg-blue-900/20 hover:border-blue-600/50 hover:text-blue-300"
        >
          <Layers className="h-4 w-4 mr-2" />
          Open Diagram Studio
        </Button>
      </div>
    </div>
  );
};

export default DesignPhase;
