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
        'primary': '#7F5AF0',
        'secondary': '#2CB67D',
        
        // [PERBAIKAN]: Mengembalikan warna dark mode ke hitam pekat asli
        'dark': '#0a0a1a',      // Latar belakang utama
        'card': '#101020',      // Latar belakang kartu/komponen

        'dark-stroke': '#72757E',
        'dark-text': '#FFFFFE',
        'dark-subtle': '#94A1B2',

        // Skema Warna Light Mode (sudah benar)
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

