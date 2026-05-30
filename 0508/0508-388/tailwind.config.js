/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        display: ['"ZCOOL XiaoWei"', '"Noto Serif SC"', 'serif'],
      },
      colors: {
        ochre: '#8B4513',
        gold: '#C5A55A',
        cinnabar: '#C23616',
        ink: '#1A1A2E',
      },
    },
  },
  plugins: [],
};
