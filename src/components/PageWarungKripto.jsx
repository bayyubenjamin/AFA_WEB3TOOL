import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStore, faCoins, faMoneyBillWave, faArrowRightArrowLeft, faCheckCircle,
    faShieldAlt, faWallet, faUpload, faGasPump, faBolt, faSpinner,
    faExclamationTriangle, faHistory, faCogs, faCopy, faReceipt, faQuestionCircle,
    faAngleDown, faAngleUp
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import PageAdminWarung from './PageAdminWarung';

// --- KONSTANTA & KOMPONEN HELPER ---

const MIN_TRANSACTION_IDR = 10000;

// Kartu Keuntungan
const BenefitCard = ({ icon, title, children }) => (
    <div className="bg-light-card/80 dark:bg-dark-card/50 border border-light-border dark:border-dark-border p-4 rounded-xl flex items-start gap-4 backdrop-blur-sm">
        <FontAwesomeIcon icon={icon} className="text-primary text-xl mt-1" />
        <div>
            <h4 className="font-bold text-light-text dark:text-dark-text">{title}</h4>
            <p className="text-sm text-light-subtle dark:text-dark-subtle">{children}</p>
        </div>
    </div>
);

// Item Riwayat Transaksi dengan Desain Baru
const TransactionHistoryItem = ({ tx }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusMap = {
        PENDING: { text: 'Menunggu', color: 'bg-yellow-500/10 text-yellow-400', icon: faSpinner },
        WAITING_CONFIRMATION: { text: 'Diproses', color: 'bg-blue-500/10 text-blue-400', icon: faSpinner },
        COMPLETED: { text: 'Selesai', color: 'bg-green-500/10 text-green-400', icon: faCheckCircle },
        REJECTED: { text: 'Ditolak', color: 'bg-red-500/10 text-red-400', icon: faExclamationTriangle },
    };
    
    const status = statusMap[tx.status] || { text: tx.status, color: 'bg-gray-500/10 text-gray-400', icon: faQuestionCircle };
    const isBuy = tx.order_type === 'buy';

    return (
        <div className="border-b border-light-border dark:border-dark-border last:border-b-0">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
                        <p><strong>Info Pembayaran Anda:</strong> <span className="font-mono break-all">{tx.user_payment_info}</span></p>
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
        if (!currentUser || !currentUser.id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const [ratesRes, txRes] = await Promise.all([
                supabase.from('crypto_rates').select('*').eq('is_active', true),
                supabase.from('warung_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20)
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
            setError(dbError.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => { 
        setInputAmount(''); 
        setOutputAmount(0); 
        setWalletAddress(''); 
        setUserPaymentInfo(''); 
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
            const transactionData = {
                user_id: currentUser.id,
                order_type: activeTab,
                token_symbol: selectedCoin.token_symbol,
                amount_idr: activeTab === 'buy' ? parseFloat(inputAmount) : outputAmount,
                amount_crypto: activeTab === 'buy' ? outputAmount : parseFloat(inputAmount),
                status: 'WAITING_CONFIRMATION',
                user_wallet_address: walletAddress,
                user_payment_info: userPaymentInfo,
            };

            if (activeTab === 'buy') {
                if (!proof) throw new Error("Bukti transfer belum diunggah.");
                const fileExt = proof.name.split('.').pop();
                const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('buktitransfer')
                    .upload(fileName, proof);
                if (uploadError) throw new Error(`Gagal unggah bukti: ${uploadError.message}`);
                transactionData.proof_screenshot_url = fileName;
            }

            const { error: insertError } = await supabase.from('warung_transactions').insert(transactionData);
            if (insertError) throw new Error(`Gagal menyimpan transaksi: ${insertError.message}`);
            
            alert('Permintaan transaksi berhasil dikirim! Mohon tunggu konfirmasi dari admin.');
            setShowInstructionPage(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = activeTab === 'buy'
        ? (!selectedCoin || !inputAmount || !walletAddress || (selectedCoin.stock && outputAmount > selectedCoin.stock))
        : (!selectedCoin || !inputAmount || !userPaymentInfo || (selectedCoin.stock_rupiah && outputAmount > selectedCoin.stock_rupiah));

    if (currentUser && currentUser.role === 'admin' && view === 'admin') {
        return <PageAdminWarung onSwitchView={() => setView('user')} />;
    }

    if (showInstructionPage && selectedCoin) {
        return (
            <div className="page-content max-w-lg mx-auto py-8">
                <div className="card p-6 md:p-8 space-y-6 text-center">
                    <FontAwesomeIcon icon={faReceipt} className="text-5xl text-primary mb-4" />
                    <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Konfirmasi Transaksi</h2>
                    {activeTab === 'buy' ? (
                        <>
                            <p className="text-light-subtle dark:text-dark-subtle">Silakan transfer sejumlah <strong className="text-light-text dark:text-dark-text font-bold text-lg">Rp {Number(inputAmount).toLocaleString('id-ID')}</strong> ke salah satu rekening admin.</p>
                            <div className="text-left bg-light-bg dark:bg-dark-bg p-4 rounded-lg text-light-subtle dark:text-dark-subtle">
                                <p><strong>DANA/OVO/GOPAY:</strong> 0812-XXXX-XXXX</p>
                                <p><strong>BCA:</strong> 1234567890 a/n Admin</p>
                            </div>
                            <p className="text-light-subtle dark:text-dark-subtle">Kemudian unggah bukti transfer Anda.</p>
                            <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files[0])} className="w-full text-sm text-light-subtle dark:text-dark-subtle file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
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
                <button onClick={() => setView('admin')} className="w-full btn-secondary py-3 mb-6 flex items-center justify-center gap-2">
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
                                     <p className="text-3xl font-semibold text-light-text dark:text-dark-text p-2">{outputAmount > 0 ? (activeTab === 'buy' ? outputAmount.toFixed(6) : 'Rp ' + outputAmount.toLocaleString('id-ID')) : '0'}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-semibold text-light-text dark:text-dark-text mb-2 block">Pilih Aset</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {allCoins.map(coin => (
                                        <button key={coin.token_symbol} onClick={() => setSelectedCoin(coin)} className={`p-3 rounded-lg border-2 transition-all ${selectedCoin?.token_symbol === coin.token_symbol ? 'border-primary bg-primary/10' : 'border-light-border dark:border-dark-border hover:border-primary/50 bg-light-bg dark:bg-dark-bg'}`}>
                                            <img src={coin.icon} alt={coin.token_symbol} className="w-8 h-8 mx-auto mb-1"/>
                                            <span className="text-xs font-bold text-light-text dark:text-dark-text">{coin.token_symbol}</span>
                                        </button>
                                    ))}
                                </div>
                                {selectedCoin && <p className="text-xs text-center text-light-subtle dark:text-dark-subtle mt-3">Kurs: 1 {selectedCoin.token_symbol} ≈ Rp {Number(activeTab === 'buy' ? selectedCoin.rate_sell : selectedCoin.rate_buy).toLocaleString('id-ID')}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-light-text dark:text-dark-text mb-2 block">{activeTab === 'buy' ? 'Alamat Wallet Penerima Anda' : 'Info Pembayaran Anda'}</label>
                                <input type="text" placeholder={activeTab === 'buy' ? `Paste alamat ${selectedCoin?.network} Anda di sini` : 'cth: DANA 0812... / BCA 1234...'} value={activeTab === 'buy' ? walletAddress : userPaymentInfo} onChange={e => activeTab === 'buy' ? setWalletAddress(e.target.value) : setUserPaymentInfo(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-3 px-4 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"/>
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
                                    <p className="text-sm text-center py-10 text-light-subtle dark:text-dark-subtle">Anda belum memiliki riwayat transaksi.</p>
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

