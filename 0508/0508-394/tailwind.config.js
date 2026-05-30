/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        wood: {
          50: '#F5F0E8',
          100: '#EFEBE9',
          200: '#D7CCC8',
          300: '#BCAAA4',
          400: '#A1887F',
          500: '#8D6E63',
          600: '#6D4C41',
          700: '#5D4037',
          800: '#4E342E',
          900: '#3E2723',
          950: '#2C1B0E',
        },
        vermilion: {
          DEFAULT: '#C62828',
          dark: '#8E0000',
        },
        gold: {
          DEFAULT: '#D4A843',
          light: '#E8C975',
        },
        parchment: '#F5F0E8',
        ink: '#1A1210',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
