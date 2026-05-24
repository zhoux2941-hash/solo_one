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
        museum: {
          50: "#f0f7f8",
          100: "#d9ebee",
          200: "#b7d7dc",
          300: "#89bbc4",
          400: "#5c99a5",
          500: "#3d7b88",
          600: "#1a535c",
          700: "#17444b",
          800: "#16383e",
          900: "#162f34",
          950: "#0b1a1d",
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#ff9f1c",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        forest: {
          50: "#eff6f2",
          100: "#d7e9df",
          200: "#b3d3c3",
          300: "#85b7a0",
          400: "#5e967e",
          500: "#427a64",
          600: "#2d6a4f",
          700: "#265641",
          800: "#214536",
          900: "#1c392d",
          950: "#0d1f18",
        },
      },
      fontFamily: {
        serif: ["'Noto Serif SC'", "serif"],
        sans: ["'Noto Sans SC'", "sans-serif"],
      },
      boxShadow: {
        "museum-card": "0 4px 20px -2px rgba(26, 83, 92, 0.15)",
        "museum-hover": "0 8px 30px -4px rgba(26, 83, 92, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "diff-flash": "diffFlash 0.5s ease-in-out",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        diffFlash: {
          "0%, 100%": { "box-shadow": "0 0 0 0 rgba(255, 159, 28, 0)" },
          "50%": { "box-shadow": "0 0 0 8px rgba(255, 159, 28, 0.3)" },
        },
      },
    },
  },
  plugins: [],
};
