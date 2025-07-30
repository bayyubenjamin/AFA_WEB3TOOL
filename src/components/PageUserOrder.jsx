// src/components/PageUserOrder.jsx
// PENYESUAIAN: Menambahkan notifikasi status yang lebih detail untuk 'processing' dan 'completed'.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import TransactionChat from './TransactionChat';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner, faArrowLeft, faUpload, faCheckCircle, faTimesCircle,
    faCopy, faInfoCircle, faPaperPlane, faWallet, faFileCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import { getUsdToIdrRate } from '../services/api'; // Asumsi path ini benar

export default function PageUserOrder({ currentUser }) {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [proofFile, setProofFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adminPaymentMethods, setAdminPaymentMethods] = useState([]);
    const [adminWallet, setAdminWallet] = useState(null); 
    const [isInfoLoading, setIsInfoLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState(null); // State untuk rincian biaya

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Teks berhasil disalin!');
        }, (err) => {
            alert('Gagal menyalin: ', err);
        });
    };
    
    const fetchOrderAndMethods = useCallback(async () => {
        if (!currentUser?.id || !orderId) return;

        setLoading(true);
        const { data: orderData, error: orderError } = await supabase
            .from('warung_transactions')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (orderData) {
            setOrder(orderData);
            setIsInfoLoading(true);

            // Fetch data untuk rincian biaya
            try {
                const usdRate = await getUsdToIdrRate();
                const { data: coinRateData } = await supabase
                    .from('crypto_rates')
                    .select('market_price_usd')
                    .eq('token_symbol', orderData.token_symbol)
                    .eq('network', orderData.network)
                    .single();

                if (coinRateData && usdRate) {
                    const marketPriceUsd = coinRateData.market_price_usd;
                    const currentMarketValue = orderData.amount_crypto * marketPriceUsd * usdRate;
                    const serviceFee = Math.abs(orderData.amount_idr - currentMarketValue);
                    setOrderDetails({
                        marketValue: currentMarketValue,
                        serviceFee: serviceFee,
                        total: orderData.amount_idr
                    });
                }
            } catch (e) {
                console.error("Gagal menghitung rincian biaya:", e);
            }

            if (orderData.order_type === 'beli') {
                const { data: networkData, error: networkError } = await supabase
                    .from('warung_jaringan')
                    .select('payment_method')
                    .limit(1)
                    .single();

                if (!networkError && networkData) {
                    setAdminPaymentMethods(networkData.payment_method || []);
                } else {
                    console.error("Gagal memuat metode pembayaran admin:", networkError);
                }
            } else if (orderData.order_type === 'jual') {
                const { data: coinData, error: coinError } = await supabase
                    .from('crypto_rates')
                    .select('admin_wallet')
                    .eq('token_symbol', orderData.token_symbol)
                    .eq('network', orderData.network)
                    .single();

                if (!coinError && coinData && coinData.admin_wallet) {
                    setAdminWallet(coinData.admin_wallet);
                } else {
                    console.error("Gagal memuat wallet admin dari crypto_rates:", coinError);
                    setAdminWallet(null);
                }
            }
             setIsInfoLoading(false);
        } else {
            console.error("Gagal memuat order:", orderError);
        }
        setLoading(false);
    }, [orderId, currentUser]);

    useEffect(() => {
        fetchOrderAndMethods();
        const channel = supabase.channel(`order:${orderId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'warung_transactions', 
                filter: `id=eq.${orderId}`
            }, (payload) => setOrder(payload.new))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [orderId, fetchOrderAndMethods]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };
    
    const handleConfirmPayment = async () => {
        if (!proofFile) {
            alert('Mohon unggah bukti transfer (screenshot/hash transaksi) terlebih dahulu.');
            return;
        }
        if (!window.confirm('Apakah Anda yakin sudah mentransfer dan ingin mengirimkan bukti ini?')) return;

        setIsSubmitting(true);
        const filePath = `user_proofs/${currentUser.id}/${orderId}-${Date.now()}.${proofFile.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage.from('buktitransfer').upload(filePath, proofFile);

        if (uploadError) {
            alert('Gagal mengunggah bukti: ' + uploadError.message);
            setIsSubmitting(false);
            return;
        }

        const { data } = supabase.storage.from('buktitransfer').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        await supabase.from('chat_messages').insert({
            transaction_id: orderId,
            sender_id: currentUser.id,
            message: `Bukti transfer telah dikirim.`,
            attachment_url: publicUrl,
            is_system_message: true
        });

        const { data: updatedOrder, error: updateError } = await supabase
            .from('warung_transactions')
            .update({ proof_url: publicUrl, status: 'awaiting_confirmation' })
            .eq('id', orderId)
            .select()
            .single();
        
        if (updateError) {
            alert('Gagal mengonfirmasi pengiriman: ' + updateError.message);
        } else {
            alert('Bukti berhasil dikirim! Admin akan segera memverifikasi pembayaran Anda.');
            if (updatedOrder) {
                setOrder(updatedOrder);
            }
        }
        setIsSubmitting(false);
    };

    const cancelOrder = async () => {
        if(window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat diurungkan.')) {
            await supabase.from('warung_transactions').update({ status: 'rejected' }).eq('id', orderId);
        }
    };

    if (loading) return <div className="text-center p-10"><FontAwesomeIcon icon={faSpinner} spin size="2x" /></div>;
    if (!order) return <div className="text-center p-10">Pesanan tidak ditemukan atau Anda tidak memiliki akses.</div>;

    const canCancel = ['pending', 'awaiting_payment'].includes(order.status);
    const hasProofBeenUploaded = order.status !== 'awaiting_payment' && order.proof_url;

    const renderUploadAndConfirm = () => {
        if (hasProofBeenUploaded) {
            return (
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm p-4 rounded-lg flex items-start gap-3">
                    <FontAwesomeIcon icon={faFileCircleCheck} className="text-xl mt-1" />
                    <div>
                        <h4 className="font-bold">Bukti Terkirim</h4>
                        <p>Anda sudah mengirimkan bukti transfer. Mohon tunggu review dari admin.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="font-semibold block">1. Unggah Bukti Transfer (SS/Tx Hash)</label>
                    <input type="file" onChange={handleFileChange} className="input-file w-full" accept="image/*,text/plain"/>
                    {proofFile && <p className="text-xs text-gray-400">File dipilih: {proofFile.name}</p>}
                </div>
                <div className="space-y-2 pt-2">
                    <label className="font-semibold block">2. Konfirmasi Pembayaran/Pengiriman</label>
                    <button onClick={handleConfirmPayment} disabled={isSubmitting || !proofFile} className="btn-primary w-full disabled:opacity-50">
                        {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faPaperPlane} className="mr-2"/> Saya Sudah Transfer & Kirim Bukti</>}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <section className="page-content max-w-4xl mx-auto py-8 space-y-6">
             <Link to="/warung-kripto" className="text-sm text-primary hover:underline flex items-center gap-2">
                 <FontAwesomeIcon icon={faArrowLeft} /> Kembali ke Warung
             </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-5 rounded-lg space-y-4 h-fit">
                    <h2 className="text-xl font-bold">Detail Pesanan #{order.id.substring(0, 8)}</h2>
                    <p><strong>Tipe:</strong> <span className={`font-bold ${order.order_type === 'beli' ? 'text-green-500' : 'text-red-500'}`}>{order.order_type?.toUpperCase()}</span></p>
                    <p><strong>Aset:</strong> {order.amount_crypto} {order.token_symbol}</p>
                    <p><strong>Total:</strong> Rp {Number(order.amount_idr).toLocaleString('id-ID')}</p>
                    <p><strong>Status:</strong> <span className="font-semibold">{order.status}</span></p>
                    <hr className="border-light-border dark:border-dark-border"/>
                    
                    {orderDetails && (
                        <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg text-sm space-y-2 my-4">
                            <h4 className="font-semibold text-base mb-2">Rincian Biaya (Estimasi)</h4>
                            <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                                <span>Nilai Pasar Aset:</span>
                                <span className="text-light-text dark:text-dark-text font-mono">Rp {Math.round(orderDetails.marketValue).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                                <span>Biaya Layanan:</span>
                                <span className="text-primary font-mono">
                                    {order.order_type === 'beli' ? '+ ' : '- '}Rp {Math.round(orderDetails.serviceFee).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <hr className="border-light-border dark:border-dark-border !my-2"/>
                            <div className="flex justify-between font-bold text-light-text dark:text-dark-text">
                                <span>{order.order_type === 'beli' ? 'Total Transfer' : 'Total Diterima'}:</span>
                                <span className="text-primary font-mono">Rp {Math.round(orderDetails.total).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    )}
                    
                    {order.status === 'awaiting_payment' && order.order_type === 'beli' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Instruksi Pembayaran Rupiah</h3>
                                <p className="text-sm text-gray-400">Silakan transfer sejumlah <strong>Rp {Number(order.amount_idr).toLocaleString('id-ID')}</strong> ke salah satu rekening berikut:</p>
                                <div className="mt-2 space-y-2">
                                    {isInfoLoading ? (
                                        <p className="text-sm italic text-gray-400 flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} spin/> Memuat metode pembayaran...</p>
                                    ) : adminPaymentMethods.length > 0 ? adminPaymentMethods.map((method, index) => (
                                        <div key={index} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg text-sm space-y-1">
                                            <div>
                                                <span className="font-semibold">{method.name}</span>
                                                <p className="font-mono flex items-center justify-between">
                                                    <span>{method.account_number}</span>
                                                    <button onClick={() => copyToClipboard(method.account_number)} className="btn-secondary-outline text-xs px-2 py-1"><FontAwesomeIcon icon={faCopy} className="mr-1"/> Salin</button>
                                                </p>
                                                <p className="text-xs italic">a/n {method.account_name}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-yellow-400">Metode pembayaran admin belum diatur.</p>
                                    )}
                                </div>
                            </div>
                           {renderUploadAndConfirm()}
                        </div>
                    )}
                    
                    {order.status === 'awaiting_payment' && order.order_type === 'jual' && (
                         <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Instruksi Pengiriman Aset Kripto</h3>
                                <p className="text-sm text-gray-400">Silakan transfer sejumlah <strong>{order.amount_crypto} {order.token_symbol}</strong> ke alamat wallet admin berikut:</p>
                                <div className="mt-2 space-y-2">
                                     {isInfoLoading ? (
                                        <p className="text-sm italic text-gray-400 flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} spin/> Memuat alamat wallet...</p>
                                    ) : adminWallet ? (
                                        <div className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg text-sm space-y-1">
                                            <div>
                                                <span className="font-semibold flex items-center gap-2"><FontAwesomeIcon icon={faWallet}/>{order.token_symbol} ({order.network})</span>
                                                <div className="font-mono flex items-center justify-between break-all">
                                                    <span>{adminWallet}</span>
                                                    <button onClick={() => copyToClipboard(adminWallet)} className="btn-secondary-outline text-xs px-2 py-1 ml-2 flex-shrink-0"><FontAwesomeIcon icon={faCopy} className="mr-1"/> Salin</button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-yellow-400">Alamat wallet admin untuk aset ini belum diatur.</p>
                                    )}
                                </div>
                            </div>
                           {renderUploadAndConfirm()}
                        </div>
                    )}
                    
                    {/* ## PERBAIKAN: Notifikasi status yang lebih spesifik ## */}
                    {order.status === 'awaiting_confirmation' && (
                        <div className="bg-blue-500/10 border-l-4 border-blue-500 text-blue-300 p-4 rounded-md" role="alert">
                            <p className="font-bold">Menunggu Konfirmasi Admin</p>
                            <p className="text-sm">Bukti Anda sedang direview. Mohon tunggu sebentar.</p>
                        </div>
                    )}
                    {order.status === 'processing' && (
                        <div className="bg-purple-500/10 border-l-4 border-purple-500 text-purple-300 p-4 rounded-md" role="alert">
                            <p className="font-bold flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} spin/> Pesanan Diproses</p>
                            <p className="text-sm">Pesanan Anda telah disetujui dan sedang diproses oleh admin.</p>
                        </div>
                    )}
                    {order.status === 'completed' && (
                        <div className="bg-green-500/10 border-l-4 border-green-500 text-green-300 p-4 rounded-md space-y-3" role="alert">
                            <div>
                                <p className="font-bold flex items-center gap-2"><FontAwesomeIcon icon={faCheckCircle}/> Transaksi Selesai</p>
                                <p className="text-sm">Pesanan Anda telah berhasil diselesaikan.</p>
                            </div>
                            {order.admin_proof_url && (
                                <div>
                                    <h5 className="text-sm font-semibold mb-2 text-green-200">Bukti dari Admin:</h5>
                                    <a href={order.admin_proof_url} target="_blank" rel="noopener noreferrer">
                                        <img src={order.admin_proof_url} alt="Bukti dari Admin" className="rounded-lg max-w-full h-auto shadow-md border-2 border-green-500/20" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    {order.status === 'rejected' && <p className="text-sm text-red-400 flex items-center gap-2"><FontAwesomeIcon icon={faTimesCircle}/> Transaksi Ditolak/Dibatalkan.</p>}
                    {canCancel && <button onClick={cancelOrder} className="btn-danger w-full mt-4 text-sm">Batalkan Pesanan</button>}
                </div>

                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-5 rounded-lg">
                     <h2 className="text-xl font-bold mb-4">Obrolan Transaksi</h2>
                     <TransactionChat transactionId={orderId} currentUser={currentUser} />
                </div>
            </div>
        </section>
    );
}

