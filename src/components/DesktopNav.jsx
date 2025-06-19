// src/components/DesktopNav.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/**
 * Komponen navigasi yang ditampilkan di header pada layar desktop.
 * @param {object} props - Props komponen.
 * @param {object} props.currentUser - Objek pengguna yang sedang login.
 */
export default function DesktopNav({ currentUser }) {
  const { language } = useLanguage();

  const navItems = [
    { to: '/', label_id: 'Beranda', label_en: 'Home' },
    { to: '/airdrops', label_id: 'Airdrop', label_en: 'Airdrops' },
    { to: '/my-work', label_id: 'Garapanku', label_en: 'My Work' },
    { to: '/events', label_id: 'Event', label_en: 'Events' },
    { to: '/profile', label_id: 'profil', label_en: 'Profile' },
  ];

  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

  // Jangan render navigasi jika pengguna tidak login
  if (!currentUser || !currentUser.id) {
    return null;
  }

  return (
    // 'hidden' secara default, dan 'flex' pada layar medium (md) ke atas
    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200
            ${isActive 
              ? 'text-primary bg-primary/10' // Style untuk link aktif
              : 'text-light-subtle dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10' // Style untuk link tidak aktif
            }`
          }
        >
          {getLabel(item)}
        </NavLink>
      ))}
    </nav>
  );
}

