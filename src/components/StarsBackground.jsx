// src/components/StarsBackground.jsx

import React, { useState, useEffect } from 'react';

// CSS Keyframes kita definisikan langsung di sini untuk memastikan ia terbaca
const animationKeyframes = `
  @keyframes move-bg-anim {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 1000px 1000px;
    }
  }
`;

const StarsBackground = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Fungsi ini memeriksa apakah elemen <html> memiliki kelas 'dark'
    const checkDarkMode = () => {
      const isDarkModeEnabled = document.documentElement.classList.contains('dark');
      setIsDark(isDarkModeEnabled);
    };

    // Panggil sekali saat komponen dimuat
    checkDarkMode();

    // Gunakan MutationObserver untuk memantau perubahan kelas pada <html>
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Hentikan observer saat komponen tidak lagi digunakan
    return () => observer.disconnect();
  }, []);

  // Jika bukan dark mode, komponen tidak akan merender apa-apa
  if (!isDark) {
    return null;
  }

  return (
    <>
      {/* Menyuntikkan definisi @keyframes langsung ke dalam halaman */}
      <style>{animationKeyframes}</style>

      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      >
        <div className="absolute inset-0 bg-dark-sky-gradient" />

        {/* Menerapkan animasi via inline style untuk prioritas CSS tertinggi */}
        <div
          className="absolute inset-0 bg-stars-large bg-repeat"
          style={{
            backgroundSize: '500px 500px',
            animation: 'move-bg-anim 100s linear infinite',
          }}
        />
        <div
          className="absolute inset-0 bg-stars-medium bg-repeat"
          style={{
            backgroundSize: '1000px 1000px',
            animation: 'move-bg-anim 150s linear infinite',
          }}
        />
        <div
          className="absolute inset-0 bg-stars-small bg-repeat"
          style={{
            backgroundSize: '1500px 1500px',
            animation: 'move-bg-anim 200s linear infinite',
          }}
        />
      </div>
    </>
  );
};

export default StarsBackground;
