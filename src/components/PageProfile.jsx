// src/components/PageProfile.jsx (Dengan Perbaikan)

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
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

import { useAccount, useDisconnect } from 'wagmi';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// Komponen InputField (Tidak ada perubahan)
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

// Komponen StatCard (Tidak ada perubahan)
const StatCard = ({ icon, label, value }) => (
  <div className="bg-light-bg dark:bg-dark p-5 rounded-xl border border-black/10 dark:border-white/10 transition-all">
    <FontAwesomeIcon icon={icon} className="text-primary text-xl mb-3" />
    <p className="text-2xl font-bold text-light-text dark:text-white">{value}</p>
    <p className="text-light-subtle dark:text-gray-400 text-xs uppercase tracking-wider">{label}</p>
  </div>
);

// Komponen ProfileHeader (Tidak ada perubahan)
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

  // State khusus untuk alur koneksi Telegram
  const [telegramLinkState, setTelegramLinkState] = useState('idle');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramError, setTelegramError] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  // Fungsi helper mapSupabaseDataToAppUser
  const mapSupabaseDataToAppUser = (authUser, profileData) => {
    if (!authUser) return {};
    return {
      id: authUser.id, email: authUser.email,
      username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url,
      stats: profileData?.stats || { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
      address: profileData?.web3_address || null,
      telegram_id: profileData?.telegram_id || null, // Tambahkan ini
      telegram_handle: profileData?.telegram_handle || null, // Tambahkan ini
      user_metadata: authUser.user_metadata || {}
    };
  };

  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);
  
  const handleLinkWallet = useCallback(async () => {
    // ... (fungsi ini tidak berubah) ...
    if (!address || !currentUser?.id) return;
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const lowerCaseAddress = address.toLowerCase();
        const { data: existingProfile, error: checkError } = await supabase.from('profiles').select('id').eq('web3_address', lowerCaseAddress).single();
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingProfile && existingProfile.id !== currentUser.id) {
            throw new Error("Alamat wallet ini sudah terhubung ke akun lain.");
        }
        const { data, error: updateError } = await supabase.from('profiles').update({ web3_address: lowerCaseAddress }).eq('id', currentUser.id).select().single();
        if (updateError) throw updateError;
        onUpdateUser(mapSupabaseDataToAppUser(currentUser, data));
        setSuccessMessage("Wallet berhasil ditautkan!");
    } catch (err) {
        setError(err.message || "Gagal menautkan wallet.");
    } finally {
        setIsWalletActionLoading(false);
        disconnect();
    }
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

  // Fungsi untuk alur koneksi Telegram (DENGAN PERBAIKAN)
  const handleGenerateCode = async () => {
      // ======================= PERBAIKAN DI SINI =======================
      // Tambahkan 'penjaga' untuk memastikan currentUser.id sudah ada
      if (!currentUser || !currentUser.id) {
          alert("Data user belum siap, silakan coba refresh halaman.");
          return;
      }
      // =================================================================

      setTelegramLoading(true);
      setTelegramError('');
      const code = `AFA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // Berlaku 10 menit

      const { error } = await supabase
          .from('profiles')
          .update({
              telegram_verification_code: code,
              telegram_code_expires_at: expiresAt
          })
          .eq('id', currentUser.id);

      setTelegramLoading(false);
      if (error) {
          setTelegramError('Gagal membuat kode. Silakan coba lagi.');
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
          
          if (error) throw new Error(error.message);
          if (data.error) throw new Error(data.error);

          alert('Sukses! Akun Telegram berhasil ditautkan.');
          setTelegramLinkState('idle');
          window.location.reload(); 
      } catch (err) {
          setTelegramError(err.message || "Terjadi kesalahan. Coba lagi.");
          setTelegramLinkState('awaiting_code'); 
      } finally {
          setTelegramLoading(false);
      }
  };
  
  const handleUnlinkTelegram = async () => {
      if (!window.confirm("Yakin ingin memutus hubungan dengan akun Telegram?")) return;
      const { error } = await supabase.from('profiles').update({ telegram_id: null, telegram_handle: null, telegram_verification_code: null, telegram_code_expires_at: null }).eq('id', currentUser.id);
      if (error) {
          alert("Gagal memutus hubungan: " + error.message);
      } else {
          alert("Hubungan dengan Telegram telah diputus.");
          window.location.reload();
      }
  };

  // ... (sisa fungsi tidak berubah)
  const handleUnlinkWallet = async () => { /* ... */ };
  const handleUpdateProfile = async (e) => { /* ... */ };
  const handleOpenEditProfileModal = () => { /* ... */ };
  const handleCloseEditProfileModal = () => { /* ... */ };
  const handleCopyToClipboard = (text) => { /* ... */ };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;

  if (!isLoggedIn) { /* ... (kode untuk user belum login tidak berubah) ... */ }

  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {/* ... (error & success message, ProfileHeader) ... */}
       {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
       {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}
       <ProfileHeader currentUser={currentUser} onEditClick={handleOpenEditProfileModal} onLogoutClick={onLogout} loading={loading} t={t} />
       <div className="card rounded-xl p-6 md:p-8 shadow-xl">
            {/* ... (bagian wallet management) ... */}
       </div>

      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
        <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
            <FontAwesomeIcon icon={faLink} className="mr-3 text-primary" />
            Social Accounts
        </h3>
        
        {/* ======================= BLOK KODE TELEGRAM YANG DIPERBARUI ======================= */}
        <div className="p-4 border border-blue-500/30 rounded-lg bg-light-bg dark:bg-dark/30">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faTelegram} className="text-2xl text-[#2AABEE]" />
                    {currentUser.telegram_id ? (
                        <div>
                            <span className="font-semibold text-light-text dark:text-white">Telegram Terhubung</span>
                            <p className="text-xs text-light-subtle dark:text-gray-400">@{currentUser.telegram_handle || currentUser.telegram_id}</p>
                        </div>
                    ) : (
                        <span className="font-semibold text-light-text dark:text-white">Hubungkan Akun Telegram</span>
                    )}
                </div>
                {currentUser.telegram_id && (
                    <button onClick={handleUnlinkTelegram} className="btn-secondary bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-2 text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faUnlink} /> Putuskan
                    </button>
                )}
            </div>
            
            {!currentUser.telegram_id && (
                <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/20">
                    {telegramLinkState === 'idle' && (
                        <button onClick={handleGenerateCode} disabled={telegramLoading || !currentUser?.id} className="btn-secondary w-full disabled:opacity-50">
                            {telegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faLink} className="mr-2" /> Mulai Proses Koneksi</>}
                        </button>
                    )}

                    {telegramLinkState === 'awaiting_code' && (
                        <div className="space-y-3 text-center">
                            <p className="text-sm text-light-subtle dark:text-gray-400">
                                1. Buka bot <a href="http://t.me/afaweb3tool_bot" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">@afaweb3tool_bot</a> di Telegram.
                            </p>
                            <p className="text-sm text-light-subtle dark:text-gray-400">2. Kirim kode unik di bawah ini ke bot.</p>
                            <div className="bg-dark p-3 rounded-lg flex items-center justify-center gap-4 my-2">
                                <code className="text-xl font-bold tracking-widest text-green-400">{telegramCode}</code>
                                <button onClick={() => handleCopyToClipboard(telegramCode)} title="Salin Kode" className="text-gray-400 hover:text-white">
                                    <FontAwesomeIcon icon={faClipboard} />
                                </button>
                            </div>
                            <p className="text-sm text-light-subtle dark:text-gray-400">3. Kembali ke sini dan klik tombol di bawah.</p>
                            <button onClick={handleCompleteLink} disabled={telegramLoading} className="btn-primary w-full mt-2 disabled:opacity-50">
                                {telegramLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Selesaikan Koneksi'}
                            </button>
                        </div>
                    )}

                    {telegramLinkState === 'confirming' && (
                        <div className="text-center text-primary py-4">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x"/>
                            <p className="mt-2 text-sm font-semibold">Mengecek pesan dari bot...</p>
                        </div>
                    )}
                    {telegramError && <p className="text-xs text-red-400 text-center mt-2">{telegramError}</p>}
                </div>
            )}
        </div>
      </div>
      
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
        {/* ... (bagian My Stats) ... */}
      </div>

      {showEditProfileModal && (
        // ... (bagian Modal Edit Profil) ...
      )}
    </section>
  );
}
