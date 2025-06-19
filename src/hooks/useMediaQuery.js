// src/hooks/useMediaQuery.js

import { useState, useEffect } from 'react';

/**
 * Hook kustom untuk melacak apakah media query tertentu cocok.
 * @param {string} query - String media query yang akan dilacak (misal: '(max-width: 768px)').
 * @returns {boolean} - Mengembalikan true jika query cocok, false jika tidak.
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Pastikan kode ini hanya berjalan di sisi klien
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    // Tambahkan listener untuk perubahan ukuran layar
    media.addEventListener('change', listener);
    
    // Bersihkan listener saat komponen dibongkar
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

