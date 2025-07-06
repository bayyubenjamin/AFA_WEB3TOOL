// src/components/Header.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGlobe, faShareAlt, faSignInAlt, faSignOutAlt, faSun, faMoon, faComments, faShieldHalved, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import DesktopNav from './DesktopNav';

const ADMIN_USER_ID = 'e866df86-3206-4019-890f-01a61b989f15';

// PENAMBAHAN PROP 'hasNewAirdropNotification'
export default function Header({ title, currentUser, onLogout, navigateTo, onlineUsers, isHeaderVisible, hasNewAirdropNotification }) {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = currentUser?.id === ADMIN_USER_ID;
  const navigate = useNavigate();

  const toggleOptionsMenu = () => setIsOptionsMenuOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOptionsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
 
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setIsOptionsMenuOpen(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href, })
        .catch((error) => console.error('Gagal berbagi:', error));
    } else {
      alert("Fungsi berbagi tidak didukung di browser ini.");
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("URL telah disalin ke clipboard!"))
        .catch(err => console.error('Gagal menyalin URL: ', err));
    }
    setIsOptionsMenuOpen(false);
  };
 
  const handleLoginNav = () => {
    navigateTo('/login');
    setIsOptionsMenuOpen(false);
  }

  const handleProfileNav = () => {
    navigateTo('/profile');
    setIsOptionsMenuOpen(false);
  }
 
  const handleAdminNav = () => {
    navigate('/admin');
    setIsOptionsMenuOpen(false);
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setIsOptionsMenuOpen(false);
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    }
    setIsOptionsMenuOpen(false);
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] px-2 sm:px-4 pt-3 transition-transform duration-300 ease-in-out ${!isHeaderVisible ? '-translate-y-full' : ''}`}>
      <header className={`h-[var(--header-height)] px-4 flex items-center justify-between glassmorphism rounded-full shadow-lg`}>
        <div className="flex items-center flex-1 min-w-0">
          <img
            src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg"
            alt="Logo AFA"
            className="h-10 w-10 rounded-full object-cover border-2 border-accent/50 flex-shrink-0 header-interactive-item"
          />
          <Link
            to="/forum"
            className="p-2 w-10 h-10 hidden logo-bp:flex items-center justify-center header-interactive-item ml-2"
            aria-label="Forum"
          >
            <FontAwesomeIcon icon={faComments} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
          </Link>
          {onlineUsers > 0 && (
            <div className="ml-2 flex items-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              <span className="ml-2 text-xs font-semibold text-green-500">
                {onlineUsers}
                <span className="hidden sm:inline"> Online</span>
              </span>
            </div>
          )}
        </div>

        <h1
          id="headerTitle"
          className="text-xl sm:text-2xl mx-4 text-center header-title-premium"
        >
          {title}
        </h1>
       
        <div className="flex-1 flex justify-end items-center gap-2">
          {/* PENAMBAHAN: Meneruskan prop 'hasNewAirdropNotification' ke DesktopNav */}
          <DesktopNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />
         
          <Link
            to="/forum"
            className="p-2 w-10 h-10 flex logo-bp:hidden items-center justify-center header-interactive-item"
            aria-label="Forum"
          >
            <FontAwesomeIcon icon={faComments} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
          </Link>
         
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleOptionsMenu}
              className="p-2 w-10 h-10 flex items-center justify-center header-interactive-item"
              aria-label="Menu Opsi"
            >
              <FontAwesomeIcon icon={faBars} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
            </button>
           
            <div className={`options-menu ${isOptionsMenuOpen ? 'active' : ''}`}>
                <ul>
                 {isAdmin && (
                    <li onClick={handleAdminNav}>
                      <FontAwesomeIcon icon={faShieldHalved} /> Admin Panel
                    </li>
                  )}
                  {currentUser && currentUser.id && (
                    <li onClick={handleProfileNav}>
                      <FontAwesomeIcon icon={faUserCircle} /> {language === 'id' ? 'Profil Saya' : 'My Profile'}
                    </li>
                  )}
                  <li onClick={handleToggleTheme}>
                    <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </li>
                  <li onClick={() => handleLanguageChange('id')}>
                    <FontAwesomeIcon icon={faGlobe} /> {language === 'id' ? 'Bahasa (ID)' : 'Language (ID)'}
                  </li>
                  <li onClick={() => handleLanguageChange('en')}>
                    <FontAwesomeIcon icon={faGlobe} /> {language === 'id' ? 'Bahasa (EN)' : 'Language (EN)'}
                  </li>
                  <li onClick={handleShare}>
                    <FontAwesomeIcon icon={faShareAlt} /> {language === 'id' ? 'Bagikan' : 'Share'}
                  </li>
                  {currentUser && currentUser.id ? (
                    <li onClick={handleLogoutAction} className="text-red-500 dark:text-red-400 hover:!bg-red-500/10">
                      <FontAwesomeIcon icon={faSignOutAlt} /> {language === 'id' ? 'Logout' : 'Logout'}
                    </li>
                  ) : (
                    <li onClick={handleLoginNav}>
                      <FontAwesomeIcon icon={faSignInAlt} /> {language === 'id' ? 'Login' : 'Login'}
                    </li>
                  )}
                </ul>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
