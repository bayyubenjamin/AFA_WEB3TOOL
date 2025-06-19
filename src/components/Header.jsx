// src/components/Header.jsx (VERSI FINAL REVISI)

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGlobe, faShareAlt, faSignInAlt, faSignOutAlt, faSun, faMoon, faComments, faShieldHalved, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

export default function Header({ title, currentUser, onLogout, navigateTo, onlineUsers, isHeaderVisible }) {
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
    // [MODIFIKASI] Wrapper kini tanpa spasi atas (padding atas dihapus)
    <div className={`fixed top-0 left-0 right-0 z-[60] px-2 sm:px-4 py-2 transition-transform duration-300 ease-in-out ${!isHeaderVisible ? '-translate-y-full' : ''}`}>
      {/* [MODIFIKASI] Bentuk diubah menjadi rounded-3xl (tidak terlalu oval) */}
      <header className={`h-[var(--header-height)] px-4 flex items-center justify-between glassmorphism rounded-3xl shadow-lg shadow-black/5 dark:shadow-primary/10`}>
        <div className="flex items-center flex-1 min-w-0">
          <img
            src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg"
            alt="Logo AFA"
            className="h-10 w-10 rounded-full object-cover border-2 border-primary/50 flex-shrink-0 header-interactive-item"
          />
          {onlineUsers > 0 && (
            <div className="ml-4 flex items-center">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              <span className="ml-2 text-xs font-medium text-green-400">
                {onlineUsers}
                <span className="hidden sm:inline"> Online</span>
              </span>
            </div>
          )}
        </div>

        {/* [MODIFIKASI] font-bold ditambahkan untuk judul yang lebih tegas */}
        <h1
          id="headerTitle"
          className="text-xl sm:text-2xl font-bold mx-4 text-center header-title-premium"
        >
          {title}
        </h1>
        
        <div className="flex-1 flex justify-end items-center gap-2">
          <Link
            to="/forum"
            className="p-2 w-10 h-10 flex items-center justify-center header-interactive-item"
            aria-label="Forum"
          >
            <FontAwesomeIcon icon={faComments} className="text-xl text-light-subtle hover:text-light-text dark:text-gray-300 dark:hover:text-white" />
          </Link>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleOptionsMenu}
              className="p-2 w-10 h-10 flex items-center justify-center header-interactive-item"
              aria-label="Menu Opsi"
            >
              <FontAwesomeIcon icon={faBars} className="text-xl text-light-subtle hover:text-light-text dark:text-gray-300 dark:hover:text-white" />
            </button>
            
            <div className={`options-menu ${isOptionsMenuOpen ? 'active' : ''}`}>
               <ul>
                {isAdmin && (
                  <li onClick={handleAdminNav}>
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-2" /> Admin Panel
                  </li>
                )}
                 {currentUser && currentUser.id && (
                  <li onClick={handleProfileNav}>
                    <FontAwesomeIcon icon={faUserCircle} className="mr-2" /> {language === 'id' ? 'Profil Saya' : 'My Profile'}
                  </li>
                )}
                <li onClick={handleToggleTheme}>
                  <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="mr-2" />
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </li>
                <li onClick={() => handleLanguageChange('id')}>
                  <FontAwesomeIcon icon={faGlobe} className="mr-2" /> {language === 'id' ? 'Bahasa (ID)' : 'Language (ID)'}
                </li>
                <li onClick={() => handleLanguageChange('en')}>
                  <FontAwesomeIcon icon={faGlobe} className="mr-2" /> {language === 'id' ? 'Bahasa (EN)' : 'Language (EN)'}
                </li>
                <li onClick={handleShare}>
                  <FontAwesomeIcon icon={faShareAlt} className="mr-2" /> {language === 'id' ? 'Bagikan' : 'Share'}
                </li>
                {currentUser && currentUser.id ? (
                  <li onClick={handleLogoutAction}>
                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> {language === 'id' ? 'Logout' : 'Logout'}
                  </li>
                ) : (
                  <li onClick={handleLoginNav}>
                    <FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> {language === 'id' ? 'Login' : 'Login'}
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
