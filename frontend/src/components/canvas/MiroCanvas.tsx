import React, { useCallback, useEffect, useState } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
  NodeResizer,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/Button';
import { colors, shapeColors, canvasColors } from '@/constants/design';
import {
  Square,
  Circle,
  Diamond,
  RectangleHorizontal,
  Database,
  Server,
  Cloud,
  Globe,
  FileText,
  User,
  Users,
  Lock,
  Unlock,
  ArrowRight,
  Type,
  Pencil,
  Hand,
  MousePointer2,
  Grid3X3,
  Layers,
  Trash2,
  Copy,
  ClipboardPaste,
  Undo2,
  Redo2,
  Download,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Group,
  Ungroup,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================
export type ShapeCategory = 'basic' | 'flowchart' | 'uml' | 'erd' | 'architecture' | 'custom';

export interface ShapeDefinition {
  id: string;
  name: string;
  category: ShapeCategory;
  icon: React.ReactNode;
  defaultWidth: number;
  defaultHeight: number;
  style: React.CSSProperties;
  color: string;
}

export interface CanvasState {
  tool: 'select' | 'pan' | 'draw' | 'text' | 'connector';
  selectedShape: string | null;
  zoom: number;
  gridVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

// ==========================================
// SHAPE DEFINITIONS
// ==========================================
const shapeLibrary: ShapeDefinition[] = [
  // Basic Shapes
  { id: 'rectangle', name: 'Rectangle', category: 'basic', icon: <Square className="h-4 w-4" />, defaultWidth: 120, defaultHeight: 80, style: { borderRadius: '8px' }, color: shapeColors.process },
  { id: 'rounded-rect', name: 'Rounded Rectangle', category: 'basic', icon: <RectangleHorizontal className="h-4 w-4" />, defaultWidth: 140, defaultHeight: 70, style: { borderRadius: '35px' }, color: shapeColors.terminator },
  { id: 'circle', name: 'Circle', category: 'basic', icon: <Circle className="h-4 w-4" />, defaultWidth: 80, defaultHeight: 80, style: { borderRadius: '50%' }, color: shapeColors.process },
  { id: 'diamond', name: 'Diamond', category: 'basic', icon: <Diamond className="h-4 w-4" />, defaultWidth: 100, defaultHeight: 100, style: { transform: 'rotate(45deg)' }, color: shapeColors.decision },
  
  // Flowchart
  { id: 'process', name: 'Process', category: 'flowchart', icon: <Square className="h-4 w-4" />, defaultWidth: 140, defaultHeight: 60, style: { borderRadius: '4px' }, color: shapeColors.process },
  { id: 'decision', name: 'Decision', category: 'flowchart', icon: <Diamond className="h-4 w-4" />, defaultWidth: 100, defaultHeight: 100, style: {}, color: shapeColors.decision },
  { id: 'terminator', name: 'Start/End', category: 'flowchart', icon: <RectangleHorizontal className="h-4 w-4" />, defaultWidth: 120, defaultHeight: 50, style: { borderRadius: '25px' }, color: shapeColors.terminator },
  { id: 'data', name: 'Data', category: 'flowchart', icon: <Database className="h-4 w-4" />, defaultWidth: 120, defaultHeight: 70, style: { borderRadius: '4px' }, color: shapeColors.data },
  { id: 'document', name: 'Document', category: 'flowchart', icon: <FileText className="h-4 w-4" />, defaultWidth: 120, defaultHeight: 80, style: { borderRadius: '4px' }, color: shapeColors.document },
  
  // UML
  { id: 'class', name: 'Class', category: 'uml', icon: <Square className="h-4 w-4" />, defaultWidth: 160, defaultHeight: 120, style: { borderRadius: '4px' }, color: shapeColors.class },
  { id: 'interface', name: 'Interface', category: 'uml', icon: <Circle className="h-4 w-4" />, defaultWidth: 160, defaultHeight: 100, style: { borderRadius: '4px', borderStyle: 'dashed' }, color: shapeColors.interface },
  { id: 'actor', name: 'Actor', category: 'uml', icon: <User className="h-4 w-4" />, defaultWidth: 60, defaultHeight: 100, style: {}, color: shapeColors.process },
  { id: 'usecase', name: 'Use Case', category: 'uml', icon: <Circle className="h-4 w-4" />, defaultWidth: 140, defaultHeight: 80, style: { borderRadius: '50%' }, color: shapeColors.process },
  
  // ERD
  { id: 'entity', name: 'Entity', category: 'erd', icon: <Square className="h-4 w-4" />, defaultWidth: 160, defaultHeight: 120, style: { borderRadius: '4px' }, color: shapeColors.entity },
  { id: 'attribute', name: 'Attribute', category: 'erd', icon: <Circle className="h-4 w-4" />, defaultWidth: 100, defaultHeight: 50, style: { borderRadius: '25px' }, color: shapeColors.attribute },
  { id: 'relationship-erd', name: 'Relationship', category: 'erd', icon: <Diamond className="h-4 w-4" />, defaultWidth: 100, defaultHeight: 60, style: {}, color: shapeColors.relationship },
  
  // Architecture
  { id: 'server', name: 'Server', category: 'architecture', icon: <Server className="h-4 w-4" />, defaultWidth: 100, defaultHeight: 120, style: { borderRadius: '8px' }, color: shapeColors.service },
  { id: 'database-arch', name: 'Database', category: 'architecture', icon: <Database className="h-4 w-4" />, defaultWidth: 80, defaultHeight: 100, style: { borderRadius: '8px' }, color: shapeColors.database },
  { id: 'cloud', name: 'Cloud', category: 'architecture', icon: <Cloud className="h-4 w-4" />, defaultWidth: 140, defaultHeight: 80, style: { borderRadius: '40px' }, color: shapeColors.external },
  { id: 'user-arch', name: 'User', category: 'architecture', icon: <Users className="h-4 w-4" />, defaultWidth: 80, defaultHeight: 80, style: { borderRadius: '50%' }, color: shapeColors.external },
  { id: 'api', name: 'API', category: 'architecture', icon: <Globe className="h-4 w-4" />, defaultWidth: 100, defaultHeight: 60, style: { borderRadius: '8px' }, color: shapeColors.service },
];

// ==========================================
// CUSTOM NODES
// ==========================================
const ResizableShapeNode: React.FC<NodeProps> = ({ data, selected }) => {
  const shapeType = data?.shapeType || 'rectangle';
  const shapeDef = shapeLibrary.find(s => s.id === shapeType) || shapeLibrary[0];
  const nodeColor = data?.color || shapeDef.color;
  const bgColor = data?.bgColor || '#FFFFFF';
  const textColor = data?.textColor || colors.neutral[800];
  
  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    backgroundColor: bgColor,
    border: `2px solid ${nodeColor}`,
    boxShadow: selected ? `0 0 0 2px ${nodeColor}40` : '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    ...shapeDef.style,
  };

  // Special rendering for diamond shape
  if (shapeType === 'decision' || shapeType === 'diamond' || shapeType === 'relationship-erd') {
    return (
      <>
        <NodeResizer
          color={nodeColor}
          isVisible={selected}
          minWidth={60}
          minHeight={60}
        />
        <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
        <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
        <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
        <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
        <div
          style={{
            ...baseStyle,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        >
          <span style={{ color: textColor, fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
            {data?.label || shapeDef.name}
          </span>
        </div>
      </>
    );
  }

  // Special rendering for actor
  if (shapeType === 'actor') {
    return (
      <>
        <NodeResizer color={nodeColor} isVisible={selected} minWidth={40} minHeight={60} />
        <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
        <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            border: `2px solid ${nodeColor}`,
            backgroundColor: bgColor,
            marginBottom: '4px'
          }} />
          <div style={{ 
            width: '2px', 
            height: '20px', 
            backgroundColor: nodeColor 
          }} />
          <div style={{ 
            width: '24px', 
            height: '2px', 
            backgroundColor: nodeColor,
            marginTop: '-10px'
          }} />
          <div className="flex" style={{ marginTop: '8px' }}>
            <div style={{ width: '2px', height: '20px', backgroundColor: nodeColor, transform: 'rotate(-20deg)' }} />
            <div style={{ width: '2px', height: '20px', backgroundColor: nodeColor, transform: 'rotate(20deg)', marginLeft: '-2px' }} />
          </div>
          <span style={{ color: textColor, fontSize: '10px', marginTop: '4px', textAlign: 'center' }}>
            {data?.label || 'Actor'}
          </span>
        </div>
      </>
    );
  }

  // Default shape rendering
  return (
    <>
      <NodeResizer
        color={nodeColor}
        isVisible={selected}
        minWidth={60}
        minHeight={40}
      />
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
      <div style={baseStyle}>
        {data?.icon && (
          <div style={{ marginBottom: '4px', color: nodeColor }}>
            {data.icon}
          </div>
        )}
        <span style={{ color: textColor, fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
          {data?.label || shapeDef.name}
        </span>
        {data?.subtitle && (
          <span style={{ color: colors.neutral[500], fontSize: '10px', marginTop: '2px' }}>
            {data.subtitle}
          </span>
        )}
      </div>
    </>
  );
};

const TextNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer color={colors.primary[500]} isVisible={selected} minWidth={50} minHeight={20} />
      <div
        style={{
          padding: '8px 12px',
          fontSize: data?.fontSize || '14px',
          fontWeight: data?.fontWeight || 400,
          color: data?.color || colors.neutral[800],
          backgroundColor: data?.bgColor || 'transparent',
          borderRadius: '4px',
          border: selected ? `1px dashed ${colors.primary[400]}` : '1px dashed transparent',
        }}
      >
        {data?.label || 'Text'}
      </div>
    </>
  );
};

const GroupNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <>
      <NodeResizer color={colors.primary[500]} isVisible={selected} minWidth={100} minHeight={100} />
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: data?.bgColor || `${colors.primary[100]}40`,
          border: `2px dashed ${data?.borderColor || colors.primary[300]}`,
          borderRadius: '12px',
          padding: '8px',
        }}
      >
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: colors.neutral[500],
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {data?.label || 'Group'}
        </span>
      </div>
    </>
  );
};

const StickyNoteNode: React.FC<NodeProps> = ({ data, selected }) => {
  const noteColor = data?.noteColor || '#FEF3C7';
  return (
    <>
      <NodeResizer color={colors.warning[500]} isVisible={selected} minWidth={100} minHeight={80} />
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: noteColor,
          borderRadius: '4px',
          padding: '12px',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          color: colors.neutral[700],
        }}
      >
        {data?.label || 'Note'}
      </div>
    </>
  );
};

// Node types mapping
const nodeTypes = {
  shape: ResizableShapeNode,
  text: TextNode,
  group: GroupNode,
  stickyNote: StickyNoteNode,
};

// Edge options
const edgeOptions = {
  style: { strokeWidth: 2, stroke: colors.neutral[400] },
  markerEnd: { type: MarkerType.ArrowClosed, color: colors.neutral[400] },
};

// ==========================================
// TOOLBAR COMPONENT
// ==========================================
interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: React.Dispatch<React.SetStateAction<CanvasState>>;
  onAddShape: (shapeId: string) => void;
  onAddText: () => void;
  onAddStickyNote: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onSave: () => void;
  onAlignNodes: (alignment: string) => void;
  onGroupNodes: () => void;
  onUngroupNodes: () => void;
  isSaving: boolean;
  hasSelection: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  canvasState,
  setCanvasState,
  onAddShape,
  onAddText,
  onAddStickyNote,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onExport,
  onSave,
  onAlignNodes,
  onGroupNodes,
  onUngroupNodes,
  isSaving,
  hasSelection,
}) => {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ShapeCategory>('basic');

  const categories: { id: ShapeCategory; name: string }[] = [
    { id: 'basic', name: 'Basic' },
    { id: 'flowchart', name: 'Flowchart' },
    { id: 'uml', name: 'UML' },
    { id: 'erd', name: 'ERD' },
    { id: 'architecture', name: 'Architecture' },
  ];

  const filteredShapes = shapeLibrary.filter(s => s.category === activeCategory);

  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-50">
      {/* Left toolbar */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-slate-200 p-1">
        {/* Selection tools */}
        <Button
          variant={canvasState.tool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCanvasState(s => ({ ...s, tool: 'select' }))}
          className="h-9 w-9 p-0"
          title="Select (V)"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
        <Button
          variant={canvasState.tool === 'pan' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCanvasState(s => ({ ...s, tool: 'pan' }))}
          className="h-9 w-9 p-0"
          title="Pan (H)"
        >
          <Hand className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Shapes dropdown */}
        <div className="relative">
          <Button
            variant={shapeMenuOpen ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShapeMenuOpen(!shapeMenuOpen)}
            className="h-9 px-3 gap-1"
          >
            <Square className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
          
          {shapeMenuOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[320px]">
              {/* Category tabs */}
              <div className="flex gap-1 mb-3 pb-2 border-b border-slate-100">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              
              {/* Shape grid */}
              <div className="grid grid-cols-4 gap-2">
                {filteredShapes.map(shape => (
                  <button
                    key={shape.id}
                    onClick={() => {
                      onAddShape(shape.id);
                      setShapeMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${shape.color}20`, color: shape.color }}
                    >
                      {shape.icon}
                    </div>
                    <span className="text-[10px] text-slate-600">{shape.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text & Notes */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddText}
          className="h-9 w-9 p-0"
          title="Add Text (T)"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddStickyNote}
          className="h-9 w-9 p-0"
          title="Sticky Note (N)"
        >
          <FileText className="h-4 w-4" />
        </Button>

        {/* Draw */}
        <Button
          variant={canvasState.tool === 'draw' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCanvasState(s => ({ ...s, tool: 'draw' }))}
          className="h-9 w-9 p-0"
          title="Draw (P)"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Connector */}
        <Button
          variant={canvasState.tool === 'connector' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCanvasState(s => ({ ...s, tool: 'connector' }))}
          className="h-9 w-9 p-0"
          title="Connector (C)"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Edit actions */}
        <Button variant="ghost" size="sm" onClick={onUndo} className="h-9 w-9 p-0" title="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} className="h-9 w-9 p-0" title="Redo (Ctrl+Y)">
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Selection actions */}
        <Button variant="ghost" size="sm" onClick={onCopy} disabled={!hasSelection} className="h-9 w-9 p-0" title="Copy (Ctrl+C)">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onPaste} className="h-9 w-9 p-0" title="Paste (Ctrl+V)">
          <ClipboardPaste className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} disabled={!hasSelection} className="h-9 w-9 p-0 text-red-500 hover:text-red-600" title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Center toolbar - Alignment */}
      {hasSelection && (
        <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-slate-200 p-1">
          <Button variant="ghost" size="sm" onClick={() => onAlignNodes('left')} className="h-9 w-9 p-0" title="Align Left">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAlignNodes('center')} className="h-9 w-9 p-0" title="Align Center">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAlignNodes('right')} className="h-9 w-9 p-0" title="Align Right">
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <Button variant="ghost" size="sm" onClick={() => onAlignNodes('top')} className="h-9 w-9 p-0" title="Align Top">
            <AlignStartVertical className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAlignNodes('middle')} className="h-9 w-9 p-0" title="Align Middle">
            <AlignCenterVertical className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAlignNodes('bottom')} className="h-9 w-9 p-0" title="Align Bottom">
            <AlignEndVertical className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <Button variant="ghost" size="sm" onClick={onGroupNodes} className="h-9 w-9 p-0" title="Group (Ctrl+G)">
            <Group className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onUngroupNodes} className="h-9 w-9 p-0" title="Ungroup (Ctrl+Shift+G)">
            <Ungroup className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right toolbar */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-slate-200 p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCanvasState(s => ({ ...s, gridVisible: !s.gridVisible }))}
          className="h-9 w-9 p-0"
          title="Toggle Grid"
        >
          <Grid3X3 className={`h-4 w-4 ${canvasState.gridVisible ? 'text-indigo-600' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCanvasState(s => ({ ...s, snapToGrid: !s.snapToGrid }))}
          className="h-9 w-9 p-0"
          title="Snap to Grid"
        >
          {canvasState.snapToGrid ? <Lock className="h-4 w-4 text-indigo-600" /> : <Unlock className="h-4 w-4" />}
        </Button>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <Button variant="ghost" size="sm" onClick={onExport} className="h-9 w-9 p-0" title="Export">
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="ml-1.5 text-xs">Save</span>
        </Button>
      </div>
    </div>
  );
};

// ==========================================
// LAYERS PANEL
// ==========================================
interface LayersPanelProps {
  nodes: Node[];
  onSelectNode: (nodeId: string) => void;
  onToggleVisibility: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  selectedNodes: string[];
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  nodes,
  onSelectNode,
  onToggleVisibility,
  onDeleteNode,
  selectedNodes,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute right-4 top-20 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200"
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Layers</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      
      {isOpen && (
        <div className="max-h-80 overflow-y-auto p-2">
          {nodes.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No elements on canvas</p>
          ) : (
            <div className="space-y-1">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedNodes.includes(node.id)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Square className="h-3 w-3" />
                    <span className="text-xs truncate max-w-[120px]">
                      {node.data?.label || node.type || 'Shape'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(node.id);
                      }}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      {node.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node.id);
                      }}
                      className="p-1 hover:bg-red-100 hover:text-red-600 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// PROPERTIES PANEL
// ==========================================
interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, data: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, onUpdateNode }) => {
  if (!selectedNode) return null;

  const colorPresets = [
    colors.primary[500],
    colors.success[500],
    colors.warning[500],
    colors.error[500],
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    colors.neutral[500],
  ];

  return (
    <div className="absolute left-4 top-20 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-40">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Properties</span>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Label</label>
          <input
            type="text"
            value={selectedNode.data?.label || ''}
            onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, label: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Color</label>
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateNode(selectedNode.id, { ...selectedNode.data, color })}
                className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                  selectedNode.data?.color === color ? 'border-slate-800' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Background */}
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Background</label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateNode(selectedNode.id, { ...selectedNode.data, bgColor: '#FFFFFF' })}
              className={`flex-1 py-2 text-xs border rounded-lg ${
                selectedNode.data?.bgColor === '#FFFFFF' || !selectedNode.data?.bgColor
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200'
              }`}
            >
              White
            </button>
            <button
              onClick={() => onUpdateNode(selectedNode.id, { ...selectedNode.data, bgColor: 'transparent' })}
              className={`flex-1 py-2 text-xs border rounded-lg ${
                selectedNode.data?.bgColor === 'transparent'
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200'
              }`}
            >
              Transparent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN CANVAS COMPONENT
// ==========================================
interface MiroCanvasProps {
  projectId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onAIGenerate?: (prompt: string) => Promise<{ nodes: Node[]; edges: Edge[] }>;
}

const MiroCanvasInner: React.FC<MiroCanvasProps> = ({
  projectId: _projectId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onAIGenerate: _onAIGenerate,
}) => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    tool: 'select',
    selectedShape: null,
    zoom: 1,
    gridVisible: true,
    snapToGrid: true,
    gridSize: 20,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const [_history, _setHistory] = useState<{ nodes: Node[][]; edges: Edge[][] }>({ nodes: [], edges: [] });
  const [_historyIndex, _setHistoryIndex] = useState(-1);

  const selectedNodes = nodes.filter(n => n.selected);
  const selectedNodeIds = selectedNodes.map(n => n.id);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  // Connection handler
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ 
        ...connection, 
        type: 'smoothstep',
        animated: false,
        style: { strokeWidth: 2, stroke: colors.neutral[400] },
        markerEnd: { type: MarkerType.ArrowClosed, color: colors.neutral[400] },
      }, eds));
    },
    [setEdges]
  );

  // Add shape
  const handleAddShape = useCallback((shapeId: string) => {
    const shapeDef = shapeLibrary.find(s => s.id === shapeId);
    if (!shapeDef) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: Node = {
      id: `${shapeId}-${Date.now()}`,
      type: 'shape',
      position,
      data: {
        label: shapeDef.name,
        shapeType: shapeId,
        color: shapeDef.color,
        bgColor: '#FFFFFF',
      },
      style: {
        width: shapeDef.defaultWidth,
        height: shapeDef.defaultHeight,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);

  // Add text
  const handleAddText = useCallback(() => {
    const position = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'text',
      position,
      data: { label: 'Double-click to edit' },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);

  // Add sticky note
  const handleAddStickyNote = useCallback(() => {
    const position = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: Node = {
      id: `note-${Date.now()}`,
      type: 'stickyNote',
      position,
      data: { label: 'Add note...', noteColor: '#FEF3C7' },
      style: { width: 200, height: 150 },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);

  // Delete selected
  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)));
  }, [setNodes, setEdges, selectedNodeIds]);

  // Copy
  const handleCopy = useCallback(() => {
    const selectedEdges = edges.filter(
      (e) => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
    );
    setClipboard({ nodes: selectedNodes, edges: selectedEdges });
  }, [selectedNodes, edges, selectedNodeIds]);

  // Paste
  const handlePaste = useCallback(() => {
    if (clipboard.nodes.length === 0) return;

    const offset = 50;
    const newNodes = clipboard.nodes.map((n) => ({
      ...n,
      id: `${n.id}-copy-${Date.now()}`,
      position: { x: n.position.x + offset, y: n.position.y + offset },
      selected: true,
    }));

    const idMap = new Map(clipboard.nodes.map((n, i) => [n.id, newNodes[i].id]));
    const newEdges = clipboard.edges.map((e) => ({
      ...e,
      id: `${e.id}-copy-${Date.now()}`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
    }));

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [clipboard, setNodes, setEdges]);

  // Undo/Redo (simplified)
  const handleUndo = useCallback(() => {
    // Placeholder - would need proper history management
  }, []);

  const handleRedo = useCallback(() => {
    // Placeholder
  }, []);

  // Export
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Save
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(nodes, edges);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, onSave]);

  // Align nodes
  const handleAlignNodes = useCallback((alignment: string) => {
    if (selectedNodes.length < 2) return;

    const positions = selectedNodes.map((n) => n.position);
    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...positions.map((p) => p.x));
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, position: { ...n.position, x: targetValue } } : n))
        );
        break;
      case 'center':
        const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, position: { ...n.position, x: avgX } } : n))
        );
        break;
      case 'right':
        targetValue = Math.max(...positions.map((p) => p.x));
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, position: { ...n.position, x: targetValue } } : n))
        );
        break;
      case 'top':
        targetValue = Math.min(...positions.map((p) => p.y));
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, position: { ...n.position, y: targetValue } } : n))
        );
        break;
      case 'middle':
        const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, position: { ...n.position, y: avgY } } : n))
        );
        break;
      case 'bottom':
        targetValue = Math.max(...positions.map((p) => p.y));
        setNodes((nds) =>
          nds.map((n) => (n.selected ? { ...n, position: { ...n.position, y: targetValue } } : n))
        );
        break;
    }
  }, [selectedNodes, setNodes]);

  // Group nodes
  const handleGroupNodes = useCallback(() => {
    if (selectedNodes.length < 2) return;

    const positions = selectedNodes.map((n) => n.position);
    const minX = Math.min(...positions.map((p) => p.x)) - 20;
    const minY = Math.min(...positions.map((p) => p.y)) - 40;
    const maxX = Math.max(...positions.map((p) => p.x + 150));
    const maxY = Math.max(...positions.map((p) => p.y + 100));

    const groupNode: Node = {
      id: `group-${Date.now()}`,
      type: 'group',
      position: { x: minX, y: minY },
      data: { label: 'Group' },
      style: {
        width: maxX - minX + 20,
        height: maxY - minY + 20,
        zIndex: -1,
      },
    };

    setNodes((nds) => [groupNode, ...nds]);
  }, [selectedNodes, setNodes]);

  // Ungroup
  const handleUngroupNodes = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !(n.selected && n.type === 'group')));
  }, [setNodes]);

  // Update node
  const handleUpdateNode = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
    );
  }, [setNodes]);

  // Select node from layers
  const handleSelectNode = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: n.id === nodeId }))
    );
  }, [setNodes]);

  // Toggle visibility
  const handleToggleVisibility = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, hidden: !n.hidden } : n))
    );
  }, [setNodes]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') handleCopy();
        if (e.key === 'v') handlePaste();
        if (e.key === 'z') handleUndo();
        if (e.key === 'y') handleRedo();
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
      if (e.key === 'v') setCanvasState((s) => ({ ...s, tool: 'select' }));
      if (e.key === 'h') setCanvasState((s) => ({ ...s, tool: 'pan' }));
      if (e.key === 'p') setCanvasState((s) => ({ ...s, tool: 'draw' }));
      if (e.key === 't') handleAddText();
      if (e.key === 'n') handleAddStickyNote();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDelete, handleCopy, handlePaste, handleUndo, handleRedo, handleSave, handleAddText, handleAddStickyNote]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: canvasColors.background.light }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        snapToGrid={canvasState.snapToGrid}
        snapGrid={[canvasState.gridSize, canvasState.gridSize]}
        panOnDrag={canvasState.tool === 'pan'}
        selectionOnDrag={canvasState.tool === 'select'}
        fitView
        attributionPosition="bottom-left"
      >
        {canvasState.gridVisible && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={canvasState.gridSize}
            size={1}
            color={canvasColors.grid.light}
          />
        )}
        <Controls position="bottom-left" className="!bg-white !rounded-xl !shadow-lg !border-slate-200" />
        <MiniMap
          position="bottom-right"
          className="!bg-white !rounded-xl !shadow-lg !border-slate-200"
          nodeColor={(node) => node.data?.color || colors.primary[500]}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>

      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        onAddShape={handleAddShape}
        onAddText={handleAddText}
        onAddStickyNote={handleAddStickyNote}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        onSave={handleSave}
        onAlignNodes={handleAlignNodes}
        onGroupNodes={handleGroupNodes}
        onUngroupNodes={handleUngroupNodes}
        isSaving={isSaving}
        hasSelection={selectedNodes.length > 0}
      />

      <LayersPanel
        nodes={nodes}
        onSelectNode={handleSelectNode}
        onToggleVisibility={handleToggleVisibility}
        onDeleteNode={handleDeleteNode}
        selectedNodes={selectedNodeIds}
      />

      {selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
        />
      )}
    </div>
  );
};

// Wrap with ReactFlowProvider
export const MiroCanvas: React.FC<MiroCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MiroCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default MiroCanvas;
