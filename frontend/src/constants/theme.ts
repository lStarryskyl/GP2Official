// Unified Theme Constants - Dark Navy + Gold Design System
// =========================================================

export const colors = {
  // Primary backgrounds
  bg: {
    primary: '#0a150e',      // Darkest background
    secondary: '#0a150e',    // Sidebar/card background
    tertiary: '#0f1f15',     // Elevated surfaces
    elevated: '#152238',     // Hover states, inputs
  },
  
  // Gold accent palette
  gold: {
    primary: '#4ade80',      // Primary gold
    light: '#e6c358',        // Hover/highlight
    dark: '#b8962e',         // Darker gold
    muted: '#9a7b24',        // Subtle gold
    glow: 'rgba(212, 175, 55, 0.3)',  // Glow effect
  },
  
  // Border colors
  border: {
    primary: '#1e4a28',      // Primary border
    muted: 'rgba(30, 58, 95, 0.5)',   // Subtle border
    gold: 'rgba(212, 175, 55, 0.3)',  // Gold border
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#e5e7eb',    // gray-200
    muted: '#9ca3af',        // gray-400
    subtle: '#6b7280',       // gray-500
    disabled: '#4b5563',     // gray-600
  },
  
  // Status colors
  status: {
    success: '#10b981',      // emerald-500
    warning: '#f59e0b',      // amber-500
    error: '#ef4444',        // red-500
    info: '#3b82f6',         // blue-500
  },
  
  // Phase colors
  phases: {
    planning: '#3b82f6',     // blue
    feasibility: '#8b5cf6',  // purple
    requirements: '#06b6d4', // cyan
    design: '#ec4899',       // pink
    development: '#10b981',  // emerald
    validation: '#f59e0b',   // amber
    summary: '#4ade80',      // gold
  },
};

// Tailwind class presets for consistent styling
export const tw = {
  // Card styles
  card: {
    base: 'bg-[#0a150e] border border-[#1e4a28]/50 rounded-2xl',
    hover: 'hover:border-[#4ade80]/30 hover:shadow-lg hover:shadow-[#4ade80]/5',
    elevated: 'bg-[#0f1f15] border border-[#1e4a28] rounded-xl',
    glass: 'bg-[#0a150e]/80 backdrop-blur-lg border border-[#1e4a28]/50 rounded-2xl',
  },
  
  // Button styles
  button: {
    primary: 'bg-gradient-to-r from-[#4ade80] to-[#b8962e] hover:from-[#e6c358] hover:to-[#4ade80] text-[#0a150e] font-semibold shadow-lg shadow-[#4ade80]/20',
    secondary: 'bg-[#152238] hover:bg-[#1e4a28] text-[#4ade80] border border-[#4ade80]/30 hover:border-[#4ade80]',
    ghost: 'text-gray-400 hover:text-white hover:bg-[#1e4a28]/30',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  },
  
  // Input styles
  input: {
    base: 'bg-[#152238] border border-[#1e4a28] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[#4ade80] focus:ring-2 focus:ring-[#4ade80]/20 transition-all',
    search: 'bg-[#0f1f15] border border-[#1e4a28]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/20',
  },
  
  // Badge styles
  badge: {
    gold: 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    error: 'bg-red-500/10 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    muted: 'bg-gray-500/10 text-gray-400 border border-gray-500/30',
  },
  
  // Text styles
  text: {
    heading: 'text-white font-bold',
    subheading: 'text-gray-300 font-medium',
    body: 'text-gray-400',
    muted: 'text-gray-500',
    gold: 'text-[#4ade80]',
    gradient: 'bg-gradient-to-r from-[#4ade80] to-[#e6c358] bg-clip-text text-transparent',
  },
  
  // Layout helpers
  layout: {
    section: 'space-y-6',
    grid2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    grid4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
  },
};

// Animation presets
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  glow: 'animate-glow',
};

// Phase configuration with enhanced styling
export const phaseConfig = {
  planning: {
    id: 'planning',
    label: 'Planning & Roadmap',
    icon: 'Calendar',
    color: colors.phases.planning,
    gradient: 'from-blue-500 to-blue-600',
    order: 1,
  },
  feasibility_study: {
    id: 'feasibility_study',
    label: 'Feasibility Study',
    icon: 'TrendingUp',
    color: colors.phases.feasibility,
    gradient: 'from-purple-500 to-purple-600',
    order: 2,
  },
  requirements_gathering: {
    id: 'requirements_gathering',
    label: 'Requirements',
    icon: 'FileText',
    color: colors.phases.requirements,
    gradient: 'from-cyan-500 to-cyan-600',
    order: 3,
  },
  design: {
    id: 'design',
    label: 'Design',
    icon: 'Palette',
    color: colors.phases.design,
    gradient: 'from-pink-500 to-pink-600',
    order: 4,
  },
  development: {
    id: 'development',
    label: 'Development',
    icon: 'Code',
    color: colors.phases.development,
    gradient: 'from-emerald-500 to-emerald-600',
    order: 5,
  },
  validation: {
    id: 'validation',
    label: 'Validation',
    icon: 'CheckCircle',
    color: colors.phases.validation,
    gradient: 'from-amber-500 to-amber-600',
    order: 6,
  },
  summary: {
    id: 'summary',
    label: 'Summary',
    icon: 'Flag',
    color: colors.phases.summary,
    gradient: 'from-[#4ade80] to-[#b8962e]',
    order: 7,
  },
};

export default { colors, tw, animations, phaseConfig };
