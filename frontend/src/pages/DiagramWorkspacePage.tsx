import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Eraser,
  Play,
  Pause,
  Camera,
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
      className={`min-w-[320px] max-w-[420px] bg-[var(--brand-850)] border ${
        selected ? 'border-[var(--blue-400)] shadow-2xl' : 'border-[var(--brand-700)] shadow-lg'
      } rounded-xl`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--brand-700)]">
        <div>
          <p className="text-[10px] uppercase text-[var(--text-muted)]">Pinned UML</p>
          <p className="text-xs font-semibold text-[var(--text-primary)]">{umlLabel}</p>
        </div>
        <span className="text-[10px] uppercase text-[var(--text-muted)]">Drag me</span>
      </div>
      <div className="p-3 bg-[var(--brand-800)] rounded-b-xl flex items-center justify-center">
        {data?.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={umlLabel}
            className="max-h-[280px] max-w-full object-contain rounded-lg border border-[var(--brand-700)] bg-[var(--brand-900)]"
            draggable={false}
          />
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Preview unavailable.</p>
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
  const workspaceRef = useRef<DiagramWorkspace | null>(null);
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
  const [frames, setFrames] = useState<{ id: string; timestamp: string; nodes: DiagramNode[]; edges?: DiagramEdge[] }[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const [penEnabled, setPenEnabled] = useState(false);
  const [penColor, setPenColor] = useState('#2563EB');
  const [penWidth, setPenWidth] = useState(3);
  const [penDrawing, setPenDrawing] = useState(false);
  const penCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const [canvasTheme, setCanvasTheme] = useState<'light' | 'dark'>('light');
  const [focusMode, setFocusMode] = useState(false);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const [snapshotHistory, setSnapshotHistory] = useState<
    { id: string; timestamp: string; nodes: Node[]; edges: Edge[] }[]
  >([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const lastSnapshotRef = useRef<string>('');
  const [persistedPenLayer, setPersistedPenLayer] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const cacheKey = useMemo(
    () => (projectId ? `diagram-cache-${projectId}-${stageKey}` : null),
    [projectId, stageKey]
  );
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900
  );
  const capturePenLayer = useCallback(() => {
    const canvas = penCanvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }, []);

  const applyPenLayerFromSource = useCallback(
    (dataUrl?: string | null) => {
      const canvas = penCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = dataUrl;
      }
      setPersistedPenLayer(dataUrl || null);
    },
    []
  );

  const buildMetadataPayload = useCallback(() => {
    const base = { ...(workspace?.metadata || {}) };
    const annotations = { ...(base.annotations || {}) };
    const penLayer = capturePenLayer();
    if (penLayer) {
      annotations.pen_layer = penLayer;
    } else {
      delete annotations.pen_layer;
    }
    if (Object.keys(annotations).length > 0) {
      base.annotations = annotations;
    } else {
      delete base.annotations;
    }
    return base;
  }, [workspace?.metadata, capturePenLayer]);

  const canvasHeight = useMemo(() => Math.max(900, viewportHeight - 120), [viewportHeight]);
  const gridClasses = useMemo(
    () =>
      focusMode
        ? 'w-full'
        : 'grid gap-3 xl:grid-cols-[250px_minmax(0,1fr)_260px] w-full',
    [focusMode]
  );

  const resizePenCanvas = useCallback(() => {
    const wrapper = canvasWrapperRef.current;
    const canvas = penCanvasRef.current;
    if (!wrapper || !canvas) return;
    const rect = wrapper.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    if (persistedPenLayer) {
      const img = new Image();
      img.onload = () => {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = persistedPenLayer;
    }
  }, [persistedPenLayer]);

  useEffect(() => {
    resizePenCanvas();
    window.addEventListener('resize', resizePenCanvas);
    return () => window.removeEventListener('resize', resizePenCanvas);
  }, [resizePenCanvas]);

  useEffect(() => {
    const handleViewportResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, []);

  const applyFrameToCanvas = useCallback(
    (index: number) => {
      const frame = frames[index];
      if (!frame) return;
      if (frame.nodes?.length) {
        setNodes(toReactFlowNodes(frame.nodes));
      }
      if (frame.edges?.length) {
        setEdges(toReactFlowEdges(frame.edges));
      }
    },
    [frames, setNodes, setEdges]
  );

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
        playbackTimer.current = null;
      }
      return;
    }
    playbackTimer.current = setInterval(() => {
      setPlaybackIndex((prev) => (prev + 1) % frames.length);
    }, 2000);
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
        playbackTimer.current = null;
      }
    };
  }, [isPlaying, frames.length]);

  useEffect(() => {
    if (!isPlaying || !frames.length) {
      return;
    }
    applyFrameToCanvas(playbackIndex);
  }, [isPlaying, playbackIndex, frames, applyFrameToCanvas]);

  const getPenPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = penCanvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePenPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabled) return;
    const canvas = penCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const { x, y } = getPenPosition(event);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvas.setPointerCapture(event.pointerId);
    setPenDrawing(true);
    event.preventDefault();
  };

  const handlePenPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabled || !penDrawing) return;
    const ctx = penCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPenPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    event.preventDefault();
  };

  const stopPenDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penDrawing) return;
    const canvas = penCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.closePath();
    if (canvas && event) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    setPenDrawing(false);
    const snapshot = capturePenLayer();
    if (snapshot) {
      setPersistedPenLayer(snapshot);
    }
  };

  const clearPenCanvas = useCallback(() => {
    const canvas = penCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPersistedPenLayer(null);
  }, []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [clipboardNodes, setClipboardNodes] = useState<Node[]>([]);

  const hydrateFromCache = useCallback(
    (cached: any, reason: string) => {
      if (!cached?.nodes || !cached?.edges) return false;
      setNodes(toReactFlowNodes(cached.nodes));
      setEdges(toReactFlowEdges(cached.edges));
      applyPenLayerFromSource(cached.penLayer || null);
      setOfflineNotice(reason);
      return true;
    },
    [applyPenLayerFromSource]
  );

  const storeOfflineCache = useCallback(
    (penLayerOverride?: string | null) => {
      if (!cacheKey) return;
      try {
        const payload = {
          nodes: serializeNodes(nodes),
          edges: serializeEdges(edges),
          penLayer: penLayerOverride ?? persistedPenLayer ?? capturePenLayer(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch {
        // ignore storage errors
      }
    },
    [cacheKey, nodes, edges, persistedPenLayer, capturePenLayer]
  );

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

  useEffect(() => {
    const annotations = workspace?.metadata?.annotations;
    if (annotations && annotations.pen_layer) {
      applyPenLayerFromSource(annotations.pen_layer);
    } else if (!annotations && !penDrawing) {
      clearPenCanvas();
    }
  }, [workspace?.metadata, applyPenLayerFromSource, penDrawing]);

  const loadWorkspaceRef = useRef(false);

  const fallbackNodes = useMemo(
    () => [
      {
        id: 'welcome_1',
        type: 'shape',
        position: { x: 100, y: 80 },
        data: {
          label: 'Start',
          shape: 'terminator',
          color: '#2563EB',
        },
      },
      {
        id: 'welcome_2',
        type: 'shape',
        position: { x: 360, y: 200 },
        data: {
          label: 'Brainstorm ideas',
          shape: 'process',
          color: '#F97316',
        },
      },
      {
        id: 'welcome_3',
        type: 'shape',
        position: { x: 640, y: 120 },
        data: {
          label: 'Ship milestone',
          shape: 'terminator',
          color: '#059669',
        },
      },
    ],
    []
  );

  const fallbackEdges = useMemo(
    () => [
      {
        id: 'welcome_edge_1',
        source: 'welcome_1',
        target: 'welcome_2',
        type: 'smoothstep',
        label: 'plan',
      },
      {
        id: 'welcome_edge_2',
        source: 'welcome_2',
        target: 'welcome_3',
        type: 'smoothstep',
        label: 'deliver',
      },
    ],
    []
  );

  const loadWorkspace = useCallback(async () => {
    if (loadWorkspaceRef.current) {
      return;
    }
    loadWorkspaceRef.current = true;
    if (!projectId) return;
    setLoadingWorkspace(true);
    setError(null);
    try {
      const data = await api.getDiagramWorkspace(projectId, stageKey);
      setWorkspace(data);
      const playbackFrames = (data.frames || []).map((frame: any, idx: number) => ({
        id: frame.id || `frame_${idx}`,
        timestamp: frame.timestamp || data.updated_at,
        nodes: frame.nodes || [],
        edges: frame.edges || [],
      }));
      setFrames(playbackFrames);
      setPlaybackIndex(0);
      setIsPlaying(false);
      let nodesSource = data.nodes;
      let edgesSource = data.edges;
      let penLayerSource = data.metadata?.annotations?.pen_layer;
      let usedCache = false;
      if (cacheKey) {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (
              cached.updated_at &&
              data.updated_at &&
              new Date(cached.updated_at) > new Date(data.updated_at)
            ) {
              nodesSource = cached.nodes || nodesSource;
              edgesSource = cached.edges || edgesSource;
              penLayerSource = cached.penLayer || penLayerSource;
              hydrateFromCache(cached, 'Restored unsynced edits from local cache.');
              usedCache = true;
            }
          } catch {
            // ignore cache parse errors
          }
        }
      }
      if (!usedCache) {
        const normalizedNodes = nodesSource?.length ? nodesSource : fallbackNodes;
        const normalizedEdges = edgesSource?.length ? edgesSource : fallbackEdges;
        setNodes(toReactFlowNodes(normalizedNodes));
        setEdges(toReactFlowEdges(normalizedEdges));
        if (penLayerSource) {
          applyPenLayerFromSource(penLayerSource);
        } else {
          clearPenCanvas();
        }
        setOfflineNotice(null);
      }
    } catch (err) {
      setError('Failed to load workspace');
      if (cacheKey) {
        try {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (hydrateFromCache(cached, 'Offline mode: using cached diagram.')) {
              if (!workspaceRef.current) {
                setWorkspace({
                  diagram_id: `offline_${stageKey}`,
                  project_id: projectId,
                  stage: stageKey,
                  title: `${stageKey} Canvas (offline)`,
                  nodes: cached.nodes || [],
                  edges: cached.edges || [],
                  metadata: {},
                  created_at: cached.updated_at || new Date().toISOString(),
                  updated_at: cached.updated_at || new Date().toISOString(),
                } as DiagramWorkspace);
              }
            }
          }
        } catch {
          // ignore cache failures
        }
      }
    } finally {
      setLoadingWorkspace(false);
      loadWorkspaceRef.current = false;
    }
  }, [
    projectId,
    stageKey,
    cacheKey,
    setEdges,
    setNodes,
    applyPenLayerFromSource,
    hydrateFromCache,
    clearPenCanvas,
    fallbackNodes,
    fallbackEdges,
  ]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    if (!projectId) return;
    storeOfflineCache(capturePenLayer());
    setAutosaveState('idle');
  }, [nodes, edges, projectId, capturePenLayer, storeOfflineCache]);

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

  useEffect(() => {
    const signature = JSON.stringify({ nodes, edges });
    if (signature === lastSnapshotRef.current) return;
    lastSnapshotRef.current = signature;
    setSnapshotHistory((prev) => {
      const entry = {
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        nodes: nodes.map((node) => ({ ...node })),
        edges: edges.map((edge) => ({ ...edge })),
      };
      return [entry, ...prev].slice(0, 5);
    });
  }, [nodes, edges]);

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

  const handleCopy = () => {
    if (!selectedNodeId) return;
    const target = nodes.find((n) => n.id === selectedNodeId);
    if (!target) return;
    setClipboardNodes([{ ...target, position: { ...target.position } }]);
  };

  const handleCut = () => {
    if (!selectedNodeId) return;
    const target = nodes.find((n) => n.id === selectedNodeId);
    if (!target) return;
    setClipboardNodes([{ ...target, position: { ...target.position } }]);
    handleDeleteNode();
  };

  const handlePaste = () => {
    if (!clipboardNodes.length) return;
    const offset = 40;
    const pasted: Node[] = clipboardNodes.map((node, idx) => ({
      ...node,
      id: `${node.id}_paste_${Date.now()}_${idx}`,
      position: { x: node.position.x + offset, y: node.position.y + offset },
    }));
    setNodes((prev) => [...prev, ...pasted]);
  };

  const closeContextMenu = () => setContextMenu({ x: 0, y: 0, visible: false });

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    const wrapper = canvasWrapperRef.current;
    const rect = wrapper?.getBoundingClientRect();
    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect ? event.clientY - rect.top : event.clientY;
    setContextMenu({ x, y, visible: true });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if (mod && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
      } else if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteNode();
      } else if (e.key === 'Escape') {
        closeContextMenu();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCopy, handleCut, handlePaste]);

  const handleSave = async (silent = false) => {
    if (!projectId) return;
    if (!silent) {
      setIsSaving(true);
    }
    try {
      const metadata = buildMetadataPayload();
      const payload = {
        nodes: serializeNodes(nodes),
        edges: serializeEdges(edges),
        title: workspace?.title,
        metadata,
        frames: frames.map((frame) => ({
          id: frame.id,
          timestamp: frame.timestamp,
          nodes: frame.nodes,
          edges: frame.edges,
        })),
      };
      const updated = await api.saveDiagramWorkspace(projectId, stageKey, payload);
      setWorkspace(updated);
      const updatedFrames = (updated.frames || []).map((frame: any, idx: number) => ({
        id: frame.id || `frame_${idx}`,
        timestamp: frame.timestamp || updated.updated_at,
        nodes: frame.nodes || [],
        edges: frame.edges || [],
      }));
      setFrames(updatedFrames);
      setOfflineNotice(null);
      if (!silent) {
        setAutosaveState('saved');
      }
      if (!silent) {
        setIsSaving(false);
      }
      return updated;
    } catch (err) {
      setError('Failed to save workspace');
      setOfflineNotice('Unable to sync with the server. Working from local cache.');
      if (!silent) {
        setAutosaveState('offline');
      }
      if (!silent) {
        setIsSaving(false);
      }
      throw err;
    }
  };

  const handleFrameJump = (index: number) => {
    setIsPlaying(false);
    setPlaybackIndex(index);
    applyFrameToCanvas(index);
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

  const handleCaptureFrame = () => {
    const snapshotNodes = serializeNodes(nodes);
    const snapshotEdges = serializeEdges(edges);
    const newFrame = {
      id: `frame_${Date.now()}`,
      timestamp: new Date().toISOString(),
      nodes: snapshotNodes,
      edges: snapshotEdges,
    };
    setFrames((prev) => [...prev.slice(-9), newFrame]);
  };

  const handleRestoreSnapshot = (snapshotId: string) => {
    const snapshot = snapshotHistory.find((snap) => snap.id === snapshotId);
    if (!snapshot) return;
    setNodes(snapshot.nodes.map((node) => ({ ...node })));
    setEdges(snapshot.edges.map((edge) => ({ ...edge })));
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

  const adjustZoom = (delta: number) => {
    if (!reactFlowInstance) return;
    const currentZoom =
      typeof reactFlowInstance.getZoom === 'function' ? reactFlowInstance.getZoom() : reactFlowInstance?.viewport?.zoom || 1;
    const nextZoom = Math.min(2.5, Math.max(0.25, currentZoom + delta));
    if (reactFlowInstance.zoomTo) {
      reactFlowInstance.zoomTo(nextZoom);
    }
  };

  const handleFitView = () => {
    if (reactFlowInstance?.fitView) {
      reactFlowInstance.fitView({ padding: 0.2 });
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

  const toggleCanvasTheme = () => {
    setCanvasTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
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
            <p className="text-xs uppercase text-[var(--text-muted)]">Workspace</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{projectDisplayName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={focusMode ? 'default' : 'outline'} onClick={() => setFocusMode((prev) => !prev)}>
            {focusMode ? 'Exit Focus' : 'Focus Canvas'}
          </Button>
        </div>

        <div className={gridClasses}>
          {!focusMode && (
            <aside className="bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 uppercase tracking-wide">
                  Diagram canvas
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                Use the palette to create flowchart nodes, then drag, connect, and edit them with the assistant.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(['freeform', 'requirements', 'srs', 'costs'] as DiagramMode[]).map((diagramMode) => (
                  <Button
                    key={diagramMode}
                    size="xs"
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
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Shapes</p>
              <div className="grid grid-cols-2 gap-2">
                {shapePalette.map((shape) => (
                  <Button
                    key={shape.id}
                    variant="outline"
                    size="xs"
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
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Templates</p>
              <div className="space-y-2">
                {templateOptions.map((template) => {
                  const TemplateIcon = iconComponents[template.iconName];
                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="xs"
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
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">AI sync & export</p>
              <Button
                variant="outline"
                size="xs"
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
                size="xs"
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
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Snapshots</p>
              {snapshotHistory.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">Snapshots capture recent canvas states for quick undo.</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {snapshotHistory.map((snapshot) => (
                    <Button
                      key={snapshot.id}
                      size="xs"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleRestoreSnapshot(snapshot.id)}
                    >
                      <span className="text-left text-xs">
                        {new Date(snapshot.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {snapshot.nodes.length} nodes
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Selected node</p>
              {selectedNode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={(selectedNode.data as any)?.label || ''}
                    onChange={(e) => handleNodeDataChange('label', e.target.value)}
                    className="w-full border border-[var(--brand-700)] rounded-md px-2 py-1 text-sm bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                    placeholder="Label"
                  />
                  <textarea
                    value={(selectedNode.data as any)?.description || ''}
                    onChange={(e) => handleNodeDataChange('description', e.target.value)}
                    className="w-full border border-[var(--brand-700)] rounded-md px-2 py-1 text-sm bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:border-[var(--blue-400)] outline-none"
                    placeholder="Description"
                    rows={2}
                  />
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-[var(--text-muted)]">Shape</label>
                    <select
                      value={(selectedNode.data as any)?.shape || 'process'}
                      onChange={(e) => handleNodeShapeChange(e.target.value as ShapeType)}
                      className="w-full border border-[var(--brand-700)] rounded-md px-2 py-1 text-sm bg-[#152238] text-[var(--text-primary)] focus:border-[var(--blue-400)] outline-none"
                    >
                      {shapePalette.map((shape) => (
                        <option key={shape.id} value={shape.id}>
                          {shape.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-[var(--text-muted)]" />
                    <div className="flex gap-1">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border ${((selectedNode.data as any)?.color || '#2563EB') === color ? 'border-[var(--blue-400)]' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleNodeColorChange(color)}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      className="h-5 w-10 rounded border border-[var(--brand-700)]"
                      value={(selectedNode.data as any)?.color || '#2563EB'}
                      onChange={(e) => handleNodeColorChange(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleDeleteNode} variant="outline" size="xs">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Select a node to edit its label, notes, and color.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded border-[var(--brand-600)]"
                />
                Snap to grid
              </label>
              <Button size="sm" onClick={() => handleSave()} className="w-full" disabled={isSaving}>
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
              <p className="text-[11px] text-[var(--text-muted)]">
                Autosave:{' '}
                {autosaveState === 'saving'
                  ? 'saving...'
                  : autosaveState === 'saved'
                  ? 'saved'
                  : autosaveState === 'offline'
                  ? 'offline (unsynced)'
                  : 'idle'}
              </p>
            </div>
              {workspace && (
                <div className="text-xs text-[var(--text-muted)]">
                  Last updated {new Date(workspace.updated_at).toLocaleString()}
                </div>
              )}
            </aside>
          )}

          <div className="bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg p-3 sm:p-4 text-[var(--text-primary)] shadow w-full overflow-hidden">
            <div className="mb-3 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase text-[var(--text-muted)]">Canvas</p>
                <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
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
                <p className="text-sm text-[var(--text-muted)] max-w-3xl">
                  Use this space as a mind map for flows, architectures, or any software engineering concept. Switch
                  modes to maintain separate canvases for requirements, SRS, or costs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => adjustZoom(0.1)}>
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Zoom In
                </Button>
                <Button size="sm" variant="outline" onClick={() => adjustZoom(-0.1)}>
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Zoom Out
                </Button>
                <Button size="sm" variant="outline" onClick={handleFitView}>
                  <Crosshair className="h-4 w-4 mr-1" />
                  Fit
                </Button>
                <Button size="sm" variant="outline" onClick={toggleCanvasTheme}>
                  {canvasTheme === 'light' ? (
                    <>
                      <Moon className="h-4 w-4 mr-1" />
                      Dark
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-1" />
                      Light
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={penEnabled ? 'default' : 'outline'}
                  onClick={() => setPenEnabled((prev) => !prev)}
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  {penEnabled ? 'Pen On' : 'Pen Tool'}
                </Button>
                <Button size="sm" variant="outline" onClick={clearPenCanvas} disabled={!penEnabled}>
                  <Eraser className="h-4 w-4 mr-1" />
                  Clear Ink
                </Button>
                {penEnabled && (
                  <>
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="h-8 w-12 border border-[var(--brand-700)] rounded"
                      title="Pen color"
                    />
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      className="w-24"
                    />
                  </>
                )}
                <Button size="sm" variant="outline" onClick={handleCaptureFrame}>
                  <Camera className="h-4 w-4 mr-1" />
                  Capture Frame
                </Button>
                {frames.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant={isPlaying ? 'default' : 'outline'}
                      onClick={() => setIsPlaying((prev) => !prev)}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" /> Play
                        </>
                      )}
                    </Button>
                    <select
                      className="border border-[var(--brand-700)] rounded-lg px-3 py-1 text-sm bg-[#152238] text-[var(--text-primary)] focus:border-[var(--blue-400)] outline-none"
                      value={playbackIndex}
                      onChange={(e) => handleFrameJump(Number(e.target.value))}
                    >
                      {frames.map((frame, idx) => (
                        <option key={frame.id} value={idx}>
                          Frame {idx + 1} · {new Date(frame.timestamp).toLocaleTimeString()}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
            {offlineNotice && (
              <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                {offlineNotice}
              </div>
            )}
            <div
              className={`relative rounded-lg ${canvasTheme === 'dark' ? 'bg-slate-900 border border-slate-700' : 'bg-[#f8fafc] border border-[var(--brand-700)]'}`}
              style={{ minHeight: canvasHeight, height: canvasHeight, width: '100%' }}
              ref={canvasWrapperRef}
              onContextMenu={handleContextMenu}
            >
              {loadingWorkspace ? (
                <div className="flex items-center justify-center" style={{ minHeight: canvasHeight }}>
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="relative w-full" style={{ minHeight: canvasHeight, height: canvasHeight }}>
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
                    className={`${canvasTheme === 'dark' ? 'text-white' : ''}`}
                    onInit={setReactFlowInstance}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <Background gap={24} size={1} color={canvasTheme === 'dark' ? '#1e293b' : '#dbeafe'} />
                    <MiniMap />
                    <Controls />
                  </ReactFlow>
                  {!nodes.length && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-gray-400 pointer-events-none">
                      <p>No nodes yet.</p>
                      <p>Add shapes from the left palette or run "Sync with Phase Data".</p>
                    </div>
                  )}
                  {nodes.length > 0 && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--brand-850)]/80 backdrop-blur rounded-full px-3 py-1 shadow border border-[var(--brand-700)]">
                      <span>Nodes: {nodes.length}</span>
                      <span>Edges: {edges.length}</span>
                    </div>
                  )}
                  <canvas
                    ref={penCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ pointerEvents: penEnabled ? 'auto' : 'none' }}
                    onPointerDown={handlePenPointerDown}
                    onPointerMove={handlePenPointerMove}
                    onPointerUp={stopPenDrawing}
                    onPointerLeave={stopPenDrawing}
                  />
                  {contextMenu.visible && (
                    <div
                      className="absolute z-20 bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-md shadow-lg text-sm text-[var(--text-primary)]"
                      style={{ top: contextMenu.y, left: contextMenu.x, minWidth: '160px' }}
                    >
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[var(--brand-700)] disabled:opacity-50 text-[var(--text-primary)]"
                        onClick={() => {
                          handleCopy();
                          closeContextMenu();
                        }}
                        disabled={!selectedNodeId}
                      >
                        Copy
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[var(--brand-700)] disabled:opacity-50 text-[var(--text-primary)]"
                        onClick={() => {
                          handleCut();
                          closeContextMenu();
                        }}
                        disabled={!selectedNodeId}
                      >
                        Cut
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[var(--brand-700)] disabled:opacity-50 text-[var(--text-primary)]"
                        onClick={() => {
                          handlePaste();
                          closeContextMenu();
                        }}
                        disabled={!clipboardNodes.length}
                      >
                        Paste
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-[var(--brand-700)] disabled:opacity-50 text-[var(--text-primary)]"
                        onClick={() => {
                          handleDeleteNode();
                          closeContextMenu();
                        }}
                        disabled={!selectedNodeId}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {error && (
              <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {!focusMode && (
            <aside className="bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg p-4 flex flex-col space-y-4 overflow-hidden">
            {/* Assistants Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">Assistants</h3>
              </div>
              {/* Segmented tab control */}
              <div className="flex w-full bg-[var(--brand-800)] rounded-lg p-1 border border-[var(--brand-700)]">
                <button
                  onClick={() => setAssistantTab('canvas')}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all truncate ${
                    assistantTab === 'canvas'
                      ? 'bg-[var(--blue-400)] text-[var(--brand-900)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-700)]'
                  }`}
                >
                  Canvas AI
                </button>
                <button
                  onClick={() => setAssistantTab('uml')}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all truncate ${
                    assistantTab === 'uml'
                      ? 'bg-[var(--blue-400)] text-[var(--brand-900)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-700)]'
                  }`}
                >
                  UML AI
                </button>
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
                          ? 'bg-[rgba(26,111,212,0.15)] text-[var(--blue-300)] ml-auto max-w-[90%]'
                          : 'bg-[var(--brand-800)] text-[var(--text-primary)] mr-auto max-w-[90%]'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-1">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <textarea
                    className="w-full border border-[var(--brand-700)] rounded-md px-3 py-2 text-sm bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/40 focus:border-[var(--blue-400)] min-h-[90px] resize-none"
                    placeholder="e.g. Add QA node and connect it after Testing"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button size="sm" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} className="w-full mt-2">
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
                <div className="flex w-full bg-[var(--brand-800)] rounded-lg p-1 border border-[var(--brand-700)]">
                  {(
                    [
                      { id: 'use_case', label: 'Use Case' },
                      { id: 'class_diagram', label: 'Class' },
                      { id: 'sequence', label: 'Sequence' },
                      { id: 'entity_relationship', label: 'ER' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setUmlType(option.id)}
                      className={`flex-1 px-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all truncate ${
                        umlType === option.id
                          ? 'bg-[var(--blue-400)] text-[var(--brand-900)] shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-700)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-[var(--blue-400)]/20 bg-[rgba(26,111,212,0.08)] p-3 text-xs text-[var(--blue-300)] space-y-2">
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
                  className="w-full border border-[var(--brand-700)] rounded-md px-3 py-2 text-sm bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/40 focus:border-[var(--blue-400)] min-h-[120px]"
                  value={umlSource}
                  onChange={(e) => setUmlSource(e.target.value)}
                  placeholder="PlantUML source"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <Button size="xs" onClick={handleUmlSave} disabled={umlSaving}>
                    {umlSaving ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save UML
                      </>
                    )}
                  </Button>
                  <Button size="xs" variant="outline" onClick={handleUmlRefresh} disabled={umlLoading}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Refresh
                  </Button>
                  <Button size="xs" variant="outline" onClick={handleDownloadUmlSource} disabled={!umlSource}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PlantUML
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleDownloadUmlSvg}
                    disabled={!(umlPreviewUrl || umlPreviewData[umlType]?.imageUrl) || umlSvgDownloading}
                  >
                    {umlSvgDownloading ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        SVG...
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        SVG
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <textarea
                    className="w-full border border-[var(--brand-700)] rounded-md px-3 py-2 text-sm bg-[#152238] text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/40 focus:border-[var(--blue-400)] min-h-[90px]"
                    placeholder="Describe the update you want (e.g. add PaymentService class)"
                    value={umlChatInput}
                    onChange={(e) => setUmlChatInput(e.target.value)}
                  />
                  <Button
                    size="sm"
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
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                    {umlError}
                  </div>
                )}
              </div>
            )}
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DiagramWorkspacePage;
