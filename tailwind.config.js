/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'lg-desktop': '1100px',
      },
      colors: {
        // New Color Palette
        'primary': {
          DEFAULT: '#1B4DC1', // Deep Blue
          'dark': '#5887ff' // Lighter blue for dark mode text/highlights
        },
        'accent': {
          DEFAULT: '#F97D3C', // Bright Orange
          'dark': '#ff8d54' // Slightly brighter orange for dark mode
        },
        'light-bg': '#FFF8F0', // Creamy White
        'light-card': '#FFFFFF',
        'light-header': '#84D1F2',
        'light-soft': '#FCECD8',
        
        // Dark Mode Palette - ADJUSTED
        'dark-bg': '#0D1A2E',      // Deep Navy Blue (Background)
        'dark-card': '#192A44',     // A noticeably lighter, more distinct navy for cards
        'dark-text': '#E0E8F4',
        'dark-subtle': '#8899B3',
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
        'sky-gradient': 'linear-gradient(180deg, #a0d8f5 0%, #FFF8F0 100%)', // Softer blue gradient
        'dark-sky-gradient': 'linear-gradient(180deg, #122540 0%, #0D1A2E 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
