import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Toaster, toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Import komponen halaman
import Header from './components/Header';
import BottomNav from './components/BottomNav';
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
import PageManageUpdate from './components/PageManageUpdate';
import PageAfaIdentity from './components/PageAfaIdentity';
import PageLoginWithTelegram from './components/PageLoginWithTelegram';
import TelegramAuthCallback from './components/TelegramAuthCallback';
import BackToTopButton from './components/BackToTopButton';

// Helper function to map Supabase user data to application's user format
const mapSupabaseDataToAppUserForApp = (supabaseUser, profile) => {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    username: profile?.username || 'Guest',
    avatar_url: profile?.avatar_url,
    role: profile?.role || 'user',
    telegram_id: profile?.telegram_id,
    wallet_address: profile?.wallet_address,
  };
};

// Main App component
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const { t } = useTranslation();

  // --- REVISED AUTHENTICATION LOGIC ---
  useEffect(() => {
    setLoadingInitialSession(true);
    console.log("[Auth] Starting session check...");

    // Function to handle session updates and fetch user profile
    const handleSessionUpdate = async (session) => {
      if (session?.user) {
        console.log("[Auth] Session found. Fetching profile for user:", session.user.id);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
             throw error;
          }
          
          const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
          setCurrentUser(appUser);
          console.log("[Auth] Profile loaded, user set:", appUser.username);

        } catch (error) {
            console.error("[Auth] Error fetching profile:", error);
            // If profile fetch fails, still set a basic user object to avoid being logged out
            setCurrentUser(mapSupabaseDataToAppUserForApp(session.user, null));
        }
      } else {
        console.log("[Auth] No active session, user is Guest.");
        setCurrentUser(null);
      }
      setLoadingInitialSession(false);
    };

    // Authentication flow specific to the Telegram Mini App environment
    const authInTelegram = async () => {
      console.log("[Auth] Telegram environment detected. Starting initData auth flow.");
      
      // Ensure the Telegram WebApp SDK is ready
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
      }

      try {
        const initData = window.Telegram.WebApp.initData;
        if (!initData) {
          console.warn("[Auth] initData is empty. Falling back to getSession().");
          const { data: { session } } = await supabase.auth.getSession();
          handleSessionUpdate(session);
          return;
        }

        console.log("[Auth] Sending initData to 'telegram-auth' function...");
        const { data, error } = await supabase.functions.invoke('telegram-auth', {
          body: { initData },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        console.log("[Auth] Success! Setting session from function response.");
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) throw sessionError;
        
        // After setting the session, the onAuthStateChange listener will automatically
        // trigger and call handleSessionUpdate. This avoids race conditions.

      } catch (err) {
        console.error("[Auth] Failed to authenticate via Telegram initData:", err);
        // If the custom flow fails, attempt to recover a session from local storage as a final fallback.
        const { data: { session } } = await supabase.auth.getSession();
        handleSessionUpdate(session);
      }
    };

    // Listener for auth state changes (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`[Auth] Auth state change detected: ${_event}`);
      // We handle the session update here for all events except the initial one,
      // which is handled by the logic below to manage the Telegram flow correctly.
      if (_event !== 'INITIAL_SESSION') {
           handleSessionUpdate(session);
      }
    });

    // Determine the environment and start the appropriate auth flow
    if (window.Telegram?.WebApp?.initData) {
      authInTelegram();
    } else {
      console.log("[Auth] Non-Telegram environment, running standard getSession().");
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleSessionUpdate(session);
      });
    }

    // Cleanup subscription on component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on initial load.


  // Display a loading indicator while the initial session is being determined
  if (loadingInitialSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-purple-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">{t('loading_session')}</p>
        </div>
      </div>
    );
  }

  // Main application layout
  return (
    <div className="app-container bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <Toaster position="top-center" richColors />
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <main className="flex-grow pb-16 md:pb-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PageHome currentUser={currentUser} />} />
          <Route path="/airdrops" element={<PageAirdrops currentUser={currentUser} />} />
          <Route path="/airdrop/:id" element={<AirdropDetailPage currentUser={currentUser} />} />
          <Route path="/events" element={<PageEvents currentUser={currentUser} />} />
          <Route path="/event/:id" element={<PageEventDetail currentUser={currentUser} />} />
          <Route path="/forum" element={<PageForum currentUser={currentUser} />} />
          <Route path="/my-work" element={<PageMyWork currentUser={currentUser} />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<PageLogin setCurrentUser={setCurrentUser} />} />
          <Route path="/register" element={<PageRegister />} />
          <Route path="/login-telegram" element={<PageLoginWithTelegram />} />
          <Route path="/auth/callback/telegram" element={<TelegramAuthCallback />} />

          {/* Protected Routes */}
          <Route path="/profile" element={currentUser ? <PageProfile currentUser={currentUser} setCurrentUser={setCurrentUser} /> : <PageLogin setCurrentUser={setCurrentUser} />} />
          <Route path="/identity" element={currentUser ? <PageAfaIdentity currentUser={currentUser} /> : <PageLogin setCurrentUser={setCurrentUser} />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={currentUser?.role === 'admin' ? <PageAdminDashboard /> : <PageHome />} />
          <Route path="/admin/airdrops" element={currentUser?.role === 'admin' ? <PageAdminAirdrops /> : <PageHome />} />
          <Route path="/admin/events" element={currentUser?.role === 'admin' ? <PageAdminEvents /> : <PageHome />} />
          <Route path="/admin/manage-updates/:airdropId" element={currentUser?.role === 'admin' ? <PageManageUpdate /> : <PageHome />} />
        </Routes>
      </main>
      <BackToTopButton />
      <BottomNav />
    </div>
  );
}

