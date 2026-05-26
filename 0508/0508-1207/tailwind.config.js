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
          900: "#1A2247",
          800: "#2D3561",
          700: "#3B4578",
          600: "#525B8C",
          500: "#7A83A8",
        },
        gold: {
          500: "#E7B86B",
          400: "#F0CA8B",
          300: "#F7DCAE",
        },
        cream: {
          50: "#FAF6EC",
          100: "#F5F1E8",
          200: "#ECE3CE",
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "ui-serif", "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(45, 53, 97, 0.25)",
        card: "0 4px 24px -8px rgba(45, 53, 97, 0.18)",
      },
    },
  },
  plugins: [],
};
