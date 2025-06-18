// src/components/PageLoginWithTelegram.jsx

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPaperPlane, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

export default function PageLoginWithTelegram() {
  const [status, setStatus] = useState('loading'); // loading, waiting, error
  const [error, setError] = useState('');

  useEffect(() => {
    const initiateLogin = async () => {
      // Pastikan kode ini hanya berjalan di lingkungan browser
      if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
        setError('Halaman ini hanya dapat diakses melalui Telegram Mini App.');
        setStatus('error');
        return;
      }

      try {
        // Ambil data pengguna dari Telegram Mini App
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

    initiateLogin();
  }, []);

  return (
    <div className="page-content flex items-center justify-center text-center h-full">
      <div className="card max-w-sm p-8 space-y-4">
        <FontAwesomeIcon icon={faTelegram} className="text-6xl text-sky-400" />
        {status === 'loading' && (
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
          </>
        )}
      </div>
    </div>
  );
}
