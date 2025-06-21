// src/components/PageProfile.jsx - KODE LENGKAP DAN SUDAH DIPERBAIKI

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit, faUser, faTimes, faSave, faImage, faSpinner,
  faChartSimple, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
  faSignOutAlt, faSignInAlt, faEnvelope, faLock, faShieldHalved, faGear
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from '@fortawesome/free-brands-svg-icons';

import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useAccount, useDisconnect } from 'wagmi';

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

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
  // PERBAIKAN DI SINI: Mengubah dark:bg-dark menjadi dark:bg-dark-bg
  <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-xl border border-black/10 dark:border-white/10 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
    <FontAwesomeIcon icon={icon} className="text-primary text-xl mb-2" />
    <p className="text-2xl font-bold text-light-text dark:text-white">{value}</p>
    <p className="text-light-subtle dark:text-gray-400 text-xs uppercase tracking-wider">{label}</p>
  </div>
);

export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [], onOpenWalletModal }) {
  const { language } = useLanguage();
  const t = getTranslations(language).profilePage || {};
  const isLoggedIn = !!(currentUser && currentUser.id);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWalletActionLoading, setIsWalletActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [isTelegramConnecting, setIsTelegramConnecting] = useState(false);
  const [isLinkingEmail, setIsLinkingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const settingsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const clearMessages = useCallback(() => { setError(null); setSuccessMessage(null); }, []);

  const mapSupabaseDataToAppUser = (authUser, profileData) => {
    if (!authUser) return {};
    return {
      id: authUser.id, email: authUser.email,
      username: profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      name: profileData?.name || profileData?.username || authUser.user_metadata?.username || authUser.email?.split('@')[0] || "User",
      avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url,
      stats: profileData?.stats || { points: 0, airdropsClaimed: 0, nftsOwned: 0 },
      address: profileData?.web3_address || null,
      telegram_user_id: profileData?.telegram_user_id || null,
      user_metadata: authUser.user_metadata || {}
    };
  };
  
  const handleLinkWallet = useCallback(async () => {
    if (!address || !currentUser?.id) return;
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const lowerCaseAddress = address.toLowerCase();
        const { data: existingProfile, error: checkError } = await supabase.from('profiles').select('id').eq('web3_address', lowerCaseAddress).single();
        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        if (existingProfile && existingProfile.id !== currentUser.id) {
            throw new Error("This wallet address is already linked to another account.");
        }
        
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ web3_address: lowerCaseAddress })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (updateError) throw updateError;
        onUpdateUser(mapSupabaseDataToAppUser(currentUser, data));
        setSuccessMessage("Wallet linked successfully!");
    } catch (err) {
        setError(err.message || "Failed to link wallet.");
    } finally {
        setIsWalletActionLoading(false);
        disconnect();
    }
  }, [address, currentUser, onUpdateUser, disconnect, clearMessages]);

  const handleUnlinkWallet = async () => {
    if (!window.confirm("Are you sure you want to unlink this wallet?")) return;
    setIsWalletActionLoading(true);
    clearMessages();
    try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ web3_address: null })
          .eq('id', currentUser.id);

        if (updateError) throw updateError;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Session not found, please log in again.");
        
        const { data: refreshedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) throw profileError;

        onUpdateUser(mapSupabaseDataToAppUser(session.user, refreshedProfile));

        setSuccessMessage("Wallet unlinked successfully.");
        disconnect();
    } catch (err) {
        setError(err.message || "Failed to unlink wallet.");
    } finally {
        setIsWalletActionLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!window.confirm("Are you sure you want to unlink this Telegram account?")) return;
    setIsTelegramConnecting(true);
    clearMessages();
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ telegram_user_id: null })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;
      
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      onUpdateUser(mapSupabaseDataToAppUser(session.user, profile));
      setSuccessMessage('Telegram account unlinked successfully.');

    } catch (err) {
      setError(err.message || 'Failed to unlink Telegram account.');
    } finally {
      setIsTelegramConnecting(false);
    }
  };

  const handleLinkEmailPassword = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      setError("Please fill in a new email and password.");
      return;
    }
    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    setIsLinkingEmail(true);
    clearMessages();
    try {
      const { data, error } = await supabase.functions.invoke('link-email-password', {
        body: { new_email: newEmail, new_password: newPassword },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSuccessMessage(data.message);
      alert('Success! Please log in again with your new email and password.');
      onLogout();
      navigate('/login');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLinkingEmail(false);
    }
  };


  useEffect(() => {
    if (isConnected && address && !currentUser.address) {
      handleLinkWallet();
    }
  }, [isConnected, address, currentUser, handleLinkWallet]);

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
        <h2 className="text-2xl font-bold text-light-text dark:text-white">You Are Not Logged In</h2>
        <p className="text-light-subtle dark:text-gray-400 mt-2 mb-6">
            Please log in to view and manage your profile.
        </p>
        <Link to="/login" className="btn-primary px-8 py-2">
          Go to Login Page
        </Link>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const profileUpdate = { name: editName, username: editName, avatar_url: editAvatarUrl, updated_at: new Date() }; const { data, error: updateError } = await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id).select().single(); if (updateError) throw updateError; onUpdateUser(mapSupabaseDataToAppUser(currentUser, data)); setSuccessMessage(t.profileUpdateSuccess || "Profile updated successfully!"); setShowEditProfileModal(false); } catch (err) { setError(err.message || "Failed to update profile."); } finally { setLoading(false); } };
  const handleOpenEditProfileModal = () => { clearMessages(); setShowEditProfileModal(true); };
  const handleCloseEditProfileModal = () => setShowEditProfileModal(false);
  const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => { setCopySuccess('Copied!'); setTimeout(() => setCopySuccess(''), 2000); }, () => { setCopySuccess('Failed'); }); };
  const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;
  
  const isDummyEmail = currentUser?.email?.endsWith('@telegram.user') || currentUser?.email?.endsWith('@wallet.afa-web3.com');

  return (
    <section className="page-content grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 py-6">
      
      <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
        {(error || successMessage) && (
            <div className={`max-w-full p-4 mb-0 text-sm rounded-lg text-center ${error ? 'text-red-300 bg-red-800/50' : 'text-green-300 bg-green-800/50'}`}>
                {error || successMessage}
            </div>
        )}

        <div className="card relative rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
             <div className="absolute top-4 right-4" ref={settingsMenuRef}>
                 <button 
                     onClick={() => setIsSettingsOpen(p => !p)}
                     className="h-10 w-10 flex items-center justify-center text-light-subtle dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                     aria-label="Profile Settings"
                 >
                     <FontAwesomeIcon icon={faGear} />
                 </button>
                 <div className={`options-menu ${isSettingsOpen ? 'active' : ''}`}>
                    <ul>
                        <li onClick={() => { handleOpenEditProfileModal(); setIsSettingsOpen(false); }}>
                            <FontAwesomeIcon icon={faEdit} />
                            {t.editProfileBtnSave || 'Edit Profile'}
                        </li>
                        <li onClick={() => { onLogout(); setIsSettingsOpen(false); }} className="text-red-500 dark:text-red-400">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                            {t.logoutBtn || 'Logout'}
                        </li>
                    </ul>
                 </div>
             </div>

            <img
                src={currentUser.avatar_url}
                alt="User Avatar"
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-primary/50 shadow-lg"
            />
            <div className="flex-grow text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-light-text dark:text-white">{currentUser.name}</h2>
                <p className="text-md text-light-subtle dark:text-gray-400">@{currentUser.username}</p>
                {currentUser.address && (
                  <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                    <FontAwesomeIcon icon={faWallet} className="text-green-400" />
                    <p className="text-sm font-mono text-light-text dark:text-white break-all">{`${currentUser.address.substring(0, 6)}...${currentUser.address.substring(currentUser.address.length - 4)}`}</p>
                    <button onClick={() => handleCopyToClipboard(currentUser.address)} title={copySuccess || 'Copy address'} className="text-light-subtle dark:text-gray-400 hover:text-primary transition-colors text-xs">
                        <FontAwesomeIcon icon={faCopy}/>
                    </button>
                  </div>
                )}
            </div>
        </div>

        <div className="card rounded-xl p-6 md:p-8 shadow-xl">
            <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                <FontAwesomeIcon icon={faChartSimple} className="mr-3 text-primary" /> 
                Your Activity
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                <StatCard label={t.statPoints} value={currentUser.stats?.points || 0} icon={faStar} />
                <StatCard label={t.statAirdropsClaimed} value={currentUser.stats?.airdropsClaimed || 0} icon={faClipboardCheck} />
                <StatCard label={"NFT"} value={currentUser.stats?.nftsOwned || 0} icon={faImage} />
                <StatCard label={t.statActiveTasks} value={activeAirdropsCount} icon={faTasks} />
            </div>
        </div>
      </div>

      <div className="lg:col-span-1">
         <div className="card rounded-xl p-6 md:p-8 shadow-xl sticky top-24">
            <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                <FontAwesomeIcon icon={faShieldHalved} className="mr-3 text-primary" />
                Account Connections
            </h3>
            <ul className="space-y-4">
               <li className="flex items-start gap-4">
                  <div className="bg-blue-500/10 text-blue-400 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center">
                     <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div className="flex-grow">
                     <h4 className="font-semibold text-light-text dark:text-white">Email & Password</h4>
                     {isDummyEmail ? (
                         <>
                            <p className="text-xs text-light-subtle dark:text-gray-400 mt-1 mb-3">Your account is not secured with an email. Add one to enable traditional login.</p>
                            <form onSubmit={handleLinkEmailPassword} className="space-y-3">
                                <InputField id="new_email" type="email" label="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} icon={faEnvelope} placeholder="your.email@example.com" parentLoading={isLinkingEmail} />
                                <InputField id="new_password" type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={faLock} placeholder="Minimum 6 characters" parentLoading={isLinkingEmail} />
                                <button type="submit" disabled={isLinkingEmail} className="btn-secondary w-full py-2 text-sm">
                                    {isLinkingEmail ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Save & Secure Account'}
                                </button>
                            </form>
                         </>
                     ) : (
                         <p className="text-sm text-green-400 font-semibold mt-1">Account is secured.</p>
                     )}
                  </div>
               </li>
               
               <li className="flex items-start gap-4">
                  <div className="bg-purple-500/10 text-purple-400 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center">
                     <FontAwesomeIcon icon={faWallet} />
                  </div>
                  <div className="flex-grow">
                     <h4 className="font-semibold text-light-text dark:text-white">Wallet</h4>
                     {currentUser.address ? (
                        <>
                           <p className="text-xs text-green-400 mt-1">Wallet is connected.</p>
                           <button onClick={handleUnlinkWallet} disabled={isWalletActionLoading} className="btn-secondary text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">
                               {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />}
                               Unlink
                           </button>
                        </>
                     ) : (
                        <>
                           <p className="text-xs text-light-subtle dark:text-gray-400 mt-1">Link your wallet to participate in events and claim rewards.</p>
                           <button onClick={onOpenWalletModal} disabled={isWalletActionLoading} className="btn-secondary font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">
                               {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faLink} />}
                               Link Wallet
                           </button>
                        </>
                     )}
                  </div>
               </li>

                <li className="flex items-start gap-4">
                  <div className="bg-sky-500/10 text-sky-400 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center">
                     <FontAwesomeIcon icon={faTelegram} />
                  </div>
                  <div className="flex-grow">
                     <h4 className="font-semibold text-light-text dark:text-white">Telegram</h4>
                     {currentUser.telegram_user_id ? (
                        <>
                           <p className="text-xs text-green-400 mt-1">Account linked (ID: {currentUser.telegram_user_id})</p>
                           <button onClick={handleUnlinkTelegram} disabled={isTelegramConnecting} className="btn-secondary text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">
                               {isTelegramConnecting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />}
                               Unlink
                           </button>
                        </>
                     ) : (
                        <>
                           <p className="text-xs text-light-subtle dark:text-gray-400 mt-1">Link your Telegram via our bot to verify tasks.</p>
                           <a href="https://t.me/afaweb3tool_bot" target="_blank" rel="noopener noreferrer" className="btn-secondary font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">
                              <FontAwesomeIcon icon={faLink} />
                              <span>Link via Bot</span>
                           </a>
                        </>
                     )}
                  </div>
               </li>
            </ul>
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
