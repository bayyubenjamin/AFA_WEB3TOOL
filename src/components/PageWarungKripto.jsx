import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStore, faCoins, faMoneyBillWave, faArrowRightArrowLeft, faCheckCircle,
    faShieldAlt, faWallet, faUpload, faGasPump, faBolt, faSpinner,
    faExclamationTriangle, faHistory, faCogs, faCopy, faReceipt, faQuestionCircle,
    faAngleDown, faAngleUp, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import PageAdminWarung from './PageAdminWarung';

const MIN_TRANSACTION_IDR = 10000;
const CACHE_DURATION_MINUTES = 5;

// --- Komponen-komponen Kecil (Helper) ---

const BenefitCard = ({ icon, title, children }) => (
    <div className="bg-light-card/80 dark:bg-dark-card/50 border border-light-border dark:border-dark-border p-4 rounded-xl flex items-start gap-4 backdrop-blur-sm">
        <FontAwesomeIcon icon={icon} className="text-primary text-xl mt-1" />
        <div>
            <h4 className="font-bold text-light-text dark:text-dark-text">{title}</h4>
            <p className="text-sm text-light-subtle dark:text-dark-subtle">{children}</p>
        </div>
    </div>
);

const TransactionHistoryItem = ({ tx }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [adminProofUrl, setAdminProofUrl] = useState(null);
    const [isLoadingProof, setIsLoadingProof] = useState(false);

    const statusMap = {
        PENDING: { text: 'Menunggu', color: 'bg-yellow-500/10 text-yellow-400', icon: faSpinner },
        WAITING_CONFIRMATION: { text: 'Diproses', color: 'bg-blue-500/10 text-blue-400', icon: faSpinner },
        COMPLETED: { text: 'Selesai', color: 'bg-green-500/10 text-green-400', icon: faCheckCircle },
        REJECTED: { text: 'Ditolak', color: 'bg-red-500/10 text-red-400', icon: faExclamationTriangle },
    };
    
    const status = statusMap[tx.status] || { text: tx.status, color: 'bg-gray-500/10 text-gray-400', icon: faQuestionCircle };
    const isBuy = tx.order_type === 'buy';

    const getAdminProof = async () => {
        if (!tx.admin_proof_url) return;
        setIsLoadingProof(true);
        try {
            const { data, error } = await supabase.storage.from('adminbuktibayar').createSignedUrl(tx.admin_proof_url, 300);
            if (error) console.error("Gagal membuat signed URL", error);
            else setImageUrl(data.signedUrl);
        } catch (error) {
            console.error("Gagal mengambil bukti dari admin:", error);
        } finally {
            setIsLoadingProof(false);
        }
    };

    const handleToggleExpand = () => {
        const newIsExpanded = !isExpanded;
        setIsExpanded(newIsExpanded);
        if (newIsExpanded && !isBuy && tx.admin_proof_url) {
            getAdminProof();
        }
    };

    return (
        <div className="border-b border-light-border dark:border-dark-border last:border-b-0">
            <button onClick={handleToggleExpand} className="w-full text-left p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <FontAwesomeIcon icon={isBuy ? faBolt : faMoneyBillWave} className={`text-lg ${isBuy ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                            <span className="font-bold text-sm text-light-text dark:text-dark-text capitalize">{tx.order_type} {tx.token_symbol}</span>
                            <span className="block text-xs text-light-subtle dark:text-dark-subtle">{new Date(tx.created_at).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center justify-center gap-2 ${status.color}`}>
                            <FontAwesomeIcon icon={status.icon} className={status.text === 'Diproses' || status.text === 'Menunggu' ? 'animate-spin' : ''} />
                            {status.text}
                        </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <span className={`font-mono text-sm ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                            {isBuy ? '+' : '-'} {Number(tx.amount_crypto).toFixed(5)} {tx.token_symbol}
                        </span>
                        <FontAwesomeIcon icon={isExpanded ? faAngleUp : faAngleDown} className="text-light-subtle dark:text-dark-subtle" />
                    </div>
                </div>
            </button>
            {isExpanded && (
                <div className="bg-black/5 dark:bg-black/20 p-4 text-xs space-y-2 text-light-text dark:text-dark-subtle">
                    <p><strong>ID Transaksi:</strong> <span className="font-mono">{tx.id}</span></p>
                    <p><strong>Jumlah Rupiah:</strong> <span className="font-mono">Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</span></p>
                    {isBuy ? (
                        <p><strong>Dikirim ke Wallet:</strong> <span className="font-mono break-all">{tx.user_wallet_address}</span></p>
                    ) : (
                        <>
                            <p><strong>Info Pembayaran Anda:</strong> <span className="font-mono break-all">{tx.user_payment_info}</span></p>
                            {tx.status === 'COMPLETED' && (
                                <p><strong>Bukti dari Admin:</strong> 
                                    {isLoadingProof ? <span className="ml-2">Memuat...</span> : 
                                        adminProofUrl ? <a href={adminProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">Lihat Bukti Transfer <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> 
                                        : <span className="ml-2">{tx.admin_proof_url ? 'Tidak ada' : 'Tidak ada'}</span>}
                                </p>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// --- KOMPONEN UTAMA ---
export default function PageWarungKripto({ currentUser }) {
    const [view, setView] = useState('user');
    const [activeTab, setActiveTab] = useState('buy');
    
    const [groupedByNetwork, setGroupedByNetwork] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const [selectedCoin, setSelectedCoin] = useState(null);
    
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState(0);
    const [walletAddress, setWalletAddress] = useState('');
    const [userPaymentInfo, setUserPaymentInfo] = useState({ fullName: '', method: '', details: '' });
    const [adminPaymentMethods, setAdminPaymentMethods] = useState([]);
    
    const [showInstructionPage, setShowInstructionPage] = useState(false);
    const [proof, setProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [userTransactions, setUserTransactions] = useState([]);

    const setRatesAndGroupData = (ratesData) => {
        if (ratesData && ratesData.length > 0) {
            const groups = ratesData.reduce((acc, coin) => {
                const network = coin.network;
                // Pastikan acc[network] adalah objek dengan properti 'coins' dan 'network_icon'
                if (!acc[network]) { 
                    acc[network] = { 
                        coins: [], 
                        network_icon: coin.network_icon || null // Ambil network_icon dari koin
                    }; 
                }
                acc[network].coins.push(coin);
                return acc;
            }, {});
            setGroupedByNetwork(groups);

            // MODIFIKASI: Inisialisasi selectedNetwork dan selectedCoin dengan lebih aman
            if (Object.keys(groups).length > 0) {
                const firstNetwork = Object.keys(groups)[0];
                const coinsInFirstNetwork = groups[firstNetwork].coins;

                if (coinsInFirstNetwork && coinsInFirstNetwork.length > 0) {
                    setSelectedNetwork(firstNetwork);
                    setSelectedCoin(coinsInFirstNetwork[0]);
                } else {
                    // Jika jaringan pertama tidak memiliki koin aktif
                    setSelectedNetwork('');
                    setSelectedCoin(null);
                    setError("Tidak ada koin aktif yang tersedia di jaringan ini.");
                }
            } else {
                // Jika tidak ada jaringan sama sekali (misal: ratesData kosong)
                setSelectedNetwork('');
                setSelectedCoin(null);
                setError("Warung sedang tutup atau belum ada koin yang tersedia.");
            }
        } else {
            // Jika ratesData itu sendiri kosong atau null
            setGroupedByNetwork({});
            setSelectedNetwork('');
            setSelectedCoin(null);
            setError("Warung sedang tutup atau belum ada koin yang tersedia.");
        }
    };

    const fetchData = useCallback(async (bypassCache = false) => {
        if (!currentUser || !currentUser.id) { setIsLoading(false); return; }

        const cacheKey = `warungData_${currentUser.id}`;
        let cachedData = null;

        if (!bypassCache) {
            try {
                cachedData = JSON.parse(localStorage.getItem(cacheKey));
                const now = new Date().getTime();
                if (cachedData && (now - cachedData.timestamp < CACHE_DURATION_MINUTES * 60 * 1000)) {
                    setRatesAndGroupData(cachedData.rates);
                    setUserTransactions(cachedData.transactions);
                    setAdminPaymentMethods(cachedData.adminPaymentMethods || []);
                    setIsLoading(false);
                    return; // Exit if using valid cache
                }
            } catch (e) {
                console.error("Error reading cache:", e);
                // Continue to fetch from network if cache read fails
            }
        }
        
        setIsLoading(true); // Always show loading when fetching from network
        setError('');
        try {
            const [ratesRes, txRes, adminPayRes] = await Promise.all([
                supabase.from('crypto_rates').select('*, network_icon').eq('is_active', true),
                supabase.from('warung_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20),
                supabase.from('admin_payment_methods').select('*').order('method_name')
            ]);
            
            if (ratesRes.error) throw ratesRes.error;
            if (txRes.error) throw txRes.error;
            if (adminPayRes.error) throw adminPayRes.error;

            setRatesAndGroupData(ratesRes.data);
            setUserTransactions(txRes.data);
            setAdminPaymentMethods(adminPayRes.data || []);

            const dataToCache = {
                rates: ratesRes.data,
                transactions: txRes.data,
                adminPaymentMethods: adminPayRes.data || [],
                timestamp: new Date().getTime()
            };
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));

        } catch (dbError) {
            setError(dbError.message);
        } finally {
            setIsLoading(false); // Hide loading after fetch completes
        }
    }, [currentUser]); // MODIFICATION: Removed 'selectedNetwork' from dependencies of fetchData

    useEffect(() => { fetchData(true); }, [fetchData]); // Initial load should always bypass cache for fresh data

    useEffect(() => {
        setInputAmount('');
        setOutputAmount(0);
        setWalletAddress('');
        setUserPaymentInfo({ fullName: '', method: '', details: '' });
        setProof(null);
    }, [activeTab, selectedCoin]);
    
    useEffect(() => {
        if (inputAmount && selectedCoin) {
            const rate = activeTab === 'buy' ? selectedCoin.rate_sell : selectedCoin.rate_buy;
            if (rate > 0) {
                const result = activeTab === 'buy' ? parseFloat(inputAmount) / rate : parseFloat(inputAmount) * rate;
                setOutputAmount(result);
            } else {
                setOutputAmount(0);
            }
        } else {
            setOutputAmount(0);
        }
    }, [inputAmount, selectedCoin, activeTab]);

    const handleProceed = () => {
        if (activeTab === 'buy' && parseFloat(inputAmount) < MIN_TRANSACTION_IDR) {
            setError(`Transaksi minimal adalah Rp ${MIN_TRANSACTION_IDR.toLocaleString('id-ID')}.`);
            return;
        }
        setError('');
        setShowInstructionPage(true);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const paymentInfoString = `${userPaymentInfo.method} - ${userPaymentInfo.details} (a/n ${userPaymentInfo.fullName})`;
            
            const transactionData = {
                user_id: currentUser.id,
                order_type: activeTab,
                token_symbol: selectedCoin.token_symbol,
                network: selectedCoin.network,
                amount_idr: activeTab === 'buy' ? parseFloat(inputAmount) : outputAmount,
                amount_crypto: activeTab === 'buy' ? outputAmount : parseFloat(inputAmount),
                status: 'WAITING_CONFIRMATION',
                user_wallet_address: walletAddress,
                user_payment_info: activeTab === 'sell' ? paymentInfoString : null,
            };

            if (activeTab === 'buy') {
                if (!proof) throw new Error("Bukti transfer belum diunggah.");
                const fileExt = proof.name.split('.').pop();
                const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('buktitransfer').upload(fileName, proof);
                if (uploadError) throw new Error(`Gagal unggah bukti: ${uploadError.message}`);
                transactionData.proof_screenshot_url = fileName;
            }

            const { error: insertError } = await supabase.from('warung_transactions').insert([transactionData]);
            if (insertError) throw new Error(`Gagal menyimpan transaksi: ${insertError.message}`);
            
            alert('Permintaan transaksi berhasil dikirim!');
            setShowInstructionPage(false);
            fetchData(true); // Force refetch after a successful transaction
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isButtonDisabled = activeTab === 'buy'
        ? (!selectedCoin || !inputAmount || !walletAddress || (selectedCoin.stock && outputAmount > selectedCoin.stock))
        : (!selectedCoin || !inputAmount || !userPaymentInfo.fullName || !userPaymentInfo.method || !userPaymentInfo.details || (selectedCoin.stock_rupiah && outputAmount > selectedCoin.stock_rupiah));

    // Definisikan class styling untuk input field secara eksplisit
    const inputStyle = "w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all appearance-none";
    const selectStyle = `${inputStyle} appearance-none`;

    // Function to handle switching TO admin view
    const handleGoToAdminView = () => {
        setView('admin'); // Set view to 'admin'
        localStorage.removeItem(`warungData_${currentUser.id}`); // Invalidate cache for user view data
        fetchData(true); // Force refetch for admin data potentially
    };

    // Function to handle switching back TO user view
    const handleGoToUserView = () => {
        setView('user'); // Set view back to 'user'
        localStorage.removeItem(`warungData_${currentUser.id}`); // Invalidate cache (same cache key, but ensures fresh data for user view too)
        fetchData(true); // Force refetch for user view data
    };


    if (currentUser && currentUser.role === 'admin' && view === 'admin') {
        // Pass the function to switch back to user view
        return <PageAdminWarung onSwitchView={handleGoToUserView} />;
    }

    if (showInstructionPage && selectedCoin) {
        return (
            <div className="page-content max-w-lg mx-auto py-8">
                <div className="card p-6 md:p-8 space-y-6 text-center">
                    <FontAwesomeIcon icon={faReceipt} className="text-5xl text-primary mb-4" />
                    <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Konfirmasi Transaksi</h2>
                    {activeTab === 'buy' ? (
                        <>
                            <p className="text-light-subtle dark:text-dark-subtle">Silakan transfer sejumlah <strong className="text-light-text dark:text-dark-text font-bold text-lg">Rp {Number(inputAmount).toLocaleString('id-ID')}</strong> ke rekening admin.</p>
                            <div className="text-left bg-light-bg dark:bg-dark-bg p-4 rounded-lg text-light-subtle dark:text-dark-subtle space-y-2">
                                {adminPaymentMethods.map(method => (
                                    <p key={method.id}>
                                        <strong className="text-light-text dark:text-dark-text">{method.method_name}:</strong> {method.account_number} <span className="text-xs">(a/n {method.full_name})</span>
                                    </p>
                                ))}
                            </div>
                            <p className="text-light-subtle dark:text-dark-subtle">Kemudian unggah bukti transfer Anda.</p>
                            <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files[0])} className="input-file w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:text-dark-subtle" />
                        </>
                    ) : (
                        <p className="text-light-subtle dark:text-dark-subtle">Admin akan segera mengirimkan pembayaran ke info yang Anda berikan. Pastikan Anda sudah mengirim aset kripto.</p>
                    )}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setShowInstructionPage(false)} className="btn-secondary w-full py-2">Batal</button>
                        <button onClick={handleFinalSubmit} disabled={isSubmitting || (activeTab === 'buy' && !proof)} className="btn-primary w-full py-2">
                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Konfirmasi & Kirim'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="page-content space-y-8 max-w-7xl mx-auto py-8 px-4">
            {currentUser && currentUser.role === 'admin' && (
                <button onClick={handleGoToAdminView} className="w-full btn-secondary py-3 mb-6 flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCogs} /> Kelola Warung (Admin)
                </button>
            )}

            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-2">Warung Kripto AFA</h1>
                <p className="text-lg text-light-subtle dark:text-dark-subtle max-w-2xl mx-auto">Jual beli aset kripto eceran dengan mudah, cepat, dan aman.</p>
            </div>

            {isLoading ? (
                <div className="text-center py-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/><p className="mt-3 text-light-subtle dark:text-dark-subtle">Memuat data warung...</p></div>
            ) : error ? (
                <div className="card max-w-lg mx-auto text-center p-8 text-red-400"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><h3 className="font-bold">Gagal Memuat Data</h3><p className="text-sm mt-1">{error}</p></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3">
                        <div className="card p-6 md:p-8 space-y-6">
                            <div className="flex border-b border-light-border dark:border-dark-border">
                                <button onClick={() => setActiveTab('buy')} className={`pb-3 font-bold w-1/2 text-center transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'buy' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle dark:text-dark-subtle hover:text-light-text dark:hover:text-dark-text'}`}><FontAwesomeIcon icon={faBolt}/> Beli Kripto</button>
                                <button onClick={() => setActiveTab('sell')} className={`pb-3 font-bold w-1/2 text-center transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'sell' ? 'border-b-2 border-red-500 text-red-500' : 'text-light-subtle dark:text-dark-subtle hover:text-light-text dark:hover:text-dark-text'}`}><FontAwesomeIcon icon={faMoneyBillWave}/> Jual Kripto</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="text-xs text-light-subtle dark:text-dark-subtle">{activeTab === 'buy' ? 'Jumlah Bayar (IDR)' : 'Jumlah Jual (Aset)'}</label>
                                    <input type="number" placeholder="0" value={inputAmount} onChange={e => setInputAmount(e.target.value)} className="w-full bg-transparent text-light-text dark:text-dark-text text-3xl font-semibold focus:outline-none p-2 rounded-md"/>
                                </div>
                                <div className="flex items-center justify-center pb-2">
                                    <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-light-subtle dark:text-dark-subtle text-2xl" />
                                </div>
                                <div className="md:col-span-2 text-right md:text-left">
                                    <label className="text-xs text-light-subtle dark:text-dark-subtle">Anda Dapat (Estimasi)</label>
                                    <p className="text-3xl font-semibold text-light-text dark:text-dark-text p-2">{outputAmount > 0 ? (activeTab === 'buy' ? outputAmount.toFixed(6) : 'Rp ' + Math.floor(outputAmount).toLocaleString('id-ID')) : '0'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-semibold text-light-text dark:text-dark-text mb-2 block">Pilih Aset</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        {/* MODIFIKASI: Gunakan network_icon yang disimpan di groupedByNetwork */}
                                        {selectedNetwork && groupedByNetwork[selectedNetwork]?.network_icon && (
                                            <img src={groupedByNetwork[selectedNetwork].network_icon} alt={selectedNetwork} className="w-5 h-5 rounded-full absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"/>
                                        )}
                                        <select value={selectedNetwork || ''} onChange={(e) => { 
                                            const newNetwork = e.target.value; 
                                            setSelectedNetwork(newNetwork); 
                                            // MODIFIKASI: Tambahkan pemeriksaan jika tidak ada koin aktif di jaringan yang baru dipilih
                                            if (groupedByNetwork[newNetwork] && groupedByNetwork[newNetwork].coins.length > 0) {
                                                setSelectedCoin(groupedByNetwork[newNetwork].coins[0]); 
                                            } else {
                                                setSelectedCoin(null); // Clear selected coin if no coins for this network
                                            }
                                        }} className={`${selectStyle} pl-10`}>
                                            <option value="" disabled>Pilih Jaringan</option>
                                            {/* MODIFIKASI: Pastikan Object.keys(groupedByNetwork) tidak kosong */}
                                            {Object.keys(groupedByNetwork).length > 0 && Object.keys(groupedByNetwork).map(network => (<option key={network} value={network}>{network}</option>))}
                                        </select>
                                        <FontAwesomeIcon icon={faAngleDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    <div className="relative">
                                        {selectedCoin && ( <img src={selectedCoin.icon} alt={selectedCoin.token_symbol} className="w-5 h-5 rounded-full absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"/> )}
                                        <select value={selectedCoin?.id || ''} onChange={(e) => { const coinId = parseInt(e.target.value); const coin = groupedByNetwork[selectedNetwork]?.coins.find(c => c.id === coinId); setSelectedCoin(coin); }} disabled={!selectedNetwork} className={`${selectStyle} pl-10`}>
                                            <option value="" disabled>Pilih Koin</option>
                                            {/* MODIFIKASI: Pastikan selectedNetwork ada dan ada koin di dalamnya */}
                                            {selectedNetwork && groupedByNetwork[selectedNetwork]?.coins.map(coin => (<option key={coin.id} value={coin.id}>{coin.token_symbol}</option>))}
                                        </select>
                                        <FontAwesomeIcon icon={faAngleDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                {selectedCoin && <p className="text-xs text-center text-light-subtle dark:text-dark-subtle mt-3">Kurs: 1 {selectedCoin.token_symbol} ≈ Rp {Number(activeTab === 'buy' ? selectedCoin.rate_sell : selectedCoin.rate_buy).toLocaleString('id-ID')}</p>}
                            </div>

                            <div>
                                {activeTab === 'buy' ? (
                                    <>
                                        <label className="text-sm font-semibold text-light-text dark:text-dark-text mb-2 block">Alamat Wallet Penerima Anda</label>
                                        <input type="text" placeholder={`Paste alamat ${selectedCoin?.network || 'wallet'} Anda di sini`} value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className={inputStyle}/>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-light-text dark:text-dark-text block">Info Pembayaran Anda (Untuk Menerima Dana)</label>
                                        <input type="text" placeholder="Nama Lengkap Sesuai Rekening" value={userPaymentInfo.fullName} onChange={e => setUserPaymentInfo({...userPaymentInfo, fullName: e.target.value})} className={inputStyle}/>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="Metode (cth: DANA, BCA)" value={userPaymentInfo.method} onChange={e => setUserPaymentInfo({...userPaymentInfo, method: e.target.value})} className={inputStyle}/>
                                            <input type="text" placeholder="Nomor Rekening / Telepon" value={userPaymentInfo.details} onChange={e => setUserPaymentInfo({...userPaymentInfo, details: e.target.value})} className={inputStyle}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="pt-2">
                                <button onClick={handleProceed} disabled={isButtonDisabled || isSubmitting} className={`w-full text-lg py-3.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] ${activeTab === 'buy' ? 'btn-primary' : 'btn-danger'}`}>
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : (activeTab === 'buy' ? 'Beli Sekarang' : 'Jual Sekarang')}
                                </button>
                                <p className="text-center text-xs text-light-subtle dark:text-dark-subtle mt-2">Minimal transaksi Rp {MIN_TRANSACTION_IDR.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-0">
                            <h2 className="text-lg font-bold text-light-text dark:text-dark-text flex items-center gap-2 p-4 border-b border-light-border dark:border-dark-border"><FontAwesomeIcon icon={faHistory}/> Riwayat Transaksi Terakhir</h2>
                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                {userTransactions.length > 0 ? (
                                    userTransactions.map(tx => <TransactionHistoryItem key={tx.id} tx={tx} />)
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-8">Tidak ada transaksi di tab ini.</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <BenefitCard icon={faGasPump} title="Cukup Untuk Gas Fee">Beli sesuai kebutuhan untuk biaya transaksi airdrop. Tidak perlu beli banyak.</BenefitCard>
                            <BenefitCard icon={faBolt} title="Proses Cepat & Mudah">Lupakan proses panjang di exchange besar. Di sini, transaksi lebih cepat dan personal.</BenefitCard>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
