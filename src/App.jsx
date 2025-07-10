import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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

// Impor utilitas
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

// --- KONSTANTA & FUNGSI HELPER ---

const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

// Objek default untuk pengguna yang belum login (Guest)
const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`,
  address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
  user_metadata: {}
};

// Fungsi untuk memetakan data Supabase ke objek user yang dipakai di aplikasi
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

// Fungsi ini penting: membuat profil jika belum ada.
const createProfileForUser = async (user) => {
  console.log(`Mencoba membuat profil untuk user baru: ${user.id}`);
  try {
    const { data, error } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.user_name || user.email.split('@')[0],
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email.substring(0,2).toUpperCase()}&background=1B4DC1&color=FFF8F0`,
      }).select().single();
      
    if (error) {
        // Error '23505' adalah 'unique_violation', artinya profil sudah ada. Ini bukan error fatal.
        if (error.code === '23505') {
            console.warn("Profil sudah ada (konflik saat insert), akan coba ambil lagi.");
            const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            return existingProfile;
        }
        throw error;
    }
    console.log("Profil baru berhasil dibuat:", data);
    return data;
  } catch (creationError) {
    console.error("Error saat membuat profil:", creationError);
    return null; // Kembalikan null jika gagal total
  }
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  
  // State UI lainnya
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewAirdropNotification, setHasNewAirdropNotification] = useState(false);
  
  // Refs & Hooks
  const lastScrollY = useRef(0);
  const pageContentRef = useRef(null);
  const backToTopTimeoutRef = useRef(null);
  const scrollUpStartPosRef = useRef(null);
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const { open: openWalletModal } = useWeb3Modal();

  // --- EFEK UTAMA UNTUK AUTENTIKASI (VERSI FINAL) ---
  useEffect(() => {
    // Failsafe: jika dalam 7 detik masih loading, paksa hilangkan.
    const loadingTimeout = setTimeout(() => {
      console.error("TIMEOUT: Proses loading macet. Cek RLS & koneksi Supabase. Menampilkan UI secara paksa.");
      if (loadingInitialSession) {
        setLoadingInitialSession(false);
        setCurrentUser(defaultGuestUserForApp);
      }
    }, 7000);

    // Fungsi ini adalah jantung dari sistem. Dipanggil setiap kali status auth berubah.
    const processSession = async (session) => {
      console.log("Memproses sesi...");
      if (!session?.user) {
        console.log("Sesi tidak ada. Mengatur user sebagai Guest.");
        setCurrentUser(defaultGuestUserForApp);
        return;
      }
      
      try {
        console.log(`Sesi ditemukan untuk user: ${session.user.id}. Mengambil profil...`);
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle(); // .maybeSingle() tidak error jika tidak ada data, hanya mengembalikan null.

        if (profileError) {
          console.error("GAGAL mengambil profil. Pastikan RLS di tabel 'profiles' sudah benar!", profileError);
          await supabase.auth.signOut();
          return;
        }

        // Jika profil tidak ditemukan, buat profil baru.
        if (!profile) {
          console.warn(`Profil untuk user ${session.user.id} tidak ditemukan. Membuat profil baru...`);
          profile = await createProfileForUser(session.user);
        }

        if (profile) {
          console.log("Profil berhasil dimuat. Mengatur user di aplikasi.");
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          setCurrentUser(appUser);
        } else {
          console.error("GAGAL TOTAL: Tidak bisa mendapatkan atau membuat profil. Logout.");
          await supabase.auth.signOut();
        }

      } catch (error) {
        console.error("Terjadi error tak terduga saat memproses sesi:", error);
        setCurrentUser(defaultGuestUserForApp);
      }
    };
    
    // 1. Ambil sesi saat ini saat aplikasi pertama kali dimuat.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await processSession(session);
      // Setelah proses pertama selesai, baru hilangkan loading screen.
      clearTimeout(loadingTimeout);
      setLoadingInitialSession(false);
    });

    // 2. Dengarkan perubahan status auth (login, logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`Event auth terdeteksi: ${_event}`);
      await processSession(session);
    });
    
    // Cleanup: berhenti mendengarkan saat komponen di-unmount.
    return () => {
      subscription?.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // --- EFEK LAIN-LAIN ---

  // Efek untuk sinkronisasi alamat dompet
  useEffect(() => {
    if (address && currentUser?.id && address !== currentUser.address) {
      console.log(`Alamat dompet terdeteksi: ${address}. Menyimpan ke profil...`);
      supabase.from('profiles').update({ web3_address: address }).eq('id', currentUser.id)
        .then(({ error }) => {
          if (error) console.error("Gagal update alamat dompet ke Supabase:", error);
          else {
            setCurrentUser(prevUser => ({...prevUser, address}));
          }
        });
    }
  }, [address, currentUser?.id]);
  
  // Efek untuk mengubah judul header berdasarkan halaman
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'home';
    const titles = { home: "AFA WEB3TOOL", 'my-work': "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya", events: "Event Spesial", admin: "Admin Dashboard", login: "Login", register: "Daftar" };
    setHeaderTitle(titles[path] || "AFA WEB3TOOL");
  }, [location, language]);

  // Handler Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect(); // Dari Wagmi
    setCurrentUser(null);
    navigate('/login');
  };
  
  const handleUpdateUserInApp = (updatedUserData) => {
    setCurrentUser(updatedUserData);
  };
  
  // --- RENDER ---

  // Jika masih loading, tampilkan spinner. Ini untuk mencegah render komponen lain sebelum sesi siap.
  if (loadingInitialSession) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">{language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}</span>
      </div>
    );
  }

  // Setelah loading selesai, render aplikasi utama.
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register');

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header title={headerTitle} currentUser={userForHeader} onLogout={handleLogout} navigateTo={navigate} onlineUsers={onlineUsers} isHeaderVisible={isHeaderVisible} hasNewAirdropNotification={hasNewAirdropNotification} />}

      <main ref={pageContentRef} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all pb-[var(--bottomnav-height)] md:pb-6 overflow-y-auto custom-scrollbar`}>
        <Routes>
          <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
          <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
          <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} />} />
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
          <Route path="/profile" element={<PageProfile currentUser={userForHeader} onLogout={handleLogout} onUpdateUser={handleUpdateUserInApp} onOpenWalletModal={openWalletModal} />} />
          <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
        </Routes>
      </main>

      {showNav && <BottomNav currentUser={currentUser} hasNewAirdropNotification={hasNewAirdropNotification} />}
      <BackToTopButton show={showBackToTop} onClick={() => pageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} />
    </div>
  );
}
