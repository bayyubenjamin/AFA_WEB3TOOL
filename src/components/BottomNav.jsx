// src/components/BottomNav.jsx (MODIFIKASI: SEMBUNYI DI DESKTOP)

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faRocket, faTasks, faCalendarAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav({ currentUser }) {
  const { language } = useLanguage();

  // [PERUBAHAN] Hapus 'Profile' dari item nav bawah
  const navItems = [
    { to: '/', icon: faHome, label_id: 'Beranda', label_en: 'Home' },
    { to: '/airdrops', icon: faRocket, label_id: 'Airdrop', label_en: 'Airdrops' },
    { to: '/my-work', icon: faTasks, label_id: 'Garapanku', label_en: 'My Work' },
    { to: '/events', icon: faCalendarAlt, label_id: 'Event', label_en: 'Events' },
  ];

  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

  // [PERUBAHAN UTAMA DI SINI]
  // Menambahkan kelas `md:hidden` untuk menyembunyikannya di layar medium (desktop) ke atas.
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full px-2 sm:px-4 pb-2 md:hidden">
      {/* [PERUBAHAN] Mengubah grid menjadi 4 kolom karena item Profil dihapus */}
      <nav className="max-w-md mx-auto h-[var(--bottomnav-height)] grid grid-cols-4 glassmorphism rounded-2xl shadow-lg shadow-black/5 dark:shadow-primary/10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center transition-colors duration-300 
               ${isActive ? 'text-primary' : 'text-light-subtle dark:text-gray-400 hover:text-light-text dark:hover:text-white'}`
            }
          >
            {({ isActive }) => (
              <>
                <div 
                  className={`w-14 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out
                            ${isActive ? 'bg-primary/10 scale-110' : 'scale-100'}`}
                >
                  <FontAwesomeIcon icon={item.icon} className="text-xl" />
                </div>
                <span className="text-xs mt-1 font-medium">{getLabel(item)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

