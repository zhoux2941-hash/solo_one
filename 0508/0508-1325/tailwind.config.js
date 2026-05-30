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
        zhuang: {
          red: '#E63946',
          yellow: '#FFB703',
          darkBlue: '#1D3557',
          blue: '#457B9D',
          green: '#2A9D8F',
          orange: '#F4A261',
          cream: '#F1FAEE',
        }
      },
      fontFamily: {
        display: ['"Ma Shan Zheng"', 'cursive'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scorePopup: {
          '0%': { transform: 'scale(0.5) translateY(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2) translateY(-20px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-40px)', opacity: '0' },
        },
        cloudMove: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        ballSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(230, 57, 70, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(230, 57, 70, 0.8)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        scorePopup: 'scorePopup 1s ease-out forwards',
        cloudMove: 'cloudMove 30s linear infinite',
        ballSpin: 'ballSpin 0.5s linear infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
