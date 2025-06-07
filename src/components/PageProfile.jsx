// src/components/PageProfile.jsx - VERSI FINAL LENGKAP + TRANSLATIONS
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignInAlt, faSignOutAlt, faEdit, faIdBadge, faRobot, faUserPlus,
  faEnvelope, faLock, faUser, faTimes, faSave, faEye, faEyeSlash, faImage, faSpinner, faKey
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext"; // Import useLanguage
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
    return lang === 'id' ? translationsId : translationsEn;
};

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

const InputField = React.memo(({
  id, type = "text", label, value, onChange, icon, placeholder, children, parentLoading, language
}) => {
  const t = getTranslations(language).pageProfile;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1"> {label} </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={icon} className="text-gray-400" />
        </div>
        <input
          disabled={parentLoading}
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-white/5 border border-white/20 text-gray-200 py-2.5 px-3 rounded-md pl-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all disabled:opacity-50"
        />
        {children}
      </div>
    </div>
  );
});
InputField.displayName = 'InputField';

export default function PageProfile({ currentUser, onUpdateUser, userAirdrops = [], navigateTo }) {
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage; // Menggunakan .profilePage yang benar dari JSON
  // const commonT = getTranslations(language).common; // Baris ini dihapus karena 'common' tidak ada di root JSON

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
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setEditName(currentUser.name || currentUser.username || "");
      setEditAvatarUrl(currentUser.avatar_url || "");
    }
  }, [currentUser, isLoggedIn]);

  const clearMessages = useCallback(() => {
    setError(null); setSuccessMessage(null);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (signInError) throw signInError;
      setSuccessMessage(t.loginSuccess || "Login berhasil!");
    } catch (err) {
      setError(err.message || (t.loginError || "Gagal login.")); // Menggunakan t.loginError
    } finally { setLoading(false); }
  };

  const handleSignupRequestOtp = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    if (!signupUsername || !signupEmail || !signupPassword) { setError(t.signupUsernameEmailPasswordRequired || "Username, Email, dan Password harus diisi!"); setLoading(false); return; } // Menggunakan t.signupUsernameEmailPasswordRequired
    if (signupPassword !== signupConfirmPassword) { setError(t.signupPasswordMismatch || "Password tidak cocok!"); setLoading(false); return; } // Menggunakan t.signupPasswordMismatch
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: signupEmail,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setSuccessMessage((t.otpSent || `Kode OTP telah dikirim ke`) + ` ${signupEmail}.`); // Menggunakan t.otpSent
      setSignupStage('awaitingOtp');
    } catch (err) { setError(err.message || (t.sendOtpFailed || "Gagal mengirim OTP.")); } // Menggunakan t.sendOtpFailed
    finally { setLoading(false); }
  };

  const handleVerifyOtpAndCompleteSignup = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    if (!otpCode) { setError(t.otpRequired || "Kode OTP harus diisi!"); setLoading(false); return; } // Menggunakan t.otpRequired
    try {
      const { data: { session }, error: otpError } = await supabase.auth.verifyOtp({
        email: signupEmail, token: otpCode, type: 'signup',
      });
      if (otpError) throw otpError;
      if (!session?.user) throw new Error(t.sessionNotFound || "Sesi tidak ditemukan setelah verifikasi OTP."); // Menggunakan t.sessionNotFound

      const defaultAvatar = `https://placehold.co/100x100/7f5af0/FFFFFF?text=${signupUsername.substring(0,1).toUpperCase()}`;

      const { data: { user: updatedUser }, error: updateUserError } = await supabase.auth.updateUser({
        password: signupPassword,
        data: { username: signupUsername, name: signupUsername, avatar_url: defaultAvatar }
      });
      if (updateUserError) throw updateUserError;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: session.user.id, email: session.user.email,
        username: signupUsername, name: signupUsername, avatar_url: defaultAvatar
      });
      if (profileError && profileError.code !== '23505') throw profileError;

      setSuccessMessage(t.signupSuccess || "Pendaftaran berhasil! Anda akan login secara otomatis."); // Menggunakan t.signupSuccess
    } catch (err) {
      setError(err.message || (t.verifyOtpFailed || "Verifikasi OTP atau pembuatan profil gagal.")); // Menggunakan t.verifyOtpFailed
    } finally { setLoading(false); }
  };

  const handleBackToDetails = () => {
    setSignupStage('collectingDetails'); clearMessages(); setOtpCode('');
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    if (onUpdateUser) onUpdateUser(defaultGuestUserFromProfile);
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    try {
      const profileUpdate = { name: editName, username: editName, avatar_url: editAvatarUrl, updated_at: new Date() };
      const { data, error: updateError } = await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id).select().single();
      if (updateError) throw updateError;
      if (onUpdateUser && data) {
          const authInfo = { ...currentUser, user_metadata: { ...currentUser.user_metadata, name: data.name, username: data.username, avatar_url: data.avatar_url } };
          onUpdateUser(mapSupabaseDataToAppUser(authInfo, data));
      }
      setSuccessMessage(t.profileUpdateSuccess || "Profil berhasil diperbarui!"); // Menggunakan t.profileUpdateSuccess
      setShowEditProfileModal(false);
    } catch (err) { setError(err.message || (t.profileUpdateError || "Gagal update profil.")); // Menggunakan t.profileUpdateError
    } finally { setLoading(false); }
  };

  const handleOpenEditProfileModal = () => { clearMessages(); setShowEditProfileModal(true); };
  const handleCloseEditProfileModal = () => setShowEditProfileModal(false);

  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;

  if (!currentUser) {
    // PERBAIKAN: Mengganti commonT.loadingApp dengan t.loadingApp
    return (<section className="page-content text-center pt-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/><p>{t.loadingApp}</p></section>); // Menggunakan t.loadingApp
  }

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{t.errorTitle || "Error"}</div>} {/* Menggunakan t.errorTitle */}
      {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{t.successTitle || "Sukses"}</div>} {/* Menggunakan t.successTitle */}

      {!isLoggedIn ? (
        <div className="max-w-lg mx-auto">
          <div className="card rounded-xl p-6 md:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <FontAwesomeIcon icon={isLoginForm ? faIdBadge : faUserPlus} className="text-6xl text-primary mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {isLoginForm ? (t.welcomeBack || "Selamat Datang Kembali!") : (t.createAccount || "Buat Akun Baru")}
              </h2>
              <p className="text-gray-400 mt-2">
                {isLoginForm ? (t.loginPrompt || "Login untuk melanjutkan.") : (signupStage === 'collectingDetails' ? (t.signupPromptDetails || "Isi data untuk mendaftar.") : (t.signupPromptVerify || "Verifikasi akun Anda."))}
              </p>
            </div>
            {isLoginForm ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField language={language} parentLoading={loading} id="loginEmail" type="email" label={t.formLabelEmail} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} icon={faEnvelope} placeholder={t.formPlaceholderEmail} />
                <div className="relative">
                    <InputField language={language} parentLoading={loading} id="loginPassword" type={showPassword ? "text" : "password"} label={t.formLabelPassword} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderPasswordLogin} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-primary top-6 disabled:opacity-50"><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />} {t.loginBtn}
                </button>
              </form>
            ) : (
              <>
                {signupStage === 'collectingDetails' ? (
                  <form onSubmit={handleSignupRequestOtp} className="space-y-4">
                    <InputField language={language} parentLoading={loading} id="signupUsername" label={t.formLabelUsername} value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} icon={faUser} placeholder={t.formPlaceholderUsername} />
                    <InputField language={language} parentLoading={loading} id="signupEmail" type="email" label={t.formLabelEmail} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} icon={faEnvelope} placeholder={t.formPlaceholderEmail} />
                    <div className="relative">
                        <InputField language={language} parentLoading={loading} id="signupPassword" type={showPassword ? "text" : "password"} label={t.formLabelPassword} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderPasswordSignup} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-primary top-6"><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
                    </div>
                    <div className="relative">
                        <InputField language={language} parentLoading={loading} id="signupConfirmPassword" type={showConfirmPassword ? "text" : "password"} label={t.formLabelConfirmPassword} value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderConfirmPassword} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-400 hover:text-primary top-6"><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} /></button>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">
                      {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faUserPlus} className="mr-2" />} {t.signupBtn}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpAndCompleteSignup} className="space-y-4">
                    <InputField language={language} parentLoading={loading} id="otpCode" type="text" label={t.otpRequired} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} icon={faKey} placeholder={t.otpRequired} /> {/* Placeholder juga bisa disesuaikan jika ada di JSON */}
                    <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">
                      {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faUserPlus} className="mr-2" />} {t.verifyBtn}
                    </button>
                    <button type="button" onClick={handleBackToDetails} disabled={loading} className="text-center w-full text-sm text-gray-400 hover:text-primary disabled:opacity-50">{t.backToDetails}</button>
                  </form>
                )}
              </>
            )}
            <p className="text-center text-sm text-gray-400 mt-6">
              {isLoginForm ? (t.noAccountYet) : (t.alreadyHaveAccount)}{" "} {/* Menggunakan t.noAccountYet dan t.alreadyHaveAccount */}
              <button disabled={loading} onClick={() => { setIsLoginForm(!isLoginForm); clearMessages(); setSignupStage('collectingDetails'); }} className="font-semibold text-primary hover:underline disabled:opacity-50">
                {isLoginForm ? (t.signupHere) : (t.loginHere)} {/* Menggunakan t.signupHere dan t.loginHere */}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="card rounded-xl p-6 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 md:gap-8">
              <div className="relative group">
                <img src={currentUser.avatar_url || defaultGuestUserFromProfile.avatar_url} alt={currentUser.name || currentUser.username || "Avatar"} className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/70 shadow-lg"/>
                <button onClick={handleOpenEditProfileModal} className="absolute inset-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t.editAvatar} disabled={loading}><FontAwesomeIcon icon={faEdit} /></button>
              </div>
              <div className="flex-grow">
                <h2 className="text-3xl md:text-4xl font-bold text-white break-words">{currentUser.name || currentUser.username}</h2>
                {currentUser.address && ( <p className="text-sm text-primary/80 font-mono break-all mt-1.5 flex items-center justify-center sm:justify-start"><FontAwesomeIcon icon={faIdBadge} className="mr-2 opacity-70"/>{currentUser.address.substring(0, 6)}...{currentUser.address.substring(currentUser.address.length - 4)}</p> )}
                {currentUser.email && ( <p className="text-sm text-gray-400 break-all mt-1 flex items-center justify-center sm:justify-start"><FontAwesomeIcon icon={faEnvelope} className="mr-2 opacity-70"/>{currentUser.email}</p> )}
                <div className="mt-4 space-x-3">
                    <button disabled={loading} onClick={handleOpenEditProfileModal} className="btn-secondary text-xs px-5 py-2 rounded-lg inline-flex items-center" ><FontAwesomeIcon icon={faEdit} className="mr-1.5"/> {t.editProfileModalTitle}</button> {/* Menggunakan t.editProfileModalTitle */}
                </div>
              </div>
            </div>
          </div>
          <div className="card rounded-xl p-6 md:p-8 shadow-xl">
            <h3 className="text-xl md:text-2xl font-semibold mb-5 text-primary border-b border-white/10 pb-3 flex items-center"><FontAwesomeIcon icon={faRobot} className="mr-2.5" /> {t.statsTitle}</h3> {/* Menggunakan t.statsTitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 text-sm">
              {[
                { label: t.statPoints, value: currentUser.stats?.points || 0 }, // Menggunakan t.statPoints
                { label: t.statAirdropsClaimed, value: currentUser.stats?.airdropsClaimed || 0 }, // Menggunakan t.statAirdropsClaimed
                { label: t.statNftsOwned, value: currentUser.stats?.nftsOwned || 0 }, // Menggunakan t.statNftsOwned
                { label: t.statActiveTasks, value: activeAirdropsCount } // Menggunakan t.statActiveTasks
              ].map(stat => (<div key={stat.label} className="bg-card hover:bg-primary/10 p-4 rounded-lg text-center border border-white/10"><p className="text-gray-400 text-xs uppercase tracking-wider mb-1.5">{stat.label}</p><p className="text-white font-bold text-3xl">{stat.value}</p></div>))}
            </div>
          </div>
          <div className="mt-6 md:mt-8">
            <button disabled={loading} onClick={handleLogout} className="w-full btn-danger bg-red-600/80 hover:bg-red-700/90 text-white font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center text-base">
              {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2.5" /> : <FontAwesomeIcon icon={faSignOutAlt} className="mr-2.5" />} {t.logoutBtn}
            </button>
          </div>
        </>
      )}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="modal-content card rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-white flex items-center"><FontAwesomeIcon icon={faEdit} className="mr-3 text-primary" /> {t.editProfileModalTitle}</h3>
              <button disabled={loading} onClick={handleCloseEditProfileModal} className="text-gray-400 hover:text-white text-2xl"><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            {error && <div className="p-3 mb-3 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{t.errorTitle}</div>} {/* Menggunakan t.errorTitle */}
            {successMessage && !error && <div className="p-3 mb-3 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{t.successTitle}</div>} {/* Menggunakan t.successTitle */}
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <InputField language={language} parentLoading={loading} id="editName" label={t.editProfileLabelName} value={editName} onChange={(e) => setEditName(e.target.value)} icon={faUser} />
              <InputField language={language} parentLoading={loading} id="editAvatarUrl" label={t.editProfileLabelAvatar} value={editAvatarUrl} onChange={(e) => setEditAvatarUrl(e.target.value)} icon={faImage} />
              <div className="flex justify-end gap-4 pt-4">
                <button disabled={loading} type="button" onClick={handleCloseEditProfileModal} className="btn-secondary px-6 py-2.5 rounded-lg text-sm">{t.editProfileBtnCancel}</button> {/* Menggunakan t.editProfileBtnCancel */}
                <button disabled={loading} type="submit" className="btn-primary text-white px-6 py-2.5 rounded-lg text-sm flex items-center">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />} {t.editProfileBtnSave} {/* Menggunakan t.editProfileBtnSave */}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
