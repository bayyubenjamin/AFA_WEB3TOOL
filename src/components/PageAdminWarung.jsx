import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faSave, faListAlt, faTimes, faCheck, faExternalLinkAlt, faSpinner, faArrowLeft, faCalculator, faPercentage, faPlus } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

// Komponen Modal Transaksi (Tidak ada perubahan)
const TransactionModal = ({ tx, onClose, onAction }) => {
    const [imageUrl, setImageUrl] = useState(null);
    useEffect(() => {
        if (tx && tx.proof_screenshot_url) {
            const getSignedUrl = async () => {
                const { data, error } = await supabase.storage.from('buktitransfer').createSignedUrl(tx.proof_screenshot_url, 300);
                if (error) console.error("Gagal membuat signed URL", error);
                else setImageUrl(data.signedUrl);
            };
            getSignedUrl();
        }
    }, [tx]);

    if (!tx) return null;
    const isBuy = tx.order_type === 'buy';

    return (
        <div className="fixed inset-0 bg-black/50 z-[99] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-xl">Detail Transaksi #{tx.id}</h3>
                <div className="text-sm space-y-2">
                    <p><strong>User ID:</strong> <span className='font-mono'>{tx.user_id}</span></p>
                    <p><strong>Tipe:</strong> {tx.order_type}</p>
                    <p><strong>Aset:</strong> {tx.amount_crypto} {tx.token_symbol}</p>
                    <p><strong>Nominal:</strong> Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</p>
                    <p><strong>{isBuy ? 'Wallet Tujuan User:' : 'Info Pembayaran User:'}</strong> <span className="font-mono">{isBuy ? tx.user_wallet_address : tx.user_payment_info}</span></p>
                    <div><strong>Bukti:</strong> 
                        {isBuy ? (
                            imageUrl ? <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">Lihat Screenshot <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : "Memuat gambar..."
                        ) : (
                            <a href={`https://etherscan.io/tx/${tx.proof_tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">{tx.proof_tx_hash?.substring(0, 10)}... <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a>
                        )}
                    </div>
                </div>
                {tx.status === 'WAITING_CONFIRMATION' && (
                    <div className="flex gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                        <button onClick={() => onAction(tx.id, 'COMPLETED')} className="btn-success w-full py-2"><FontAwesomeIcon icon={faCheck} className="mr-2"/> Setujui</button>
                        <button onClick={() => onAction(tx.id, 'REJECTED')} className="btn-danger w-full py-2"><FontAwesomeIcon icon={faTimes} className="mr-2"/> Tolak</button>
                    </div>
                )}
                <button onClick={onClose} className="btn-secondary w-full mt-2 py-2">Tutup</button>
            </div>
        </div>
    );
};

// Komponen Modal Tambah Koin (Tidak ada perubahan)
const AddCoinModal = ({ onClose, onSave }) => {
    const [newCoin, setNewCoin] = useState({
        token_symbol: '', token_name: '', network: '', icon: '', admin_wallet: '', is_active: true,
        base_rate: 0, spread_percent: 1, stock: 0, stock_rupiah: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        if (!newCoin.token_symbol || !newCoin.token_name || !newCoin.network) {
            alert('Simbol, Nama Koin, dan Jaringan harus diisi.');
            setIsSaving(false);
            return;
        }
        await onSave(newCoin);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-xl text-light-text dark:text-white">Tambah Koin Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <input value={newCoin.token_symbol} onChange={e => setNewCoin({...newCoin, token_symbol: e.target.value.toUpperCase()})} placeholder="Simbol (cth: BTC)" className="input-field"/>
                    <input value={newCoin.token_name} onChange={e => setNewCoin({...newCoin, token_name: e.target.value})} placeholder="Nama Koin (cth: Bitcoin)" className="input-field"/>
                    <input value={newCoin.network} onChange={e => setNewCoin({...newCoin, network: e.target.value})} placeholder="Jaringan (cth: Bitcoin)" className="input-field"/>
                    <input value={newCoin.icon} onChange={e => setNewCoin({...newCoin, icon: e.target.value})} placeholder="URL Ikon (opsional)" className="input-field"/>
                    <input value={newCoin.admin_wallet} onChange={e => setNewCoin({...newCoin, admin_wallet: e.target.value})} placeholder="Wallet Admin untuk Koin ini" className="input-field md:col-span-2"/>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="btn-secondary px-4 py-2">Batal</button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary px-4 py-2">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin/> : 'Simpan Koin'}</button>
                </div>
            </div>
        </div>
    );
};

// -- Komponen Utama Admin --
export default function PageAdminWarung({ onSwitchView }) {
    const [activeTab, setActiveTab] = useState('settings');
    const [rates, setRates] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTxTab, setActiveTxTab] = useState('WAITING_CONFIRMATION');
    const [selectedTx, setSelectedTx] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddCoinModal, setShowAddCoinModal] = useState(false);
    
    // State untuk kalkulator praktis
    const [simpleRateInputs, setSimpleRateInputs] = useState({});

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
            console.error("Gagal mengambil data admin:", error);
            alert("Gagal mengambil data: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRateUpdate = (id, field, value) => {
        setRates(prev => prev.map(r => {
            if (r.id === id) {
                const updatedRate = { ...r, [field]: value };
                if (field === 'base_rate' || field === 'spread_percent') {
                    const baseRate = parseFloat(updatedRate.base_rate) || 0;
                    const spread = parseFloat(updatedRate.spread_percent) || 0;
                    if (baseRate > 0 && spread >= 0) {
                        updatedRate.rate_sell = (baseRate * (1 + (spread / 100))).toFixed(2);
                        updatedRate.rate_buy = (baseRate * (1 - (spread / 100))).toFixed(2);
                    }
                }
                return updatedRate;
            }
            return r;
        }));
    };
    
    const handleSimpleRateChange = (id, field, value) => {
        setSimpleRateInputs(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const applySimpleRate = (id) => {
        const simpleRate = simpleRateInputs[id];
        const coin = rates.find(r => r.id === id);

        if (!simpleRate || !simpleRate.idr || !simpleRate.crypto || !coin) {
            alert("Harap isi kedua kolom (Rupiah dan Koin) untuk menerapkan kurs.");
            return;
        }

        const idrValue = parseFloat(simpleRate.idr);
        const cryptoValue = parseFloat(simpleRate.crypto);
        
        if (idrValue <= 0 || cryptoValue <= 0) {
            alert("Nilai harus lebih besar dari 0.");
            return;
        }
        
        const spread = parseFloat(coin.spread_percent) || 0;
        const calculatedSellRate = idrValue / cryptoValue;
        const calculatedBuyRate = calculatedSellRate * (1 - (spread / 100));

        setRates(prevRates => prevRates.map(r => 
            r.id === id ? { 
                ...r, 
                base_rate: calculatedSellRate.toFixed(2), // Kita set base_rate nya dari sini
                rate_sell: calculatedSellRate.toFixed(2), 
                rate_buy: calculatedBuyRate.toFixed(2) 
            } : r
        ));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const updates = rates.map(r => 
                supabase.from('crypto_rates').update({ 
                    rate_buy: r.rate_buy, 
                    rate_sell: r.rate_sell,
                    stock: r.stock,
                    stock_rupiah: r.stock_rupiah,
                    base_rate: r.base_rate,
                    spread_percent: r.spread_percent
                }).eq('id', r.id)
            );
            await Promise.all(updates);
            alert("Pengaturan berhasil disimpan!");
        } catch (error) {
            alert("Gagal menyimpan: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddNewCoin = async (newCoinData) => {
        const { error } = await supabase.from('crypto_rates').insert(newCoinData);
        if (error) {
            alert("Gagal menambahkan koin baru: " + error.message);
        } else {
            alert("Koin baru berhasil ditambahkan!");
            fetchData();
        }
    };

    const handleTransactionAction = async (txId, newStatus) => {
        const { error } = await supabase.from('warung_transactions').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', txId);
        if (error) {
            alert("Gagal mengupdate status transaksi.");
        } else {
            alert(`Transaksi berhasil diupdate ke status: ${newStatus}`);
            fetchData();
            setSelectedTx(null);
        }
    };
    
    const filteredTransactions = transactions.filter(tx => tx.status === activeTxTab);

    return (
        <section className="page-content space-y-6 max-w-6xl mx-auto py-8">
            {showAddCoinModal && <AddCoinModal onClose={() => setShowAddCoinModal(false)} onSave={handleAddNewCoin} />}
            <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} onAction={handleTransactionAction} />
            <button onClick={onSwitchView} className="text-sm text-primary hover:underline mb-4 inline-flex items-center">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Kembali ke Tampilan User
            </button>
            <h1 className="text-3xl font-bold text-light-text dark:text-white">Panel Admin Warung Kripto</h1>
            
            <div className="flex border-b border-black/10 dark:border-white/10">
                <button onClick={() => setActiveTab('transactions')} className={`pb-3 px-5 font-semibold ${activeTab === 'transactions' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Kelola Transaksi</button>
                <button onClick={() => setActiveTab('settings')} className={`pb-3 px-5 font-semibold ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-gray-400'}`}>Atur Kurs & Stok</button>
            </div>

            {isLoading ? <div className="text-center py-10"><FontAwesomeIcon icon={faSpinner} spin size="2x"/></div> : (
                <>
                    {activeTab === 'transactions' && (
                        <div className="card-premium p-6">
                           <div className="flex border-b border-black/10 dark:border-white/10 mb-2">
                               <button onClick={() => setActiveTxTab('WAITING_CONFIRMATION')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'WAITING_CONFIRMATION' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Menunggu Konfirmasi</button>
                               <button onClick={() => setActiveTxTab('COMPLETED')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'COMPLETED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Selesai</button>
                               <button onClick={() => setActiveTxTab('REJECTED')} className={`pb-3 px-4 text-sm font-semibold ${activeTxTab === 'REJECTED' ? 'border-b-2 border-primary text-primary' : 'text-light-subtle'}`}>Ditolak</button>
                           </div>
                           <div>
                               {filteredTransactions.length > 0 ? (
                                   filteredTransactions.map(tx => (
                                       <button key={tx.id} onClick={() => setSelectedTx(tx)} className="w-full text-left grid grid-cols-4 gap-2 items-center p-3 border-b border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-dark/50 transition-colors">
                                           <span className="font-semibold text-sm font-mono">{tx.user_id.substring(0,8)}...</span>
                                           <span className={`text-xs font-bold px-2 py-1 rounded-full text-center ${tx.order_type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{tx.order_type.toUpperCase()}</span>
                                           <span className="text-sm">Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</span>
                                           <span className="text-sm font-mono">{Number(tx.amount_crypto).toFixed(5)} {tx.token_symbol}</span>
                                       </button>
                                   ))
                               ) : (
                                   <p className="text-center text-sm text-gray-400 py-8">Tidak ada transaksi pada tab ini.</p>
                               )}
                           </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="card-premium p-6">
                            <h2 className="text-xl font-bold mb-4">Pengaturan Kurs & Stok</h2>
                            <div className="space-y-6">
                                {rates.map(coin => (
                                    <div key={coin.id} className="p-4 border border-black/5 dark:border-white/5 rounded-lg space-y-4">
                                        <h3 className="font-bold text-lg text-light-text dark:text-white">{coin.token_symbol}</h3>
                                        
                                        <div className="bg-black/5 dark:bg-dark p-3 rounded-lg">
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2"><FontAwesomeIcon icon={faCalculator}/> Kalkulator Praktis (Harga Jual)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 items-center">
                                                <div className="flex items-center gap-2">
                                                    <input type="number" placeholder="10000" onChange={e => handleSimpleRateChange(coin.id, 'idr', e.target.value)} className="w-full bg-light-card dark:bg-dark-card p-2 rounded-md text-sm" />
                                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">IDR</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" step="any" placeholder="0.0015" onChange={e => handleSimpleRateChange(coin.id, 'crypto', e.target.value)} className="w-full bg-light-card dark:bg-dark-card p-2 rounded-md text-sm" />
                                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{coin.token_symbol}</span>
                                                </div>
                                                <button onClick={() => applySimpleRate(coin.id)} className="btn-secondary text-xs py-2 px-3">Terapkan ke Bawah</button>
                                            </div>
                                        </div>

                                        <div className="bg-black/5 dark:bg-dark p-3 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Harga Dasar (dari Market)</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="Contoh: 50000000"
                                                    value={coin.base_rate || ''}
                                                    onChange={e => handleRateUpdate(coin.id, 'base_rate', e.target.value)} 
                                                    className="w-full bg-light-card dark:bg-dark-card p-2 rounded-md text-sm mt-1" 
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-grow">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Spread Profit (%)</label>
                                                    <input 
                                                        type="number" 
                                                        placeholder="2"
                                                        value={coin.spread_percent || ''}
                                                        onChange={e => handleRateUpdate(coin.id, 'spread_percent', e.target.value)} 
                                                        className="w-full bg-light-card dark:bg-dark-card p-2 rounded-md text-sm mt-1" 
                                                    />
                                                </div>
                                                <FontAwesomeIcon icon={faPercentage} className="text-gray-400 mb-2"/>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-gray-400">Harga Jual Admin (Otomatis)</label>
                                                <input type="number" value={coin.rate_sell || ''} onChange={e => handleRateUpdate(coin.id, 'rate_sell', e.target.value)} className="w-full bg-black/5 dark:bg-dark p-1.5 rounded-md text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Harga Beli Admin (Otomatis)</label>
                                                <input type="number" value={coin.rate_buy || ''} onChange={e => handleRateUpdate(coin.id, 'rate_buy', e.target.value)} className="w-full bg-black/5 dark:bg-dark p-1.5 rounded-md text-sm mt-1" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                                            <div>
                                                <label className="text-xs text-gray-400">Stok Koin</label>
                                                <input type="number" step="any" value={coin.stock || ''} onChange={e => handleRateUpdate(coin.id, 'stock', e.target.value)} className="w-full bg-black/5 dark:bg-dark p-1.5 rounded-md text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Stok Rupiah</label>
                                                <input type="number" value={coin.stock_rupiah || ''} onChange={e => handleRateUpdate(coin.id, 'stock_rupiah', e.target.value)} className="w-full bg-black/5 dark:bg-dark p-1.5 rounded-md text-sm mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 mt-6">
                                <button onClick={() => setShowAddCoinModal(true)} className="btn-secondary w-full md:w-auto py-3 flex-grow">
                                    <FontAwesomeIcon icon={faPlus} className="mr-2"/> Tambah Koin Baru
                                </button>
                                <button onClick={handleSaveAll} disabled={isSaving} className="btn-primary w-full md:w-auto py-3 flex-grow-[2]">
                                    {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faSave} className="mr-2"/> Simpan Semua Pengaturan</>}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
