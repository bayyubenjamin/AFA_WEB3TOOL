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
    const handleLinkAfaWallet = useCallback(async (walletAddress) => {
        if (!walletAddress || !currentUser?.id) return;
        setIsWalletActionLoading(true);
        clearMessages();
        try {
            const lowerCaseAddress = walletAddress.toLowerCase();
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

    const handleActivateSmartWallet = () => {
        clearMessages();
        const smartWalletConnector = connectors.find((c) => c.id === 'coinbaseWalletSDK');
        if (smartWalletConnector) {
            // Memanggil `connect` dengan callback untuk memastikan hanya hasil dari
            // koneksi ini yang akan ditautkan.
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
            
            // Logika penting: Hanya disconnect dari wagmi jika dompet yang sedang aktif
            // adalah AFA Wallet yang sama.
            if (isConnected && address?.toLowerCase() === currentUser.address?.toLowerCase()) {
                disconnect();
            }
        } catch (err) {
            setError(err.message || "Gagal memutuskan tautan dompet.");
        } finally {
            setIsWalletActionLoading(false);
        }
    };

    const handleUnlinkTelegram = async () => { /* ... (kode tidak berubah) ... */ };
    const handleLinkEmailPassword = async (e) => { /* ... (kode tidak berubah) ... */ };

    // Hapus `useEffect` yang menautkan dompet secara otomatis.
    // Penautan sekarang hanya terjadi secara eksplisit melalui `handleActivateSmartWallet`.

    useEffect(() => {
        if (isLoggedIn && currentUser) {
            setEditName(currentUser.name || currentUser.username || "");
            setEditAvatarUrl(currentUser.avatar_url || "");
        }
    }, [currentUser, isLoggedIn]);

    if (!isLoggedIn) { /* ... (kode tidak berubah) ... */ }

    const handleUpdateProfile = async (e) => { /* ... (kode tidak berubah) ... */ };
    const handleOpenEditProfileModal = () => { /* ... (kode tidak berubah) ... */ };
    const handleCloseEditProfileModal = () => { /* ... (kode tidak berubah) ... */ };
    const handleCopyToClipboard = (text) => { /* ... (kode tidak berubah) ... */ };
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
                
                {/* KARTU PROFIL UTAMA (TIDAK DIUBAH) */}
                <div className={`card relative rounded-xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6 ${hasNFT && isPremium ? 'bg-gradient-to-br from-yellow-100/20 to-amber-200/20 dark:from-yellow-800/20 dark:to-amber-900/30 border-yellow-500/50 shadow-yellow-500/20' : ''}`}>
                    {/* ... (isi kartu profil tidak berubah) ... */}
                </div>

                {/* --- KARTU BARU KHUSUS UNTUK AFA WALLET --- */}
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

                {/* KARTU AKTIVITAS (TIDAK DIUBAH) */}
                <div className="card rounded-xl p-6 md:p-8 shadow-xl">
                     {/* ... (isi kartu aktivitas tidak berubah) ... */}
                </div>
            </div>

            {/* --- SIDEBAR KONEKSI --- */}
            <div className="lg:col-span-1">
                <div className="card rounded-xl p-6 md:p-8 shadow-xl sticky top-24">
                    <h3 className="text-xl md:text-2xl font-semibold mb-5 text-light-text dark:text-white border-b border-black/10 dark:border-white/10 pb-3 flex items-center">
                        <FontAwesomeIcon icon={faShieldHalved} className="mr-3 text-primary" /> Account Connections
                    </h3>
                    <ul className="space-y-4">
                        {/* BAGIAN EMAIL & PASSWORD (TIDAK DIUBAH) */}
                        <li className="flex items-start gap-4">
                            {/* ... (isi tidak berubah) ... */}
                        </li>
                        
                        {/* --- BAGIAN DOMPET EKSTERNAL (LOGIKA DIUBAH TOTAL) --- */}
                        <li className="flex items-start gap-4">
                             <div className="bg-purple-500/10 text-purple-400 h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center">
                                 <FontAwesomeIcon icon={faWallet} />
                             </div>
                             <div className="flex-grow">
                                 <h4 className="font-semibold text-light-text dark:text-white">Dompet Eksternal</h4>
                                 {isConnected && address?.toLowerCase() !== currentUser.address?.toLowerCase() ? (
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

                        {/* BAGIAN TELEGRAM (TIDAK DIUBAH) */}
                        <li className="flex items-start gap-4">
                            {/* ... (isi tidak berubah) ... */}
                        </li>
                    </ul>
                </div>
            </div>
            {/* MODAL EDIT PROFIL (TIDAK DIUBAH) */}
            {showEditProfileModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    {/* ... (isi modal tidak berubah) ... */}
                </div>
            )}
        </section>
    );
}
