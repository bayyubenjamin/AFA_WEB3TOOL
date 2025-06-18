// src/components/PageLogin.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';

import AuthForm from './AuthForm'; // Impor komponen form yang baru dibuat

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

const SIGN_MESSAGE = "Selamat datang di AFA Web3Tool! Tanda tangani pesan ini untuk membuktikan kepemilikan wallet dan melanjutkan.";

export default function PageLogin({ currentUser }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);

  // Jika sudah login, redirect ke profil
  useEffect(() => {
    if (currentUser && currentUser.id) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      setSuccessMessage(t.loginSuccess || "Login berhasil!");
      navigate('/profile'); // Redirect setelah berhasil login
    } catch (err) {
      setError(err.message || "Gagal login.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleWalletLogin = async () => {
    clearMessages();
    setIsWalletActionLoading(true);
    try {
      if (!isConnected) {
        connect({ connector: injected() });
        setIsWalletActionLoading(false);
        return;
      }
      const signature = await signMessageAsync({ message: SIGN_MESSAGE });
      const { data: session, error: functionError } = await supabase.functions.invoke('login-with-wallet', { body: { address, signature } });
      if (functionError) throw new Error(functionError.message);
      if (session.error) throw new Error(session.error);
      const { error: sessionError } = await supabase.auth.setSession(session);
      if (sessionError) throw sessionError;
      setSuccessMessage("Berhasil login dengan wallet!");
      navigate('/profile'); // Redirect setelah berhasil
    } catch (err) {
      console.error("Wallet login error:", err);
      setError(err.message || "Gagal login dengan wallet.");
      disconnect();
    } finally {
      setIsWalletActionLoading(false);
    }
  };

  useEffect(() => {
      if (isConnected && address && !(currentUser && currentUser.id) && !loading) {
          handleWalletLogin();
      }
  }, [isConnected, address, currentUser, loading]);


  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
       {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
       {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}

      <div className="max-w-lg mx-auto">
        <AuthForm
          isLoginForm={true}
          onFormSubmit={handleLogin}
          onWalletLogin={handleWalletLogin}
          loading={loading}
          isWalletActionLoading={isWalletActionLoading}
          t={t}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
         <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">
           {t.noAccountYet}{" "}
           <Link to="/register" className="font-semibold text-primary hover:underline">
             {t.signupHere}
           </Link>
         </p>
      </div>
    </section>
  );
}
