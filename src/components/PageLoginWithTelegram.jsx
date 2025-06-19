// src/components/PageLoginWithTelegram.jsx (Versi Final yang Lebih Tangguh)

import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPaperPlane, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

export default function PageLoginWithTelegram() {
  const [status, setStatus] = useState('loading'); // loading, waiting, error
  const [error, setError] = useState('');

  const initiateLogin = useCallback(async () => {
    try {
      const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;

      if (!telegramUser?.id) {
        throw new Error('Tidak dapat mendeteksi ID pengguna Telegram. Coba muat ulang Mini App.');
      }

      const { error: functionError } = await supabase.functions.invoke('request-telegram-login', {
        body: { telegram_id: telegramUser.id },
      });

      if (functionError) throw functionError;

      setStatus('waiting');
    } catch (err) {
      setError(err.message || 'Gagal memulai proses login.');
      setStatus('error');
      console.error("Error during login initiation:", err);
    }
  }, []);

  useEffect(() => {
    const MAX_WAIT_TIME = 3000; // Tunggu maksimal 3 detik
    const CHECK_INTERVAL = 100; // Cek setiap 100ms
    let timeWaited = 0;

    // Fungsi untuk mencoba menginisialisasi
    const tryToInitialize = () => {
      // Cek apakah objek WebApp sudah tersedia
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        // Jika sudah ada, langsung panggil ready() dan jalankan login
        window.Telegram.WebApp.ready();
        initiateLogin();
      } else {
        // Jika belum ada, tunggu dan coba lagi
        timeWaited += CHECK_INTERVAL;
        if (timeWaited >= MAX_WAIT_TIME) {
          // Jika sudah menunggu terlalu lama, tampilkan error
          setError('Gagal menginisialisasi lingkungan Telegram Mini App dalam waktu yang ditentukan.');
          setStatus('error');
          console.error("Telegram WebApp environment failed to initialize within time.");
        } else {
          // Jadwalkan pengecekan berikutnya
          setTimeout(tryToInitialize, CHECK_INTERVAL);
        }
      }
    };

    // Mulai proses pengecekan
    tryToInitialize();
  }, [initiateLogin]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <h2 className="text-2xl font-bold">Mempersiapkan Login...</h2>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">Menginisialisasi Mini App...</p>
          </>
        );
      case 'waiting':
        return (
          <>
            <h2 className="text-2xl font-bold">Cek Telegram Anda!</h2>
            <FontAwesomeIcon icon={faPaperPlane} size="2x" className="text-primary" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">
              Kami telah mengirimkan tombol login ke bot <span className="font-bold">@afaweb3tool_bot</span>. Silakan buka chat tersebut untuk melanjutkan.
            </p>
          </>
        );
      case 'error':
        return (
          <>
            <h2 className="text-2xl font-bold text-red-400">Terjadi Kesalahan</h2>
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-red-400" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary mt-4">
              Coba Lagi
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-content flex items-center justify-center text-center h-full">
      <div className="card max-w-sm p-8 space-y-4">
        <FontAwesomeIcon icon={faTelegram} className="text-6xl text-sky-400" />
        {renderContent()}
      </div>
    </div>
  );
}
