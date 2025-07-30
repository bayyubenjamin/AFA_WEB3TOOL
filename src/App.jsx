// src/App.jsx
// Kode ini menggunakan struktur asli Anda dan hanya menambahkan rute yang diperlukan.

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
import PageWarungKripto from './components/PageWarungKripto';
import PageLoginWithTelegram from './components/PageLoginWithTelegram';
import TelegramAuthCallback from './components/TelegramAuthCallback';
import PageAdminWarung from './components/PageAdminWarung';
import PageAdminOrderBook from './components/PageAdminOrderBook';
import PageUserOrder from './components/PageUserOrder';
import PageAdminRekening from './components/PageAdminRekening';
// --- PENAMBAHAN IMPORT BARU ---
import KebijakanLayanan from './components/KebijakanLayanan'; // <-- IMPORT BARU

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
    user_metadata: authUser.user_metadata || {},
    role: profileData?.role || 'user',
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);

  // State lainnya
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [userAirdrops, setUserAirdrops] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Refs
  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const backToTopTimeoutRef = useRef(null);
  const scrollUpStartPosRef = useRef(null);

  // Hooks
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  useEffect(() => {
    setLoadingInitialSession(true);
    const handleSessionUpdate = async (session) => {
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') throw error;

          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          setCurrentUser(appUser);
        } catch (error) {
          console.error("[Auth] Gagal mengambil profil:", error);
          setCurrentUser(mapSupabaseDataToAppUserForApp(session.user, null));
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingInitialSession(false);
    };

    const authInTelegram = async () => {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.ready();
        try {
            const initData = window.Telegram.WebApp.initData;
            if (!initData) {
                const { data: { session } } = await supabase.auth.getSession();
                handleSessionUpdate(session);
                return;
            }
            const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });
            if (error) throw error;
            if (data.error) throw new Error(data.error);
            const { error: sessionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
            if (sessionError) throw sessionError;
        } catch (err) {
            console.error("[Auth] Gagal autentikasi via Telegram:", err);
            const { data: { session } } = await supabase.auth.getSession();
            handleSessionUpdate(session);
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (_event === 'INITIAL_SESSION') {
            if (window.Telegram?.WebApp?.initData) {
                authInTelegram();
            } else {
                handleSessionUpdate(session);
            }
        } else {
            handleSessionUpdate(session);
        }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleScroll = (event) => { const currentScrollY = event.currentTarget.scrollTop; const SCROLL_UP_THRESHOLD = 60; if (currentScrollY < 80) { setIsHeaderVisible(true); scrollUpStartPosRef.current = null; } else if (currentScrollY > lastScrollY.current) { setIsHeaderVisible(false); scrollUpStartPosRef.current = null; } else if (currentScrollY < lastScrollY.current) { if (scrollUpStartPosRef.current === null) { scrollUpStartPosRef.current = lastScrollY.current; } const distanceScrolledUp = scrollUpStartPosRef.current - currentScrollY; if (distanceScrolledUp > SCROLL_UP_THRESHOLD) { setIsHeaderVisible(true); } } lastScrollY.current = currentScrollY; if (backToTopTimeoutRef.current) { clearTimeout(backToTopTimeoutRef.current); } if (currentScrollY > 400) { setShowBackToTop(true); backToTopTimeoutRef.current = setTimeout(() => { setShowBackToTop(false); }, 2000); } else { setShowBackToTop(false); } };
  const scrollToTop = () => { if (pageContentRef.current) { pageContentRef.current.scrollTo({ top: 0, behavior: 'smooth' }); } setShowBackToTop(false); if (backToTopTimeoutRef.current) { clearTimeout(backToTopTimeoutRef.current); } };
  const checkAirdropNotifications = useCallback(async () => { try { const lastVisitTimestamp = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY); const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : null; if (!lastVisitDate) { setHasNewAirdropNotification(true); return; } const { data, error } = await supabase.from('airdrops').select('created_at, AirdropUpdates(created_at)'); if (error) throw error; if (!data) return; for (const airdrop of data) { let lastActivityAt = new Date(airdrop.created_at); if (airdrop.AirdropUpdates && airdrop.AirdropUpdates.length > 0) { const mostRecentUpdateDate = new Date(Math.max(...airdrop.AirdropUpdates.map(u => new Date(u.created_at)))); if (mostRecentUpdateDate > lastActivityAt) lastActivityAt = mostRecentUpdateDate; } if (lastActivityAt > lastVisitDate) { setHasNewAirdropNotification(true); return; } } setHasNewAirdropNotification(false); } catch (err) { console.error("Gagal mengecek notifikasi airdrop:", err); setHasNewAirdropNotification(false); } }, []);
  const handleMarkAirdropsAsSeen = () => { localStorage.setItem(LS_AIRDROPS_LAST_VISIT_KEY, new Date().toISOString()); setHasNewAirdropNotification(false); };
  useEffect(() => { checkAirdropNotifications(); }, [checkAirdropNotifications]);
  useEffect(() => { const updateOnlineCount = () => { const min = 15, max = 42; setOnlineUsers(Math.floor(Math.random() * (max - min + 1)) + min); }; updateOnlineCount(); const intervalId = setInterval(updateOnlineCount, 7000); return () => clearInterval(intervalId); }, []);
  useEffect(() => { const path = location.pathname.split('/')[1] || 'home'; const titles_id = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar", "login-telegram": "Login via Telegram", identity: "Identitas AFA", 'warung-kripto': "Warung Kripto", 'admin-warung': "Admin Warung", 'order-admin': "Buku Order Admin", 'admin/rekening': "Pengaturan Rekening", 'kebijakan-layanan': "Kebijakan & Layanan" }; // <-- PENAMBAHAN JUDUL BARU
  const titles_en = { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register", "login-telegram": "Login via Telegram", identity: "AFA Identity", 'warung-kripto': "Crypto Market", 'admin-warung': "Admin Market", 'order-admin': "Admin Order Book", 'admin/rekening': "Payment Settings", 'kebijakan-layanan': "Policy & Terms" }; // <-- PENAMBAHAN JUDUL BARU
  const currentTitles = language === 'id' ? titles_id : titles_en; setHeaderTitle(currentTitles[path] || "AFA WEB3TOOL"); }, [location, language]);
  useEffect(() => { if (loadingInitialSession) return; if (pageContentRef.current) { const el = pageContentRef.current; el.classList.remove("content-enter-active", "content-enter"); void el.offsetWidth; el.classList.add("content-enter"); const timer = setTimeout(() => el.classList.add("content-enter-active"), 50); return () => clearTimeout(timer); } }, [location.pathname, loadingInitialSession]);
  
  const handleLogout = async () => { await supabase.auth.signOut(); disconnect(); localStorage.clear(); window.location.href = '/login'; };
  const handleUpdateUserInApp = (updatedUserData) => { setCurrentUser(updatedUserData); };
  
  const userForHeader = currentUser || defaultGuestUserForApp;

  const noNavRoutes = [
      '/admin', 
      '/admin/events',
      '/login', 
      '/register', 
      '/login-telegram', 
      '/auth/telegram/callback'
  ];

  const showNav = !noNavRoutes.some(route => location.pathname.startsWith(route)) && 
                    !location.pathname.includes('/postairdrops') && 
                    !location.pathname.includes('/update');

  const handleOpenWalletModal = () => openWalletModal();
  const mainPaddingBottomClass = showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6';

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={onlineUsers} isHeaderVisible={isHeaderVisible} hasNewAirdropNotification={hasNewAirdropNotification} />}

      <main ref={pageContentRef} onScroll={handleScroll} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto custom-scrollbar`}>
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
            <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={handleOpenWalletModal} />} />
            
            {/* --- RUTE BARU DI SINI --- */}
            <Route path="/kebijakan-layanan" element={<KebijakanLayanan />} />

            {/* --- GRUP ROUTE WARUNG KRIPTO --- */}
            <Route path="/warung-kripto" element={<PageWarungKripto currentUser={userForHeader} />} />
            <Route path="/warung-kripto/order/:orderId" element={<PageUserOrder currentUser={userForHeader} />} />

            {/* --- GRUP ROUTE ADMIN --- */}
            {currentUser?.role === 'admin' && (
                <>
                    <Route path="/admin" element={<PageAdminDashboard currentUser={userForHeader} />} />
                    <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
                    <Route path="/admin/warung-jaringan" element={<PageAdminWarung currentUser={userForHeader} />} />
                    <Route path="/order-admin/buku-order" element={<PageAdminOrderBook currentUser={userForHeader} />} />
                    <Route path="/admin/rekening" element={<PageAdminRekening />} />
                </>
            )}

            {/* --- ROUTE LAIN-LAIN --- */}
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={handleUpdateUserInApp} userAirdrops={userAirdrops} onOpenWalletModal={handleOpenWalletModal} />} />
            <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
          </Routes>
        ) : (
          <div>{/* Biarkan kosong karena komponen loading utama yang aktif */}</div>
        )}
      </main>

      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
      
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg transition-opacity duration-500 ${loadingInitialSession ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">{language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}</span>
      </div>
    </div>
  );
}
