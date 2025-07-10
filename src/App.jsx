import React, { useState, useRef, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { useDisconnect } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Impor semua komponen dan halaman Anda di sini
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import PageHome from "./components/PageHome";
import PageProfile from "./components/PageProfile";
import PageLogin from "./components/PageLogin";
import PageRegister from "./components/PageRegister";
// ... dan seterusnya untuk semua halaman Anda

// Impor lainnya
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

// User default jika tidak login
const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`,
  address: null,
  telegram_user_id: null,
};

// Fungsi mapping data (sudah benar)
const mapSupabaseDataToAppUserForApp = (authUser, profileData) => {
  if (!authUser) return defaultGuestUserForApp;
  return {
    id: authUser.id,
    email: authUser.email,
    username: profileData?.username || "User",
    name: profileData?.name || "User",
    avatar_url: profileData?.avatar_url || defaultGuestUserForApp.avatar_url,
    telegram_user_id: profileData?.telegram_user_id || null,
    // ...tambahkan field lain jika ada...
  };
};

// Komponen Penjaga Rute (sudah benar)
const ProtectedRoute = ({ currentUser }) => {
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

// --- KOMPONEN APP UTAMA YANG SUDAH BERSIH ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { language } = useLanguage();
  const { open: openWalletModal } = useWeb3Modal();

  useEffect(() => {
    // Fungsi sederhana untuk memeriksa sesi login utama saat aplikasi dimuat.
    // TIDAK ADA LOGIKA TELEGRAM DI SINI.
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
        setCurrentUser(appUser);
      }
      setLoadingInitialSession(false);
    };

    initializeSession();

    // Listener untuk menangani perubahan status login/logout secara real-time.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`[Auth] Event terdeteksi: ${_event}`);
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
        setCurrentUser(appUser);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []); // Dependensi kosong, hanya berjalan sekali.

  const handleLogout = async () => {
    await supabase.auth.signOut();
    disconnect();
    setCurrentUser(null);
    navigate('/login');
  };
  
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register');

  // Tampilkan layar loading saat sesi sedang diperiksa.
  if (loadingInitialSession) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
        <span className="text-gray-800 dark:text-dark-text">
          {language === 'id' ? 'Memuat Sesi...' : 'Loading Session...'}
        </span>
      </div>
    );
  }

  // Setelah loading selesai, render aplikasi utama.
  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {showNav && <Header currentUser={userForHeader} onLogout={handleLogout} />}
      <main className="flex-grow overflow-y-auto p-4">
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<PageLogin />} />
          <Route path="/register" element={<PageRegister />} />

          {/* Rute yang Diproteksi */}
          <Route element={<ProtectedRoute currentUser={currentUser} />}>
            <Route path="/" element={<PageHome currentUser={userForHeader} />} />
            <Route 
              path="/profile" 
              element={
                <PageProfile 
                  currentUser={currentUser} 
                  onLogout={handleLogout} 
                  onUpdateUser={setCurrentUser} // Melewatkan fungsi untuk update state
                  onOpenWalletModal={openWalletModal}
                />
              } 
            />
            {/* ... semua rute privat Anda yang lain */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showNav && <BottomNav currentUser={currentUser} />}
    </div>
  );
}
