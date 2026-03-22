import React, { useState } from 'react';
import { phaseConfigs, phaseHexColors } from '@/constants/phases';

interface PhaseTreeProps {
  phaseStatus: Record<string, string>;
  phaseOutputs: Record<string, string>;
  onPhaseClick: (phaseId: string) => void;
}

const TREE_NODES: Array<{ id: string; x: number; y: number; label: string }> = [
  { id: 'planning',               x: 380, y: 500, label: 'Planning' },
  { id: 'feasibility_study',      x: 380, y: 420, label: 'Feasibility' },
  { id: 'requirements_gathering', x: 240, y: 330, label: 'Requirements' },
  { id: 'validation',             x: 520, y: 330, label: 'Validation' },
  { id: 'design',                 x: 150, y: 240, label: 'Design' },
  { id: 'development',            x: 360, y: 230, label: 'Development' },
  { id: 'tasks',                  x: 570, y: 240, label: 'Tasks' },
  { id: 'cost_benefit',           x: 220, y: 145, label: 'Costs' },
  { id: 'risks',                  x: 500, y: 145, label: 'Risks' },
  { id: 'summary',                x: 360, y: 58,  label: 'Summary' },
];

const BRANCHES: Array<[string, string]> = [
  ['planning',               'feasibility_study'],
  ['feasibility_study',      'requirements_gathering'],
  ['feasibility_study',      'validation'],
  ['requirements_gathering', 'design'],
  ['requirements_gathering', 'development'],
  ['validation',             'tasks'],
  ['design',                 'cost_benefit'],
  ['tasks',                  'risks'],
  ['cost_benefit',           'summary'],
  ['risks',                  'summary'],
  ['development',            'summary'],
];

const nodeMap = Object.fromEntries(TREE_NODES.map(n => [n.id, n]));

function getNodeColors(phaseId: string, phaseStatus: Record<string, string>, isHovered: boolean) {
  const status = (phaseStatus[phaseId] || 'locked').toLowerCase();
  const phaseColor = phaseHexColors[phaseId];

  if (status === 'locked') {
    return {
      fill: '#142b1a',
      stroke: isHovered ? (phaseColor?.fill || '#4ade80') : '#1e4a28',
      text: '#3d6b4a',
    };
  }
  if (status === 'completed') {
    return {
      fill: phaseColor?.fill || '#22c55e',
      stroke: isHovered ? '#fff' : (phaseColor?.fill || '#22c55e'),
      text: phaseColor?.text || '#0a150e',
    };
  }
  // active / in_progress / ready
  return {
    fill: `${phaseColor?.fill || '#fbbf24'}cc`,
    stroke: isHovered ? '#fff' : (phaseColor?.fill || '#fbbf24'),
    text: phaseColor?.text || '#0a150e',
  };
}

export const PhaseTree: React.FC<PhaseTreeProps> = ({ phaseStatus, phaseOutputs, onPhaseClick }) => {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  const hoveredNode = hoveredPhase ? nodeMap[hoveredPhase] : null;
  const hoveredPhaseConfig = hoveredPhase ? phaseConfigs.find(p => p.id === hoveredPhase) : null;
  const hoveredColors = hoveredPhase ? getNodeColors(hoveredPhase, phaseStatus, true) : null;

  return (
    <div className="relative w-full select-none" style={{ height: '580px' }}>
      <svg width="100%" height="100%" viewBox="0 0 760 580" preserveAspectRatio="xMidYMid meet">
        {/* Roots */}
        <line x1="380" y1="580" x2="380" y2="500" stroke="#3d2b1f" strokeWidth="16" strokeLinecap="round" />
        <line x1="380" y1="560" x2="330" y2="578" stroke="#2c1810" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <line x1="380" y1="560" x2="430" y2="578" stroke="#2c1810" strokeWidth="9" strokeLinecap="round" opacity="0.6" />
        <line x1="380" y1="565" x2="355" y2="576" stroke="#2c1810" strokeWidth="5" strokeLinecap="round" opacity="0.4" />

        {/* Branches */}
        {BRANCHES.map(([from, to], i) => {
          const f = nodeMap[from];
          const t = nodeMap[to];
          if (!f || !t) return null;
          const isActive = hoveredPhase === from || hoveredPhase === to;
          const fromColor = phaseHexColors[from]?.fill || '#2d6a3f';
          const toColor = phaseHexColors[to]?.fill || '#2d6a3f';
          const cx1 = f.x, cy1 = (f.y + t.y) / 2;
          const cx2 = t.x, cy2 = (f.y + t.y) / 2;
          return (
            <path key={i}
              d={`M ${f.x} ${f.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`}
              stroke={isActive ? fromColor : '#2d6a3f'}
              strokeWidth={isActive ? 4 : 2.5}
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
            />
          );
        })}

        {/* Phase nodes */}
        {TREE_NODES.map((node) => {
          const config = phaseConfigs.find(p => p.id === node.id);
          const isHovered = hoveredPhase === node.id;
          const { fill, stroke, text } = getNodeColors(node.id, phaseStatus, isHovered);
          const hasOutput = Boolean(phaseOutputs[node.id]);
          const phaseColor = phaseHexColors[node.id];
          const r = isHovered ? 47 : 41;
          const status = (phaseStatus[node.id] || 'locked').toLowerCase();

          return (
            <g key={node.id}
              onClick={() => onPhaseClick(node.id)}
              onMouseEnter={() => setHoveredPhase(node.id)}
              onMouseLeave={() => setHoveredPhase(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow ring */}
              {isHovered && (
                <circle cx={node.x} cy={node.y} r={r + 16}
                  fill={fill} fillOpacity="0.14"
                  style={{ transition: 'all 0.25s ease' }}
                />
              )}
              {/* Leaf body */}
              <circle
                cx={node.x} cy={node.y} r={r}
                fill={fill}
                stroke={stroke}
                strokeWidth={isHovered ? 3 : 1.5}
                style={{
                  filter: isHovered && phaseColor ? `drop-shadow(0 0 12px ${phaseColor.glow})` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              {/* Step number */}
              <text x={node.x} y={node.y - 8} textAnchor="middle"
                fill={text} fontSize="10" fontWeight="800"
                fontFamily="Inter, system-ui, sans-serif"
                style={{ pointerEvents: 'none', opacity: status === 'locked' ? 0.5 : 1 }}>
                {config?.stepNumber ?? ''}
              </text>
              {/* Label */}
              <text x={node.x} y={node.y + 8} textAnchor="middle"
                fill={text} fontSize="8.5" fontWeight="600"
                fontFamily="Inter, system-ui, sans-serif"
                style={{ pointerEvents: 'none', opacity: status === 'locked' ? 0.5 : 1 }}>
                {node.label}
              </text>
              {/* Output dot (has AI content) */}
              {hasOutput && (
                <circle cx={node.x + r - 10} cy={node.y - r + 10} r={7}
                  fill="#fbbf24" stroke="#0a150e" strokeWidth="1.5" />
              )}
              {/* Lock icon for locked phases */}
              {status === 'locked' && !isHovered && (
                <text x={node.x} y={node.y + 24} textAnchor="middle"
                  fill="#2d6a3f" fontSize="10" style={{ pointerEvents: 'none' }}>
                  🔒
                </text>
              )}
            </g>
          );
        })}

        {/* Ground shadow */}
        <ellipse cx="380" cy="578" rx="75" ry="5" fill="#1e4a28" fillOpacity="0.4" />
      </svg>

      {/* Color legend */}
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-5 text-xs" style={{ color: '#4a7a56' }}>
        {[
          { color: '#22c55e', label: 'Completed' },
          { color: '#fbbf24', label: 'Active' },
          { color: '#142b1a', label: 'Locked', border: '#1e4a28' },
        ].map(({ color, label, border }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block"
              style={{ background: color, border: border ? `1px solid ${border}` : 'none' }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-[#fbbf24]" />
          <span className="text-[#fbbf24]">•</span> Has AI content
        </span>
      </div>

      {/* Hover tooltip */}
      {hoveredPhase && hoveredNode && hoveredPhaseConfig && hoveredColors && (
        <div
          className="absolute pointer-events-none text-center z-10"
          style={{
            left: '50%',
            bottom: '36px',
            transform: 'translateX(-50%)',
            background: '#0f1f15',
            border: `1px solid ${hoveredColors.stroke}55`,
            borderRadius: '14px',
            padding: '10px 20px',
            minWidth: '230px',
            boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${hoveredColors.stroke}22`,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: hoveredColors.fill !== '#142b1a' ? hoveredColors.stroke : '#2d6a3f' }} />
            <p style={{ color: hoveredColors.fill !== '#142b1a' ? hoveredColors.stroke : '#4ade80', fontSize: '13px', fontWeight: 700 }}>
              {hoveredPhaseConfig.title}
            </p>
          </div>
          <p style={{ color: '#4a7a56', fontSize: '11px' }}>
            {hoveredPhaseConfig.description}
          </p>
          <p style={{ color: '#6b9e7a', fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Step {hoveredPhaseConfig.stepNumber} · {(phaseStatus[hoveredPhase] || 'locked').replace('_', ' ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PhaseTree;
