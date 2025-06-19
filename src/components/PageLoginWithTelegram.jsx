// src/components/PageLoginWithTelegram.jsx (Versi Baru untuk Alur Terpadu)

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faEnvelope, faLock, faUserPlus, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import AuthForm from './AuthForm'; // Kita akan gunakan AuthForm lagi di sini

export default function PageLoginWithTelegram() {
  const [status, setStatus] = useState('initializing'); // initializing, login, register, error
  const [error, setError] = useState('');
  const [telegramUser, setTelegramUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      // Pastikan lingkungan Telegram siap
      if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
        setStatus('error');
        setError('Halaman ini hanya dapat diakses melalui Telegram Mini App.');
        return;
      }
      window.Telegram.WebApp.ready();
      
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (!tgUser?.id) {
        setStatus('error');
        setError('Gagal mendapatkan data pengguna dari Telegram.');
        return;
      }
      setTelegramUser(tgUser);

      // Cek apakah pengguna dengan ID Telegram ini sudah terdaftar di profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('telegram_user_id', tgUser.id)
        .single();
        
      if (profile) {
        // Jika profil ditemukan, artinya pengguna sudah menautkan akun.
        // Coba login otomatis (jika ada sesi) atau minta login.
        setStatus('login');
      } else {
        // Jika tidak ditemukan, arahkan ke registrasi.
        setStatus('register');
      }
    };

    initialize();
  }, []);

  // Handler untuk Registrasi
  const handleRegisterAndLink = async (formData) => {
    try {
        // 1. Daftar pengguna baru dengan email & password
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    name: formData.username,
                    username: formData.username,
                    avatar_url: telegramUser.photo_url || `https://ui-avatars.com/api/?name=${formData.username.substring(0,1).toUpperCase()}&background=7f5af0&color=fff`
                }
            }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Registrasi berhasil tetapi data pengguna tidak ditemukan.");

        // 2. Tautkan ID Telegram ke profil yang baru dibuat
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ telegram_user_id: telegramUser.id })
            .eq('id', authData.user.id);
        
        if (updateError) throw updateError;
        
        // 3. Login pengguna
        await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
        });

        alert("Registrasi dan penautan akun Telegram berhasil! Anda akan diarahkan ke profil.");
        navigate('/profile');

    } catch(err) {
        setError(err.message);
    }
  };

  // Handler untuk Login
  const handleLoginAndLink = async (formData) => {
    try {
        // 1. Coba login
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error("Login berhasil tetapi data pengguna tidak ditemukan.");

        // 2. Tautkan ID Telegram ke profil yang sudah ada
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ telegram_user_id: telegramUser.id })
            .eq('id', authData.user.id);
        
        if (updateError) throw updateError;
        
        alert("Login dan penautan akun Telegram berhasil!");
        navigate('/profile');

    } catch (err) {
        setError(err.message);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'initializing':
        return <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary" />;
      
      case 'error':
        return (
          <div className="text-center text-red-400">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-4" />
            <p>{error}</p>
          </div>
        );

      case 'login':
        return (
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <FontAwesomeIcon icon={faIdBadge} className="text-6xl text-primary mb-4" />
              <h2 className="text-3xl font-bold">Welcome Back!</h2>
              <p className="text-light-subtle dark:text-gray-400 mt-2">
                Kami mendeteksi akun Telegram Anda. Silakan login dengan email dan password untuk menautkan akun.
              </p>
            </div>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            {/* Menggunakan AuthForm untuk form login */}
            <AuthForm isLoginForm={true} onFormSubmit={(e, email, pass) => { e.preventDefault(); handleLoginAndLink({email, password: pass}); }} />
          </div>
        );
      
      case 'register':
        return (
          <div className="w-full max-w-md">
             <div className="text-center mb-6">
              <FontAwesomeIcon icon={faUserPlus} className="text-6xl text-primary mb-4" />
              <h2 className="text-3xl font-bold">Buat Akun Baru</h2>
              <p className="text-light-subtle dark:text-gray-400 mt-2">
                Daftar dengan email dan password untuk menautkan akun Telegram Anda secara otomatis.
              </p>
            </div>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
             {/* Menggunakan AuthForm untuk form registrasi, tapi dengan handler kustom */}
             <AuthForm isLoginForm={false} onFormSubmit={(e, username, email, pass) => { e.preventDefault(); handleRegisterAndLink({username, email, password: pass}); }} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-content flex flex-col items-center justify-center p-4 min-h-screen">
      {renderContent()}
    </div>
  );
}
