import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { useDisconnect } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Impor komponen Anda
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

// Impor lainnya
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

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

// Komponen Penjaga Rute
const ProtectedRoute = ({ currentUser }) => {
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);

  // State & Hooks lainnya
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const pageContentRef = useRef(null);
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    // Fungsi untuk memperbarui state user dari sesi Supabase
    const updateUserState = async (session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
    };

    // Fungsi utama untuk inisialisasi sesi
    const initializeSession = async () => {
      try {
        if (window.Telegram?.WebApp?.initData) {
          console.log("[Auth] Lingkungan Telegram. Memvalidasi dengan initData...");
          window.Telegram.WebApp.ready();
          const initData = window.Telegram.WebApp.initData;
          const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });

          if (error) throw new Error(`Gagal memanggil function: ${error.message}`);
          if (data.error) throw new Error(`Error dari function: ${data.error}`);
          
          const { error: sessionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
          if(sessionError) throw sessionError;
          
          // Setelah setSession, onAuthStateChange akan menangani update state.
          console.log("[Auth] Sesi Telegram berhasil divalidasi dan diatur.");
        } else {
          // Untuk browser biasa, cukup ambil sesi yang ada.
          const { data: { session } } = await supabase.auth.getSession();
          await updateUserState(session);
        }
      } catch (err) {
        console.error("[Auth] Gagal saat inisialisasi sesi:", err);
        setCurrentUser(null);
      } finally {
        setLoadingInitialSession(false);
      }
    };

    // Listener onAuthStateChange untuk menangani login/logout setelah inisialisasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[Auth] Listener event: ${_event}.`);
      updateUserState(session);
    });
    
    initializeSession();

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    setCurrentUser(null);
    navigate('/login');
  };

  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register');

  // Tampilkan layar loading global jika sesi belum selesai diinisialisasi.
  if (loadingInitialSession) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">{language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}</span>
      </div>
    );
  }

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} isHeaderVisible={isHeaderVisible} />}
      <main ref={pageContentRef} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 space-y-6 overflow-y-auto custom-scrollbar ${showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6'}`}>
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<PageLogin />} />
          <Route path="/register" element={<PageRegister />} />

          {/* Rute yang Diproteksi */}
          <Route element={<ProtectedRoute currentUser={currentUser} />}>
            <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
            <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
            <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
            <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
            <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
            <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
            <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={openWalletModal} />} />
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={setCurrentUser} onOpenWalletModal={openWalletModal} />} />
            
            {/* Rute Admin */}
            <Route path="/admin" element={<PageAdminDashboard />} />
            <Route path="/admin/events" element={<PageAdminEvents currentUser={userForHeader} />} />
            <Route path="/airdrops/postairdrops" element={<PageAdminAirdrops currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug/update" element={<PageManageUpdate currentUser={userForHeader} />} />
            <Route path="/airdrops/:airdropSlug/update/:updateId" element={<PageManageUpdate currentUser={userForHeader} />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showNav && <BottomNav currentUser={currentUser} />}
      <BackToTopButton show={showBackToTop} onClick={() => pageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
    </div>
  );
}
