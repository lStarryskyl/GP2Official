import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import {
  Plus, Search, Trash2, Edit3, ExternalLink, MoreVertical,
  Grid3X3, List, Calendar, FileText, Clock, CheckCircle,
  AlertCircle, Loader2, TrendingUp
} from 'lucide-react';
import type { Project } from '@/types';

// ── Acorn SVG ────────────────────────────────────────────────────────────────
const AcornSVG: React.FC<{ size?: number; golden?: boolean; className?: string }> = ({
  size = 48, golden = false, className = ''
}) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 48 60" fill="none" className={className}>
    {golden && <ellipse cx="24" cy="54" rx="20" ry="5" fill="rgba(212,160,23,0.3)" />}
    <ellipse cx="24" cy="18" rx="17" ry="10" fill={golden ? '#5c3820' : '#3d2412'} />
    <ellipse cx="24" cy="18" rx="13" ry="7" fill={golden ? '#3d2412' : '#221508'} />
    <rect x="22" y="8" width="4" height="12" rx="2" fill={golden ? '#3d2412' : '#221508'} />
    <ellipse cx="24" cy="42" rx="16" ry="20" fill={golden ? '#D4A017' : '#8B5E3C'} />
    <ellipse cx="24" cy="37" rx="13" ry="17" fill={golden ? '#e8bf40' : '#c8895a'} />
    <ellipse cx="18" cy="33" rx="4" ry="6" fill="rgba(255,255,255,0.12)" />
    {golden && (
      <>
        <ellipse cx="36" cy="22" rx="3" ry="3" fill="#f5df90" opacity="0.8" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        <ellipse cx="38" cy="28" rx="2" ry="2" fill="#f5df90" opacity="0.6" />
      </>
    )}
  </svg>
);

// ── Shared leaf path helper ───────────────────────────────────────────────────
const leafPathStr = (cx: number, cy: number, rx: number, ry: number): string => {
  const t = cy - ry;
  const b = cy + ry * 0.55;
  const ml = cx - rx * 0.92;
  const mr = cx + rx * 0.92;
  return (
    `M ${cx} ${t} ` +
    `C ${mr} ${t + ry * 0.35}, ${mr} ${b - ry * 0.2}, ${cx} ${b} ` +
    `C ${ml} ${b - ry * 0.2}, ${ml} ${t + ry * 0.35}, ${cx} ${t} Z`
  );
};

// ── Leaf SVG (live project = green leaf) ─────────────────────────────────────
const LeafSVG: React.FC<{ size?: number; color?: string }> = ({ size = 44, color = '#3d7a4a' }) => {
  const cx = size / 2, cy = size / 2, rx = size * 0.44, ry = size * 0.48;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={leafPathStr(cx, cy, rx, ry)} fill={color} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <line x1={cx} y1={cy - ry * 0.8} x2={cx} y2={cy + ry * 0.4}
        stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx} y1={cy - ry * 0.3} x2={cx - rx * 0.55} y2={cy + ry * 0.15}
        stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" />
      <line x1={cx} y1={cy - ry * 0.3} x2={cx + rx * 0.55} y2={cy + ry * 0.15}
        stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};

// ── Living Projects Tree SVG ─────────────────────────────────────────────────
interface ProjectNodeData {
  project: Project;
  x: number;
  y: number;
  angle: number;
  branchLength: number;
}

const ProjectsTree: React.FC<{
  projects: Project[];
  onProjectClick: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onNewProject: () => void;
}> = ({ projects, onProjectClick, onDeleteProject, onNewProject }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Arrange projects in a tree
  const nodeData: ProjectNodeData[] = projects.slice(0, 12).map((p, i) => {
    const total = Math.max(projects.length, 1);
    const angle = -90 + (i / Math.max(total, 1)) * 180;
    const rad = (angle * Math.PI) / 180;
    const branchLength = 130 + (i % 3) * 35;
    const spread = (i % 2 === 0 ? -1 : 1) * (30 + (Math.floor(i / 2) * 20));
    return {
      project: p,
      x: 400 + Math.cos(rad) * branchLength + spread,
      y: 300 - Math.abs(Math.sin(rad)) * branchLength * 0.8 + (i % 3) * 10,
      angle,
      branchLength,
    };
  });

  const isCompleted = (p: Project) =>
    (p.status || '').toLowerCase() === 'completed';
  const isActive = (p: Project) =>
    ['active', 'planning', 'in_progress'].includes((p.status || '').toLowerCase());

  const getNodeColor = (p: Project) => {
    if (isCompleted(p)) return '#D4A017';
    if (isActive(p)) return '#3d7a4a';
    return '#5c3820';
  };

  const selectedProject = projects.find(p => (p.id || p.project_id) === selected);

  return (
    <div className="relative w-full" style={{ height: 600 }}>
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        {/* Ground shadow */}
        <ellipse cx="400" cy="598" rx="120" ry="10" fill="#0c0702" fillOpacity="0.6" />

        {/* Roots */}
        {[
          [400, 560, 340, 598, 8],
          [400, 570, 460, 598, 8],
          [400, 575, 290, 598, 6],
          [400, 580, 510, 598, 6],
          [400, 585, 240, 598, 4],
          [400, 580, 555, 598, 4],
        ].map(([x1, y1, x2, y2, w], i) => (
          <line key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#2c1b0e" strokeWidth={w} strokeLinecap="round"
            opacity={0.8 - i * 0.08}
          />
        ))}

        {/* Trunk — tapered closed polygon: wide at base, narrow at top */}
        <path d="M 384 560 C 383 540, 387 500, 386 450 C 387 410, 390 375, 392 340
                 L 408 340 C 410 375, 413 410, 414 450 C 413 500, 417 540, 416 560 Z"
          fill="#3d2412" />
        <path d="M 388 560 C 387 540, 390 500, 390 450 C 390 415, 392 380, 394 345
                 L 406 345 C 408 380, 410 415, 410 450 C 410 500, 413 540, 412 560 Z"
          fill="#5c3820" fillOpacity="0.5" />
        <path d="M 394 560 C 394 540, 396 500, 396 450 C 396 425, 397 395, 398 355
                 L 402 355 C 403 395, 404 425, 404 450 C 404 500, 406 540, 406 560 Z"
          fill="#8B5E3C" fillOpacity="0.25" />

        {/* Branch to each project */}
        {nodeData.map((nd, i) => {
          const proj = nd.project;
          const pid = proj.id || proj.project_id || '';
          const midX = (400 + nd.x) / 2;
          const midY = (340 + nd.y) / 2;
          const branchColor = isCompleted(proj) ? '#8B5E3C' : '#3d2412';
          const isHov = hovered === pid;

          return (
            <path key={pid}
              d={`M 400 340 C ${midX} ${midY - 30}, ${nd.x} ${nd.y + 30}, ${nd.x} ${nd.y}`}
              stroke={isHov ? '#5c3820' : branchColor}
              strokeWidth={isHov ? 5 : 3.5}
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
            />
          );
        })}

        {/* "New Project" bud */}
        <g
          onClick={onNewProject}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHovered('__new')}
          onMouseLeave={() => setHovered(null)}
        >
          <ellipse cx="400" cy="320"
            rx={hovered === '__new' ? 30 : 24} ry={hovered === '__new' ? 34 : 28}
            fill={hovered === '__new' ? 'rgba(212,160,23,0.2)' : 'rgba(212,160,23,0.08)'}
            stroke="#D4A017" strokeWidth="2" strokeDasharray="5 3"
            style={{ transition: 'all 0.3s ease' }}
          />
          <text x="400" y="316" textAnchor="middle" fill="#D4A017" fontSize="18" fontWeight="700">+</text>
          <text x="400" y="330" textAnchor="middle" fill="#D4A017" fontSize="7.5" fontWeight="600">New Project</text>
        </g>

        {/* Project nodes */}
        {nodeData.map((nd) => {
          const proj = nd.project;
          const pid  = proj.id || proj.project_id || '';
          const isHov = hovered === pid;
          const done  = isCompleted(proj);
          const active = isActive(proj);
          const rx = isHov ? 48 : 42;
          const ry = isHov ? 56 : 50;

          return (
            <g key={pid}
              onClick={() => { setSelected(sel => sel === pid ? null : pid); onProjectClick(pid); }}
              onMouseEnter={() => setHovered(pid)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow halo */}
              <ellipse cx={nd.x} cy={nd.y} rx={rx + 18} ry={ry + 18}
                fill={getNodeColor(proj)}
                fillOpacity={isHov ? 0.18 : 0.05}
                style={{ transition: 'all 0.35s ease' }}
              />

              {done ? (
                /* Completed → full acorn shape */
                <g style={{ transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isHov ? 'drop-shadow(0 0 16px rgba(212,160,23,0.65))' : 'none' }}>
                  {/* body */}
                  <ellipse cx={nd.x} cy={nd.y + ry * 0.22} rx={rx * 0.85} ry={ry * 0.78}
                    fill="#D4A017"
                    stroke={isHov ? '#f5df90' : 'rgba(212,160,23,0.4)'}
                    strokeWidth={isHov ? 2.5 : 1.5}
                  />
                  <ellipse cx={nd.x} cy={nd.y + ry * 0.22} rx={rx * 0.68} ry={ry * 0.63}
                    fill="#e8bf40" fillOpacity="0.55"
                  />
                  {/* cap */}
                  <ellipse cx={nd.x} cy={nd.y - ry * 0.42} rx={rx * 0.92} ry={ry * 0.36}
                    fill="#3d2412"
                  />
                  <ellipse cx={nd.x} cy={nd.y - ry * 0.42} rx={rx * 0.74} ry={ry * 0.26}
                    fill="#221508"
                  />
                  {/* stem */}
                  <rect x={nd.x - rx * 0.1} y={nd.y - ry * 0.86} width={rx * 0.2} height={ry * 0.48}
                    rx={rx * 0.08} fill="#221508"
                  />
                  {/* shine */}
                  <ellipse cx={nd.x - rx * 0.26} cy={nd.y + ry * 0.0} rx={rx * 0.14} ry={ry * 0.22}
                    fill="rgba(255,255,255,0.12)"
                  />
                </g>
              ) : active ? (
                /* Active → filled leaf shape */
                <g style={{ transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isHov ? 'drop-shadow(0 0 14px rgba(90,158,106,0.5))' : 'none' }}>
                  <path
                    d={leafPathStr(nd.x, nd.y, rx, ry)}
                    fill="#2d5c35"
                    stroke={isHov ? '#5a9e6a' : 'rgba(93,158,106,0.35)'}
                    strokeWidth={isHov ? 2.5 : 1.5}
                  />
                  <line x1={nd.x} y1={nd.y - ry * 0.8} x2={nd.x} y2={nd.y + ry * 0.4}
                    stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={nd.x} y1={nd.y - ry * 0.25} x2={nd.x - rx * 0.52} y2={nd.y + ry * 0.12}
                    stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
                  <line x1={nd.x} y1={nd.y - ry * 0.25} x2={nd.x + rx * 0.52} y2={nd.y + ry * 0.12}
                    stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
                </g>
              ) : (
                /* Draft → outline/bare leaf */
                <g style={{ transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: isHov ? 'drop-shadow(0 0 12px rgba(139,94,60,0.4))' : 'none' }}>
                  <path
                    d={leafPathStr(nd.x, nd.y, rx, ry)}
                    fill="#3d2412"
                    stroke={isHov ? '#8B5E3C' : 'rgba(92,56,32,0.5)'}
                    strokeWidth={isHov ? 2.5 : 1.5}
                    strokeDasharray="4 3"
                  />
                  <line x1={nd.x} y1={nd.y - ry * 0.8} x2={nd.x} y2={nd.y + ry * 0.4}
                    stroke="rgba(139,94,60,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              )}

              {/* Project name */}
              <text x={nd.x} y={nd.y + (done ? ry * 0.28 : 6)} textAnchor="middle"
                fill={done ? '#0c0702' : active ? '#f0e4c8' : '#c8b090'}
                fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none' }}>
                {proj.name.length > 12 ? proj.name.slice(0, 12) + '…' : proj.name}
              </text>
            </g>
          );
        })}

        {/* Ambient particles */}
        {[0,1,2,3,4,5].map(i => (
          <ellipse key={i}
            cx={100 + i * 110} cy={40 + (i % 3) * 25} rx={2 + i % 2} ry={2 + i % 2}
            fill="#D4A017" fillOpacity={0.12 + i * 0.04}
            style={{ animation: `float ${4 + i * 0.8}s ease-in-out ${i * 0.5}s infinite` }}
          />
        ))}
      </svg>

      {/* Info panel for selected/hovered project (shown next to tree) */}
      {hovered && hovered !== '__new' && (() => {
        const proj = projects.find(p => (p.id || p.project_id) === hovered);
        if (!proj) return null;
        const pid = proj.id || proj.project_id || '';
        const done = isCompleted(proj);
        const active = isActive(proj);
        return (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl p-5 z-20 pointer-events-none"
            style={{
              width: 240,
              background: '#1a1008',
              border: `1px solid ${done ? 'rgba(212,160,23,0.35)' : active ? 'rgba(90,158,106,0.3)' : 'rgba(61,36,18,0.6)'}`,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              animation: 'revealRight 0.2s ease-out',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{done ? '🌰' : active ? '🍃' : '🌿'}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: done ? 'rgba(212,160,23,0.15)' : active ? 'rgba(90,158,106,0.15)' : 'rgba(61,36,18,0.5)',
                  color: done ? '#D4A017' : active ? '#5a9e6a' : '#8a7055',
                }}>
                {done ? 'Completed' : active ? 'Active' : 'Draft'}
              </span>
            </div>
            <h4 className="font-bold mb-1 text-sm" style={{ color: '#f0e4c8' }}>{proj.name}</h4>
            <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#8a7055' }}>
              {proj.description || 'No description provided'}
            </p>
            <p className="text-xs" style={{ color: '#5c3820' }}>
              {new Date(proj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        );
      })()}
    </div>
  );
};

// ── Project Card (list/grid view) ────────────────────────────────────────────
const ProjectCard: React.FC<{
  project: Project;
  viewMode: 'grid' | 'list';
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ project, viewMode, index, onOpen, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const status = (project.status || 'draft').toLowerCase();
  const done = status === 'completed';
  const active = ['active', 'planning', 'in_progress'].includes(status);

  const statusConfig = done
    ? { icon: CheckCircle,  color: '#D4A017', bg: 'rgba(212,160,23,0.12)', border: 'rgba(212,160,23,0.3)', label: 'Completed', emoji: '🌰' }
    : active
    ? { icon: Loader2,      color: '#5a9e6a', bg: 'rgba(90,158,106,0.12)', border: 'rgba(90,158,106,0.3)', label: 'Active', emoji: '🍃' }
    : { icon: Clock,        color: '#8a7055', bg: 'rgba(61,36,18,0.3)',    border: 'rgba(92,56,32,0.4)', label: 'Draft', emoji: '🌿' };

  const Icon = statusConfig.icon;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-5 p-4 rounded-xl cursor-pointer transition-all duration-300 animate-reveal-up"
        style={{
          background: hovered ? '#221508' : '#1a1008',
          border: `1px solid ${hovered ? 'rgba(212,160,23,0.25)' : '#3d2412'}`,
          animationDelay: `${index * 50}ms`,
        }}
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}` }}>
          {statusConfig.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate transition-colors" style={{ color: hovered ? '#D4A017' : '#f0e4c8' }}>
            {project.name}
          </h3>
          <p className="text-sm truncate" style={{ color: '#8a7055' }}>
            {project.description || 'No description'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}>
          <Icon className="w-3 h-3" />
          {statusConfig.label}
        </div>
        <div className="text-sm hidden md:block flex-shrink-0" style={{ color: '#5c3820' }}>
          {formatDate(project.created_at)}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 animate-reveal-up"
      style={{
        background: '#1a1008',
        border: `1px solid ${hovered ? 'rgba(212,160,23,0.3)' : '#3d2412'}`,
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.4)' : 'none',
        animationDelay: `${index * 75}ms`,
      }}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top shine */}
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.6), transparent)',
          opacity: hovered ? 1 : 0,
        }} />

      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}>
          <span>{statusConfig.emoji}</span>
          {statusConfig.label}
        </div>

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            style={{ color: '#8a7055', background: '#2c1b0e' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 rounded-xl overflow-hidden z-10"
              style={{ background: '#221508', border: '1px solid #3d2412', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                style={{ color: '#c8b090' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2c1b0e')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => { setMenuOpen(false); onOpen(); }}
              >
                <Edit3 className="w-3.5 h-3.5" /> Open
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => { setMenuOpen(false); onDelete(); }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2 line-clamp-1 transition-colors"
        style={{ color: hovered ? '#D4A017' : '#f0e4c8' }}>
        {project.name}
      </h3>
      <p className="text-sm mb-4 line-clamp-2" style={{ color: '#8a7055' }}>
        {project.description || 'No description provided'}
      </p>

      <div className="flex items-center justify-between text-xs" style={{ color: '#5c3820' }}>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(project.created_at)}
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {project.template_type || 'Custom'}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'list'>('tree');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadProjects();
    setIsVisible(true);
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.deleteProject(projectId);
      setProjects(prev => prev.filter(p => (p.id || p.project_id) !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: projects.length,
    active: projects.filter(p => ['active', 'planning', 'in_progress'].includes((p.status || '').toLowerCase())).length,
    completed: projects.filter(p => (p.status || '').toLowerCase() === 'completed').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🌰</div>
            <p className="text-lg" style={{ color: '#8a7055' }}>Growing your forest…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-12">

        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #D4A017, #8B5E3C)' }} />
                <h1 className="text-4xl font-bold" style={{ color: '#f0e4c8' }}>The Grove</h1>
              </div>
              <p className="ml-5 text-lg" style={{ color: '#8a7055' }}>
                Each project grows from a seed into a golden acorn
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center rounded-xl p-1" style={{ background: '#1a1008', border: '1px solid #3d2412' }}>
                {([['tree', '🌳'], ['grid', '⊞'], ['list', '≡']] as [typeof viewMode, string][]).map(([mode, icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: viewMode === mode ? '#D4A017' : 'transparent',
                      color: viewMode === mode ? '#130c07' : '#8a7055',
                    }}>
                    {icon}
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate('/projects/new')}
                className="btn-primary"
                data-testid="new-project-btn"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {projects.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Seeds', value: stats.total, emoji: '🌿', color: '#8a7055' },
              { label: 'Growing', value: stats.active, emoji: '🍃', color: '#5a9e6a' },
              { label: 'Acorns', value: stats.completed, emoji: '🌰', color: '#D4A017' },
            ].map(({ label, value, emoji, color }) => (
              <div key={label} className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: '#1a1008', border: '1px solid #3d2412' }}>
                <span className="text-2xl">{emoji}</span>
                <div>
                  <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs" style={{ color: '#5c3820' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {viewMode !== 'tree' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#5c3820' }} />
              <input
                type="text"
                placeholder="Search your grove…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-12 w-full"
                style={{ background: '#1a1008', borderColor: '#3d2412', color: '#f0e4c8' }}
                data-testid="search-projects-input"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-24">
            <div className="text-8xl mb-6 animate-bounce">🌱</div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#f0e4c8' }}>Your grove is empty</h3>
            <p className="mb-8" style={{ color: '#8a7055' }}>
              Plant your first project seed and watch it grow into an acorn
            </p>
            <button onClick={() => navigate('/projects/new')} className="btn-primary">
              <Plus className="w-5 h-5" />
              Plant First Seed
            </button>
          </div>
        )}

        {/* Tree view */}
        {viewMode === 'tree' && filteredProjects.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0702', border: '1px solid #3d2412' }}>
            <ProjectsTree
              projects={filteredProjects}
              onProjectClick={id => navigate(`/projects/${id}`)}
              onDeleteProject={deleteProject}
              onNewProject={() => navigate('/projects/new')}
            />
            <div className="px-6 pb-5 flex items-center gap-6 text-xs" style={{ color: '#5c3820' }}>
              <span className="flex items-center gap-1.5">🌿 Draft</span>
              <span className="flex items-center gap-1.5">🍃 Active</span>
              <span className="flex items-center gap-1.5">🌰 Completed</span>
              <span className="flex items-center gap-1.5">· Click a leaf to open project</span>
            </div>
          </div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && filteredProjects.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id || project.project_id}
                project={project}
                viewMode="grid"
                index={index}
                onOpen={() => navigate(`/projects/${project.id || project.project_id}`)}
                onDelete={() => deleteProject(project.id || project.project_id || '')}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && filteredProjects.length > 0 && (
          <div className="space-y-3">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id || project.project_id}
                project={project}
                viewMode="list"
                index={index}
                onOpen={() => navigate(`/projects/${project.id || project.project_id}`)}
                onDelete={() => deleteProject(project.id || project.project_id || '')}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;
