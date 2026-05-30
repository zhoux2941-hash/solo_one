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
        ink: '#1a1a2e',
        'ink-light': '#2a2a4a',
        'ink-lighter': '#3a3a5a',
        parchment: '#f5f0e8',
        'parchment-dark': '#e8e0d0',
        'parchment-light': '#faf7f2',
        cinnabar: '#c23616',
        'cinnabar-dark': '#9b2c12',
        'cinnabar-light': '#e04525',
        bronze: '#2d6a4f',
        'bronze-light': '#40916c',
        'bronze-dark': '#1b4332',
        gold: '#b8860b',
        'gold-light': '#daa520',
      },
      fontFamily: {
        title: ['"Ma Shan Zheng"', '"ZCOOL XiaoWei"', 'serif'],
        body: ['"Noto Serif SC"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
