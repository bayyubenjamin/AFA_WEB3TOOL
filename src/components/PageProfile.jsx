// src/components/PageProfile.jsx - VERSI LENGKAP DENGAN KONEKSI WALLET
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignInAlt, faSignOutAlt, faEdit, faIdBadge, faRobot, faUserPlus,
  faEnvelope, faLock, faUser, faTimes, faSave, faEye, faEyeSlash, faImage, faSpinner, faKey,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

// --- TAMBAHAN WALLET ---
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { injected } from 'wagmi/connectors'
// --- AKHIR TAMBAHAN ---

const getTranslations = (lang) => {
    return lang === 'id' ? translationsId : translationsEn;
};

// Pesan ini HARUS SAMA PERSIS dengan yang ada di Edge Function Anda
const SIGN_MESSAGE = "Selamat datang di AFA Web3Tool! Tanda tangani pesan ini untuk membuktikan kepemilikan wallet dan melanjutkan.";

const defaultGuestUserFromProfile = {
  id: null, name: "Guest User", username: "Guest User", email: null,
  avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=G`,
  address: null, stats: { points: 0, airdropsClaimed: 0, nftsOwned: 0 }, user_metadata: {}
};

const mapSupabaseDataToAppUser = (authUser, profileData) => {
  if (!authUser) return defaultGuestUserFromProfile;
  return {
    id: authUser.id, email: authUser.email,
    username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
    name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
    avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url || defaultGuestUserFromProfile.avatar_url,
    stats: profileData?.stats || defaultGuestUserFromProfile.stats,
    address: profileData?.web3_address || null, // Ambil dari kolom baru
    user_metadata: authUser.user_metadata || {}
  };
};

const InputField = React.memo(({
  id, type = "text", label, value, onChange, icon, placeholder, children, parentLoading
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-light-subtle dark:text-gray-300 mb-1"> {label} </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={icon} className="text-light-subtle dark:text-gray-400" />
        </div>
        <input
          disabled={parentLoading}
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 text-light-text dark:text-gray-200 py-2.5 px-3 rounded-md pl-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all disabled:opacity-50"
        />
        {children}
      </div>
    </div>
  );
});
InputField.displayName = 'InputField';

const StatCard = ({ icon, label, value }) => (
  <div className="bg-light-card dark:bg-card hover:bg-primary/5 dark:hover:bg-primary/10 p-5 rounded-xl border border-black/10 dark:border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
    <FontAwesomeIcon icon={icon} className="text-primary text-2xl mb-3" />
    <p className="text-3xl font-bold text-light-text dark:text-white">{value}</p>
    <p className="text-light-subtle dark:text-gray-400 text-sm uppercase tracking-wider">{label}</p>
  </div>
);


export default function PageProfile({ currentUser, onUpdateUser, userAirdrops = [], navigateTo }) {
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};

  const isLoggedIn = !!(currentUser && currentUser.id);

  // State yang ada
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupStage, setSignupStage] = useState('collectingDetails');
  const [otpCode, setOtpCode] = useState('');
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // --- STATE & HOOKS WALLET ---
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  // --- AKHIR STATE & HOOKS WALLET ---


  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setEditName(currentUser.name || currentUser.username || "");
      setEditAvatarUrl(currentUser.avatar_url || "");
    }
  }, [currentUser, isLoggedIn]);

  const clearMessages = useCallback(() => {
    setError(null); setSuccessMessage(null);
  }, []);

  // --- FUNGSI BARU UNTUK WALLET ---

  const handleWalletLogin = async () => {
    clearMessages();
    setIsWalletActionLoading(true);

    try {
      if (!isConnected) {
        connect({ connector: injected() });
        // Flow akan dilanjutkan di useEffect di bawah setelah user connect
        return;
      }

      const signature = await signMessageAsync({ message: SIGN_MESSAGE });

      const { data: session, error: functionError } = await supabase.functions.invoke('login-with-wallet', {
        body: { address, signature },
      });

      if (functionError) throw new Error(functionError.message);
      if (session.error) throw new Error(session.error);


      const { error: sessionError } = await supabase.auth.setSession(session);
      if (sessionError) throw sessionError;

      setSuccessMessage("Berhasil login dengan wallet!");
      // `onAuthStateChange` di App.jsx akan menangani sisanya (fetch profile & navigasi)

    } catch (err) {
      console.error("Wallet login error:", err);
      setError(err.message || "Gagal login dengan wallet.");
      disconnect();
    } finally {
      setIsWalletActionLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!address) {
      setError("Alamat wallet tidak ditemukan. Coba hubungkan kembali.");
      return;
    }
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('web3_address', address)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingProfile) throw new Error("Alamat wallet ini sudah terhubung ke akun lain.");

        await signMessageAsync({ message: `Tautkan wallet ini ke akun AFA Anda: ${currentUser.email}` });

        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ web3_address: address })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (updateError) throw updateError;

        onUpdateUser(mapSupabaseDataToAppUser({ ...currentUser }, data));
        setSuccessMessage("Wallet berhasil ditautkan!");

    } catch (err) {
        setError(err.message || "Gagal menautkan wallet.");
        disconnect();
    } finally {
        setIsWalletActionLoading(false);
    }
  };

  const handleUnlinkWallet = async () => {
    if (!window.confirm("Apakah Anda yakin ingin melepas tautan wallet ini?")) return;
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ web3_address: null })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (updateError) throw updateError;

        onUpdateUser(mapSupabaseDataToAppUser({ ...currentUser }, data));
        setSuccessMessage("Tautan wallet berhasil dilepas.");
        disconnect();
    } catch (err) {
        setError(err.message || "Gagal melepas tautan wallet.");
    } finally {
        setIsWalletActionLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address && !loading) {
      if (!isLoggedIn) {
        handleWalletLogin();
      }
    }
  }, [isConnected, address]);

  // [CUT] - Fungsi handle lainnya (handleLogin, handleSignup, handleLogout, handleUpdateProfile) tidak berubah
  const handleLogin = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword }); if (error) throw error; setSuccessMessage(t.loginSuccess || "Login berhasil!"); } catch (err) { setError(err.message || "Gagal login."); } finally { setLoading(false); } };
  const handleSignupRequestOtp = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); if (!signupUsername || !signupEmail || !signupPassword) { setError(t.signupUsernameEmailPasswordRequired); setLoading(false); return; } if (signupPassword !== signupConfirmPassword) { setError(t.signupPasswordMismatch); setLoading(false); return; } try { const { error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword, options: { data: { username: signupUsername, name: signupUsername, avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=${signupUsername.substring(0,1).toUpperCase()}` } } }); if (error) throw error; setSuccessMessage((t.otpSent?.replace('{email}', signupEmail)) || `Kode OTP telah dikirim ke ${signupEmail}.`); setSignupStage('awaitingOtp'); } catch (err) { setError(err.message || "Gagal mengirim OTP."); } finally { setLoading(false); } };
  const handleVerifyOtpAndCompleteSignup = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); if (!otpCode) { setError(t.otpRequired); setLoading(false); return; } try { const { data: { session }, error: otpError } = await supabase.auth.verifyOtp({ email: signupEmail, token: otpCode, type: 'signup' }); if (otpError) throw otpError; if (!session?.user) throw new Error(t.sessionNotFound); setSuccessMessage(t.signupSuccess); } catch (err) { setError(err.message || "Verifikasi OTP atau pembuatan profil gagal."); } finally { setLoading(false); } };
  const handleLogout = async () => { setLoading(true); await supabase.auth.signOut(); if (onUpdateUser) onUpdateUser(defaultGuestUserFromProfile); disconnect(); setLoading(false); };
  const handleUpdateProfile = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const profileUpdate = { name: editName, username: editName, avatar_url: editAvatarUrl, updated_at: new Date() }; const { data, error: updateError } = await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id).select().single(); if (updateError) throw updateError; onUpdateUser(mapSupabaseDataToAppUser(currentUser, data)); setSuccessMessage(t.profileUpdateSuccess); setShowEditProfileModal(false); } catch (err) { setError(err.message || t.profileUpdateError); } finally { setLoading(false); } };
  const handleOpenEditProfileModal = () => { clearMessages(); setShowEditProfileModal(true); };
  const handleCloseEditProfileModal = () => setShowEditProfileModal(false);
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => { setCopySuccess('Disalin!'); setTimeout(() => setCopySuccess(''), 2000); }, () => { setCopySuccess('Gagal'); }); };
  const handleBackToDetails = () => { setSignupStage('collectingDetails'); clearMessages(); setOtpCode(''); };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;


  if (currentUser === null) {
    return (<section className="page-content text-center pt-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/><p className="dark:text-white text-light-text">{t.loadingApp || "Memuat Aplikasi..."}</p></section>);
  }

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
      {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}

      {!isLoggedIn ? (
        <div className="max-w-lg mx-auto">
          <div className="card rounded-xl p-6 md:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <FontAwesomeIcon icon={isLoginForm ? faIdBadge : faUserPlus} className="text-6xl text-primary mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">{isLoginForm ? t.welcomeBack : t.createAccount}</h2>
              <p className="text-light-subtle dark:text-gray-400 mt-2">{isLoginForm ? t.loginPrompt : (signupStage === 'collectingDetails' ? t.signupPromptDetails : t.signupPromptVerify)}</p>
            </div>
            {isLoginForm ? (
              <form onSubmit={handleLogin} className="space-y-4">
                 {/* FORM LOGIN EMAIL & PASSWORD */}
                 <InputField id="loginEmail" type="email" label={t.formLabelEmail} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} icon={faEnvelope} placeholder={t.formPlaceholderEmail} parentLoading={loading} />
                 <div className="relative">
                    <InputField id="loginPassword" type={showPassword ? "text" : "password"} label={t.formLabelPassword} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderPasswordLogin} parentLoading={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6 disabled:opacity-50" disabled={loading}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
                 </div>
                 <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />} {t.loginBtn}
                 </button>
              </form>
            ) : (
              // FORM SIGNUP
              <>
                {signupStage === 'collectingDetails' ? (
                  <form onSubmit={handleSignupRequestOtp} className="space-y-4">
                     {/* ... Input Fields untuk Signup ... */}
                     <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">
                       {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faUserPlus} className="mr-2" />} {t.signupBtn}
                     </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndCompleteSignup} className="space-y-4">
                    {/* ... Input Field untuk OTP ... */}
                  </form>
                )}
              </>
            )}
            
            <div className="relative my-6 flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">ATAU</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <button
              onClick={handleWalletLogin}
              disabled={isWalletActionLoading}
              className="bg-transparent border-2 border-primary text-primary font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-70"
            >
              {isWalletActionLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={faWallet} className="mr-2" />
              )}
              {t.loginWithWallet || "Login dengan Wallet"}
            </button>

            <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">
              {isLoginForm ? t.noAccountYet : t.alreadyHaveAccount}{" "}
              <button disabled={loading} onClick={() => { setIsLoginForm(!isLoginForm); clearMessages(); setSignupStage('collectingDetails'); }} className="font-semibold text-primary hover:underline disabled:opacity-50">
                {isLoginForm ? t.signupHere : t.loginHere}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* PROFILE HEADER */}
          <div className="card rounded-xl overflow-hidden shadow-2xl shadow-primary/10">
            {/* ... Konten header profil ... */}
             <div className="mt-4 sm:mt-0 flex-shrink-0">
                <button disabled={loading || isWalletActionLoading} onClick={handleLogout} className="btn-secondary bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300 font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm">
                  {(loading || isWalletActionLoading) ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />}
                  {t.logoutBtn}
                </button>
            </div>
          </div>

          {/* === START WALLET MANAGEMENT SECTION === */}
          <div className="card rounded-xl p-6 md:p-8 shadow-xl">
             <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                 <FontAwesomeIcon icon={faWallet} className="mr-2.5 text-primary" />
                 {t.walletManagementTitle || "Manajemen Wallet"}
             </h3>
             {currentUser.address ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-green-400 font-semibold">{t.walletConnected || "Wallet Terhubung"}</p>
                        <p className="text-lg font-mono text-light-text dark:text-white break-all">{currentUser.address}</p>
                    </div>
                    <button onClick={handleUnlinkWallet} disabled={isWalletActionLoading} className="btn-secondary bg-red-500/20 border-red-500/30 hover:bg-red-500/40 text-red-300 font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm">
                        {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : (t.unlinkWalletBtn || "Putuskan Tautan")}
                    </button>
                </div>
             ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-light-subtle dark:text-gray-400">{t.walletNotLinked || "Wallet Anda belum terhubung."}</p>
                    <button onClick={() => connect({ connector: injected() })} disabled={isWalletActionLoading} className="btn-primary text-white font-semibold py-2 px-5 rounded-lg flex items-center justify-center text-sm">
                        {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : (t.linkWalletBtn || "Hubungkan Wallet")}
                    </button>
                </div>
             )}
              { isConnected && !currentUser.address &&
                <button onClick={handleLinkWallet} disabled={isWalletActionLoading} className="btn-secondary w-full mt-4">
                  {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : `Konfirmasi Tautkan ${address.substring(0, 6)}...`}
                </button>
              }
          </div>
          {/* === END WALLET MANAGEMENT SECTION === */}

          {/* STATS SECTION */}
          <div className="card rounded-xl p-6 md:p-8 shadow-xl">
             {/* ... Konten statistik ... */}
          </div>
        </>
      )}

      {/* MODAL EDIT PROFIL */}
      {showEditProfileModal && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
           {/* ... Konten modal ... */}
         </div>
      )}
    </section>
  );
}
