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
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        huffman: {
          bg: '#060e1a',
          card: '#0d1b2a',
          surface: '#0a1628',
          border: '#1e3a5f',
          accent: '#f0a500',
          node: '#00c9a7',
          text: '#e0e0e0',
        },
      },
    },
  },
  plugins: [],
};
