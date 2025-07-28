// src/components/PageAdminOrderBook.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faArrowLeft, faSpinner, faCheck, faTimes, faUpload, 
    faExternalLinkAlt, faBook 
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const OrderBookPanel = ({ transactions, handleUpdateTransaction, handleUploadProof }) => {
    const [proofFile, setProofFile] = useState(null);
    const [uploadingTxId, setUploadingTxId] = useState(null);

    const onFileChange = (e, txId) => {
        if (e.target.files.length > 0) {
            setProofFile({ file: e.target.files[0], txId });
        }
    };

    const onUpload = async (txId) => {
        if (proofFile && proofFile.txId === txId) {
            setUploadingTxId(txId);
            await handleUploadProof(txId, proofFile.file);
            setProofFile(null);
            setUploadingTxId(null);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <FontAwesomeIcon icon={faBook} /> Buku Order
            </h2>
            <div className="overflow-x-auto bg-gray-800/50 rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-100 uppercase bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3">Waktu</th>
                            <th className="px-6 py-3">Detail</th>
                            <th className="px-6 py-3">Bukti</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions && transactions.length > 0 ? transactions.map(tx => (
                            <tr key={tx.id} className="bg-transparent border-b border-gray-700 hover:bg-white/5">
                                <td className="px-6 py-4 text-xs">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${tx.type === 'beli' ? 'text-green-400' : 'text-red-400'}`}>{tx.type.toUpperCase()}</span>
                                    <div>{tx.type === 'beli' ? `${Number(tx.amount_crypto).toFixed(6)} ${tx.token_symbol}` : `Rp ${Number(tx.amount_fiat).toLocaleString()}`}</div>
                                    <div className="text-xs text-gray-500 font-mono" title={tx.user_id}>User: {tx.user_id ? tx.user_id.substring(0, 8) : 'N/A'}...</div>
                                </td>
                                <td className="px-6 py-4 text-xs space-y-2">
                                    <div className="flex gap-2">
                                        {tx.proof_url && <a href={tx.proof_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">User <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a>}
                                        {tx.admin_proof_url && <a href={tx.admin_proof_url} target="_blank" rel="noopener noreferrer" className="btn-success text-xs">Admin <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="file" onChange={(e) => onFileChange(e, tx.id)} className="input-file dark:bg-slate-900 dark:border-slate-700 text-xs w-full"/>
                                        <button onClick={() => onUpload(tx.id)} disabled={!proofFile || proofFile.txId !== tx.id || uploadingTxId === tx.id} className="btn-primary p-2">
                                            {uploadingTxId === tx.id ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload}/>}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{tx.status}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => handleUpdateTransaction(tx.id, 'completed')} className="btn-success p-2"><FontAwesomeIcon icon={faCheck} /></button>
                                    <button onClick={() => handleUpdateTransaction(tx.id, 'rejected')} className="btn-danger p-2"><FontAwesomeIcon icon={faTimes} /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">Tidak ada transaksi.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function PageAdminOrderBook({ currentUser }) {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('warung_transactions').select(`*`).order('created_at', { ascending: false });
            if (error) throw error;
            setTransactions(data || []);
        } catch (err) {
            console.error("Gagal memuat data transaksi:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('realtime-admin-transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'warung_transactions' }, () => fetchData()).subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchData]);

    const handleUpdateTransaction = async (id, status) => {
        const { error } = await supabase.from('warung_transactions').update({ status }).eq('id', id);
        if (error) alert('Gagal update transaksi: ' + error.message);
        else fetchData();
    };

    const handleUploadProof = async (txId, file) => {
        if (!file) return;
        const filePath = `admin_proofs/${txId}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('warung-files').upload(filePath, file, { upsert: true });
        if (uploadError) {
            alert('Gagal upload: ' + uploadError.message);
            return;
        }
        const { data } = supabase.storage.from('warung-files').getPublicUrl(filePath);
        const { error: updateError } = await supabase.from('warung_transactions').update({ admin_proof_url: data.publicUrl }).eq('id', txId);
        if (updateError) {
            alert('Gagal update URL: ' + updateError.message);
        } else {
            alert('Bukti berhasil diunggah!');
            fetchData();
        }
    };

    return (
        <section className="page-content space-y-6 py-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Admin Buku Order</h1>
                <Link to="/warung-kripto" className="btn-secondary text-sm">
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Kembali ke Warung
                </Link>
            </div>
            <main>
                {isLoading && <div className="text-center p-8"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Memuat data...</p></div>}
                {!isLoading && error && <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">Error: {error}</div>}
                {!isLoading && !error && (
                    <OrderBookPanel
                        transactions={transactions}
                        handleUpdateTransaction={handleUpdateTransaction}
                        handleUploadProof={handleUploadProof}
                    />
                )}
            </main>
        </section>
    );
}
