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
        tcm: {
          ink: "#2d5a4a",
          gold: "#c9a962",
          cream: "#f5f0e6",
          sage: "#4a9e7e",
          coral: "#e8a87c",
          orange: "#d4753c",
          purple: "#9b7ec4",
          slate: "#6b8e9e",
          rust: "#c4654a",
          crimson: "#a34040",
          indigo: "#4a6e8e",
          olive: "#8cb369",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "sans-serif"],
        serif: ['"Noto Serif SC"', "serif"],
      },
    },
  },
  plugins: [],
};
