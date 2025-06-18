// src/App.jsx

import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect } from 'wagmi'; // <-- [DITAMBAHKAN]

// Impor semua komponen halaman
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
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
import WalletConnectModal from "./components/WalletConnectModal";


// Impor utilitas
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

const LS_CURRENT_USER_KEY = 'web3AirdropCurrentUser_final_v9';

const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=G`,
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
    user_metadata: authUser.user_metadata || {}
  };
};


function MainAppContent() {
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [currentUser, setCurrentUser] = useState(null);
  const [userAirdrops, setUserAirdrops] = useState([]);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const pageContentRef = useRef(null);
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect(); // <-- [DITAMBAHKAN]

  // ... (useEffect yang lain tetap sama) ...
  useEffect(() => {
    const updateOnlineCount = () => {
      const min = 15;
      const max = 42;
      const randomCount = Math.floor(Math.random() * (max - min + 1)) + min;
      setOnlineUsers(randomCount);
    };
    updateOnlineCount(); 
    const intervalId = setInterval(updateOnlineCount, 7000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setLoadingInitialSession(true);
    const handleAuthChange = async (session) => {
      try {
        if (session && session.user) {
          const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (profileError) throw profileError;
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          setCurrentUser(appUser);
          localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(appUser));
        } else {
          setCurrentUser(defaultGuestUserForApp);
          localStorage.removeItem(LS_CURRENT_USER_KEY);
        }
      } catch (e) {
        console.error("CRITICAL ERROR di dalam onAuthStateChange callback:", e);
        setCurrentUser(defaultGuestUserForApp);
      } finally {
        setLoadingInitialSession(false);
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoadingInitialSession(false);
        setCurrentUser(defaultGuestUserForApp);
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'home';
    const pathSegments = location.pathname.split('/');

    const titles_id = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar" };
    const titles_en = { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register" };
    
    let titleKey = path;
    if (path === 'events' && pathSegments.length > 2) {
        titleKey = 'events';
    }
    if (path.startsWith('admin') || location.pathname.includes('postairdrops') || location.pathname.includes('update')) {
        titleKey = 'admin';
    }

    const currentTitles = language === 'id' ? titles_id : titles_en;
    setHeaderTitle(currentTitles[titleKey] || "AFA WEB3TOOL");
    
  }, [location, language]);

  useEffect(() => {
    if (loadingInitialSession) return;
    if (pageContentRef.current) {
      const el = pageContentRef.current;
      el.classList.remove("content-enter-active", "content-enter");
      void el.offsetWidth;
      el.classList.add("content-enter");
      const timer = setTimeout(() => { if (el) el.classList.add("content-enter-active"); }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, loadingInitialSession]);


  // [DIPINDAHKAN & DIPERBARUI] Logika logout terpusat
  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    navigate('/login');
  };

  const handleMintNft = () => { alert("Fungsi Mint NFT akan diimplementasikan!"); };
  const handleUpdateUserInApp = (updatedUserData) => {
    setCurrentUser(updatedUserData);
    try {
      localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(updatedUserData));
    } catch (e) { console.error("Error saving updated user to LS in App:", e); }
  };

  const mainPaddingBottomClass = location.pathname === '/forum' ? 'pb-0' : 'pb-[var(--bottomnav-height)]';
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.includes('/postairdrops') && !location.pathname.includes('/update');
  const handleOpenWalletModal = () => setIsWalletModalOpen(true);

  if (loadingInitialSession) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white bg-[#0a0a1a]">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        {language === 'id' ? 'Memuat Aplikasi...' : 'Loading Application...'}
      </div>
    );
  }

  return (
    <div className="font-sans h-screen flex flex-col overflow-hidden">
      {/* [MODIFIKASI] Teruskan fungsi handleLogout ke Header */}
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={onlineUsers} />}
      
      <WalletConnectModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
      
      <main
        ref={pageContentRef}
        className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${showNav ? mainPaddingBottomClass : ''} overflow-y-auto`}
      >
        <Routes>
          <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} onMintNft={handleMintNft} />} />
          <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
          <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} />} />
          <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={userForHeader} />} />
          <Route path="/airdrops/:airdropSlug/update" element={<PageManageUpdate currentUser={userForHeader} />} />
          <Route path="/airdrops/:airdropSlug/update/:updateId" element={<PageManageUpdate currentUser={userForHeader} />} />
          <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
          <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
          
          <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
          <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
          
          <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
          <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
          
          <Route path="/admin" element={<PageAdminDashboard />} />
          <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
          
          {/* [MODIFIKASI] Teruskan fungsi handleLogout ke PageProfile */}
          <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={handleUpdateUserInApp} userAirdrops={userAirdrops} navigate={navigate} />} />
          <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} onMintNft={handleMintNft} />} />
        </Routes>
      </main>
      {showNav && <BottomNav currentUser={currentUser} />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
