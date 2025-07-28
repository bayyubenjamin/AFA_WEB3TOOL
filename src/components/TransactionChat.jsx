// File: src/components/TransactionChat.jsx
// PERBAIKAN: Menambahkan key unik pada mapping dan fetching profil pengirim

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faPaperclip, faFileImage } from '@fortawesome/free-solid-svg-icons';

export default function TransactionChat({ transactionId, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [userProfiles, setUserProfiles] = useState({});
    const messagesEndRef = useRef(null);

    const fetchSenderProfile = async (senderId) => {
        if (userProfiles[senderId]) return userProfiles[senderId];

        const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', senderId)
            .single();

        if (!error && data) {
            setUserProfiles(prev => ({ ...prev, [senderId]: data }));
            return data;
        }
        return { username: 'User', avatar_url: null };
    };

    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`*`)
                .eq('transaction_id', transactionId)
                .order('created_at', { ascending: true });

            if (!error) {
                setMessages(data);
                // Pre-fetch profiles for existing messages
                const senderIds = [...new Set(data.map(msg => msg.sender_id))];
                senderIds.forEach(id => fetchSenderProfile(id));
            }
        };

        fetchMessages();

        const channel = supabase.channel(`chat:${transactionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `transaction_id=eq.${transactionId}`
            }, (payload) => {
                 fetchSenderProfile(payload.new.sender_id);
                 setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [transactionId]);
    
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
            const filePath = `chat_proofs/${currentUser.id}/${transactionId}/${fileName}`;
    
            const { error: uploadError } = await supabase.storage.from('warung-files').upload(filePath, attachment);
    
            if (uploadError) {
                alert('Gagal mengunggah bukti: ' + uploadError.message);
                setIsSending(false);
                return;
            }
    
            const { data } = supabase.storage.from('warung-files').getPublicUrl(filePath);
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
        return userProfiles[senderId] || { username: 'Memuat...', avatar_url: null };
    };

    return (
        <div className="flex flex-col h-[500px] bg-light-bg dark:bg-dark-bg rounded-lg border border-light-border dark:border-dark-border">
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {/* PERBAIKAN: Menggunakan msg.id sebagai key */}
                {messages.map(msg => {
                    const sender = getSenderInfo(msg.sender_id);
                    return (
                        <div key={msg.id} className={`flex items-end gap-2 mb-4 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender_id !== currentUser.id && (
                                <img src={sender.avatar_url || `https://ui-avatars.com/api/?name=${sender.username?.charAt(0)}&background=F97D3C&color=FFF`} alt="avatar" className="w-6 h-6 rounded-full"/>
                            )}
                            <div className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg ${msg.sender_id === currentUser.id ? 'bg-primary text-white' : 'bg-white dark:bg-dark-card'}`}>
                               <p className="text-sm">{msg.message}</p>
                               {msg.attachment_url && (
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

