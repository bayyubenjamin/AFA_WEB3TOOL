import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner'; // <-- [DIUBAH] Menggunakan sonner
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient';
import { useAccount, useDisconnect } from 'wagmi';

// Import komponen halaman
import PageHome from './components/PageHome';
import PageAirdrops from './components/PageAirdrops';
import AirdropDetailPage from './components/AirdropDetailPage';
import PageEvents from './components/PageEvents';
import PageEventDetail from './components/PageEventDetail';
import PageForum from './components/PageForum';
import PageMyWork from './components/PageMyWork';
import PageProfile from './components/PageProfile';
import PageLogin from './components/PageLogin';
import PageRegister from './components/PageRegister';
import PageAdminDashboard from './components/PageAdminDashboard';
import PageAdminAirdrops from './components/PageAdminAirdrops';
import PageAdminEvents from './components/PageAdminEvents';
import PageAfaIdentity from './components/PageAfaIdentity';
import PageLoginWithTelegram from './components/PageLoginWithTelegram';
import TelegramAuthCallback from './components/TelegramAuthCallback';

// Import komponen UI
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';
import BackToTopButton from './components/BackToTopButton';

// Import CSS
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      setIsTelegram(true);
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  useEffect(() => {
    setLoadingInitialSession(true);
    console.log("[Auth] Memulai pengecekan sesi...");

    const handleSessionUpdate = async (session) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*, roles(role)')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Gagal mengambil profil:', error);
          setCurrentUser(session.user);
          setIsAdmin(false);
        } else {
          setCurrentUser(profile);
          const userIsAdmin = profile.roles && profile.roles.some(r => r.role === 'admin');
          setIsAdmin(userIsAdmin);
          console.log('[Auth] Profil pengguna berhasil dimuat:', profile);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        console.log('[Auth] Tidak ada sesi aktif.');
      }
      setLoadingInitialSession(false);
    };

    const authInTelegram = async () => {
      console.log("[Auth] Lingkungan Telegram terdeteksi.");
      try {
        const initData = window.Telegram.WebApp.initData;
        if (!initData) {
          console.warn("[Auth] initData kosong. Sesi akan ditangani oleh onAuthStateChange.");
          const { data: { session } } = await supabase.auth.getSession();
          handleSessionUpdate(session);
          return;
        }

        console.log("[Auth] Mengirim initData ke function 'telegram-auth'...");
        const { data, error } = await supabase.functions.invoke('telegram-auth', {
          body: { initData },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        console.log("[Auth] Sukses! Mengatur sesi dari function.");
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) throw sessionError;

      } catch (err) {
        console.error("[Auth] Gagal autentikasi via Telegram initData:", err);
        const { data: { session } } = await supabase.auth.getSession();
        await handleSessionUpdate(session);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log(`[Auth] Event terdeteksi: ${_event}`);
      if (_event === 'INITIAL_SESSION') {
        if (isTelegram) {
          await authInTelegram();
        } else {
          await handleSessionUpdate(session);
        }
      } else if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(_event)) {
        await handleSessionUpdate(session);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isTelegram]);

  useEffect(() => {
    const explicitlyLoggedOut = sessionStorage.getItem('explicitlyLoggedOut') === 'true';
    if (explicitlyLoggedOut) return;

    if (!isConnected && currentUser) {
      console.log("User is logged in but wallet disconnected. Logging out.");
      supabase.auth.signOut();
      sessionStorage.setItem('explicitlyLoggedOut', 'true');
    }
  }, [isConnected, currentUser, disconnect]);

  const memoizedRoutes = useMemo(() => (
    <Routes>
      <Route path="/" element={<PageHome currentUser={currentUser} />} />
      <Route path="/airdrops" element={<PageAirdrops currentUser={currentUser} />} />
      <Route path="/airdrop/:id" element={<AirdropDetailPage currentUser={currentUser} />} />
      <Route path="/event" element={<PageEvents currentUser={currentUser} />} />
      <Route path="/event/:id" element={<PageEventDetail currentUser={currentUser} />} />
      <Route path="/forum" element={<PageForum currentUser={currentUser} />} />
      <Route path="/my-work" element={<PageMyWork currentUser={currentUser} />} />
      <Route path="/profile" element={<PageProfile currentUser={currentUser} />} />
      <Route path="/afa-identity" element={<PageAfaIdentity currentUser={currentUser} />} />
      <Route path="/login" element={<PageLogin />} />
      <Route path="/register" element={<PageRegister />} />
      <Route path="/login-telegram" element={<PageLoginWithTelegram />} />
      <Route path="/auth/telegram/callback" element={<TelegramAuthCallback />} />
      
      {isAdmin && (
        <>
          <Route path="/admin" element={<PageAdminDashboard />} />
          <Route path="/admin/airdrops" element={<PageAdminAirdrops />} />
          <Route path="/admin/events" element={<PageAdminEvents />} />
        </>
      )}
    </Routes>
  ), [currentUser, isAdmin]);

  if (loadingInitialSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>{t('loading_session')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !['/login', '/register', '/login-telegram', '/auth/telegram/callback'].includes(location.pathname)) {
    return (
      <Routes>
        <Route path="*" element={<PageLogin />} />
      </Routes>
    );
  }
  
  if (currentUser && ['/login', '/register'].includes(location.pathname)) {
    navigate('/');
    return null; 
  }

  const showNavigation = !['/login', '/register', '/login-telegram', '/auth/telegram/callback'].includes(location.pathname);

  return (
    <div className={`app-container bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col md:flex-row`}>
      {/* [DIUBAH] Menggunakan Toaster dari sonner */}
      <Toaster position="top-center" richColors />
      
      {showNavigation && <DesktopNav isAdmin={isAdmin} />}
      
      <div className="flex-grow md:ml-64 pb-16 md:pb-0">
        {showNavigation && <Header />}
        <main className="p-4">
          {memoizedRoutes}
        </main>
      </div>
      
      {showNavigation && <BottomNav isAdmin={isAdmin} />}
      
      <BackToTopButton />
    </div>
  );
}
