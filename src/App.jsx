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

// ... Kode lainnya seperti sebelumnya (user default, pemetaan profil, state dan ref utama)

useEffect(() => {
  setLoadingInitialSession(true);
  console.log("[Auth] Memulai pengecekan sesi...");

  const handleSessionUpdate = async (session) => {
    if (session?.user) {
      console.log("[Auth] Sesi ditemukan. Mengambil profil untuk user:", session.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const appUser = mapSupabaseDataToAppUserForApp(session.user, profile);
      setCurrentUser(appUser);
      console.log("[Auth] Profil dimuat, user di-set:", appUser.username);
    } else {
      console.log("[Auth] Tidak ada sesi aktif, user adalah Guest.");
      setCurrentUser(null);
    }
    setLoadingInitialSession(false);
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    console.log(`[Auth] Event terdeteksi: ${_event}`);
    handleSessionUpdate(session);
  });

  const authInTelegram = async () => {
    console.log("[Auth] Memulai authInTelegram...");
    window.Telegram.WebApp.ready();

    try {
      const initData = window.Telegram.WebApp.initData;
      console.log("[Debug] initData:", initData);

      if (!initData) {
        console.error("[Auth] initData tidak tersedia, tidak bisa autentikasi.");
        setCurrentUser(null);
        setLoadingInitialSession(false);
        return;
      }

      console.log("[Auth] Kirim initData ke Supabase Function...");
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error.message);
      }

      console.log("[Auth] Berhasil dapat token dari function, setSession ke Supabase...");
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

    } catch (err) {
      console.error("[Auth] Gagal login via Telegram initData:", err.message);
      setCurrentUser(null);
      setLoadingInitialSession(false);
    }
  };

  if (window.Telegram?.WebApp?.initData) {
    authInTelegram();
  } else {
    console.log("[Auth] Lingkungan Non-Telegram, menjalankan getSession().");
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionUpdate(session);
    });
  }

  return () => {
    subscription?.unsubscribe();
  };
}, []);

// ... kode render React selengkapnya tetap sama (return App wrapper)

