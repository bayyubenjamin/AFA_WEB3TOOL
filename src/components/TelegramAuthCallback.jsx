// src/components/TelegramAuthCallback.jsx

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';

export default function TelegramAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('Token login tidak ditemukan.');
        setStatus('error');
        return;
      }

      try {
        const { data: sessionData, error: functionError } = await supabase.functions.invoke('verify-telegram-login', {
          body: { token },
        });

        if (functionError) throw functionError;
        if (sessionData.error) throw new Error(sessionData.error);

        const { error: sessionError } = await supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
        });
        
        if (sessionError) throw sessionError;

        // ===== [PERUBAHAN 3] Hapus penanda saat login berhasil =====
        sessionStorage.removeItem('explicitlyLoggedOut');

        setStatus('success');
        // Redirect ke halaman beranda setelah beberapa saat
        setTimeout(() => navigate('/'), 1500);

      } catch (err) {
        setError(err.message || 'Verifikasi gagal. Token mungkin sudah kedaluwarsa.');
        setStatus('error');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="page-content flex items-center justify-center text-center h-full">
      <div className="card max-w-sm p-8 space-y-4">
        {status === 'verifying' && (
          <>
            <h2 className="text-2xl font-bold">Memverifikasi...</h2>
            <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-primary my-4" />
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold text-green-400">Login Berhasil!</h2>
            <FontAwesomeIcon icon={faCheckCircle} size="3x" className="text-green-400 my-4" />
            <p className="text-light-subtle dark:text-gray-400">Anda akan diarahkan...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-400">Login Gagal</h2>
            <FontAwesomeIcon icon={faTimesCircle} size="3x" className="text-red-400 my-4" />
            <p className="text-light-subtle dark:text-gray-400 text-sm">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
