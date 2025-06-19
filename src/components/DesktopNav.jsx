// src/components/DesktopNav.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function DesktopNav({ currentUser }) {
  const { language } = useLanguage();
  const isLoggedIn = currentUser && currentUser.id;

  const navItemsList = [
    { to: '/', label_id: 'Beranda', label_en: 'Home', isPrivate: false },
    { to: '/events', label_id: 'Event', label_en: 'Events', isPrivate: false },
    { to: '/airdrops', label_id: 'Airdrop', label_en: 'Airdrops', isPrivate: false },
    { to: '/my-work', label_id: 'Garapanku', label_en: 'My Work', isPrivate: true },
    { to: '/profile', label_id: 'Profil', label_en: 'Profile', isPrivate: true },
  ];

  const navItems = navItemsList.filter(item => !item.isPrivate || isLoggedIn);
  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

  return (
    // [PERUBAHAN]: Ganti 'md:flex' menjadi 'lg-desktop:flex'
    // Navigasi ini sekarang akan disembunyikan secara default, dan baru ditampilkan (flex)
    // saat lebar layar mencapai 1100px atau lebih.
    <nav className="hidden lg-desktop:flex items-center gap-1 lg:gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200
            ${isActive 
              ? 'text-primary bg-primary/10'
              : 'text-light-subtle dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`
          }
        >
          {getLabel(item)}
        </NavLink>
      ))}
    </nav>
  );
}

