/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#16A34A',
          'green-dark': '#15803D',
          'green-light': '#DCFCE7',
          black: '#0A0A0A',
          gray: '#374151',
          'gray-light': '#F9FAFB',
          'gray-border': '#E5E7EB',
          // ============================================
          // Amber — warnings only
          // (low battery, maintenance status, medium severity)
          // ============================================
          amber: '#F59E0B',
          'amber-dark': '#B45309',
          'amber-light': '#FEF3C7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};