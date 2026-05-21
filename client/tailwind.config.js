/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        surface: '#111827',
        border: '#1E2D45',
        accent: '#00D4FF',
        critical: '#FF4444',
        high: '#FF8C00',
        moderate: '#FFD700',
        resolved: '#00FF88',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
