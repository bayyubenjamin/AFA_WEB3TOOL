import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSave, faSpinner, faSync, faCogs, faArrowLeft, faLock, faLockOpen, faTrash, faPlus, 
    faCheck, faTimes, faPlusCircle, faCoins, faMoneyBillWave, faChevronDown, faChevronUp, faBook, 
    faWrench, faEdit, faTimesCircle, faUpload, faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { getUsdToIdrRate } from '../services/api';
import { Link } from 'react-router-dom';

// --- Data Margin Default ---
const DEFAULT_MARGIN_TIERS = [
    { up_to: 25000, profit: 1500 }, { up_to: 50000, profit: 2000 },
    { up_to: 75000, profit: 2500 }, { up_to: 100000, profit: 3000 },
    { up_to: 250000, profit: 5000 }, { up_to: 500000, profit: 8000 },
    { up_to: 750000, profit: 10000 }, { up_to: 1000000, profit: 25000 },
];

// --- Komponen-komponen Anak ---

const MarginTierEditor = ({ initialTiers = [], onTiersChange }) => {
    const [tiers, setTiers] = useState(Array.isArray(initialTiers) ? initialTiers : []);
    const handleTierChange = (index, field, value) => { const newTiers = [...tiers]; newTiers[index][field] = parseInt(value, 10) || 0; newTiers.sort((a, b) => a.up_to - b.up_to); setTiers(newTiers); onTiersChange(newTiers); };
    const addTier = () => { const newTier = { up_to: 0, profit: 0 }; const newTiers = [...tiers, newTier].sort((a, b) => a.up_to - b.up_to); setTiers(newTiers); onTiersChange(newTiers); };
    const removeTier = (index) => { const newTiers = tiers.filter((_, i) => i !== index); setTiers(newTiers); onTiersChange(newTiers); };
    const applyDefaultMargins = () => { const defaultTiersCopy = JSON.parse(JSON.stringify(DEFAULT_MARGIN_TIERS)); setTiers(defaultTiersCopy); onTiersChange(defaultTiersCopy); };
    return ( <div className="space-y-2 mt-4"> <div className="flex justify-between items-center mb-2"> <label className="text-sm font-semibold text-white">Pengaturan Margin</label> <button onClick={applyDefaultMargins} className="btn-secondary-outline text-xs py-1 px-2">Gunakan Default</button> </div> {tiers.map((tier, index) => ( <div key={index} className="flex items-center gap-2"> <span className="text-xs text-gray-400">Hingga Rp</span> <input type="number" value={tier.up_to} onChange={(e) => handleTierChange(index, 'up_to', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full" /> <span className="text-xs text-gray-400">Untung Rp</span> <input type="number" value={tier.profit} onChange={(e) => handleTierChange(index, 'profit', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full" /> <button onClick={() => removeTier(index)} className="btn-danger p-2 h-full"><FontAwesomeIcon icon={faTrash} /></button> </div> ))} <button onClick={addTier} className="btn-secondary text-xs w-full mt-2"><FontAwesomeIcon icon={faPlus} className="mr-2"/> Tambah Tingkatan</button> </div> );
};

const CoinSettingsEditor = ({ rate, onSave, onToggleBlock, onDelete, usdToIdrRate, onCancel }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [coinData, setCoinData] = useState({ coingecko_id: rate.coingecko_id || '', margin_tiers: rate.margin_tiers || [], stock: rate.stock || 0, stock_rupiah: rate.stock_rupiah || 0, icon: rate.icon || '', network: rate.network || '' });
    const handleChange = (field, value) => { setCoinData(prev => ({ ...prev, [field]: value })); };
    const handleSave = async () => { setIsSaving(true); await onSave(rate.id, coinData); setIsSaving(false); };
    const handleToggle = async () => { setIsToggling(true); await onToggleBlock(rate.id, !rate.is_trade_blocked); setIsToggling(false); };
    const handleDelete = async () => { if (window.confirm(`Yakin ingin menghapus koin ${rate.token_name} (${rate.token_symbol})?`)) { setIsDeleting(true); await onDelete(rate.id); setIsDeleting(false); } };
    const marketPriceIdr = rate.market_price_usd ? (rate.market_price_usd * usdToIdrRate).toLocaleString('id-ID') : 'N/A';
    return ( <div className="card bg-gray-800 p-4 space-y-4 rounded-lg shadow-lg border border-primary/50 relative"> <div className="flex justify-between items-start border-b border-gray-700 pb-2"> <div className="flex items-center gap-3"> <img src={coinData.icon || 'https://via.placeholder.com/32'} alt={rate.token_name} className="w-8 h-8 rounded-full bg-gray-700" /> <div> <h3 className="font-bold text-lg text-white">{rate.token_name} ({rate.token_symbol})</h3> <span className="text-xs font-mono text-gray-400">Harga: Rp {marketPriceIdr}</span></div></div> <button onClick={onCancel} className="text-gray-400 hover:text-white"><FontAwesomeIcon icon={faTimesCircle}/></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="text-xs font-semibold text-gray-400">URL Ikon</label><input type="text" value={coinData.icon} onChange={e => handleChange('icon', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full mt-1" /></div><div><label className="text-xs font-semibold text-gray-400">Jaringan</label><input type="text" value={coinData.network} onChange={e => handleChange('network', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full mt-1" /></div><div><label className="text-xs font-semibold text-gray-400">Stok Koin</label><input type="number" step="any" value={coinData.stock} onChange={e => handleChange('stock', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full mt-1" /></div><div><label className="text-xs font-semibold text-gray-400">Stok Rupiah</label><input type="number" value={coinData.stock_rupiah} onChange={e => handleChange('stock_rupiah', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full mt-1" /></div></div><div><label className="text-sm font-semibold text-white">CoinGecko API ID</label><input type="text" placeholder="cth: binancecoin" value={coinData.coingecko_id} onChange={e => handleChange('coingecko_id', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full mt-1" /></div><MarginTierEditor initialTiers={coinData.margin_tiers} onTiersChange={tiers => handleChange('margin_tiers', tiers)} /><div className="flex gap-2 pt-4"> <button onClick={handleSave} disabled={isSaving || isDeleting} className="btn-primary w-full text-sm flex-grow">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faSave} className="mr-2" /> Simpan</>}</button> <button onClick={handleToggle} disabled={isToggling || isDeleting} className={`${rate.is_trade_blocked ? 'btn-success' : 'btn-secondary'} w-full text-sm flex-grow`}>{isToggling ? <FontAwesomeIcon icon={faSpinner} spin /> : (rate.is_trade_blocked ? "Buka" : "Kunci")}</button> <button onClick={handleDelete} disabled={isDeleting || isSaving} className="btn-danger text-sm p-2">{isDeleting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}</button> </div></div> );
};

const AddNewCoinForm = ({ onSave, onCancel, defaultNetwork = '' }) => {
    const [newCoin, setNewCoin] = useState({ token_name: '', token_symbol: '', network: defaultNetwork, icon: '', is_active: true, rate_buy: 0, rate_sell: 0, stock: 0, stock_rupiah: 0, margin_tiers: [], coingecko_id: '' });
    const [isSaving, setIsSaving] = useState(false);
    const handleChange = (field, value) => setNewCoin(prev => ({...prev, [field]: value}));
    const handleSave = async () => { if (!newCoin.token_name || !newCoin.token_symbol || !newCoin.network) { alert('Nama, Simbol, dan Jaringan wajib diisi.'); return; } setIsSaving(true); await onSave(newCoin); setIsSaving(false); };
    return ( <div className="card bg-gray-900/50 p-6 rounded-lg my-4 border border-primary/50"> <h3 className="text-xl font-bold mb-4">{`Tambah Koin Baru ${defaultNetwork ? `ke Jaringan ${defaultNetwork}`: ''}`}</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <input type="text" placeholder="Nama Token (cth: Tether)" value={newCoin.token_name} onChange={e => handleChange('token_name', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700" /> <input type="text" placeholder="Simbol (cth: USDT)" value={newCoin.token_symbol} onChange={e => handleChange('token_symbol', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700" /> <input type="text" placeholder="Jaringan (cth: BSC)" value={newCoin.network} onChange={e => handleChange('network', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700" readOnly={!!defaultNetwork} /> <input type="text" placeholder="URL Ikon" value={newCoin.icon} onChange={e => handleChange('icon', e.target.value)} className="input-file dark:bg-slate-900 dark:border-slate-700" /> </div> <div className="flex items-center justify-between mt-4"> <label className="flex items-center gap-2 text-sm"> <input type="checkbox" checked={newCoin.is_active} onChange={e => handleChange('is_active', e.target.checked)} className="form-checkbox" /> Aktifkan Koin </label> <div className="flex gap-2"> <button onClick={onCancel} className="btn-secondary">Batal</button> <button onClick={handleSave} disabled={isSaving} className="btn-primary">{isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Simpan Koin'}</button> </div> </div> </div> );
};

const CoinRow = ({ rate, onEdit }) => ( <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"> <div className="flex items-center gap-3"> <img src={rate.icon || 'https://via.placeholder.com/32'} alt={rate.token_name} className="w-8 h-8 rounded-full bg-gray-700" /> <div> <span className="font-bold text-white">{rate.token_name} ({rate.token_symbol})</span> <div className={`text-xs ${rate.is_trade_blocked ? 'text-red-400' : 'text-green-400'}`}> {rate.is_trade_blocked ? 'Terkunci' : 'Aktif'} </div> </div> </div> <button onClick={() => onEdit(rate.id)} className="btn-secondary text-xs"> <FontAwesomeIcon icon={faEdit} className="mr-2"/> Edit </button> </div> );

const CoinSettingsPanel = ({ groupedRates, handleSaveSettings, handleToggleBlock, handleDeleteCoin, handleEditNetwork, usdToIdrRate, handleManualRefresh, isRefreshing, handleAddNewCoin, fetchData }) => {
    const [openNetworks, setOpenNetworks] = useState({});
    const [editingCoinId, setEditingCoinId] = useState(null);
    const [addingToNetwork, setAddingToNetwork] = useState(null);
    const [editingNetwork, setEditingNetwork] = useState(null);
    const toggleNetwork = (network) => { setOpenNetworks(prev => ({ ...prev, [network]: !prev[network] })); };
    const handleSaveAndClose = async (id, data) => { await handleSaveSettings(id, data); setEditingCoinId(null); };
    const handleAddAndClose = async (data) => { await handleAddNewCoin(data, fetchData); setAddingToNetwork(null); };
    const handleEditNetworkSubmit = (e) => { e.preventDefault(); const newName = e.target.elements.newName.value; const newIcon = e.target.elements.newIcon.value; if (newName && (newName !== editingNetwork.name || newIcon !== editingNetwork.icon)) { handleEditNetwork(editingNetwork.name, newName, newIcon); } setEditingNetwork(null); };
    return ( <div className="space-y-4"> <div className="flex justify-between items-center mb-3"> <h2 className="text-2xl font-bold flex items-center gap-3"><FontAwesomeIcon icon={faWrench} /> Pengaturan Jaringan & Koin</h2> <div className="flex gap-2"><button onClick={() => setAddingToNetwork('NEW')} className="btn-primary text-sm"><FontAwesomeIcon icon={faPlus} /> Tambah Jaringan</button><button onClick={handleManualRefresh} disabled={isRefreshing} className="btn-secondary text-sm"><FontAwesomeIcon icon={faSync} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? '...' : 'Refresh Harga'}</button> </div></div> {addingToNetwork === 'NEW' && <AddNewCoinForm onSave={handleAddAndClose} onCancel={() => setAddingToNetwork(null)} />} <div className="space-y-4"> {Object.keys(groupedRates).length > 0 ? Object.keys(groupedRates).map(network => ( <div key={network} className="bg-gray-800/50 border border-gray-700 rounded-lg"> <div className="flex justify-between items-center p-4"> <button onClick={() => toggleNetwork(network)} className="flex-grow flex items-center text-left gap-3"> <img src={groupedRates[network].network_icon || 'https://via.placeholder.com/24'} alt={network} className="w-6 h-6 rounded-full bg-gray-700" /> <h3 className="text-lg font-semibold text-primary">{network} <span className="text-xs text-gray-400 ml-2">({groupedRates[network].coins.length} koin)</span></h3> </button> <div className="flex items-center gap-2"><button onClick={() => setEditingNetwork({name: network, icon: groupedRates[network].network_icon})} className="text-gray-400 hover:text-white"><FontAwesomeIcon icon={faCogs}/></button><button onClick={() => toggleNetwork(network)} className="text-gray-400 hover:text-white"><FontAwesomeIcon icon={openNetworks[network] ? faChevronUp : faChevronDown} /></button></div></div> {editingNetwork?.name === network && (<form onSubmit={handleEditNetworkSubmit} className="p-4 border-t border-gray-700 space-y-2"><label className="text-xs font-semibold text-white">Ubah Nama Jaringan</label><input name="newName" defaultValue={network} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full"/><label className="text-xs font-semibold text-white">URL Ikon Jaringan</label><input name="newIcon" defaultValue={editingNetwork.icon || ''} className="input-file dark:bg-slate-900 dark:border-slate-700 w-full"/><div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => setEditingNetwork(null)} className="btn-secondary text-xs">Batal</button><button type="submit" className="btn-primary text-xs">Simpan</button></div></form>)} {openNetworks[network] && ( <div className="p-4 border-t border-gray-700 space-y-3"> {groupedRates[network].coins.map(rate => ( editingCoinId === rate.id ? ( <CoinSettingsEditor key={rate.id} rate={rate} onSave={handleSaveAndClose} onToggleBlock={handleToggleBlock} onDelete={handleDeleteCoin} usdToIdrRate={usdToIdrRate} onCancel={() => setEditingCoinId(null)} /> ) : ( <CoinRow key={rate.id} rate={rate} onEdit={setEditingCoinId} /> ) ))} <div className="pt-2"> {addingToNetwork === network ? ( <AddNewCoinForm onSave={handleAddAndClose} onCancel={() => setAddingToNetwork(null)} defaultNetwork={network} /> ) : ( <button onClick={() => { setAddingToNetwork(network); setEditingCoinId(null); }} className="btn-primary-outline text-xs w-full"> <FontAwesomeIcon icon={faPlusCircle} className="mr-2"/> Tambah Koin ke {network} </button> )} </div> </div> )} </div> )) : <p className="text-gray-400 text-center py-8">Tidak ada koin.</p>} </div> </div> );
};

const OrderBookPanel = ({ transactions, handleUpdateTransaction, handleUploadProof }) => {
    const [proofFile, setProofFile] = useState(null);
    const [uploadingTxId, setUploadingTxId] = useState(null);
    const onFileChange = (e, txId) => { if(e.target.files.length > 0) setProofFile({ file: e.target.files[0], txId }); };
    const onUpload = async (txId) => { if (proofFile && proofFile.txId === txId) { setUploadingTxId(txId); await handleUploadProof(txId, proofFile.file); setProofFile(null); setUploadingTxId(null); } };
    return ( <div className="space-y-4"> <h2 className="text-2xl font-bold mb-3"><FontAwesomeIcon icon={faBook} /> Buku Order</h2> <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-gray-700"> <table className="w-full text-sm text-left text-gray-400"> <thead className="text-xs text-gray-100 uppercase bg-gray-700/50"> <tr> <th className="px-6 py-3">Waktu</th><th className="px-6 py-3">Detail</th><th className="px-6 py-3">Bukti</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Aksi</th> </tr> </thead> <tbody> {transactions && transactions.length > 0 ? transactions.map(tx => ( <tr key={tx.id} className="bg-transparent border-b border-gray-700 hover:bg-white/5"> <td className="px-6 py-4 text-xs">{new Date(tx.created_at).toLocaleString('id-ID')}</td> <td className="px-6 py-4"><span className={`font-bold ${tx.type === 'beli' ? 'text-green-400' : 'text-red-400'}`}>{tx.type.toUpperCase()}</span><div>{tx.type === 'beli' ? `${Number(tx.amount_crypto).toFixed(6)} ${tx.token_symbol}` : `Rp ${Number(tx.amount_fiat).toLocaleString()}`}</div><div className="text-xs text-gray-500 font-mono" title={tx.user_id}>User: {tx.user_id ? tx.user_id.substring(0, 8) : 'N/A'}...</div></td> <td className="px-6 py-4 text-xs space-y-2"> <div className="flex gap-2"> {tx.proof_url && <a href={tx.proof_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">User <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a>} {tx.admin_proof_url && <a href={tx.admin_proof_url} target="_blank" rel="noopener noreferrer" className="btn-success text-xs">Admin <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a>} </div><div className="flex items-center gap-2"><input type="file" onChange={(e) => onFileChange(e, tx.id)} className="input-file dark:bg-slate-900 dark:border-slate-700 text-xs w-full"/><button onClick={() => onUpload(tx.id)} disabled={!proofFile || proofFile.txId !== tx.id || uploadingTxId === tx.id} className="btn-primary p-2">{uploadingTxId === tx.id ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload}/>}</button></div></td> <td className="px-6 py-4">{tx.status}</td> <td className="px-6 py-4 flex gap-2"><button onClick={() => handleUpdateTransaction(tx.id, 'completed')} className="btn-success p-2"><FontAwesomeIcon icon={faCheck} /></button><button onClick={() => handleUpdateTransaction(tx.id, 'rejected')} className="btn-danger p-2"><FontAwesomeIcon icon={faTimes} /></button></td> </tr> )) : ( <tr><td colSpan="5" className="text-center py-8 text-gray-500">Tidak ada transaksi.</td></tr> )} </tbody> </table> </div> </div> );
};

// --- Komponen Utama Halaman Admin ---
export default function PageAdminWarung({ currentUser }) {
    const [rates, setRates] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [usdToIdrRate, setUsdToIdrRate] = useState(16500);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [activeView, setActiveView] = useState('settings');
    const groupedRates = useMemo(() => { if (!rates) return {}; return rates.reduce((acc, rate) => { const network = rate.network || 'Lainnya'; if (!acc[network]) acc[network] = { coins: [], network_icon: rate.network_icon }; acc[network].coins.push(rate); return acc; }, {}); }, [rates]);
    const fetchData = useCallback(async () => { try { const ratesPromise = supabase.from('crypto_rates').select('*').order('network'); const transPromise = supabase.from('warung_transactions').select(`*`).order('created_at', { ascending: false }); const [ratesRes, transRes] = await Promise.all([ratesPromise, transPromise]); if (ratesRes.error) throw ratesRes.error; if (transRes.error) throw transRes.error; setRates(ratesRes.data || []); setTransactions(transRes.data || []); const rate = await getUsdToIdrRate(); setUsdToIdrRate(rate); } catch (err) { console.error("Gagal memuat data admin:", err); setError(err.message); } finally { setIsLoading(false); } }, []);
    useEffect(() => { setIsLoading(true); fetchData(); const channel = supabase.channel('realtime-admin-all').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe(); return () => supabase.removeChannel(channel); }, [fetchData]);
    const handleSaveSettings = async (id, dataToSave) => { const { error } = await supabase.from('crypto_rates').update(dataToSave).eq('id', id); if (error) alert('Gagal menyimpan: ' + error.message); else { alert('Pengaturan berhasil disimpan!'); fetchData(); } };
    const handleToggleBlock = async (id, blockStatus) => { const { error } = await supabase.from('crypto_rates').update({ is_trade_blocked: blockStatus }).eq('id', id); if (error) alert('Gagal mengubah status blokir: ' + error.message); else fetchData(); };
    const handleUpdateTransaction = async (id, status) => { const { error } = await supabase.from('warung_transactions').update({ status }).eq('id', id); if (error) alert('Gagal update transaksi: ' + error.message); else fetchData(); };
    const handleManualRefresh = async () => { setIsRefreshing(true); const { data, error } = await supabase.functions.invoke('get-market-data'); if (error) alert('Gagal menyegarkan harga: ' + error.message); else alert(data.message || 'Permintaan refresh berhasil dikirim!'); setIsRefreshing(false); };
    const handleAddNewCoin = async (newCoinData, callback) => { const { error } = await supabase.from('crypto_rates').insert([newCoinData]); if (error) { alert('Gagal menambah koin baru: ' + error.message); console.error(error); } else { alert('Koin baru berhasil ditambahkan!'); if(callback) callback(); } };
    const handleDeleteCoin = async (id) => { const { error } = await supabase.from('crypto_rates').delete().eq('id', id); if (error) { alert('Gagal menghapus koin: ' + error.message); } else { alert('Koin berhasil dihapus.'); fetchData(); } };
    const handleEditNetwork = async (oldName, newName, newIcon) => { const { error } = await supabase.from('crypto_rates').update({ network: newName, network_icon: newIcon }).eq('network', oldName); if (error) { alert(`Gagal mengubah jaringan: ${error.message}`); } else { alert(`Jaringan ${oldName} berhasil diubah.`); fetchData(); } };
    const handleUploadProof = async (txId, file) => { if (!file) return; const filePath = `admin_proofs/${txId}-${file.name}`; const { error: uploadError } = await supabase.storage.from('warung-files').upload(filePath, file, { upsert: true }); if (uploadError) { alert('Gagal upload: ' + uploadError.message); return; } const { data } = supabase.storage.from('warung-files').getPublicUrl(filePath); const { error: updateError } = await supabase.from('warung_transactions').update({ admin_proof_url: data.publicUrl }).eq('id', txId); if (updateError) { alert('Gagal update URL: ' + updateError.message); } else { alert('Bukti berhasil diunggah!'); fetchData(); } };
    const SidebarButton = ({ view, label, icon }) => ( <button onClick={() => setActiveView(view)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-colors ${activeView === view ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}><FontAwesomeIcon icon={icon} /><span>{label}</span></button> );
    return ( 
        <section className="page-content space-y-6 py-8"> 
            <div className="flex justify-between items-center"> 
                <h1 className="text-2xl font-bold">Admin Warung Kripto</h1> 
                <Link to="/warung-kripto" className="btn-secondary text-sm"> 
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Kembali ke Warung 
                </Link> 
            </div> 
            <div className="flex flex-col md:flex-row gap-6"> 
                <aside className="md:w-1/4 lg:w-1/5"> 
                    <div className="bg-gray-800/50 p-4 rounded-lg space-y-2 border border-gray-700 sticky top-24"> 
                        <SidebarButton view="settings" label="Pengaturan Jaringan" icon={faWrench} /> 
                        <SidebarButton view="orders" label="Buku Order" icon={faBook} /> 
                    </div> 
                </aside> 
                <main className="flex-grow"> 
                    {isLoading && <div className="text-center p-8"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Memuat data...</p></div>} 
                    {!isLoading && error && <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">Error: {error}</div>} 
                    {!isLoading && !error && ( 
                        <> 
                            {activeView === 'settings' && ( 
                                <CoinSettingsPanel 
                                    groupedRates={groupedRates} 
                                    handleSaveSettings={handleSaveSettings} 
                                    handleToggleBlock={handleToggleBlock} 
                                    handleDeleteCoin={handleDeleteCoin} 
                                    handleEditNetwork={handleEditNetwork} 
                                    usdToIdrRate={usdToIdrRate} 
                                    handleManualRefresh={handleManualRefresh} 
                                    isRefreshing={isRefreshing} 
                                    handleAddNewCoin={handleAddNewCoin} 
                                    fetchData={fetchData} 
                                /> 
                            )} 
                            {activeView === 'orders' && ( 
                                <OrderBookPanel 
                                    transactions={transactions} 
                                    handleUpdateTransaction={handleUpdateTransaction} 
                                    handleUploadProof={handleUploadProof}
                                /> 
                            )} 
                        </> 
                    )} 
                </main> 
            </div> 
        </section> 
    );
}

