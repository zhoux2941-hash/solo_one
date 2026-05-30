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
        primary: {
          50: "#E8EEF5",
          100: "#C5D3E4",
          200: "#9FB4D1",
          300: "#7895BE",
          400: "#5C7CB0",
          500: "#3F63A1",
          600: "#1E3A5F",
          700: "#1A3352",
          800: "#152C45",
          900: "#0E1F2F",
        },
        wood: {
          100: "#F5EFE6",
          200: "#E8DCC8",
          300: "#D9C7A9",
          400: "#C4A574",
          500: "#A88B5A",
        },
        wine: {
          400: "#B83232",
          500: "#9B2C2C",
          600: "#742A2A",
        },
        heritage: {
          bg: "#F5F0E8",
          text: "#2D3748",
          accent: "#C4A574",
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', "serif"],
        body: ['"Noto Sans SC"', "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "bounce-in": "bounce-in 0.5s ease-out",
        "shake": "shake 0.4s ease-in-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
