// src/App.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// --- KOMPONEN ---
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import BackToTopButton from './components/BackToTopButton';

// --- HALAMAN UTAMA & USER ---
import PageHome from "./components/PageHome";
import PageMyWork from "./components/PageMyWork";
import PageAirdrops from "./components/PageAirdrops";
import PageForum from "./components/PageForum";
import PageProfile from "./components/PageProfile";
import AirdropDetailPage from "./components/AirdropDetailPage";
import PageManageUpdate from "./components/PageManageUpdate";
import PageEvents from './components/PageEvents';
import PageEventDetail from './components/PageEventDetail';
import PageAfaIdentity from './components/PageAfaIdentity';
import PageWarungKripto from './components/PageWarungKripto';
import PageUserOrder from './components/PageUserOrder';
import KebijakanLayanan from './components/KebijakanLayanan';
import PageCelosGame from './components/PageCelosGame';

// --- HALAMAN AUTH ---
import PageLogin from "./components/PageLogin";
import PageRegister from "./components/PageRegister";
import PageLoginWithTelegram from './components/PageLoginWithTelegram';
import TelegramAuthCallback from './components/TelegramAuthCallback';

// --- HALAMAN ADMIN ---
import PageAdminDashboard from './components/PageAdminDashboard';
import PageAdminAirdrops from "./components/PageAdminAirdrops";
import PageAdminEvents from './components/PageAdminEvents';
import PageAdminWarung from './components/PageAdminWarung';
import PageAdminOrderBook from './components/PageAdminOrderBook';
import PageAdminRekening from './components/PageAdminRekening';

// --- UTILITIES ---
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";
import { Toaster } from 'sonner';

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
    user_metadata: authUser.user_metadata || {},
    role: profileData?.role || 'user',
  };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const backToTopTimeoutRef = useRef(null);
  const scrollUpStartPosRef = useRef(null);

  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  // AUTH LOGIC
  useEffect(() => {
    let mounted = true;
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await handleSessionUpdate(session);
      else if (mounted) setLoadingInitialSession(false);
    };

    const handleSessionUpdate = async (session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (mounted) setCurrentUser(mapSupabaseDataToAppUserForApp(session.user, profile));
        } catch (error) {
          if (mounted) setCurrentUser(mapSupabaseDataToAppUserForApp(session.user, null));
        }
      } else {
        if (mounted) setCurrentUser(null);
      }
      if (mounted) setLoadingInitialSession(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionUpdate(session);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // UI SCROLL LOGIC
  const handleScroll = (event) => {
    const currentScrollY = event.currentTarget.scrollTop;
    if (currentScrollY < 80) setIsHeaderVisible(true);
    else if (currentScrollY > lastScrollY.current) setIsHeaderVisible(false);
    else if (currentScrollY < lastScrollY.current - 10) setIsHeaderVisible(true);
    
    lastScrollY.current = currentScrollY;
    setShowBackToTop(currentScrollY > 400);
  };

  // NOTIFICATION LOGIC
  const checkAirdropNotifications = useCallback(async () => {
    const lastVisit = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY);
    if (!lastVisit) { setHasNewAirdropNotification(true); return; }
    // ... logika fetch airdrop terbaru ...
  }, []);

  useEffect(() => { checkAirdropNotifications(); }, [checkAirdropNotifications]);

  // HEADER TITLE LOGIC
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'home';
    const titles = {
      id: { home: "AFA WEB3TOOL", airdrops: "Daftar Airdrop", admin: "Panel Admin", profile: "Profil" },
      en: { home: "AFA WEB3TOOL", airdrops: "Airdrop List", admin: "Admin Panel", profile: "Profile" }
    };
    setHeaderTitle(titles[language]?.[path] || "AFA WEB3TOOL");
  }, [location, language]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    localStorage.clear();
    navigate('/login');
  };

  // NAVIGATION VISIBILITY
  const noNavRoutes = ['/login', '/register', '/admin', '/order-admin', '/auth'];
  const showNav = !noNavRoutes.some(route => location.pathname.startsWith(route));

  if (loadingInitialSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
      </div>
    );
  }

  const userForHeader = currentUser || defaultGuestUserForApp;

  return (
    <div className="app-container h-screen flex flex-col overflow-hidden bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Toaster position="top-center" richColors />
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} isHeaderVisible={isHeaderVisible} />}
      
      <main ref={pageContentRef} onScroll={handleScroll} className={`flex-grow overflow-y-auto px-4 ${showNav ? 'pt-20 pb-24' : ''}`}>
        <Routes>
          <Route path="/" element={<PageHome currentUser={userForHeader} />} />
          <Route path="/login" element={<PageLogin />} />
          <Route path="/register" element={<PageRegister />} />
          <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} />} />
          
          {/* PROTECTED ADMIN ROUTES */}
          {currentUser?.role === 'admin' ? (
            <>
              <Route path="/admin" element={<PageAdminDashboard currentUser={userForHeader} />} />
              <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
              <Route path="/admin/warung-jaringan" element={<PageAdminWarung currentUser={userForHeader} />} />
              <Route path="/order-admin/buku-order" element={<PageAdminOrderBook currentUser={userForHeader} />} />
            </>
          ) : (
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showNav && <BottomNav currentUser={currentUser} />}
      <BackToTopButton show={showBackToTop} onClick={() => pageContentRef.current.scrollTo({top:0, behavior:'smooth'})} />
    </div>
  );
}
