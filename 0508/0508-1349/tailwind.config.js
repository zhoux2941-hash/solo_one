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
        cream: {
          50: "#FDFCFA",
          100: "#FAF8F5",
          200: "#F5F0E8",
        },
        mint: {
          400: "#7EC8A3",
          500: "#5DB38B",
          600: "#4A9D76",
        },
        warm: {
          400: "#F4A261",
          500: "#E8924A",
          600: "#D67D35",
        },
        ink: {
          600: "#5C5450",
          700: "#4A4440",
          800: "#3A3532",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "progress-grow": "progressGrow 0.6s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        progressGrow: {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
      },
    },
  },
  plugins: [],
};
