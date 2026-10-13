/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0A0F1D',
          card: '#11192C',
          cardHover: '#17223B',
          border: '#1E2D4A',
          borderLight: '#2A3C63',
          text: '#E2E8F0',
          muted: '#8E9EB8',
          accent: '#00F0FF',
          accentGlow: 'rgba(0, 240, 255, 0.15)',
          teal: '#00E5A3',
          purple: '#A855F7',
          critical: '#EF4444',
          high: '#F97316',
          medium: '#F59E0B',
          low: '#3B82F6',
          success: '#10B981',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
