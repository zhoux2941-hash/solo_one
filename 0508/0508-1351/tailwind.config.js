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
          50: '#f5f8f7',
          100: '#e6eeed',
          200: '#c5d9d7',
          300: '#9abfbc',
          400: '#6a9e9a',
          500: '#4a807c',
          600: '#3a6663',
          700: '#2d5250',
          800: '#1a4d4d',
          900: '#0f2f2f',
        },
        cinnabar: {
          400: '#dc5a5a',
          500: '#c23a3a',
          600: '#9b2e2e',
        },
        jade: {
          400: '#5aa05a',
          500: '#3a7d3a',
          600: '#2e632e',
        },
        gold: {
          400: '#d4a854',
          500: '#b8892f',
          600: '#936e25',
        },
        parchment: {
          50: '#fdfcf8',
          100: '#f9f5eb',
          200: '#f0e7d0',
        },
      },
      fontFamily: {
        'calligraphy': ['"Ma Shan Zheng"', 'cursive'],
        'serif-sc': ['"Noto Serif SC"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
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
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(58, 125, 58, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(58, 125, 58, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
