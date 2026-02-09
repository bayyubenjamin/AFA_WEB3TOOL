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
  useEffect(() => {
    if (currentUser && currentUser.id) {
      navigate('/');
    }
  }, [currentUser, navigate]);

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
        </p>
      </div>
    </section>
  );
}
