/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './public/**/*.html',
    './public/js/**/*.js'
  ],
  theme: {
    extend: {
      screens: {
        xs: '475px'
      },
      fontFamily: {
        sans: ['"Noto Naskh Arabic"', '"Amiri"', 'serif'],
        serif: ['"Amiri"', '"Scheherazade New"', 'serif'],
        kurdish: ['"Noto Naskh Arabic"', '"Amiri"', 'serif'],
        islamic: ['"Amiri"', '"Noto Naskh Arabic"', 'serif'],
        latin: ['"Plus Jakarta Sans"', '"Noto Naskh Arabic"', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eefbfb',
          100: '#d5f5f6',
          400: '#00f2fe',
          500: '#4facfe',
          600: '#0072ff',
          900: '#001a40'
        }
      }
    }
  },
  plugins: []
};
