import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Komponen-komponen Anda
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import BackToTopButton from './components/BackToTopButton';
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

import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

// User default jika tidak login
const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`,
  address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
  user_metadata: {}
};

// Fungsi untuk memetakan data user Supabase ke format user aplikasi
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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);

  // State lainnya tetap sama
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [userAirdrops, setUserAirdrops] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Refs tetap sama
  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const backToTopTimeoutRef = useRef(null);
  const scrollUpStartPosRef = useRef(null);

  // Hooks lainnya tetap sama
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  // --- PERBAIKAN LOGIKA AUTENTIKASI ---
useEffect(() => {
  setLoadingInitialSession(true);
  console.log("[Auth] Memulai pengecekan sesi...");

  const handleSessionUpdate = async (session) => {
    if (session?.user) {
      console.log("[Auth] Sesi ditemukan. Mengambil profil untuk user:", session.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
      setCurrentUser(appUser);
      console.log("[Auth] Profil dimuat, user di-set:", appUser.username);
    } else {
      console.log("[Auth] Tidak ada sesi aktif, user adalah Guest.");
      setCurrentUser(null);
    }
    setLoadingInitialSession(false);
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    console.log(`[Auth] Event terdeteksi: ${_event}`);
    handleSessionUpdate(session);
  });

  const authInTelegram = async () => {
    console.log("[Auth] Memulai authInTelegram...");
    window.Telegram.WebApp.ready();

    try {
      const initData = window.Telegram.WebApp.initData;
      if (!initData) {
        console.error("[Auth] initData tidak tersedia, tidak bisa autentikasi.");
        setCurrentUser(null);
        setLoadingInitialSession(false);
        return;
      }

      console.log("[Auth] Kirim initData ke Supabase Function...");
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error.message);
      }

      console.log("[Auth] Berhasil dapat token dari function, setSession ke Supabase...");
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

    } catch (err) {
      console.error("[Auth] Gagal login via Telegram initData:", err.message);
      setCurrentUser(null);
      setLoadingInitialSession(false);
    }
  };

  if (window.Telegram?.WebApp?.initData) {
    authInTelegram();
  } else {
    console.log("[Auth] Lingkungan Non-Telegram, menjalankan getSession().");
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionUpdate(session);
    });
  }

  return () => {
    subscription?.unsubscribe();
  };
}, []);
 // Dependensi kosong agar hanya berjalan sekali saat aplikasi pertama kali dimuat.

  // Semua fungsi dan useEffect lain di bawah ini TIDAK ADA PERUBAHAN
  const handleScroll = (event) => { const currentScrollY = event.currentTarget.scrollTop; const SCROLL_UP_THRESHOLD = 60; if (currentScrollY < 80) { setIsHeaderVisible(true); scrollUpStartPosRef.current = null; } else if (currentScrollY > lastScrollY.current) { setIsHeaderVisible(false); scrollUpStartPosRef.current = null; } else if (currentScrollY < lastScrollY.current) { if (scrollUpStartPosRef.current === null) { scrollUpStartPosRef.current = lastScrollY.current; } const distanceScrolledUp = scrollUpStartPosRef.current - currentScrollY; if (distanceScrolledUp > SCROLL_UP_THRESHOLD) { setIsHeaderVisible(true); } } lastScrollY.current = currentScrollY; if (backToTopTimeoutRef.current) { clearTimeout(backToTopTimeoutRef.current); } if (currentScrollY > 400) { setShowBackToTop(true); backToTopTimeoutRef.current = setTimeout(() => { setShowBackToTop(false); }, 2000); } else { setShowBackToTop(false); } };
  const scrollToTop = () => { if (pageContentRef.current) { pageContentRef.current.scrollTo({ top: 0, behavior: 'smooth' }); } setShowBackToTop(false); if (backToTopTimeoutRef.current) { clearTimeout(backToTopTimeoutRef.current); } };
  const checkAirdropNotifications = useCallback(async () => { try { const lastVisitTimestamp = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY); const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : null; if (!lastVisitDate) { setHasNewAirdropNotification(true); return; } const { data, error } = await supabase.from('airdrops').select('created_at, AirdropUpdates(created_at)'); if (error) throw error; if (!data) return; for (const airdrop of data) { let lastActivityAt = new Date(airdrop.created_at); if (airdrop.AirdropUpdates && airdrop.AirdropUpdates.length > 0) { const mostRecentUpdateDate = new Date(Math.max(...airdrop.AirdropUpdates.map(u => new Date(u.created_at)))); if (mostRecentUpdateDate > lastActivityAt) lastActivityAt = mostRecentUpdateDate; } if (lastActivityAt > lastVisitDate) { setHasNewAirdropNotification(true); return; } } setHasNewAirdropNotification(false); } catch (err) { console.error("Gagal mengecek notifikasi airdrop:", err); setHasNewAirdropNotification(false); } }, []);
  const handleMarkAirdropsAsSeen = () => { localStorage.setItem(LS_AIRDROPS_LAST_VISIT_KEY, new Date().toISOString()); setHasNewAirdropNotification(false); };
  useEffect(() => { checkAirdropNotifications(); }, [checkAirdropNotifications]);
  useEffect(() => { const updateOnlineCount = () => { const min = 15, max = 42; setOnlineUsers(Math.floor(Math.random() * (max - min + 1)) + min); }; updateOnlineCount(); const intervalId = setInterval(updateOnlineCount, 7000); return () => clearInterval(intervalId); }, []);
  useEffect(() => { const path = location.pathname.split('/')[1] || 'home'; const titles_id = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar", "login-telegram": "Login via Telegram", identity: "Identitas AFA" }; const titles_en = { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register", "login-telegram": "Login via Telegram", identity: "AFA Identity" }; const currentTitles = language === 'id' ? titles_id : titles_en; setHeaderTitle(currentTitles[path] || "AFA WEB3TOOL"); }, [location, language]);
  useEffect(() => { if (loadingInitialSession) return; if (pageContentRef.current) { const el = pageContentRef.current; el.classList.remove("content-enter-active", "content-enter"); void el.offsetWidth; el.classList.add("content-enter"); const timer = setTimeout(() => el.classList.add("content-enter-active"), 50); return () => clearTimeout(timer); } }, [location.pathname, loadingInitialSession]);
  
  const handleLogout = async () => { await supabase.auth.signOut(); disconnect(); localStorage.clear(); window.location.href = '/login'; };
  const handleUpdateUserInApp = (updatedUserData) => { setCurrentUser(updatedUserData); };
  
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.includes('/postairdrops') && !location.pathname.includes('/update') && !location.pathname.startsWith('/login-telegram') && !location.pathname.startsWith('/auth/telegram/callback');
  const handleOpenWalletModal = () => openWalletModal();
  const mainPaddingBottomClass = showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6';

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={onlineUsers} isHeaderVisible={isHeaderVisible} hasNewAirdropNotification={hasNewAirdropNotification} />}

      <main ref={pageContentRef} onScroll={handleScroll} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto custom-scrollbar`}>
        {/* Loading state ditempatkan di luar Routes agar tidak terpengaruh navigasi */}
        {!loadingInitialSession ? (
          <Routes>
            <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
            <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
            <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} onEnterPage={handleMarkAirdropsAsSeen} />} />
            <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug/update" element={<PageManageUpdate currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug/update/:updateId" element={<PageManageUpdate currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
            <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
            <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
            <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
            <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
            <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
            <Route path="/login-telegram" element={<PageLoginWithTelegram />} />
            <Route path="/auth/telegram/callback" element={<TelegramAuthCallback />} />
            <Route path="/admin" element={<PageAdminDashboard />} />
            <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
            <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={handleOpenWalletModal} />} />
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={handleUpdateUserInApp} userAirdrops={userAirdrops} onOpenWalletModal={handleOpenWalletModal} />} />
            <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
          </Routes>
        ) : (
          <div>{/* Biarkan kosong sementara komponen loading utama yang aktif */}</div>
        )}
      </main>

      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
      
      {/* Layar Loading Global */}
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg transition-opacity duration-500 ${loadingInitialSession ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">{language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}</span>
      </div>
    </div>
  );
}
