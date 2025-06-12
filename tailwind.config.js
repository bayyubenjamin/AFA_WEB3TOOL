// tailwind.config.js
module.exports = {
  // [TAMBAHAN]: Mengaktifkan mode gelap berbasis class
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warna Dark Mode (Asli)
        primary: "#7f5af0",
        dark: "#0a0a1a",
        card: "#101020",

        // [TAMBAHAN]: Warna untuk Light Mode
        'light-bg': '#f5f5f5',      // Latar belakang utama
        'light-card': '#ffffff',    // Latar belakang kartu/komponen
        'light-text': '#1a202c',     // Warna teks utama
        'light-subtle': '#718096', // Warna teks sekunder/abu-abu
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
        // [TAMBAHAN]: Keyframe untuk animasi putaran lambat
        spinSlow: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        "gradient-shine": "gradientShine 5s linear infinite",
        // [TAMBAHAN]: Animasi untuk putaran lambat
        "spin-slow": "spinSlow 10s linear infinite",
      },
      // [TAMBAHAN]: Utilitas untuk latar belakang gradasi radial
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  // PERBARUI BAGIAN INI
  plugins: [
    require('@tailwindcss/typography'), // <-- TAMBAHKAN BARIS INI
  ],
};
