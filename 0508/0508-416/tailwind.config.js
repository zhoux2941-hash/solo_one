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
        background: "#0f172a",
        surface: "#1e293b",
        "surface-light": "#334155",
        prime: "#10b981",
        "prime-glow": "rgba(16, 185, 129, 0.4)",
        composite: "#64748b",
        "composite-line": "#ef4444",
        current: "#f59e0b",
        "current-glow": "rgba(245, 158, 11, 0.5)",
        unprocessed: "#94a3b8",
        "being-marked": "#f97316",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "scale-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "strike-through": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulse: "pulse 1.5s ease-in-out infinite",
        "scale-pulse": "scale-pulse 0.8s ease-in-out",
        "strike-through": "strike-through 0.4s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
