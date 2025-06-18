// src/App.jsx (Versi Final & Lengkap)

import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect } from 'wagmi';

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

import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=G`,
  address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
  user_metadata: {},
  telegram_id: null,
  telegram_handle: null,
};

const mapSupabaseDataToAppUserForApp = (authUser, profileData) => {
  if (!authUser) return defaultGuestUserForApp;
  return {
    id: authUser.id,
    email: authUser.email,
    username: profileData?.username || authUser.user_metadata?.user_name || "user_" + authUser.id.substring(0, 6),
    name: profileData?.name || authUser.user_metadata?.full_name || "User",
    avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url || defaultGuestUserForApp.avatar_url,
    stats: profileData?.stats || { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
    address: profileData?.web3_address || null,
    telegram_id: profileData?.telegram_id || null,
    telegram_handle: profileData?.telegram_handle || null,
    user_metadata: authUser.user_metadata || {}
  };
};

function MainAppContent() {
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const pageContentRef = useRef(null);
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();

  // ====================== PERBAIKAN LOGIKA LOADING DI SINI ======================
  useEffect(() => {
    setLoadingInitialSession(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session && session.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) throw profileError;
          
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          setCurrentUser(appUser);
        } else {
          setCurrentUser(defaultGuestUserForApp);
        }
      } catch (e) {
        console.error("Error handling auth change:", e);
        setCurrentUser(defaultGuestUserForApp);
      } finally {
        // Ini akan selalu dijalankan setelah pengecekan sesi selesai
        setLoadingInitialSession(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  // ============================================================================

  // Sisa kode tidak berubah
  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    navigate('/login');
   };
  const handleUpdateUserInApp = (updatedUserData) => {
    setCurrentUser(updatedUserData);
   };
  const handleOpenWalletModal = () => setIsWalletModalOpen(true);
  
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'home';
    const titles = {
        id: { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar" },
        en: { home: "AFA WEB3TOOL", 'my-work': "My Work", airdrops: "Airdrop List", forum: "Community Forum", profile: "My Profile", events: "Special Events", admin: "Admin Dashboard", login: "Login", register: "Register" }
    };
    setHeaderTitle(titles[language][path] || "AFA WEB3TOOL");
  }, [location, language]);


  if (loadingInitialSession || !currentUser) { // Tambahkan cek !currentUser
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a1a]">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-white">{language === 'id' ? 'Memuat Aplikasi...' : 'Loading Application...'}</span>
      </div>
    );
  }
  
  const showNav = !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.startsWith('/admin');

  return (
    <div className="font-sans h-screen flex flex-col overflow-hidden">
        {showNav && <Header title={headerTitle} currentUser={currentUser} onLogout={handleLogout} navigateTo={navigate} onlineUsers={0} />}
        <WalletConnectModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
        <main ref={pageContentRef} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${showNav ? 'pb-[var(--bottomnav-height)]' : ''} overflow-y-auto`}>
            <Routes>
                <Route path="/" element={<PageHome currentUser={currentUser} navigate={navigate} />} />
                <Route path="/my-work" element={<PageMyWork currentUser={currentUser} />} />
                <Route path="/airdrops" element={<PageAirdrops currentUser={currentUser} />} />
                <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={currentUser} />} />
                <Route path="/airdrops/:airdropSlug/update" element={<PageManageUpdate currentUser={currentUser} />} />
                <Route path="/airdrops/:airdropSlug/update/:updateId" element={<PageManageUpdate currentUser={currentUser} />} />
                <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={currentUser} />} />
                <Route path="/forum" element={<PageForum currentUser={currentUser} />} />
                <Route path="/events" element={<PageEvents currentUser={currentUser} />} />
                <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={currentUser} />} />
                <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
                <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
                <Route path="/admin" element={<PageAdminDashboard />} />
                <Route path="/admin/events" element={<PageAdminEvents currentUser={currentUser} />} />
                <Route path="/profile" element={<PageProfile currentUser={currentUser} onUpdateUser={handleUpdateUserInApp} onLogout={handleLogout} userAirdrops={[]} onOpenWalletModal={handleOpenWalletModal} />} />
                <Route path="*" element={<PageHome currentUser={currentUser} navigate={navigate} />} />
            </Routes>
        </main>
        {showNav && <BottomNav currentUser={currentUser} />}
    </div>
  );
}

export default function App() {
  return <MainAppContent />;
}
