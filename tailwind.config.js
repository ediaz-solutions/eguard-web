/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#f87171',
          400: '#ef4444',
          500: '#dc2626',
          600: '#c41e1e',
          700: '#a31616',
          800: '#7f1212',
          900: '#5c0e0e',
          950: '#3b0707',
        },
        navy: {
          50:  '#eef3fb',
          100: '#d4e0f4',
          200: '#a9c1e9',
          300: '#6b94d4',
          400: '#3a6dbe',
          500: '#1b4f8f',
          600: '#143d70',
          700: '#102f56',
          800: '#0c2240',
          900: '#081729',
          950: '#040d18',
        },
        surface: {
          50:  '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#c8c8c8',
          400: '#9e9e9e',
          500: '#757575',
          600: '#5a5a5a',
          700: '#404040',
          800: '#2a2a2a',
          900: '#1a1a1a',
          950: '#0f0f0f',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
