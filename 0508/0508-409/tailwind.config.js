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
        paper: {
          DEFAULT: '#F5F0E6',
          dark: '#E8E0D0',
        },
        chinese: {
          red: '#C41E3A',
          gold: '#D4AF37',
          brown: '#3D2914',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          light: '#4A4A4A',
        },
      },
      fontFamily: {
        kai: ['"Ma Shan Zheng"', '"华文行楷"', 'cursive'],
        song: ['"Noto Serif SC"', '"宋体"', 'serif'],
      },
      boxShadow: {
        paper: '0 4px 20px rgba(61, 41, 20, 0.15), 0 1px 3px rgba(61, 41, 20, 0.1)',
        'paper-hover': '0 8px 30px rgba(61, 41, 20, 0.25), 0 2px 6px rgba(61, 41, 20, 0.15)',
        button: '0 4px 12px rgba(196, 30, 58, 0.3)',
        'button-hover': '0 6px 20px rgba(196, 30, 58, 0.4)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fold-in': 'fold-in 0.6s ease-in-out forwards',
        'unfold': 'unfold 0.4s ease-in-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(212, 175, 55, 0)' },
        },
        'fold-in': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'unfold': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
