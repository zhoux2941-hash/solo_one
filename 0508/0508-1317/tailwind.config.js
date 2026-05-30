/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bronze: {
          50: '#faf5e4',
          100: '#f5e6c8',
          200: '#e8d5a8',
          300: '#d4a843',
          400: '#c49630',
          500: '#8b6914',
          600: '#6b4f0e',
          700: '#5c4a3a',
          800: '#2a1f10',
          900: '#1a1208',
        },
        cinnabar: {
          400: '#e8a8a0',
          500: '#c73e3a',
        },
      },
    },
  },
  plugins: [],
};
