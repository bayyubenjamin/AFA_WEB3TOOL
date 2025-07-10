import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDisconnect, useAccount } from 'wagmi';
import { useWeb3Modal } from "@web3modal/wagmi/react";

// Komponen-komponen Anda
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

import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useLanguage } from "./context/LanguageContext";

// --- KODE DEBUGGING ---
console.log("--- SCRIPT App.jsx DIMUAT ---");
if (!supabase) {
    console.error("FATAL: Klien Supabase tidak ter-import dengan benar. Periksa supabaseClient.js");
} else {
    console.log("DEBUG: Klien Supabase berhasil di-import.");
}

// Konstanta
const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';
const defaultGuestUserForApp = { id: null, name: "Guest User", username: "Guest User", email: null, avatar_url: `https://placehold.co/100x100/F97D3C/FFF8F0?text=G`, address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 }, user_metadata: {} };

// Fungsi helper
const mapSupabaseDataToAppUserForApp = (authUser, profileData) => {
    if (!authUser) return defaultGuestUserForApp;
    return { id: authUser.id, email: authUser.email, username: profileData?.username || "User", name: profileData?.name || "User", avatar_url: profileData?.avatar_url || defaultGuestUserForApp.avatar_url, stats: profileData?.stats || defaultGuestUserForApp.stats, address: profileData?.web3_address || null, telegram_user_id: profileData?.telegram_user_id || null, user_metadata: authUser.user_metadata || {} };
};

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingInitialSession, setLoadingInitialSession] = useState(true);
    const [debugMessage, setDebugMessage] = useState("Memulai...");

    // State lain tidak berubah
    const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const pageContentRef = useRef(null);
    const { language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        console.log("--- useEffect UTAMA DIJALANKAN ---");
        setDebugMessage("Mendaftarkan listener auth...");

        const handleProfileFetch = async (session) => {
            if (!session?.user) {
                console.log("DEBUG: Tidak ada sesi, user adalah Guest.");
                setDebugMessage("Sesi tidak ditemukan.");
                setCurrentUser(null);
                return;
            }

            try {
                const userId = session.user.id;
                console.log(`DEBUG: Sesi aktif untuk user ID: ${userId}. Mencoba mengambil profil...`);
                setDebugMessage(`Mengambil profil untuk user ${userId.substring(0, 8)}...`);

                const { data: profile, error: profileError, status } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                console.log(`DEBUG: Permintaan 'profiles' selesai. Status: ${status}`);

                if (profileError && status !== 406) {
                    // 406 artinya tidak ada baris, itu bukan error fatal jika RLS benar
                    console.error("FATAL: Gagal mengambil profil. Cek RLS & Koneksi.", { message: profileError.message, details: profileError.details, hint: profileError.hint });
                    setDebugMessage(`Error mengambil profil: ${profileError.message}`);
                    throw profileError;
                }

                if (!profile) {
                     console.warn("PERINGATAN: Profil tidak ditemukan di database untuk user ini. User akan tetap login tapi data kosong.");
                     setDebugMessage("Profil tidak ditemukan.");
                } else {
                     console.log("BERHASIL: Profil ditemukan.", profile);
                     setDebugMessage("Profil berhasil dimuat.");
                }

                const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
                setCurrentUser(appUser);

            } catch (error) {
                console.error("FATAL: Terjadi error di dalam handleProfileFetch.", error);
                setDebugMessage("Gagal total memproses profil.");
                setCurrentUser(null);
                await supabase.auth.signOut(); // Logout paksa jika profil gagal diambil
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log(`EVENT AUTH: Terdeteksi event '${_event}'. Sesi ada: ${!!session}`);
            setDebugMessage(`Event: ${_event}`);
            await handleProfileFetch(session);
        });

        const initializeAuth = async () => {
            try {
                console.log("DEBUG: Memulai inisialisasi auth...");
                setDebugMessage("Inisialisasi...");
                const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
                
                if (getSessionError) {
                    console.error("FATAL: Gagal menjalankan getSession()", getSessionError);
                    setDebugMessage("Error: Gagal getSession.");
                    throw getSessionError;
                }

                console.log(`DEBUG: getSession() selesai. Sesi awal ada: ${!!session}`);
                setDebugMessage("Mengecek sesi awal...");

                // Jika sudah ada sesi, onAuthStateChange sudah/akan berjalan.
                // Jika tidak ada, kita tunggu saja.
                if (!session) {
                    console.log("DEBUG: Tidak ada sesi awal. Menunggu login...");
                    setDebugMessage("Menunggu login...");
                }
            } catch (error) {
                console.error("FATAL: Gagal total saat inisialisasi.", error);
                setDebugMessage("Error: Inisialisasi gagal.");
            } finally {
                console.log("DEBUG: Proses inisialisasi selesai. Menghilangkan layar loading.");
                setDebugMessage("Selesai.");
                setLoadingInitialSession(false);
            }
        };

        initializeAuth();

        return () => {
            console.log("--- useEffect UTAMA DIBERSIHKAN ---");
            subscription?.unsubscribe();
        };
    }, []);

    // Sisa komponen tidak ada perubahan signifikan
    const { onLogout, onUpdateUser, userAirdrops, onOpenWalletModal } = {}; // Dummy props for now
    const userForHeader = currentUser || defaultGuestUserForApp;
    const showNav = !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login');
    const mainPaddingBottomClass = showNav ? 'pb-[var(--bottomnav-height)] md:pb-6' : 'pb-6';
    const scrollToTop = () => pageContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <div className="app-container font-sans h-screen flex flex-col overflow-hidden">
            {showNav && <Header title={headerTitle} currentUser={userForHeader} isHeaderVisible={isHeaderVisible} />}
            <main ref={pageContentRef} className={`flex-grow ${showNav ? 'pt-[var(--header-height)]' : ''} px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto custom-scrollbar`}>
                 <Routes>
                    <Route path="/" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
                    <Route path="/my-work" element={<PageMyWork currentUser={userForHeader} />} />
                    <Route path="/airdrops" element={<PageAirdrops currentUser={userForHeader} />} />
                    <Route path="/airdrops/:airdropSlug" element={<AirdropDetailPage currentUser={userForHeader} />} />
                    <Route path="/forum" element={<PageForum currentUser={userForHeader} />} />
                    <Route path="/events" element={<PageEvents currentUser={userForHeader} />} />
                    <Route path="/events/:eventSlug" element={<PageEventDetail currentUser={userForHeader} />} />
                    <Route path="/login" element={<PageLogin />} />
                    <Route path="/profile" element={<PageProfile currentUser={userForHeader} />} />
                    <Route path="*" element={<PageHome currentUser={userForHeader} navigate={navigate} />} />
                </Routes>
            </main>
            {showNav && <BottomNav currentUser={currentUser} />}
            <BackToTopButton show={showBackToTop} onClick={scrollToTop} />
            <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg transition-opacity duration-500 ${loadingInitialSession ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
                <span className="text-gray-800 dark:text-dark-text">Loading Session...</span>
                <span className="text-sm text-gray-500 mt-2 font-mono">DEBUG: {debugMessage}</span>
            </div>
        </div>
    );
}
