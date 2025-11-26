export type CanvasMode = 'freeform' | 'requirements' | 'srs' | 'costs';

export interface PhaseConfig {
  id: string;
  title: string;
  description: string;
  canvasMode: CanvasMode;
}

export const phaseConfigs: PhaseConfig[] = [
  {
    id: 'planning',
    title: 'Planning',
    description: 'Define project goals, constraints, stakeholders, and success metrics.',
    canvasMode: 'freeform',
  },
  {
    id: 'cost_benefit',
    title: 'Cost & Benefit',
    description: 'Assess expected benefits, costs, and ROI scenarios.',
    canvasMode: 'costs',
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Outline epics and tasks with dependencies and sequencing.',
    canvasMode: 'requirements',
  },
  {
    id: 'requirements_gathering',
    title: 'Requirements Gathering',
    description: 'Plan elicitation activities, personas, discovery interviews, and inputs.',
    canvasMode: 'requirements',
  },
  {
    id: 'requirements_validation',
    title: 'Requirements Validation',
    description: 'Define acceptance criteria, traceability, and validation techniques.',
    canvasMode: 'requirements',
  },
  {
    id: 'design_architecture',
    title: 'Design Architecture',
    description: 'Recommend high-level architecture, modules, and interface contracts.',
    canvasMode: 'srs',
  },
  {
    id: 'development',
    title: 'Development',
    description: 'Provide implementation guidance, suggested stacks, and QA safeguards (no code).',
    canvasMode: 'freeform',
  },
];

export const getPhaseConfig = (id: string): PhaseConfig | undefined =>
  phaseConfigs.find((phase) => phase.id === id);
