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
      },
      animation: {
        "gradient-shine": "gradientShine 5s linear infinite",
      },
    },
  },
  plugins: [],
};

