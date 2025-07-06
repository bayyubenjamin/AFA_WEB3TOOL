import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

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
    const { data, error } = await supabase.from('profiles').insert({
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
  const scrollUpStartPosRef = useRef(null);

  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  const handleScroll = (event) => {
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
      const distanceScrolledUp = scrollUpStartPosRef.current - currentScrollY;
      if (distanceScrolledUp > SCROLL_UP_THRESHOLD) {
        setIsHeaderVisible(true);
      }
    }
    lastScrollY.current = currentScrollY;

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
 
  const scrollToTop = () => {
    if (pageContentRef.current) {
      pageContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setShowBackToTop(false);
    if (backToTopTimeoutRef.current) {
      clearTimeout(backToTopTimeoutRef.current);
    }
  };

  const checkAirdropNotifications = useCallback(async () => {
    try {
      const lastVisitTimestamp = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY);
      const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : null;
      if (!lastVisitDate) {
        setHasNewAirdropNotification(true);
        return;
      }
      const { data, error } = await supabase.from('airdrops').select('created_at, AirdropUpdates(created_at)');
      if (error) throw error; if (!data) return;
      for (const airdrop of data) {
        let lastActivityAt = new Date(airdrop.created_at);
        if (airdrop.AirdropUpdates && airdrop.AirdropUpdates.length > 0) {
          const mostRecentUpdateDate = new Date(Math.max(...airdrop.AirdropUpdates.map(u => new Date(u.created_at))));
          if (mostRecentUpdateDate > lastActivityAt) lastActivityAt = mostRecentUpdateDate;
        }
        if (lastActivityAt > lastVisitDate) {
          setHasNewAirdropNotification(true); return;
        }
      }
      setHasNewAirdropNotification(false);
    } catch (err) {
      console.error("Gagal mengecek notifikasi airdrop:", err);
      setHasNewAirdropNotification(false);
    }
  }, []);
 
  const handleMarkAirdropsAsSeen = () => {
    localStorage.setItem(LS_AIRDROPS_LAST_VISIT_KEY, new Date().toISOString());
    setHasNewAirdropNotification(false);
  };
 
  useEffect(() => { checkAirdropNotifications(); }, [checkAirdropNotifications]);

  useEffect(() => {
    setLoadingInitialSession(true);
    
    // --- PERBAIKAN DIMULAI ---
    // Timeout untuk memastikan loading tidak stuck
    const loadingTimeout = setTimeout(() => {
      if (loadingInitialSession) {
        console.warn("Session loading timed out. Forcing UI to display.");
        setLoadingInitialSession(false);
      }
    }, 5000); // 5 detik

    const handleAuthChange = async (session) => {
      try {
        if (session && session.user) {
          let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (profileError) throw profileError;
          if (!profile) {
            profile = await createProfileForUser(session.user);
            if (!profile) {
              setCurrentUser(defaultGuestUserForApp);
              localStorage.removeItem(LS_CURRENT_USER_KEY);
              return;
            }
          }
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          if (!appUser.address && address) { appUser.address = address; }
          setCurrentUser(appUser);
          localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(appUser));
          if (["/login", "/register", "/login-telegram"].includes(location.pathname)) {
            navigate('/', { replace: true });
          }
        } else {
          setCurrentUser(defaultGuestUserForApp);
          localStorage.removeItem(LS_CURRENT_USER_KEY);
        }
      } catch (e) {
        console.error("Error during auth state change:", e);
        setCurrentUser(defaultGuestUserForApp);
        localStorage.removeItem(LS_CURRENT_USER_KEY);
      } finally {
        // Hapus timeout dan set loading ke false jika proses selesai
        clearTimeout(loadingTimeout);
        setLoadingInitialSession(false);
      }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleAuthChange(session));
    supabase.auth.getSession().then(({ data: { session } }) => handleAuthChange(session));
    
    // Cleanup function untuk membersihkan subscription dan timeout
    return () => {
      subscription?.unsubscribe();
      clearTimeout(loadingTimeout);
    };
    // --- PERBAIKAN SELESAI ---
  }, [navigate, address]); // dependensi tetap sama

  useEffect(() => {
    const updateOnlineCount = () => {
      const min = 15, max = 42;
      setOnlineUsers(Math.floor(Math.random() * (max - min + 1)) + min);
    };
    updateOnlineCount();
    const intervalId = setInterval(updateOnlineCount, 7000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'home';
    const titles_id = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar", "login-telegram": "Login via Telegram", identity: "Identitas AFA" };
    const titles_en = { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register", "login-telegram": "Login via Telegram", identity: "AFA Identity" };
    const currentTitles = language === 'id' ? titles_id : titles_en;
    setHeaderTitle(currentTitles[path] || "AFA WEB3TOOL");
  }, [location, language]);

  useEffect(() => {
    if (loadingInitialSession) return;
    if (pageContentRef.current) {
      const el = pageContentRef.current;
      el.classList.remove("content-enter-active", "content-enter");
      void el.offsetWidth;
      el.classList.add("content-enter");
      const timer = setTimeout(() => el.classList.add("content-enter-active"), 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, loadingInitialSession]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    localStorage.removeItem(LS_CURRENT_USER_KEY);
    window.location.href = '/login';
  };

  const handleUpdateUserInApp = (updatedUserData) => {
    setCurrentUser(updatedUserData);
    localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(updatedUserData));
  };
 
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.includes('/postairdrops') && !location.pathname.includes('/update') && !location.pathname.startsWith('/login-telegram') && !location.pathname.startsWith('/auth/telegram/callback');
  const handleOpenWalletModal = () => openWalletModal();
  const mainPaddingBottomClass = showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6';

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={onlineUsers} isHeaderVisible={isHeaderVisible} hasNewAirdropNotification={hasNewAirdropNotification} />}
     
      <main ref={pageContentRef} onScroll={handleScroll} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto custom-scrollbar`}>
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
