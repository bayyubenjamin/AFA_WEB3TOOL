// src/App.jsx - Kode Lengkap dengan Tombol Back to Top Otomatis Hilang

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Komponen
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import DesktopNav from './components/DesktopNav';
import BackToTopButton from './components/BackToTopButton';

// Halaman (diasumsikan sudah lengkap)
import PageHome from "./components/PageHome";
import PageMyWork from "./components/PageMyWork";
import PageAirdrops from "./components/PageAirdrops";
import PageAdminAirdrops from "./components/PageAdminAirdrops";
import PageForum from "./components/PageForum";
import PageProfile from "./components/PageProfile";
import AirdropDetailPage from "./components/AirdropDetailPage";
import PageManageUpdate from "./components/PageManageUpdate";
import PageEvents from './components/PageEvents';
import PageEventDetail from './components/PageEventDetail';
import PageAdminEvents from './components/PageAdminEvents';
import PageAdminDashboard from './components/PageAdminDashboard';
import PageLogin from "./components/PageLogin";
import PageRegister from "./components/PageRegister";
import PageAfaIdentity from './components/PageAfaIdentity';
import PageLoginWithTelegram from './components/PageLoginWithTelegram';
import TelegramAuthCallback from './components/TelegramAuthCallback';

// Utilitas
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

// Konstanta dan fungsi helper (tidak diubah)
const LS_CURRENT_USER_KEY = 'web3AirdropCurrentUser_final_v9';
const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

const defaultGuestUserForApp = { /* ... */ };
const mapSupabaseDataToAppUserForApp = (authUser, profileData) => { /* ... */ };
const createProfileForUser = async (user) => { /* ... */ };


export default function App() {
  // State (tidak berubah)
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [currentUser, setCurrentUser] = useState(null);
  const [userAirdrops, setUserAirdrops] = useState([]);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Refs
  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const backToTopTimeoutRef = useRef(null); // <-- REF BARU UNTUK TIMER

  // Hooks (tidak berubah)
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  // (Semua fungsi dan useEffect lain seperti checkAirdropNotifications, handleAuthChange, dll tetap sama)
  // ...

  // 👇 FUNGSI INI DIEDIT
  const handleScroll = (event) => {
    const currentScrollY = event.currentTarget.scrollTop;

    // Logika untuk sembunyikan/tampilkan header (tetap sama)
    if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
    lastScrollY.current = currentScrollY;

    // --- Logika Tombol Back to Top Otomatis Hilang ---

    // 1. Hapus timer yang sedang berjalan untuk me-reset
    if (backToTopTimeoutRef.current) {
      clearTimeout(backToTopTimeoutRef.current);
    }

    // 2. Cek apakah posisi scroll sudah cukup jauh
    if (currentScrollY > 400) {
      // Tampilkan tombol segera
      setShowBackToTop(true);

      // 3. Set timer baru untuk menyembunyikan tombol setelah 2 detik tidak ada scroll
      backToTopTimeoutRef.current = setTimeout(() => {
        setShowBackToTop(false);
      }, 2000); // 2000 milidetik = 2 detik
    } else {
      // Jika kembali ke atas, langsung sembunyikan tombol
      setShowBackToTop(false);
    }
  };

  // 👇 FUNGSI INI JUGA DIEDIT
  const scrollToTop = () => {
    if (pageContentRef.current) {
      pageContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    // Sembunyikan tombol setelah diklik
    setShowBackToTop(false);
    // Hapus juga timer yang mungkin sedang berjalan
    if (backToTopTimeoutRef.current) {
      clearTimeout(backToTopTimeoutRef.current);
    }
  };
  
  // (Semua useEffect lainnya tetap sama)
  // ...

  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.includes('/postairdrops') && !location.pathname.includes('/update') && !location.pathname.startsWith('/login-telegram') && !location.pathname.startsWith('/auth/telegram/callback');
  const mainPaddingBottomClass = showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6';

  return (
    // Struktur JSX utama tetap sama, hanya memanggil fungsi yang sudah diubah
    <div className="app-container font-sans h-screen flex flex-col md:flex-row overflow-hidden">
      {showNav && <DesktopNav currentUser={userForHeader} hasNewAirdropNotification={hasNewAirdropNotification} />}

      <div className="flex flex-col flex-grow h-screen overflow-hidden">
        {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={() => {}} navigateTo={navigate} onlineUsers={onlineUsers} isHeaderVisible={isHeaderVisible} hasNewAirdropNotification={hasNewAirdropNotification} />}
        
        <main 
          ref={pageContentRef} 
          onScroll={handleScroll} 
          className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto custom-scrollbar`}
        >
          <Routes>
            {/* ... (Semua Route Anda) ... */}
          </Routes>
        </main>
        
        {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      </div>
      
      {/* Tombol ini sekarang menggunakan state `showBackToTop` yang dikontrol oleh timer */}
      <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
      
      {/* Loading overlay (tetap sama) */}
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg transition-opacity duration-500 ${loadingInitialSession ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">{language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}</span>
      </div>
    </div>
  );
}
