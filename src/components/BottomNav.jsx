// src/components/BottomNav.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTasks, faCalendarAlt, faUser, faParachuteBox } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '../context/LanguageContext';

export default function BottomNav({ currentUser }) {
  const { language } = useLanguage();
  const isLoggedIn = currentUser && currentUser.id;

  const allNavItems = [
    { to: '/', icon: faHome, label_id: 'Beranda', label_en: 'Home', isPrivate: false },
    { to: '/events', icon: faCalendarAlt, label_id: 'Event', label_en: 'Events', isPrivate: false },
    { to: '/airdrops', icon: faParachuteBox, label_id: 'Airdrop', label_en: 'Airdrops', isPrivate: false },
    { to: '/my-work', icon: faTasks, label_id: 'Garapanku', label_en: 'My Work', isPrivate: true },
    { to: '/profile', icon: faUser, label_id: 'Profil', label_en: 'Profile', isPrivate: true }
  ];

  const navItems = allNavItems.filter(item => !item.isPrivate || isLoggedIn);
  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

  return (
    // [PERUBAHAN]: Ganti 'md:hidden' menjadi 'lg-desktop:hidden'
    // Navigasi bawah ini sekarang akan hilang saat lebar layar mencapai 1100px atau lebih.
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full px-2 sm:px-4 pb-2 lg-desktop:hidden">
      <nav className={`max-w-md mx-auto h-16 px-2 grid grid-cols-${navItems.length} glassmorphism rounded-full shadow-lg shadow-black/5 dark:shadow-primary/10`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center text-center group"
            aria-label={getLabel(item)}
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center h-9 w-9">
                  <div 
                    className={`absolute inset-0 bg-primary rounded-full transition-transform duration-300 ease-in-out
                                ${isActive ? 'scale-100' : 'scale-0 group-hover:scale-100 group-hover:bg-primary/20'}`}
                  />
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className={`relative z-10 text-lg transition-colors duration-200
                               ${isActive ? 'text-white' : 'text-light-subtle dark:text-gray-400 group-hover:text-primary'}`} 
                  />
                </div>
                <span 
                  className={`text-xs mt-1 font-semibold transition-colors duration-200
                             ${isActive ? 'text-primary' : 'text-light-subtle dark:text-gray-500'}`}
                >
                  {getLabel(item)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

