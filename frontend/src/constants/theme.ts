// Unified Theme Constants - Dark Navy + Gold Design System
// =========================================================

export const colors = {
  // Primary backgrounds
  bg: {
    primary: 'var(--brand-900)',      // Darkest background
    secondary: 'var(--brand-900)',    // Sidebar/card background
    tertiary: 'var(--brand-850)',     // Elevated surfaces
    elevated: '#152238',     // Hover states, inputs
  },
  
  // Gold accent palette
  gold: {
    primary: 'var(--blue-400)',      // Primary gold
    light: '#e6c358',        // Hover/highlight
    dark: '#b8962e',         // Darker gold
    muted: '#9a7b24',        // Subtle gold
    glow: 'rgba(212, 175, 55, 0.3)',  // Glow effect
  },
  
  // Border colors
  border: {
    primary: 'var(--brand-700)',      // Primary border
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
    success: 'var(--blue-400)',      // blue-400
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
    development: 'var(--blue-400)',  // blue
    validation: '#f59e0b',   // amber
    summary: 'var(--blue-400)',      // gold
  },
};

// Tailwind class presets for consistent styling
export const tw = {
  // Card styles
  card: {
    base: 'bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl',
    hover: 'hover:border-[var(--blue-400)]/30 hover:shadow-lg hover:shadow-[var(--blue-400)]/5',
    elevated: 'bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-xl',
    glass: 'bg-[var(--brand-900)]/80 backdrop-blur-lg border border-[var(--brand-700)]/50 rounded-2xl',
  },
  
  // Button styles
  button: {
    primary: 'bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] hover:from-[#e6c358] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold shadow-lg shadow-[var(--blue-400)]/20',
    secondary: 'bg-[#152238] hover:bg-[var(--brand-700)] text-[var(--blue-400)] border border-[var(--blue-400)]/30 hover:border-[var(--blue-400)]',
    ghost: 'text-gray-400 hover:text-white hover:bg-[var(--brand-700)]/30',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  },
  
  // Input styles
  input: {
    base: 'bg-[#152238] border border-[var(--brand-700)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-[var(--blue-400)] focus:ring-2 focus:ring-[var(--blue-400)]/20 transition-all',
    search: 'bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[var(--blue-400)]/50 focus:ring-1 focus:ring-[var(--blue-400)]/20',
  },
  
  // Badge styles
  badge: {
    gold: 'bg-[var(--blue-400)]/10 text-[var(--blue-400)] border border-[var(--blue-400)]/30',
    success: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
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
    gold: 'text-[var(--blue-400)]',
    gradient: 'bg-gradient-to-r from-[var(--blue-400)] to-[#e6c358] bg-clip-text text-transparent',
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
    gradient: 'from-blue-600 to-blue-500',
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
  testing: {
    id: 'testing',
    label: 'Testing',
    icon: 'FlaskConical',
    color: '#0EA5E9',
    gradient: 'from-sky-500 to-sky-600',
    order: 7,
  },
  summary: {
    id: 'summary',
    label: 'Summary',
    icon: 'Flag',
    color: colors.phases.summary,
    gradient: 'from-[var(--blue-400)] to-[#b8962e]',
    order: 8,
  },
};

export default { colors, tw, animations, phaseConfig };
