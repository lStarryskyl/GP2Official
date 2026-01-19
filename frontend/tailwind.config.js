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
        // New Acorn Brand Colors (2024 Design System)
        'acorn-blue': {
          50: '#E6EDF4',
          100: '#CCDBE9',
          200: '#99B7D3',
          300: '#6693BD',
          400: '#336FA7',
          500: '#0D3B66', // Primary Blue
          600: '#0A2F52',
          700: '#08233D',
          800: '#051829',
          900: '#030C14',
        },
        'acorn-orange': {
          50: '#FEF0EB',
          100: '#FDE1D7',
          200: '#FBC3AF',
          300: '#F9A587',
          400: '#F7875F',
          500: '#F26C4F', // Accent Orange
          600: '#C2563F',
          700: '#91412F',
          800: '#612B20',
          900: '#301610',
        },
        'acorn-gray': {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
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
        'gradient-primary': 'linear-gradient(135deg, #0D3B66 0%, #F26C4F 100%)',
        'gradient-orange': 'linear-gradient(135deg, #F26C4F 0%, #F9A587 100%)',
        'gradient-blue': 'linear-gradient(135deg, #0D3B66 0%, #336FA7 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0D3B66 0%, #0A2F52 50%, #F26C4F 100%)',
      },
      boxShadow: {
        'acorn': '0 10px 30px rgba(242, 108, 79, 0.2)',
        'acorn-blue': '0 10px 30px rgba(13, 59, 102, 0.2)',
        'acorn-lg': '0 20px 60px rgba(242, 108, 79, 0.15)',
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
