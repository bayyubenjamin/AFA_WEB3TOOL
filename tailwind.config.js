/** @type {import('tailwindcss').Config} */
export default {
  // Mengaktifkan mode gelap berbasis class
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
        // Skema Warna Dark Mode
        'primary': '#7F5AF0',
        'secondary': '#2CB67D',
        'dark': '#16161A',
        'dark-card': '#242629',
        'dark-stroke': '#72757E',
        'dark-text': '#FFFFFE',
        'dark-subtle': '#94A1B2',

        // [PERBAIKAN]: Mengubah 'light' menjadi 'light-bg' agar cocok dengan CSS
        'light-bg': '#F9F9F9', 
        'light-card': '#ffffff',
        'light-text': '#242629',
        'light-subtle': '#94A1B2',
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 10px #7f5af0, 0 0 20px #7f5af0 inset",
      },
      keyframes: {
        gradientShine: {
          "0%": { backgroundPosition: "0% center" },
          "50%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "0% center" },
        },
        spinSlow: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        "gradient-shine": "gradientShine 5s linear infinite",
        "spin-slow": "spinSlow 10s linear infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

