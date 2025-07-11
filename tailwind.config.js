// src/tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'lg-desktop': '1100px',
        'logo-bp': '1099px', // Tambahkan baris ini
      },
      colors: {
        'primary': {
          DEFAULT: '#0260ed',
          'dark': '#5887ff'
        },
        'accent': {
          DEFAULT: '#F97D3C',
          'dark': '#ff8d54'
        },
        'light-bg': '#FFF8F0',
        'light-card': '#FFFFFF',
        'light-header': '#84D1F2',
        'light-soft': '#FCECD8',
        'theme-light-text': '#333333', // NAMA BARU
        'dark-bg': '#0D1A2E',
        'dark-card': '#192A44',
        'theme-dark-text': '#E0E8F4', // NAMA BARU
        'dark-subtle': '#8899B3',
          // 🎯 Tambahan warna custom
        'afadark': '#2d3a5f',
      },
      fontFamily: {
        sans: ["Fredoka", "Baloo 2", "Quicksand", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'subtle': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        'subtle-dark': '0 6px 20px 0 rgba(0, 0, 0, 0.25)',
        'accent': '0 0 20px rgba(249, 125, 60, 0.5)',
        'primary': '0 0 20px rgba(27, 77, 193, 0.4)',
      },
      animation: {
        "gradient-shine": "gradientShine 5s linear infinite",
        "spin-slow": "spinSlow 10s linear infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sky-gradient': 'linear-gradient(180deg, #a0d8f5 0%, #FFF8F0 100%)',
        'dark-sky-gradient': 'linear-gradient(180deg, #122540 0%, #0D1A2E 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
