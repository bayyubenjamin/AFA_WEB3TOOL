// src/components/PageProfile.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit, faUser, faTimes, faSave, faImage, faSpinner,
    faChartSimple, faClipboardCheck, faStar, faWallet, faCopy, faLink, faUnlink,
    faSignOutAlt, faEnvelope, faLock, faShieldHalved, faGear, faCrown, faArrowUp, faIdCard,
    faTrophy, faChartLine, faUsers, faShareNodes, faClock, faLayerGroup
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram, faDiscord, faXTwitter, faEthereum, faBitcoin } from '@fortawesome/free-brands-svg-icons';
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";
import { useAccount, useDisconnect, useReadContract, useChainId } from 'wagmi';

// --- STACKS IMPORTS ---
import { useConnect } from "@stacks/connect-react";
import { stacksNetwork } from "../wagmiConfig";

// --- CONTRACT CONFIGURATION ---
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

// UPDATE: Hanya menyisakan Base Mainnet dengan Contract Baru
const contractConfig = {
    8453: { 
        address: '0x91D6e01e871598CfD88734247F164f31461D6E5A', 
        abi: AfaIdentityABI, 
        name: "Base Mainnet" 
    }
};

const getTranslations = (lang) => (lang === 'id' ? translationsId : translationsEn);

// --- HELPER COMPONENTS ---

const IdentityCard = ({ user, tokenId, isPremium, expirationDate, networkName }) => {
    return (
        <div className="relative w-full aspect-[1.58/1] rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${isPremium ? 'from-slate-900 via-yellow-900/40 to-slate-900 border-2 border-yellow-500/50' : 'from-slate-800 via-blue-900/20 to-slate-900 border border-slate-700'}`}></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEthereum} className="text-2xl text-white/80" />
                        <span className="text-xs font-mono text-white/50 tracking-widest uppercase">{networkName || 'BASE'}</span>
                    </div>
                    {isPremium ? (
                        <div className="flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/50 px-3 py-1 rounded-full backdrop-blur-md">
                            <FontAwesomeIcon icon={faCrown} className="text-yellow-400 text-xs" />
                            <span className="text-xs font-bold text-yellow-400 tracking-wider">PREMIUM</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                            <span className="text-xs font-bold text-white/70 tracking-wider">BASIC</span>
                        </div>
                    )}
                </div>
                <div className="flex items-end gap-4">
                    <div className="relative">
                        <img src={user.avatar_url || "https://via.placeholder.com/100"} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shadow-lg" />
                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                            #{tokenId ? tokenId.toString() : '---'}
                        </div>
                    </div>
                    <div className="mb-1">
                        <h3 className="text-lg font-bold text-white leading-tight">{user.name}</h3>
                        <p className="text-xs font-mono text-white/50">@{user.username}</p>
                    </div>
                </div>
                <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-2">
                    <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Valid Until</p>
                        <p className="text-sm font-mono text-white/90">
                            {expirationDate ? new Date(Number(expirationDate) * 1000).toLocaleDateString() : 'Lifetime'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">DID Protocol</p>
                        <p className="text-xs font-bold text-white/80">AFA Identity</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfileSection = ({ title, icon, children, className }) => (
    <div className={`bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 ${className}`}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-5 pb-3 border-b border-slate-200 dark:border-slate-700 flex items-center">
            <FontAwesomeIcon icon={icon} className="mr-3 text-primary" />
            {title}
        </h3>
        {children}
    </div>
);

const StatCard = ({ icon, label, value, subtext }) => (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center transition-all hover:border-primary/50 group">
        <div className="h-10 w-10 mx-auto mb-3 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
            <FontAwesomeIcon icon={icon} />
        </div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        {subtext && <p className="text-[10px] text-slate-400">{subtext}</p>}
    </div>
);

const InputField = React.memo(({ id, type = "text", label, value, onChange, icon, placeholder, parentLoading }) => (
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
        </div>
    </div>
));
InputField.displayName = 'InputField';

export default function PageProfile({ currentUser, onUpdateUser, onLogout, userAirdrops = [], onOpenWalletModal }) {
    const { language } = useLanguage();
    const t = getTranslations(language).profilePage || {};
    const isLoggedIn = !!(currentUser && currentUser.id);

    // Local State
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAvatarUrl, setEditAvatarUrl] = useState("");
    const [copySuccess, setCopySuccess] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    // Wagmi Hooks
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    // --- STACKS CONNECT HOOK ---
    const { doOpenAuth } = useConnect();
    
    // Config Derived State
    const { address: contractAddress, abi, name: networkName } = useMemo(() => {
        return contractConfig[chainId] || contractConfig[8453];
    }, [chainId]);

    // --- CONTRACT READS ---
    const { data: balance } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'balanceOf',
        args: [currentUser?.address],
        enabled: !!currentUser?.address && !!contractAddress,
    });

    const { data: tokenId } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [currentUser?.address, 0],
        enabled: !!currentUser?.address && !!balance && Number(balance) > 0,
    });

    const { data: isPremium } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'isPremium',
        args: [tokenId],
        enabled: !!tokenId,
    });

    const { data: premiumExpiration } = useReadContract({
        address: contractAddress,
        abi: abi,
        functionName: 'getPremiumExpiration',
        args: [tokenId],
        enabled: !!tokenId,
    });

    // --- LOGIC ---
    const hasNFT = balance && Number(balance) > 0;
    
    const daysRemaining = useMemo(() => {
        if (!premiumExpiration) return 0;
        const now = Math.floor(Date.now() / 1000);
        const exp = Number(premiumExpiration);
        const diff = exp - now;
        return diff > 0 ? Math.ceil(diff / (60 * 60 * 24)) : 0;
    }, [premiumExpiration]);

    const handleCopy = (text, label = "Copied!") => {
        navigator.clipboard.writeText(text);
        setCopySuccess(label);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const clearMessages = () => { setError(null); setSuccessMessage(null); };

    useEffect(() => {
        if (isLoggedIn && currentUser) {
            setEditName(currentUser.name || currentUser.username || "");
            setEditAvatarUrl(currentUser.avatar_url || "");
        }
    }, [currentUser, isLoggedIn]);

    // --- PERBAIKAN STACKS CONNECT DENGAN PERSISTENCE ---
    const handleStacksConnect = () => {
        doOpenAuth({
            appDetails: {
                name: "AFA Web3Tool",
                icon: "https://avatars.githubusercontent.com/u/37784886",
            },
            onFinish: async (data) => {
                const stxAddress = data.userSession.loadUserData().profile.stxAddress.mainnet;
                setLoading(true);
                try {
                    // Update ke Supabase menggunakan kolom baru 'stacks_address'
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ 
                            stacks_address: stxAddress,
                            updated_at: new Date()
                        })
                        .eq('id', currentUser.id);

                    if (updateError) throw updateError;

                    // Update state lokal agar UI langsung berubah tanpa refresh
                    onUpdateUser({ 
                        ...currentUser, 
                        stacks_address: stxAddress 
                    });
                    
                    setSuccessMessage("Stacks Wallet Linked Successfully!");
                } catch (err) {
                    setError("Failed to save Stacks wallet: " + err.message);
                    console.error("Supabase Error:", err);
                } finally {
                    setLoading(false);
                }
            },
            onCancel: () => {
                console.log("Koneksi dibatalkan");
            },
        });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        clearMessages();
        setLoading(true);
        try {
            const profileUpdate = {
                name: editName,
                username: editName, 
                avatar_url: editAvatarUrl,
                updated_at: new Date()
            };

            const { data, error: updateError } = await supabase
                .from('profiles')
                .update(profileUpdate)
                .eq('id', currentUser.id)
                .select()
                .single();

            if (updateError) throw updateError;

            const updatedUserMap = {
                ...currentUser,
                name: data.name || data.username,
                avatar_url: data.avatar_url,
                username: data.username
            };
            onUpdateUser(updatedUserMap);
            
            setSuccessMessage(t.profileUpdateSuccess || "Profile updated successfully!");
            setTimeout(() => setShowEditProfileModal(false), 1500);
        } catch (err) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn) return <div className="p-10 text-center">Please Log In</div>;

    return (
        <section className="page-content py-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="sticky top-24">
                        {hasNFT ? (
                            <IdentityCard 
                                user={currentUser} 
                                tokenId={tokenId} 
                                isPremium={isPremium} 
                                expirationDate={premiumExpiration}
                                networkName={networkName}
                            />
                        ) : (
                            <div className="w-full aspect-[1.58/1] rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-6">
                                <FontAwesomeIcon icon={faIdCard} className="text-4xl text-slate-400 mb-3" />
                                <p className="text-sm font-bold text-slate-500">No Identity Found</p>
                                <Link to="/identity" className="mt-3 text-xs btn-primary px-4 py-2 rounded-full">Mint Now</Link>
                            </div>
                        )}

                        <div className="mt-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subscription Status</span>
                                {isPremium ? (
                                    <span className={`text-xs font-bold ${daysRemaining < 3 ? 'text-red-500' : 'text-green-500'}`}>
                                        {daysRemaining} Days Left
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400">Inactive</span>
                                )}
                            </div>
                            
                            {isPremium && (
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mb-4 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${daysRemaining < 7 ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{ width: `${Math.min((daysRemaining / 30) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            )}

                            <Link to="/identity" className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isPremium ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white' : 'btn-primary text-white shadow-lg shadow-primary/30'}`}>
                                {isPremium ? (
                                    <><FontAwesomeIcon icon={faClock} /> Extend Duration</>
                                ) : (
                                    <><FontAwesomeIcon icon={faCrown} /> Upgrade to Premium</>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                                Welcome back, {currentUser.name}!
                            </h1>
                            <div className="flex items-center gap-3 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                <span>@{currentUser.username}</span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                <span className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleCopy(currentUser.address)}>
                                    <FontAwesomeIcon icon={faWallet} className="text-xs" />
                                    {currentUser.address ? `${currentUser.address.slice(0,6)}...${currentUser.address.slice(-4)}` : 'No Wallet'}
                                </span>
                                {copySuccess && <span className="text-green-500 text-xs font-bold">{copySuccess}</span>}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { clearMessages(); setShowEditProfileModal(true); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <FontAwesomeIcon icon={faEdit} className="mr-2" /> Edit Profile
                            </button>
                            <button onClick={onLogout} className="px-4 py-2 border border-red-500/30 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                                <FontAwesomeIcon icon={faSignOutAlt} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={faStar} label="Points Earned" value={currentUser.stats?.points || 0} subtext="Total accumulation" />
                        <StatCard icon={faTrophy} label="Rank" value="#42" subtext="Top 5% Global" />
                        <StatCard icon={faUsers} label="Referrals" value="12" subtext="+240 Points" />
                        <StatCard icon={faClipboardCheck} label="Tasks Done" value={userAirdrops.length} subtext="Last 30 Days" />
                    </div>

                    <ProfileSection title="Referral Program" icon={faShareNodes} className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-grow">
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                    Invite friends to mint their AFA Identity and earn <span className="font-bold text-primary">10% of their subscription fees</span> directly to your wallet.
                                </p>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input 
                                            readOnly 
                                            value={`https://afa-web3.com/ref/${currentUser.username}`} 
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 focus:outline-none"
                                        />
                                        <button 
                                            onClick={() => handleCopy(`https://afa-web3.com/ref/${currentUser.username}`, "Link Copied!")}
                                            className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-primary"
                                        >
                                            <FontAwesomeIcon icon={faCopy} />
                                        </button>
                                    </div>
                                    <button className="bg-[#1DA1F2] text-white px-4 rounded-lg hover:bg-[#1a91da]">
                                        <FontAwesomeIcon icon={faXTwitter} />
                                    </button>
                                    <button className="bg-[#0088cc] text-white px-4 rounded-lg hover:bg-[#0077b5]">
                                        <FontAwesomeIcon icon={faTelegram} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-center px-4 border-l border-slate-200 dark:border-slate-700 hidden md:block">
                                <p className="text-3xl font-bold text-slate-800 dark:text-white">0.05 ETH</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Earnings</p>
                            </div>
                        </div>
                    </ProfileSection>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {/* UPDATE: WALLET MANAGEMENT SEKARANG MENAMPILKAN KEDUANYA */}
                        <ProfileSection title="Wallet Management" icon={faWallet}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">
                                {/* PRIMARY WALLET (EVM) */}
                                <div className="text-center relative md:border-r border-slate-200 dark:border-slate-700 md:pr-4">
                                    <div className="mb-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-400">
                                            <FontAwesomeIcon icon={faEthereum} className="text-2xl" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Primary Wallet (Base)</p>
                                        <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded-lg mx-auto max-w-[240px]">
                                            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                                {currentUser.address || "No wallet connected"}
                                            </p>
                                            {currentUser.address && (
                                                <button onClick={() => handleCopy(currentUser.address)} className="text-slate-400 hover:text-primary">
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {currentUser.address ? (
                                        <button onClick={onOpenWalletModal} className="w-full md:w-auto px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                            Change Wallet
                                        </button>
                                    ) : (
                                        <button onClick={onOpenWalletModal} className="w-full md:w-auto px-6 btn-primary py-2 rounded-lg text-sm shadow-lg shadow-primary/30">
                                            Connect EVM Wallet
                                        </button>
                                    )}
                                </div>

                                {/* SECONDARY WALLET (STACKS) */}
                                <div className="text-center md:pl-4">
                                    <div className="mb-4">
                                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 dark:text-orange-400 font-bold">
                                            STX
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Secondary Wallet (Stacks)</p>
                                        <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded-lg mx-auto max-w-[240px]">
                                            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                                {currentUser.stacks_address || "Not connected"}
                                            </p>
                                            {currentUser.stacks_address && (
                                                <button onClick={() => handleCopy(currentUser.stacks_address)} className="text-slate-400 hover:text-primary">
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {currentUser.stacks_address ? (
                                        <button 
                                            onClick={handleStacksConnect} 
                                            disabled={loading}
                                            className="w-full md:w-auto px-6 py-2 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                        >
                                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Update Stacks Wallet"}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleStacksConnect} 
                                            disabled={loading}
                                            className="w-full md:w-auto px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm shadow-lg shadow-orange-500/30 transition-colors"
                                        >
                                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Connect Stacks"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </ProfileSection>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <ProfileSection title="Connected Accounts" icon={faShieldHalved}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-100 text-blue-500 flex items-center justify-center"><FontAwesomeIcon icon={faEnvelope}/></div>
                                        <div className="text-sm">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Email</p>
                                            <p className="text-xs text-slate-500">{currentUser.email ? "Linked" : "Not Linked"}</p>
                                        </div>
                                    </div>
                                    {currentUser.email && <span className="text-xs text-green-500 font-bold"><FontAwesomeIcon icon={faShieldHalved}/></span>}
                                </div>
                                
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-sky-100 text-sky-500 flex items-center justify-center"><FontAwesomeIcon icon={faTelegram}/></div>
                                        <div className="text-sm">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Telegram</p>
                                            <p className="text-xs text-slate-500">{currentUser.telegram_user_id ? "Linked" : "Not Linked"}</p>
                                        </div>
                                    </div>
                                    {!currentUser.telegram_user_id && (
                                        <a href="https://t.me/afaweb3tool_bot" className="text-xs text-primary hover:underline">Link</a>
                                    )}
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-orange-100 text-orange-500 flex items-center justify-center font-bold">ST</div>
                                        <div className="text-sm">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Stacks</p>
                                            <p className="text-xs text-slate-500">{currentUser.stacks_address ? "Linked" : "Not Linked"}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleStacksConnect} 
                                        disabled={loading}
                                        className={`text-xs font-bold hover:underline ${currentUser.stacks_address ? 'text-green-500' : 'text-primary'}`}
                                    >
                                        {currentUser.stacks_address ? 'Update' : 'Link'}
                                    </button>
                                </div>
                            </div>
                        </ProfileSection>
                    </div>

                </div>
            </div>

            {/* Modal Edit Profile */}
            {showEditProfileModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="modal-content bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                                <FontAwesomeIcon icon={faEdit} className="mr-3 text-primary" /> 
                                {t.editProfileModalTitle || "Edit Profile"}
                            </h3>
                            <button disabled={loading} onClick={() => setShowEditProfileModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white text-2xl transition-colors">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {(error || successMessage) && (
                            <div className={`p-3 mb-4 text-sm rounded-lg text-center border ${error ? 'text-red-300 bg-red-800/50 border-red-800' : 'text-green-300 bg-green-800/50 border-green-800'}`}>
                                {error || successMessage}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <InputField 
                                id="editName" 
                                label={t.editProfileLabelName || "Name"} 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                icon={faUser} 
                                parentLoading={loading} 
                            />
                            <InputField 
                                id="editAvatarUrl" 
                                label={t.editProfileLabelAvatar || "Avatar URL"} 
                                value={editAvatarUrl} 
                                onChange={(e) => setEditAvatarUrl(e.target.value)} 
                                icon={faImage} 
                                parentLoading={loading} 
                            />
                            
                            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                                <button 
                                    disabled={loading} 
                                    type="button" 
                                    onClick={() => setShowEditProfileModal(false)} 
                                    className="btn-secondary px-6 py-2.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    {t.editProfileBtnCancel || "Cancel"}
                                </button>
                                <button 
                                    disabled={loading} 
                                    type="submit" 
                                    className="btn-primary text-white px-6 py-2.5 rounded-lg text-sm flex items-center shadow-lg shadow-primary/30"
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />} 
                                    {t.editProfileBtnSave || "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
