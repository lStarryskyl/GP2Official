import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  NodeProps,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Artifact, DiagramWorkspace, DiagramNode, DiagramEdge, Project } from '@/types';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  PenTool,
  Save,
  Trash2,
  Bot,
  Square,
  Circle,
  Diamond,
  StickyNote,
  Palette,
  Database,
  RefreshCw,
  Download,
  Server,
  Cloud,
  Globe,
} from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ShapeType = 'process' | 'decision' | 'terminator' | 'data' | 'note';
type UmlPreviewType = 'use_case' | 'class_diagram' | 'sequence' | 'entity_relationship';

const sanitizeFileName = (value: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'acorn';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const shapePalette = [
  { id: 'process', label: 'Process', icon: Square, color: '#2563EB' },
  { id: 'decision', label: 'Decision', icon: Diamond, color: '#F97316' },
  { id: 'terminator', label: 'Terminator', icon: Circle, color: '#059669' },
  { id: 'data', label: 'Data', icon: Database, color: '#7C3AED' },
  { id: 'note', label: 'Note', icon: StickyNote, color: '#D97706' },
] as const;

const colorOptions = ['#F97316', '#FDBA74', '#FB7185', '#7DD3FC', '#34D399', '#FACC15'];
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  database: Database,
  cloud: Cloud,
  globe: Globe,
};
type TemplateOption = {
  id: string;
  label: string;
  description: string;
  color: string;
  iconName: keyof typeof iconComponents;
};
const templateOptions: TemplateOption[] = [
  {
    id: 'api_service',
    label: 'API Service',
    description: 'Internal or external API endpoint',
    color: '#0EA5E9',
    iconName: 'server',
  },
  {
    id: 'database_node',
    label: 'Database',
    description: 'Persistent data store',
    color: '#7C3AED',
    iconName: 'database',
  },
  {
    id: 'external_system',
    label: 'External System',
    description: 'Partner or third-party integration',
    color: '#F97316',
    iconName: 'globe',
  },
];
const previewPositions: Record<UmlPreviewType, { x: number; y: number }> = {
  use_case: { x: 80, y: 40 },
  class_diagram: { x: 520, y: 40 },
  sequence: { x: 80, y: 320 },
  entity_relationship: { x: 520, y: 320 },
};

const shapeStyles: Record<ShapeType, React.CSSProperties> = {
  process: {
    width: 180,
    height: 80,
    borderRadius: 12,
  },
  decision: {
    width: 160,
    height: 100,
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  },
  terminator: {
    width: 200,
    height: 70,
    borderRadius: 9999,
  },
  data: {
    width: 180,
    height: 80,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  note: {
    width: 200,
    height: 120,
    borderRadius: 8,
    backgroundImage: 'linear-gradient(135deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.05) 75%, transparent 75%, transparent)',
    backgroundSize: '16px 16px',
  },
};

const ShapeNode: React.FC<NodeProps<any>> = ({ data, selected }) => {
  const shape = (data?.shape as ShapeType) || 'process';
  const baseColor = data?.color || '#2563EB';
  const fill = data?.fill || '#FFFFFF';
  const IconComp = data?.iconName ? iconComponents[data.iconName] : null;
  const style = {
    ...shapeStyles[shape],
    border: `2px solid ${selected ? baseColor : `${baseColor}88`}`,
    background: fill,
    boxShadow: selected ? `0 0 0 4px ${baseColor}22` : '0 5px 10px rgba(15,23,42,0.05)',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 12,
    padding: '0 16px',
  } as React.CSSProperties;

  return (
    <div style={style}>
      {IconComp && <IconComp className="h-4 w-4 text-slate-500 mb-1" />}
      <span style={{ transform: shape === 'decision' ? 'rotate(-0deg)' : undefined, display: 'block' }}>
        {data?.label || 'Node'}
      </span>
    </div>
  );
};

const UmlPreviewNode: React.FC<NodeProps<any>> = ({ data, selected }) => {
  const umlLabel =
    data?.umlType === 'use_case'
      ? 'Use Case Diagram'
      : data?.umlType === 'class_diagram'
      ? 'Class Diagram'
      : data?.umlType === 'entity_relationship'
      ? 'ER Diagram'
      : 'Sequence Diagram';
  return (
    <div
      className={`min-w-[320px] max-w-[420px] bg-white border ${
        selected ? 'border-blue-400 shadow-2xl' : 'border-gray-200 shadow-lg'
      } rounded-xl`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div>
          <p className="text-[10px] uppercase text-gray-500">Pinned UML</p>
          <p className="text-xs font-semibold text-gray-900">{umlLabel}</p>
        </div>
        <span className="text-[10px] uppercase text-gray-400">Drag me</span>
      </div>
      <div className="p-3 bg-gray-50 rounded-b-xl flex items-center justify-center">
        {data?.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={umlLabel}
            className="max-h-[280px] max-w-full object-contain rounded-lg border border-gray-200 bg-white"
            draggable={false}
          />
        ) : (
          <p className="text-xs text-gray-500">Preview unavailable.</p>
        )}
      </div>
    </div>
  );
};

const toReactFlowNodes = (nodes: DiagramNode[]): Node[] =>
  nodes.map((node) => {
    const nodeData = node.data || {};
    const resolvedType = node.type && node.type !== 'default' ? node.type : 'shape';
    return {
      id: node.id,
      type: resolvedType,
      position: node.position || { x: 0, y: 0 },
      data: {
        label: nodeData.label || 'Node',
        description: nodeData.description,
        shape: nodeData.shape,
        color: nodeData.color,
        fill: nodeData.fill,
      },
    };
  });

const toReactFlowEdges = (edges: DiagramEdge[]): Edge[] =>
  edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    label: edge.label,
    data: edge.data,
  }));

const serializeNodes = (nodes: Node[]): DiagramNode[] =>
  nodes
    .filter((node) => node.type !== 'umlPreview')
    .map((node) => {
      const nodeData = node.data as any;
      return {
        id: node.id,
        type: node.type,
        position: node.position,
      data: {
        label: nodeData?.label || 'Node',
        description: nodeData?.description,
        shape: nodeData?.shape,
        color: nodeData?.color,
        fill: nodeData?.fill,
      },
    };
    });

const serializeEdges = (edges: Edge[]): DiagramEdge[] =>
  edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    label: typeof edge.label === 'string' ? edge.label : undefined,
    data: edge.data,
  }));

type DiagramMode = 'freeform' | 'requirements' | 'srs' | 'costs';

export const DiagramWorkspacePage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryMode = useMemo(() => new URLSearchParams(location.search).get('mode'), [location.search]);
  const [mode, _setMode] = useState<DiagramMode>(
    queryMode === 'requirements' || queryMode === 'srs' || queryMode === 'costs' ? (queryMode as DiagramMode) : 'freeform'
  );
  const stageKey = mode === 'freeform' ? 'canvas' : `${mode}_canvas`;
  const updateMode = (nextMode: DiagramMode, pushUrl = true) => {
    _setMode(nextMode);
    if (pushUrl && projectId) {
      const params = new URLSearchParams(location.search);
      if (nextMode === 'freeform') {
        params.delete('mode');
      } else {
        params.set('mode', nextMode);
      }
      const qs = params.toString();
      navigate(`/projects/${projectId}/diagram-studio${qs ? `?${qs}` : ''}`, { replace: true });
    }
  };

  const [project, setProject] = useState<Project | null>(null);
  const [workspace, setWorkspace] = useState<DiagramWorkspace | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [syncingAI, setSyncingAI] = useState(false);
  const [canvasExporting, setCanvasExporting] = useState(false);
  const [umlPreviewData, setUmlPreviewData] = useState<Partial<Record<UmlPreviewType, { imageUrl: string }>>>({});
  const [umlPreviewVisibility, setUmlPreviewVisibility] = useState<Record<UmlPreviewType, boolean>>({
    use_case: true,
    class_diagram: true,
    sequence: true,
    entity_relationship: true,
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [assistantTab, setAssistantTab] = useState<'canvas' | 'uml'>('canvas');

  const [umlType, setUmlType] = useState<UmlPreviewType>('use_case');
  const [umlArtifact, setUmlArtifact] = useState<Artifact | null>(null);
  const [umlSource, setUmlSource] = useState('');
  const [umlLoading, setUmlLoading] = useState(false);
  const [umlSaving, setUmlSaving] = useState(false);
  const [umlChatInput, setUmlChatInput] = useState('');
  const [umlChatLoading, setUmlChatLoading] = useState(false);
  const [umlError, setUmlError] = useState<string | null>(null);
  const [umlSvgDownloading, setUmlSvgDownloading] = useState(false);

  const projectSlug = useMemo(() => sanitizeFileName(project?.name || 'project'), [project?.name]);
  const projectDisplayName = project?.name || 'Project';

  useEffect(() => {
    if (!projectId) return;
    if (queryMode) {
      const normalized = queryMode.toLowerCase();
      if (normalized === 'requirements' || normalized === 'srs' || normalized === 'costs' || normalized === 'freeform') {
        updateMode(normalized as DiagramMode, false);
      }
    }
  }, [projectId, queryMode]);

  useEffect(() => {
    setChatMessages([
      {
        id: `welcome_${mode}`,
        role: 'assistant',
        content:
          mode === 'requirements'
            ? 'Need changes to the requirements map? Ask me to add or connect requirement nodes.'
            : mode === 'srs'
            ? 'Describe how to reorganize SRS sections and I will update the canvas.'
            : mode === 'costs'
            ? 'Ask me to adjust cost buckets or create new ones.'
            : 'Hi! Tell me what to add, remove, or connect and I will adjust the diagram.',
      },
    ]);
  }, [mode]);

  useEffect(() => {
    if (!projectId) return;
    api
      .getProject(projectId)
      .then(setProject)
      .catch(() => setProject(null));
  }, [projectId]);

  const loadWorkspace = useCallback(async () => {
    if (!projectId) return;
    setLoadingWorkspace(true);
    setError(null);
    try {
      const data = await api.getDiagramWorkspace(projectId, stageKey);
      setWorkspace(data);
      setNodes(toReactFlowNodes(data.nodes));
      setEdges(toReactFlowEdges(data.edges));
    } catch (err) {
      setError('Failed to load workspace');
    } finally {
      setLoadingWorkspace(false);
    }
  }, [projectId, stageKey, setEdges, setNodes]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!projectId) return;
    setUmlLoading(true);
    setUmlError(null);
    api
      .getUmlDiagram(projectId, umlType)
      .then((artifact) => {
        setUmlArtifact(artifact);
        const content = (artifact.content_json as any)?.plantuml || (artifact.content_json as any)?.text || '';
        setUmlSource(content);
        const svgUrl = artifact.metadata?.plantuml_svg_url;
        setUmlPreviewData((prev) => {
          const next = { ...prev };
          if (svgUrl) {
            next[umlType] = { imageUrl: svgUrl };
          } else {
            delete next[umlType];
          }
          return next;
        });
      })
      .catch(() => {
        setUmlArtifact(null);
        setUmlSource('');
        setUmlPreviewData((prev) => {
          const next = { ...prev };
          delete next[umlType];
          return next;
        });
        setUmlError('No UML diagram found yet. Ask the assistant to generate one.');
      })
      .finally(() => setUmlLoading(false));
  }, [projectId, umlType]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds));
    },
    [setEdges]
  );

  const handleSelectionChange = useCallback((params: { nodes: Node[] }) => {
    setSelectedNodeId(params.nodes?.[0]?.id ?? null);
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const handleAddShape = (shape: ShapeType) => {
    const preset = shapePalette.find((s) => s.id === shape) || shapePalette[0];
    setNodes((prev) => {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'shape',
        position: {
          x: 120 + (prev.length % 4) * 80,
          y: 120 + (prev.length % 6) * 70,
        },
        data: {
          label: `${preset.label} ${prev.length + 1}`,
          shape: preset.id,
          color: preset.color,
        },
      };
      return [...prev, newNode];
    });
  };

  const handleAddTemplate = (template: TemplateOption) => {
    const newNode: Node = {
      id: `template_${Date.now()}`,
      type: 'shape',
      position: {
        x: 100 + (nodes.length % 5) * 80,
        y: 140 + (nodes.length % 4) * 70,
      },
      data: {
        label: template.label,
        shape: 'process',
        color: template.color,
        iconName: template.iconName,
        description: template.description,
      },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handleNodeDataChange = (field: 'label' | 'description', value: string) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                [field]: value,
              },
            }
          : node
      )
    );
  };

  const handleNodeColorChange = (color: string) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                color,
                fill: color,
              },
            }
          : node
      )
    );
  };

  const handleNodeShapeChange = (shape: ShapeType) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                shape,
              },
            }
          : node
      )
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((node) => node.id !== selectedNodeId));
    setEdges((prev) => prev.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload = {
        nodes: serializeNodes(nodes),
        edges: serializeEdges(edges),
        title: workspace?.title,
      };
      const updated = await api.saveDiagramWorkspace(projectId, stageKey, payload);
      setWorkspace(updated);
    } catch (err) {
      setError('Failed to save workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncFromAI = async () => {
    if (!projectId) return;
    setSyncingAI(true);
    setError(null);
    try {
      await api.syncDiagramCanvas(projectId, mode);
      await loadWorkspace();
    } catch (err) {
      setError('Failed to sync canvas with the latest AI output.');
    } finally {
      setSyncingAI(false);
    }
  };

  const handleExportCanvas = () => {
    setCanvasExporting(true);
    try {
      const payload = {
        project_id: projectId,
        stage: stageKey,
        mode,
        nodes: serializeNodes(nodes),
        edges: serializeEdges(edges),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${projectSlug}-${mode}-canvas.json`);
    } finally {
      setCanvasExporting(false);
    }
  };

  const handleSendChat = async () => {
    if (!projectId || !chatInput.trim()) return;
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    const message = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await api.chatDiagramWorkspace(projectId, stageKey, message);
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.message,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setNodes(toReactFlowNodes(response.nodes));
      setEdges(toReactFlowEdges(response.edges));
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: 'I ran into an issue applying that change. Please try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUmlSave = async () => {
    if (!projectId) return;
    setUmlSaving(true);
    setUmlError(null);
    try {
      const artifact = await api.saveUmlDiagram(projectId, umlType, umlSource);
      setUmlArtifact(artifact);
      const content = (artifact.content_json as any)?.plantuml || umlSource;
      setUmlSource(content);
    } catch (err) {
      setUmlError('Unable to save UML diagram.');
    } finally {
      setUmlSaving(false);
    }
  };

  const handleUmlChat = async () => {
    if (!projectId || !umlChatInput.trim()) return;
    setUmlChatLoading(true);
    setUmlError(null);
    try {
      const artifact = await api.chatUmlDiagram(projectId, umlType, umlChatInput.trim());
      setUmlArtifact(artifact);
      const content = (artifact.content_json as any)?.plantuml || '';
      setUmlSource(content);
      setUmlChatInput('');
    } catch (err) {
      setUmlError('The AI could not update the UML diagram. Try another instruction.');
    } finally {
      setUmlChatLoading(false);
    }
  };

  const handleUmlRefresh = () => {
    if (!projectId) return;
    setUmlLoading(true);
    setUmlError(null);
    api
      .getUmlDiagram(projectId, umlType)
      .then((artifact) => {
        setUmlArtifact(artifact);
        const content = (artifact.content_json as any)?.plantuml || '';
        setUmlSource(content);
      })
      .catch(() => setUmlError('Unable to refresh diagram.'))
      .finally(() => setUmlLoading(false));
  };

  const handleDownloadUmlSource = () => {
    if (!umlSource) return;
    const blob = new Blob([umlSource], { type: 'text/plain' });
    downloadBlob(blob, `${projectSlug}-${umlType}.puml`);
  };

  const handleDownloadUmlSvg = async () => {
    const targetUrl = umlPreviewUrl || umlPreviewData[umlType]?.imageUrl;
    if (!targetUrl) return;
    setUmlSvgDownloading(true);
    setUmlError(null);
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Failed to fetch SVG');
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      downloadBlob(blob, `${projectSlug}-${umlType}.svg`);
    } catch (err) {
      setUmlError('Unable to download SVG preview.');
    } finally {
      setUmlSvgDownloading(false);
    }
  };

  const nodeTypes = useMemo(() => ({ shape: ShapeNode, umlPreview: UmlPreviewNode }), []);
  const umlPreviewUrl = umlArtifact?.metadata?.plantuml_svg_url;

  useEffect(() => {
    if (assistantTab === 'canvas') return;
    setUmlPreviewVisibility((prev) => ({ ...prev, [umlType]: true }));
  }, [assistantTab, umlType]);

  const syncUmlPreviewNodes = useCallback(() => {
    setNodes((prev) => {
      const filtered = prev.filter((node) => !node.id.startsWith('uml_preview_'));
      const next = [...filtered];
      (Object.keys(umlPreviewData) as UmlPreviewType[]).forEach((type) => {
        const data = umlPreviewData[type];
        if (!data?.imageUrl || !umlPreviewVisibility[type]) {
          return;
        }
        const nodeId = `uml_preview_${type}`;
        const existing = prev.find((node) => node.id === nodeId);
        if (existing) {
          next.push({
            ...existing,
            data: { ...(existing.data as any), imageUrl: data.imageUrl, umlType: type },
          } as Node);
        } else {
          next.push({
            id: nodeId,
            type: 'umlPreview',
            position: previewPositions[type] || { x: 200, y: 200 },
            data: { imageUrl: data.imageUrl, umlType: type },
          } as Node);
        }
      });
      return next;
    });
  }, [setNodes, umlPreviewData, umlPreviewVisibility]);

  useEffect(() => {
    syncUmlPreviewNodes();
  }, [syncUmlPreviewNodes]);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Workspace</p>
            <p className="text-lg font-semibold text-gray-900">{projectDisplayName}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_350px]">
          <aside className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                Diagram canvas
              </h3>
              <p className="text-xs text-gray-500">
                Use the palette to create flowchart nodes, then drag, connect, and edit them with the assistant.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(['freeform', 'requirements', 'srs', 'costs'] as DiagramMode[]).map((diagramMode) => (
                  <Button
                    key={diagramMode}
                    size="sm"
                    variant={mode === diagramMode ? 'default' : 'outline'}
                    onClick={() => updateMode(diagramMode)}
                  >
                    {diagramMode === 'freeform'
                      ? 'Freeform'
                      : diagramMode === 'requirements'
                      ? 'Requirements'
                      : diagramMode === 'srs'
                      ? 'SRS'
                      : 'Costs'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Shapes</p>
              <div className="grid grid-cols-2 gap-2">
                {shapePalette.map((shape) => (
                  <Button
                    key={shape.id}
                    variant="outline"
                    size="sm"
                    className="justify-start space-x-2"
                    onClick={() => handleAddShape(shape.id)}
                  >
                    <shape.icon className="h-4 w-4" />
                    <span>{shape.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Templates</p>
              <div className="space-y-2">
                {templateOptions.map((template) => {
                  const TemplateIcon = iconComponents[template.iconName];
                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleAddTemplate(template)}
                    >
                      <TemplateIcon className="h-4 w-4" />
                      {template.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">AI sync & export</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleSyncFromAI}
                disabled={syncingAI || !projectId}
              >
                {syncingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync with Phase Data
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExportCanvas}
                disabled={canvasExporting || nodes.length === 0}
              >
                {canvasExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Canvas JSON
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Selected node</p>
              {selectedNode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.label || ''}
                    onChange={(e) => handleNodeDataChange('label', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
                    placeholder="Label"
                  />
                  <textarea
                    value={(selectedNode.data as any)?.description || ''}
                    onChange={(e) => handleNodeDataChange('description', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm"
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-gray-500">Shape</label>
                    <select
                      value={(selectedNode.data as any)?.shape || 'process'}
                      onChange={(e) => handleNodeShapeChange(e.target.value as ShapeType)}
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm bg-white"
                    >
                      {shapePalette.map((shape) => (
                        <option key={shape.id} value={shape.id}>
                          {shape.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-gray-500" />
                    <div className="flex gap-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border ${((selectedNode.data as any)?.color || '#2563EB') === color ? 'border-gray-900' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleNodeColorChange(color)}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      className="h-5 w-10 rounded border border-gray-200"
                      value={(selectedNode.data as any)?.color || '#2563EB'}
                      onChange={(e) => handleNodeColorChange(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleDeleteNode} variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Select a node to edit its label, notes, and color.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Snap to grid
              </label>
              <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Canvas
                  </>
                )}
              </Button>
            </div>
            {workspace && (
              <div className="text-xs text-gray-500">
                Last updated {new Date(workspace.updated_at).toLocaleString()}
              </div>
            )}
          </aside>

          <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-900 shadow">
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs uppercase text-gray-500">Canvas</p>
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                  <PenTool className="h-5 w-5 text-blue-500" />
                  Diagram Studio –{' '}
                  {mode === 'freeform'
                    ? 'Freeform'
                    : mode === 'requirements'
                    ? 'Requirements'
                    : mode === 'srs'
                    ? 'SRS'
                    : 'Costs'}
                </h2>
                <p className="text-sm text-gray-500">
                  Use this space as a mind map for flows, architectures, or any software engineering concept. Switch
                  modes to maintain separate canvases for requirements, SRS, or costs.
                </p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg relative bg-white" style={{ minHeight: '80vh' }}>
              {loadingWorkspace ? (
                <div className="flex items-center justify-center h-[80vh]">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="relative min-h-[80vh]">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={handleConnect}
                    onSelectionChange={handleSelectionChange}
                    fitView
                    nodeTypes={nodeTypes}
                    snapToGrid={snapToGrid}
                    snapGrid={[20, 20]}
                    proOptions={{ hideAttribution: true }}
                    className="min-h-[720px]"
                  >
                    <Background gap={24} size={1} />
                    <MiniMap />
                    <Controls />
                  </ReactFlow>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <aside className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                <h3 className="text-base font-semibold text-gray-900">Assistants</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={assistantTab === 'canvas' ? 'default' : 'outline'}
                  onClick={() => setAssistantTab('canvas')}
                >
                  Canvas AI
                </Button>
                <Button
                  size="sm"
                  variant={assistantTab === 'uml' ? 'default' : 'outline'}
                  onClick={() => setAssistantTab('uml')}
                >
                  UML AI
                </Button>
              </div>
            </div>

            {assistantTab === 'canvas' ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
                <div className="mt-2">
                  <textarea
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px] resize-none"
                    placeholder="e.g. Add QA node and connect it after Testing"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="w-full mt-2">
                    {chatLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Instruction
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'use_case', label: 'Use Case' },
                      { id: 'class_diagram', label: 'Class' },
                      { id: 'sequence', label: 'Sequence' },
                      { id: 'entity_relationship', label: 'ER' },
                    ] as const
                  ).map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={umlType === option.id ? 'default' : 'outline'}
                      onClick={() => setUmlType(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-2">
                  {umlLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading latest UML preview...</span>
                    </div>
                  ) : umlPreviewUrl ? (
                    <>
                      <p>
                        Each diagram type becomes a draggable card inside the canvas. Toggle visibility for the current
                        type below or drag the preview wherever you need it.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUmlPreviewVisibility((prev) => ({
                            ...prev,
                            [umlType]: !prev[umlType],
                          }))
                        }
                      >
                        {umlPreviewVisibility[umlType] ? 'Hide on Canvas' : 'Show on Canvas'}
                      </Button>
                    </>
                  ) : (
                    <p>
                      No diagram has been generated yet. Ask the assistant to create or update the PlantUML source, and
                      the preview will appear on the canvas.
                    </p>
                  )}
                </div>

                <textarea
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]"
                  value={umlSource}
                  onChange={(e) => setUmlSource(e.target.value)}
                  placeholder="PlantUML source"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleUmlSave} disabled={umlSaving}>
                    {umlSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save UML
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleUmlRefresh} disabled={umlLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={handleDownloadUmlSource} disabled={!umlSource}>
                    <Download className="mr-2 h-4 w-4" />
                    PlantUML
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadUmlSvg}
                    disabled={!(umlPreviewUrl || umlPreviewData[umlType]?.imageUrl) || umlSvgDownloading}
                  >
                    {umlSvgDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        SVG...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        SVG
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <textarea
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
                    placeholder="Describe the update you want (e.g. add PaymentService class)"
                    value={umlChatInput}
                    onChange={(e) => setUmlChatInput(e.target.value)}
                  />
                  <Button
                    onClick={handleUmlChat}
                    disabled={umlChatLoading || !umlChatInput.trim()}
                    className="w-full mt-2"
                  >
                    {umlChatLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Asking AI...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ask UML Assistant
                      </>
                    )}
                  </Button>
                </div>
                {umlError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                    {umlError}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default DiagramWorkspacePage;
