// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Mengambil tema dari localStorage atau mendeteksi preferensi sistem OS
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('appTheme');
    if (storedTheme) return storedTheme;
    
    // Fallback ke preferensi sistem jika tidak ada simpanan lokal
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Hapus kedua class untuk memastikan bersih sebelum menambah yang baru
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Simpan preferensi tema
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // OPTIMASI: Menggunakan useMemo agar value tidak berubah di setiap render
  // kecuali state theme benar-benar berubah.
  const value = useMemo(() => ({
    theme,
    toggleTheme
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};