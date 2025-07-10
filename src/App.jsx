import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Komponen-komponen Anda (tidak berubah)
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
const SUPABASE_SESSION_KEY = 'supabase.auth.session';

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

const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms)
    );
    return Promise.race([promise, timeout]);
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
    const setCloudItemAsync = (key, value) => new Promise((resolve, reject) => window.Telegram.WebApp.CloudStorage.setItem(key, value, (err, ok) => err ? reject(new Error(err)) : resolve(ok)));
    const getCloudItemAsync = (key) => new Promise((resolve, reject) => window.Telegram.WebApp.CloudStorage.getItem(key, (err, val) => err ? reject(new Error(err)) : resolve(val)));
    const removeCloudItemAsync = (key) => new Promise((resolve, reject) => window.Telegram.WebApp.CloudStorage.removeItem(key, (err, ok) => err ? reject(new Error(err)) : resolve(ok)));

    const handleProfileFetch = async (session) => {
        if (!session?.user) {
            setCurrentUser(null);
            return;
        }

        try {
            console.log("[Auth] Session valid. Fetching profile for:", session.user.id);
            const { data: profile, error: profileError } = await supabase
                .from('profiles').select('*').eq('id', session.user.id).single();

            if (profileError) {
                console.error("[Auth] Profile fetch error. This is likely an RLS issue.", profileError);
                throw new Error(`Failed to fetch profile: ${profileError.message}`);
            }
            
            const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
            setCurrentUser(appUser);
            console.log("[Auth] Profile loaded. User is:", appUser.username);
        } catch (error) {
            console.error("[Auth] Error in handleProfileFetch:", error);
            setCurrentUser(null);
            await supabase.auth.signOut();
        }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log(`[Auth Event] Event: ${_event}, Session exists: ${!!session}`);
        await handleProfileFetch(session);
        
        const isTelegramEnv = !!window.Telegram?.WebApp?.initData;
        if (isTelegramEnv && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
            try {
                await setCloudItemAsync(SUPABASE_SESSION_KEY, JSON.stringify(session));
                console.log("[Auth Cloud] Session saved to CloudStorage.");
            } catch (e) {
                console.error("[Auth Cloud] Failed to save session:", e);
            }
        }
        if (isTelegramEnv && _event === 'SIGNED_OUT') {
            try {
                await removeCloudItemAsync(SUPABASE_SESSION_KEY);
                console.log("[Auth Cloud] Session removed from CloudStorage.");
            } catch (e) {
                console.error("[Auth Cloud] Failed to remove session:", e);
            }
        }
    });

    const initializeAuth = async () => {
        console.log("[Auth] Initializing authentication...");
        try {
            const isTelegramEnv = !!window.Telegram?.WebApp?.initData;

            if (isTelegramEnv) {
                window.Telegram.WebApp.ready();
                console.log("[Auth] Telegram environment detected.");
                let sessionRestored = false;

                try {
                    const sessionStr = await withTimeout(getCloudItemAsync(SUPABASE_SESSION_KEY), 3000);
                    if (sessionStr) {
                        const session = JSON.parse(sessionStr);
                        console.log("[Auth Cloud] Restoring session from CloudStorage...");
                        const { error } = await supabase.auth.setSession(session);
                        if (error) throw new Error("Failed to set session from cloud data");
                        sessionRestored = true;
                    }
                } catch (e) {
                    console.warn("[Auth Cloud] Could not restore from CloudStorage:", e.message);
                }

                if (!sessionRestored) {
                    console.log("[Auth Telegram] No session restored. Authenticating with initData...");
                    const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData: window.Telegram.WebApp.initData } });
                    if (error || data.error) throw error || new Error(data.error);
                    const { error: setSessionError } = await supabase.auth.setSession(data);
                    if (setSessionError) throw setSessionError;
                }
            } else {
                console.log("[Auth] Standard web environment. Getting session...");
                await supabase.auth.getSession();
            }
        } catch (error) {
            console.error("[Auth] Initialization failed:", error);
            setCurrentUser(null);
        } finally {
            console.log("[Auth] Finalizing initialization, hiding loading screen.");
            setLoadingInitialSession(false);
        }
    };

    initializeAuth();

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
  useEffect(() => { const path = location.pathname.split('/')[1] || 'home'; const titles_id = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar", "login-telegram": "Login via Telegram", identity: "Identitas AFA" }; const titles_en = { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register", "login-telegram": "Login via Telegram", identity: "AFA Identity" }; const currentTitles = language === 'id' ? titles_id : titles_en; setHeaderTitle(currentTitles[path] || "AFA WEB3TOOL"); }, [location, language]);
  useEffect(() => { if (loadingInitialSession) return; if (pageContentRef.current) { const el = pageContentRef.current; el.classList.remove("content-enter-active", "content-enter"); void el.offsetWidth; el.classList.add("content-enter"); const timer = setTimeout(() => el.classList.add("content-enter-active"), 50); return () => clearTimeout(timer); } }, [location.pathname, loadingInitialSession]);
  
  const handleLogout = async () => { await supabase.auth.signOut(); disconnect(); localStorage.clear(); if(window.Telegram?.WebApp?.CloudStorage){ try { await removeCloudItemAsync(SUPABASE_SESSION_KEY); } catch(e) { console.error("Gagal hapus sesi cloud saat logout:", e) } } window.location.href = '/login'; };
  const handleUpdateUserInApp = (updatedUserData) => { setCurrentUser(updatedUserData); };
  
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.includes('/postairdrops') && !location.pathname.includes('/update') && !location.pathname.startsWith('/login-telegram') && !location.pathname.startsWith('/auth/telegram/callback');
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
          <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
          <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={openWalletModal} />} />
          <Route path="/login-telegram" element={<PageLoginWithTelegram />} />
          <Route path="/auth/telegram/callback" element={<TelegramAuthCallback />} />
          <Route path="/admin" element={<PageAdminDashboard />} />
          <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
          <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={openWalletModal} />} />
          <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={handleUpdateUserInApp} userAirdrops={userAirdrops} onOpenWalletModal={openWalletModal} />} />
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
