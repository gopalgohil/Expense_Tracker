/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',   // enable dark mode via .dark class on <html>
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0f0e0c',
          50:  '#f5f4f0',
          100: '#e8e6df',
          200: '#ccc9be',
          300: '#aaa69a',
          400: '#7a7670',
          500: '#4a4740',
          600: '#2e2c27',
          700: '#1a1916',
          800: '#0f0e0c',
        },
        sage: {
          DEFAULT: '#4a7c59',
          light: '#e8f0eb',
          mid:   '#c8dcd0',
          dark:  '#2d5a3d',
        },
        amber: {
          soft:   '#fff8ed',
          mid:    '#f6d591',
          strong: '#d4a017',
        },
        coral: {
          soft:    '#fef0ed',
          DEFAULT: '#e05a3a',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,14,12,0.08), 0 1px 2px rgba(15,14,12,0.06)',
        lift: '0 4px 16px rgba(15,14,12,0.10)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
