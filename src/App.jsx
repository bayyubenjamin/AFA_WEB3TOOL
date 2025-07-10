import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Komponen
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

const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`,
  address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
  user_metadata: {}
};

const mapSupabaseDataToAppUserForApp = (authUser, profileData) => {
  if (!authUser) return defaultGuestUserForApp;
  return {
    id: authUser.id,
    email: authUser.email,
    username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
    name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
    avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url || defaultGuestUserForApp.avatar_url,
    stats: profileData?.stats || defaultGuestUserForApp.stats,
    address: profileData?.web3_address || null,
    telegram_user_id: profileData?.telegram_user_id || null,
    user_metadata: authUser.user_metadata || {}
  };
};

function App() {
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
  const { address } = useAccount();

  // 🛠️ INIT SESSION
  useEffect(() => {
    setLoadingInitialSession(true);
    console.log("[DEBUG] Memulai pengecekan sesi...");

    const handleSessionUpdate = async (session) => {
      console.log("[DEBUG] Session yang diterima:", session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
      setLoadingInitialSession(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionUpdate(session);
    });

    const initData = window?.Telegram?.WebApp?.initData;
    console.log("[DEBUG] Telegram initData:", initData);

    const authInTelegram = async () => {
      try {
        window.Telegram.WebApp.ready();
        if (!initData) throw new Error("initData kosong");
        const { data, error } = await supabase.functions.invoke('telegram-auth', {
          body: { initData }
        });

        if (error || data?.error) throw new Error(data?.error || error.message);
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });
      } catch (err) {
        console.error("[Telegram Auth Error]", err.message);
        setCurrentUser(null);
        setLoadingInitialSession(false);
      }
    };

    if (initData) {
      authInTelegram();
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSessionUpdate(session);
      });
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ⏫ SCROLL EVENT, NOTIF, ETC
  const checkAirdropNotifications = useCallback(async () => {
    const lastSeen = parseInt(localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY) || 0, 10);
    const { data } = await supabase
      .from('airdrops')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const latestCreated = new Date(data?.[0]?.created_at || 0).getTime();
    setHasNewAirdropNotification(latestCreated > lastSeen);
  }, []);

  useEffect(() => { checkAirdropNotifications(); }, [checkAirdropNotifications]);
  useEffect(() => { setOnlineUsers(Math.floor(Math.random() * 100) + 1); }, []);
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/airdrops")) setHeaderTitle(language === 'id' ? "Airdrop" : "Airdrops");
    else if (path.startsWith("/forum")) setHeaderTitle("Forum");
    else if (path.startsWith("/my-work")) setHeaderTitle(language === 'id' ? "Tugas Saya" : "My Work");
    else setHeaderTitle("AIRDROP FOR ALL");
  }, [location, language]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    localStorage.clear();
    window.location.href = '/login';
  };

  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') &&
                  !location.pathname.startsWith('/login') &&
                  !location.pathname.startsWith('/register');

  const mainPaddingBottomClass = showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6';

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
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

      <main ref={pageContentRef} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto custom-scrollbar`}>
        {!loadingInitialSession ? (
          <Routes>
            <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
            <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
            <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} onEnterPage={() => localStorage.setItem(LS_AIRDROPS_LAST_VISIT_KEY, Date.now())} />} />
            <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug/update" element={<PageManageUpdate currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
            <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
            <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
            <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
            <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
            <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
            <Route path="/login-telegram" element={<PageLoginWithTelegram />} />
            <Route path="/auth/telegram/callback" element={<TelegramAuthCallback />} />
            <Route path="/admin" element={<PageAdminDashboard />} />
            <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
            <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={openWalletModal} />} />
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={setCurrentUser} userAirdrops={userAirdrops} onOpenWalletModal={openWalletModal} />} />
            <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
          </Routes>
        ) : (
          <div className="flex justify-center items-center h-full">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
          </div>
        )}
      </main>

      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={() => pageContentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} />

      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg transition-opacity duration-500 ${loadingInitialSession ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">{language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}</span>
      </div>
    </div>
  );
}

export default App;

