import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
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
import PageLoginWithTelegram from './components/PageLoginWithTelegram';
import TelegramAuthCallback from './components/TelegramAuthCallback';

// Impor lainnya
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

// Komponen Penjaga Rute (Tidak berubah, sudah benar)
const ProtectedRoute = ({ currentUser, redirectPath = '/login' }) => {
    if (!currentUser) {
        return <Navigate to={redirectPath} replace />;
    }
    return <Outlet />;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);

  // State & Hooks lainnya (tidak berubah)
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { open: openWalletModal } = useWeb3Modal();
  const { disconnect } = useDisconnect();

  // --- LOGIKA AUTENTIKASI BARU YANG LEBIH KOKOH ---
  useEffect(() => {
    // 1. Fungsi terpisah untuk memperbarui state user. Bisa dipanggil dari mana saja.
    const updateUserState = async (session) => {
      if (session?.user) {
        console.log("[Auth] Sesi ditemukan. Mengambil profil untuk user:", session.user.id);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
        setCurrentUser(appUser);
      } else {
        console.log("[Auth] Tidak ada sesi aktif, user adalah Guest.");
        setCurrentUser(null);
      }
    };

    // 2. Listener onAuthStateChange hanya bertugas memperbarui user SETELAH login/logout,
    // tidak ikut campur dalam logika loading awal.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[Auth] Listener event: ${_event}. Memperbarui state user...`);
      updateUserState(session);
    });

    // 3. Fungsi utama untuk inisialisasi sesi saat aplikasi pertama kali dimuat.
    const initializeSession = async () => {
      try {
        // Cek apakah ada sesi yang sudah ada di Supabase client.
        const { data: { session } } = await supabase.auth.getSession();
        
        // Di lingkungan Telegram, kita lakukan validasi ulang dengan initData untuk keamanan,
        // meskipun mungkin sudah ada sesi lokal.
        if (window.Telegram?.WebApp?.initData) {
          console.log("[Auth] Lingkungan Telegram. Memvalidasi dengan initData...");
          window.Telegram.WebApp.ready();
          const initData = window.Telegram.WebApp.initData;
          const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });

          if (error) throw error;
          if (data.error) throw new Error(data.error);
          
          // Setelah validasi sukses, atur sesi baru. onAuthStateChange akan menangani update state.
          await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
          console.log("[Auth] Sesi Telegram berhasil divalidasi dan diatur.");

        } else if (session) {
          // Jika di browser biasa dan ada sesi, langsung gunakan.
          console.log("[Auth] Lingkungan Non-Telegram. Menggunakan sesi yang ada.");
          await updateUserState(session);
        } else {
          // Jika tidak ada sesi sama sekali.
          await updateUserState(null);
        }
      } catch (err) {
        console.error("[Auth] Gagal saat inisialisasi sesi:", err);
        setCurrentUser(null); // Jika error, pastikan user adalah null.
      } finally {
        // 4. PENTING: Matikan layar loading HANYA SETELAH semua proses di atas selesai.
        console.log("[Auth] Inisialisasi sesi selesai.");
        setLoadingInitialSession(false);
      }
    };
    
    initializeSession();

    // Cleanup listener saat komponen di-unmount.
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Dependensi kosong agar hanya berjalan sekali.


  // --- Sisa Komponen (Tidak ada perubahan signifikan) ---
  const handleLogout = async () => { await supabase.auth.signOut(); disconnect(); localStorage.clear(); window.location.href = '/login'; };
  const handleUpdateUserInApp = (updatedUserData) => setCurrentUser(updatedUserData);
  
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

  // Setelah loading selesai, render aplikasi utama.
  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={0} isHeaderVisible={isHeaderVisible} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <main ref={pageContentRef} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 space-y-6 overflow-y-auto custom-scrollbar ${showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6'}`}>
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<PageLogin currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />
          <Route path="/register" element={<PageRegister currentUser={currentUser} onOpenWalletModal={handleOpenWalletModal} />} />

          {/* Rute yang Diproteksi */}
          <Route element={<ProtectedRoute currentUser={currentUser} />}>
            <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
            <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
            <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} onEnterPage={() => {}} />} />
            <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
            <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
            <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
            <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
            <Route path="/identity" element={<PageAfaIdentity currentUser={userForHeader} onOpenWalletModal={handleOpenWalletModal} />} />
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={handleUpdateUserInApp} userAirdrops={[]} onOpenWalletModal={handleOpenWalletModal} />} />
            
            {/* Rute Admin (juga diproteksi) */}
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
      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={() => {}} />
    </div>
  );
}
