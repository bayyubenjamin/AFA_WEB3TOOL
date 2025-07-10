import React, { useState, useRef, useEffect } from "react";
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
// ... (pastikan semua komponen lain diimpor)
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
const defaultGuestUserForApp = { id: null, name: "Guest User", username: "Guest User", email: null, avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`, address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 }, user_metadata: {} };

const mapSupabaseDataToAppUserForApp = (authUser, profileData) => {
    if (!authUser || !profileData) return defaultGuestUserForApp;
    return {
        id: authUser.id, email: authUser.email,
        username: profileData.username || "User", name: profileData.name || "User",
        avatar_url: profileData.avatar_url || defaultGuestUserForApp.avatar_url,
        stats: profileData.stats || defaultGuestUserForApp.stats,
        address: profileData.web3_address || null,
        telegram_user_id: profileData.telegram_user_id || null,
        user_metadata: authUser.user_metadata || {}
    };
};

const createProfileForUser = async (user) => {
  console.log(`Mencoba membuat profil untuk user baru: ${user.id}`);
  try {
    const { data, error } = await supabase.from('profiles').insert({
        id: user.id, email: user.email,
        username: user.user_metadata?.user_name || user.email.split('@')[0],
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email.substring(0,2).toUpperCase()}&background=1B4DC1&color=FFF8F0`,
      }).select().single();
    if (error && error.code !== '23505') throw error;
    if (error?.code === '23505') {
        const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return existingProfile;
    }
    return data;
  } catch (creationError) {
    console.error("Error saat membuat profil:", creationError);
    return null;
  }
};


export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [loadingError, setLoadingError] = useState(null); // <-- State baru untuk menampilkan error

  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  const { open: openWalletModal } = useWeb3Modal();
  const pageContentRef = useRef(null);
  
  // --- EFEK UTAMA UNTUK AUTENTIKASI ---
  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      if (isMounted && loadingInitialSession) {
        console.error("TIMEOUT: Proses loading macet.");
        setLoadingError("Gagal terhubung ke server. Periksa koneksi dan coba lagi. (Pastikan RLS di Supabase sudah benar)");
        setLoadingInitialSession(false);
      }
    }, 8000); // Timeout 8 detik

    const processSession = async (session) => {
      if (!session?.user) {
        setCurrentUser(defaultGuestUserForApp);
        return;
      }
      try {
        console.log(`Sesi ditemukan untuk user: ${session.user.id}. Mengambil profil...`);
        let { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profileError) throw profileError;

        if (!profile) {
          console.warn("Profil tidak ditemukan, membuat yang baru...");
          profile = await createProfileForUser(session.user);
        }

        if (profile) {
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          setCurrentUser(appUser);
          setLoadingError(null); // Hapus error jika sukses
        } else {
          throw new Error("Gagal mendapatkan atau membuat profil pengguna.");
        }
      } catch (error) {
        console.error("Error saat memproses sesi:", error);
        setLoadingError(`Gagal memuat data profil. Error: ${error.message}. Cek RLS di tabel 'profiles'.`);
        await supabase.auth.signOut();
        setCurrentUser(defaultGuestUserForApp);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await processSession(session);
      if (isMounted) {
        clearTimeout(timeoutId);
        setLoadingInitialSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'INITIAL_SESSION') {
         processSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // --- RENDER ---
  const userForHeader = currentUser || defaultGuestUserForApp;
  const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/register');

  return (
    <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
      {/* Header akan selalu tampil jika bukan halaman login/admin */}
      {showNav && <Header title="AFA WEB3TOOL" currentUser={userForHeader} onLogout={async () => { await supabase.auth.signOut(); navigate('/login'); }} />}

      <main className="flex-grow pt-[var(--header-height)] px-4 overflow-y-auto">
        {loadingInitialSession ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
            <span>Memuat Sesi...</span>
          </div>
        ) : loadingError ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h2 className="text-red-500 font-bold text-lg">Terjadi Masalah</h2>
            <p className="mt-2 text-sm">{loadingError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
            <Route path="/profile" element={<PageProfile currentUser={userForHeader} />} />
            {/* Tambahkan rute lainnya di sini */}
            <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
          </Routes>
        )}
      </main>

      {showNav && <BottomNav currentUser={currentUser} />}
    </div>
  );
}
