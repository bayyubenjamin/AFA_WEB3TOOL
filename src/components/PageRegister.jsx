// src/components/PageRegister.jsx
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

export default function PageRegister({ currentUser }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};

  const [signupStage, setSignupStage] = useState('collectingDetails');
  const [otpCode, setOtpCode] = useState('');
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupStage === 'collectingDetails') {
        await handleSignupRequestOtp();
    } else {
        await handleVerifyOtpAndCompleteSignup();
    }
  };
  
  const handleSignupRequestOtp = async () => {
    clearMessages();
    setLoading(true);
    if (!signupUsername || !signupEmail || !signupPassword) {
      setError(t.signupUsernameEmailPasswordRequired || "Username, Email, dan Password harus diisi!");
      setLoading(false);
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError(t.signupPasswordMismatch || "Password tidak cocok!");
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            name: signupUsername,
            username: signupUsername,
            avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=${signupUsername.substring(0,1).toUpperCase()}`
          }
        }
      });
      if (error) throw error;
      setSuccessMessage((t.otpSent?.replace('{email}', signupEmail)) || `Kode OTP telah dikirim ke ${signupEmail}.`);
      setSignupStage('awaitingOtp');
    } catch (err) {
      setError(err.message || "Gagal mengirim OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndCompleteSignup = async () => {
    clearMessages();
    setLoading(true);
    if (!otpCode) {
      setError(t.otpRequired || "Kode OTP harus diisi!");
      setLoading(false);
      return;
    }
    try {
      const { data: { session }, error: otpError } = await supabase.auth.verifyOtp({ email: signupEmail, token: otpCode, type: 'signup' });
      if (otpError) throw otpError;
      if (!session?.user) throw new Error(t.sessionNotFound || "Sesi tidak ditemukan setelah verifikasi OTP.");
      setSuccessMessage(t.signupSuccess || "Pendaftaran berhasil!");
      navigate('/profile');
    } catch (err) {
      setError(err.message || "Verifikasi OTP atau pembuatan profil gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setSignupStage('collectingDetails');
    clearMessages();
    setOtpCode('');
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
      navigate('/profile');
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
          isLoginForm={false}
          onFormSubmit={handleSignup}
          onWalletLogin={handleWalletLogin}
          loading={loading}
          isWalletActionLoading={isWalletActionLoading}
          t={t}
          signupStage={signupStage}
          signupUsername={signupUsername} setSignupUsername={setSignupUsername}
          signupEmail={signupEmail} setSignupEmail={setSignupEmail}
          signupPassword={signupPassword} setSignupPassword={setSignupPassword}
          signupConfirmPassword={signupConfirmPassword} setSignupConfirmPassword={setSignupConfirmPassword}
          otpCode={otpCode} setOtpCode={setOtpCode}
          handleBackToDetails={handleBackToDetails}
          showPassword={showPassword} setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
        />
         <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">
           {t.alreadyHaveAccount}{" "}
           <Link to="/login" className="font-semibold text-primary hover:underline">
             {t.loginHere}
           </Link>
         </p>
      </div>
    </section>
  );
}
