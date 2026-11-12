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
        // Enterprise Design Tokens
        brand: {
          bg: '#0B1120',
          sidebar: '#0D1422',
          surface: '#111B2E',
          surfaceHover: '#162237',
          secondary: '#162237',
          border: '#263449',
          borderLight: '#334155',
          text: '#F8FAFC',
          textSecondary: '#A7B3C7',
          muted: '#8190A8',
          accent: '#22D3EE',
          accentHover: '#06B6D4',
          success: '#34D399',
          warning: '#FBBF24',
          critical: '#F87171',
          high: '#FB923C',
          medium: '#FBBF24',
          low: '#60A5FA',
        },
        // Backward-compatible cyber alias mapping cleanly to enterprise tokens
        cyber: {
          bg: '#0B1120',
          card: '#111B2E',
          cardHover: '#162237',
          border: '#263449',
          borderLight: '#334155',
          text: '#F8FAFC',
          muted: '#A7B3C7',
          accent: '#22D3EE',
          accentGlow: 'rgba(34, 211, 238, 0.1)',
          teal: '#34D399',
          purple: '#A855F7',
          critical: '#F87171',
          high: '#FB923C',
          medium: '#FBBF24',
          low: '#60A5FA',
          success: '#34D399',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
