<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import AuthForm from "./AuthForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { toast } from 'sonner';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);
const SIGN_MESSAGE = "Selamat datang di AFA Web3Tool! Tanda tangani pesan ini untuk membuktikan kepemilikan wallet dan melanjutkan.";

export default function PageLogin({ currentUser }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // State untuk Email & Password Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // State untuk Loading & Error
  const [loading, setLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect jika sudah login
=======
// src/components/PageLogin.jsx
import React, { useEffect } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { toast } from 'sonner';

export default function PageLogin({ currentUser }) {
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();

  // Redirect otomatis jika sudah connect
>>>>>>> c9fc74edcabfd8c36137ce5cbe6858627309c518
  useEffect(() => {
    if (isConnected && address) {
      toast.success("Wallet berhasil terhubung!");
      // Beri sedikit delay agar user sadar sudah login
      const timer = setTimeout(() => {
         navigate("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, navigate]);

<<<<<<< HEAD
  // --- HANDLER: Login Email & Password ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success("Login berhasil!");
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Gagal login. Periksa email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Login Wallet (Connect + Sign) ---
  const handleWalletLogin = async () => {
    // 1. Buka Modal Wallet jika belum connect
    if (!isConnected) {
      try {
        await open();
      } catch (err) {
        console.error("Wallet modal error:", err);
        return;
      }
    } else {
      // 2. Jika sudah connect, lakukan Signature Login
      startWalletSignatureFlow();
    }
  };

  // Effect untuk mendeteksi koneksi wallet baru lalu otomatis memicu signature
  useEffect(() => {
    if (isConnected && address && !currentUser && !isWalletActionLoading) {
        // Opsional: Beri jeda sedikit atau trigger manual via tombol jika UX dirasa mengganggu
        // Di sini kita trigger manual via tombol di AuthForm, tapi jika user barusan connect via modal,
        // kita bisa panggil fungsi sign di sini atau biarkan user klik "Login with Wallet" lagi.
        // Agar konsisten dengan PageRegister, kita biarkan user klik tombol / handler mentrigger flow.
    }
  }, [isConnected, address, currentUser]);

  const startWalletSignatureFlow = async () => {
    if (!address) return;
    setError(null);
    setIsWalletActionLoading(true);
    
    try {
      // Minta tanda tangan user
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      
      // Kirim ke Edge Function untuk verifikasi dan login
      const { data: session, error: functionError } = await supabase.functions.invoke('login-with-wallet', { 
        body: { address, signature } 
      });

      if (functionError) throw new Error(functionError.message);
      if (session?.error) throw new Error(session.error);

      // Set session di client
      const { error: sessionError } = await supabase.auth.setSession(session);
      if (sessionError) throw sessionError;

      toast.success("Login wallet berhasil!");
      navigate('/');
    } catch (err) {
      console.error("Wallet login error:", err);
      setError(err.message || "Gagal login dengan wallet.");
      disconnect(); // Disconnect jika gagal agar bisa coba lagi
    } finally {
      setIsWalletActionLoading(false);
    }
  };

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6 min-h-screen flex flex-col justify-center items-center">
      <div className="w-full max-w-lg">
        <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-flex items-center self-start">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali ke Beranda
        </Link>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center border border-red-500/30">
            {error}
          </div>
        )}

        <AuthForm
          isLoginForm={true}
          onFormSubmit={handleLogin}
          onWalletLogin={handleWalletLogin} // Menggunakan handler logic yang lebih lengkap
          loading={loading}
          isWalletActionLoading={isWalletActionLoading}
          t={t}
          // Props untuk Login Form
          loginEmail={loginEmail} 
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword} 
          setLoginPassword={setLoginPassword}
          showPassword={showPassword} 
          setShowPassword={setShowPassword}
        />

        <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">
          {t.dontHaveAccount || "Belum punya akun?"}{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            {t.registerHere || "Daftar di sini"}
          </Link>
=======
  const handleConnect = async () => {
    try {
      // open() akan membuka modal. Jangan set loading state manual di sini 
      // karena kita tidak tahu kapan user menutup modal tanpa connect.
      await open(); 
    } catch (err) {
      console.error("Connection failed:", err);
      toast.error("Gagal membuka wallet modal");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 animate-fade-in-up">
      {/* Logo / Header Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
           <FontAwesomeIcon icon={faWallet} className="text-4xl text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Selamat Datang
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Hubungkan wallet Anda untuk mengakses dashboard, airdrop, dan fitur eksklusif AFA Web3Tool.
>>>>>>> c9fc74edcabfd8c36137ce5cbe6858627309c518
        </p>
      </div>

      {/* Action Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
        <button
          onClick={handleConnect}
          className="group w-full relative flex items-center justify-between px-6 py-4 bg-[#1a1b1f] hover:bg-[#2d2f36] text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faWallet} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">Connect Wallet</p>
              <p className="text-xs text-gray-400">Metamask, TrustWallet, dll</p>
            </div>
          </div>
          <FontAwesomeIcon 
            icon={faArrowRight} 
            className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" 
          />
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Dengan menghubungkan wallet, Anda menyetujui <br/>
            <span className="text-blue-500 cursor-pointer hover:underline">Syarat & Ketentuan</span> layanan kami.
          </p>
        </div>
      </div>
    </div>
  );
}