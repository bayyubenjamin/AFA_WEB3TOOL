// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7f5af0",
        dark: "#0a0a1a",
        card: "#101020",
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
