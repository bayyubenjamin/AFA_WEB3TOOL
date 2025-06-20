/** @type {import('tailwindcss').Config} */
export default {
  // [BAGIAN PENTING 1] Opsi untuk mengaktifkan mode gelap via class 'dark'
  darkMode: 'class',

  // [BAGIAN PENTING 2] Path ke file-file yang menggunakan class Tailwind
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Bagian yang Anda berikan sudah benar
  theme: {
    extend: {
      screens: {
        'lg-desktop': '1100px',
      },
      colors: {
        'primary': '#7F5AF0',
        'secondary': '#2CB67D',
        'dark': '#0a0a1a',      // Latar belakang utama
        'card': '#101020',      // Latar belakang kartu/komponen
        'dark-stroke': '#72757E',
        'dark-text': '#FFFFFE',
        'dark-subtle': '#94A1B2',
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

  // Bagian ini juga sudah benar
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
