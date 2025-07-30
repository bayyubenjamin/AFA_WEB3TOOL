// src/components/PageAdminOrderBook.jsx
// PERBAIKAN FINAL: Membaca `user_payment_info` sebagai String JSON.

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faSpinner, faCheck, faTimes, faUpload,
    faExternalLinkAlt, faBook, faComments, faInfoCircle, faPlayCircle,
    faWallet, faLandmark
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import TransactionChat from './TransactionChat';

const OrderListTable = ({ transactions, onSelectTransaction, selectedTxId }) => (
    <div className="overflow-x-auto bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg">
        <table className="w-full text-sm text-left text-light-text-secondary dark:text-dark-text-secondary">
            <thead className="text-xs text-light-text dark:text-dark-text uppercase bg-light-bg dark:bg-dark-bg">
                <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Detail Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody>
                {transactions.map(tx => (
                    <tr key={tx.id} onClick={() => onSelectTransaction(tx)} className={`border-b border-light-border dark:border-dark-border hover:bg-light-hover dark:hover:bg-dark-hover cursor-pointer ${selectedTxId === tx.id ? 'bg-primary/10' : ''}`}>
                        <td className="px-4 py-3 text-xs">{new Date(tx.created_at).toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3">
                            <span className={`font-bold ${tx.order_type === 'beli' ? 'text-green-500' : 'text-red-500'}`}>{tx.order_type?.toUpperCase()} {tx.token_symbol}</span>
                            <div>Rp {Number(tx.amount_idr).toLocaleString('id-ID')}</div>
                            <div className="text-xs text-gray-500 font-mono" title={tx.user_id}>User: {tx.user_id?.substring(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-3">{tx.status}</td>
                        <td className="px-4 py-3 text-right"><button className="btn-secondary-outline text-xs">Detail</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const OrderDetailPanel = ({ transaction, onUpdateStatus, onUploadProof, currentUser, onClose }) => {
    const [proofFile, setProofFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!transaction) {
        return <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg h-full flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary"><p><FontAwesomeIcon icon={faInfoCircle} className="mr-2"/> Pilih pesanan untuk melihat detail.</p></div>;
    }

    const handleFileChange = (e) => { if (e.target.files && e.target.files.length > 0) setProofFile(e.target.files[0]); };
    const handleUpload = async () => { if (!proofFile) return; setIsUploading(true); await onUploadProof(transaction.id, proofFile); setProofFile(null); setIsUploading(false); };
    const handleCompleteClick = () => { if (transaction.order_type === 'beli' && !transaction.admin_proof_url) { alert('Harap unggah bukti transfer koin sebelum menyelesaikan pesanan ini.'); return; } onUpdateStatus(transaction.id, 'completed'); };

    const canBeProcessed = transaction.status === 'awaiting_confirmation';
    const canBeFinalized = ['awaiting_confirmation', 'processing'].includes(transaction.status);

    // --- LOGIKA PEMBACAAN DATA YANG BENAR ---
    const renderPaymentDetails = () => {
        // Tampilkan hanya untuk order 'jual' dan jika ada info pembayaran
        if (transaction.order_type === 'jual' && transaction.user_payment_info) {
            try {
                // 1. Ubah string JSON menjadi objek JavaScript yang bisa digunakan
                const paymentInfo = JSON.parse(transaction.user_payment_info);

                // 2. Ambil data dari objek yang sudah di-parse
                const fullName = paymentInfo.fullName || '(nama tidak ada)';
                const details = paymentInfo.details || '';

                // 3. Pisahkan Metode (BANK/E-WALLET) dari nomornya
                const detailParts = details.split(':');
                const paymentMethod = detailParts[0]?.trim() || '(metode tidak ada)';
                const accountNumber = detailParts.slice(1).join(':').trim() || '(nomor tidak ada)';

                return (
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm flex items-center gap-2"><FontAwesomeIcon icon={faLandmark} /> Informasi Pencairan Dana User</h4>
                        <div className="text-xs p-3 bg-light-bg dark:bg-dark-bg rounded-lg space-y-1">
                            <p><strong>Nama Penerima:</strong> {fullName}</p>
                            <p><strong>Metode/Bank:</strong> {paymentMethod}</p>
                            <p><strong>No. Rekening/Wallet:</strong> {accountNumber}</p>
                            <hr className="border-light-border dark:border-dark-border my-1"/>
                            <p><strong>Jumlah Transfer:</strong> <span className="font-bold text-primary">Rp {Number(transaction.amount_idr).toLocaleString('id-ID')}</span></p>
                        </div>
                    </div>
                );
            } catch (error) {
                // Jika parsing gagal (untuk data yang mungkin formatnya salah total)
                console.error("Gagal mem-parsing user_payment_info:", error);
                return (
                    <div className="text-xs text-red-400">Gagal membaca detail pembayaran user. Data mungkin rusak.</div>
                );
            }
        }
        return null;
    };
    // --- AKHIR LOGIKA PEMBACAAN DATA ---

    return (
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                <h3 className="text-lg font-bold">Detail Pesanan #{transaction.id.substring(0, 8)}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {renderPaymentDetails()}

                {transaction.order_type === 'beli' && (
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm flex items-center gap-2"><FontAwesomeIcon icon={faWallet} /> Alamat Wallet User</h4>
                        <div className="text-xs p-3 bg-light-bg dark:bg-dark-bg rounded-lg break-all font-mono">
                            {transaction.wallet_address}
                        </div>
                    </div>
                )}

                <hr className="border-light-border dark:border-dark-border"/>

                <div className="text-sm space-y-2">
                    <p><strong>User ID:</strong> <span className="font-mono text-xs">{transaction.user_id}</span></p>
                    <div className="flex justify-between"><span>Bukti User:</span> {transaction.proof_url ? <a href={transaction.proof_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">Lihat <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : <span>Belum ada</span>}</div>
                    <div className="flex justify-between"><span>Bukti Admin:</span> {transaction.admin_proof_url ? <a href={transaction.admin_proof_url} target="_blank" rel="noopener noreferrer" className="btn-success text-xs">Lihat <FontAwesomeIcon icon={faExternalLinkAlt} size="xs"/></a> : <span>Belum ada</span>}</div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <input type="file" onChange={handleFileChange} className="input-file text-xs w-full"/>
                    <button onClick={handleUpload} disabled={!proofFile || isUploading} className="btn-primary p-2">{isUploading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload}/>}</button>
                </div>
                <div className="flex flex-col gap-2 pt-4">
                    {canBeProcessed && <button onClick={() => onUpdateStatus(transaction.id, 'processing')} className="btn-primary w-full text-sm"><FontAwesomeIcon icon={faPlayCircle} className="mr-2"/> Proses Pesanan</button>}
                    {canBeFinalized && (<div className="flex gap-2"><button onClick={handleCompleteClick} className="btn-success w-full text-sm"><FontAwesomeIcon icon={faCheck} className="mr-2"/> Selesaikan</button><button onClick={() => onUpdateStatus(transaction.id, 'rejected')} className="btn-danger w-full text-sm"><FontAwesomeIcon icon={faTimes} className="mr-2"/> Tolak</button></div>)}
                </div>
                <div className="pt-4">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faComments}/> Obrolan</h4>
                    <TransactionChat transactionId={transaction.id} currentUser={currentUser} />
                </div>
            </div>
        </div>
    );
};

export default function PageAdminOrderBook({ currentUser }) {
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('warung_transactions').select(`*`).order('created_at', { ascending: false });
            if (error) throw error;
            setTransactions(data || []);
        } catch (err) { console.error("Gagal memuat data transaksi:", err); setError(err.message); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('realtime-admin-transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'warung_transactions' }, (payload) => {
            if (selectedTx && payload.new.id === selectedTx.id) {
                setSelectedTx(payload.new);
            }
            fetchData();
        }).subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchData, selectedTx]);

    const handleUpdateStatus = async (id, status) => {
        const originalTransactions = [...transactions];
        const updatedTransactions = transactions.map(tx => tx.id === id ? { ...tx, status: status } : tx);
        setTransactions(updatedTransactions);
        if (selectedTx?.id === id) setSelectedTx(prev => ({...prev, status: status}));
        const { error } = await supabase.from('warung_transactions').update({ status }).eq('id', id);
        if (error) {
            alert('Gagal update transaksi: ' + error.message);
            setTransactions(originalTransactions);
            if (selectedTx?.id === id) setSelectedTx(originalTransactions.find(tx => tx.id === id));
        }
    };

    const handleUploadProof = async (txId, file) => {
        if (!file) return;
        const filePath = `admin_proofs/${txId}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('buktitransfer').upload(filePath, file, { upsert: true });
        if (uploadError) { alert('Gagal upload: ' + uploadError.message); return; }
        const { data: urlData } = supabase.storage.from('buktitransfer').getPublicUrl(filePath);
        const { data: updatedTx, error: updateError } = await supabase.from('warung_transactions').update({ admin_proof_url: urlData.publicUrl }).eq('id', txId).select().single();
        if (updateError) { alert('Gagal update URL bukti: ' + updateError.message); } 
        else {
            alert('Bukti berhasil diunggah!');
            setTransactions(prev => prev.map(tx => tx.id === txId ? updatedTx : tx));
            if (selectedTx?.id === txId) setSelectedTx(updatedTx);
        }
    };
    
    return (
        <section className="page-content space-y-6 py-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3"><FontAwesomeIcon icon={faBook}/> Buku Order Admin</h1>
                <Link to="/admin" className="btn-secondary text-sm"><FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Kembali ke Dashboard</Link>
            </div>
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                {isLoading ? (<div className="lg:col-span-2 text-center p-8"><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Memuat data...</p></div>) 
                : error ? (<div className="lg:col-span-2 bg-red-500/10 text-red-400 p-4 rounded-lg">Error: {error}</div>) 
                : (<><OrderListTable transactions={transactions} onSelectTransaction={setSelectedTx} selectedTxId={selectedTx?.id} /><OrderDetailPanel transaction={selectedTx} onUpdateStatus={handleUpdateStatus} onUploadProof={handleUploadProof} currentUser={currentUser} onClose={() => setSelectedTx(null)} /></>)}
            </main>
        </section>
    );
}
