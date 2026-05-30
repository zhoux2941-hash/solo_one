/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'indigo-dark': '#1A2332',
        cream: '#F5F0E8',
        'wax-yellow': '#D4A84B',
        'wax-dark': '#B8922E',
      },
      fontFamily: {
        display: ['"ZCOOL XiaoWei"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
