// src/components/Header.jsx
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGlobe, faShareAlt, faSignInAlt, faSignOutAlt, faSun, faMoon, faComments, faShieldHalved, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import DesktopNav from './DesktopNav';

const ADMIN_USER_ID = 'e866df86-3206-4019-890f-01a61b989f15';

const Header = ({ title, currentUser, onLogout, navigateTo, onlineUsers, isHeaderVisible, hasNewAirdropNotification }) => {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = currentUser?.id === ADMIN_USER_ID;
  const navigate = useNavigate();

  const toggleOptionsMenu = useCallback(() => setIsOptionsMenuOpen(prev => !prev), []);

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
 
  const handleLanguageChange = useCallback((lang) => {
    changeLanguage(lang);
    setIsOptionsMenuOpen(false);
  }, [changeLanguage]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href })
        .catch((error) => console.error('Gagal berbagi:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("URL telah disalin ke clipboard!"))
        .catch(err => console.error('Gagal menyalin URL: ', err));
    }
    setIsOptionsMenuOpen(false);
  }, []);
 
  const handleNav = useCallback((path) => {
    if (navigateTo) navigateTo(path);
    else navigate(path);
    setIsOptionsMenuOpen(false);
  }, [navigateTo, navigate]);

  const handleLogoutAction = useCallback(() => {
    if (onLogout) onLogout();
    setIsOptionsMenuOpen(false);
  }, [onLogout]);

  // Render optimization: Pastikan item list statis tidak dibuat ulang setiap render
  const menuItems = [
    isAdmin && { icon: faShieldHalved, label: 'Admin Panel', action: () => handleNav('/admin') },
    currentUser?.id && { icon: faUserCircle, label: language === 'id' ? 'Profil Saya' : 'My Profile', action: () => handleNav('/profile') },
    { icon: theme === 'dark' ? faSun : faMoon, label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', action: () => { toggleTheme(); setIsOptionsMenuOpen(false); } },
    { icon: faGlobe, label: language === 'id' ? 'Bahasa (ID)' : 'Language (ID)', action: () => handleLanguageChange('id') },
    { icon: faGlobe, label: language === 'id' ? 'Bahasa (EN)' : 'Language (EN)', action: () => handleLanguageChange('en') },
    { icon: faShareAlt, label: language === 'id' ? 'Bagikan' : 'Share', action: handleShare },
    currentUser?.id 
        ? { icon: faSignOutAlt, label: 'Logout', action: handleLogoutAction, className: "text-red-500 hover:!bg-red-500/10" }
        : { icon: faSignInAlt, label: 'Login', action: () => handleNav('/login') }
  ].filter(Boolean);

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] px-2 sm:px-4 pt-3 transition-transform duration-300 ease-in-out ${!isHeaderVisible ? '-translate-y-full' : ''}`}>
      <header className={`h-[var(--header-height)] px-4 flex items-center justify-between glassmorphism rounded-full shadow-lg`}>
        <div className="flex items-center flex-1 min-w-0">
          <img src="/assets/logo.png" alt="Logo AFA" className="h-10 w-10 rounded-full object-cover border-2 border-accent/50 flex-shrink-0" />

          <Link to="/forum" className="p-2 w-10 h-10 hidden logo-bp:flex items-center justify-center header-interactive-item ml-2" aria-label="Forum">
            <FontAwesomeIcon icon={faComments} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
          </Link>
          
          {onlineUsers > 0 && (
            <div className="ml-2 flex items-center animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              <span className="ml-2 text-xs font-semibold text-green-500">
                {onlineUsers} <span className="hidden sm:inline">Online</span>
              </span>
            </div>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl mx-4 text-center header-title-premium truncate max-w-[50%]">
          {title}
        </h1>
       
        <div className="flex-1 flex justify-end items-center gap-2">
          <DesktopNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />
         
          <Link to="/forum" className="p-2 w-10 h-10 flex logo-bp:hidden items-center justify-center header-interactive-item">
            <FontAwesomeIcon icon={faComments} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
          </Link>

          {/* PERBAIKAN: Menambahkan tombol Profil di tampilan mobile jika user login */}
          {currentUser?.id && (
            <Link to="/profile" className="p-2 w-10 h-10 flex logo-bp:hidden items-center justify-center header-interactive-item" aria-label="Profile">
              <FontAwesomeIcon icon={faUserCircle} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
            </Link>
          )}
         
          <div className="relative" ref={menuRef}>
            <button onClick={toggleOptionsMenu} className="p-2 w-10 h-10 flex items-center justify-center header-interactive-item" aria-label="Menu">
              <FontAwesomeIcon icon={faBars} className="text-xl text-gray-500 dark:text-dark-subtle hover:text-accent dark:hover:text-accent-dark" />
            </button>
           
            <div className={`options-menu ${isOptionsMenuOpen ? 'active' : ''}`}>
                <ul>
                  {menuItems.map((item, index) => (
                    <li key={index} onClick={item.action} className={item.className || ''}>
                      <FontAwesomeIcon icon={item.icon} className="w-5" /> {item.label}
                    </li>
                  ))}
                </ul>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

// Optimasi: Hanya render ulang jika props berubah signifikan
export default memo(Header);
