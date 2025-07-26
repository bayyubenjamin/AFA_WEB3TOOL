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
        
        // --- Palet Warna Adaptif ---
        'light-bg': '#f3f6fa',      // Latar belakang utama mode terang
        'light-card': '#ffffff',    // Latar kartu mode terang
        'light-text': '#1a202c',     // Teks utama mode terang
        'light-subtle': '#718096',  // Teks sekunder mode terang
        'light-border': '#e2e8f0',  // Border mode terang

        'dark-bg': '#0f172a',       // Latar belakang utama mode gelap
        'dark-card': '#1e293b',     // Latar kartu mode gelap
        'dark-text': '#e2e8f0',      // Teks utama mode gelap
        'dark-subtle': '#94a3b8',    // Teks sekunder mode gelap
        'dark-border': '#334155',   // Border mode gelap
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
        'sky-gradient': 'linear-gradient(180deg, #a0d8f5 0%, #f3f6fa 100%)',
        'dark-sky-gradient': 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

