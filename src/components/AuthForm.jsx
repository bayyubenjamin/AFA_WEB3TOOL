// src/components/AuthForm.jsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIdBadge, faUserPlus, faEnvelope, faLock, faUser,
  faEye, faEyeSlash, faSpinner, faSignInAlt, faKey, faWallet
} from '@fortawesome/free-solid-svg-icons';
import TelegramLoginWidget from './TelegramLoginWidget'; // Widget untuk web

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
  // Prop untuk widget Telegram
  onTelegramAuth,
  isTelegramLoading,
}) {
  return (
    <div className="card rounded-xl p-6 md:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <FontAwesomeIcon icon={isLoginForm ? faIdBadge : faUserPlus} className="text-6xl text-primary mb-4" />
        <h2 className="text-3xl md:text-4xl font-bold text-light-text dark:text-white">{isLoginForm ? t.welcomeBack : t.createAccount}</h2>
        <p className="text-light-subtle dark:text-gray-400 mt-2">{isLoginForm ? t.loginPrompt : (signupStage === 'collectingDetails' ? t.signupPromptDetails : t.signupPromptVerify)}</p>
      </div>
      
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
      ) : (
        <>
          {signupStage === 'collectingDetails' ? (
            <form onSubmit={onFormSubmit} className="space-y-4">
              <InputField id="signupUsername" label={t.formLabelUsername} value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} icon={faUser} placeholder={t.formPlaceholderUsername} parentLoading={loading} />
              <InputField id="signupEmail" type="email" label={t.formLabelEmail} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} icon={faEnvelope} placeholder={t.formPlaceholderEmail} parentLoading={loading} />
              <div className="relative">
                <InputField id="signupPassword" type={showPassword ? "text" : "password"} label={t.formLabelPassword} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderPasswordSignup} parentLoading={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
              </div>
              <div className="relative">
                <InputField id="signupConfirmPassword" type={showConfirmPassword ? "text" : "password"} label={t.formLabelConfirmPassword} value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} icon={faLock} placeholder={t.formPlaceholderConfirmPassword} parentLoading={loading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} /></button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center disabled:opacity-70">{loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faUserPlus} className="mr-2" />} {t.signupBtn}</button>
            </form>
          ) : (
            <form onSubmit={onFormSubmit} className="space-y-4">
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
        onClick={onWalletLogin}
        disabled={isWalletActionLoading}
        className="bg-transparent border-2 border-primary text-primary font-semibold py-3 px-8 rounded-lg text-lg w-full flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-70"
      >
        {isWalletActionLoading ? (<FontAwesomeIcon icon={faSpinner} spin className="mr-2" />) : (<FontAwesomeIcon icon={faWallet} className="mr-2" />)}
        {t.loginWithWallet || "Login with Wallet"}
      </button>

      <div className="mt-4 flex justify-center">
        <TelegramLoginWidget onTelegramAuth={onTelegramAuth} loading={isTelegramLoading} />
      </div>
    </div>
  );
}
