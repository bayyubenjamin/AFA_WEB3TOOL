import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit, faUser, faTimes, faSave, faImage, faSpinner,
    faChartSimple, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
    faSignOutAlt, faSignInAlt, faEnvelope, faLock, faShieldHalved, faGear, faCrown, faArrowUp, faIdCard
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useAccount, useDisconnect, useReadContract, useChainId, useConnect } from 'wagmi';

import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

const contractConfig = {
    11155420: { // OP Sepolia
        address: '0x8611E3C3F991C989fEF0427998062f77c9D0A2F1',
        abi: AfaIdentityABI
    },
    84532: { // Base Sepolia (BARU)
        address: '0x36b1e78A718D77Cae16E1922Baaea2a555f77dcf',
        abi: AfaIdentityABI
    }
};

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
    const [tokenId, setTokenId] = useState(null);

    const { address, isConnected, connector } = useAccount();
    const { disconnect } = useDisconnect();
    const { connect, connectors, isPending: isConnectingWallet } = useConnect();
    const navigate = useNavigate();
    const settingsMenuRef = useRef(null);
    const chainId = useChainId();

    const { address: contractAddress, abi } = useMemo(() => {
        return contractConfig[chainId] || { address: null, abi: null };
    }, [chainId]);

    const { data: balance } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'balanceOf',
        args: [currentUser?.address],
        enabled: !!currentUser?.address && !!contractAddress,
    });

    const { data: wagmiTokenId } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [currentUser?.address, 0],
        enabled: !!currentUser?.address && !!balance && Number(balance) > 0 && !!contractAddress,
    });
    
    const { data: isPremium } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'isPremium',
        args: [tokenId],
        enabled: !!tokenId && !!contractAddress,
    });

    const hasNFT = useMemo(() => balance && Number(balance) > 0, [balance]);
    
    useEffect(() => {
        if (wagmiTokenId !== undefined) {
            setTokenId(wagmiTokenId);
        }
    }, [wagmiTokenId]);

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

    // --- FUNGSI INI SEKARANG KHUSUS UNTUK MENAUTKAN AFA WALLET ---
    const handleLinkAfaWallet = useCallback(async (walletAddressToLink) => {
        if (!walletAddressToLink || !currentUser?.id) return;
        setIsWalletActionLoading(true);
        clearMessages();
        try {
            const lowerCaseAddress = walletAddressToLink.toLowerCase();

            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles').select('id').eq('web3_address', lowerCaseAddress).single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            if (existingProfile && existingProfile.id !== currentUser.id) {
                throw new Error("Dompet ini sudah ditautkan ke akun lain.");
            }

            const { data, error: updateError } = await supabase
                .from('profiles').update({ web3_address: lowerCaseAddress }).eq('id', currentUser.id).select().single();

            if (updateError) throw updateError;
            onUpdateUser(mapSupabaseDataToAppUser(currentUser, data));
            setSuccessMessage("Dompet AFA berhasil diaktifkan!");
        } catch (err) {
            setError(err.message || "Gagal menautkan dompet AFA.");
        } finally {
            setIsWalletActionLoading(false);
        }
    }, [currentUser, onUpdateUser, clearMessages]);

    // --- FUNGSI INI MENJADI SATU-SATUNYA CARA UNTUK MENAUTKAN AFA WALLET ---
    const handleActivateSmartWallet = () => {
        clearMessages();
        const smartWalletConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
        if (smartWalletConnector) {
            connect({ connector: smartWalletConnector }, {
                onSuccess: (data) => {
                    handleLinkAfaWallet(data.accounts[0]);
                },
                onError: (error) => {
                    setError(`Gagal mengaktifkan dompet: ${error.message}`);
                }
            });
        } else {
            setError("Konektor Smart Wallet tidak ditemukan.");
        }
    };

    const handleUnlinkAfaWallet = async () => {
        if (!window.confirm("Anda yakin ingin memutuskan tautan AFA Wallet Anda?")) return;
        setIsWalletActionLoading(true);
        clearMessages();
        try {
            const { error: updateError } = await supabase
                .from('profiles').update({ web3_address: null }).eq('id', currentUser.id);

            if (updateError) throw updateError;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Sesi tidak ditemukan.");
            
            const { data: refreshedProfile, error: profileError } = await supabase
                .from('profiles').select('*').eq('id', session.user.id).single();

            if (profileError) throw profileError;

            onUpdateUser(mapSupabaseDataToAppUser(session.user, refreshedProfile));
            setSuccessMessage("Tautan AFA Wallet berhasil diputus.");
            
            if (isConnected && address?.toLowerCase() === currentUser.address?.toLowerCase()) {
                disconnect();
            }
        } catch (err) {
            setError(err.message || "Gagal memutuskan tautan dompet.");
        } finally {
            setIsWalletActionLoading(false);
        }
    };

    // --- Kode yang tidak diubah tetap dipertahankan ---
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
    // --- AKHIR DARI KODE YANG TIDAK DIUBAH ---

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
                
                <div className={`card relative rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6 ${hasNFT && isPremium ? 'bg-gradient-to-br from-yellow-100/20 to-amber-200/20 dark:from-yellow-800/20 dark:to-amber-900/30 border-yellow-500/50 shadow-yellow-500/20' : ''}`}>
                    <div className="absolute top-4 right-4" ref={settingsMenuRef}>
                        <button onClick={() => setIsSettingsOpen(p => !p)} className="h-10 w-10 flex items-center justify-center text-light-subtle dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors" aria-label="Profile Settings">
                            <FontAwesomeIcon icon={faGear} />
                        </button>
                        <div className={`options-menu ${isSettingsOpen ? 'active' : ''}`}>
                            <ul>
                                <li onClick={() => { handleOpenEditProfileModal(); setIsSettingsOpen(false); }}>
                                    <FontAwesomeIcon icon={faEdit} /> {t.editProfileBtnSave || 'Edit Profile'}
                                </li>
                                <li onClick={() => { onLogout(); setIsSettingsOpen(false); }} className="text-red-500 dark:text-red-400">
                                    <FontAwesomeIcon icon={faSignOutAlt} /> {t.logoutBtn || 'Logout'}
                                </li>
                            </ul>
                        </div>
                    </div>
                    <img src={currentUser.avatar_url} alt="User Avatar" className={`w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 shadow-lg ${hasNFT && isPremium ? 'border-yellow-400' : 'border-primary/50'}`} />
                    <div className="flex-grow text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-light-text dark:text-white">{currentUser.name}</h2>
                            {hasNFT && ( isPremium ? ( <div className="flex items-center gap-1 text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full"><FontAwesomeIcon icon={faCrown} /><span>PREMIUM</span></div>) : (<div className="flex items-center gap-1 text-xs font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full"><span>BASIC</span></div>) )}
                        </div>
                        <p className="text-md text-light-subtle dark:text-gray-400">@{currentUser.username}</p>
                        <div className="mt-4 text-center md:text-left">
                            {!hasNFT ? (<><Link to="/identity" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-transform transform hover:scale-105"> <FontAwesomeIcon icon={faIdCard}/> Mint AFA Identity</Link><p className="text-xs text-light-subtle dark:text-gray-500 mt-1">Get your soul-bound AFA Identity NFT.</p></>) : ( !isPremium && (<><Link to="/identity" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-transform transform hover:scale-105"><FontAwesomeIcon icon={faArrowUp}/> Upgrade to Premium</Link><p className="text-xs text-light-subtle dark:text-gray-500 mt-1">Unlock exclusive features and benefits.</p></>) )}
                        </div>
                    </div>
                </div>

                <div className="card rounded-xl p-6 md:p-8 shadow-xl">
                    <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                        <FontAwesomeIcon icon={faIdCard} className="mr-3 text-primary" /> AFA Wallet (Smart Wallet)
                    </h3>
                    {currentUser.address ? (
                        <div className="flex items-center gap-4">
                            <div className="flex-grow">
                                <p className="text-sm font-mono text-light-text dark:text-white break-all">{`${currentUser.address.substring(0, 10)}...${currentUser.address.substring(currentUser.address.length - 8)}`}</p>
                                <p className="text-xs text-green-400 mt-1">AFA Wallet Anda sudah aktif dan tertaut.</p>
                            </div>
                            <button onClick={handleUnlinkAfaWallet} disabled={isWalletActionLoading} className="btn-secondary text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2">
                                {isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />} Putuskan
                            </button>
                        </div>
                    ) : (
                        <div>
                             <p className="text-sm text-light-subtle dark:text-gray-400 mb-4">Anda belum memiliki AFA Wallet. Aktifkan dompet Web3 internal Anda untuk menikmati semua fitur tanpa perlu dompet eksternal.</p>
                             <button onClick={handleActivateSmartWallet} disabled={isConnectingWallet || isWalletActionLoading} className="btn-primary w-full font-semibold py-2 px-4 rounded-lg flex items-center justify-center text-sm gap-2">
                                {isConnectingWallet || isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faIdCard} />} Aktivasi AFA Wallet Saya
                             </button>
                        </div>
                    )}
                </div>

                <div className="card rounded-xl p-6 md:p-8 shadow-xl">
                    <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                        <FontAwesomeIcon icon={faChartSimple} className="mr-3 text-primary" /> Your Activity
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                        <StatCard label={t.statPoints} value={currentUser.stats?.points || 0} icon={faStar} />
                        <StatCard label={t.statAirdropsClaimed} value={currentUser.stats?.airdropsClaimed || 0} icon={faClipboardCheck} />
                        <StatCard label={"NFT"} value={hasNFT ? 1 : 0} icon={faImage} />
                        <StatCard label={t.statActiveTasks} value={activeAirdropsCount} icon={faTasks} />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="card rounded-xl p-6 md:p-8 shadow-xl sticky top-24">
                    <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                        <FontAwesomeIcon icon={faShieldHalved} className="mr-3 text-primary" /> Account Connections
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-4">
                            <div className="bg-blue-500/10 text-blue-400 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faEnvelope} />
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-semibold text-light-text dark:text-white">Email & Password</h4>
                                {isDummyEmail ? ( <> <p className="text-xs text-light-subtle dark:text-gray-400 mt-1 mb-3">Your account is not secured with an email. Add one to enable traditional login.</p><form onSubmit={handleLinkEmailPassword} className="space-y-3"> <InputField id="new_email" type="email" label="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} icon={faEnvelope} placeholder="your.email@example.com" parentLoading={isLinkingEmail} /> <InputField id="new_password" type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={faLock} placeholder="Minimum 6 characters" parentLoading={isLinkingEmail} /><button type="submit" disabled={isLinkingEmail} className="btn-secondary w-full py-2 text-sm"> {isLinkingEmail ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Save & Secure Account'}</button></form></>) : (<p className="text-sm text-green-400 font-semibold mt-1">Account is secured.</p>)}
                            </div>
                        </li>
                        
                        <li className="flex items-start gap-4">
                             <div className="bg-purple-500/10 text-purple-400 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center">
                                 <FontAwesomeIcon icon={faWallet} />
                             </div>
                             <div className="flex-grow">
                                 <h4 className="font-semibold text-light-text dark:text-white">Dompet Eksternal</h4>
                                 {isConnected && address && address.toLowerCase() !== currentUser.address?.toLowerCase() ? (
                                     <>
                                         <p className="text-xs text-green-400 mt-1">Terhubung ke:</p>
                                         <p className="text-sm font-mono text-light-text dark:text-white break-all" title={address}>{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</p>
                                         <button onClick={() => disconnect()} className="btn-secondary text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">
                                             <FontAwesomeIcon icon={faUnlink} /> Putuskan
                                         </button>
                                     </>
                                 ) : (
                                     <>
                                         <p className="text-xs text-light-subtle dark:text-gray-400 mt-1">Hubungkan dompet eksternal seperti MetaMask, Trust Wallet, dll.</p>
                                         <button onClick={onOpenWalletModal} className="btn-secondary font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">
                                            <FontAwesomeIcon icon={faLink} /> Hubungkan Dompet Lain
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
                                {currentUser.telegram_user_id ? ( <> <p className="text-xs text-green-400 mt-1">Account linked (ID: {currentUser.telegram_user_id})</p><button onClick={handleUnlinkTelegram} disabled={isTelegramConnecting} className="btn-secondary text-red-400 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">{isTelegramConnecting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />} Unlink</button></>) : (<> <p className="text-xs text-light-subtle dark:text-gray-400 mt-1">Link your Telegram via our bot to verify tasks.</p><a href="https://t.me/afaweb3tool_bot" target="_blank" rel="noopener noreferrer" className="btn-secondary font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center text-xs gap-2 mt-2"><FontAwesomeIcon icon={faLink} /><span>Link via Bot</span></a></>)}
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
