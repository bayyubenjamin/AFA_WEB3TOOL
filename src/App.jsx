// src/App.jsx
import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Toaster, toast } from 'sonner';
import { supabase } from './supabaseClient'; // Import supabase yang sudah diamankan
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"; 
import PageQuestCenter from './components/PageQuestCenter';
import { useLanguage } from "./context/LanguageContext";

// --- KOMPONEN UTAMA (Eager Load) ---
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import BackToTopButton from './components/BackToTopButton';
import PageHome from "./components/PageHome";
import PageLogin from "./components/PageLogin";

// --- LAZY LOAD ---
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
const PageRegister = lazy(() => import("./components/PageRegister"));
const PageAfaIdentity = lazy(() => import('./components/PageAfaIdentity'));
const PageWarungKripto = lazy(() => import('./components/PageWarungKripto'));
const PageAdminWarung = lazy(() => import('./components/PageAdminWarung'));
const PageAdminOrderBook = lazy(() => import('./components/PageAdminOrderBook'));
const PageAdminRekening = lazy(() => import('./components/PageAdminRekening'));

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

const InternalLoadingSpinner = ({ text, fullScreen = false }) => (
  <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-[50] bg-white/90 dark:bg-black/90 backdrop-blur-sm' : 'py-20 h-full w-full'}`}>
    <FontAwesomeIcon icon={faCircleNotch} spin className="text-4xl text-blue-500" />
    <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 animate-pulse">{text || 'LOADING...'}</p>
  </div>
);

// Tampilan jika Supabase Error
const EnvErrorState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
    <FontAwesomeIcon icon={faTriangleExclamation} className="text-5xl text-yellow-500 mb-4" />
    <h2 className="text-2xl font-bold">Konfigurasi Hilang</h2>
    <p className="mt-2 text-gray-600 dark:text-gray-400">File <code className="bg-gray-200 px-1 rounded">.env</code> tidak ditemukan atau URL Supabase kosong.</p>
  </div>
);

export default function App() {
  // Jika Supabase null (karena config error), langsung render error state
  if (!supabase) return <EnvErrorState />;

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
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

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (session) => {
        if (!session?.user) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            // PGRST116 = No rows found (user belum ada profil)
            if (error && error.code !== 'PGRST116') throw error;
            return mapSupabaseDataToAppUserForApp(session.user, data);
        } catch (error) {
            console.error("[Auth] Fetch profile error:", error);
            // Return user basic jika fetch profile gagal
            return mapSupabaseDataToAppUserForApp(session.user, null);
        }
    };

    const initAuth = async () => {
        try {
            // Telegram Auth Logic
            if (window.Telegram?.WebApp?.initData) {
                window.Telegram.WebApp.ready();
                const initData = window.Telegram.WebApp.initData;
                const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });
                
                if (!error && data?.access_token) {
                    await supabase.auth.setSession({ 
                        access_token: data.access_token, 
                        refresh_token: data.refresh_token 
                    });
                }
            }
            
            // Standard Session Check
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;

            if (mounted) {
                const user = await fetchProfile(session);
                setCurrentUser(user);
            }
        } catch (err) {
            console.error("Auth Init Error:", err);
            // Jangan crash, set guest user
            if (mounted) setCurrentUser(defaultGuestUserForApp);
        } finally {
            if (mounted) setLoadingInitialSession(false);
        }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        setLoadingInitialSession(true);
        const user = await fetchProfile(session);
        setCurrentUser(user);
        setLoadingInitialSession(false);
    });

    return () => {
        mounted = false;
        subscription?.unsubscribe();
    };
  }, []);

  // --- SCROLL HANDLER ---
  const handleScroll = useCallback((event) => {
      const currentScrollY = event.currentTarget.scrollTop;
      if (currentScrollY < 80) {
          setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
          setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
           setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
      
      if (currentScrollY > 400) {
          setShowBackToTop(true);
          if (backToTopTimeoutRef.current) clearTimeout(backToTopTimeoutRef.current);
          backToTopTimeoutRef.current = setTimeout(() => setShowBackToTop(false), 2000);
      } else {
          setShowBackToTop(false);
      }
  }, []);

  const scrollToTop = () => {
      pageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- NOTIFICATION CHECK ---
  useEffect(() => {
    const checkNotif = async () => {
      try {
        const lastVisit = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY);
        if (!lastVisit) {
            setHasNewAirdropNotification(true);
            return;
        }
        // Pastikan tabel airdrops ada sebelum query
        const { count, error } = await supabase
            .from('airdrops')
            .select('*', { count: 'exact', head: true })
            .gt('created_at', lastVisit);
        
        if (!error && count > 0) setHasNewAirdropNotification(true);
      } catch (e) {
        console.warn("Skip notification check due to error:", e);
      }
    };
    if (supabase) checkNotif();
  }, []);

  // --- ROUTER & HEADER ---
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'home';
    const titles = language === 'id' 
        ? { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum", profile: "Profil", admin: "Admin" } 
        : { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrops", forum: "Forum", profile: "Profile", admin: "Admin" };
    setHeaderTitle(titles[path] || "AFA WEB3TOOL");
  }, [location, language]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    localStorage.clear();
    window.location.href = '/login';
  };

  const userForHeader = currentUser || defaultGuestUserForApp;
  const noNavRoutes = ['/admin', '/login', '/register'];
  const showNav = !noNavRoutes.some(route => location.pathname.startsWith(route));

  if (loadingInitialSession) {
      return <InternalLoadingSpinner fullScreen text={language === 'id' ? 'Menyiapkan Sesi...' : 'Initializing Session...'} />;
  }

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-gray-100">
      <Toaster position="top-center" richColors closeButton />

      {showNav && (
        <Header 
            title={headerTitle} 
            currentUser={userForHeader} 
            onLogout={handleLogout} 
            navigateTo={navigate} 
            isHeaderVisible={isHeaderVisible} 
            hasNewAirdropNotification={hasNewAirdropNotification} 
        />
      )}

      <main 
        ref={pageContentRef} 
        onScroll={handleScroll} 
        className={`flex-grow ${showNav ? 'pt-[var(--header-height)] pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6'} px-4 overflow-y-auto custom-scrollbar transition-all duration-300`}
      >
        <Suspense fallback={<InternalLoadingSpinner text="Loading..." />}>
            <Routes>
                <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
                <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
                <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
                
                {/* Protected Routes Wrapper could be added here */}
                <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
                <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} onEnterPage={() => { localStorage.setItem(LS_AIRDROPS_LAST_VISIT_KEY, new Date().toISOString()); setHasNewAirdropNotification(false); }} />} />
                <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={userForHeader} />} />
                <Route path="/airdrops/:airdropSlug/update/*" element={<PageManageUpdate currentUser={userForHeader} />} />
                <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
                <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
                <Route path="/events/*" element={<PageEvents currentUser={userForHeader} />} />
                <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
                <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={openWalletModal} />} />
                <Route path="/quests" element={<PageQuestCenter currentUser={user} />} />
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
      </main>

      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
    </div>
  );
}
