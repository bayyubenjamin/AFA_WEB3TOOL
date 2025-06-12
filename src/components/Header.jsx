// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// [EDIT]: Menambahkan ikon faSun dan faMoon
import { faBars, faGlobe, faShareAlt, faSignInAlt, faSignOutAlt, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage
// [EDIT]: Menambahkan impor untuk useTheme
import { useTheme } from "../context/ThemeContext";

export default function Header({ title, currentUser, navigateTo }) {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { language, changeLanguage } = useLanguage(); // Gunakan hook useLanguage
  // [EDIT]: Menggunakan hook useTheme untuk mendapatkan state tema dan fungsi toggle
  const { theme, toggleTheme } = useTheme();

  const toggleOptionsMenu = () => {
    setIsOptionsMenuOpen(prev => !prev);
  };

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
    changeLanguage(lang); // Panggil fungsi changeLanguage dari context
    console.log(`Mengganti bahasa ke: ${lang}`);
    setIsOptionsMenuOpen(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).then(() => {
        console.log('Berhasil berbagi!');
      }).catch((error) => {
        console.error('Gagal berbagi:', error);
      });
    } else {
      alert("Fungsi berbagi tidak didukung di browser ini.");
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("URL telah disalin ke clipboard!"))
        .catch(err => console.error('Gagal menyalin URL: ', err));
    }
    setIsOptionsMenuOpen(false);
  };

  const handleAuthAction = () => {
    if (currentUser && currentUser.id) {
      navigateTo('profile');
    } else {
      navigateTo('profile');
    }
    setIsOptionsMenuOpen(false);
  };

  // [EDIT]: Menambahkan fungsi untuk handle toggle tema
  const handleToggleTheme = () => {
    toggleTheme();
    setIsOptionsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] p-4 flex items-center justify-between glassmorphism">
      <div className="flex-none">
        <img
          src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg"
          alt="Logo AFA"
          className="h-10 w-10 rounded-full object-cover border-2 border-primary/50"
        />
      </div>

      <h1
        id="headerTitle"
        className="text-xl sm:text-2xl font-bold futuristic-text-gradient mx-4 text-center flex-grow"
      >
        {title}
      </h1>

      <div className="relative flex-none" ref={menuRef}>
        <button
          onClick={toggleOptionsMenu}
          className="hamburger-menu"
          aria-label="Menu Opsi"
        >
          {/* [EDIT]: Mengubah class agar mendukung light/dark mode */}
          <FontAwesomeIcon icon={faBars} className="text-xl text-light-subtle hover:text-light-text dark:text-gray-300 dark:hover:text-white transition-colors duration-200" />
        </button>

        <div className={`options-menu ${isOptionsMenuOpen ? 'active' : ''}`}>
          <ul>
            {/* [EDIT]: Menambahkan list item untuk toggle tema */}
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
            <li onClick={handleAuthAction}>
              {currentUser && currentUser.id ? (
                <>
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> {language === 'id' ? 'Logout' : 'Logout'}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> {language === 'id' ? 'Login' : 'Login'}
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
