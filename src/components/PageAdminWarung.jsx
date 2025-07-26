import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSave, faSpinner, faSync, faCalculator, faPlus, faListAlt, 
    faTimes, faCheck, faExternalLinkAlt, faArrowLeft 
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

// ========================================================================
//  KOMPONEN #1: MODAL DETAIL TRANSAKSI
// ========================================================================
const TransactionModal = ({ tx, onClose, onAction }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        // Ambil URL bukti transfer jika ada
        if (tx && tx.order_type === 'buy' && tx.proof_screenshot_url) {
            const getSignedUrl = async () => {
                const { data, error } = await supabase.storage.from('buktitransfer').createSignedUrl(tx.proof_screenshot_url, 300);
                if (error) console.error("Gagal membuat signed URL", error);
                else setImageUrl(data.signedUrl);
            };
            getSignedUrl();
        }
    }, [tx]);

    if (!tx) return null;

    const handleActionClick = async (newStatus) => {
        setIsActionLoading(true);
        await onAction(tx.id, newStatus);
        setIsActionLoading(false);
    };

    const isBuy = tx.order_type === 'buy';

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-xl">Detail Transaksi #{tx.id}</h3>
                <div className="text-sm space-y-2">
                    <p><strong>User ID:</strong> <span className='font-mono text-xs'>{tx.user_id}</span></p>
                    <p><strong>Tipe:</strong> <span className={`font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>{tx.order_type.toUpperCase()}</span></p>
                    <p><strong>Aset:</strong> {tx.amount_crypto} {tx.token_symbol}</p>
                    <p><strong>Nominal:</strong> Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</p>
                    <p><strong>{isBuy ? 'Wallet User:' : 'Info Bayar User:'}</strong> <span className="font-mono text-xs">{isBuy ? tx.user_wallet_address : tx.user_payment_info}</span></p>
                    <div><strong>Bukti:</strong>
                        {isBuy ? (
                            imageUrl ? <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">Lihat Screenshot <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : "Memuat..."
                        ) : (
                            tx.proof_tx_hash ? <a href={`https://etherscan.io/tx/${tx.proof_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">{tx.proof_tx_hash.substring(0, 12)}... <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : "N/A"
                        )}
                    </div>
                </div>
                {tx.status === 'WAITING_CONFIRMATION' && (
                    <div className="flex gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                        <button onClick={() => handleActionClick('COMPLETED')} disabled={isActionLoading} className="btn-success w-full py-2 flex items-center justify-center gap-2">
                            {isActionLoading ? <FontAwesomeIcon icon={faSpinner} spin/> : <FontAwesomeIcon icon={faCheck}/>} Setujui
                        </button>
                        <button onClick={() => handleActionClick('REJECTED')} disabled={isActionLoading} className="btn-danger w-full py-2 flex items-center justify-center gap-2">
                            {isActionLoading ? <FontAwesomeIcon icon={faSpinner} spin/> : <FontAwesomeIcon icon={faTimes}/>} Tolak
                        </button>
                    </div>
                )}
                <button onClick={onClose} className="btn-secondary w-full mt-2 py-2">Tutup</button>
            </div>
        </div>
    );
};

// ========================================================================
//  KOMPONEN #2: EDITOR UNTUK SATU KOIN
// ========================================================================
const CoinSettingsEditor = ({ initialRate, onActionComplete }) => {
    const [rate, setRate] = useState(initialRate);
    const [calcInput, setCalcInput] = useState({ idr: '', crypto: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { setRate(initialRate); }, [initialRate]);

    const handleInputChange = (e) => {
        setRate(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const applySimpleRate = () => {
        const idrValue = parseFloat(calcInput.idr);
        const cryptoValue = parseFloat(calcInput.crypto);
        if (!idrValue || !cryptoValue || idrValue <= 0 || cryptoValue <= 0) {
            alert("Isi kalkulator dengan benar."); return;
        }
        const spread = parseFloat(rate.spread_percent) || 0;
        const calculatedSellRate = idrValue / cryptoValue;
        const calculatedBuyRate = calculatedSellRate * (1 - (spread / 100));
        setRate(prev => ({ ...prev, base_rate: calculatedSellRate.toFixed(2), rate_sell: calculatedSellRate.toFixed(2), rate_buy: calculatedBuyRate.toFixed(2) }));
    };

    const handleSave = async () => {
        setIsSaving(true); setError('');
        const dataToSubmit = { ...rate };
        delete dataToSubmit.id;
        for (const key in dataToSubmit) { if (dataToSubmit[key] === '') dataToSubmit[key] = null; }
        const { error: updateError } = await supabase.from('crypto_rates').update(dataToSubmit).eq('id', rate.id);
        if (updateError) { setError('Gagal menyimpan: ' + updateError.message); }
        else { onActionComplete(`Pengaturan ${rate.token_symbol} disimpan!`); }
        setIsSaving(false);
    };

    return (
        <div className={`p-4 border rounded-lg space-y-4 ${error ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'}`}>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{rate.token_symbol}</h3>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-2">
                    {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />} {isSaving ? 'Menyimpan' : 'Simpan'}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="bg-black/5 dark:bg-dark p-3 rounded-lg">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-2"><FontAwesomeIcon icon={faCalculator}/> Kalkulator</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 items-center">
                    <input type="number" placeholder="Jumlah Rupiah" value={calcInput.idr} onChange={e => setCalcInput({...calcInput, idr: e.target.value})} className="input-field-small" />
                    <input type="number" placeholder={`Jml ${rate.token_symbol}`} value={calcInput.crypto} onChange={e => setCalcInput({...calcInput, crypto: e.target.value})} className="input-field-small" />
                    <button onClick={applySimpleRate} className="btn-secondary text-xs py-2 px-3">Terapkan</button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <InputField label="Harga Dasar" name="base_rate" value={rate.base_rate} onChange={handleInputChange} />
                <InputField label="Spread (%)" name="spread_percent" value={rate.spread_percent} onChange={handleInputChange} />
                <InputField label="Harga Jual" name="rate_sell" value={rate.rate_sell} onChange={handleInputChange} />
                <InputField label="Harga Beli" name="rate_buy" value={rate.rate_buy} onChange={handleInputChange} />
                <InputField label="Stok Koin" name="stock" value={rate.stock} onChange={handleInputChange} step="any" />
            </div>
        </div>
    );
};
const InputField = ({ label, name, value, onChange, type = "number", step = "0.01" }) => (
    <div><label className="text-xs font-bold text-gray-500">{label}</label><input type={type} name={name} step={step} value={value ?? ''} onChange={onChange} className="input-field w-full mt-1"/></div>
);


// ========================================================================
//  KOMPONEN #3: HALAMAN UTAMA ADMIN (DENGAN TABS)
// ========================================================================
export default function PageAdminWarung() {
    const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' atau 'settings'
    const [rates, setRates] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTxTab, setActiveTxTab] = useState('WAITING_CONFIRMATION');
    const [selectedTx, setSelectedTx] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [ratesRes, txRes] = await Promise.all([
                supabase.from('crypto_rates').select('*').order('token_symbol'),
                supabase.from('warung_transactions').select('*').order('created_at', { ascending: false })
            ]);
            if (ratesRes.error) throw ratesRes.error;
            if (txRes.error) throw txRes.error;
            setRates(ratesRes.data);
            setTransactions(txRes.data);
        } catch (error) {
            setNotification("Gagal memuat data: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleActionComplete = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 4000);
    };

    const handleTransactionAction = async (txId, newStatus) => {
        const { error } = await supabase.from('warung_transactions').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', txId);
        if (error) {
            alert("Gagal update status: " + error.message);
        } else {
            setNotification(`Transaksi #${txId} diupdate ke ${newStatus}`);
            setSelectedTx(null);
            fetchData();
        }
    };

    const filteredTransactions = transactions.filter(tx => tx.status === activeTxTab);

    return (
        <section className="page-content space-y-6 max-w-6xl mx-auto py-8">
            <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} onAction={handleTransactionAction} />
            
            <Link to="/" className="text-sm text-primary hover:underline mb-4 inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faArrowLeft} /> Kembali ke Warung
            </Link>
            <h1 className="text-3xl font-bold">Panel Admin Warung Kripto</h1>
            
            {notification && <div className="bg-green-500/10 text-green-400 p-3 rounded-md text-sm">{notification}</div>}

            <div className="flex border-b border-black/10 dark:border-white/10">
                <button onClick={() => setActiveTab('transactions')} className={`pb-3 px-5 font-semibold ${activeTab === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Kelola Transaksi</button>
                <button onClick={() => setActiveTab('settings')} className={`pb-3 px-5 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Atur Kurs & Stok</button>
            </div>

            {isLoading ? <div className="text-center py-10"><FontAwesomeIcon icon={faSpinner} spin size="2x"/></div> : (
                <>
                    {/* Tampilan Kelola Transaksi */}
                    {activeTab === 'transactions' && (
                        <div className="card-premium p-4 md:p-6">
                            <div className="flex border-b border-black/10 dark:border-white/10 mb-2">
                                <button onClick={() => setActiveTxTab('WAITING_CONFIRMATION')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'WAITING_CONFIRMATION' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Menunggu</button>
                                <button onClick={() => setActiveTxTab('COMPLETED')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'COMPLETED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Selesai</button>
                                <button onClick={() => setActiveTxTab('REJECTED')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'REJECTED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Ditolak</button>
                            </div>
                            <div className="space-y-1">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map(tx => (
                                        <button key={tx.id} onClick={() => setSelectedTx(tx)} className="w-full text-left grid grid-cols-4 gap-2 items-center p-3 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-dark/50 transition-colors rounded-md">
                                            <span className="font-semibold text-sm font-mono">{tx.user_id.substring(0,8)}...</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full text-center ${tx.order_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tx.order_type.toUpperCase()}</span>
                                            <span className="text-sm">Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</span>
                                            <span className="text-sm font-mono">{Number(tx.amount_crypto).toFixed(5)} {tx.token_symbol}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-8">Tidak ada transaksi di tab ini.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Tampilan Atur Kurs & Stok */}
                    {activeTab === 'settings' && (
                        <div className="card-premium p-4 md:p-6 space-y-6">
                            {rates.map(rate => (
                                <CoinSettingsEditor key={rate.id} initialRate={rate} onActionComplete={handleActionComplete} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
