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
        ink: {
          DEFAULT: '#1a1a2e',
          light: '#252542',
          dark: '#12121f',
        },
        gold: {
          DEFAULT: '#c9a96e',
          light: '#dbbf8a',
          dark: '#a88b50',
          muted: 'rgba(201, 169, 110, 0.15)',
        },
        paper: {
          DEFAULT: '#f5f0e8',
          dark: '#e8e0d0',
          light: '#faf7f2',
        },
        vermillion: {
          DEFAULT: '#c0392b',
          light: '#e74c3c',
          dark: '#a93226',
        },
        indigo: {
          DEFAULT: '#2c5f7c',
          light: '#3a7ca5',
          dark: '#1e4157',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
