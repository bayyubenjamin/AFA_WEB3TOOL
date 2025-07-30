// src/components/PageWarungKripto.jsx
// EDIT: Menambahkan persetujuan kebijakan dan modal konfirmasi profesional.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStore, faMoneyBillWave, faArrowRightArrowLeft, faCheckCircle,
    faBolt, faSpinner, faExclamationTriangle, faHistory, faCogs,
    faReceipt, faAngleDown, faAngleUp, faExternalLinkAlt, faGasPump,
    faSignature, faUniversity, faMobileAlt, faBoxOpen, faBook, faShieldAlt, faInfoCircle, faCommentDots,
    faLandmark, faFileContract // <-- Ikon baru ditambahkan
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { getUsdToIdrRate } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const RATES_CACHE_KEY = 'warungKriptoRatesCache';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

// --- Komponen-komponen UI (Helper) ---

const InfoCard = ({ icon, title, children }) => (
    <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-4 rounded-lg flex items-start gap-4">
        <FontAwesomeIcon icon={icon} className="text-primary text-xl mt-1" />
        <div>
            <h4 className="font-bold text-light-text dark:text-dark-text">{title}</h4>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{children}</p>
        </div>
    </div>
);

const TransactionHistoryItem = ({ tx }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusMap = {
        'pending': { text: 'Pending', color: 'bg-yellow-500/10 text-yellow-400' },
        'awaiting_payment': { text: 'Menunggu Pembayaran', color: 'bg-yellow-500/10 text-yellow-400' },
        'awaiting_confirmation': { text: 'Menunggu Konfirmasi', color: 'bg-blue-500/10 text-blue-400' },
        'completed': { text: 'Selesai', color: 'bg-green-500/10 text-green-400' },
        'rejected': { text: 'Ditolak', color: 'bg-red-500/10 text-red-400' },
    };
    const status = statusMap[tx.status] || { text: tx.status, color: 'bg-gray-500/10 text-gray-400' };
    const isBuy = tx.order_type === 'beli';

    return (
        <div className="border-b border-light-border dark:border-dark-border last:border-b-0">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-3 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors rounded-t-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <FontAwesomeIcon icon={isBuy ? faBolt : faMoneyBillWave} className={`text-lg ${isBuy ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                            <span className="font-semibold text-sm text-light-text dark:text-dark-text capitalize">{tx.order_type} {tx.token_symbol}</span>
                            <span className="block text-xs text-light-text-secondary dark:text-dark-text-secondary">{new Date(tx.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <span className={`font-mono text-sm ${isBuy ? 'text-green-500' : 'text-red-500'}`}>{isBuy ? '+' : '-'} {Number(tx.amount_crypto).toFixed(5)}</span>
                         <FontAwesomeIcon icon={isExpanded ? faAngleUp : faAngleDown} className="text-gray-400" />
                    </div>
                </div>
            </button>
            {isExpanded && (
                <div className="bg-light-hover dark:bg-dark-hover p-3 text-xs space-y-2 text-light-text-secondary dark:text-dark-text-secondary rounded-b-md">
                      <div className="flex justify-between"><span>Status:</span> <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${status.color}`}>{status.text}</span></div>
                      <div className="flex justify-between"><span>ID Pesanan:</span> <span className="font-mono">{tx.id}</span></div>
                      <div className="flex justify-between"><span>Rupiah:</span> <span className="font-mono">Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</span></div>
                    {isBuy ? <p><strong>Wallet:</strong> <span className="font-mono break-all">{tx.wallet_address}</span></p> : <p><strong>Info Bayar:</strong> <span className="font-mono break-all">{JSON.stringify(tx.user_payment_info)}</span></p>}
                    <Link to={`/warung-kripto/order/${tx.id}`} className="text-primary hover:underline font-bold flex items-center gap-2 pt-1">
                        <FontAwesomeIcon icon={faCommentDots} /> Lihat Detail Pesanan
                    </Link>
                </div>
            )}
        </div>
    );
};

const ImportantWarning = () => (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-md" role="alert">
        <div className="flex items-start">
            <FontAwesomeIcon icon={faShieldAlt} className="text-xl" />
            <div className="ml-3">
                <p className="font-bold">Perhatian Penting</p>
                <p className="text-sm">
                    Pastikan semua data yang Anda masukkan (alamat wallet, metode pembayaran, dll) sudah benar. Transaksi di blockchain tidak dapat diubah. Kami tidak bertanggung jawab atas kesalahan input dari pengguna.
                </p>
            </div>
        </div>
    </div>
);

const AssetSelector = ({ value, onChange, options, placeholder, renderOption, disabled }) => (
    <div className="relative w-full">
        <select value={value} onChange={onChange} disabled={disabled} className="w-full appearance-none bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-3 pl-12 pr-10 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
            <option value="" disabled>{placeholder}</option>
            {options.map(option => (<option key={option.key} value={option.value}>{option.label}</option>))}
        </select>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{renderOption}</div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><FontAwesomeIcon icon={faAngleDown} className="text-gray-400"/></div>
    </div>
);

// --- Komponen Modal Konfirmasi Profesional ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, details, isSubmitting }) => {
    if (!isOpen) return null;

    const { activeTab, cryptoAmount, selectedCoin, finalPrice } = details;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all">
                <div className="flex items-center gap-3 mb-3">
                    <FontAwesomeIcon icon={faFileContract} className="text-primary text-2xl" />
                    <h3 className="text-xl font-bold text-light-text dark:text-dark-text">Konfirmasi Pesanan</h3>
                </div>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-5">
                    Harap periksa kembali detail transaksi Anda. Pesanan tidak dapat dibatalkan setelah dikonfirmasi.
                </p>
                <div className="space-y-3 text-sm border-y border-light-border dark:border-dark-border py-4 my-4">
                    <div className="flex justify-between">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">Jenis Order:</span>
                        <span className={`font-bold ${activeTab === 'beli' ? 'text-green-500' : 'text-red-500'}`}>{activeTab === 'beli' ? 'PEMBELIAN' : 'PENJUALAN'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">Aset Kripto:</span>
                        <span className="font-bold text-light-text dark:text-dark-text">{cryptoAmount.toFixed(6)} {selectedCoin.token_symbol}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">{activeTab === 'beli' ? 'Total Pembayaran:' : 'Total Penerimaan:'}</span>
                        <span className="font-bold text-primary text-lg">Rp {Math.floor(finalPrice).toLocaleString('id-ID')}</span>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary px-5 py-2 text-sm">Batal</button>
                    <button onClick={onConfirm} disabled={isSubmitting} className={`px-5 py-2 text-sm ${activeTab === 'jual' ? 'btn-danger' : 'btn-primary'}`}>
                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Ya, Lanjutkan'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- KOMPONEN UTAMA ---
export default function PageWarungKripto({ currentUser }) {
    const [activeTab, setActiveTab] = useState('beli');
    const [rates, setRates] = useState([]);
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const [selectedCoin, setSelectedCoin] = useState(null);
    const [inputAmount, setInputAmount] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [userPaymentInfo, setUserPaymentInfo] = useState({ fullName: '', method: 'bank', details: '' });
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [usdToIdrRate, setUsdToIdrRate] = useState(16500);
    // State baru untuk kebijakan dan modal
    const [isPolicyAgreed, setIsPolicyAgreed] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const navigate = useNavigate();
    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

    const { groupedRates, cryptoAmount, fiatAmount, finalPrice, adminProfit, isApiNotSet, baseFiatValue, usdtValue } = useMemo(() => {
        if (!rates || rates.length === 0) return { groupedRates: {} };
        const groups = rates.reduce((acc, coin) => {
            const network = coin.network;
            if (!acc[network]) acc[network] = { coins: [], network_icon: coin.network_icon };
            acc[network].coins.push(coin);
            return acc;
        }, {});
        let profit = 0, finalUserPrice = 0, cryptoOutput = 0, fiatOutput = 0, baseValue = 0, usdtAmount = 0;
        const apiNotSet = selectedCoin && !selectedCoin.coingecko_id;
        const marketPriceUSD = selectedCoin?.market_price_usd || 0;
        const marketPriceIDR = marketPriceUSD * usdToIdrRate;
        const inputNum = parseFloat(inputAmount) || 0;
        if (selectedCoin && Array.isArray(selectedCoin.margin_tiers) && inputNum > 0) {
            const sortedTiers = [...selectedCoin.margin_tiers].sort((a, b) => a.up_to - b.up_to);
            let transactionValue = activeTab === 'beli' ? inputNum : inputNum * marketPriceIDR;
            let applicableTier = sortedTiers.find(tier => transactionValue <= tier.up_to);
            if (!applicableTier && sortedTiers.length > 0) { applicableTier = sortedTiers[sortedTiers.length - 1]; }
            if (applicableTier) profit = applicableTier.profit;
        }
        if (marketPriceIDR > 0 && inputNum > 0) {
            if (activeTab === 'beli') {
                baseValue = inputNum;
                finalUserPrice = inputNum + profit;
                cryptoOutput = inputNum / marketPriceIDR;
                fiatOutput = inputNum;
                usdtAmount = cryptoOutput * marketPriceUSD;
            } else {
                baseValue = inputNum * marketPriceIDR;
                finalUserPrice = baseValue - profit;
                cryptoOutput = inputNum;
                fiatOutput = finalUserPrice;
                usdtAmount = inputNum * marketPriceUSD;
            }
        }
        return { groupedRates: groups, cryptoAmount: cryptoOutput, fiatAmount: fiatOutput, finalPrice: finalUserPrice, adminProfit: profit, isApiNotSet: apiNotSet, baseFiatValue: baseValue, usdtValue: usdtAmount };
    }, [rates, inputAmount, selectedCoin, activeTab, usdToIdrRate]);
    
    const fetchData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad && !localStorage.getItem(RATES_CACHE_KEY)) setIsLoading(true);
        if (typeof window !== 'undefined') {
            try {
                const cachedDataJSON = localStorage.getItem(RATES_CACHE_KEY);
                if (cachedDataJSON) {
                    const cachedData = JSON.parse(cachedDataJSON);
                    if ((Date.now() - cachedData.timestamp) < CACHE_EXPIRATION_MS) {
                        setRates(cachedData.rates);
                        setUsdToIdrRate(cachedData.usdToIdrRate);
                        if (isInitialLoad && cachedData.rates.length > 0 && !selectedNetwork) {
                            const firstNetworkName = cachedData.rates[0].network;
                            setSelectedNetwork(firstNetworkName);
                            setSelectedCoin(cachedData.rates[0]);
                        }
                        if(isInitialLoad) setIsLoading(false);
                    }
                }
            } catch (e) { console.error("Gagal memuat dari cache", e); localStorage.removeItem(RATES_CACHE_KEY); }
        }
        try {
            const ratesPromise = supabase.from('crypto_rates').select('*').eq('is_active', true).order('network');
            const txPromise = currentUser ? supabase.from('warung_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] });
            const ratePromise = getUsdToIdrRate();
            const [ratesRes, txRes, freshUsdRate] = await Promise.all([ratesPromise, txPromise, ratePromise]);
            if (ratesRes.error) throw ratesRes.error;
            if (txRes.error) throw txRes.error;
            const ratesData = ratesRes.data || [];
            setRates(ratesData);
            setHistory(txRes.data || []);
            setUsdToIdrRate(freshUsdRate);
            if (typeof window !== 'undefined') {
                try {
                    const cachePayload = { rates: ratesData, usdToIdrRate: freshUsdRate, timestamp: Date.now() };
                    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cachePayload));
                } catch (e) { console.error("Gagal menyimpan ke cache", e); }
            }
            if (isInitialLoad && ratesData.length > 0 && !selectedNetwork) {
                const firstNetworkName = ratesData[0].network;
                setSelectedNetwork(firstNetworkName);
                setSelectedCoin(ratesData[0]);
            }
        } catch (err) {
            console.error("Gagal memuat data warung:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, selectedNetwork]);

    useEffect(() => {
        fetchData(true);
        const channel = supabase.channel('public:crypto_rates_user').on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_rates' }, () => {
            if (typeof window !== 'undefined') localStorage.removeItem(RATES_CACHE_KEY);
            fetchData(false);
        }).subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const executeOrder = async () => {
        setIsSubmitting(true);
        setError('');
        const transactionData = {
            user_id: currentUser.id,
            order_type: activeTab,
            token_symbol: selectedCoin.token_symbol,
            network: selectedCoin.network,
            amount_crypto: cryptoAmount,
            amount_idr: finalPrice,
            status: 'awaiting_payment',
            wallet_address: activeTab === 'beli' ? walletAddress : null,
            user_payment_info: activeTab === 'jual' ? { fullName: userPaymentInfo.fullName, details: `${userPaymentInfo.method.toUpperCase()}: ${userPaymentInfo.details}` } : null,
        };
        const { data: newOrder, error } = await supabase.from('warung_transactions').insert(transactionData).select().single();
        if (error) {
            setError('Gagal membuat pesanan: ' + error.message);
            alert('Gagal membuat pesanan: ' + error.message);
        } else {
            alert('Pesanan berhasil dibuat! Anda akan diarahkan ke halaman detail & obrolan.');
            navigate(`/warung-kripto/order/${newOrder.id}`);
        }
        setIsSubmitting(false);
        setIsConfirmModalOpen(false);
    };

    const handleCreateOrder = async () => {
        if (!currentUser || !currentUser.id) {
            alert("Anda harus login untuk membuat pesanan.");
            return navigate('/login');
        }
        if (isButtonDisabled) {
            alert("Harap lengkapi semua field yang diperlukan dan setujui kebijakan layanan.");
            return;
        }
        // Buka modal konfirmasi
        setIsConfirmModalOpen(true);
    };
    
    const handlePaymentInfoChange = (field, value) => setUserPaymentInfo(prev => ({ ...prev, [field]: value }));
    // Logika tombol dinonaktifkan diperbarui dengan persetujuan kebijakan
    const isButtonDisabled = !selectedCoin || !inputAmount || isApiNotSet || (activeTab === 'beli' && !walletAddress) || (activeTab === 'jual' && (!userPaymentInfo.fullName || !userPaymentInfo.method || !userPaymentInfo.details)) || !isPolicyAgreed;
    const inputStyle = "w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all";
    const networkOptions = Object.keys(groupedRates).map(network => ({ key: network, value: network, label: network, icon: groupedRates[network]?.network_icon }));
    const coinOptions = selectedNetwork ? groupedRates[selectedNetwork]?.coins.map(coin => ({ key: coin.id, value: coin.id, label: `${coin.token_symbol}`, icon: coin.icon })) : [];

    return (
        <>
            {/* Modal Konfirmasi ditempatkan di sini */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeOrder}
                isSubmitting={isSubmitting}
                details={{ activeTab, cryptoAmount, selectedCoin, finalPrice }}
            />

            <section className="page-content space-y-8 max-w-7xl mx-auto py-8 px-4">
                <div className="text-center mb-8">
                    <FontAwesomeIcon icon={faStore} className="text-primary text-5xl mb-3"/>
                    <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-2">Warung Kripto AFA</h1>
                    <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">Platform jual beli aset digital yang dirancang untuk transaksi cepat, aman, dan tanpa hambatan.</p>
                </div>

                {isAdmin && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <Link to="/admin/warung-jaringan" className="btn-secondary text-sm flex items-center gap-2"><FontAwesomeIcon icon={faCogs} /> Pengaturan Jaringan</Link>
                        <Link to="/admin/rekening" className="btn-secondary text-sm flex items-center gap-2"><FontAwesomeIcon icon={faLandmark} /> Pengaturan Rekening</Link>
                        <Link to="/order-admin/buku-order" className="btn-primary text-sm flex items-center gap-2"><FontAwesomeIcon icon={faBook} /> Buku Order</Link>
                    </div>
                )}

                {isLoading && <div className="text-center py-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/><p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary">Memuat data warung...</p></div>}
                {!isLoading && error && <div className="bg-red-500/10 max-w-lg mx-auto text-center p-8 text-red-400 rounded-xl"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><h3 className="font-bold">Gagal Memuat Data</h3><p className="text-sm mt-1">{error}</p></div>}
                {!isLoading && !error && (
                    rates.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3">
                                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-6 space-y-6 rounded-xl shadow-sm">
                                    <div className="flex border-b border-light-border dark:border-dark-border">
                                        <button onClick={() => { setActiveTab('beli'); setInputAmount(''); }} className={`py-3 font-bold w-1/2 text-center transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'beli' ? 'border-b-2 border-primary text-primary' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-primary'}`}><FontAwesomeIcon icon={faBolt}/> Beli</button>
                                        <button onClick={() => { setActiveTab('jual'); setInputAmount(''); }} className={`py-3 font-bold w-1/2 text-center transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'jual' ? 'border-b-2 border-red-500 text-red-500' : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500'}`}><FontAwesomeIcon icon={faMoneyBillWave}/> Jual</button>
                                    </div>
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                          <div className="w-full">
                                              <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{activeTab === 'beli' ? 'Anda Bayar' : 'Anda Jual'}</label>
                                              <div className="relative flex items-center">
                                                  {activeTab === 'beli' && (<span className="text-3xl font-semibold text-light-text dark:text-dark-text mr-2">Rp</span>)}
                                                  <input type="number" placeholder="0" value={inputAmount} onChange={e => setInputAmount(e.target.value)} className="w-full bg-transparent text-light-text dark:text-dark-text text-3xl font-semibold focus:outline-none p-2 rounded-md -ml-2"/>
                                                  {activeTab === 'jual' && selectedCoin && (<span className="text-xl font-semibold text-light-text-secondary dark:text-dark-text-secondary ml-2">{selectedCoin.token_symbol}</span>)}
                                              </div>
                                              {activeTab === 'jual' && usdtValue > 0 && (<div className="text-xs text-light-text-secondary dark:text-dark-text-secondary px-2">≈ $ {usdtValue.toFixed(2)} USDT</div>)}
                                          </div>
                                        <div className="flex items-center justify-center p-2 bg-light-bg dark:bg-dark-bg rounded-full border border-light-border dark:border-dark-border my-2 md:my-0"><FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-gray-500 text-lg" /></div>
                                          <div className="w-full text-left md:text-right">
                                              <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Anda Dapat (Estimasi)</label>
                                              <p className="text-3xl font-semibold text-light-text dark:text-dark-text p-2 whitespace-nowrap overflow-x-auto custom-scrollbar">{activeTab === 'beli' ? <>{(cryptoAmount || 0).toFixed(6)} <span className="text-xl text-light-text-secondary dark:text-dark-text-secondary">{selectedCoin?.token_symbol || ''}</span></> : `Rp ${Math.floor(fiatAmount || 0).toLocaleString('id-ID')}`}</p>
                                              {activeTab === 'beli' && usdtValue > 0 && (<div className="text-xs text-light-text-secondary dark:text-dark-text-secondary px-2 text-right">≈ ${usdtValue.toFixed(2)} USDT</div>)}
                                          </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-light-text dark:text-dark-text mb-1 block">Pilih Aset</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <AssetSelector value={selectedNetwork || ''} onChange={(e) => { const newNetwork = e.target.value; setSelectedNetwork(newNetwork); if (groupedRates[newNetwork]?.coins.length > 0) setSelectedCoin(groupedRates[newNetwork].coins[0]); }} options={networkOptions} placeholder="Pilih Jaringan" renderOption={<img src={groupedRates[selectedNetwork]?.network_icon || 'https://via.placeholder.com/24'} alt={selectedNetwork} className="w-6 h-6 rounded-full bg-gray-700 object-cover" />}/>
                                            <AssetSelector value={selectedCoin?.id || ''} onChange={(e) => { const coin = groupedRates[selectedNetwork]?.coins.find(c => c.id.toString() === e.target.value); if(coin) setSelectedCoin(coin); }} disabled={!selectedNetwork} options={coinOptions} placeholder="Pilih Koin" renderOption={<img src={selectedCoin?.icon || 'https://via.placeholder.com/24'} alt={selectedCoin?.token_symbol} className="w-6 h-6 rounded-full bg-gray-700 object-cover" />} />
                                        </div>
                                    </div>
                                    {inputAmount > 0 && !isApiNotSet && (
                                        <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg text-sm space-y-2 border border-light-border dark:border-dark-border">
                                            <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary"><span>Nilai Transaksi:</span><span className="text-light-text dark:text-dark-text">Rp { baseFiatValue.toLocaleString('id-ID', {maximumFractionDigits: 0}) }</span></div>
                                            <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary"><span>Biaya Layanan:</span><span className="text-primary">{activeTab === 'beli' ? '+ ' : '- '}Rp {adminProfit.toLocaleString('id-ID')}</span></div>
                                            <hr className="border-light-border dark:border-dark-border"/>
                                            <div className="flex justify-between font-bold text-light-text dark:text-dark-text"><span>{activeTab === 'beli' ? 'Total Bayar' : 'Total Diterima'}:</span><span className="text-primary">Rp { finalPrice.toLocaleString('id-ID', {maximumFractionDigits: 0}) }</span></div>
                                        </div>
                                    )}
                                    <ImportantWarning />
                                    {activeTab === 'beli' ? ( 
                                        <div>
                                            <label className="text-sm font-semibold text-light-text dark:text-dark-text mb-2 block">Alamat Wallet Penerima</label>
                                            <input type="text" placeholder={`Masukkan alamat ${selectedCoin?.network || 'wallet'} Anda`} value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className={inputStyle}/>
                                        </div> 
                                    ) : ( 
                                        <div className="space-y-4">
                                            <label className="text-sm font-semibold text-light-text dark:text-dark-text block">Informasi Pencairan Dana</label>
                                            <input type="text" placeholder="Nama Lengkap Sesuai Rekening" value={userPaymentInfo.fullName} onChange={e => handlePaymentInfoChange('fullName', e.target.value)} className={inputStyle}/>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select value={userPaymentInfo.method} onChange={e => handlePaymentInfoChange('method', e.target.value)} className={inputStyle}>
                                                    <option value="bank">Transfer Bank</option>
                                                    <option value="ewallet">E-Wallet</option>
                                                </select>
                                                <input type="text" placeholder={userPaymentInfo.method === 'bank' ? "Contoh: BCA 1234567890" : "Contoh: DANA 08123456789"} value={userPaymentInfo.details} onChange={e => handlePaymentInfoChange('details', e.target.value)} className={inputStyle}/>
                                            </div>
                                        </div> 
                                    )}

                                    {/* --- BAGIAN PERSETUJUAN KEBIJAKAN BARU --- */}
                                    <div className="mt-6 p-4 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg">
                                        <label htmlFor="policy-agree" className="flex items-start gap-3 cursor-pointer text-sm">
                                            <input
                                                id="policy-agree"
                                                type="checkbox"
                                                checked={isPolicyAgreed}
                                                onChange={() => setIsPolicyAgreed(!isPolicyAgreed)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="text-light-text-secondary dark:text-dark-text-secondary">
                                                Saya telah membaca, memahami, dan menyetujui
                                                <Link to="/kebijakan-layanan" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline mx-1">
                                                    Kebijakan dan Ketentuan Layanan
                                                </Link>
                                                yang berlaku di Warung Kripto AFA.
                                            </span>
                                        </label>
                                    </div>

                                    <div className="pt-2">
                                        <button onClick={handleCreateOrder} disabled={isButtonDisabled} className={`w-full text-base py-3.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${activeTab === 'beli' ? 'btn-primary' : 'btn-danger'}`}>
                                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : (activeTab === 'beli' ? 'Beli Sekarang' : 'Jual Sekarang')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-sm">
                                    <h2 className="text-lg font-bold p-4 border-b border-light-border dark:border-dark-border text-light-text dark:text-dark-text flex items-center gap-2"><FontAwesomeIcon icon={faHistory}/> Riwayat Transaksi</h2>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {history.length > 0 ? (history.map(tx => <TransactionHistoryItem key={tx.id} tx={tx} />)) : (<p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-8">Belum ada transaksi.</p>)}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <InfoCard icon={faGasPump} title="Cukup Untuk Gas Fee">Beli sesuai kebutuhan tanpa minimum besar.</InfoCard>
                                    <InfoCard icon={faBolt} title="Proses Cepat & Mudah">Lupakan proses panjang dan rumit di exchange besar.</InfoCard>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-20 bg-light-card dark:bg-dark-card rounded-xl">
                            <FontAwesomeIcon icon={faStore} size="2x" className="mb-3"/>
                            <p>Warung sedang tutup atau belum ada koin yang tersedia saat ini.</p>
                        </div>
                    )
                )}
            </section>
        </>
    );
}

