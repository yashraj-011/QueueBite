/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#24864B',
          'green-dark': '#17683A',
          'green-light': '#EEF5EF',
          orange: '#F28B36',
          'orange-dark': '#D8701F',
          'orange-light': '#FFF5EC',
          bg: '#FAF9F6',
          surface: '#FFFFFF',
          text: '#202722',
          muted: '#727870',
          border: '#E7E7E0',
          'surface-muted': '#EEF5EF',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(36, 134, 75, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(32, 39, 34, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 12px 32px -4px rgba(32, 39, 34, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'glow': '0 0 20px rgba(36, 134, 75, 0.18)',
      }
    },
  },
  plugins: [],
}
