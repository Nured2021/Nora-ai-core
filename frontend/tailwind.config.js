/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nora: {
          bg: '#0a0a0f',
          panel: '#0f0f1a',
          border: '#1e1e2e',
          accent: '#6366f1',
          'accent-glow': '#818cf8',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          muted: '#4b5563',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(99, 102, 241, 0.3)',
        'glow-md': '0 0 16px rgba(99, 102, 241, 0.4)',
        'glow-lg': '0 0 32px rgba(99, 102, 241, 0.5)',
      },
    },
  },
  plugins: [],
}

