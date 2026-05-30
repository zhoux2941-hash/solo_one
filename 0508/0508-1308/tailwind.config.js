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
          DEFAULT: '#C41E3A',
          light: '#E63946',
          dark: '#A01830',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4D03F',
          dark: '#B8860B',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          light: '#333333',
          dark: '#000000',
        },
        stone: {
          DEFAULT: '#2E4A62',
          light: '#4A6FA5',
          dark: '#1E3A4F',
        },
        paper: {
          DEFAULT: '#F5F0E6',
          light: '#FAF8F3',
          dark: '#E8E0D0',
        },
      },
      fontFamily: {
        'display': ['"Ma Shan Zheng"', 'cursive'],
        'body': ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'draw': 'draw 1.5s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 15px rgba(212, 175, 55, 0)' },
        },
        draw: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
