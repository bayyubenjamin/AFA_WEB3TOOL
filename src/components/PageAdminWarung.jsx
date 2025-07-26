import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave, faSpinner, faSync, faCalculator, faPlus, faListAlt,
    faTimes, faCheck, faExternalLinkAlt, faArrowLeft, faUpload, faTrash, faPen, faAngleDown
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

// ========================================================================
//  KOMPONEN-KOMPONEN KECIL (HELPER)
// ========================================================================

const COMMON_NETWORKS = [
    "Solana", "Ethereum", "Binance Smart Chain (BSC)", "Polygon", 
    "Arbitrum", "Optimism", "Base", "Avalanche", "Tron", "Cosmos"
];

// MODIFIKASI: Tambahkan daftar ikon jaringan yang umum
const COMMON_NETWORK_ICONS = {
    "Solana": "https://cryptologos.cc/logos/solana-sol-logo.png",
    "Ethereum": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    "Binance Smart Chain (BSC)": "https://cryptologos.cc/logos/binance-coin-bnb-logo.png",
    "Polygon": "https://cryptologos.cc/logos/polygon-matic-logo.png",
    "Arbitrum": "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
    "Optimism": "https://cryptologos.cc/logos/optimism-op-logo.png",
    "Base": "https://cryptologos.cc/logos/base-badge.png", // Contoh logo Base
    "Avalanche": "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    "Tron": "https://cryptologos.cc/logos/tron-trx-logo.png",
    "Cosmos": "https://cryptologos.cc/logos/cosmos-atom-logo.png"
};


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
            <div className="bg-light-card dark:bg-dark-card rounded-xl w-full max-w-md p-6 space-y-4 text-light-text dark:text-dark-text" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-xl">Detail Transaksi #{tx.id}</h3>
                <div className="text-sm space-y-2">
                    <p><strong>User ID:</strong> <span className='font-mono text-xs'>{tx.user_id}</span></p>
                    <p><strong>Tipe:</strong> <span className={`font-bold ${isBuy ? 'text-green-500' : 'text-red-500'}`}>{tx.order_type.toUpperCase()}</span></p>
                    <p><strong>Aset:</strong> {tx.amount_crypto} {tx.token_symbol}</p>
                    <p><strong>Nominal:</strong> Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</p>
                    <p><strong>{isBuy ? 'Wallet User:' : 'Info Bayar User:'}</strong> <span className="font-mono text-xs break-all">{isBuy ? tx.user_wallet_address : tx.user_payment_info}</span></p>
                    <div><strong>Bukti User:</strong>
                        {isBuy ? (
                            imageUrl ? <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">Lihat Screenshot <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : "Memuat..."
                        ) : (
                            tx.proof_tx_hash ? <a href={`https://etherscan.io/tx/${tx.proof_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">{tx.proof_tx_hash.substring(0, 12)}... <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : "N/A"
                        )}
                    </div>
                </div>
                
                {tx.status === 'WAITING_CONFIRMATION' && !isBuy && (
                    <div className="pt-4 border-t border-light-border dark:border-dark-border">
                        <label className="text-sm font-bold mb-2 block">Unggah Bukti Transfer ke User</label>
                        <input type="file" accept="image/*" onChange={(e) => setAdminProofFile(e.target.files[0])} className="input-file w-full" />
                    </div>
                )}

                {tx.status === 'WAITING_CONFIRMATION' && (
                    <div className="flex gap-3 pt-4 border-t border-light-border dark:border-dark-border">
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
    // MODIFIKASI: Tambahkan network_icon ke state newCoin
    const [newCoin, setNewCoin] = useState({ token_symbol: '', token_name: '', network: COMMON_NETWORKS[0], network_icon: COMMON_NETWORK_ICONS[COMMON_NETWORKS[0]] || '', icon: '', admin_wallet: '', is_active: true, base_rate: '', spread_percent: '1', stock: '', stock_rupiah: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // MODIFIKASI: Jika jaringan berubah, update juga network_icon
        if (name === 'network') {
            setNewCoin(prev => ({ ...prev, [name]: value, network_icon: COMMON_NETWORK_ICONS[value] || '' }));
        } else {
            setNewCoin(prev => ({ ...prev, [name]: value }));
        }
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
                <h3 className="font-bold text-xl text-light-text dark:text-dark-text">Tambah Koin Baru</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <InputField label="Simbol" name="token_symbol" value={newCoin.token_symbol} onChange={handleInputChange} type="text" placeholder="USDT" />
                    <InputField label="Nama Koin" name="token_name" value={newCoin.token_name} onChange={handleInputChange} type="text" placeholder="Tether" />
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Jaringan</label>
                        <div className="relative">
                            <select 
                                name="network" 
                                value={newCoin.network} 
                                onChange={handleInputChange} 
                                className="mt-1 w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all appearance-none"
                            >
                                {COMMON_NETWORKS.map(network => (
                                    <option key={network} value={network}>{network}</option>
                                ))}
                            </select>
                            <FontAwesomeIcon icon={faAngleDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {/* MODIFIKASI: Tambahkan input untuk Network Icon URL */}
                    <InputField label="URL Ikon Jaringan" name="network_icon" value={newCoin.network_icon} onChange={handleInputChange} type="text" placeholder="https://logo-jaringan.png" />
                    {/* END MODIFIKASI */}
                    <InputField label="URL Ikon Koin" name="icon" value={newCoin.icon} onChange={handleInputChange} type="text" placeholder="https://logo-koin.png" />
                    <div className="col-span-2"><InputField label="Wallet Admin" name="admin_wallet" value={newCoin.admin_wallet} onChange={handleInputChange} type="text" placeholder="0x..." /></div>
                    <InputField label="Harga Dasar (IDR)" name="base_rate" value={newCoin.base_rate} onChange={handleInputChange} placeholder="16000" />
                    <InputField label="Spread (%)" name="spread_percent" value={newCoin.spread_percent} onChange={handleInputChange} placeholder="1" />
                    <InputField label="Stok Koin (Opsional)" name="stock" value={newCoin.stock} onChange={handleInputChange} step="any" placeholder="1000" />
                    <InputField label="Stok Rupiah (Opsional)" name="stock_rupiah" value={newCoin.stock_rupiah} onChange={handleInputChange} placeholder="10000000" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="btn-secondary px-4 py-2">Batal</button>
                    <button onClick={handleSaveClick} disabled={isSaving} className="btn-primary px-4 py-2">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin/> : 'Simpan Koin'}</button>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, name, value, onChange, type = "number", step = "0.01", placeholder="" }) => (
    <div>
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</label>
        <input 
            type={type} 
            name={name} 
            step={step} 
            value={value ?? ''} 
            onChange={onChange} 
            placeholder={placeholder} 
            className="mt-1 w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all"
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
        const { name, value } = e.target;
        // MODIFIKASI: Jika jaringan berubah, update juga network_icon
        if (name === 'network') {
            setRate(prev => ({ ...prev, [name]: value, network_icon: COMMON_NETWORK_ICONS[value] || '' }));
        } else {
            setRate(prev => ({ ...prev, [name]: value }));
        }
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

    const inputKalkulatorStyle = "w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text rounded-md px-3 py-1.5 text-sm transition-all focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/80";

    return (
        <div className={`p-4 bg-light-card dark:bg-dark-card/50 border rounded-lg space-y-4 ${error ? 'border-red-500/50' : 'border-light-border dark:border-dark-border'}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* MODIFIKASI: Tampilkan ikon jaringan jika ada, atau ikon koin jika tidak ada ikon jaringan */}
                    <img src={rate.network_icon || rate.icon || 'https://via.placeholder.com/32'} alt={rate.network} className="w-8 h-8 rounded-full bg-white"/>
                    <div>
                        <h3 className="font-bold text-lg text-light-text dark:text-dark-text">{rate.token_name} <span className="text-sm font-normal text-gray-400">({rate.token_symbol})</span></h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{rate.network}</p>
                    </div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-2">
                    {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />} {isSaving ? 'Menyimpan' : 'Simpan'}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2"><FontAwesomeIcon icon={faCalculator}/> Kalkulator Kurs</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 items-center">
                    <input type="number" placeholder="Jumlah Rupiah" value={calcInput.idr} onChange={e => setCalcInput({...calcInput, idr: e.target.value})} className={inputKalkulatorStyle} />
                    <input type="number" placeholder={`Jml ${rate.token_symbol}`} value={calcInput.crypto} onChange={e => setCalcInput({...calcInput, crypto: e.target.value})} className={inputKalkulatorStyle} />
                    <button onClick={applySimpleRate} className="btn-secondary text-xs py-2 px-3">Terapkan</button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <InputField label="Simbol Koin" name="token_symbol" value={rate.token_symbol} onChange={handleInputChange} type="text" placeholder="USDT" />
                <InputField label="Nama Koin" name="token_name" value={rate.token_name} onChange={handleInputChange} type="text" placeholder="Tether" />
                <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Jaringan</label>
                    <div className="relative">
                        <select 
                            name="network" 
                            value={rate.network} 
                            onChange={handleInputChange} 
                            className="mt-1 w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all appearance-none"
                        >
                            {COMMON_NETWORKS.map(network => (
                                <option key={network} value={network}>{network}</option>
                            ))}
                        </select>
                        <FontAwesomeIcon icon={faAngleDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                {/* MODIFIKASI: Tambahkan input untuk Network Icon URL */}
                <InputField label="URL Ikon Jaringan" name="network_icon" value={rate.network_icon} onChange={handleInputChange} type="text" placeholder="https://logo-jaringan.png" />
                {/* END MODIFIKASI */}
                <InputField label="URL Ikon Koin" name="icon" value={rate.icon} onChange={handleInputChange} type="text" placeholder="https://logo-koin.png" />
                
                <InputField label="Harga Jual (IDR)" name="rate_sell" value={rate.rate_sell} onChange={handleInputChange} />
                <InputField label="Harga Beli (IDR)" name="rate_buy" value={rate.rate_buy} onChange={handleInputChange} />
                <InputField label="Spread (%)" name="spread_percent" value={rate.spread_percent} onChange={handleInputChange} />
                <InputField label="Stok Koin" name="stock" value={rate.stock} onChange={handleInputChange} step="any" />

                <div className="col-span-2 md:col-span-4">
                    <InputField label="Wallet Admin" name="admin_wallet" value={rate.admin_wallet} onChange={handleInputChange} type="text" placeholder="Alamat wallet untuk koin ini"/>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA ADMIN ---
export default function PageAdminWarung({ onSwitchView }) {
    const [activeTab, setActiveTab] = useState('transactions');
    const [rates, setRates] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState('');
    const [showAddCoinModal, setShowAddCoinModal] = useState(false);
    const [activeTxTab, setActiveTxTab] = useState('WAITING_CONFIRMATION');
    const [selectedTx, setSelectedTx] = useState(null);
    
    const [editingMethod, setEditingMethod] = useState(null); 
    const [newMethod, setNewPaymentMethod] = useState({ method_name: '', full_name: '', method_type: 'E-Wallet', account_number: '', icon_url: '' });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // MODIFIKASI: Ambil juga network_icon
            const { data: ratesData, error: ratesError } = await supabase.from('crypto_rates').select('*, network_icon').eq('is_active', true);
            if (ratesError) throw ratesError;

            const { data: txData, error: txError } = await supabase.from('warung_transactions').select('*').order('created_at', { ascending: false }).limit(20);
            if (txError) throw txError;
            
            const { data: payData, error: payError } = await supabase.from('admin_payment_methods').select('*').order('method_name');
            if (payError) throw payError;

            setRates(ratesData || []);
            setTransactions(txData || []);
            setPaymentMethods(payData || []);
        } catch (error) {
            setNotification("Gagal mengambil data: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleActionComplete = (message) => {
        setNotification(message);
        fetchData();
        setTimeout(() => setNotification(''), 4000);
    };

    const handleTransactionAction = async (txId, newStatus, adminProofFile) => { /* ... (fungsi tidak berubah) ... */ };
    const handleAddNewCoin = async (newCoinData) => { 
        try {
            // Pastikan network_icon ada di newCoinData
            const { error: insertError } = await supabase.from('crypto_rates').insert([newCoinData]);
            if (insertError) throw insertError;
            handleActionComplete(`Koin ${newCoinData.token_symbol} (${newCoinData.network}) berhasil ditambahkan!`);
        } catch (error) {
            alert("Gagal menambah koin: " + error.message);
        }
    };

    const handleSavePaymentMethod = async () => {
        if (!newMethod.method_name || !newMethod.full_name || !newMethod.account_number) {
            alert("Semua kolom wajib diisi.");
            return;
        }
        
        const dataToSave = { ...newMethod };
        if (dataToSave.icon_url === '') dataToSave.icon_url = null;
        
        if (editingMethod) {
            delete dataToSave.id;
            const { error } = await supabase.from('admin_payment_methods').update(dataToSave).eq('id', editingMethod.id);
            if (error) { alert("Gagal mengupdate: " + error.message); }
            else { setNotification("Metode pembayaran diupdate!"); }
        } 
        else {
            const { error } = await supabase.from('admin_payment_methods').insert([dataToSave]);
            if (error) { alert("Gagal menambah: " + error.message); }
            else { setNotification("Metode pembayaran baru ditambahkan!"); }
        }
        
        setNewPaymentMethod({ method_name: '', full_name: '', method_type: 'E-Wallet', account_number: '', icon_url: '' });
        setEditingMethod(null);
        fetchData();
    };

    const handleDeletePaymentMethod = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus metode pembayaran ini?")) {
            const { error } = await supabase.from('admin_payment_methods').delete().eq('id', id);
            if (error) { alert("Gagal menghapus: " + error.message); }
            else { setNotification("Metode pembayaran dihapus!"); }
            fetchData();
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
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Panel Admin Warung Kripto</h1>
            
            {notification && <div className="bg-green-500/10 text-green-400 p-3 rounded-md text-sm">{notification}</div>}

            <div className="flex border-b border-light-border dark:border-dark-border">
                <button onClick={() => setActiveTab('transactions')} className={`pb-3 px-5 font-semibold ${activeTab === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Transaksi</button>
                <button onClick={() => setActiveTab('settings')} className={`pb-3 px-5 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Kurs & Stok</button>
                <button onClick={() => setActiveTab('payments')} className={`pb-3 px-5 font-semibold ${activeTab === 'payments' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Metode Bayar</button>
            </div>

            {isLoading ? <div className="text-center py-10 text-light-text dark:text-dark-text"><FontAwesomeIcon icon={faSpinner} spin size="2x"/></div> : (
                <>
                    {activeTab === 'transactions' && (
                        <div className="card-premium p-4 md:p-6 text-light-text dark:text-dark-text">
                            <div className="flex border-b border-black/10 dark:border-white/10 mb-2">
                                <button onClick={() => setActiveTxTab('WAITING_CONFIRMATION')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'WAITING_CONFIRMATION' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle dark:text-dark-subtle'}`}>Menunggu</button>
                                <button onClick={() => setActiveTxTab('COMPLETED')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'COMPLETED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle dark:text-dark-subtle'}`}>Selesai</button>
                                <button onClick={() => setActiveTxTab('REJECTED')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'REJECTED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle dark:text-dark-subtle'}`}>Ditolak</button>
                            </div>
                            <div className="space-y-1">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map(tx => (
                                        <button key={tx.id} onClick={() => setSelectedTx(tx)} className="w-full text-left grid grid-cols-4 gap-2 items-center p-3 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-dark/50 transition-colors rounded-md">
                                            <span className="font-semibold text-sm font-mono text-light-text dark:text-dark-text">{tx.user_id.substring(0,8)}...</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full text-center ${tx.order_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tx.order_type.toUpperCase()}</span>
                                            <span className="text-sm text-light-text dark:text-dark-text">Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</span>
                                            <span className="text-sm font-mono text-light-text dark:text-dark-text">{Number(tx.amount_crypto).toFixed(5)} {tx.token_symbol}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-sm text-gray-400 py-8">Tidak ada transaksi di tab ini.</p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'settings' && (
                        <div className="card-premium p-4 md:p-6 space-y-6 text-light-text dark:text-dark-text">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Atur Kurs & Stok</h2>
                                <button onClick={() => setShowAddCoinModal(true)} className="btn-success text-sm px-4 py-2 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faPlus} /> Tambah Koin
                                </button>
                            </div>
                            {rates.map(rate => (
                                <CoinSettingsEditor 
                                    key={rate.id} 
                                    initialRate={rate} 
                                    onActionComplete={handleActionComplete} 
                                />
                            ))}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="card-premium p-4 md:p-6 space-y-6">
                            <h2 className="text-xl font-bold text-light-text dark:text-dark-text">Kelola Metode Pembayaran Anda</h2>
                            <div className="space-y-2">
                                {paymentMethods.map(method => (
                                    <div key={method.id} className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <img src={method.icon_url || 'https://via.placeholder.com/32'} alt={method.method_name} className="w-8 h-8 rounded-full bg-white"/>
                                            <div>
                                                <p className="font-bold text-light-text dark:text-dark-text">{method.method_name} <span className="text-xs font-normal text-gray-400">({method.method_type})</span></p>
                                                <p className="text-sm text-light-subtle dark:text-dark-subtle">{method.account_number} (a/n {method.full_name})</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => { setEditingMethod(method); setNewPaymentMethod(method); }} className="text-yellow-400 hover:text-yellow-300"><FontAwesomeIcon icon={faPen}/></button>
                                            <button onClick={() => handleDeletePaymentMethod(method.id)} className="text-red-500 hover:text-red-400"><FontAwesomeIcon icon={faTrash}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-light-border dark:border-dark-border space-y-3">
                                <h3 className="font-bold text-light-text dark:text-dark-text">{editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Baru'}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InputField label="Nama Lengkap" name="full_name" value={newMethod.full_name} onChange={(e) => setNewPaymentMethod({...newMethod, full_name: e.target.value})} type="text"/>
                                    <div className="relative">
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Jenis</label>
                                        <select value={newMethod.method_type} onChange={(e) => setNewPaymentMethod({...newMethod, method_type: e.target.value})} className="mt-1 w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text dark:text-dark-text py-2.5 px-4 rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/80 transition-all appearance-none">
                                            <option>E-Wallet</option>
                                            <option>Bank</option>
                                        </select>
                                        <FontAwesomeIcon icon={faAngleDown} className="absolute right-4 bottom-3 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InputField label="Nama Metode" name="method_name" value={newMethod.method_name} onChange={(e) => setNewPaymentMethod({...newMethod, method_name: e.target.value})} type="text" placeholder="cth: DANA, BCA"/>
                                    <InputField label="Nomor Rekening/Telepon" name="account_number" value={newMethod.account_number} onChange={(e) => setNewPaymentMethod({...newMethod, account_number: e.target.value})} type="text" placeholder="cth: 0812..."/>
                                </div>
                                <InputField label="URL Ikon (Opsional)" name="icon_url" value={newMethod.icon_url} onChange={(e) => setNewPaymentMethod({...newMethod, icon_url: e.target.value})} type="text"/>
                                <div className="flex gap-3 justify-end">
                                    {editingMethod && <button onClick={() => { setEditingMethod(null); setNewPaymentMethod({ method_name: '', full_name: '', method_type: 'E-Wallet', account_number: '', icon_url: '' }); }} className="btn-secondary">Batal Edit</button>}
                                    <button onClick={handleSavePaymentMethod} className="btn-primary">{editingMethod ? 'Update Metode' : 'Tambah Metode'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
