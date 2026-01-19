/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Acorn Brand Colors
        orange: {
          50: '#FFF5E6',
          100: '#FFE8CC',
          200: '#FFD199',
          300: '#FFB84D',
          400: '#F5A623',
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
          400: '#4A7BA7',
          500: '#2E5090',
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
          500: '#1B2D45',
          600: '#162437',
          700: '#0F1A2E',
          800: '#0B1220',
          900: '#060910',
        },
        // Semantic colors
        success: '#28A745',
        warning: '#FFC107',
        error: '#DC3545',
        info: '#17A2B8',
        // Keep existing shadcn colors for compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #F5A623 0%, #4A7BA7 50%, #2E5090 100%)',
        'gradient-orange': 'linear-gradient(135deg, #F5A623 0%, #FFB84D 100%)',
        'gradient-blue': 'linear-gradient(135deg, #4A7BA7 0%, #2E5090 100%)',
        'gradient-navy': 'linear-gradient(135deg, #1B2D45 0%, #0F1A2E 100%)',
      },
      boxShadow: {
        'acorn': '0 10px 30px rgba(245, 166, 35, 0.3)',
        'arrow': '0 10px 30px rgba(74, 123, 167, 0.3)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
