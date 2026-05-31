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
        'ancient-gold': '#D4AF37',
        'ancient-red': '#8B0000',
        'ancient-yellow': '#C4A35A',
        'ancient-brown': '#5C4033',
        'ancient-blue': '#1a365d',
        'ancient-slate': '#2d3748',
        'victory-gold': '#FFD700',
        'defeat-red': '#DC2626',
        'wall-stone': '#8B7355',
      },
    },
  },
  plugins: [],
};
