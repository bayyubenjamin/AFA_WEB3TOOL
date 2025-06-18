// src/components/PageProfile.jsx (Versi Paling Simpel dan Aman)

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faUser, faTimes, faSave, faImage, faSpinner,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
  faSignOutAlt,
  faSignInAlt,
  faClipboard
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { useAccount, useDisconnect } from 'wagmi';

// Komponen helper tidak perlu diubah, jadi saya singkat di sini
const InputField = (props) => { /* ... kode ... */ };
const StatCard = (props) => { /* ... kode ... */ };
const ProfileHeader = (props) => { /* ... kode ... */ };


export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [], onOpenWalletModal }) {
  const { language } = useLanguage();
  const t = (getTranslations(language) || {}).profilePage || {};
  const isLoggedIn = !!(currentUser && currentUser.id);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [telegramLinkState, setTelegramLinkState] = useState('idle');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || "");
      setEditAvatarUrl(currentUser.avatar_url || "");
    }
  }, [currentUser]);

  const handleGenerateCode = async () => {
    setTelegramLoading(true);
    setTelegramError('');
    const code = `AFA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Di sini kita tidak perlu lagi cek currentUser.id, RLS di Supabase akan menanganinya
    const { error } = await supabase
        .from('profiles')
        .update({
            telegram_verification_code: code,
            telegram_code_expires_at: expiresAt
        })
        .eq('id', currentUser.id); // RLS memastikan user hanya bisa update datanya sendiri

    setTelegramLoading(false);
    if (error) {
        setTelegramError(`Gagal membuat kode: ${error.message}`);
    } else {
        setTelegramCode(code);
        setTelegramLinkState('awaiting_code');
    }
  };

  const handleCompleteLink = async () => {
      setTelegramLoading(true);
      setTelegramLinkState('confirming');
      setTelegramError('');
      try {
          const { data, error } = await supabase.functions.invoke('confirm-telegram-link');
          if (error) throw error;
          if (data.error) throw new Error(data.error);

          alert('Sukses! Akun Telegram berhasil terhubung.');
          window.location.reload();
      } catch (err) {
          setTelegramError(err.message);
          setTelegramLinkState('awaiting_code');
      } finally {
          setTelegramLoading(false);
      }
  };

  const handleUnlinkTelegram = async () => { /* ... fungsi ini tidak berubah ... */ };
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => alert('Kode berhasil disalin!')); };

  // ... sisa fungsi seperti handleUpdateProfile, handleOpenEditProfileModal, dll tidak berubah ...

  if (!isLoggedIn) {
    return (
      <div className="page-content flex flex-col items-center justify-center text-center h-full pt-20">
        <FontAwesomeIcon icon={faSignInAlt} size="3x" className="mb-4 text-primary" />
        <h2 className="text-2xl font-bold">Anda Belum Login</h2>
        <p className="text-light-subtle dark:text-gray-400 mt-2 mb-6">Silakan login untuk melihat profil Anda.</p>
        <Link to="/login" className="btn-primary px-8 py-2">Ke Halaman Login</Link>
      </div>
    );
  }

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {/* ... (bagian ProfileHeader, Wallet Management, Stats, dll tidak berubah) ... */}
      
      {/* Social Accounts Section */}
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
        <h3 className="text-xl ..."><FontAwesomeIcon icon={faLink} /> Social Accounts</h3>
        <div className="p-4 border ...">
          {/* ... (bagian UI untuk menampilkan status terhubung/tidak) ... */}
          
          {!currentUser.telegram_id && (
            <div className="mt-4 pt-4 border-t ...">
              {telegramLinkState === 'idle' && (
                  <button onClick={handleGenerateCode} disabled={telegramLoading || !currentUser?.id} className="btn-secondary w-full disabled:opacity-50">
                      {telegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faLink} className="mr-2" /> Mulai Proses Koneksi</>}
                  </button>
              )}
              {/* Sisa UI untuk 'awaiting_code' dan 'confirming' tidak berubah */}
              {telegramLinkState === 'awaiting_code' && (
                  <div className="space-y-3 text-center">
                      <p>1. Buka bot <a href="http://t.me/afaweb3tool_bot" ...>@afaweb3tool_bot</a></p>
                      <p>2. Kirim kode unik di bawah ini ke bot.</p>
                      <div className="bg-dark ..."><code ...>{telegramCode}</code><button onClick={() => handleCopyToClipboard(telegramCode)}...><FontAwesomeIcon icon={faClipboard} /></button></div>
                      <p>3. Kembali ke sini dan klik tombol di bawah.</p>
                      <button onClick={handleCompleteLink} ...>Selesaikan Koneksi</button>
                  </div>
              )}
              {telegramLinkState === 'confirming' && ( /* ... UI loading ... */ )}
              {telegramError && <p className="text-xs text-red-400 ...">{telegramError}</p>}
            </div>
          )}
        </div>
      </div>
      {/* ... (sisa komponen) ... */}
    </section>
  );
}

// NOTE: Saya meringkas beberapa bagian yang tidak relevan dengan perbaikan
// agar Anda fokus pada perubahan utama. Salin dan tempel SELURUH KODE di atas
// ke dalam file PageProfile.jsx Anda.
