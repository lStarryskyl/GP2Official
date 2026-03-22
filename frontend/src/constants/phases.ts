export type CanvasMode = 'freeform' | 'requirements' | 'srs' | 'costs' | 'roadmap' | 'gantt' | 'diagrams' | 'plantuml';

export interface PhaseConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  canvasMode: CanvasMode;
  stepNumber: number;
  color: string;
  order: number;
}

export const phaseConfigs: PhaseConfig[] = [
  {
    id: 'planning',
    title: 'Planning',
    shortTitle: 'Plan',
    description: 'High-level plan, objectives, and scope alignment',
    canvasMode: 'roadmap',
    stepNumber: 1,
    color: 'amber',
    order: 0,
  },
  {
    id: 'feasibility_study',
    title: 'Feasibility Study',
    shortTitle: 'Feasibility',
    description: 'Market, technical, and economic analysis',
    canvasMode: 'freeform',
    stepNumber: 2,
    color: 'sage',
    order: 1,
  },
  {
    id: 'requirements_gathering',
    title: 'Requirements',
    shortTitle: 'Requirements',
    description: 'Functional and non-functional requirements',
    canvasMode: 'requirements',
    stepNumber: 3,
    color: 'forest',
    order: 2,
  },
  {
    id: 'validation',
    title: 'Validation',
    shortTitle: 'Validate',
    description: 'Stakeholder sign-off and prototype validation',
    canvasMode: 'freeform',
    stepNumber: 4,
    color: 'slate',
    order: 3,
  },
  {
    id: 'design',
    title: 'System Design',
    shortTitle: 'Design',
    description: 'Architecture, ERD, and system diagrams',
    canvasMode: 'plantuml',
    stepNumber: 5,
    color: 'plum',
    order: 4,
  },
  {
    id: 'development',
    title: 'Development',
    shortTitle: 'Develop',
    description: 'Tech stack, components, and API specs',
    canvasMode: 'freeform',
    stepNumber: 6,
    color: 'bark',
    order: 5,
  },
  {
    id: 'tasks',
    title: 'Tasks',
    shortTitle: 'Tasks',
    description: 'Task board, Gantt chart, and dependencies',
    canvasMode: 'gantt',
    stepNumber: 7,
    color: 'amber',
    order: 6,
  },
  {
    id: 'cost_benefit',
    title: 'Costs & Benefits',
    shortTitle: 'Costs',
    description: 'Cost, effort, and ROI analysis across phases',
    canvasMode: 'costs',
    stepNumber: 8,
    color: 'teal',
    order: 7,
  },
  {
    id: 'risks',
    title: 'Risks & Mitigations',
    shortTitle: 'Risks',
    description: 'Top project risks, impact, likelihood, and mitigations',
    canvasMode: 'freeform',
    stepNumber: 9,
    color: 'rust',
    order: 8,
  },
  {
    id: 'summary',
    title: 'Summary',
    shortTitle: 'Summary',
    description: 'Final summary, risks, and next steps',
    canvasMode: 'freeform',
    stepNumber: 10,
    color: 'gold',
    order: 9,
  },
];

export const getPhaseConfig = (id: string): PhaseConfig | undefined =>
  phaseConfigs.find((phase) => phase.id === id);

export const getNextPhase = (currentId: string): PhaseConfig | undefined => {
  const current = phaseConfigs.find((p) => p.id === currentId);
  if (!current) return undefined;
  return phaseConfigs.find((p) => p.order === current.order + 1);
};

export const getPrevPhase = (currentId: string): PhaseConfig | undefined => {
  const current = phaseConfigs.find((p) => p.id === currentId);
  if (!current) return undefined;
  return phaseConfigs.find((p) => p.order === current.order - 1);
};

// Per-phase color system — hex values for direct use in SVG/inline styles
export const phaseHexColors: Record<string, { fill: string; text: string; glow: string }> = {
  planning:               { fill: '#D4A017', text: '#0a150e', glow: '#D4A01799' },
  feasibility_study:      { fill: '#7BA05B', text: '#0a150e', glow: '#7BA05B99' },
  requirements_gathering: { fill: '#3d8a55', text: '#e8f5e0', glow: '#3d8a5599' },
  validation:             { fill: '#5F7A8A', text: '#e8f5e0', glow: '#5F7A8A99' },
  design:                 { fill: '#6B4C8A', text: '#e8f5e0', glow: '#6B4C8A99' },
  development:            { fill: '#8B5E3C', text: '#e8f5e0', glow: '#8B5E3C99' },
  tasks:                  { fill: '#D4A017', text: '#0a150e', glow: '#D4A01799' },
  cost_benefit:           { fill: '#2A9D8F', text: '#e8f5e0', glow: '#2A9D8F99' },
  risks:                  { fill: '#C1440E', text: '#e8f5e0', glow: '#C1440E99' },
  summary:                { fill: '#4ade80', text: '#0a150e', glow: '#4ade8099' },
};

// Tailwind class palette (kept for backwards compat)
export const phaseColors: Record<string, { bg: string; border: string; text: string; gradient: string; accent: string }> = {
  forest: {
    bg: 'bg-forest-800',
    border: 'border-forest-600',
    text: 'text-forest-400',
    gradient: 'from-forest-400 to-forest-300',
    accent: '#4ade80'
  },
  sage: {
    bg: 'bg-sage-900',
    border: 'border-sage-700',
    text: 'text-sage-500',
    gradient: 'from-sage-500 to-sage-400',
    accent: '#7BA05B'
  },
  amber: {
    bg: 'bg-amber-900/30',
    border: 'border-amber-700/50',
    text: 'text-amber-400',
    gradient: 'from-amber-400 to-amber-300',
    accent: '#D4A017'
  },
  plum: {
    bg: 'bg-plum-900/30',
    border: 'border-plum-700/50',
    text: 'text-plum-400',
    gradient: 'from-plum-400 to-plum-300',
    accent: '#6B4C8A'
  },
  teal: {
    bg: 'bg-teal-900/30',
    border: 'border-teal-700/50',
    text: 'text-teal-400',
    gradient: 'from-teal-400 to-teal-300',
    accent: '#2A9D8F'
  },
  rust: {
    bg: 'bg-rust-900/30',
    border: 'border-rust-700/50',
    text: 'text-rust-400',
    gradient: 'from-rust-400 to-rust-300',
    accent: '#C1440E'
  },
  bark: {
    bg: 'bg-bark-800/30',
    border: 'border-bark-600/50',
    text: 'text-bark-400',
    gradient: 'from-bark-400 to-bark-300',
    accent: '#8B5E3C'
  },
  slate: {
    bg: 'bg-slate-800/30',
    border: 'border-slate-600/50',
    text: 'text-slate-400',
    gradient: 'from-slate-400 to-slate-300',
    accent: '#5F7A8A'
  },
  gold: {
    bg: 'bg-amber-900/20',
    border: 'border-amber-600/40',
    text: 'text-amber-300',
    gradient: 'from-amber-300 to-amber-200',
    accent: '#4ade80'
  },
};
