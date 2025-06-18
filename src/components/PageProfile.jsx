// src/components/PageProfile.jsx (Versi Final dengan Perbaikan Stabilitas)

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faUser, faTimes, faSave, faImage, faSpinner,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
  faSignOutAlt, faSignInAlt, faClipboard
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

import { useAccount, useDisconnect } from 'wagmi';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// --- KOMPONEN-KOMPONEN HELPER (TIDAK ADA PERUBAHAN) ---
const InputField = React.memo(({ id, type = "text", label, value, onChange, icon, placeholder, children, parentLoading }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-light-subtle dark:text-gray-300 mb-1"> {label} </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FontAwesomeIcon icon={icon} className="text-light-subtle dark:text-gray-400" /></div>
            <input disabled={parentLoading} type={type} id={id} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" className="w-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 text-light-text dark:text-gray-200 py-2.5 px-3 rounded-md pl-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all disabled:opacity-50" />
            {children}
        </div>
    </div>
));
InputField.displayName = 'InputField';

const StatCard = ({ icon, label, value }) => (
  <div className="bg-light-bg dark:bg-dark p-5 rounded-xl border border-black/10 dark:border-white/10 transition-all">
    <FontAwesomeIcon icon={icon} className="text-primary text-xl mb-3" />
    <p className="text-2xl font-bold text-light-text dark:text-white">{value}</p>
    <p className="text-light-subtle dark:text-gray-400 text-xs uppercase tracking-wider">{label}</p>
  </div>
);

const ProfileHeader = ({ currentUser, onEditClick, onLogoutClick, loading, t }) => (
    <div className="card rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <img src={currentUser.avatar_url} alt="User Avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-primary/50 shadow-lg"/>
        <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-light-text dark:text-white">{currentUser.name}</h2>
            <p className="text-md text-light-subtle dark:text-gray-400">@{currentUser.username}</p>
            {currentUser.email && <p className="text-sm text-primary mt-1 font-mono">{currentUser.email}</p>}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
            <button onClick={onEditClick} className="btn-secondary text-sm px-5 py-2 w-full md:w-auto flex items-center justify-center gap-2"><FontAwesomeIcon icon={faEdit} />{t.editProfileBtnSave || 'Edit Profile'}</button>
            <button onClick={onLogoutClick} disabled={loading} className="btn-danger text-sm px-5 py-2 w-full md:w-auto flex items-center justify-center gap-2">{loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSignOutAlt} />}{t.logoutBtn || 'Logout'}</button>
        </div>
    </div>
);


// --- KOMPONEN UTAMA ---
export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [], onOpenWalletModal }) {
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};
  
  // ======================= PERUBAHAN UTAMA 1: PENANGANAN STATE =======================
  // Kita buat state lokal untuk currentUser agar tidak bergantung sepenuhnya pada prop yang mungkin delay
  const [localUser, setLocalUser] = useState(currentUser);
  const isLoggedIn = !!(localUser && localUser.id);
  // ====================================================================================

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [telegramLinkState, setTelegramLinkState] = useState('idle');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Sinkronkan state lokal dengan prop ketika prop berubah
  useEffect(() => {
    setLocalUser(currentUser);
    if (currentUser?.id) {
      setEditName(currentUser.name || "");
      setEditAvatarUrl(currentUser.avatar_url || "");
    }
  }, [currentUser]);
  
  // Fungsi mapping data (tidak ada perubahan)
  const mapSupabaseDataToAppUser = (authUser, profileData) => { /* ... */ };
  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);
  const handleUnlinkWallet = async () => { /* ... */ };
  const handleUpdateProfile = async (e) => { /* ... */ };
  const handleOpenEditProfileModal = () => { /* ... */ };
  const handleCloseEditProfileModal = () => { /* ... */ };
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => { alert('Kode berhasil disalin!') }, () => { alert('Gagal menyalin kode') }); };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;

  const handleGenerateCode = async () => {
      const userId = localUser?.id;
      if (typeof userId !== 'string' || userId.length === 0) {
          alert("Data user tidak valid. Coba refresh halaman.");
          return;
      }
      setTelegramLoading(true);
      setTelegramError('');
      const code = `AFA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await supabase.from('profiles').update({ telegram_verification_code: code, telegram_code_expires_at: expiresAt }).eq('id', userId);
      setTelegramLoading(false);
      if (error) {
          setTelegramError('Gagal membuat kode. Silakan coba lagi.');
      } else {
          setTelegramCode(code);
          setTelegramLinkState('awaiting_code');
      }
  };

  const handleCompleteLink = async () => { /* ... (fungsi ini tidak berubah) ... */ };
  const handleUnlinkTelegram = async () => { /* ... (fungsi ini tidak berubah) ... */ };
  
  if (!isLoggedIn) {
    return (
      <div className="page-content flex flex-col items-center justify-center text-center h-full pt-20">
        <FontAwesomeIcon icon={faSignInAlt} size="3x" className="mb-4 text-primary" />
        <h2 className="text-2xl font-bold text-light-text dark:text-white">Anda Belum Login</h2>
        <p className="text-light-subtle dark:text-gray-400 mt-2 mb-6">Silakan login untuk melihat dan mengelola profil Anda.</p>
        <Link to="/login" className="btn-primary px-8 py-2">Ke Halaman Login</Link>
      </div>
    );
  }

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
      {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}

      <ProfileHeader currentUser={localUser} onEditClick={handleOpenEditProfileModal} onLogoutClick={onLogout} loading={loading} t={t} />

      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
         {/* ... (bagian Wallet Management, gunakan localUser) ... */}
      </div>
      
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
        <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
            <FontAwesomeIcon icon={faLink} className="mr-3 text-primary" />
            Social Accounts
        </h3>
        <div className="p-4 border border-blue-500/30 rounded-lg bg-light-bg dark:bg-dark/30">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faTelegram} className="text-2xl text-[#2AABEE]" />
                    {/* ======================= PERUBAHAN UTAMA 2: GUNAKAN localUser ======================= */}
                    {localUser.telegram_id ? (
                        <div>
                            <span className="font-semibold text-light-text dark:text-white">Telegram Terhubung</span>
                            <p className="text-xs text-light-subtle dark:text-gray-400">@{localUser.telegram_handle || localUser.telegram_id}</p>
                        </div>
                    ) : (
                        <span className="font-semibold text-light-text dark:text-white">Hubungkan Akun Telegram</span>
                    )}
                </div>
                {localUser.telegram_id && (
                    <button onClick={handleUnlinkTelegram} className="btn-secondary ...">
                        <FontAwesomeIcon icon={faUnlink} /> Putuskan
                    </button>
                )}
            </div>
            {!localUser.telegram_id && (
                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/20">
                    {telegramLinkState === 'idle' && (
                        <button onClick={handleGenerateCode} disabled={telegramLoading || !localUser?.id} className="btn-secondary w-full disabled:opacity-50">
                            {telegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faLink} className="mr-2" /> Mulai Proses Koneksi</>}
                        </button>
                    )}
                    {/* ... (sisa UI untuk state 'awaiting_code' dan 'confirming' tidak berubah) ... */}
                </div>
            )}
        </div>
      </div>
      
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
         <h3 className="text-xl ..."><FontAwesomeIcon icon={faChartBar} className="mr-3 text-primary" /> {t.statsTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <StatCard label={t.statPoints} value={localUser.stats?.points || 0} icon={faStar} />
          {/* ... (sisa StatCard menggunakan localUser) ... */}
        </div>
      </div>

      {showEditProfileModal && (
        // ... (bagian Modal Edit Profil, tidak ada perubahan) ...
      )}
    </section>
  );
}
