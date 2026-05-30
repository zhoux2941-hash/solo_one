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
        ink: "#1a1a2e",
        gold: "#c9a96e",
        cinnabar: "#c23616",
        parchment: "#f5f0e8",
        indigo: "#2d6a4f",
        navy: "#1d3557",
      },
    },
  },
  plugins: [],
};
