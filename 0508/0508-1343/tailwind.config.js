/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        wenkai: ['"LXGW WenKai"', 'cursive'],
        mono: ['"DM Serif Display"', 'serif'],
      },
      colors: {
        bronze: {
          50: '#fdf8ef',
          100: '#f5ead6',
          200: '#e8d1a8',
          300: '#d4a056',
          400: '#c28a2e',
          500: '#8B6914',
          600: '#6d5310',
          700: '#4a380b',
          800: '#2a1c0e',
          900: '#1a1008',
        },
        cinnabar: {
          400: '#e05550',
          500: '#C73E3A',
          600: '#a83230',
          700: '#7d2523',
          800: '#5c1b1a',
        },
        xuan: {
          50: '#f5f0e8',
          100: '#e8e0d0',
          200: '#c8b898',
          300: '#8a7a5a',
          400: '#5a4a3a',
          500: '#3a3028',
          600: '#2C2C2C',
          700: '#1a1818',
          800: '#121010',
          900: '#0a0808',
        },
      },
    },
  },
  plugins: [],
};
