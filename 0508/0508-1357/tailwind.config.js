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
        "treehole": {
          "bg": "#1a1a2e",
          "bg-dark": "#0f0f1a",
          "card": "#16213e",
          "card-light": "#1f2a4a",
          "accent": "#ff6b35",
          "accent-light": "#ff9a56",
          "accent-dark": "#e55a2b",
          "text": "#e8e8f0",
          "text-muted": "#9090a8",
          "border": "#2a2a4e",
        }
      },
      fontFamily: {
        "display": ['"ZCOOL QingKe HuangYou"', 'cursive'],
        "body": ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delay": "float 6s ease-in-out infinite 2s",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "pop": "pop 0.3s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(255, 107, 53, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(255, 107, 53, 0.6)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
