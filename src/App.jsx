// src/App.jsx
import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Toaster, toast } from 'sonner';

// --- KOMPONEN UTAMA (Eager Load) ---
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import BackToTopButton from './components/BackToTopButton';

// --- PAGE COMPONENTS (Lazy Load untuk Optimasi Performa) ---
const PageHome = lazy(() => import("./components/PageHome"));
const PageMyWork = lazy(() => import("./components/PageMyWork"));
const PageAirdrops = lazy(() => import("./components/PageAirdrops"));
const PageAdminAirdrops = lazy(() => import("./components/PageAdminAirdrops"));
const PageForum = lazy(() => import("./components/PageForum"));
const PageProfile = lazy(() => import("./components/PageProfile"));
const AirdropDetailPage = lazy(() => import("./components/AirdropDetailPage"));
const PageManageUpdate = lazy(() => import("./components/PageManageUpdate"));
const PageEvents = lazy(() => import('./components/PageEvents'));
const PageEventDetail = lazy(() => import('./components/PageEventDetail'));
const PageAdminEvents = lazy(() => import('./components/PageAdminEvents'));
const PageAdminDashboard = lazy(() => import('./components/PageAdminDashboard'));
const PageLogin = lazy(() => import("./components/PageLogin"));
const PageRegister = lazy(() => import("./components/PageRegister"));
const PageAfaIdentity = lazy(() => import('./components/PageAfaIdentity'));
const PageWarungKripto = lazy(() => import('./components/PageWarungKripto'));
const PageLoginWithTelegram = lazy(() => import('./components/PageLoginWithTelegram'));
const TelegramAuthCallback = lazy(() => import('./components/TelegramAuthCallback'));
const PageAdminWarung = lazy(() => import('./components/PageAdminWarung'));
const PageAdminOrderBook = lazy(() => import('./components/PageAdminOrderBook'));
const PageUserOrder = lazy(() => import('./components/PageUserOrder'));
const PageAdminRekening = lazy(() => import('./components/PageAdminRekening'));
const KebijakanLayanan = lazy(() => import('./components/KebijakanLayanan'));

import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCircleNotch } from "@fortawesome/free-solid-svg-icons"; // Pastikan faCircleNotch diimport
import { useLanguage } from "./context/LanguageContext";

const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

// --- DATA & HELPER FUNCTIONS ---
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

// --- INTERNAL COMPONENT: LOADING SPINNER ---
// Didefinisikan di sini agar tidak perlu file baru
const InternalLoadingSpinner = ({ text, fullScreen = false }) => (
  <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-[9999] bg-white/90 dark:bg-black/90 backdrop-blur-sm' : 'py-20 h-full w-full'}`}>
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping blur-sm"></div>
      <FontAwesomeIcon icon={faCircleNotch} spin className="text-4xl sm:text-5xl text-primary relative z-10" />
    </div>
    <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 animate-pulse tracking-wider">
      {text || 'LOADING...'}
    </p>
  </div>
);

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

  // 1. Network Status
  useEffect(() => {
    const handleOnline = () => toast.success(language === 'id' ? "Kembali Online!" : "Back Online!");
    const handleOffline = () => toast.error(language === 'id' ? "Koneksi Internet Terputus!" : "Internet Connection Lost!");
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  // 2. Auth & Session Logic
  useEffect(() => {
    setLoadingInitialSession(true);
    
    const fetchProfile = async (session) => {
        if (!session?.user) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return mapSupabaseDataToAppUserForApp(session.user, data);
        } catch (error) {
            console.error("[Auth] Fetch profile error:", error);
            return mapSupabaseDataToAppUserForApp(session.user, null);
        }
    };

    const handleSessionUpdate = async (session) => {
        const user = await fetchProfile(session);
        setCurrentUser(user);
        setLoadingInitialSession(false);
    };

    const initAuth = async () => {
        // Cek Telegram WebApp Data
        if (window.Telegram?.WebApp?.initData) {
            try {
                window.Telegram.WebApp.ready();
                const initData = window.Telegram.WebApp.initData;
                const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });
                if (error || data.error) throw error || new Error(data.error);
                
                const { error: sessionError } = await supabase.auth.setSession({ 
                    access_token: data.access_token, 
                    refresh_token: data.refresh_token 
                });
                if (sessionError) throw sessionError;
            } catch (err) {
                console.error("[Auth] Telegram auth failed:", err);
            }
        }
        
        // Cek Sesi Supabase Biasa
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionUpdate(session);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        handleSessionUpdate(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // 3. Scroll & UI Interactions
  const handleScroll = useCallback((event) => {
      const currentScrollY = event.currentTarget.scrollTop;
      const SCROLL_UP_THRESHOLD = 60;
      
      if (currentScrollY < 80) {
          setIsHeaderVisible(true);
          scrollUpStartPosRef.current = null;
      } else if (currentScrollY > lastScrollY.current) {
          setIsHeaderVisible(false);
          scrollUpStartPosRef.current = null;
      } else if (currentScrollY < lastScrollY.current) {
          if (scrollUpStartPosRef.current === null) {
              scrollUpStartPosRef.current = lastScrollY.current;
          }
          if (scrollUpStartPosRef.current - currentScrollY > SCROLL_UP_THRESHOLD) {
              setIsHeaderVisible(true);
          }
      }
      
      lastScrollY.current = currentScrollY;
      
      if (backToTopTimeoutRef.current) clearTimeout(backToTopTimeoutRef.current);
      if (currentScrollY > 400) {
          setShowBackToTop(true);
          backToTopTimeoutRef.current = setTimeout(() => setShowBackToTop(false), 2000);
      } else {
          setShowBackToTop(false);
      }
  }, []);

  const scrollToTop = () => {
      pageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setShowBackToTop(false);
  };

  // 4. Notifications & Titles
  const checkAirdropNotifications = useCallback(async () => {
      try {
          const lastVisit = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY);
          if (!lastVisit) {
              setHasNewAirdropNotification(true);
              return;
          }
          const { data } = await supabase
            .from('airdrops')
            .select('created_at')
            .gt('created_at', lastVisit)
            .limit(1); 
          if (data && data.length > 0) setHasNewAirdropNotification(true);
          else setHasNewAirdropNotification(false);
      } catch (err) {
          console.error("Notif check failed", err);
      }
  }, []);

  useEffect(() => { checkAirdropNotifications(); }, [checkAirdropNotifications]);

  useEffect(() => {
    const titles = language === 'id' 
        ? { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar" } 
        : { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register" };
    
    const path = location.pathname.split('/')[1] || 'home';
    setHeaderTitle(titles[path] || "AFA WEB3TOOL");

    if (pageContentRef.current) {
        pageContentRef.current.classList.remove("content-enter-active");
        void pageContentRef.current.offsetWidth;
        pageContentRef.current.classList.add("content-enter-active");
    }
  }, [location, language]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    localStorage.clear();
    window.location.href = '/login';
  };

  const userForHeader = currentUser || defaultGuestUserForApp;
  const noNavRoutes = ['/admin', '/login', '/register', '/login-telegram'];
  const showNav = !noNavRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      <Toaster position="top-center" richColors closeButton />

      {showNav && (
        <Header 
            title={headerTitle} 
            currentUser={userForHeader} 
            onLogout={handleLogout} 
            navigateTo={navigate} 
            onlineUsers={onlineUsers} 
            isHeaderVisible={isHeaderVisible} 
            hasNewAirdropNotification={hasNewAirdropNotification} 
        />
      )}

      <main 
        ref={pageContentRef} 
        onScroll={handleScroll} 
        className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter transition-all ${showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6'} overflow-y-auto custom-scrollbar`}
      >
        {!loadingInitialSession ? (
          <Suspense fallback={<InternalLoadingSpinner text={language === 'id' ? 'Memuat Halaman...' : 'Loading Page...'} />}>
              <Routes>
                <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
                <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
                <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} onEnterPage={() => { localStorage.setItem(LS_AIRDROPS_LAST_VISIT_KEY, new Date().toISOString()); setHasNewAirdropNotification(false); }} />} />
                <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={userForHeader} />} />
                <Route path="/airdrops/:airdropSlug/update/*" element={<PageManageUpdate currentUser={userForHeader} />} />
                <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
                <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
                <Route path="/events/*" element={<PageEvents currentUser={userForHeader} />} />
                <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
                <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
                <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
                <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={openWalletModal} />} />
                <Route path="/warung-kripto/*" element={<PageWarungKripto currentUser={userForHeader} />} />
                
                {currentUser?.role === 'admin' && (
                    <>
                        <Route path="/admin" element={<PageAdminDashboard currentUser={userForHeader} />} />
                        <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
                        <Route path="/admin/warung-jaringan" element={<PageAdminWarung currentUser={userForHeader} />} />
                        <Route path="/order-admin/buku-order" element={<PageAdminOrderBook currentUser={userForHeader} />} />
                        <Route path="/admin/rekening" element={<PageAdminRekening />} />
                    </>
                )}
                
                <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={setCurrentUser} onOpenWalletModal={openWalletModal} />} />
                <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
              </Routes>
          </Suspense>
        ) : (
             <InternalLoadingSpinner fullScreen text={language === 'id' ? 'Menyiapkan Sesi...' : 'Initializing Session...'} />
        )}
      </main>

      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
    </div>
  );
}
