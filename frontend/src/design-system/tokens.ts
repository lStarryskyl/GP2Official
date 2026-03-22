/**
 * Acorn Design System - Design Tokens
 * Forest / Living Tree Theme
 */

export const colors = {
  // Forest Green Palette (primary)
  forest: {
    950: '#040a06',
    900: '#0a150e',
    850: '#0f1f15',
    800: '#142b1a',
    750: '#1a3520',
    700: '#1e4a28',
    600: '#2d6a3f',
    500: '#3d8a55',
    400: '#4ade80', // bright green - active/interactive
    300: '#86efac', // lighter green
    200: '#bbf7d0',
  },

  // Bark Brown Palette (tree trunk visual)
  bark: {
    900: '#1c0f09',
    800: '#2c1810',
    700: '#3d2b1f',
    600: '#5c4033',
  },

  // Sage Palette (muted greens for text)
  sage: {
    900: '#1a2b1e',
    800: '#2d4a35',
    700: '#4a7a56',
    600: '#6b9e7a',
    500: '#8fbc8f',
    400: '#a8d5a8',
  },

  // Amber / Warm Gold (highlights, warnings)
  amber: {
    700: '#92400e',
    600: '#b45309',
    500: '#d97706',
    400: '#fbbf24',
    300: '#fcd34d',
    200: '#fde68a',
  },

  // Text colors
  text: {
    primary: '#e8f5e0',   // cream sage white
    muted: '#6b9e7a',     // muted sage
    faint: '#4a7a56',     // very muted
  },

  // Semantic Colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#4ade80',

  // Neutrals (kept for compatibility)
  gray: {
    50: '#f0f7f0',
    100: '#e8f5e0',
    200: '#c8e6c9',
    300: '#a5d6a7',
    400: '#8fbc8f',
    500: '#6b9e7a',
    600: '#4a7a56',
    700: '#2d4a35',
    800: '#1a2b1e',
    900: '#0f1f15',
  },

  white: '#e8f5e0',
  black: '#040a06',
};

export const gradients = {
  primary: 'linear-gradient(135deg, #4ade80 0%, #2d6a3f 100%)',
  forest: 'linear-gradient(135deg, #4ade80 0%, #86efac 100%)',
  canopy: 'linear-gradient(135deg, #86efac 0%, #4ade80 50%, #2d6a3f 100%)',
  bark: 'linear-gradient(135deg, #3d2b1f 0%, #1c0f09 100%)',
  amber: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem',   // 256px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  forest: '0 10px 30px rgba(74, 222, 128, 0.25)',   // Forest green glow
  amber: '0 10px 30px rgba(251, 191, 36, 0.25)',    // Amber glow
  none: 'none',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};
