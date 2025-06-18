// src/components/PageProfile.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faUser, faTimes, faSave, faImage, faSpinner,
  faChartBar, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
  faSignOutAlt,
  faSignInAlt
} from "@fortawesome/free-solid-svg-icons";

import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// ... (Komponen InputField, StatCard, ProfileHeader tidak perlu diubah) ...
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


// [MODIFIKASI] Terima prop onLogout dari App.jsx
export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [] }) {
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

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  useEffect(() => {
      if (isLoggedIn && currentUser) {
        setEditName(currentUser.name || currentUser.username || "");
        setEditAvatarUrl(currentUser.avatar_url || "");
      }
  }, [currentUser, isLoggedIn]);

  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);
  
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

  // ... (Sisa fungsi lain seperti mapSupabaseDataToAppUser, handleLinkWallet, dll. tidak berubah) ...
    const mapSupabaseDataToAppUser = (authUser, profileData) => {
    if (!authUser) return {};
    return {
      id: authUser.id, email: authUser.email,
      username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url,
      stats: profileData?.stats || { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
      address: profileData?.web3_address || null,
      user_metadata: authUser.user_metadata || {}
    };
  };

  const handleLinkWallet = async () => {
    if (!address) { setError("Alamat wallet tidak ditemukan."); return; }
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const lowerCaseAddress = address.toLowerCase();
        const { data: existingProfile, error: checkError } = await supabase.from('profiles').select('id').eq('web3_address', lowerCaseAddress).single();
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingProfile) throw new Error("Alamat wallet ini sudah terhubung ke akun lain.");
        // Untuk menautkan wallet, tidak perlu sign message yang kompleks
        const { data, error: updateError } = await supabase.from('profiles').update({ web3_address: lowerCaseAddress }).eq('id', currentUser.id).select().single();
        if (updateError) throw updateError;
        onUpdateUser(mapSupabaseDataToAppUser(currentUser, data));
        setSuccessMessage("Wallet berhasil ditautkan!");
        disconnect();
    } catch (err) {
        setError(err.message || "Gagal menautkan wallet.");
        disconnect();
    } finally {
        setIsWalletActionLoading(false);
    }
  };

  const handleUnlinkWallet = async () => {
    if (!window.confirm("Apakah Anda yakin ingin melepas tautan wallet ini?")) return;
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const { data, error: updateError } = await supabase.from('profiles').update({ web3_address: null }).eq('id', currentUser.id).select().single();
        if (updateError) throw updateError;
        onUpdateUser(mapSupabaseDataToAppUser(currentUser, data));
        setSuccessMessage("Tautan wallet berhasil dilepas.");
        disconnect();
    } catch (err) {
        setError(err.message || "Gagal melepas tautan wallet.");
    } finally {
        setIsWalletActionLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const profileUpdate = { name: editName, username: editName, avatar_url: editAvatarUrl, updated_at: new Date() }; const { data, error: updateError } = await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id).select().single(); if (updateError) throw updateError; onUpdateUser(mapSupabaseDataToAppUser(currentUser, data)); setSuccessMessage(t.profileUpdateSuccess || "Profil berhasil diperbarui!"); setShowEditProfileModal(false); } catch (err) { setError(err.message || "Gagal update profil."); } finally { setLoading(false); } };
  const handleOpenEditProfileModal = () => { clearMessages(); setShowEditProfileModal(true); };
  const handleCloseEditProfileModal = () => setShowEditProfileModal(false);
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => { setCopySuccess('Disalin!'); setTimeout(() => setCopySuccess(''), 2000); }, () => { setCopySuccess('Gagal'); }); };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;


  // [MODIFIKASI] Gunakan `onLogout` dari props saat tombol di-klik
  return (
    <section className="page-content space-y-6 md:space-y-8 py-6">
      {error && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
      {successMessage && <div className="max-w-lg mx-auto p-4 mb-4 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}

      <ProfileHeader currentUser={currentUser} onEditClick={handleOpenEditProfileModal} onLogoutClick={onLogout} loading={loading} t={t} />

      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
         <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
             <FontAwesomeIcon icon={faWallet} className="mr-3 text-primary" />
             {t.walletManagementTitle || "Wallet Management"}
         </h3>
         {currentUser.address ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-grow">
                    <p className="text-sm text-green-400 font-semibold">{t.walletConnected || "Wallet Connected"}</p>
                    <div className="flex items-center gap-2">
                       <p className="text-lg font-mono text-light-text dark:text-white break-all">{`${currentUser.address.substring(0, 6)}...${currentUser.address.substring(currentUser.address.length - 4)}`}</p>
                       <button onClick={() => handleCopyToClipboard(currentUser.address)} title={copySuccess || 'Copy address'} className="text-light-subtle dark:text-gray-400 hover:text-primary transition-colors">
                          <FontAwesomeIcon icon={faCopy}/>
                       </button>
                    </div>
                </div>
                <button onClick={handleUnlinkWallet} disabled={isWalletActionLoading} className="btn-secondary bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-300 font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm gap-2">
                    {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />}
                    {t.unlinkWalletBtn || "Unlink Wallet"}
                </button>
            </div>
         ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-light-subtle dark:text-gray-400">{t.walletNotLinked || "Your wallet is not linked."}</p>
                <button onClick={() => connect({ connector: injected() })} disabled={isWalletActionLoading} className="btn-primary text-white font-semibold py-2 px-5 rounded-lg flex items-center justify-center text-sm gap-2">
                    {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faLink} />}
                    {t.linkWalletBtn || "Link Wallet"}
                </button>
            </div>
         )}
          { isConnected && !currentUser.address &&
            <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-primary mb-2">Wallet connected: {`${address.substring(0,6)}...${address.substring(address.length - 4)}`}</p>
                <button onClick={handleLinkWallet} disabled={isWalletActionLoading} className="btn-secondary w-full">
                    {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : `Confirm Link`}
                </button>
            </div>
          }
      </div>
      
      <div className="card rounded-xl p-6 md:p-8 shadow-xl">
         <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center"><FontAwesomeIcon icon={faChartBar} className="mr-3 text-primary" /> {t.statsTitle}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <StatCard label={t.statPoints} value={currentUser.stats?.points || 0} icon={faStar} />
          <StatCard label={t.statAirdropsClaimed} value={currentUser.stats?.airdropsClaimed || 0} icon={faClipboardCheck} />
          <StatCard label={t.statNftsOwned} value={currentUser.stats?.nftsOwned || 0} />
          <StatCard label={t.statActiveTasks} value={activeAirdropsCount} icon={faTasks} />
        </div>
      </div>
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="modal-content card rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-light-text dark:text-white flex items-center"><FontAwesomeIcon icon={faEdit} className="mr-3 text-primary" /> {t.editProfileModalTitle}</h3>
              <button disabled={loading} onClick={handleCloseEditProfileModal} className="text-light-subtle dark:text-gray-400 hover:text-light-text dark:hover:text-white text-2xl"><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            {error && <div className="p-3 mb-3 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
            {successMessage && !error && <div className="p-3 mb-3 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <InputField id="editName" label={t.editProfileLabelName} value={editName} onChange={(e) => setEditName(e.target.value)} icon={faUser} parentLoading={loading} />
              <InputField id="editAvatarUrl" label={t.editProfileLabelAvatar} value={editAvatarUrl} onChange={(e) => setEditAvatarUrl(e.target.value)} icon={faImage} parentLoading={loading} />
              <div className="flex justify-end gap-4 pt-4">
                <button disabled={loading} type="button" onClick={handleCloseEditProfileModal} className="btn-secondary px-6 py-2.5 rounded-lg text-sm">{t.editProfileBtnCancel}</button>
                <button disabled={loading} type="submit" className="btn-primary text-white px-6 py-2.5 rounded-lg text-sm flex items-center">
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />} {t.editProfileBtnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
