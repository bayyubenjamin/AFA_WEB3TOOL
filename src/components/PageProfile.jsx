// src/components/PageProfile.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit, faUser, faTimes, faSave, faImage, faSpinner,
    faChartSimple, faClipboardCheck, faStar, faWallet, faCopy, faTasks, faLink, faUnlink,
    faSignOutAlt, faSignInAlt, faEnvelope, faLock, faShieldHalved, faGear, faCrown, faArrowUp, faIdCard,
    faTrophy, faChartLine, faUsers
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram, faDiscord, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useAccount, useDisconnect, useReadContract, useChainId } from 'wagmi';

// --- LOGIKA YANG SUDAH ADA (TIDAK DIUBAH) ---
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

const contractConfig = {
    11155420: { // OP Sepolia
        address: '0x8611E3C3F991C989fEF0427998062f77c9D0A2F1',
        abi: AfaIdentityABI
    },
    84532: { // Base Sepolia
        address: '0x36b1e78A718D77Cae16E1922Baaea2a555f77dcf',
        abi: AfaIdentityABI
    }
};

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// --- KOMPONEN BARU / DIDESAIN ULANG ---

const ProfileSection = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-5 pb-3 border-b border-slate-200 dark:border-slate-700 flex items-center">
            <FontAwesomeIcon icon={icon} className="mr-3 text-primary" />
            {title}
        </h3>
        {children}
    </div>
);

const InputField = React.memo(({ id, type = "text", label, value, onChange, icon, placeholder, children, parentLoading }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={icon} className="text-slate-400 dark:text-slate-500" />
            </div>
            <input
                disabled={parentLoading}
                type={type}
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2.5 px-3 rounded-lg pl-10 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all disabled:opacity-50"
            />
            {children}
        </div>
    </div>
));
InputField.displayName = 'InputField';

const StatCard = ({ icon, label, value }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
        <FontAwesomeIcon icon={icon} className="text-primary text-2xl mb-2" />
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{label}</p>
    </div>
);

const ConnectionItem = ({ icon, bgColor, textColor, title, children }) => (
    <li className="flex items-start gap-4">
        <div className={`h-11 w-11 flex-shrink-0 rounded-lg flex items-center justify-center ${bgColor} ${textColor}`}>
            <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
        <div className="flex-grow">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">{title}</h4>
            {children}
        </div>
    </li>
);

// --- [BARU] Komponen untuk Kontak Media Sosial ---
const SocialLink = ({ icon, href, name, colorClass }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center h-12 w-12 rounded-full transition-all duration-300 transform hover:scale-110 ${colorClass}`}>
      <FontAwesomeIcon icon={icon} className="text-2xl" />
    </a>
  );

// --- [BARU] Komponen untuk Progress Bar Kelengkapan Profil ---
const ProfileCompletion = ({ user, isDummyEmail }) => {
    const completion = useMemo(() => {
        let score = 0;
        const total = 3;
        if (!isDummyEmail) score++;
        if (user.address) score++;
        if (user.telegram_user_id) score++;
        return Math.round((score / total) * 100);
    }, [user, isDummyEmail]);

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Profile Completion</p>
                <p className="text-xs font-bold text-primary">{completion}%</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${completion}%` }}></div>
            </div>
        </div>
    );
};

const FutureFeatureCard = ({ icon, title, description }) => (
    <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center justify-center">
        <FontAwesomeIcon icon={icon} className="text-3xl text-slate-400 dark:text-slate-500 mb-3" />
        <h4 className="font-bold text-slate-500 dark:text-slate-400">{title}</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
    </div>
);


export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [], onOpenWalletModal }) {
    // --- SEMUA LOGIKA, STATE, DAN HOOKS DI BAWAH INI TETAP SAMA, TIDAK DIUBAH ---
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

    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
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

    const handleLinkWallet = useCallback(async () => {
        if (!address || !currentUser?.id) return;
        setIsWalletActionLoading(true);
        clearMessages();
        try {
            const lowerCaseAddress = address.toLowerCase();
            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('web3_address', lowerCaseAddress)
                .single();
            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            if (existingProfile && existingProfile.id !== currentUser.id) throw new Error("Dompet ini sudah ditautkan ke akun lain.");
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
            setError(err.message || (t.linkWalletError || "Failed to link wallet."));
        } finally {
            setIsWalletActionLoading(false);
            disconnect();
        }
    }, [address, currentUser, onUpdateUser, disconnect, clearMessages, t]);

    const handleUnlinkWallet = async () => {
        if (!window.confirm("Are you sure you want to unlink this wallet?")) return;
        setIsWalletActionLoading(true);
        clearMessages();
        try {
            const { error: updateError } = await supabase.from('profiles').update({ web3_address: null }).eq('id', currentUser.id);
            if (updateError) throw updateError;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Session not found, please log in again.");
            const { data: refreshedProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
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
            const { error: updateError } = await supabase.from('profiles').update({ telegram_user_id: null }).eq('id', currentUser.id);
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
        if (!newEmail || !newPassword) { setError("Please fill in a new email and password."); return; }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters long."); return; }
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

    const isDummyEmail = currentUser?.email?.endsWith('@telegram.user') || currentUser?.email?.endsWith('@wallet.afa-web3.com');

    if (!isLoggedIn) {
        return (
            <div className="page-content flex flex-col items-center justify-center text-center h-full pt-20">
                <FontAwesomeIcon icon={faSignInAlt} size="3x" className="mb-4 text-primary" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">You Are Not Logged In</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">Please log in to view and manage your profile.</p>
                <Link to="/login" className="btn-primary px-8 py-2">Go to Login Page</Link>
            </div>
        );
    }

    const handleUpdateProfile = async (e) => { e.preventDefault(); clearMessages(); setLoading(true); try { const profileUpdate = { name: editName, username: editName, avatar_url: editAvatarUrl, updated_at: new Date() }; const { data, error: updateError } = await supabase.from('profiles').update(profileUpdate).eq('id', currentUser.id).select().single(); if (updateError) throw updateError; onUpdateUser(mapSupabaseDataToAppUser(currentUser, data)); setSuccessMessage(t.profileUpdateSuccess || "Profile updated successfully!"); setShowEditProfileModal(false); } catch (err) { setError(err.message || "Failed to update profile."); } finally { setLoading(false); } };
    const handleOpenEditProfileModal = () => { clearMessages(); setShowEditProfileModal(true); };
    const handleCloseEditProfileModal = () => setShowEditProfileModal(false);
    const handleCopyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => { setCopySuccess('Copied!'); setTimeout(() => setCopySuccess(''), 2000); }, () => { setCopySuccess('Failed'); }); };
    const activeAirdropsCount = userAirdrops.filter(item => item.status === 'inprogress').length;
    
    // --- STRUKTUR JSX YANG DIROMBAK TOTAL ---
    return (
        <section className="page-content grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 py-6 md:py-10">
            
            <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
                {(error || successMessage) && (
                    <div className={`w-full p-4 text-sm rounded-lg text-center ${error ? 'text-red-300 bg-red-800/50' : 'text-green-300 bg-green-800/50'}`}>
                        {error || successMessage}
                    </div>
                )}
                
                <div className={`relative bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-tr from-transparent to-primary/10 opacity-50 transition-opacity duration-500 ${hasNFT && isPremium ? 'dark:to-yellow-500/10' : 'dark:to-primary/10'}`}></div>
                    <div className="relative z-10">
                        <div className="absolute top-4 right-4" ref={settingsMenuRef}>
                            <button onClick={() => setIsSettingsOpen(p => !p)} className="h-10 w-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-colors" aria-label="Profile Settings">
                                <FontAwesomeIcon icon={faGear} />
                            </button>
                            <div className={`options-menu ${isSettingsOpen ? 'active' : ''}`}>
                                <ul>
                                    <li onClick={() => { handleOpenEditProfileModal(); setIsSettingsOpen(false); }}><FontAwesomeIcon icon={faEdit} /> {t.editProfileBtnSave || 'Edit Profile'}</li>
                                    <li onClick={() => { onLogout(); setIsSettingsOpen(false); }} className="text-red-500 dark:text-red-400"><FontAwesomeIcon icon={faSignOutAlt} /> {t.logoutBtn || 'Logout'}</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <img src={currentUser.avatar_url} alt="User Avatar" className={`w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 shadow-lg ${hasNFT && isPremium ? 'border-yellow-400' : 'border-primary/50'}`} />
                            <div className="flex-grow text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</h2>
                                    {hasNFT && (isPremium ? (
                                            <div className="flex items-center gap-1 text-xs font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full"><FontAwesomeIcon icon={faCrown} /><span>PREMIUM</span></div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full"><span>BASIC</span></div>
                                        )
                                    )}
                                </div>
                                <p className="text-md text-slate-500 dark:text-slate-400">@{currentUser.username}</p>
                                {currentUser.address && (
                                    <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                                        <FontAwesomeIcon icon={faWallet} className="text-green-400" />
                                        <p className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all">{`${currentUser.address.substring(0, 6)}...${currentUser.address.substring(currentUser.address.length - 4)}`}</p>
                                        <button onClick={() => handleCopyToClipboard(currentUser.address)} title={copySuccess || 'Copy address'} className="text-slate-400 dark:text-slate-500 hover:text-primary transition-colors text-xs"><FontAwesomeIcon icon={faCopy}/></button>
                                    </div>
                                )}
                                {/* --- [BARU] Profile Completion --- */}
                                <ProfileCompletion user={currentUser} isDummyEmail={isDummyEmail} />
                            </div>
                        </div>
                         <div className="mt-6 text-center md:text-left">
                            {!hasNFT ? (
                                <Link to="/identity" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-transform transform hover:scale-105"><FontAwesomeIcon icon={faIdCard}/> Mint AFA Identity</Link>
                            ) : ( !isPremium && (
                                <Link to="/identity" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-transform transform hover:scale-105"><FontAwesomeIcon icon={faArrowUp}/> Upgrade to Premium</Link>
                            ))}
                        </div>
                    </div>
                </div>

                <ProfileSection title="Your Activity" icon={faChartLine}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                        <StatCard label={t.statPoints} value={currentUser.stats?.points || 0} icon={faStar} />
                        <StatCard label={t.statAirdropsClaimed} value={currentUser.stats?.airdropsClaimed || 0} icon={faClipboardCheck} />
                        <StatCard label={"NFT"} value={hasNFT ? 1 : 0} icon={faImage} />
                        <StatCard label={t.statActiveTasks} value={activeAirdropsCount} icon={faTasks} />
                    </div>
                </ProfileSection>

                <ProfileSection title="Coming Soon" icon={faGear}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FutureFeatureCard icon={faTrophy} title="Achievements" description="Unlock badges for your on-chain activities." />
                        <FutureFeatureCard icon={faChartSimple} title="Reputation Score" description="Build your Web3 reputation with every action." />
                    </div>
                </ProfileSection>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6 md:gap-8">
                <div className="sticky top-24 flex flex-col gap-6 md:gap-8">
                    <ProfileSection title="Account Connections" icon={faShieldHalved}>
                        <ul className="space-y-6">
                            <ConnectionItem icon={faEnvelope} bgColor="bg-blue-100 dark:bg-blue-500/10" textColor="text-blue-500 dark:text-blue-400" title="Email & Password">
                                {isDummyEmail ? (
                                    <>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">Your account is not secured with an email. Add one to enable traditional login.</p>
                                        <form onSubmit={handleLinkEmailPassword} className="space-y-3"><InputField id="new_email" type="email" label="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} icon={faEnvelope} placeholder="your.email@example.com" parentLoading={isLinkingEmail} /><InputField id="new_password" type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={faLock} placeholder="Minimum 6 characters" parentLoading={isLinkingEmail} /><button type="submit" disabled={isLinkingEmail} className="btn-secondary w-full py-2 text-sm">{isLinkingEmail ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Save & Secure Account'}</button></form>
                                    </>
                                ) : (<p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">Account is secured.</p>)}
                            </ConnectionItem>
                            <ConnectionItem icon={faWallet} bgColor="bg-purple-100 dark:bg-purple-500/10" textColor="text-purple-500 dark:text-purple-400" title="Wallet">
                                {currentUser.address ? (
                                    <>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Wallet is connected.</p>
                                        <button onClick={handleUnlinkWallet} disabled={isWalletActionLoading} className="btn-secondary text-red-500 border-red-500/20 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">{isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />} Unlink</button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Link your wallet to participate in events and claim rewards.</p>
                                        <button onClick={onOpenWalletModal} disabled={isWalletActionLoading} className="btn-secondary font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">{isWalletActionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faLink} />} Link Wallet</button>
                                    </>
                                )}
                            </ConnectionItem>
                            <ConnectionItem icon={faTelegram} bgColor="bg-sky-100 dark:bg-sky-500/10" textColor="text-sky-500 dark:text-sky-400" title="Telegram">
                                {currentUser.telegram_user_id ? (
                                    <>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Account linked (ID: {currentUser.telegram_user_id})</p>
                                        <button onClick={handleUnlinkTelegram} disabled={isTelegramConnecting} className="btn-secondary text-red-500 border-red-500/20 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center text-xs gap-2 mt-2">{isTelegramConnecting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUnlink} />} Unlink</button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Link your Telegram via our bot to verify tasks.</p>
                                        <a href="https://t.me/afaweb3tool_bot" target="_blank" rel="noopener noreferrer" className="btn-secondary font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center text-xs gap-2 mt-2"><FontAwesomeIcon icon={faLink} /><span>Link via Bot</span></a>
                                    </>
                                )}
                            </ConnectionItem>
                        </ul>
                    </ProfileSection>

                    {/* --- [BARU] Kartu Join Our Community --- */}
                    <ProfileSection title="Join Our Community" icon={faUsers}>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Stay connected, get real-time alpha, and join the conversation on your favorite platforms.</p>
                        <div className="flex justify-center items-center space-x-4">
                            <SocialLink icon={faTelegram} name="Telegram" href="https://t.me/Airdrop4ll" colorClass="bg-sky-100 dark:bg-sky-500/10 text-sky-500 dark:text-sky-400 hover:bg-sky-200" />
                            <SocialLink icon={faDiscord} name="Discord" href="https://discord.gg/7ptA7jy8" colorClass="bg-indigo-100 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-200" />
                            <SocialLink icon={faXTwitter} name="X.com" href="https://x.com/bayybayss" colorClass="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300" />
                        </div>
                    </ProfileSection>
                </div>
            </div>

            {showEditProfileModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="modal-content bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 flex items-center"><FontAwesomeIcon icon={faEdit} className="mr-3 text-primary" /> {t.editProfileModalTitle}</h3>
                            <button disabled={loading} onClick={handleCloseEditProfileModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white text-2xl"><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        {error && <div className="p-3 mb-3 text-sm text-red-300 bg-red-800/50 rounded-lg text-center">{error}</div>}
                        {successMessage && !error && <div className="p-3 mb-3 text-sm text-green-300 bg-green-800/50 rounded-lg text-center">{successMessage}</div>}
                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <InputField id="editName" label={t.editProfileLabelName} value={editName} onChange={(e) => setEditName(e.target.value)} icon={faUser} parentLoading={loading} />
                            <InputField id="editAvatarUrl" label={t.editProfileLabelAvatar} value={editAvatarUrl} onChange={(e) => setEditAvatarUrl(e.target.value)} icon={faImage} parentLoading={loading} />
                            <div className="flex justify-end gap-4 pt-4">
                                <button disabled={loading} type="button" onClick={handleCloseEditProfileModal} className="btn-secondary px-6 py-2.5 rounded-lg text-sm">{t.editProfileBtnCancel}</button>
                                <button disabled={loading} type="submit" className="btn-primary text-white px-6 py-2.5 rounded-lg text-sm flex items-center">{loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />} {t.editProfileBtnSave}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
