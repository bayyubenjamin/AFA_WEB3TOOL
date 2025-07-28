// src/components/PageUserOrder.jsx 
// PERBAIKAN: Mengambil data rekening admin dari tabel 'warung_jaringan'. 

import React, { useState, useEffect, useCallback } from 'react'; 
import { useParams, Link } from 'react-router-dom'; 
import { supabase } from '../supabaseClient'; 
import TransactionChat from './TransactionChat'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import {  
    faSpinner, faArrowLeft, faUpload, faCheckCircle, faTimesCircle,  
    faCopy, faInfoCircle, faPaperPlane  
} from '@fortawesome/free-solid-svg-icons'; 

export default function PageUserOrder({ currentUser }) { 
    const { orderId } = useParams(); 
    const [order, setOrder] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [proofFile, setProofFile] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [adminPaymentMethods, setAdminPaymentMethods] = useState([]); 
    const [isPaymentMethodsLoading, setIsPaymentMethodsLoading] = useState(true); 

    const copyToClipboard = (text) => { 
        navigator.clipboard.writeText(text).then(() => { 
            alert('Nomor rekening disalin!'); 
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
            if (orderData.order_type === 'beli') { 
                setIsPaymentMethodsLoading(true); 
                 
                // ## PERBAIKAN UTAMA: Mengambil data dari 'warung_jaringan' 
                const { data: networkData, error: networkError } = await supabase 
                    .from('warung_jaringan') 
                    .select('payment_method') 
                    .limit(1) // Cukup ambil 1 baris, karena payment_method sama untuk semua 
                    .single(); 

                if (!networkError && networkData) { 
                    setAdminPaymentMethods(networkData.payment_method || []); 
                } else { 
                    console.error("Gagal memuat metode pembayaran admin:", networkError); 
                } 
                 setIsPaymentMethodsLoading(false); 
            } 
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
            alert('Mohon unggah bukti transfer (screenshot) terlebih dahulu.'); 
            return; 
        } 
        if (!window.confirm('Apakah Anda yakin sudah mentransfer dana dan ingin mengirimkan bukti ini?')) return; 

        setIsSubmitting(true); 
        // Memastikan ekstensi file ditambahkan ke filePath
        const filePath = `user_proofs/${currentUser.id}/${orderId}-${Date.now()}.${proofFile.name.split('.').pop()}`; 
        
        // >>> PERUBAHAN DI SINI: MENGGUNAKAN BUCKET 'buktitransfer' <<<
        const { error: uploadError } = await supabase.storage.from('buktitransfer').upload(filePath, proofFile); 

        if (uploadError) { 
            alert('Gagal mengunggah bukti: ' + uploadError.message); 
            setIsSubmitting(false); 
            return; 
        } 

        // >>> PERUBAHAN DI SINI: MENGGUNAKAN BUCKET 'buktitransfer' <<<
        const { data } = supabase.storage.from('buktitransfer').getPublicUrl(filePath); 
        const { error: updateError } = await supabase 
            .from('warung_transactions') 
            .update({ proof_url: data.publicUrl, status: 'awaiting_confirmation' }) 
            .eq('id', orderId); 
         
        if (updateError) { 
            alert('Gagal mengonfirmasi pembayaran: ' + updateError.message); 
        } else { 
            alert('Bukti berhasil dikirim! Admin akan segera memverifikasi pembayaran Anda.'); 
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
                     
                    {order.status === 'awaiting_payment' && order.order_type === 'beli' && ( 
                        <div className="space-y-4"> 
                            <div> 
                                <h3 className="font-semibold mb-2">Instruksi Pembayaran</h3> 
                                <p className="text-sm text-gray-400">Silakan transfer sejumlah <strong>Rp {Number(order.amount_idr).toLocaleString('id-ID')}</strong> ke salah satu rekening berikut:</p> 
                                <div className="mt-2 space-y-2"> 
                                    {isPaymentMethodsLoading ? ( 
                                        <p className="text-sm italic text-gray-400 flex items-center gap-2"> 
                                            <FontAwesomeIcon icon={faSpinner} spin/> Memuat metode pembayaran admin... 
                                        </p> 
                                    ) : adminPaymentMethods.length > 0 ? adminPaymentMethods.map((method, index) => ( 
                                        <div key={index} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg text-sm space-y-1"> 
                                            <div> 
                                                <span className="font-semibold">{method.name}</span> 
                                                <p className="font-mono flex items-center justify-between"> 
                                                    <span>{method.account_number}</span> 
                                                    <button onClick={() => copyToClipboard(method.account_number)} className="btn-secondary-outline text-xs px-2 py-1"> 
                                                        <FontAwesomeIcon icon={faCopy} className="mr-1"/> Salin 
                                                    </button> 
                                                </p> 
                                                <p className="text-xs italic">a/n {method.account_name}</p> 
                                            </div> 
                                        </div> 
                                    )) : ( 
                                        <p className="text-sm text-yellow-400">Metode pembayaran admin belum diatur.</p> 
                                    )} 
                                </div> 
                            </div> 
                            <div className="space-y-2"> 
                                <label className="font-semibold block">1. Unggah Bukti Transfer (SS)</label> 
                                <input type="file" onChange={handleFileChange} className="input-file w-full" accept="image/*"/> 
                                {proofFile && <p className="text-xs text-gray-400">File dipilih: {proofFile.name}</p>} 
                            </div> 
                            <div className="space-y-2 pt-2"> 
                                <label className="font-semibold block">2. Konfirmasi Pembayaran</label> 
                                <button onClick={handleConfirmPayment} disabled={isSubmitting || !proofFile} className="btn-primary w-full disabled:opacity-50"> 
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faPaperPlane} className="mr-2"/> Saya Sudah Transfer & Kirim Bukti</>} 
                                </button> 
                            </div> 
                        </div> 
                    )} 
                     
                    {['awaiting_confirmation', 'processing'].includes(order.status) && <p className="text-sm text-yellow-400 flex items-center gap-2"><FontAwesomeIcon icon={faSpinner} spin/> Menunggu konfirmasi dari Admin.</p>} 
                    {order.status === 'completed' && <p className="text-sm text-green-400 flex items-center gap-2"><FontAwesomeIcon icon={faCheckCircle}/> Transaksi Selesai.</p>} 
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

