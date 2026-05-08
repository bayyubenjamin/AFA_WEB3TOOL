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
  const [userAirdrops, setUserAirdrops] = useState([]);
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

  useEffect(() => {
    let mounted = true;
    setLoadingInitialSession(true);

    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingInitialSession) {
        setLoadingInitialSession(false);
      }
    }, 5000);

    const handleSessionUpdate = async (session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          if (mounted) setCurrentUser(appUser);
        } catch (error) {
          if (mounted) setCurrentUser(mapSupabaseDataToAppUserForApp(session.user, null));
        }
      } else {
        if (mounted) setCurrentUser(null);
      }
      if (mounted) setLoadingInitialSession(false);
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
            const { error: sessionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
            if (sessionError) throw sessionError;
        } catch (err) {
            const { data: { session } } = await supabase.auth.getSession();
            handleSessionUpdate(session);
        }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (_event === 'INITIAL_SESSION' && window.Telegram?.WebApp?.initData) {
            authInTelegram();
        } else {
            handleSessionUpdate(session);
        }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleScroll = (event) => { 
    const currentScrollY = event.currentTarget.scrollTop; 
    if (currentScrollY < 80) setIsHeaderVisible(true);
    else if (currentScrollY > lastScrollY.current) setIsHeaderVisible(false);
    else if (currentScrollY < lastScrollY.current - 60) setIsHeaderVisible(true);
    
    lastScrollY.current = currentScrollY; 
    setShowBackToTop(currentScrollY > 400);
  };

  useEffect(() => { 
    const path = location.pathname.split('/')[1] || 'home'; 
    const titles_id = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar", "login-telegram": "Login via Telegram", identity: "Identitas AFA", 'warung-kripto': "Warung Kripto", 'celos-game': "Celos Tap Game", 'kebijakan-layanan': "Kebijakan & Layanan" }; 
    const titles_en = { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register", "login-telegram": "Login via Telegram", identity: "AFA Identity", 'warung-kripto': "Crypto Market", 'celos-game': "Celos Tap Game", 'kebijakan-layanan': "Policy & Terms" }; 
    const currentTitles = language === 'id' ? titles_id : titles_en; 
    setHeaderTitle(currentTitles[path] || "AFA WEB3TOOL"); 
  }, [location, language]);

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    disconnect(); 
    localStorage.clear(); 
    window.location.href = '/login'; 
  };
  
  const userForHeader = currentUser || defaultGuestUserForApp;
  const noNavRoutes = ['/admin', '/login', '/register', '/login-telegram', '/auth'];
  const showNav = !noNavRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Toaster position="top-center" richColors />

      {showNav && (
        <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={onlineUsers} isHeaderVisible={isHeaderVisible} />
      )}

      <main ref={pageContentRef} onScroll={handleScroll} className={`flex-grow ${showNav ? 'pt-[var(--header-height)] pb-[var(--bottomnav-height)]' : ''} px-4 overflow-y-auto custom-scrollbar`}>
        {!loadingInitialSession ? (
          <Routes>
            <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
            <Route path="/celos-game" element={<PageCelosGame />} />
            <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
            <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
            <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
            <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
            <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} />} />
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} />} />
            <Route path="/login" element={<PageLogin />} />
            <Route path="/register" element={<PageRegister />} />

            {currentUser?.role === 'admin' && (
                <>
                    <Route path="/admin" element={<PageAdminDashboard currentUser={userForHeader} />} />
                    <Route path="/admin/warung-jaringan" element={<PageAdminWarung currentUser={userForHeader} />} />
                </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <div className="flex h-full items-center justify-center">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
          </div>
        )}
      </main>

      {showNav && <BottomNav currentUser={currentUser} />}
      <BackToTopButton show={showBackToTop} onClick={() => pageContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })} />
    </div>
  );
}
