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
    color: 'orange',
    order: 0,
  },
  {
    id: 'feasibility_study',
    title: 'Feasibility Study',
    shortTitle: 'Feasibility',
    description: 'Market, technical, and economic analysis',
    canvasMode: 'freeform',
    stepNumber: 2,
    color: 'orange',
    order: 1,
  },
  {
    id: 'requirements_gathering',
    title: 'Requirements',
    shortTitle: 'Requirements',
    description: 'Functional and non-functional requirements',
    canvasMode: 'requirements',
    stepNumber: 3,
    color: 'orange',
    order: 2,
  },
  {
    id: 'validation',
    title: 'Validation',
    shortTitle: 'Validate',
    description: 'Stakeholder sign-off and prototype validation',
    canvasMode: 'freeform',
    stepNumber: 4,
    color: 'orange',
    order: 3,
  },
  {
    id: 'design',
    title: 'Design',
    shortTitle: 'Design',
    description: 'Architecture, ERD, and system diagrams',
    canvasMode: 'plantuml',
    stepNumber: 5,
    color: 'orange',
    order: 4,
  },
  {
    id: 'development',
    title: 'Development',
    shortTitle: 'Develop',
    description: 'Tech stack, components, and API specs',
    canvasMode: 'freeform',
    stepNumber: 6,
    color: 'orange',
    order: 5,
  },
  {
    id: 'tasks',
    title: 'Tasks',
    shortTitle: 'Tasks',
    description: 'Task board, Gantt chart, and dependencies',
    canvasMode: 'gantt',
    stepNumber: 7,
    color: 'orange',
    order: 6,
  },
  {
    id: 'cost_benefit',
    title: 'Costs & Benefits',
    shortTitle: 'Costs',
    description: 'Cost, effort, and ROI analysis across phases',
    canvasMode: 'costs',
    stepNumber: 8,
    color: 'orange',
    order: 7,
  },
  {
    id: 'summary',
    title: 'Summary',
    shortTitle: 'Summary',
    description: 'Final summary, risks, and next steps',
    canvasMode: 'freeform',
    stepNumber: 9,
    color: 'orange',
    order: 8,
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

// Brand color palette - Warm Orange (#F59E0B), Deep Navy (#1E3A5F), Soft Cream (#FFF4E6)
export const phaseColors: Record<string, { bg: string; border: string; text: string; gradient: string; accent: string }> = {
  // Primary orange theme - used for all phases
  orange: { 
    bg: 'bg-amber-50', 
    border: 'border-amber-200', 
    text: 'text-amber-700', 
    gradient: 'from-amber-500 to-orange-500',
    accent: '#F59E0B'
  },
  // Alternative colors for variety while staying on-brand
  navy: { 
    bg: 'bg-slate-50', 
    border: 'border-slate-200', 
    text: 'text-slate-700', 
    gradient: 'from-slate-600 to-slate-700',
    accent: '#1E3A5F'
  },
  cream: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-100', 
    text: 'text-orange-800', 
    gradient: 'from-orange-100 to-amber-100',
    accent: '#FFF4E6'
  },
};
