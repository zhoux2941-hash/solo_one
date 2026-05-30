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
        board: {
          wood: '#D4A76A',
          dark: '#1A1A2E',
          line: '#8B6914',
        },
        stone: {
          black: '#0D0D0D',
          white: '#F5F5F0',
        },
        accent: {
          red: '#C0392B',
          green: '#27AE60',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
