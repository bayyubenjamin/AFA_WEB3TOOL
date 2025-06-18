// src/components/PageProfile.jsx (Versi Debug)

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faUser, faTimes, faSave, faImage, faSpinner,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
  faSignOutAlt, faSignInAlt, faClipboard
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function PageProfile({ currentUser, onUpdateUser, onLogout }) {
  
    // ================== DEBUGGING LOG ==================
    console.log("[PageProfile.jsx] Dirender dengan prop currentUser:", currentUser);
    // ===================================================

  const isLoggedIn = !!(currentUser && currentUser.id);

  const [telegramLinkState, setTelegramLinkState] = useState('idle');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  
  const handleGenerateCode = async () => {
    // ================== DEBUGGING LOG ==================
    console.log("[PageProfile.jsx] Tombol 'Mulai Proses Koneksi' diklik.");
    console.log("[PageProfile.jsx] Nilai currentUser saat ini:", currentUser);
    console.log("[PageProfile.jsx] Nilai currentUser.id:", currentUser?.id);
    // ===================================================

    const userId = currentUser?.id;
    if (typeof userId !== 'string' || userId.length === 0) {
        alert("Gagal: ID User tidak valid. Coba login ulang.");
        console.error("Aksi dibatalkan karena ID User tidak valid:", userId);
        return;
    }

    setTelegramLoading(true);
    setTelegramError('');
    const code = `AFA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                telegram_verification_code: code,
                telegram_code_expires_at: expiresAt
            })
            .eq('id', userId);

        if (error) throw error;

        setTelegramCode(code);
        setTelegramLinkState('awaiting_code');

    } catch (err) {
        console.error("Error saat generate kode:", err);
        setTelegramError(`Gagal membuat kode: ${err.message}`);
    } finally {
        setTelegramLoading(false);
    }
  };
  
  // Sisa fungsi lain (tidak perlu diubah)
  const handleCompleteLink = async () => { /* ... */ };
  const handleUnlinkTelegram = async () => { /* ... */ };
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text); };


  if (!isLoggedIn) {
    return (
      <div className="page-content flex items-center justify-center h-full">
        <p>Anda harus login untuk melihat halaman ini.</p>
      </div>
    );
  }

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
        <h3 className="text-xl font-semibold mb-2">My Profile</h3>
        <p>ID: {currentUser.id}</p>
        <p>Email: {currentUser.email}</p>
        <p>Telegram ID: {currentUser.telegram_id || 'Belum terhubung'}</p>
      </div>

      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Social Accounts</h3>
        <div className="p-4 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faTelegram} className="text-2xl text-[#2AABEE]" />
              <span>{currentUser.telegram_id ? `Terhubung sebagai @${currentUser.telegram_handle}` : 'Hubungkan Akun Telegram'}</span>
            </div>
            {currentUser.telegram_id && <button onClick={handleUnlinkTelegram} className="btn-secondary text-xs">Putuskan</button>}
          </div>

          {!currentUser.telegram_id && (
            <div className="mt-4 pt-4 border-t">
              {telegramLinkState === 'idle' && (
                <button onClick={handleGenerateCode} disabled={telegramLoading} className="btn-secondary w-full">
                  {telegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Mulai Proses Koneksi'}
                </button>
              )}
              {telegramLinkState === 'awaiting_code' && (
                <div className="text-center space-y-2">
                  <p>Kirim kode ini ke bot @afaweb3tool_bot:</p>
                  <code className="bg-dark p-2 rounded text-green-400 font-bold">{telegramCode}</code>
                  <button onClick={handleCompleteLink} disabled={telegramLoading} className="btn-primary w-full">
                    {telegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Selesaikan Koneksi'}
                  </button>
                </div>
              )}
            </div>
          )}
          {telegramError && <p className="text-red-400 text-xs mt-2">{telegramError}</p>}
        </div>
      </div>
    </section>
  );
}

// Dummy helper functions to avoid breaking the simplified component
const getTranslations = (lang) => ({ profilePage: {} });
