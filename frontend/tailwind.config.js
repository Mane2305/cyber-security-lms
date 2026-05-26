/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
        ai: '#a855f7',
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
      },
    },
  },
  plugins: [],
};
