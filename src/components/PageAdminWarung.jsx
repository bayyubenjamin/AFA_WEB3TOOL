import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave, faSpinner, faSync, faCalculator, faPlus, faListAlt,
    faTimes, faCheck, faExternalLinkAlt, faArrowLeft, faUpload
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

// ========================================================================
//  KOMPONEN-KOMPONEN KECIL (HELPER)
// ========================================================================

const TransactionModal = ({ tx, onClose, onAction }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [adminProofFile, setAdminProofFile] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
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
        await onAction(tx.id, newStatus, adminProofFile);
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
                
                {tx.status === 'WAITING_CONFIRMATION' && !isBuy && (
                    <div className="pt-4 border-t border-black/10 dark:border-white/10">
                        <label className="text-sm font-bold text-light-text dark:text-dark-text mb-2 block">Unggah Bukti Transfer ke User</label>
                        <input type="file" accept="image/*" onChange={(e) => setAdminProofFile(e.target.files[0])} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                    </div>
                )}

                {tx.status === 'WAITING_CONFIRMATION' && (
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => handleActionClick('COMPLETED')} disabled={isActionLoading || (!isBuy && !adminProofFile)} className="btn-success w-full py-2 flex items-center justify-center gap-2">
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

const AddCoinModal = ({ onClose, onSave }) => {
    const [newCoin, setNewCoin] = useState({ token_symbol: '', token_name: '', network: '', icon: '', admin_wallet: '', is_active: true, rate_sell: '', rate_buy: '', stock: '', stock_rupiah: '', base_rate: '', spread_percent: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCoin(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveClick = async () => {
        if (!newCoin.token_symbol || !newCoin.token_name || !newCoin.network) {
            alert('Simbol, Nama Koin, dan Jaringan wajib diisi.');
            return;
        }
        setIsSaving(true);
        await onSave(newCoin);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-xl text-light-text dark:text-white">Tambah Koin Baru</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <InputField label="Simbol" name="token_symbol" value={newCoin.token_symbol} onChange={handleInputChange} type="text" />
                    <InputField label="Nama Koin" name="token_name" value={newCoin.token_name} onChange={handleInputChange} type="text" />
                    <InputField label="Jaringan" name="network" value={newCoin.network} onChange={handleInputChange} type="text" />
                    <InputField label="URL Ikon" name="icon" value={newCoin.icon} onChange={handleInputChange} type="text" />
                    <div className="col-span-2"><InputField label="Wallet Admin" name="admin_wallet" value={newCoin.admin_wallet} onChange={handleInputChange} type="text" /></div>
                    <InputField label="Harga Dasar" name="base_rate" value={newCoin.base_rate} onChange={handleInputChange} />
                    <InputField label="Spread (%)" name="spread_percent" value={newCoin.spread_percent} onChange={handleInputChange} />
                    <InputField label="Harga Jual" name="rate_sell" value={newCoin.rate_sell} onChange={handleInputChange} />
                    <InputField label="Harga Beli" name="rate_buy" value={newCoin.rate_buy} onChange={handleInputChange} />
                    <InputField label="Stok Koin" name="stock" value={newCoin.stock} onChange={handleInputChange} step="any" />
                    <InputField label="Stok Rupiah" name="stock_rupiah" value={newCoin.stock_rupiah} onChange={handleInputChange} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="btn-secondary px-4 py-2">Batal</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="btn-primary px-4 py-2">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin/> : 'Simpan Koin'}</button>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, name, value, onChange, type = "number", step = "0.01" }) => (
    <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</label>
        <input
            type={type}
            name={name}
            step={step}
            value={value ?? ''}
            onChange={onChange}
            className="input-field w-full mt-1"
        />
    </div>
);

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
        else { onActionComplete(`Pengaturan ${rate.token_symbol} (${rate.network}) disimpan!`); }
        setIsSaving(false);
    };

    return (
        <div className={`p-4 border rounded-lg space-y-4 ${error ? 'border-red-500/50' : 'border-black/10 dark:border-white/10'}`}>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{rate.token_symbol} <span className="text-sm font-normal text-gray-400">({rate.network})</span></h3>
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

// --- KOMPONEN UTAMA ADMIN ---
export default function PageAdminWarung({ onSwitchView }) {
    const [activeTab, setActiveTab] = useState('transactions');
    const [rates, setRates] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTxTab, setActiveTxTab] = useState('WAITING_CONFIRMATION');
    const [selectedTx, setSelectedTx] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState('');
    const [showAddCoinModal, setShowAddCoinModal] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setNotification('');
        try {
            const { data, error } = await supabase.functions.invoke('get-admin-data');
            if (error) {
                throw new Error(`Gagal memanggil fungsi: ${error.message}`);
            }
            
            setRates(data.rates || []);
            setTransactions(data.transactions || []);
        } catch (error) {
            console.error("Gagal mengambil data admin:", error);
            setNotification("Gagal mengambil data: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleActionComplete = (message) => {
        setNotification(message);
        fetchData(); // Muat ulang data setelah ada perubahan
        setTimeout(() => setNotification(''), 4000);
    };

    const handleTransactionAction = async (txId, newStatus, adminProofFile) => {
        const updatePayload = { status: newStatus, updated_at: new Date().toISOString() };
        try {
            if (newStatus === 'COMPLETED' && adminProofFile) {
                const fileExt = adminProofFile.name.split('.').pop();
                const fileName = `admin_${txId}_${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('adminbuktibayar')
                    .upload(fileName, adminProofFile);

                if (uploadError) throw new Error(`Gagal unggah bukti: ${uploadError.message}`);
                
                updatePayload.admin_proof_url = fileName;
            }
            
            const { error: updateError } = await supabase.from('warung_transactions').update(updatePayload).eq('id', txId);
            if (updateError) throw updateError;

            setNotification(`Transaksi #${txId} diupdate ke ${newStatus}`);
            setSelectedTx(null);
            fetchData();
        } catch (error) {
            alert("Gagal update status: " + error.message);
        }
    };
    
    const handleAddNewCoin = async (newCoinData) => {
        try {
            for (const key in newCoinData) {
                if (newCoinData[key] === '') {
                    newCoinData[key] = null;
                }
            }
            
            const { error } = await supabase.from('crypto_rates').insert([newCoinData]);
            if (error) throw error;
            
            setNotification(`Koin ${newCoinData.token_symbol} berhasil ditambahkan!`);
            fetchData();
        } catch(error) {
            alert("Gagal menambah koin: " + error.message);
        }
    };

    const filteredTransactions = transactions.filter(tx => tx.status === activeTxTab);

    return (
        <section className="page-content space-y-6 max-w-6xl mx-auto py-8">
            {showAddCoinModal && <AddCoinModal onClose={() => setShowAddCoinModal(false)} onSave={handleAddNewCoin} />}
            <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} onAction={handleTransactionAction} />
            
            <button onClick={onSwitchView} className="text-sm text-primary hover:underline mb-4 inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faArrowLeft} /> Kembali ke Tampilan User
            </button>
            <h1 className="text-3xl font-bold">Panel Admin Warung Kripto</h1>
            
            {notification && <div className="bg-green-500/10 text-green-400 p-3 rounded-md text-sm">{notification}</div>}

            <div className="flex border-b border-black/10 dark:border-white/10">
                <button onClick={() => setActiveTab('transactions')} className={`pb-3 px-5 font-semibold ${activeTab === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Kelola Transaksi</button>
                <button onClick={() => setActiveTab('settings')} className={`pb-3 px-5 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Atur Kurs & Stok</button>
            </div>

            {isLoading ? (
                <div className="text-center py-10"><FontAwesomeIcon icon={faSpinner} spin size="2x"/></div>
            ) : (
                <>
                    {activeTab === 'transactions' && (
                        <div className="card-premium p-4 md:p-6">
                            <div className="flex border-b border-black/10 dark:border-white/10 mb-2">
                                <button onClick={() => setActiveTxTab('WAITING_CONFIRMATION')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'WAITING_CONFIRMATION' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Menunggu</button>
                                <button onClick={() => setActiveTxTab('COMPLETED')} className={`pb-3 px-4 text-sm font-semibold ${activeTab === 'COMPLETED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Selesai</button>
                                <button onClick={() => setActiveTxTab('REJECTED')} className={`pb-3 px-4 text-sm font-semibold ${activeTab === 'REJECTED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Ditolak</button>
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
                    
                    {activeTab === 'settings' && (
                        <div className="card-premium p-4 md:p-6 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Atur Kurs & Stok</h2>
                                <button onClick={() => setShowAddCoinModal(true)} className="btn-success text-sm px-4 py-2 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faPlus} /> Tambah Koin
                                </button>
                            </div>
                            {rates.length > 0 ? (
                                rates.map(rate => (
                                    <CoinSettingsEditor 
                                        key={rate.id} 
                                        initialRate={rate} 
                                        onActionComplete={handleActionComplete} 
                                    />
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-400 py-8">Belum ada koin untuk diatur. Klik "Tambah Koin" untuk memulai.</p>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
