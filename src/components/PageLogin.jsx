import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import AuthForm from './AuthForm';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

export default function PageLogin({ currentUser, onOpenWalletModal }) { 
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  // State untuk Telegram dihapus
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      
      sessionStorage.removeItem('explicitlyLoggedOut');

      setSuccessMessage(t.loginSuccess || "Login berhasil!");
      navigate('/');
    } catch (err) {
      setError(err.message || "Gagal login.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleWalletLogin = async () => {
    if (!address || !chainId) {
        setError("Wallet tidak terhubung atau chainId tidak ditemukan.");
        return;
    }
    clearMessages();
    setIsWalletActionLoading(true);

    try {
        const messageToSign = `Logging in with wallet: ${address}`;
        const signature = await signMessageAsync({ message: messageToSign });
        
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
            'login-with-wallet',
            {
                body: {
                    address,
                    signature,
                    chainId: `0x${chainId.toString(16)}`
                }
            }
        );

        if (functionError) throw new Error(functionError.message);
        if (functionData.error) throw new Error(functionData.error);

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: functionData.access_token,
          refresh_token: functionData.refresh_token
        });
        
        if (sessionError) throw sessionError;

        sessionStorage.removeItem('explicitlyLoggedOut');
        setSuccessMessage("Berhasil login dengan wallet!");
        navigate('/');

    } catch (err) {
        console.error("Wallet login error:", err);
        setError(err.message || "Gagal login dengan wallet.");
        disconnect();
    } finally {
        setIsWalletActionLoading(false);
    }
  };

  // Fungsi handleTelegramAuth dihapus

  useEffect(() => {
      if (isConnected && address && !isWalletActionLoading) {
          handleWalletLogin();
      }
  }, [isConnected, address]);

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
       <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-flex items-center">
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Kembali ke Beranda
      </Link>

       {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
       {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}

      <div className="max-w-lg mx-auto">
        <AuthForm
          isLoginForm={true}
          onFormSubmit={handleLogin}
          onWalletLogin={onOpenWalletModal} 
          loading={loading}
          isWalletActionLoading={isWalletActionLoading}
          t={t}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          // Prop untuk Telegram dihapus dari AuthForm
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
