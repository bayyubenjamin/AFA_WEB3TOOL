// src/components/DesktopNav.jsx - KODE LENGKAP DIPERBAIKI

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faTasks, faCalendarAlt, faUser, faParachuteBox, faComments, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export default function DesktopNav({ currentUser, hasNewAirdropNotification }) {
  const { language } = useLanguage();
  const isLoggedIn = currentUser && currentUser.id;
  const isAdmin = currentUser?.id === 'e866df86-3206-4019-890f-01a61b989f15';

  const navItemsList = [
    { to: '/', label_id: 'Beranda', label_en: 'Home', icon: faHome, isPrivate: false },
    { to: '/events', label_id: 'Event', label_en: 'Events', icon: faCalendarAlt, isPrivate: false },
    { to: '/airdrops', label_id: 'Airdrop', label_en: 'Airdrops', icon: faParachuteBox, isPrivate: false, hasNotif: hasNewAirdropNotification },
    { to: '/my-work', label_id: 'Garapanku', label_en: 'My Work', icon: faTasks, isPrivate: true },
    { to: '/forum', label_id: 'Forum', label_en: 'Forum', icon: faComments, isPrivate: false },
    { to: '/profile', label_id: 'Profil', label_en: 'Profile', icon: faUser, isPrivate: true },
  ];

  const navItems = navItemsList.filter(item => !item.isPrivate || isLoggedIn);
  const getLabel = (item) => (language === 'id' ? item.label_id : item.label_en);

  return (
    // Diubah menjadi <aside> untuk sidebar, hanya muncul di layar besar (lg-desktop)
    <aside className="hidden lg-desktop:flex flex-col w-60 bg-light-card dark:bg-dark-card border-r border-black/5 dark:border-white/10 p-4 flex-shrink-0">
      <div className="flex items-center gap-3 mb-8 p-2">
        <img src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg" alt="Logo" className="h-10 w-10 rounded-full" />
        <h1 className="text-lg font-bold text-primary dark:text-white">AFA WEB3TOOL</h1>
      </div>
      <nav className="flex flex-col space-y-2 flex-grow">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg font-semibold text-sm transition-colors duration-200 relative ${
                isActive 
                  ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-white' 
                  : 'text-gray-600 dark:text-dark-subtle hover:bg-black/5 dark:hover:bg-dark-bg/60'
              }`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="w-5 mr-4" />
            <span>{getLabel(item)}</span>
            {item.hasNotif && (
              <span className="absolute top-1/2 right-3 -translate-y-1/2 block h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Tombol Admin Panel di bagian bawah jika user adalah admin */}
      {isAdmin && (
         <div className="mt-auto pt-4 border-t border-black/10 dark:border-white/10">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg font-semibold text-sm transition-colors duration-200 relative ${
                    isActive 
                    ? 'bg-red-500/10 text-red-400' 
                    : 'text-gray-600 dark:text-dark-subtle hover:bg-black/5 dark:hover:bg-dark-bg/60'
                }`
              }
            >
              <FontAwesomeIcon icon={faShieldHalved} className="w-5 mr-4" />
              <span>Admin Panel</span>
            </NavLink>
         </div>
       )}
    </aside>
  );
}
