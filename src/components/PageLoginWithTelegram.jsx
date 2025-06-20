// src/components/PageLoginWithTelegram.jsx (Final Version with OTP Flow)

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faEnvelope, faLock, faUser, faUserPlus, faIdBadge, faEye, faEyeSlash, faKey } from '@fortawesome/free-solid-svg-icons';

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

export default function PageLoginWithTelegram() {
  const [view, setView] = useState('register');
  const [signupStage, setSignupStage] = useState('collectingDetails'); // collectingDetails, awaitingOtp
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [telegramUser, setTelegramUser] = useState(null);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialize = () => {
      if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
        setStatus('error');
        setError('This page can only be accessed through the Telegram Mini App.');
        return;
      }
      window.Telegram.WebApp.ready();
      
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (!tgUser?.id) {
        setStatus('error');
        setError('Failed to get user data from Telegram.');
        return;
      }
      setTelegramUser(tgUser);
      setUsername(tgUser.username || `user${tgUser.id}`);
      setStatus('ready');
    };

    initialize();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    if (signupStage === 'collectingDetails') {
        await handleRequestOtp();
    } else {
        await handleVerifyOtpAndLink();
    }
  };

  const handleRequestOtp = async () => {
    clearMessages();
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    setLoading(true);
    try {
        const { error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: { name: username, username: username, avatar_url: telegramUser.photo_url || `https://ui-avatars.com/api/?name=${username.substring(0,1).toUpperCase()}&background=7f5af0&color=fff` } }
        });

        if (signUpError) throw signUpError;
        
        setSuccessMessage(`A verification code has been sent to ${email}. Please check your email.`);
        setSignupStage('awaitingOtp');

    } catch(err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtpAndLink = async () => {
    clearMessages();
    setLoading(true);
    try {
        const { data: { session }, error: otpError } = await supabase.auth.verifyOtp({
            email: email,
            token: otpCode,
            type: 'signup'
        });

        if (otpError) throw otpError;
        if (!session?.user) throw new Error("Verification successful, but no session was found.");

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ telegram_user_id: telegramUser.id })
            .eq('id', session.user.id);
        
        if (updateError) throw updateError;
        
        alert("Registration and Telegram account linking successful!");
        navigate('/profile', { replace: true });

    } catch(err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };


  const handleLoginAndLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (signInError) throw signInError;
        if (!authData.user) throw new Error("Login succeeded but user data not found.");

        const { data: existingLink } = await supabase.from('profiles').select('telegram_user_id').eq('id', authData.user.id).single();
        if (existingLink && existingLink.telegram_user_id && existingLink.telegram_user_id !== telegramUser.id) {
             throw new Error("This email account is already linked to another Telegram account.");
        }
        
        const { error: updateError } = await supabase.from('profiles').update({ telegram_user_id: telegramUser.id }).eq('id', authData.user.id);
        if (updateError) throw updateError;
        
        alert("Login and Telegram account linking successful!");
        navigate('/profile', { replace: true });

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };
  
  const renderRegisterForm = () => {
      if (signupStage === 'awaitingOtp') {
          return (
            <div className="w-full max-w-md card p-8">
              <div className="text-center mb-6">
                <FontAwesomeIcon icon={faKey} className="text-6xl text-primary mb-4" />
                <h2 className="text-3xl font-bold">Verify Your Email</h2>
                <p className="text-light-subtle dark:text-gray-400 mt-2">{successMessage}</p>
              </div>
              {error && <p className="text-red-400 text-center mb-4">{error}</p>}
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <InputField id="otpCode" label="OTP Code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} icon={faKey} placeholder="Enter 6-digit code" parentLoading={loading} />
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Verify & Complete'}
                </button>
              </form>
              <button onClick={() => setSignupStage('collectingDetails')} className="text-center w-full text-sm text-light-subtle dark:text-gray-400 hover:text-primary disabled:opacity-50 mt-4 bg-transparent border-none">
                Wrong email? Go back
              </button>
            </div>
          );
      }

      return (
        <div className="w-full max-w-md card p-8">
            <div className="text-center mb-6">
                <FontAwesomeIcon icon={faUserPlus} className="text-6xl text-primary mb-4" />
                <h2 className="text-3xl font-bold">Create New Account</h2>
                <p className="text-light-subtle dark:text-gray-400 mt-2">Register to automatically link your Telegram account.</p>
            </div>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <InputField id="regUsername" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} icon={faUser} placeholder="unique_username" parentLoading={loading} />
                <InputField id="regEmail" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} icon={faEnvelope} placeholder="email@example.com" parentLoading={loading} />
                <div className="relative">
                    <InputField id="regPassword" type={showPassword ? "text" : "password"} label="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={faLock} placeholder="Minimum 6 characters" parentLoading={loading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
                </div>
                <div className="relative">
                    <InputField id="regConfirmPassword" type={showConfirmPassword ? "text" : "password"} label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={faLock} placeholder="Repeat password" parentLoading={loading} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} /></button>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Register & Send OTP'}
                </button>
            </form>
            <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">
                Already have an account?{" "}
                <button onClick={() => setView('login')} className="font-semibold text-primary hover:underline bg-transparent border-none">Login here</button>
            </p>
        </div>
      );
  }
  
  const renderLoginOrRegister = () => {
    if (view === 'login') {
      return (
        <div className="w-full max-w-md card p-8">
          <div className="text-center mb-6">
            <FontAwesomeIcon icon={faIdBadge} className="text-6xl text-primary mb-4" />
            <h2 className="text-3xl font-bold">Welcome Back!</h2>
            <p className="text-light-subtle dark:text-gray-400 mt-2">Log in to link this Telegram account.</p>
          </div>
          {error && <p className="text-red-400 text-center mb-4">{error}</p>}
          <form onSubmit={handleLoginAndLink} className="space-y-4">
              <InputField id="loginEmail" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} icon={faEnvelope} placeholder="email@example.com" parentLoading={loading} />
              <div className="relative">
                  <InputField id="loginPassword" type={showPassword ? "text" : "password"} label="Password" value={password} onChange={(e) => setPassword(e.target.value)} icon={faLock} parentLoading={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-light-subtle dark:text-gray-400 hover:text-primary top-6" disabled={loading}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Login & Link'}
              </button>
          </form>
          <p className="text-center text-sm text-light-subtle dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <button onClick={() => setView('register')} className="font-semibold text-primary hover:underline bg-transparent border-none">Register here</button>
          </p>
        </div>
      );
    }
    return renderRegisterForm();
  };

  return (
    <div className="page-content flex flex-col items-center justify-center p-4 min-h-screen">
      {status === 'initializing' && <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary" />}
      {status === 'error' && (
          <div className="text-center text-red-400 p-4 card max-w-sm">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4" />
            <p>{error}</p>
          </div>
      )}
      {status === 'ready' && renderLoginOrRegister()}
    </div>
  );
}
