import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStore, faMoneyBillWave, faArrowRightArrowLeft, faCheckCircle,
    faBolt, faSpinner, faExclamationTriangle, faHistory, faCogs,
    faReceipt, faAngleDown, faAngleUp, faExternalLinkAlt, faGasPump, faSignature, faUniversity, faMobileAlt, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { getUsdToIdrRate } from '../services/api';
import { Link } from 'react-router-dom';

const MIN_TRANSACTION_IDR = 10000;

// --- Komponen-komponen UI (Helper) ---
const BenefitCard = ({ icon, title, children }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex items-start gap-4 backdrop-blur-sm">
        <FontAwesomeIcon icon={icon} className="text-primary text-xl mt-1" />
        <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-sm text-gray-400">{children}</p>
        </div>
    </div>
);

const TransactionHistoryItem = ({ tx }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusMap = {
        pending: { text: 'Menunggu', color: 'bg-yellow-500/10 text-yellow-400', icon: faSpinner },
        completed: { text: 'Selesai', color: 'bg-green-500/10 text-green-400', icon: faCheckCircle },
        rejected: { text: 'Ditolak', color: 'bg-red-500/10 text-red-400', icon: faExclamationTriangle },
    };
    const status = statusMap[tx.status] || { text: tx.status, color: 'bg-gray-500/10 text-gray-400' };
    const isBuy = tx.type === 'beli';

    return (
        <div className="border-b border-gray-700 last:border-b-0">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-4 hover:bg-white/5 transition-colors">
                <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <FontAwesomeIcon icon={isBuy ? faBolt : faMoneyBillWave} className={`text-lg ${isBuy ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                            <span className="font-bold text-sm text-white capitalize">{tx.type} {tx.token_symbol}</span>
                            <span className="block text-xs text-gray-400">{new Date(tx.created_at).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center justify-center gap-2 ${status.color}`}>
                            <FontAwesomeIcon icon={status.icon} className={status.text === 'Menunggu' ? 'animate-spin' : ''} />
                            {status.text}
                        </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <span className={`font-mono text-sm ${isBuy ? 'text-green-400' : 'text-red-400'}`}>{isBuy ? '+' : '-'} {Number(tx.amount_crypto).toFixed(5)}</span>
                        <FontAwesomeIcon icon={isExpanded ? faAngleUp : faAngleDown} className="text-gray-400" />
                    </div>
                </div>
            </button>
            {isExpanded && (
                <div className="bg-black/20 p-4 text-xs space-y-2 text-gray-300">
                    <p><strong>ID Transaksi:</strong> <span className="font-mono">{tx.id}</span></p>
                    <p><strong>Jumlah Rupiah:</strong> <span className="font-mono">Rp {Number(tx.amount_fiat).toLocaleString('id-ID')}</span></p>
                    {isBuy ? <p><strong>Dikirim ke Wallet:</strong> <span className="font-mono break-all">{tx.wallet_address}</span></p> : <p><strong>Info Pembayaran Anda:</strong> <span className="font-mono break-all">{tx.user_payment_info}</span></p>}
                    {tx.proof_url && <p><strong>Bukti Transfer:</strong> <a href={tx.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">Lihat Bukti <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a></p>}
                </div>
            )}
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
    const [userPaymentInfo, setUserPaymentInfo] = useState({ fullName: '', method: '', details: '' });
    const [proofFile, setProofFile] = useState(null);
    const [history, setHistory] = useState([]);
    const [adminPaymentMethods, setAdminPaymentMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [usdToIdrRate, setUsdToIdrRate] = useState(16500);

    const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser]);

    const { 
        groupedRates, 
        cryptoAmount, 
        fiatAmount,
        finalPrice, 
        adminProfit, 
        isApiNotSet,
        baseFiatValue,
        usdtValue,
        marketPriceUsdt
    } = useMemo(() => {
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
            if (!applicableTier && sortedTiers.length > 0) {
                applicableTier = sortedTiers[sortedTiers.length - 1];
            }
            if (applicableTier) profit = applicableTier.profit;
        }

        if (marketPriceIDR > 0 && inputNum > 0) {
            if (activeTab === 'beli') {
                // Input adalah IDR
                baseValue = inputNum;
                finalUserPrice = inputNum + profit;
                cryptoOutput = inputNum / marketPriceIDR;
                fiatOutput = inputNum;
                usdtAmount = cryptoOutput * marketPriceUSD; // Konversi dari hasil crypto ke USD
            } else { // Jual
                // Input adalah jumlah koin
                baseValue = inputNum * marketPriceIDR;
                finalUserPrice = baseValue - profit;
                cryptoOutput = inputNum;
                fiatOutput = finalUserPrice;
                usdtAmount = inputNum * marketPriceUSD; // Nilai USD dari koin yang diinput
            }
        }
        
        return { 
            groupedRates: groups, 
            cryptoAmount: cryptoOutput,
            fiatAmount: fiatOutput,
            finalPrice: finalUserPrice, 
            adminProfit: profit, 
            isApiNotSet: apiNotSet,
            baseFiatValue: baseValue,
            usdtValue: usdtAmount,
            marketPriceUsdt: marketPriceUSD
        };
    }, [rates, inputAmount, selectedCoin, activeTab, usdToIdrRate]);
    
    const fetchData = useCallback(async () => {
        try {
            const ratesPromise = supabase.from('crypto_rates').select('*').eq('is_active', true).order('network');
            const txPromise = currentUser ? supabase.from('warung_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(10) : Promise.resolve({ data: [] });
            const adminPayPromise = supabase.from('admin_payment_methods').select('*');
            
            const [ratesRes, txRes, adminPayRes] = await Promise.all([ratesPromise, txPromise, adminPayPromise]);

            if (ratesRes.error) throw ratesRes.error;
            if (txRes.error) throw txRes.error;
            if (adminPayRes.error) throw adminPayRes.error;

            const ratesData = ratesRes.data || [];
            setRates(ratesData);
            setHistory(txRes.data || []);
            setAdminPaymentMethods(adminPayRes.data || []);
            
            if (!selectedCoin && ratesData.length > 0) {
                const firstNetworkName = ratesData[0].network;
                if(firstNetworkName) setSelectedNetwork(firstNetworkName);
                setSelectedCoin(ratesData[0]);
            }
            const rate = await getUsdToIdrRate();
            setUsdToIdrRate(rate);
        } catch (err) {
            console.error("Gagal memuat data warung:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, selectedCoin]);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
        const channel = supabase.channel('public:crypto_rates_user').on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_rates' }, () => fetchData()).subscribe();
        return () => supabase.removeChannel(channel);
    }, []);

    const handleProceed = () => { /* ... (fungsi tidak berubah) ... */ };
    const handleFinalSubmit = async () => { /* ... (fungsi tidak berubah) ... */ };
    
    const isButtonDisabled = !selectedCoin || !inputAmount || isApiNotSet || (activeTab === 'beli' && !walletAddress) || (activeTab === 'jual' && (!userPaymentInfo.fullName || !userPaymentInfo.method || !userPaymentInfo.details));
    const inputStyle = "w-full bg-gray-800/50 border border-gray-700 text-white py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all";

    return (
        <section className="page-content space-y-8 max-w-7xl mx-auto py-8 px-4">
            {isAdmin && (
              <div className="text-center mb-6">
                <Link to="/admin-warung" className="btn-secondary py-2 px-6 inline-flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCogs} /> Kelola Warung
                </Link>
              </div>
            )}
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-2">Warung Kripto AFA</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">Jual beli aset kripto eceran dengan mudah, cepat, dan aman.</p>
            </div>
            {isLoading && <div className="text-center py-20"><FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/><p className="mt-3 text-gray-400">Memuat data warung...</p></div>}
            {!isLoading && error && <div className="bg-gray-800 max-w-lg mx-auto text-center p-8 text-red-400 rounded-xl"><FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/><h3 className="font-bold">Gagal Memuat Data</h3><p className="text-sm mt-1">{error}</p></div>}
            
            {!isLoading && !error && (
                rates.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-6 md:p-8 space-y-6 rounded-2xl">
                                <div className="flex border-b border-gray-700">
                                    <button onClick={() => { setActiveTab('beli'); setInputAmount(''); }} className={`pb-3 font-bold w-1/2 text-center transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'beli' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}><FontAwesomeIcon icon={faBolt}/> Beli</button>
                                    <button onClick={() => { setActiveTab('jual'); setInputAmount(''); }} className={`pb-3 font-bold w-1/2 text-center transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'jual' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-white'}`}><FontAwesomeIcon icon={faMoneyBillWave}/> Jual</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                    {/* --- BAGIAN INPUT --- */}
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-400">{activeTab === 'beli' ? 'Anda Bayar (IDR)' : 'Anda Jual (Aset)'}</label>
                                        <input type="number" placeholder="0" value={inputAmount} onChange={e => setInputAmount(e.target.value)} className="w-full bg-transparent text-white text-3xl font-semibold focus:outline-none p-2 rounded-md"/>
                                        {activeTab === 'jual' && baseFiatValue > 0 && (
                                            <div className="text-xs text-gray-400 px-2">≈ Rp {baseFiatValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center pb-2"><FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-gray-500 text-2xl" /></div>
                                    {/* --- BAGIAN OUTPUT --- */}
                                    <div className="md:col-span-2 text-right md:text-left">
                                        <label className="text-xs text-gray-400">Anda Dapat (Estimasi)</label>
                                        <p className="text-3xl font-semibold text-white p-2">{activeTab === 'beli' ? (cryptoAmount || 0).toFixed(6) : 'Rp ' + Math.floor(fiatAmount || 0).toLocaleString('id-ID')}</p>
                                        {activeTab === 'beli' && usdtValue > 0 && (
                                            <div className="text-xs text-gray-400 text-right md:text-left px-2">≈ ${usdtValue.toFixed(2)} USDT</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-white mb-2 block">Pilih Aset</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select value={selectedNetwork || ''} onChange={(e) => { const newNetwork = e.target.value; setSelectedNetwork(newNetwork); if (groupedRates[newNetwork]?.coins.length > 0) setSelectedCoin(groupedRates[newNetwork].coins[0]); }} className={`${inputStyle} pl-4`}><option value="" disabled>Pilih Jaringan</option>{Object.keys(groupedRates).map(network => (<option key={network} value={network}>{network}</option>))}</select>
                                        <select value={selectedCoin?.id || ''} onChange={(e) => { const coin = groupedRates[selectedNetwork]?.coins.find(c => c.id === parseInt(e.target.value)); if(coin) setSelectedCoin(coin); }} disabled={!selectedNetwork} className={`${inputStyle} pl-4`}>
                                            <option value="" disabled>Pilih Koin</option>
                                            {/* PERBAIKAN: Menambahkan optional chaining (?.) untuk mencegah error jika jaringan tidak memiliki koin */}
                                            {selectedNetwork && groupedRates[selectedNetwork]?.coins.map(coin => (
                                                <option key={coin.id} value={coin.id}>{coin.token_symbol}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {isApiNotSet && <p className="text-xs text-center text-yellow-400 mt-3">Admin belum atur API. Harga mungkin tidak akurat.</p>}
                                    {selectedCoin && (
                                        <div className="flex justify-between text-xs text-gray-400 mt-3 px-1">
                                            <div className="flex items-center gap-2" title="Stok yang tersedia untuk diperjualbelikan">
                                                <FontAwesomeIcon icon={faBoxOpen} />
                                                <span>Stok: {activeTab === 'beli' ? selectedCoin.stock.toFixed(4) : `Rp ${selectedCoin.stock_rupiah.toLocaleString()}`}</span>
                                            </div>
                                            <div title="Harga pasar saat ini">
                                                <span>Harga: ${marketPriceUsdt.toFixed(4)} USDT</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {inputAmount > 0 && !isApiNotSet && (
                                    <div className="bg-gray-900/50 p-4 rounded-lg text-sm space-y-2">
                                        <div className="flex justify-between"><span className="text-gray-400">Nilai Transaksi:</span><span>Rp { baseFiatValue.toLocaleString('id-ID', {maximumFractionDigits: 0}) }</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Biaya Layanan:</span><span className="text-primary">{activeTab === 'beli' ? '+ ' : '- '}Rp {adminProfit.toLocaleString('id-ID')}</span></div>
                                        <hr className="border-gray-700"/>
                                        <div className="flex justify-between font-bold"><span className="text-white">{activeTab === 'beli' ? 'Total Bayar' : 'Total Diterima'}:</span><span className="text-primary">Rp { finalPrice.toLocaleString('id-ID', {maximumFractionDigits: 0}) }</span></div>
                                    </div>
                                )}
                                {activeTab === 'beli' ? ( <div><label className="text-sm font-semibold text-white mb-2 block">Alamat Wallet Penerima</label><input type="text" placeholder={`Paste alamat ${selectedCoin?.network || 'wallet'} Anda`} value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className={inputStyle}/></div> ) : ( <div className="space-y-3"><label className="text-sm font-semibold text-white block">Info Pembayaran Anda</label>{/* ... input info pembayaran */}</div> )}
                                <div className="pt-2"><button onClick={handleProceed} disabled={isButtonDisabled} className={`w-full text-lg py-3.5 rounded-lg font-bold disabled:opacity-50 ${activeTab === 'beli' ? 'btn-primary' : 'btn-danger'}`}>{isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : (activeTab === 'beli' ? 'Lanjutkan Pembayaran' : 'Lanjutkan Penjualan')}</button></div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-gray-800/80 rounded-2xl"><h2 className="text-lg font-bold p-4 border-b border-gray-700"><FontAwesomeIcon icon={faHistory}/> Riwayat Transaksi</h2><div className="max-h-96 overflow-y-auto">{history.length > 0 ? (history.map(tx => <TransactionHistoryItem key={tx.id} tx={tx} />)) : (<p className="text-center text-sm text-gray-400 py-8">Belum ada transaksi.</p>)}</div></div>
                            <div className="space-y-4"><BenefitCard icon={faGasPump} title="Cukup Untuk Gas Fee">Beli sesuai kebutuhan.</BenefitCard><BenefitCard icon={faBolt} title="Proses Cepat & Mudah">Lupakan proses panjang di exchange besar.</BenefitCard></div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-20"><p>Warung sedang tutup atau belum ada koin yang tersedia saat ini.</p></div>
                )
            )}
        </section>
    );
}
