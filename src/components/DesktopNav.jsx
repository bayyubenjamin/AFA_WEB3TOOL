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
  const isLoggedIn = currentUser && currentUser.id;

  // Definisikan semua kemungkinan item navigasi
  const navItemsList = [
    { to: '/', label_id: 'Beranda', label_en: 'Home', isPrivate: false },
    { to: '/events', label_id: 'Event', label_en: 'Events', isPrivate: false },
    { to: '/airdrops', label_id: 'Airdrop', label_en: 'Airdrops', isPrivate: false },
    { to: '/my-work', label_id: 'Garapanku', label_en: 'My Work', isPrivate: false },
    { to: '/profile', label_id: 'profil', label_en: 'Profile', isPrivate: false },
  ];

  // Filter item yang akan ditampilkan berdasarkan status login
  const navItems = navItemsList.filter(item => !item.isPrivate || isLoggedIn);

  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

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

