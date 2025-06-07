// src/App.jsx - VERSI FINAL DENGAN MANAJEMEN SESI SUPABASE + MAINTENANCE MODE
import React, { useState, useRef, useCallback, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import PageHome from "./components/PageHome";
import PageMyWork from "./components/PageMyWork";
import PageAirdrops from "./components/PageAirdrops";
import PageForum from "./components/PageForum";
import PageProfile from "./components/PageProfile";

import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const LS_CURRENT_USER_KEY = 'web3AirdropCurrentUser_final_v9';

const defaultGuestUserForApp = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=G`,
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
    user_metadata: authUser.user_metadata || {}
  };
};

export default function App() {
  // 💥 MAINTENANCE MODE
  if (process.env.REACT_APP_MAINTENANCE === 'true') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🚧 Maintenance Mode</h1>
          <p className="text-lg">Situs sedang diperbarui. Silakan kembali beberapa saat lagi ya!</p>
        </div>
      </div>
    );
  }

  const [currentPage, setCurrentPage] = useState("home");
  const [headerTitle, setHeaderTitle] = useState("AIRDROP FOR ALL");
  const [currentUser, setCurrentUser] = useState(null); 
  const [userAirdrops, setUserAirdrops] = useState([]); // Dikelola di PageMyWork sekarang
  const [loadingInitialSession, setLoadingInitialSession] = useState(true);
  const pageContentRef = useRef(null);

  useEffect(() => {
    setLoadingInitialSession(true);

    const handleAuthChange = async (session) => {
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
          localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(appUser));
        } else {
          setCurrentUser(defaultGuestUserForApp);
          localStorage.removeItem(LS_CURRENT_USER_KEY);
        }
      } catch (e) {
        console.error("CRITICAL ERROR di dalam onAuthStateChange callback:", e);
        setCurrentUser(defaultGuestUserForApp);
      } finally {
        setLoadingInitialSession(false);
      }
    };
    
    supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    // Cek sesi awal saat aplikasi pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoadingInitialSession(false); // Jika tidak ada sesi sama sekali, berhenti loading
        setCurrentUser(defaultGuestUserForApp);
      }
      // Jika ada sesi, onAuthStateChange akan menanganinya
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (pageContentRef.current) {
      const el = pageContentRef.current;
      el.classList.remove("content-enter-active", "content-enter");    
      void el.offsetWidth;                      
      el.classList.add("content-enter");       
      const timer = setTimeout(() => { if (el) el.classList.add("content-enter-active"); }, 50); 
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  const navigateTo = useCallback((pageId) => {
    setCurrentPage(pageId);
    const titles = { home: "AFA WEB3TOOL", myWork: "Garapanku", airdrops: "Daftar Airdrop", forum: "Forum Diskusi", profile: "Profil Saya" };
    setHeaderTitle(titles[pageId] || "AIRDROP FOR ALL");
    window.scrollTo(0, 0);
  }, []);

  const handleMintNft = () => { alert("Fungsi Mint NFT akan diimplementasikan!"); };

  const handleUpdateUserInApp = useCallback((updatedUserData) => {
    setCurrentUser(updatedUserData);
    try {
      localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(updatedUserData));
    } catch (e) { console.error("Error saving updated user to LS in App:", e); }
  }, []); 

  const mainPaddingBottomClass = currentPage === 'forum' ? 'pb-0' : 'pb-[var(--bottomnav-height)]';

  const renderPage = () => {
    if (loadingInitialSession) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white pt-10">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3 text-primary" />
          Memuat Aplikasi...
        </div>
      );
    }
    
    const userToPass = currentUser || defaultGuestUserForApp;

    switch (currentPage) {
      case "home": return <PageHome key="home" navigateTo={navigateTo} onMintNft={handleMintNft} />;
      case "myWork": return <PageMyWork key="mywork" currentUser={userToPass} />; // <-- KIRIM currentUser KE SINI
      case "airdrops": return <PageAirdrops key="airdrops" />; 
      case "forum": return <PageForum key="forum" currentUser={userToPass} />;
      case "profile": return <PageProfile key="profile" currentUser={userToPass} onUpdateUser={handleUpdateUserInApp} userAirdrops={userAirdrops} navigateTo={navigateTo} />;
      default: return <PageHome key="default-home" navigateTo={navigateTo} onMintNft={handleMintNft} />;
    }
  };

  const userForHeader = currentUser || defaultGuestUserForApp;

  return (
    <div className="bg-[#0a0a1a] text-white font-sans h-screen flex flex-col overflow-hidden">
      <Header title={headerTitle} currentUser={userForHeader} navigateTo={navigateTo} />
      <main 
        ref={pageContentRef} 
        className={`flex-grow pt-[var(--header-height)] px-4 content-enter space-y-6 transition-all ${mainPaddingBottomClass} overflow-y-auto`}
      >
        {renderPage()}
      </main>
      <BottomNav currentPage={currentPage} navigateTo={navigateTo} />
    </div>
  );
}