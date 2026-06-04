/**
 * Acorn Design System — Design Tokens
 * Brand: Blue #1A6FD4 · Orange #F97316 · Navy #050D1A / #0D1B2A
 * Fonts: Syne (headings) · DM Sans (body) · DM Mono (code/labels)
 */

// ─── Raw color palettes ────────────────────────────────────────────────────

export const colors = {
  brand: {
    950: '#020810',
    900: '#050D1A',
    850: '#0a1525',
    800: '#0f1e33',
    750: '#152538',
    700: '#1A2E45',
    600: '#243B55',
    500: '#2d4d6e',
    400: '#4a7a9b',
    300: '#7aacc8',
    200: '#b8d4e8',
    100: '#e0eef8',
  },

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

  text: {
    primary: '#E8EDF5',
    muted: '#8899AA',
    faint: '#4a6070',
  },

  semantic: {
    success: '#22c55e',
    warning: '#F97316',
    error: '#ef4444',
    info: '#1A6FD4',
  },

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

  white: '#FFFFFF',
  black: '#020810',
};

// ─── CSS custom property declarations (inject at :root) ───────────────────

export const cssVars = `
  :root {
    /* Navy / surface */
    --color-navy:        ${colors.brand[900]};
    --color-navy-dark:   ${colors.brand[950]};
    --color-navy-850:    ${colors.brand[850]};
    --color-navy-800:    ${colors.brand[800]};
    --color-navy-750:    ${colors.brand[750]};
    --color-navy-700:    ${colors.brand[700]};
    --color-navy-600:    ${colors.brand[600]};

    /* Blue */
    --color-blue:        ${colors.blue[500]};
    --color-blue-dark:   ${colors.blue[700]};
    --color-blue-light:  ${colors.blue[300]};
    --color-blue-muted:  ${colors.blue[400]};

    /* Orange */
    --color-orange:      ${colors.orange[500]};
    --color-orange-dark: ${colors.orange[600]};
    --color-orange-light:${colors.orange[300]};

    /* Semantic surface tokens */
    --color-surface:     ${colors.brand[850]};
    --color-surface-alt: ${colors.brand[800]};
    --color-border:      rgba(26,111,212,0.18);
    --color-border-muted:rgba(26,46,69,0.5);
    --color-muted:       ${colors.text.muted};
    --color-faint:       ${colors.text.faint};

    /* Motion easing */
    --ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out-expo:cubic-bezier(0.87, 0, 0.13, 1);
    --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-smooth:     cubic-bezier(0.22, 1, 0.36, 1);
  }
`;

// ─── Gradients ────────────────────────────────────────────────────────────

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.blue[500]} 0%, ${colors.brand[800]} 100%)`,
  blue: `linear-gradient(135deg, ${colors.blue[400]} 0%, ${colors.blue[500]} 100%)`,
  orange: `linear-gradient(135deg, ${colors.orange[500]} 0%, ${colors.orange[600]} 100%)`,
  brand: `linear-gradient(135deg, ${colors.blue[500]} 0%, ${colors.orange[500]} 100%)`,
  navy: `linear-gradient(135deg, ${colors.brand[700]} 0%, ${colors.brand[900]} 100%)`,
  hero: `linear-gradient(135deg, ${colors.brand[900]} 0%, ${colors.brand[750]} 50%, ${colors.brand[900]} 100%)`,
  ctaHover: `linear-gradient(135deg, ${colors.orange[600]} 0%, ${colors.orange[500]} 100%)`,
};

// ─── Typography ───────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    display: ['Syne', 'system-ui', 'sans-serif'],
    sans: ['Syne', 'DM Sans', 'system-ui', 'sans-serif'],
    body: ['DM Sans', 'system-ui', 'sans-serif'],
    mono: ['DM Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
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

// ─── Spacing ──────────────────────────────────────────────────────────────

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

// ─── Border radius ────────────────────────────────────────────────────────

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

// ─── Shadows ──────────────────────────────────────────────────────────────

export const shadows = {
  sm: '0 1px 2px 0 rgba(0,0,0,0.2)',
  base: '0 1px 3px 0 rgba(0,0,0,0.25)',
  md: '0 4px 6px -1px rgba(0,0,0,0.25)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.3)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.3)',
  '2xl': '0 25px 50px -12px rgba(0,0,0,0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.12)',
  blue: '0 8px 24px rgba(26,111,212,0.35)',
  blueLg: '0 16px 48px rgba(26,111,212,0.4)',
  orange: '0 8px 24px rgba(249,115,22,0.35)',
  orangeLg: '0 16px 48px rgba(249,115,22,0.4)',
  none: 'none',
};

// ─── Breakpoints ──────────────────────────────────────────────────────────

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ─── Z-index ──────────────────────────────────────────────────────────────

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

// ─── Transitions ──────────────────────────────────────────────────────────

export const transitions = {
  fast: '150ms var(--ease-smooth)',
  base: '200ms var(--ease-smooth)',
  slow: '300ms var(--ease-out-expo)',
  slower: '500ms var(--ease-out-expo)',
  spring: '400ms var(--ease-spring)',
};

// ─── Motion presets (for framer-motion) ──────────────────────────────────

export const motion = {
  pageEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  staggerContainer: {
    animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
  hoverLift: {
    whileHover: { y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } },
    whileTap: { scale: 0.97 },
  },
  springPop: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  },
};
