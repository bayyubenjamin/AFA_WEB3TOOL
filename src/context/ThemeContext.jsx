// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Default ke 'dark', atau ambil dari localStorage jika ada
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('appTheme');
    return storedTheme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Hapus class lama dan tambahkan class baru
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    
    // Simpan preferensi tema
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const value = { theme, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
