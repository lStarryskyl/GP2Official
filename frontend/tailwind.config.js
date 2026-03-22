/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Forest / Nature Theme
        forest: {
          950: '#040a06',
          900: '#0a150e',
          850: '#0f1f15',
          800: '#142b1a',
          750: '#1a3520',
          700: '#1e4a28',
          600: '#2d6a3f',
          500: '#3d8a55',
          400: '#4ade80',
          300: '#86efac',
          200: '#bbf7d0',
        },
        bark: {
          900: '#1c0f09',
          800: '#2c1810',
          700: '#3d2b1f',
          600: '#5c4033',
        },
        sage: {
          900: '#1a2b1e',
          800: '#2d4a35',
          700: '#4a7a56',
          600: '#6b9e7a',
          500: '#8fbc8f',
          400: '#a8d5a8',
        },
        moss: {
          900: '#0d1f10',
          800: '#162b1a',
          700: '#1e3d25',
          600: '#2a5233',
        },
        amber: {
          900: '#1a1000',
          700: '#92400e',
          600: '#b45309',
          500: '#d97706',
          400: '#fbbf24',
          300: '#fcd34d',
          200: '#fde68a',
        },
        // Teal — Costs & Benefits phase
        teal: {
          900: '#0a1e1c',
          800: '#0d2b28',
          700: '#134036',
          600: '#1a5c50',
          500: '#2A9D8F',
          400: '#3bbcad',
          300: '#7dd5ca',
        },
        // Plum — System Design phase
        plum: {
          900: '#150e20',
          800: '#1e1430',
          700: '#2e1f48',
          600: '#4a3070',
          500: '#6B4C8A',
          400: '#8B68B0',
          300: '#b49dd0',
        },
        // Rust — Risks phase
        rust: {
          900: '#1a0800',
          800: '#2a0e00',
          700: '#3d1800',
          600: '#7a2e0a',
          500: '#C1440E',
          400: '#e05a24',
          300: '#f08050',
        },
        // Extended bark palette
        bark: {
          900: '#1c0f09',
          800: '#2c1810',
          700: '#3d2b1f',
          600: '#5c4033',
          500: '#8B5E3C',
          400: '#a87850',
          300: '#c89870',
        },
        // Slate — Validation phase
        slate: {
          900: '#0d1419',
          800: '#152030',
          700: '#1e3045',
          600: '#2d4560',
          500: '#5F7A8A',
          400: '#7a9ab0',
          300: '#9abccc',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-down': 'revealDown 0.7s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-left': 'revealLeft 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-right': 'revealRight 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'reveal-scale': 'revealScale 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'dramatic': 'dramaticEntrance 1s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'slide-bounce': 'slideInBounce 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'flip-in': 'flipIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'zoom-rotate': 'zoomRotate 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'elastic': 'elasticPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer-forest 2s infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'leaf-sway': 'leafSway 4s ease-in-out infinite',
        'branch-grow': 'branchGrow 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
      },
      keyframes: {
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(60px) scale(0.95)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        revealDown: {
          '0%': { opacity: '0', transform: 'translateY(-40px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        revealLeft: {
          '0%': { opacity: '0', transform: 'translateX(-80px) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
        revealRight: {
          '0%': { opacity: '0', transform: 'translateX(80px) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'translateX(0) rotate(0)' },
        },
        revealScale: {
          '0%': { opacity: '0', transform: 'scale(0.8) rotateX(10deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateX(0)' },
        },
        dramaticEntrance: {
          '0%': { opacity: '0', transform: 'translateY(100px) scale(0.5)', filter: 'blur(20px)' },
          '50%': { filter: 'blur(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        slideInBounce: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '60%': { transform: 'translateX(10%)' },
          '80%': { transform: 'translateX(-5%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        flipIn: {
          '0%': { opacity: '0', transform: 'perspective(400px) rotateY(90deg)' },
          '100%': { opacity: '1', transform: 'perspective(400px) rotateY(0)' },
        },
        zoomRotate: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-180deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        elasticPop: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '55%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-20px) rotate(1deg)' },
          '75%': { transform: 'translateY(10px) rotate(-1deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(74, 222, 128, 0.6), 0 0 60px rgba(74, 222, 128, 0.3)' },
        },
        'shimmer-forest': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'rotate-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        leafSway: {
          '0%, 100%': { transform: 'rotate(-3deg) scale(1)' },
          '50%': { transform: 'rotate(3deg) scale(1.02)' },
        },
        branchGrow: {
          '0%': { strokeDashoffset: '1000', opacity: '0' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
        },
      },
      boxShadow: {
        'forest': '0 4px 20px -4px rgba(74, 222, 128, 0.3)',
        'forest-lg': '0 8px 30px -4px rgba(74, 222, 128, 0.4)',
        'bark': '0 4px 20px -4px rgba(61, 43, 31, 0.5)',
        'amber': '0 4px 20px -4px rgba(251, 191, 36, 0.3)',
      },
      backgroundImage: {
        'gradient-forest': 'linear-gradient(135deg, #4ade80 0%, #2d6a3f 100%)',
        'gradient-bark': 'linear-gradient(135deg, #1e4a28 0%, #0f1f15 100%)',
        'gradient-canopy': 'linear-gradient(135deg, #86efac 0%, #4ade80 50%, #2d6a3f 100%)',
      },
    },
  },
  plugins: [],
}
