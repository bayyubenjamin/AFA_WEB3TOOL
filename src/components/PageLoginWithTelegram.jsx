// src/components/PageLoginWithTelegram.jsx

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPaperPlane, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

export default function PageLoginWithTelegram() {
  const [status, setStatus] = useState('loading'); // loading, waiting, error, initializing
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    let attempts = 0;
    const maxAttempts = 20; // Coba 20 kali
    const intervalTime = 200; // Setiap 200ms

    const checkTelegramWebApp = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        console.log('Telegram.WebApp is ready!');
        clearTimeout(timer);
        initiateLogin();
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log('Waiting for Telegram.WebApp...', attempts);
          timer = setTimeout(checkTelegramWebApp, intervalTime);
        } else {
          setError('Telegram Mini App environment not detected or failed to initialize within time.');
          setStatus('error');
        }
      }
    };

    const initiateLogin = async () => {
      try {
        const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;

        if (!telegramUser?.id) {
          throw new Error('Tidak dapat mendeteksi ID pengguna Telegram.');
        }

        setStatus('loading');
        // Panggil edge function untuk mengirim pesan ke bot
        const { error: functionError } = await supabase.functions.invoke('request-telegram-login', {
          body: { telegram_id: telegramUser.id },
        });

        if (functionError) throw functionError;

        setStatus('waiting');
      } catch (err) {
        setError(err.message || 'Gagal memulai proses login.');
        setStatus('error');
      }
    };

    // Mulai pengecekan
    setStatus('initializing'); // Status baru untuk menunjukkan sedang menunggu inisialisasi
    checkTelegramWebApp();

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="page-content flex items-center justify-center text-center h-full">
      <div className="card max-w-sm p-8 space-y-4">
        <FontAwesomeIcon icon={faTelegram} className="text-6xl text-sky-400" />
        {(status === 'loading' || status === 'initializing') && ( // Tambahkan initializing di sini
          <>
            <h2 className="text-2xl font-bold">Mempersiapkan Login...</h2>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">Harap tunggu sebentar.</p>
          </>
        )}
        {status === 'waiting' && (
          <>
            <h2 className="text-2xl font-bold">Cek Telegram Anda!</h2>
            <FontAwesomeIcon icon={faPaperPlane} size="2x" className="text-primary" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">
              Kami telah mengirimkan tombol login ke bot <span className="font-bold">@afaweb3tool_bot</span>. Silakan buka chat tersebut untuk melanjutkan.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-400">Terjadi Kesalahan</h2>
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-red-400" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">{error}</p>
            {/* Opsi untuk mencoba lagi jika error */}
            <button onClick={() => window.location.reload()} className="btn-primary mt-4">
              Coba Lagi
            </button>
          </>
        )}
      </div>
    </div>
  );
}
