import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faCoins, faMoneyBillWave, faArrowRightArrowLeft, faCheckCircle, faUser, faShieldAlt, faWallet, faUpload, faIdCard, faGasPump, faBolt, faSpinner, faExclamationTriangle, faHistory, faCogs } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { supabase } from '../supabaseClient';
import PageAdminWarung from './PageAdminWarung'; // Pastikan file ini ada

const MIN_TRANSACTION_IDR = 10000;

// -- Komponen UI (Tidak Berubah) --
const BenefitCard = ({ icon, title, children }) => (
    <div className="bg-light-card dark:bg-dark-card border border-black/5 dark:border-white/5 p-4 rounded-xl flex items-start gap-4">
        <FontAwesomeIcon icon={icon} className="text-primary text-xl mt-1" />
        <div>
            <h4 className="font-bold text-light-text dark:text-white">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>
        </div>
    </div>
);

const TransactionHistoryItem = ({ tx }) => {
    const statusMap = {
        PENDING: { text: 'Menunggu Pembayaran', color: 'bg-yellow-500/10 text-yellow-500' },
        WAITING_CONFIRMATION: { text: 'Diproses', color: 'bg-blue-500/10 text-blue-500' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-500/10 text-green-500' },
        REJECTED: { text: 'Ditolak', color: 'bg-red-500/10 text-red-500' },
    };
    const status = statusMap[tx.status] || { text: tx.status, color: 'bg-gray-500/10 text-gray-500' };
    const isBuy = tx.order_type === 'buy';

    return (
        <div className="p-3 border-b border-black/5 dark:border-white/5 grid grid-cols-3 gap-2 items-center">
            <div className="flex flex-col">
                <span className="font-bold text-sm text-light-text dark:text-white">{tx.token_symbol}</span>
                <span className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="text-center">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color}`}>{status.text}</span>
            </div>
            <div className={`flex flex-col text-right font-mono text-sm ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                <span>{isBuy ? '+' : '-'} {Number(tx.amount_crypto).toFixed(6)}</span>
                <span className="text-xs text-gray-400">Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</span>
            </div>
        </div>
    );
};


// -- Komponen Utama --
export default function PageWarungKripto({ currentUser }) {
    const [view, setView] = useState('user');
    const [activeTab, setActiveTab] = useState('buy');
    const [selectedCoin, setSelectedCoin] = useState(null);
    const [allCoins, setAllCoins] = useState([]);
    const [inputAmount, setInputAmount] = useState('');
    const [outputAmount, setOutputAmount] = useState(0);
    const [walletAddress, setWalletAddress] = useState('');
    const [userPaymentInfo, setUserPaymentInfo] = useState('');
    const [showInstructionPage, setShowInstructionPage] = useState(false);
    const [proof, setProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [userTransactions, setUserTransactions] = useState([]);

    const fetchData = useCallback(async () => {
        // Pengecekan krusial: jangan fetch apapun jika user belum login/terdefinisi
        if (!currentUser || !currentUser.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const [ratesRes, txRes] = await Promise.all([
                supabase.from('crypto_rates').select('*').eq('is_active', true),
                supabase.from('warung_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
            ]);
            
            if (ratesRes.error) throw new Error(`Gagal mengambil data koin: ${ratesRes.error.message}`);
            if (txRes.error) throw new Error(`Gagal mengambil riwayat transaksi: ${txRes.error.message}`);

            if (ratesRes.data && ratesRes.data.length > 0) {
                setAllCoins(ratesRes.data);
                setSelectedCoin(ratesRes.data[0]);
            } else {
                setError("Warung sedang tutup. Belum ada koin yang tersedia.");
            }
            setUserTransactions(txRes.data);
        } catch (dbError) {
            console.error("Gagal mengambil data:", dbError);
            setError(dbError.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => { setInputAmount(''); setOutputAmount(0); setWalletAddress(''); setUserPaymentInfo(''); setProof(null); }, [activeTab]);
    
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

    const handleProceed = async () => { /* ... (Tidak Berubah) ... */ };
    const handleFinalSubmit = async () => { /* ... (Tidak Berubah) ... */ };
    
    const isButtonDisabled = activeTab === 'buy' 
        ? (!selectedCoin || !inputAmount || inputAmount < MIN_TRANSACTION_IDR || !walletAddress || (selectedCoin.stock && outputAmount > selectedCoin.stock))
        : (!selectedCoin || !inputAmount || !userPaymentInfo || (selectedCoin.stock_rupiah && outputAmount > selectedCoin.stock_rupiah));

    if (currentUser && currentUser.role === 'admin' && view === 'admin') {
        return <PageAdminWarung onSwitchView={() => setView('user')} />;
    }
    
    if (showInstructionPage && selectedCoin) {
        // ... (Kode Halaman Instruksi tidak berubah)
    }
    
    return (
        <section className="page-content space-y-8 max-w-7xl mx-auto py-8">
            {currentUser && currentUser.role === 'admin' && (
                <button onClick={() => setView('admin')} className="w-full btn-secondary py-3 mb-6 flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faCogs} /> Kelola Warung (Admin)
                </button>
            )}

            {isLoading ? (
                <div className="text-center py-20">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/>
                    <p className="mt-3 text-gray-500 dark:text-gray-400">Memuat data warung...</p>
                </div>
            ) : error ? (
                <div className="card-premium max-w-lg mx-auto text-center p-8 text-red-500">
                    <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/>
                    <h3 className="font-bold">Gagal Memuat Data</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* --- KOLOM KIRI: FORM TRANSAKSI --- */}
                    <div className="lg:col-span-3">
                        <div className="card-premium p-6 md:p-8 space-y-5 h-full flex flex-col">
                            <h2 className="text-2xl font-bold text-light-text dark:text-white">Transaksi Eceran</h2>
                            <div className="flex border-b border-black/10 dark:border-white/10">
                                <button onClick={() => setActiveTab('buy')} className={`pb-3 font-semibold w-1/2 text-center transition-all duration-300 ${activeTab === 'buy' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-primary'}`}>Beli dari Admin</button>
                                <button onClick={() => setActiveTab('sell')} className={`pb-3 font-semibold w-1/2 text-center transition-all duration-300 ${activeTab === 'sell' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`}>Jual ke Admin</button>
                            </div>
                            
                            <div className="flex-grow space-y-4">
                                <div className="bg-black/5 dark:bg-dark border border-transparent focus-within:border-primary/50 rounded-lg p-3 flex items-stretch transition-all">
                                    <div className="flex-grow pr-3">
                                        <label className="text-xs text-gray-500 dark:text-gray-400">{activeTab === 'buy' ? 'Jumlah Bayar' : 'Jumlah Jual'}</label>
                                        <input type="number" placeholder="0" value={inputAmount} onChange={e => setInputAmount(e.target.value)} className="w-full bg-transparent text-light-text dark:text-gray-200 text-2xl font-semibold focus:outline-none"/>
                                    </div>
                                    <div className="border-l border-black/10 dark:border-white/10 pl-3">
                                        <label className="text-xs text-gray-500 dark:text-gray-400">{activeTab === 'buy' ? 'IDR' : 'Aset'}</label>
                                        {activeTab === 'buy' ? <p className="text-2xl font-semibold">🇮🇩</p> : (
                                            <select onChange={e => setSelectedCoin(allCoins.find(c => c.token_symbol === e.target.value))} value={selectedCoin?.token_symbol} className="bg-transparent font-semibold text-light-text dark:text-white focus:outline-none -ml-2">
                                                {allCoins.map(c => <option key={c.token_symbol} value={c.token_symbol} className="bg-dark">{c.token_symbol}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center py-2 px-1">
                                    <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-gray-400"/>
                                    <span className="text-xs text-gray-400">Kurs: Rp {selectedCoin ? Number(activeTab === 'buy' ? selectedCoin.rate_sell : selectedCoin.rate_buy).toLocaleString('id-ID') : 0}</span>
                                </div>

                                <div className="bg-black/5 dark:bg-dark rounded-lg p-3 flex items-stretch">
                                    <div className="flex-grow pr-3">
                                        <label className="text-xs text-gray-500 dark:text-gray-400">Anda Dapat (Estimasi)</label>
                                        <p className="text-2xl font-semibold text-light-text dark:text-white">{outputAmount > 0 ? (activeTab === 'buy' ? outputAmount.toFixed(6) : outputAmount.toLocaleString('id-ID')) : '0'}</p>
                                    </div>
                                    <div className="border-l border-black/10 dark:border-white/10 pl-3 flex flex-col justify-center items-center">
                                        <label className="text-xs text-gray-500 dark:text-gray-400">{activeTab === 'buy' ? 'Aset' : 'IDR'}</label>
                                        {activeTab === 'sell' ? <p className="text-2xl font-semibold">🇮🇩</p> : (
                                            <div className="flex items-center">
                                                {selectedCoin && <img src={selectedCoin.icon} alt={selectedCoin.token_symbol} className="w-6 h-6 mr-2"/>}
                                                <span className="font-semibold">{selectedCoin?.token_symbol}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-center text-gray-400">
                                    {activeTab === 'buy' ? `Stok Admin: ${selectedCoin ? Number(selectedCoin.stock).toFixed(4) : 0} ${selectedCoin?.token_symbol}` : `Dana Admin: Rp ${selectedCoin ? Number(selectedCoin.stock_rupiah).toLocaleString('id-ID') : 0}`}
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 block">{activeTab === 'buy' ? 'Alamat Wallet Penerima' : 'Info Pembayaran Anda'}</label>
                                <input type="text" placeholder={activeTab === 'buy' ? `Paste alamat ${selectedCoin?.network} Anda` : 'cth: DANA 0812...'} value={activeTab === 'buy' ? walletAddress : userPaymentInfo} onChange={e => activeTab === 'buy' ? setWalletAddress(e.target.value) : setUserPaymentInfo(e.target.value)} className="w-full bg-black/5 dark:bg-dark border border-black/10 dark:border-white/10 text-light-text dark:text-gray-200 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:border-primary"/>
                            </div>
                            
                            <div className="pt-2">
                                <button onClick={handleProceed} disabled={isButtonDisabled || isSubmitting} className={`w-full text-lg py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'buy' ? 'btn-primary' : 'btn-danger'}`}>
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Lanjutkan'}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-2">Minimal transaksi Rp {MIN_TRANSACTION_IDR.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- KOLOM KANAN: RIWAYAT & INFO --- */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="card-premium p-6">
                            <h2 className="text-lg font-bold text-light-text dark:text-white flex items-center gap-2 mb-2"><FontAwesomeIcon icon={faHistory}/> Riwayat Transaksi Saya</h2>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {userTransactions.length > 0 ? (
                                    userTransactions.map(tx => <TransactionHistoryItem key={tx.id} tx={tx} />)
                                ) : (
                                    <p className="text-sm text-center py-8 text-gray-400">Anda belum memiliki riwayat transaksi.</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-light-text dark:text-white">Kenapa Transaksi di Sini?</h2>
                            <BenefitCard icon={faGasPump} title="Cukup Untuk Gas Fee">Beli sesuai kebutuhan untuk biaya transaksi airdrop. Tidak perlu beli banyak.</BenefitCard>
                            <BenefitCard icon={faBolt} title="Proses Cepat & Mudah">Lupakan proses panjang di exchange besar. Di sini, transaksi lebih cepat.</BenefitCard>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
