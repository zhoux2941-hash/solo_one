/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      colors: {
        terminal: {
          bg: '#0a0a0a',
          text: '#00ff00',
          border: '#00ff00',
          prompt: '#ffff00',
          error: '#ff0000',
          info: '#00ffff',
        }
      }
    },
  },
  plugins: [],
}
