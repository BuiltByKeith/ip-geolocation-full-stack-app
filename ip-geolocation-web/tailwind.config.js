/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b3c7fb',
          400: '#8aa5f8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3a4695',
          900: '#323d78',
        },
      },
    },
  },
  plugins: [],
}