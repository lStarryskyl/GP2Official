/**
 * Acorn Design System - Design Tokens
 * Brand colors extracted from logo
 */

export const colors = {
  // Brand Colors (from Acorn logo)
  orange: {
    50: '#FFF5E6',
    100: '#FFE8CC',
    200: '#FFD199',
    300: '#FFB84D',
    400: '#F5A623', // Primary Acorn color
    500: '#E69500',
    600: '#CC7A00',
    700: '#995C00',
    800: '#663D00',
    900: '#331F00',
  },
  blue: {
    50: '#E8F1F8',
    100: '#D1E3F1',
    200: '#A3C7E3',
    300: '#6B9FD1',
    400: '#4A7BA7', // Secondary Arrow color
    500: '#2E5090', // Deep Blue
    600: '#234073',
    700: '#1A3056',
    800: '#112039',
    900: '#09101D',
  },
  navy: {
    50: '#E6E9EC',
    100: '#CCD3D9',
    200: '#99A7B3',
    300: '#667B8D',
    400: '#334F67',
    500: '#1B2D45', // Primary Text
    600: '#162437',
    700: '#0F1A2E', // Dark Mode BG
    800: '#0B1220',
    900: '#060910',
  },
  
  // Semantic Colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Neutrals
  gray: {
    50: '#F8F9FA',
    100: '#E9ECEF',
    200: '#DEE2E6',
    300: '#CED4DA',
    400: '#ADB5BD',
    500: '#6C757D',
    600: '#495057',
    700: '#343A40',
    800: '#212529',
    900: '#0F1419',
  },
  
  white: '#FFFFFF',
  black: '#000000',
};

export const gradients = {
  primary: 'linear-gradient(135deg, #F5A623 0%, #4A7BA7 50%, #2E5090 100%)',
  orange: 'linear-gradient(135deg, #F5A623 0%, #FFB84D 100%)',
  blue: 'linear-gradient(135deg, #4A7BA7 0%, #2E5090 100%)',
  navy: 'linear-gradient(135deg, #1B2D45 0%, #0F1A2E 100%)',
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
  acorn: '0 10px 30px rgba(245, 166, 35, 0.3)', // Orange glow
  arrow: '0 10px 30px rgba(74, 123, 167, 0.3)', // Blue glow
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
};
