// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react"; // Tambahkan useRef
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faGlobe, faShareAlt, faSignInAlt, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

export default function Header({ title, currentUser, navigateTo }) {
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const menuRef = useRef(null); // Buat ref untuk menu opsi

  const toggleOptionsMenu = () => {
    setIsOptionsMenuOpen(prev => !prev);
  };

  // Efek untuk menutup menu ketika klik di luar
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
  }, []); // Hanya dijalankan sekali saat mount

  const handleLanguageChange = (lang) => {
    console.log(`Mengganti bahasa ke: ${lang}`);
    // Logika untuk mengganti bahasa di sini
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
      // Jika user sudah login, ini adalah aksi logout
      navigateTo('profile'); // Arahkan ke halaman profil untuk logout
    } else {
      // Jika user belum login, ini adalah aksi login
      navigateTo('profile'); // Arahkan ke halaman profil untuk login
    }
    setIsOptionsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] p-4 flex items-center justify-between glassmorphism">
      {/* Bagian Kiri: Logo AFA */}
      <div className="flex-none">
        <img
          src="https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg"
          alt="Logo AFA"
          className="h-10 w-10 rounded-full object-cover border-2 border-primary/50"
        />
      </div>

      {/* Bagian Tengah: Judul Halaman */}
      <h1
        id="headerTitle"
        className="text-xl sm:text-2xl font-bold futuristic-text-gradient mx-4 text-center flex-grow"
      >
        {title}
      </h1>

      {/* Bagian Kanan: Menu Hamburger */}
      <div className="relative flex-none" ref={menuRef}> {/* Tambahkan ref di sini */}
        <button 
          onClick={toggleOptionsMenu} 
          className="hamburger-menu" 
          aria-label="Menu Opsi"
        >
          <FontAwesomeIcon icon={faBars} className="text-xl text-gray-300 hover:text-white transition-colors duration-200" />
        </button>

        {/* Gunakan class 'active' secara kondisional berdasarkan state */}
        <div className={`options-menu ${isOptionsMenuOpen ? 'active' : ''}`}> 
          <ul>
            <li onClick={() => handleLanguageChange('id')}>
              <FontAwesomeIcon icon={faGlobe} className="mr-2" /> Bahasa (ID)
            </li>
            <li onClick={() => handleLanguageChange('en')}>
              <FontAwesomeIcon icon={faGlobe} className="mr-2" /> Language (EN)
            </li>
            <li onClick={handleShare}>
              <FontAwesomeIcon icon={faShareAlt} className="mr-2" /> Bagikan
            </li>
            <li onClick={handleAuthAction}>
              {currentUser && currentUser.id ? (
                <>
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Logout
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSignInAlt} className="mr-2" /> Login
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
