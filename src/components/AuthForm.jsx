// src/components/AuthForm.jsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIdBadge, faUserPlus, faEnvelope, faLock, faUser,
  faEye, faEyeSlash, faSpinner, faSignInAlt, faKey, faWallet
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons'; // Tetap impor ikon

// Komponen InputField tidak berubah...
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

export default function AuthForm({
  isLoginForm,
  onFormSubmit,
  onWalletLogin,
  loading,
  isWalletActionLoading,
  t,
  loginEmail, setLoginEmail,
  loginPassword, setLoginPassword,
  signupStage,
  signupUsername, setSignupUsername,
  signupEmail, setSignupEmail,
  signupPassword, setSignupPassword,
  signupConfirmPassword, setSignupConfirmPassword,
  otpCode, setOtpCode,
  handleBackToDetails,
  showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword,
  // --- [PERUBAHAN] Ganti prop untuk Telegram ---
  onTelegramBotLogin, // Prop baru untuk tombol kustom
  isTelegramLoading,
}) {
  return (
    <div className="card rounded-xl p-6 md:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <FontAwesomeIcon icon={isLoginForm ? faIdBadge : faUserPlus} className="text-6xl text-primary mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">{isLoginForm ? t.welcomeBack : t.createAccount}</h2>
        <p className="text-light-subtle dark:text-gray-400 mt-2">{isLoginForm ? t.loginPrompt : (signupStage === 'collectingDetails' ? t.signupPromptDetails : t.signupPromptVerify)}</p>
      </div>
      {/* ... Form untuk login/register tidak berubah ... */}
      {isLoginForm ? (
         <form onSubmit={onFormSubmit} className="space-y-4">
            <InputField id="loginEmail" type="email" label={t.formLabelEmail} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} icon={faEnvelope} placeholder={t.formPlaceholderEmail} parentLoading={loading} />
            <div className="relative">
                <InputField id="loginPassword" type={showPassword ? "text" : "password"} label={t.formLabelPassword} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderPasswordLogin} parentLoading={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6 disabled:opacity-50" disabled={loading}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">
                {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />} {t.loginBtn}
            </button>
         </form>
      ) : ( /* ... Form register ... */ )}

      <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
          <span className="flex-shrink mx-4 text-light-subtle dark:text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
      </div>

      <button
        onClick={onWalletLogin}
        disabled={isWalletActionLoading}
        className="bg-transparent border-2 border-primary text-primary font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-70"
      >
        {isWalletActionLoading ? (<FontAwesomeIcon icon={faSpinner} spin className="mr-2" />) : (<FontAwesomeIcon icon={faWallet} className="mr-2" />)}
        {t.loginWithWallet || "Login with Wallet"}
      </button>

      {/* --- [PERUBAHAN UTAMA] --- */}
      {/* Ganti TelegramLoginWidget dengan button biasa */}
      <button
        type="button"
        onClick={onTelegramBotLogin}
        disabled={isTelegramLoading}
        className="mt-4 w-full flex items-center justify-center gap-3 bg-[#37AEE2] text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-[#2a8bb7] transition-colors disabled:opacity-70"
      >
        {isTelegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTelegram} />}
        Masuk dengan Telegram
      </button>
    </div>
  );
}
