/**
 * Acorn Design System — Design Tokens
 * Brand: Blue (#1A6FD4) + Orange (#F97316) + Navy (#0D1B2A)
 */

export const colors = {
  // Brand Navy Palette (primary backgrounds)
  brand: {
    950: '#050d16',
    900: '#0D1B2A',
    850: '#111f30',
    800: '#152538',
    750: '#1A2E45',
    700: '#1e3552',
    600: '#243B55',
    500: '#2d4d6e',
    400: '#4a7a9b',
    300: '#7aacc8',
    200: '#b8d4e8',
    100: '#e0eef8',
  },

  // Blue Palette (primary interactive / accent)
  blue: {
    950: '#020d1f',
    900: '#0a1f3d',
    800: '#0d2b52',
    700: '#103a6e',
    600: '#1452a0',
    500: '#1A6FD4',
    400: '#3d8fe0',
    300: '#70b3ee',
    200: '#a8d3f7',
    100: '#daeeff',
  },

  // Orange Palette (CTA / warning / accent)
  orange: {
    950: '#1a0800',
    900: '#3d1200',
    800: '#6b2200',
    700: '#993400',
    600: '#cc4900',
    500: '#F97316',
    400: '#fb9042',
    300: '#fdb07a',
    200: '#fed0ae',
    100: '#fff0e6',
  },

  // Text colors
  text: {
    primary: '#E8EDF5',
    muted: '#8899AA',
    faint: '#4a6070',
  },

  // Semantic Colors
  success: '#22c55e',
  warning: '#F97316',
  error: '#ef4444',
  info: '#1A6FD4',

  // Neutrals
  gray: {
    50: '#f0f5f9',
    100: '#E8EDF5',
    200: '#c8d8e8',
    300: '#a0bccc',
    400: '#8899AA',
    500: '#607080',
    600: '#4a5a6a',
    700: '#334455',
    800: '#1A2E45',
    900: '#0D1B2A',
  },

  white: '#E8EDF5',
  black: '#050d16',
};

export const gradients = {
  primary: 'linear-gradient(135deg, #1A6FD4 0%, #0a1f3d 100%)',
  blue: 'linear-gradient(135deg, #3d8fe0 0%, #1A6FD4 100%)',
  orange: 'linear-gradient(135deg, #F97316 0%, #cc4900 100%)',
  navy: 'linear-gradient(135deg, #1A2E45 0%, #0D1B2A 100%)',
  hero: 'linear-gradient(135deg, #0D1B2A 0%, #1A2E45 50%, #0D1B2A 100%)',
};

export const typography = {
  fontFamily: {
    sans: ['Syne', 'DM Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    body: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
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
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.12)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  blue: '0 10px 30px rgba(26, 111, 212, 0.3)',
  orange: '0 10px 30px rgba(249, 115, 22, 0.3)',
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
