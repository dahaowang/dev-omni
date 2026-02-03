/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Colors mapped to CSS Variables
        app: {
          bg: 'var(--color-app-bg)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
        },
        panel: {
          bg: 'var(--color-panel-bg)',
        },
        element: {
          bg: 'var(--color-element-bg)',
        },
        input: {
          bg: 'var(--color-input-bg)',
        },
        border: {
          base: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        active: {
          item: 'var(--color-active-item)',
        },
        hover: {
          overlay: 'var(--color-hover-overlay)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up-fade': 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      }
    },
  },
  plugins: [],
}