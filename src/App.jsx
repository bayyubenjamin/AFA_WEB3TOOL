// src/App.jsx - KODE LENGKAP DENGAN LOGIKA JARAK SCROLL

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Komponen Aplikasi
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import DesktopNav from './components/DesktopNav';
import BackToTopButton from './components/BackToTopButton';

// Halaman-halaman Aplikasi
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

// Utilitas & Lainnya
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

// (Konstanta & Fungsi Helper tidak berubah)
const LS_CURRENT_USER_KEY = 'web3AirdropCurrentUser_final_v9';
const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`,
  address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
  user_metadata: {}
};

const mapSupabaseDataToAppUserForApp = (authUser, profileData) => {
  if (!authUser) return defaultGuestUserForApp;
  return {
    id: authUser.id, email: authUser.email,
    username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
    name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
    avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url || defaultGuestUserForApp.avatar_url,
    stats: profileData?.stats || defaultGuestUserForApp.stats,
    address: profileData?.web3_address || null,
    telegram_user_id: profileData?.telegram_user_id || null, 
    user_metadata: authUser.user_metadata || {}
  };
};

const createProfileForUser = async (user) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id, email: user.email,
        username: user.user_metadata?.username || user.email.split('@')[0],
        name: user.user_metadata?.name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email.substring(0,1).toUpperCase()}&background=1B4DC1&color=FFF8F0`,
      }).select().single();
    if (error) throw error;
    return data;
  } catch (creationError) {
    console.error("Error creating missing profile:", creationError);
    return null;
  }
};


export default function App() {
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [currentUser, setCurrentUser] = useState(null);
  const [userAirdrops, setUserAirdrops] = useState([]);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const backToTopTimeoutRef = useRef(null);
  const scrollUpStartPosRef = useRef(null); // <-- REF BARU UNTUK LOGIKA JARAK SCROLL

  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  // 👇 FUNGSI INI DIUBAH TOTAL DENGAN LOGIKA BARU
  const handleScroll = (event) => {
    const currentScrollY = event.currentTarget.scrollTop;
    const SCROLL_UP_THRESHOLD = 60; // <-- UBAH ANGKA INI UNTUK MENGATUR JARAK

    // Aturan 1: Jika di puncak halaman, header SELALU tampil.
    if (currentScrollY < 80) {
      setIsHeaderVisible(true);
      scrollUpStartPosRef.current = null; // Reset catatan
    }
    // Aturan 2: Jika scroll ke bawah
    else if (currentScrollY > lastScrollY.current) {
      setIsHeaderVisible(false);
      scrollUpStartPosRef.current = null; // Reset catatan karena arah berubah
    }
    // Aturan 3: Jika scroll ke atas
    else if (currentScrollY < lastScrollY.current) {
      // Jika kita baru mulai scroll ke atas, catat posisinya
      if (scrollUpStartPosRef.current === null) {
        scrollUpStartPosRef.current = lastScrollY.current;
      }

      // Hitung jarak yang sudah ditempuh saat scroll ke atas
      const distanceScrolledUp = scrollUpStartPosRef.current - currentScrollY;

      // Jika jarak sudah melewati batas, tampilkan header
      if (distanceScrolledUp > SCROLL_UP_THRESHOLD) {
        setIsHeaderVisible(true);
      }
    }

    // Selalu perbarui posisi terakhir untuk perbandingan berikutnya
    lastScrollY.current = currentScrollY;

    // --- Logika Tombol Back to Top (tidak berubah) ---
    if (backToTopTimeoutRef.current) {
      clearTimeout(backToTopTimeoutRef.current);
    }
    if (currentScrollY > 400) {
      setShowBackToTop(true);
      backToTopTimeoutRef.current = setTimeout(() => {
        setShowBackToTop(false);
      }, 2000);
    } else {
      setShowBackToTop(false);
    }
  };
  
  // (Sisa kode tidak ada yang berubah)
  const scrollToTop = () => { /* ... */ };
  const checkAirdropNotifications = useCallback(async () => { /* ... */ }, []);
  useEffect(() => { /* ... */ }, []);
  // ... dan semua useEffect serta fungsi lainnya ...

  return (
    <div className="app-container font-sans h-screen flex flex-col md:flex-row overflow-hidden">
      {/* ... sisa JSX tidak berubah ... */}
    </div>
  );
}
