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
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [chatInput, setChatInput] = useState('');
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
      // Map remaining design diagrams onto use_case for now
      case 'erd':
      case 'state':
      case 'activity':
      default:
        return 'use_case';
    }
  };

  const renderDiagram = async (code: string) => {
    setIsRendering(true);
    setRenderError(null);
    try {
      // Use proper PlantUML encoding
      const url = getPlantUMLUrl(code, 'svg');
      setDiagramUrl(url);
    } catch (error) {
      console.error('Failed to render diagram:', error);
      setRenderError('Failed to encode diagram. Please check the PlantUML syntax.');
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
    setChatInput('');
    setIsUmlGenerating(true);
    setRenderError(null);
    try {
      const artifact = await api.chatUmlDiagram(projectId, umlType, message);
      const plantuml = (artifact.content_json as any)?.plantuml || '';
      if (plantuml) {
        setDiagramCodes((prev) => ({ ...prev, [selectedDiagram]: plantuml }));
        await renderDiagram(plantuml);
      }
    } catch (error) {
      console.error('Failed to apply chat update to UML diagram:', error);
      setRenderError('AI could not apply that change. Please try again.');
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
      {/* AI ASSISTANT - FIRST AND MOST IMPORTANT */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <Bot className="h-6 w-6 text-amber-600" />
            </div>
            AI Design Assistant
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            Describe what diagram you need, and AI will generate it for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Chat Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="e.g., Create a use case diagram showing user interactions..."
              className="flex-1 px-4 py-3 text-base border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#152238]"
            />
            <Button
              onClick={handleChatSubmit}
              disabled={isUmlGenerating || !chatInput.trim()}
              className="px-6 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isUmlGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>

          {isUmlGenerating && (
            <div className="flex items-center justify-center gap-3 py-4 bg-[#152238] rounded-xl border border-amber-100">
              <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
              <span className="text-amber-700 font-medium">AI is generating your diagram...</span>
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
                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                : 'bg-[#152238] text-slate-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200'
            }`}
          >
            {getIcon(type)}
            {DIAGRAM_INFO[type].name}
          </button>
        ))}
      </div>

      {/* LARGE DIAGRAM PREVIEW */}
      <Card className="overflow-hidden border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-5 bg-slate-50 border-b">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg text-slate-800">{currentInfo.name} Diagram</CardTitle>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600">{currentInfo.description}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-[#152238] rounded-lg border border-slate-200 px-2 py-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                <ZoomOut className="h-4 w-4 text-slate-600" />
              </Button>
              <span className="text-xs font-medium w-12 text-center text-slate-700">{zoom}%</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setZoom(100)} className="border-slate-200 text-slate-600 hover:bg-slate-100">
              <Maximize2 className="h-4 w-4 mr-1" />
              Fit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="border-slate-200 text-slate-600 hover:bg-slate-100">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Diagram Display - LARGE */}
          <div 
            className="bg-[#152238] overflow-auto flex items-center justify-center"
            style={{ minHeight: '600px', maxHeight: '80vh' }}
          >
            {isRendering ? (
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                <p className="text-slate-600">Rendering diagram...</p>
              </div>
            ) : renderError ? (
              <div className="flex flex-col items-center gap-4 text-red-500 p-8">
                <AlertTriangle className="h-16 w-16" />
                <p className="text-lg font-medium">Diagram Rendering Error</p>
                <p className="text-sm text-slate-600 text-center max-w-md">{renderError}</p>
                <div className="flex gap-3 mt-2">
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={() => setShowCode(true)} variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    View Code
                  </Button>
                </div>
              </div>
            ) : diagramUrl ? (
              <img
                src={diagramUrl}
                alt={`${currentInfo.name} Diagram`}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                className="transition-transform duration-200"
                onError={() => setRenderError('Failed to load diagram from PlantUML server.')}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <Layers className="h-20 w-20" />
                <p className="text-lg">Select a diagram type to preview</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* COLLAPSIBLE CODE SECTION */}
      <Card className="border-slate-200">
        <button
          onClick={() => setShowCode(!showCode)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-slate-500" />
            <span className="font-medium text-slate-700">PlantUML Code</span>
            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Advanced</Badge>
          </div>
          {showCode ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </button>
        {showCode && (
          <CardContent className="border-t border-slate-100 pt-4">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
            <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-auto max-h-64 text-sm font-mono leading-relaxed">
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
          className="border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
        >
          <Layers className="h-4 w-4 mr-2" />
          Open Diagram Studio
        </Button>
      </div>
    </div>
  );
};

export default DesignPhase;
