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
        'logo-bp': '1099px',
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
        'theme-light-text': '#333333',
        'dark-bg': '#000000',
        'dark-card': '#1B2735',
        'theme-dark-text': '#E0E8F4',
        'dark-subtle': '#8899B3',
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
      // Keyframes untuk animasi lain tetap ada, hanya yang berhubungan dengan bintang dihapus
      keyframes: {
        gradientShine: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        "gradient-shine": "gradientShine 5s linear infinite",
        "spin-slow": "spinSlow 10s linear infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sky-gradient': 'linear-gradient(180deg, #a0d8f5 0%, #FFF8F0 100%)',
        'dark-sky-gradient': 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
        // Semua definisi 'starfield' dan 'stars-*' telah dihapus.
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
