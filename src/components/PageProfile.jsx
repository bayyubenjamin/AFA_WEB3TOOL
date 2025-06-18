// src/components/PageProfile.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faUser, faTimes, faSave, faImage, faSpinner,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
  faSignOutAlt,
  faSignInAlt
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from '@fortawesome/free-brands-svg-icons'; // <-- Impor ikon Telegram

import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useAccount, useDisconnect } from 'wagmi';
import TelegramLoginWidget from './TelegramLoginWidget'; // <-- [DITAMBAHKAN] Impor widget

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// ... (Komponen InputField, StatCard, ProfileHeader tetap sama) ...
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

const StatCard = ({ icon, label, value }) => (
  <div className="bg-light-bg dark:bg-dark p-5 rounded-xl border border-black/10 dark:border-white/10 transition-all">
    <FontAwesomeIcon icon={icon} className="text-primary text-xl mb-3" />
    <p className="text-2xl font-bold text-light-text dark:text-white">{value}</p>
    <p className="text-light-subtle dark:text-gray-400 text-xs uppercase tracking-wider">{label}</p>
  </div>
);

const ProfileHeader = ({ currentUser, onEditClick, onLogoutClick, loading, t }) => (
    <div className="card rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <img
            src={currentUser.avatar_url}
            alt="User Avatar"
            className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-primary/50 shadow-lg"
        />
        <div className="flex-grow text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-light-text dark:text-white">{currentUser.name}</h2>
            <p className="text-md text-light-subtle dark:text-gray-400">@{currentUser.username}</p>
            {currentUser.email && <p className="text-sm text-primary mt-1 font-mono">{currentUser.email}</p>}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0">
            <button onClick={onEditClick} className="btn-secondary text-sm px-5 py-2 w-full md:w-auto flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faEdit} />
                {t.editProfileBtnSave || 'Edit Profile'}
            </button>
            <button onClick={onLogoutClick} disabled={loading} className="btn-danger text-sm px-5 py-2 w-full md:w-auto flex items-center justify-center gap-2">
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSignOutAlt} />}
                {t.logoutBtn || 'Logout'}
            </button>
        </div>
    </div>
);


export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [], onOpenWalletModal }) {
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};
  const isLoggedIn = !!(currentUser && currentUser.id);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  
  // [DITAMBAHKAN] State untuk proses loading koneksi Telegram
  const [isTelegramConnecting, setIsTelegramConnecting] = useState(false);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);

  // [DITAMBAHKAN] Fungsi untuk menangani callback dari widget Telegram
  const handleTelegramAuth = async (telegramUser) => {
    setIsTelegramConnecting(true);
    clearMessages();
    try {
      const { error: functionError } = await supabase.functions.invoke('verify-telegram-auth', {
        body: telegramUser
      });

      if (functionError) throw functionError;

      setSuccessMessage('Akun Telegram berhasil terhubung!');
      // Refresh data pengguna untuk menampilkan status terhubung
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      onUpdateUser(mapSupabaseDataToAppUserForApp(session.user, profile));
    } catch (err) {
      setError(err.message || 'Gagal menghubungkan akun Telegram.');
    } finally {
      setIsTelegramConnecting(false);
    }
  };
  
  const handleLinkWallet = useCallback(async () => {
    // ... (fungsi handleLinkWallet tetap sama)
  }, [address, currentUser, onUpdateUser, disconnect, clearMessages]);

  useEffect(() => {
    if (isConnected && address && !currentUser.address) {
      handleLinkWallet();
    }
  }, [isConnected, address, currentUser.address, handleLinkWallet]);

  useEffect(() => {
      if (isLoggedIn && currentUser) {
        setEditName(currentUser.name || currentUser.username || "");
        setEditAvatarUrl(currentUser.avatar_url || "");
      }
  }, [currentUser, isLoggedIn]);
  
  if (!isLoggedIn) {
    return (
      <div className="page-content flex flex-col items-center justify-center text-center h-full pt-20">
        <FontAwesomeIcon icon={faSignInAlt} size="3x" className="mb-4 text-primary" />
        <h2 className="text-2xl font-bold text-light-text dark:text-white">Anda Belum Login</h2>
        <p className="text-light-subtle dark:text-gray-400 mt-2 mb-6">
            Silakan login untuk melihat dan mengelola profil Anda.
        </p>
        <Link to="/login" className="btn-primary px-8 py-2">
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  // ... (sisa fungsi helper lain tetap sama)
  const mapSupabaseDataToAppUser = (authUser, profileData) => {
    if (!authUser) return {};
    return {
      id: authUser.id, email: authUser.email,
      username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url,
      stats: profileData?.stats || { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
      address: profileData?.web3_address || null,
      telegram_user_id: profileData?.telegram_user_id || null, // [DITAMBAHKAN]
      user_metadata: authUser.user_metadata || {}
    };
  };
  const handleUnlinkWallet = async () => { /* ... */ };
  const handleUpdateProfile = async (e) => { /* ... */ };
  const handleOpenEditProfileModal = () => { /* ... */ };
  const handleCloseEditProfileModal = () => { /* ... */ };
  const handleCopyToClipboard = (text) => { /* ... */ };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;


  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
      {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}

      <ProfileHeader currentUser={currentUser} onEditClick={handleOpenEditProfileModal} onLogoutClick={onLogout} loading={loading} t={t} />
      
      {/* ... (bagian Wallet Management tetap sama) ... */}

      {/* [DIPERBARUI] Bagian Social Accounts */}
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
         <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
             <FontAwesomeIcon icon={faTelegram} className="mr-3 text-sky-400" />
             Social Accounts
         </h3>
         <div className="flex flex-col items-center justify-center text-center">
            {currentUser.telegram_user_id ? (
              <div className="text-green-400 font-semibold">
                <p>Akun Telegram sudah terhubung!</p>
                <p className="text-xs">(ID: {currentUser.telegram_user_id})</p>
              </div>
            ) : (
              <>
                <p className="text-light-subtle dark:text-gray-400 mb-4">Hubungkan akun Telegram Anda untuk mendapatkan notifikasi dan akses ke fitur eksklusif.</p>
                <TelegramLoginWidget onTelegramAuth={handleTelegramAuth} loading={isTelegramConnecting} />
              </>
            )}
         </div>
      </div>
      
      {/* ... (bagian My Stats tetap sama) ... */}
      
      {/* ... (bagian Modal Edit Profile tetap sama) ... */}
    </section>
  );
}
