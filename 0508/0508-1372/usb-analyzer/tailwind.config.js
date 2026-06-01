/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        analyzer: {
          bg: "#0f1117",
          surface: "#1a1d27",
          border: "#2a2d3a",
          "border-light": "#3a3d4a",
          text: "#e1e4ec",
          "text-dim": "#8b8fa3",
          accent: "#6c8cff",
          "accent-hover": "#8ba4ff",
          success: "#4ade80",
          warning: "#fbbf24",
          danger: "#f87171",
          "bulk": "#60a5fa",
          "iso": "#4ade80",
          "interrupt": "#fbbf24",
          "uas": "#a78bfa",
          "in-dir": "#60a5fa",
          "out-dir": "#f87171",
        },
      },
      fontSize: {
        "hex": ["11px", "16px"],
        "hex-header": ["10px", "14px"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
