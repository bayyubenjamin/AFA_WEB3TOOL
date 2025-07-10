// src/components/PageForum.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { supabase } from '../supabaseClient';
import { useLanguage } from "../context/LanguageContext";
import { useForumMessages } from "../hooks/useForumMessages"; // <-- 1. IMPORT HOOK BARU
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
    return lang === 'id' ? translationsId : translationsEn;
};

// =================================================================
// KOMPONEN `Message` TIDAK DIUBAH SAMA SEKALI
// =================================================================
const Message = React.memo(({ msg, isCurrentUser, profile }) => {
    const senderName = isCurrentUser ? (profile?.username || 'You') : (profile?.username || 'guest');
    const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${senderName.charAt(0)}&background=random`;

    return (
        <div className={`flex items-start gap-3 my-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {!isCurrentUser && (
                <img src={avatarUrl} alt={senderName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            )}
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`
                    px-4 py-2.5 rounded-2xl max-w-xs md:max-w-md
                    ${isCurrentUser 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 text-light-text dark:text-white rounded-bl-none'
                    }
                `}>
                    {!isCurrentUser && (
                         <p className="text-xs font-bold text-primary mb-1">{senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                 <p className="text-xs text-light-subtle dark:text-gray-500 mt-1.5 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
             {isCurrentUser && (
                <img src={avatarUrl} alt={senderName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            )}
        </div>
    );
});
Message.displayName = 'Message';


export default function PageForum({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).forumPage || {}; 

  // 2. MENGGUNAKAN HOOK BARU UNTUK DATA
  const { messages, profiles, loading, error, setMessages } = useForumMessages(currentUser);

  // State untuk UI (input form) tetap di sini
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  
  // Fungsi `scrollToBottom` tidak berubah
  const scrollToBottom = (behavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };
  
  // 3. LOGIKA FETCH DATA YANG LAMA (fetchMessages, fetchProfiles, useEffect)
  // SUDAH DIHAPUS dan dipindahkan ke dalam hook.

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fungsi `handleSendMessage` tidak berubah secara logika,
  // hanya disesuaikan untuk update state dari hook.
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !currentUser.id || sending) return;
    
    setSending(true);
    
    const messageToSend = {
      content: newMessage.trim(),
      user_id: currentUser.id,
      channel_id: 'general' 
    };

    // Optimistic UI update: langsung tampilkan pesan
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      ...messageToSend,
      created_at: new Date().toISOString(),
    };
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage("");
    setTimeout(() => scrollToBottom("smooth"), 100);

    const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert(messageToSend)
        .select()
        .single();

    if (insertError) {
      alert((t.sendMessageError || "Failed to send message: ") + insertError.message); 
      // Rollback jika gagal
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } else if (insertedMessage) {
      // Ganti pesan temporary dengan data dari server
      setMessages(prev => prev.map(msg => msg.id === tempId ? insertedMessage : msg));
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100%-var(--bottomnav-height))] lg-desktop:h-full overflow-hidden">
        
      <div className="flex-grow overflow-y-auto px-2 md:px-4 pt-4">
          {/* 4. PENYESUAIAN LOGIKA RENDER UNTUK CACHING */}
          {loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-light-subtle dark:text-gray-500">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3" />
                  <span>{t.loading || "Loading messages..."}</span>
              </div>
          )}
          {error && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-red-400 text-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-3xl mb-3"/>
                  <p className="font-bold">{t.errorTitle || "An Error Occurred"}</p>
                  <p className="text-sm">{error}</p>
              </div>
          )}
          {!loading && !error && messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-light-subtle dark:text-gray-500 text-center">
               <p>{t.noMessages || "No messages yet. Be the first to say hi!"}</p>
           </div>
          )}
          {messages.length > 0 && (
              <div>
                  {messages.map(msg => (
                      <Message
                          key={msg.id}
                          msg={msg}
                          isCurrentUser={msg.user_id === currentUser?.id}
                          profile={profiles[msg.user_id] || (msg.user_id === currentUser?.id ? currentUser : null)}
                      />
                  ))}
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-3 md:p-4 mt-2 bg-light-bg dark:bg-dark-bg">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-light-card dark:bg-dark-card p-2 rounded-xl border border-black/10 dark:border-white/10 shadow-lg">
              <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder={!currentUser?.id ? (t.inputPlaceholderLoggedOut || "You must be logged in to chat") : (t.inputPlaceholderLoggedIn || "Type your message...")} 
                  disabled={!currentUser?.id || sending}
                  className="flex-grow bg-transparent border-none focus:ring-0 text-light-text dark:text-white placeholder-light-subtle dark:placeholder-gray-500 p-2"
                  autoComplete="off"
              />
              <button 
                  type="submit" 
                  className="btn-primary flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={newMessage.trim() === "" || !currentUser?.id || sending}>
                  {sending ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
              </button>
          </form>
      </div>
    </div>
  );
}
