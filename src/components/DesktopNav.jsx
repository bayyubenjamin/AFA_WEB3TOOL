import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// PENAMBAHAN PROP 'hasNewAirdropNotification'
export default function DesktopNav({ currentUser, hasNewAirdropNotification }) {
  const { language } = useLanguage();
  const isLoggedIn = currentUser && currentUser.id;

  // Daftar navigasi utama
  const finalNavItemsList = [
    { to: '/', label_id: 'Beranda', label_en: 'Home', isPrivate: false },
    { to: '/warung-kripto', label_id: 'Warung Kripto', label_en: 'Crypto Market', isPrivate: false },
    { to: '/events', label_id: 'Event', label_en: 'Events', isPrivate: false },
    { to: '/airdrops', label_id: 'Airdrop', label_en: 'Airdrops', isPrivate: false, hasNotif: hasNewAirdropNotification },
    { to: '/my-work', label_id: 'Garapanku', label_en: 'My Work', isPrivate: false },
    // --- PERBAIKAN: Menu Profil Ditambahkan Kembali ---
    { to: '/profile', label_id: 'Profil', label_en: 'Profile', isPrivate: false }, 
  ];

  // Filter item berdasarkan status login (jika isPrivate true, user harus login)
  const navItems = finalNavItemsList.filter(item => !item.isPrivate || isLoggedIn);
  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

  return (
    <nav className="hidden lg-desktop:flex items-center gap-1 lg:gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-200 relative
            ${isActive 
              ? 'text-primary bg-primary/10'
              : 'text-light-subtle dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`
          }
        >
          {getLabel(item)}
          {/* PENAMBAHAN: Tampilkan titik notifikasi jika ada */}
          {item.hasNotif && (
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 border border-white dark:border-gray-800"></span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
