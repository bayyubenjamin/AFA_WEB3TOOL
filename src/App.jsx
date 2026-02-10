import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { Toaster } from 'sonner';

// Lazy Load Components untuk performa
const PageHome = React.lazy(() => import('./components/PageHome'));
const PageEvents = React.lazy(() => import('./components/PageEvents'));
const PageEventDetail = React.lazy(() => import('./components/PageEventDetail'));
const PageAirdrops = React.lazy(() => import('./components/PageAirdrops'));
const PageLogin = React.lazy(() => import('./components/PageLogin'));
const PageRegister = React.lazy(() => import('./components/PageRegister'));
const PageProfile = React.lazy(() => import('./components/PageProfile'));
const PageMyWork = React.lazy(() => import('./components/PageMyWork'));
const PageForum = React.lazy(() => import('./components/PageForum'));
const PageWarungKripto = React.lazy(() => import('./components/PageWarungKripto'));
const PageAfaIdentity = React.lazy(() => import('./components/PageAfaIdentity'));
const PageQuestCenter = React.lazy(() => import('./components/PageQuestCenter'));
const AirdropDetailPage = React.lazy(() => import('./components/AirdropDetailPage'));

// Admin Pages
const PageAdminDashboard = React.lazy(() => import('./components/PageAdminDashboard'));
const PageAdminAirdrops = React.lazy(() => import('./components/PageAdminAirdrops'));
const PageAdminEvents = React.lazy(() => import('./components/PageAdminEvents'));
const PageAdminWarung = React.lazy(() => import('./components/PageAdminWarung'));

// Components
const TelegramAuthCallback = React.lazy(() => import('./components/TelegramAuthCallback'));

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // --- 1. HANDLING AUTH & LOADING (Anti-Stuck Logic) ---
  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) setSession(existingSession);
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSession();

    // Listener untuk perubahan auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setLoading(false);
      }
    });

    // --- SAFETY TIMEOUT ---
    // Jika dalam 5 detik loading belum kelar (misal supabase hang), paksa loading mati
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Loading timeout triggered - Forcing app render");
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []); // Hapus dependency 'loading' agar tidak loop

  // Scroll to top saat pindah halaman
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Data user untuk Header (Avatar, Nama, dll)
  const userForHeader = useMemo(() => {
    if (!session?.user) return null;
    const meta = session.user.user_metadata || {};
    return {
      id: session.user.id,
      email: session.user.email,
      name: meta.name || meta.full_name || session.user.email?.split('@')[0] || 'User',
      avatar_url: meta.avatar_url || meta.picture,
      username: meta.username || meta.preferred_username
    };
  }, [session]);

  // --- TAMPILAN LOADING ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-light-subtle dark:text-gray-400 animate-pulse">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300">
      <Toaster position="top-center" richColors />
      
      {/* Sembunyikan Header di halaman Login/Register agar bersih */}
      {!['/login', '/register', '/auth/telegram/callback'].includes(location.pathname) && (
        <Header user={userForHeader} />
      )}

      <main className="flex-grow container mx-auto px-4 pb-20 pt-4 md:pt-8">
        <Suspense fallback={
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PageHome currentUser={session?.user} />} />
            <Route path="/events" element={<PageEvents />} />
            <Route path="/events/:id" element={<PageEventDetail />} />
            <Route path="/airdrops" element={<PageAirdrops />} />
            <Route path="/airdrop/:id" element={<AirdropDetailPage />} />
            <Route path="/warung" element={<PageWarungKripto />} />
            <Route path="/afa-identity" element={<PageAfaIdentity />} />
            <Route path="/quest" element={<PageQuestCenter currentUser={userForHeader} />} />
            <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<PageLogin currentUser={session?.user} />} />
            <Route path="/register" element={<PageRegister currentUser={session?.user} />} />
            <Route path="/auth/telegram/callback" element={<TelegramAuthCallback />} />

            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={session ? <PageProfile currentUser={session?.user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/my-work" 
              element={session ? <PageMyWork currentUser={session?.user} /> : <Navigate to="/login" />} 
            />

            {/* Admin Routes (Contoh sederhana, idealnya cek role) */}
            <Route path="/admin/dashboard" element={session ? <PageAdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/admin/airdrops" element={session ? <PageAdminAirdrops /> : <Navigate to="/login" />} />
            <Route path="/admin/events" element={session ? <PageAdminEvents /> : <Navigate to="/login" />} />
            <Route path="/admin/warung" element={session ? <PageAdminWarung /> : <Navigate to="/login" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!['/login', '/register'].includes(location.pathname) && <BottomNav />}
    </div>
  );
}
