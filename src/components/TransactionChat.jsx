// src/components/TransactionChat.jsx
// PERBAIKAN: Menyamakan bucket & memastikan listener real-time berfungsi optimal.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faPaperclip, faFileImage } from '@fortawesome/free-solid-svg-icons';

// Helper untuk mengecek apakah URL adalah gambar
const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
};

export default function TransactionChat({ transactionId, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [userProfiles, setUserProfiles] = useState({});
    const messagesEndRef = useRef(null);

    // Dibuat stabil dengan useCallback agar tidak menyebabkan re-render yang tidak perlu
    const fetchSenderProfile = useCallback(async (senderId) => {
        // Cek cache dulu untuk menghindari fetch berulang
        if (userProfiles[senderId]) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url, role')
            .eq('id', senderId)
            .single();

        if (!error && data) {
            setUserProfiles(prev => ({ ...prev, [senderId]: data }));
        }
    }, [userProfiles]); // Dependensi ke userProfiles

    useEffect(() => {
        // Fungsi untuk mengambil pesan awal
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`*`)
                .eq('transaction_id', transactionId)
                .order('created_at', { ascending: true });

            if (!error) {
                setMessages(data);
                const senderIds = [...new Set(data.map(msg => msg.sender_id))];
                // Menggunakan Promise.all untuk efisiensi saat mengambil banyak profil
                await Promise.all(senderIds.map(id => fetchSenderProfile(id)));
            }
        };

        fetchMessages();

        // ## PERBAIKAN REAL-TIME ##
        // Listener Supabase untuk pesan baru. Dibuat agar stabil.
        const handleNewMessage = (payload) => {
            fetchSenderProfile(payload.new.sender_id);
            setMessages(currentMessages => [...currentMessages, payload.new]);
        };

        const channel = supabase.channel(`chat:${transactionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `transaction_id=eq.${transactionId}`
            }, handleNewMessage)
            .subscribe();

        // Fungsi cleanup untuk membersihkan channel saat komponen tidak lagi ditampilkan
        return () => {
            supabase.removeChannel(channel);
        };
    }, [transactionId, fetchSenderProfile]); // Dependensi yang benar
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || isSending) return;
    
        setIsSending(true);
        let uploadedUrl = null;
    
        if (attachment) {
            const fileExt = attachment.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `chat_attachments/${currentUser.id}/${transactionId}/${fileName}`;
    
            // Menggunakan bucket 'buktitransfer' agar konsisten
            const { error: uploadError } = await supabase.storage.from('buktitransfer').upload(filePath, attachment);
    
            if (uploadError) {
                alert('Gagal mengunggah file: ' + uploadError.message);
                setIsSending(false);
                return;
            }
    
            const { data } = supabase.storage.from('buktitransfer').getPublicUrl(filePath);
            uploadedUrl = data.publicUrl;
        }
    
        const { error } = await supabase.from('chat_messages').insert({
            transaction_id: transactionId,
            sender_id: currentUser.id,
            message: newMessage.trim(),
            attachment_url: uploadedUrl
        });
    
        if (error) {
            alert('Gagal mengirim pesan: ' + error.message);
        } else {
            setNewMessage('');
            setAttachment(null);
        }
        setIsSending(false);
    };

    const getSenderInfo = (senderId) => {
        return userProfiles[senderId] || { username: 'Memuat...', avatar_url: null, role: 'user' };
    };

    return (
        <div className="flex flex-col h-[500px] bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {messages.map(msg => {
                    const sender = getSenderInfo(msg.sender_id);
                    const isCurrentUser = msg.sender_id === currentUser.id;
                    const isAdminSender = sender.role === 'admin';

                    if (msg.is_system_message) {
                        return (
                            <div key={msg.id} className="text-center my-3">
                                <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                                    {isCurrentUser ? "Anda" : "Admin"} mengirimkan bukti transfer
                                </span>
                                {isImageUrl(msg.attachment_url) && (
                                     <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                        <img src={msg.attachment_url} alt="Bukti Transfer" className="max-w-xs mx-auto rounded-lg shadow-md" />
                                     </a>
                                )}
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex items-end gap-2 mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            {!isCurrentUser && (
                                <img src={sender.avatar_url || `https://ui-avatars.com/api/?name=${sender.username?.charAt(0)}&background=F97D3C&color=FFF`} alt="avatar" className="w-6 h-6 rounded-full"/>
                            )}
                            <div className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg ${isCurrentUser ? 'bg-primary text-white' : (isAdminSender ? 'bg-green-600 text-white' : 'bg-white dark:bg-dark-card')}`}>
                               <p className="text-sm">{msg.message}</p>
                               {isImageUrl(msg.attachment_url) ? (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                                        <img src={msg.attachment_url} alt="Lampiran" className="max-w-[200px] rounded-md" />
                                    </a>
                               ) : msg.attachment_url && (
                                   <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 text-xs text-blue-400 hover:underline">
                                       <FontAwesomeIcon icon={faFileImage} /> Lihat Lampiran
                                   </a>
                               )}
                               <div className="text-xs mt-1 text-right opacity-70">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-light-border dark:border-dark-border">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="input-file w-full"/>
                    <label htmlFor="chat-file-upload" className="btn-secondary p-2 cursor-pointer">
                        <FontAwesomeIcon icon={faPaperclip} />
                        <input id="chat-file-upload" type="file" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button type="submit" disabled={isSending} className="btn-primary p-2">
                         {isSending ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
                    </button>
                </form>
                 {attachment && <p className="text-xs mt-2 text-gray-500">File dipilih: {attachment.name}</p>}
            </div>
        </div>
    );
}

