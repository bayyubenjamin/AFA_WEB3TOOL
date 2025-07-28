import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faSync, faCogs, faArrowLeft, faLock, faLockOpen, faTrash, faPlus, faCheck, faTimes, faPlusCircle, faCoins, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { getUsdToIdrRate } from '../services/api';

// --- Komponen Editor Margin Bertingkat ---
const MarginTierEditor = ({ initialTiers = [], onTiersChange }) => {
    const [tiers, setTiers] = useState(Array.isArray(initialTiers) ? initialTiers : []);
    const handleTierChange = (index, field, value) => { const newTiers = [...tiers]; newTiers[index][field] = parseInt(value, 10) || 0; newTiers.sort((a, b) => a.up_to - b.up_to); setTiers(newTiers); onTiersChange(newTiers); };
    const addTier = () => { const newTier = { up_to: 0, profit: 0 }; const newTiers = [...tiers, newTier].sort((a, b) => a.up_to - b.up_to); setTiers(newTiers); onTiersChange(newTiers); };
    const removeTier = (index) => { const newTiers = tiers.filter((_, i) => i !== index); setTiers(newTiers); onTiersChange(newTiers); };
    return ( <div className="space-y-2 mt-4"> <label className="text-sm font-semibold text-white">Pengaturan Margin Bertingkat</label> {tiers.map((tier, index) => ( <div key={index} className="flex items-center gap-2"> <span className="text-xs text-gray-400">Hingga Rp</span> <input type="number" value={tier.up_to} onChange={(e) => handleTierChange(index, 'up_to', e.target.value)} className="input-file w-full" placeholder="Batas Atas" /> <span className="text-xs text-gray-400">Untung Rp</span> <input type="number" value={tier.profit} onChange={(e) => handleTierChange(index, 'profit', e.target.value)} className="input-file w-full" placeholder="Keuntungan" /> <button onClick={() => removeTier(index)} className="btn-danger p-2 h-full"><FontAwesomeIcon icon={faTrash} /></button> </div> ))} <button onClick={addTier} className="btn-secondary text-xs w-full mt-2"><FontAwesomeIcon icon={faPlus} className="mr-2"/> Tambah Tingkatan</button> </div> );
};

// --- Komponen Editor Pengaturan Koin (DI-UPGRADE) ---
const CoinSettingsEditor = ({ rate, onSave, onToggleBlock, usdToIdrRate }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [coinData, setCoinData] = useState({
        coingecko_id: rate.coingecko_id || '',
        margin_tiers: rate.margin_tiers || [],
        stock: rate.stock || 0,
        stock_rupiah: rate.stock_rupiah || 0,
        icon: rate.icon || '',
        network: rate.network || ''
    });

    const handleChange = (field, value) => {
        setCoinData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(rate.id, coinData);
        setIsSaving(false);
    };
    
    const handleToggle = async () => { setIsToggling(true); await onToggleBlock(rate.id, !rate.is_trade_blocked); setIsToggling(false); };
    const marketPriceIdr = rate.market_price_usd ? (rate.market_price_usd * usdToIdrRate).toLocaleString('id-ID') : 'N/A';

    return ( <div className="card bg-gray-800 p-4 space-y-4 rounded-lg shadow-lg"> <div className="flex justify-between items-center border-b border-gray-700 pb-2"> <div className="flex items-center gap-3"> <img src={coinData.icon || 'https://via.placeholder.com/32'} alt={rate.token_name} className="w-8 h-8 rounded-full bg-gray-700" /> <h3 className="font-bold text-lg text-white">{rate.token_name} ({rate.token_symbol})</h3> </div> <span className="text-xs font-mono text-gray-400">Harga Pasar: Rp {marketPriceIdr}</span> </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-400">URL Ikon</label><input type="text" value={coinData.icon} onChange={e => handleChange('icon', e.target.value)} className="input-file w-full mt-1" /></div>
            <div><label className="text-xs font-semibold text-gray-400">Jaringan</label><input type="text" value={coinData.network} onChange={e => handleChange('network', e.target.value)} className="input-file w-full mt-1" /></div>
            <div><label className="text-xs font-semibold text-gray-400">Stok Koin</label><input type="number" step="any" value={coinData.stock} onChange={e => handleChange('stock', e.target.value)} className="input-file w-full mt-1" /></div>
            <div><label className="text-xs font-semibold text-gray-400">Stok Rupiah</label><input type="number" value={coinData.stock_rupiah} onChange={e => handleChange('stock_rupiah', e.target.value)} className="input-file w-full mt-1" /></div>
        </div>
        <div><label className="text-sm font-semibold text-white">CoinGecko API ID</label><input type="text" placeholder="cth: binancecoin" value={coinData.coingecko_id} onChange={e => handleChange('coingecko_id', e.target.value)} className="input-file w-full mt-1" /></div>
        <MarginTierEditor initialTiers={coinData.margin_tiers} onTiersChange={tiers => handleChange('margin_tiers', tiers)} />
        <div className="flex gap-2 pt-4"> <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full text-sm flex-grow">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faSave} className="mr-2" /> Simpan</>}</button> <button onClick={handleToggle} disabled={isToggling} className={`${rate.is_trade_blocked ? 'btn-success' : 'btn-danger'} w-full text-sm flex-grow`}>{isToggling ? <FontAwesomeIcon icon={faSpinner} spin /> : (rate.is_trade_blocked ? "Buka" : "Kunci")}</button> </div>
    </div> );
};

// --- Komponen Form Tambah Koin ---
const AddNewCoinForm = ({ onSave, onCancel }) => {
    const [newCoin, setNewCoin] = useState({ token_name: '', token_symbol: '', network: '', icon: '', is_active: true });
    const [isSaving, setIsSaving] = useState(false);
    const handleChange = (field, value) => setNewCoin(prev => ({...prev, [field]: value}));
    const handleSave = async () => {
        if (!newCoin.token_name || !newCoin.token_symbol || !newCoin.network) { alert('Nama, Simbol, dan Jaringan wajib diisi.'); return; }
        setIsSaving(true);
        await onSave(newCoin);
        setIsSaving(false);
    };
    return ( <div className="card bg-gray-800 p-6 rounded-lg mb-8 border border-primary/50"> <h3 className="text-xl font-bold mb-4">Tambah Koin Baru</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <input type="text" placeholder="Nama Token (cth: Tether)" value={newCoin.token_name} onChange={e => handleChange('token_name', e.target.value)} className="input-file" /> <input type="text" placeholder="Simbol (cth: USDT)" value={newCoin.token_symbol} onChange={e => handleChange('token_symbol', e.target.value)} className="input-file" /> <input type="text" placeholder="Jaringan (cth: BSC)" value={newCoin.network} onChange={e => handleChange('network', e.target.value)} className="input-file" /> <input type="text" placeholder="URL Ikon" value={newCoin.icon} onChange={e => handleChange('icon', e.target.value)} className="input-file" /> </div> <div className="flex items-center justify-between mt-4"> <label className="flex items-center gap-2 text-sm"> <input type="checkbox" checked={newCoin.is_active} onChange={e => handleChange('is_active', e.target.checked)} className="form-checkbox" /> Aktifkan Koin </label> <div className="flex gap-2"> <button onClick={onCancel} className="btn-secondary">Batal</button> <button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Simpan Koin Baru'}</button> </div> </div> </div> );
};

// --- KOMPONEN UTAMA HALAMAN ADMIN ---
export default function PageAdminWarung({ onSwitchView }) {
    const [rates, setRates] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usdToIdrRate, setUsdToIdrRate] = useState(16500);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [showAddCoinForm, setShowAddCoinForm] = useState(false);

    const groupedRates = useMemo(() => {
        if (!rates) return {};
        return rates.reduce((acc, rate) => {
            const network = rate.network || 'Lainnya';
            if (!acc[network]) acc[network] = [];
            acc[network].push(rate);
            return acc;
        }, {});
    }, [rates]);

    const fetchData = useCallback(async () => {
        try {
            const ratesPromise = supabase.from('crypto_rates').select('*').order('network');
            const transPromise = supabase.from('transactions').select(`*`).order('created_at', { ascending: false });
            const [ratesRes, transRes] = await Promise.all([ratesPromise, transPromise]);
            if (ratesRes.error) throw ratesRes.error;
            if (transRes.error) throw transRes.error;
            setRates(ratesRes.data || []);
            setTransactions(transRes.data || []);
        } catch (err) {
            console.error("Gagal memuat data admin:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
        const channel = supabase.channel('realtime-admin-all').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const handleSaveSettings = async (id, dataToSave) => {
        const { error } = await supabase.from('crypto_rates').update(dataToSave).eq('id', id);
        if (error) alert('Gagal menyimpan: ' + error.message); else alert('Pengaturan berhasil disimpan!');
    };
    const handleToggleBlock = async (id, blockStatus) => {
        const { error } = await supabase.from('crypto_rates').update({ is_trade_blocked: blockStatus }).eq('id', id);
        if (error) alert('Gagal mengubah status blokir: ' + error.message);
    };
    const handleUpdateTransaction = async (id, status) => {
        const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
        if (error) alert('Gagal update transaksi: ' + error.message);
    };
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        const { data, error } = await supabase.functions.invoke('get-market-data');
        if (error) alert('Gagal menyegarkan harga: ' + error.message); else alert(data.message || 'Permintaan refresh berhasil dikirim!');
        setIsRefreshing(false);
    };
    const handleAddNewCoin = async (newCoinData) => {
        const { error } = await supabase.from('crypto_rates').insert([newCoinData]);
        if (error) alert('Gagal menambah koin baru: ' + error.message); else {
            alert('Koin baru berhasil ditambahkan!');
            setShowAddCoinForm(false);
            fetchData();
        }
    };

    return (
        <section className="page-content space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Panel Admin Warung Kripto</h1>
                <button onClick={onSwitchView} className="btn-secondary text-sm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Kembali</button>
            </div>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-2xl font-bold flex items-center gap-3"><FontAwesomeIcon icon={faCogs} /> Pengaturan Koin & Margin</h2>
                    <div className="flex gap-2">
                        <button onClick={handleManualRefresh} disabled={isRefreshing} className="btn-secondary text-sm"><FontAwesomeIcon icon={faSync} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? '...' : 'Segarkan Harga'}</button>
                        <button onClick={() => setShowAddCoinForm(!showAddCoinForm)} className="btn-primary text-sm"><FontAwesomeIcon icon={faPlusCircle} /> {showAddCoinForm ? 'Tutup Form' : 'Tambah Koin'}</button>
                    </div>
                </div>

                {showAddCoinForm && <AddNewCoinForm onSave={handleAddNewCoin} onCancel={() => setShowAddCoinForm(false)} />}

                {isLoading && <div className="text-center p-8"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Memuat pengaturan...</p></div>}
                {!isLoading && error && <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">Error: {error}</div>}
                
                {!isLoading && !error && (
                    <div className="space-y-8">
                        {Object.keys(groupedRates).length > 0 ? Object.keys(groupedRates).map(network => (
                            <div key={network}>
                                <h3 className="text-xl font-semibold mb-4 text-primary border-b-2 border-primary/30 pb-2">Jaringan: {network}</h3>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {groupedRates[network].map(rate => (
                                        <CoinSettingsEditor key={rate.id} rate={rate} onSave={handleSaveSettings} onToggleBlock={handleToggleBlock} usdToIdrRate={usdToIdrRate} />
                                    ))}
                                </div>
                            </div>
                        )) : !showAddCoinForm && <p className="text-gray-400 text-center">Tidak ada koin ditemukan. Klik "Tambah Koin" untuk memulai.</p>}
                    </div>
                )}
            </div>
            
            <div className="space-y-4 pt-8">
                <h2 className="text-2xl font-bold mb-3">Daftar Transaksi Masuk</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-100 uppercase bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">User ID</th>
                                <th className="px-6 py-3">Jenis</th>
                                <th className="px-6 py-3">Jumlah</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Bukti</th>
                                <th className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions && transactions.map(tx => (
                                <tr key={tx.id} className="bg-gray-800 border-b border-gray-700">
                                    <td className="px-6 py-4 text-xs font-mono" title={tx.user_id}>{tx.user_id ? tx.user_id.substring(0, 8) : 'N/A'}...</td>
                                    <td className="px-6 py-4">{tx.type}</td>
                                    <td className="px-6 py-4">{tx.type === 'beli' ? `${Number(tx.amount_crypto).toFixed(6)} ${tx.token_symbol}` : `Rp ${Number(tx.amount_fiat).toLocaleString()}`}</td>
                                    <td className="px-6 py-4">{tx.status}</td>
                                    <td className="px-6 py-4"><a href={tx.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lihat Bukti</a></td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button onClick={() => handleUpdateTransaction(tx.id, 'completed')} className="btn-success"><FontAwesomeIcon icon={faCheck} /></button>
                                        <button onClick={() => handleUpdateTransaction(tx.id, 'rejected')} className="btn-danger"><FontAwesomeIcon icon={faTimes} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
