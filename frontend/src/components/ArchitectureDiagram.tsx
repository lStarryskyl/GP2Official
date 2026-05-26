import React, { useState } from 'react';

interface ComponentNode {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'external' | 'cache' | 'queue';
  description?: string;
}

interface Connection {
  from: string;
  to: string;
  label?: string;
}

interface ArchitectureData {
  components: ComponentNode[];
  connections: Connection[];
}

const TYPE_COLORS: Record<string, { bg: string; border: string; label: string; icon: string }> = {
  frontend:  { bg: '#1a1008', border: '#D4A017', label: '#D4A017',  icon: '⬡' },
  backend:   { bg: '#1a1008', border: '#c8870f', label: '#e8bf40',  icon: '⬢' },
  database:  { bg: '#1a1008', border: '#8B5E3C', label: '#c8895a',  icon: '🗄' },
  external:  { bg: '#1a1008', border: '#5a9e6a', label: '#7aba8a',  icon: '⊕' },
  cache:     { bg: '#1a1008', border: '#a86d0e', label: '#e8bf40',  icon: '⚡' },
  queue:     { bg: '#1a1008', border: '#6B4C8A', label: '#a080c8',  icon: '⇌' },
};

const COL_ORDER = ['external', 'frontend', 'cache', 'backend', 'queue', 'database'];

export function parseArchitectureJson(markdown: string): ArchitectureData | null {
  try {
    const match = markdown.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return null;
    const data = JSON.parse(match[1]);
    if (!data.components || !Array.isArray(data.components)) return null;
    return data as ArchitectureData;
  } catch {
    return null;
  }
}

export const ArchitectureDiagram: React.FC<{ data: ArchitectureData }> = ({ data }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const NODE_W = 150;
  const NODE_H = 72;
  const COL_GAP = 210;
  const ROW_GAP = 110;
  const PAD_X = 40;
  const PAD_Y = 40;

  const colMap: Record<string, number> = {};
  COL_ORDER.forEach((t, i) => { colMap[t] = i; });

  const byCol: Record<number, ComponentNode[]> = {};
  data.components.forEach(c => {
    const col = colMap[c.type] ?? 1;
    if (!byCol[col]) byCol[col] = [];
    byCol[col].push(c);
  });

  const usedCols = Object.keys(byCol).map(Number).sort((a, b) => a - b);
  const colIndexMap: Record<number, number> = {};
  usedCols.forEach((c, i) => { colIndexMap[c] = i; });

  const nodes = data.components.map(c => {
    const originalCol = colMap[c.type] ?? 1;
    const colIndex = colIndexMap[originalCol];
    const rowIndex = byCol[originalCol].indexOf(c);
    const x = PAD_X + colIndex * COL_GAP;
    const y = PAD_Y + rowIndex * ROW_GAP;
    return { ...c, x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 };
  });

  const totalW = Math.max(PAD_X * 2 + (usedCols.length - 1) * COL_GAP + NODE_W, 600);
  const maxRows = Math.max(...Object.values(byCol).map(a => a.length), 1);
  const totalH = PAD_Y * 2 + (maxRows - 1) * ROW_GAP + NODE_H;

  const getNode = (id: string) => nodes.find(n => n.id === id);

  type LayoutNode = ComponentNode & { x: number; y: number; cx: number; cy: number };
  const getEdgePath = (from: LayoutNode, to: LayoutNode) => {
    const startX = from.x + NODE_W;
    const startY = from.cy;
    const endX = to.x;
    const endY = to.cy;
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  const typeLabels: Record<string, string> = {
    frontend: 'Frontend', backend: 'Backend', database: 'Database',
    external: 'External', cache: 'Cache', queue: 'Queue'
  };

  const uniqueTypes = [...new Set(data.components.map(c => c.type))];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0702', border: '1px solid #3d2412' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #3d2412' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: '#D4A017', fontSize: 14, fontWeight: 700 }}>System Architecture</span>
          <span style={{ background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)', color: '#D4A017', fontSize: 10, padding: '1px 8px', borderRadius: 99, fontWeight: 600, letterSpacing: '0.08em' }}>
            AI GENERATED
          </span>
        </div>
        <div className="flex items-center gap-3">
          {uniqueTypes.map(t => (
            <div key={t} className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, borderRadius: 2, border: `2px solid ${TYPE_COLORS[t]?.border || '#D4A017'}` }} />
              <span style={{ color: '#8a7055', fontSize: 10, fontWeight: 500 }}>{typeLabels[t] || t}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto', padding: '16px 0' }}>
        <svg width={totalW} height={totalH} style={{ display: 'block', margin: '0 auto' }}>
          <defs>
            <marker id="arrowAmber" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#D4A017" opacity="0.7" />
            </marker>
            <filter id="glowAmber">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {data.connections?.map((conn, i) => {
            const from = getNode(conn.from) as any;
            const to = getNode(conn.to) as any;
            if (!from || !to) return null;
            const isHighlighted = hoveredNode === conn.from || hoveredNode === conn.to;
            const midX = ((from.x + NODE_W) + to.x) / 2;
            const midY = (from.cy + to.cy) / 2;
            return (
              <g key={i}>
                <path
                  d={getEdgePath(from, to)}
                  fill="none"
                  stroke={isHighlighted ? '#D4A017' : '#3d2412'}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  strokeOpacity={isHighlighted ? 0.9 : 0.5}
                  markerEnd="url(#arrowAmber)"
                  strokeDasharray={isHighlighted ? 'none' : '4 3'}
                  style={{ transition: 'all 0.3s ease', filter: isHighlighted ? 'url(#glowAmber)' : 'none' }}
                />
                {conn.label && isHighlighted && (
                  <text x={midX} y={midY - 6} textAnchor="middle" fill="#D4A017" fontSize="10" fontWeight="600"
                    style={{ pointerEvents: 'none' }}>
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map(node => {
            const colors = TYPE_COLORS[node.type] || TYPE_COLORS.backend;
            const isHovered = hoveredNode === node.id;
            return (
              <g key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <rect
                  width={NODE_W} height={NODE_H} rx="10"
                  fill={isHovered ? '#221508' : '#1a1008'}
                  stroke={colors.border}
                  strokeWidth={isHovered ? 2 : 1.5}
                  strokeOpacity={isHovered ? 1 : 0.6}
                  style={{ filter: isHovered ? `drop-shadow(0 0 8px ${colors.border}60)` : 'none', transition: 'all 0.2s ease' }}
                />
                <text x={NODE_W / 2} y={26} textAnchor="middle" fill={colors.label} fontSize="11" fontWeight="700"
                  style={{ pointerEvents: 'none' }}>
                  {node.name}
                </text>
                {node.description && (
                  <text x={NODE_W / 2} y={46} textAnchor="middle" fill="#8a7055" fontSize="9"
                    style={{ pointerEvents: 'none' }}>
                    {node.description.length > 22 ? node.description.slice(0, 22) + '…' : node.description}
                  </text>
                )}
                <text x={NODE_W - 10} y={NODE_H - 8} textAnchor="end" fill={colors.border} fontSize="8" opacity="0.5"
                  style={{ pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ padding: '8px 20px 12px', borderTop: '1px solid #1a1008', color: '#5c3820', fontSize: 10, textAlign: 'center' }}>
        Hover over components to highlight connections
      </div>
    </div>
  );
};
