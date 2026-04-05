/**
 * Design System Constants
 * Consistent colors, spacing, and styles across the application
 * 
 * Brand Colors:
 * - Primary Accent: #F59E0B (Warm Orange)
 * - Primary Text: #1E3A5F (Deep Navy)
 * - Primary Background: #FFF4E6 (Soft Cream)
 */

// Brand colors
export const brand = {
  accent: '#F59E0B',      // Warm Orange - buttons, highlights, CTAs
  accentHover: '#D97706', // Darker orange for hover states
  accentLight: '#FEF3C7', // Light orange for backgrounds
  text: '#1E3A5F',        // Deep Navy - headings, primary text
  textLight: '#3D5A80',   // Lighter navy for secondary text
  background: '#FFF4E6',  // Soft Cream - page backgrounds
  backgroundAlt: '#FFF9F0', // Slightly lighter cream
  surface: '#FFFFFF',     // White - cards, modals
  border: '#E8DDD4',      // Warm gray border
};

// Extended color palette
export const colors = {
  // Primary - Based on brand accent (Orange)
  primary: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Brand accent
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Neutral - Navy-tinted for cohesion with brand
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E3A5F', // Brand text
    900: '#0F172A',
  },

  // Success - Muted green
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#1A6FD4',
  },

  // Warning - Uses brand orange
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  // Error - Muted red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
};

// Phase-specific colors (consistent across app)
export const phaseTheme = {
  planning: {
    primary: '#6366F1',
    light: '#EEF2FF',
    border: '#C7D2FE',
    gradient: 'from-indigo-500 to-violet-500',
  },
  feasibility: {
    primary: '#8B5CF6',
    light: '#F5F3FF',
    border: '#DDD6FE',
    gradient: 'from-violet-500 to-purple-500',
  },
  requirements: {
    primary: '#3B82F6',
    light: '#EFF6FF',
    border: '#BFDBFE',
    gradient: 'from-blue-500 to-cyan-500',
  },
  validation: {
    primary: '#14B8A6',
    light: '#F0FDFA',
    border: '#99F6E4',
    gradient: 'from-blue-600 to-blue-500',
  },
  design: {
    primary: '#F43F5E',
    light: '#FFF1F2',
    border: '#FECDD3',
    gradient: 'from-rose-500 to-pink-500',
  },
  development: {
    primary: '#22C55E',
    light: '#F0FDF4',
    border: '#BBF7D0',
    gradient: 'from-blue-600 to-blue-500',
  },
  tasks: {
    primary: '#06B6D4',
    light: '#ECFEFF',
    border: '#A5F3FC',
    gradient: 'from-cyan-500 to-blue-500',
  },
  summary: {
    primary: '#78716C',
    light: '#FAFAF9',
    border: '#D6D3D1',
    gradient: 'from-stone-500 to-zinc-500',
  },
};

// Diagram canvas colors
export const canvasColors = {
  background: {
    light: '#FAFBFC',
    dark: '#1A1A2E',
  },
  grid: {
    light: '#E5E7EB',
    dark: '#2D2D44',
  },
  selection: '#6366F1',
  connector: '#94A3B8',
};

// Shape colors for diagrams
export const shapeColors = {
  // Standard shapes
  process: '#6366F1',
  decision: '#F59E0B',
  terminator: '#10B981',
  data: '#8B5CF6',
  document: '#3B82F6',
  
  // UML specific
  class: '#6366F1',
  interface: '#14B8A6',
  abstract: '#8B5CF6',
  enum: '#F59E0B',
  
  // Architecture
  service: '#3B82F6',
  database: '#8B5CF6',
  queue: '#F59E0B',
  cache: '#10B981',
  external: '#64748B',
  
  // ERD
  entity: '#6366F1',
  attribute: '#3B82F6',
  relationship: '#F59E0B',
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Menlo, Monaco, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
};

// Spacing scale
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Export combined theme
export const theme = {
  colors,
  phaseTheme,
  canvasColors,
  shapeColors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
