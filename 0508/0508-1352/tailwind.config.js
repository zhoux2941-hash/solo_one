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
          50: '#f0f7f2',
          100: '#daebe0',
          200: '#b6d7c2',
          300: '#86bc9a',
          400: '#539a6e',
          500: '#2f7b4e',
          600: '#1a472a',
          700: '#163a23',
          800: '#132e1c',
          900: '#0f2316',
        },
        gold: {
          50: '#fdf9ed',
          100: '#faf0d4',
          200: '#f5dea8',
          300: '#edc671',
          400: '#e4a83f',
          500: '#d4af37',
          600: '#c9971c',
          700: '#a77818',
          800: '#875f1a',
          900: '#6f4e19',
        },
        accent: {
          50: '#fff4ee',
          100: '#ffe4d6',
          200: '#ffc5ad',
          300: '#ff9c78',
          400: '#ff6b35',
          500: '#f54d12',
          600: '#e63608',
          700: '#bf2409',
          800: '#981e10',
          900: '#7a1c11',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
