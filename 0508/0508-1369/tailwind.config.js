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
          50: "#f5f0e8",
          100: "#e8e0d0",
          200: "#d4c8b0",
          300: "#b8a888",
          400: "#9c8868",
          500: "#7a6848",
          600: "#5a4c38",
          700: "#3a3228",
          800: "#16213e",
          900: "#1a1a2e",
          950: "#0f0f1a",
        },
        gold: {
          DEFAULT: "#e2b714",
          light: "#f0d060",
          dark: "#b8920e",
          muted: "rgba(226, 183, 20, 0.15)",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Source Serif 4'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "count-up": "countUp 0.6s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
