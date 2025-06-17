// src/components/PageProfile.jsx - VERSI DESAIN ULANG PREMIUM
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignInAlt, faSignOutAlt, faEdit, faIdBadge, faRobot, faUserPlus,
  faEnvelope, faLock, faUser, faTimes, faSave, faEye, faEyeSlash, faImage, faSpinner, faKey,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';

const getTranslations = (lang) => {
    return lang === 'id' ? translationsId : translationsEn;
};

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
    address: profileData?.web3_address || null,
    user_metadata: authUser.user_metadata || {}
  };
};

const InputField = React.memo(({ id, type = "text", label, value, onChange, icon, placeholder, children, parentLoading }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-light-subtle dark:text-gray-300 mb-1"> {label} </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={icon} className="text-light-subtle dark:text-gray-400" />
            </div>
            <input disabled={parentLoading} type={type} id={id} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" className="w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 text-light-text dark:text-gray-200 py-2.5 px-3 rounded-md pl-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all disabled:opacity-50" />
            {children}
        </div>
    </div>
));
InputField.displayName = 'InputField';

const StatCard = ({ icon, label, value }) => (
  // [REDESIGN] Tampilan kartu statistik dibuat lebih minimalis
  <div className="bg-light-bg dark:bg-dark p-5 rounded-xl border border-black/10 dark:border-white/10 transition-all">
    <FontAwesomeIcon icon={icon} className="text-primary text-xl mb-3" />
    <p className="text-2xl font-bold text-light-text dark:text-white">{value}</p>
    <p className="text-light-subtle dark:text-gray-400 text-xs uppercase tracking-wider">{label}</p>
  </div>
);

// [REDESIGN] Komponen ProfileHeader untuk menampilkan info utama pengguna
const ProfileHeader = ({ currentUser, onEditClick, onLogoutClick, loading, t }) => (
    <div className="card rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <img
            src={currentUser.avatar_url}
            alt="User Avatar"
            className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-primary/50 shadow-lg"
        />
        <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-light-text dark:text-white">{currentUser.name}</h2>
            <p className="text-md text-light-subtle dark:text-gray-400">@{currentUser.username}</p>
            {currentUser.email && <p className="text-sm text-primary mt-1 font-mono">{currentUser.email}</p>}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
            <button onClick={onEditClick} className="btn-secondary text-sm px-5 py-2 w-full md:w-auto flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faEdit} />
                {t.editProfileBtnSave || 'Edit Profile'}
            </button>
            <button onClick={onLogoutClick} disabled={loading} className="btn-danger text-sm px-5 py-2 w-full md:w-auto flex items-center justify-center gap-2">
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSignOutAlt} />}
                {t.logoutBtn || 'Logout'}
            </button>
        </div>
    </div>
);

export default function PageProfile({ currentUser, onUpdateUser, userAirdrops = [], navigateTo }) {
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};
  const isLoggedIn = !!(currentUser && currentUser.id);

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
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setEditName(currentUser.name || currentUser.username || "");
      setEditAvatarUrl(currentUser.avatar_url || "");
    }
  }, [currentUser, isLoggedIn]);

  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);

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
    } catch (err) {
      console.error("Wallet login error:", err);
      setError(err.message || "Gagal login dengan wallet.");
      disconnect();
    } finally {
      setIsWalletActionLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!address) { setError("Alamat wallet tidak ditemukan."); return; }
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const lowerCaseAddress = address.toLowerCase();
        const { data: existingProfile, error: checkError } = await supabase.from('profiles').select('id').eq('web3_address', lowerCaseAddress).single();
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingProfile) throw new Error("Alamat wallet ini sudah terhubung ke akun lain.");
        await signMessageAsync({ message: `Tautkan wallet ini ke akun AFA Anda: ${currentUser.email}` });
        const { data, error: updateError } = await supabase.from('profiles').update({ web3_address: lowerCaseAddress }).eq('id', currentUser.id).select().single();
        if (updateError) throw updateError;
        onUpdateUser(mapSupabaseDataToAppUser({ ...currentUser }, data));
        setSuccessMessage("Wallet berhasil ditautkan!");
        disconnect();
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
        const { data, error: updateError } = await supabase.from('profiles').update({ web3_address: null }).eq('id', currentUser.id).select().single();
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

  useEffect(() => { if (isConnected && address && !isLoggedIn && !loading) { handleWalletLogin(); } }, [isConnected, address, isLoggedIn, loading]);

  const handleLogin = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword }); if (error) throw error; setSuccessMessage(t.loginSuccess || "Login berhasil!"); } catch (err) { setError(err.message || "Gagal login."); } finally { setLoading(false); } };
  const handleSignupRequestOtp = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); if (!signupUsername || !signupEmail || !signupPassword) { setError(t.signupUsernameEmailPasswordRequired || "Username, Email, dan Password harus diisi!"); setLoading(false); return; } if (signupPassword !== signupConfirmPassword) { setError(t.signupPasswordMismatch || "Password tidak cocok!"); setLoading(false); return; } try { const { error } = await supabase.auth.signUp({ email: signupEmail, password: signupPassword, options: { data: { name: signupUsername, username: signupUsername, avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=${signupUsername.substring(0,1).toUpperCase()}` } } }); if (error) throw error; setSuccessMessage((t.otpSent?.replace('{email}', signupEmail)) || `Kode OTP telah dikirim ke ${signupEmail}.`); setSignupStage('awaitingOtp'); } catch (err) { setError(err.message || "Gagal mengirim OTP."); } finally { setLoading(false); } };
  const handleVerifyOtpAndCompleteSignup = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); if (!otpCode) { setError(t.otpRequired || "Kode OTP harus diisi!"); setLoading(false); return; } try { const { data: { session }, error: otpError } = await supabase.auth.verifyOtp({ email: signupEmail, token: otpCode, type: 'signup' }); if (otpError) throw otpError; if (!session?.user) throw new Error(t.sessionNotFound || "Sesi tidak ditemukan setelah verifikasi OTP."); setSuccessMessage(t.signupSuccess || "Pendaftaran berhasil!"); } catch (err) { setError(err.message || "Verifikasi OTP atau pembuatan profil gagal."); } finally { setLoading(false); } };
  const handleLogout = async () => { setLoading(true); await supabase.auth.signOut(); if (onUpdateUser) onUpdateUser(defaultGuestUserFromProfile); disconnect(); setLoading(false); };
  const handleUpdateProfile = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const profileUpdate = { name: editName, username: editName, avatar_url: editAvatarUrl, updated_at: new Date() }; const { data, error: updateError } = await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id).select().single(); if (updateError) throw updateError; onUpdateUser(mapSupabaseDataToAppUser(currentUser, data)); setSuccessMessage(t.profileUpdateSuccess || "Profil berhasil diperbarui!"); setShowEditProfileModal(false); } catch (err) { setError(err.message || "Gagal update profil."); } finally { setLoading(false); } };
  const handleOpenEditProfileModal = () => { clearMessages(); setShowEditProfileModal(true); };
  const handleCloseEditProfileModal = () => setShowEditProfileModal(false);
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => { setCopySuccess('Disalin!'); setTimeout(() => setCopySuccess(''), 2000); }, () => { setCopySuccess('Gagal'); }); };
  const handleBackToDetails = () => { setSignupStage('collectingDetails'); clearMessages(); setOtpCode(''); };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;

  if (currentUser === undefined) {
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
                <>
                {signupStage === 'collectingDetails' ? (
                  <form onSubmit={handleSignupRequestOtp} className="space-y-4">
                    <InputField id="signupUsername" label={t.formLabelUsername} value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} icon={faUser} placeholder={t.formPlaceholderUsername} parentLoading={loading} />
                    <InputField id="signupEmail" type="email" label={t.formLabelEmail} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} icon={faEnvelope} placeholder={t.formPlaceholderEmail} parentLoading={loading} />
                    <div className="relative"><InputField id="signupPassword" type={showPassword ? "text" : "password"} label={t.formLabelPassword} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderPasswordSignup} parentLoading={loading} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button></div>
                    <div className="relative"><InputField id="signupConfirmPassword" type={showConfirmPassword ? "text" : "password"} label={t.formLabelConfirmPassword} value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderConfirmPassword} parentLoading={loading} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} /></button></div>
                    <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">{loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faUserPlus} className="mr-2" />} {t.signupBtn}</button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndCompleteSignup} className="space-y-4">
                    <InputField id="otpCode" type="text" label={t.otpRequired} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} icon={faKey} placeholder={t.otpRequired} parentLoading={loading} />
                    <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">{loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faUserPlus} className="mr-2" />} {t.verifyBtn}</button>
                    <button type="button" onClick={handleBackToDetails} disabled={loading} className="text-center w-full text-sm text-light-subtle dark:text-gray-400 hover:text-primary disabled:opacity-50">{t.backToDetails}</button>
                  </form>
                )}
              </>
            )}

            <div className="relative my-6 flex items-center">
                <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
                <span className="flex-shrink mx-4 text-light-subtle dark:text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
            </div>

            <button
              onClick={handleWalletLogin}
              disabled={isWalletActionLoading}
              className="bg-transparent border-2 border-primary text-primary font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-70"
            >
              {isWalletActionLoading ? (<FontAwesomeIcon icon={faSpinner} spin className="mr-2" />) : (<FontAwesomeIcon icon={faWallet} className="mr-2" />)}
              {t.loginWithWallet || "Login with Wallet"}
            </button>
            <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">{isLoginForm ? t.noAccountYet : t.alreadyHaveAccount}{" "}<button disabled={loading} onClick={() => { setIsLoginForm(!isLoginForm); clearMessages(); setSignupStage('collectingDetails'); }} className="font-semibold text-primary hover:underline disabled:opacity-50">{isLoginForm ? t.signupHere : t.loginHere}</button></p>
          </div>
        </div>
      ) : (
        <>
          <ProfileHeader currentUser={currentUser} onEditClick={handleOpenEditProfileModal} onLogoutClick={handleLogout} loading={loading} t={t} />

          <div className="card rounded-xl p-6 md:p-8 shadow-xl">
             <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                 <FontAwesomeIcon icon={faWallet} className="mr-3 text-primary" />
                 {t.walletManagementTitle || "Wallet Management"}
             </h3>
             {currentUser.address ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-grow">
                        <p className="text-sm text-green-400 font-semibold">{t.walletConnected || "Wallet Connected"}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-lg font-mono text-light-text dark:text-white break-all">{`${currentUser.address.substring(0, 6)}...${currentUser.address.substring(currentUser.address.length - 4)}`}</p>
                           <button onClick={() => handleCopyToClipboard(currentUser.address)} title={copySuccess || 'Copy address'} className="text-light-subtle dark:text-gray-400 hover:text-primary transition-colors">
                              <FontAwesomeIcon icon={faCopy}/>
                           </button>
                        </div>
                    </div>
                    <button onClick={handleUnlinkWallet} disabled={isWalletActionLoading} className="btn-secondary bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-300 font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm gap-2">
                        {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />}
                        {t.unlinkWalletBtn || "Unlink Wallet"}
                    </button>
                </div>
             ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-light-subtle dark:text-gray-400">{t.walletNotLinked || "Your wallet is not linked."}</p>
                    <button onClick={() => connect({ connector: injected() })} disabled={isWalletActionLoading} className="btn-primary text-white font-semibold py-2 px-5 rounded-lg flex items-center justify-center text-sm gap-2">
                        {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faLink} />}
                        {t.linkWalletBtn || "Link Wallet"}
                    </button>
                </div>
             )}
              { isConnected && !currentUser.address &&
                <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-primary mb-2">Wallet connected: {`${address.substring(0,6)}...${address.substring(address.length - 4)}`}</p>
                    <button onClick={handleLinkWallet} disabled={isWalletActionLoading} className="btn-secondary w-full">
                        {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : `Confirm Link`}
                    </button>
                </div>
              }
          </div>
          
          <div className="card rounded-xl p-6 md:p-8 shadow-xl">
             <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center"><FontAwesomeIcon icon={faChartBar} className="mr-3 text-primary" /> {t.statsTitle}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              <StatCard label={t.statPoints} value={currentUser.stats?.points || 0} icon={faStar} />
              <StatCard label={t.statAirdropsClaimed} value={currentUser.stats?.airdropsClaimed || 0} icon={faClipboardCheck} />
              <StatCard label={t.statNftsOwned} value={currentUser.stats?.nftsOwned || 0} icon={faRobot} />
              <StatCard label={t.statActiveTasks} value={activeAirdropsCount} icon={faTasks} />
            </div>
          </div>
        </>
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="modal-content card rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-light-text dark:text-white flex items-center"><FontAwesomeIcon icon={faEdit} className="mr-3 text-primary" /> {t.editProfileModalTitle}</h3>
              <button disabled={loading} onClick={handleCloseEditProfileModal} className="text-light-subtle dark:text-gray-400 hover:text-light-text dark:hover:text-white text-2xl"><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            {error && <div className="p-3 mb-3 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
            {successMessage && !error && <div className="p-3 mb-3 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <InputField id="editName" label={t.editProfileLabelName} value={editName} onChange={(e) => setEditName(e.target.value)} icon={faUser} parentLoading={loading} />
              <InputField id="editAvatarUrl" label={t.editProfileLabelAvatar} value={editAvatarUrl} onChange={(e) => setEditAvatarUrl(e.target.value)} icon={faImage} parentLoading={loading} />
              <div className="flex justify-end gap-4 pt-4">
                <button disabled={loading} type="button" onClick={handleCloseEditProfileModal} className="btn-secondary px-6 py-2.5 rounded-lg text-sm">{t.editProfileBtnCancel}</button>
                <button disabled={loading} type="submit" className="btn-primary text-white px-6 py-2.5 rounded-lg text-sm flex items-center">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />} {t.editProfileBtnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
