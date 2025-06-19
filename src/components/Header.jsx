// src/components/Header.jsx (LOGIKA PENGUKURAN DINAMIS)

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGlobe, faShareAlt, faSignInAlt, faSignOutAlt, faSun, faMoon, faComments, faShieldHalved, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import DesktopNav from './DesktopNav';

const ADMIN_USER_ID = '9a405075-260e-407b-a7fe-2f05b9bb5766';

// [PERUBAHAN] Prop baru ditambahkan: isCompacted, setIsCompacted
export default function Header({ title, currentUser, onLogout, navigateTo, onlineUsers, isHeaderVisible, isCompacted, setIsCompacted }) {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { language, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = currentUser?.id === ADMIN_USER_ID;
  const navigate = useNavigate();

  // [PERUBAHAN] Ref untuk setiap bagian header
  const headerRef = useRef(null);
  const leftSectionRef = useRef(null);
  const titleRef = useRef(null);
  const rightSectionRef = useRef(null);
  
  // [PERUBAHAN] useLayoutEffect untuk mengukur elemen setelah render tapi sebelum paint
  useLayoutEffect(() => {
    const checkLayout = () => {
      // Pastikan semua elemen sudah ada di DOM
      if (headerRef.current && leftSectionRef.current && titleRef.current && rightSectionRef.current) {
        const leftWidth = leftSectionRef.current.offsetWidth;
        const titleWidth = titleRef.current.offsetWidth;
        const rightWidth = rightSectionRef.current.offsetWidth;
        const headerWidth = headerRef.current.offsetWidth;
        
        // Tambahkan buffer (misal: 40px) untuk padding dan gap
        const totalContentWidth = leftWidth + titleWidth + rightWidth + 40;

        // Jika total lebar konten lebih besar dari lebar header, aktifkan mode ringkas
        if (totalContentWidth > headerWidth) {
          setIsCompacted(true);
        } else {
          setIsCompacted(false);
        }
      }
    };

    checkLayout(); // Cek saat komponen dimuat

    // Tambahkan listener untuk mengecek ulang saat ukuran window berubah
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);

  }, [title, currentUser, onlineUsers, setIsCompacted]); // Jalankan lagi jika konten berubah


  const toggleOptionsMenu = () => setIsOptionsMenuOpen(prev => !prev);
  // ... (semua fungsi handle lainnya tetap sama)
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
      <header ref={headerRef} className={`h-[var(--header-height)] px-4 flex items-center justify-between glassmorphism rounded-full shadow-lg shadow-black/5 dark:shadow-primary/10`}>
        <div ref={leftSectionRef} className="flex items-center flex-1 min-w-0">
          <img
            src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg"
            alt="Logo AFA"
            className="h-10 w-10 rounded-full object-cover border-2 border-primary/50 flex-shrink-0 header-interactive-item"
          />
          <Link
            to="/forum"
            className="p-2 w-10 h-10 hidden md:flex items-center justify-center header-interactive-item ml-2"
            aria-label="Forum"
          >
            <FontAwesomeIcon icon={faComments} className="text-xl text-light-subtle hover:text-light-text dark:text-gray-300 dark:hover:text-white" />
          </Link>
          {onlineUsers > 0 && (
            <div className="ml-2 flex items-center">
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

        <h1 ref={titleRef} className="text-xl sm:text-2xl mx-4 text-center header-title-premium whitespace-nowrap">
          {title}
        </h1>
        
        <div ref={rightSectionRef} className="flex-1 flex justify-end items-center gap-2">
          {/* [PERUBAHAN] DesktopNav hanya ditampilkan jika header TIDAK ringkas */}
          {!isCompacted && <DesktopNav currentUser={currentUser} />}
          
          <Link
            to="/forum"
            className="p-2 w-10 h-10 flex md:hidden items-center justify-center header-interactive-item"
            aria-label="Forum"
          >
            <FontAwesomeIcon icon={faComments} className="text-xl text-light-subtle hover:text-light-text dark:text-gray-300 dark:hover:text-white" />
          </Link>
          
          <div className="relative" ref={menuRef}>
            <button onClick={toggleOptionsMenu} className="p-2 w-10 h-10 flex items-center justify-center header-interactive-item" aria-label="Menu Opsi">
              <FontAwesomeIcon icon={faBars} className="text-xl text-light-subtle hover:text-light-text dark:text-gray-300 dark:hover:text-white" />
            </button>
            <div className={`options-menu ${isOptionsMenuOpen ? 'active' : ''}`}>
               <ul>
                {isAdmin && (<li onClick={handleAdminNav}><FontAwesomeIcon icon={faShieldHalved} className="mr-2" /> Admin Panel</li>)}
                {currentUser && currentUser.id && (<li onClick={handleProfileNav}><FontAwesomeIcon icon={faUserCircle} className="mr-2" /> {language === 'id' ? 'Profil Saya' : 'My Profile'}</li>)}
                <li onClick={handleToggleTheme}><FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="mr-2" />{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</li>
                <li onClick={() => handleLanguageChange('id')}><FontAwesomeIcon icon={faGlobe} className="mr-2" /> {language === 'id' ? 'Bahasa (ID)' : 'Language (ID)'}</li>
                <li onClick={() => handleLanguageChange('en')}><FontAwesomeIcon icon={faGlobe} className="mr-2" /> {language === 'id' ? 'Bahasa (EN)' : 'Language (EN)'}</li>
                <li onClick={handleShare}><FontAwesomeIcon icon={faShareAlt} className="mr-2" /> {language === 'id' ? 'Bagikan' : 'Share'}</li>
                {currentUser && currentUser.id ? (<li onClick={handleLogoutAction}><FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> {language === 'id' ? 'Logout' : 'Logout'}</li>) : (<li onClick={handleLoginNav}><FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> {language === 'id' ? 'Login' : 'Login'}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

