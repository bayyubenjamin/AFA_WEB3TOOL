// src/components/PageForum.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faSpinner,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from '../supabaseClient';
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
    return lang === 'id' ? translationsId : translationsEn;
};

const formatMessageTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return "invalid time";
    }
};

export default function PageForum({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).forumPage || {}; 

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select(`*, profiles (username, avatar_url)`)
      .order('created_at', { ascending: true })
      .limit(500);

    if (fetchError) {
      console.error('PageForum - Error fetching messages:', fetchError);
      setError(t.errorFetch || "Gagal memuat pesan. Pastikan RLS Policy untuk SELECT sudah benar.");
    } else {
      setMessages(data);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase.channel('realtime:forum-messages')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Realtime: Pesan baru terdeteksi!', payload.new);
          fetchMessages();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
            console.log('PageForum: Berhasil terhubung ke Realtime channel!');
            setError(null);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`PageForum: Realtime subscription failed! Status: ${status}`, err);
            setError(t.errorRealtime || "COMING SOON!"); 
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, t]);

  useEffect(() => {
    if (messages.length > 0) {
        scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !currentUser.id) return;

    const { error: insertError } = await supabase
      .from('messages')
      .insert([{
        content: newMessage.trim(),
        user_id: currentUser.id,
        channel_id: 'general'
      }]);

    if (insertError) {
      alert((t.sendMessageError || "Gagal mengirim pesan: ") + insertError.message); 
    } else {
      setNewMessage("");
    }
  };

  return (
    <section className="page-content flex flex-col h-[calc(100vh-var(--header-height)-var(--bottomnav-height))] p-0 overflow-hidden">
      {/* [EDIT] */}
      <div className="flex-grow flex flex-col bg-light-card dark:bg-card overflow-hidden">
        <div className="flex-grow p-4 space-y-4 overflow-y-auto">

          {loading && (
            <div className="flex justify-center items-center h-full">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-primary"/>
              {/* [EDIT] */}
              <p className="ml-3 text-light-text dark:text-gray-300">{t.loading || "Memuat pesan..."}</p> 
            </div>
          )}
          {error && (
            <div className="flex flex-col justify-center items-center h-full text-center text-red-400">
              <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-3"/>
              {/* [EDIT] */}
              <p className="font-semibold text-light-text dark:text-white">{t.errorTitle || "Terjadi Kesalahan"}</p> 
              <p className="text-sm max-w-xs">{error}</p>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            // [EDIT]
             <div className="flex justify-center items-center h-full text-center text-light-subtle dark:text-gray-500">
                <p>{t.noMessages || "Belum ada pesan."}<br/>{t.beTheFirst || "Jadilah yang pertama mengirim pesan!"}</p> 
             </div>
          )}

          {!loading && !error && messages.map(msg => {
            const isCurrentUser = msg.user_id === currentUser?.id;
            const senderName = isCurrentUser ? (t.currentUserTag || 'Anda') : (msg.profiles?.username || t.guestUserTag || 'User'); 
            const senderAvatar = isCurrentUser ? currentUser?.avatar_url : (msg.profiles?.avatar_url);

            return (
              <div key={msg.id} className={`flex items-end gap-2 group relative ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {!isCurrentUser && ( <img src={senderAvatar || `https://ui-avatars.com/api/?name=${senderName.substring(0,1)}&background=random`} alt={senderName} className="w-8 h-8 rounded-full self-start flex-shrink-0"/> )}
                <div className={`max-w-[75%]`}>
                  {/* [EDIT] */}
                  {!isCurrentUser && ( <p className="text-xs text-light-subtle dark:text-gray-400 mb-0.5 ml-1">{senderName}</p> )}
                  {/* [EDIT] */}
                  <div className={`px-3.5 py-2.5 break-words shadow-sm rounded-xl ${ isCurrentUser ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700/70 text-light-text dark:text-gray-200 rounded-bl-none' }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {/* [EDIT] */}
                  <div className={`flex items-center mt-0.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <p className={`text-xs text-light-subtle dark:text-gray-500 ${isCurrentUser ? 'mr-1' : 'ml-1'}`}>{formatMessageTimestamp(msg.created_at)}</p>
                  </div>
                </div>
                 {isCurrentUser && ( <img src={senderAvatar || `https://ui-avatars.com/api/?name=${currentUser?.name?.substring(0,1) || 'U'}&background=random`} alt={currentUser?.name} className="w-8 h-8 rounded-full self-start flex-shrink-0"/> )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* [EDIT] */}
        <div className="p-3 md:p-4 border-t border-black/10 dark:border-white/10 flex-shrink-0 bg-light-card dark:bg-card">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
            {/* [EDIT] */}
            <input ref={messageInputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} 
                   placeholder={!currentUser?.id ? (t.inputPlaceholderLoggedOut || "Anda harus login untuk mengirim pesan") : (t.inputPlaceholderLoggedIn || "Ketik pesan Anda di sini...")} 
                   disabled={!currentUser?.id} 
                   className="flex-grow p-2.5 px-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 text-light-text dark:text-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/80 disabled:opacity-50" />
            <button type="submit" className="btn-primary p-0 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center flex-shrink-0" 
                    title={t.sendButton || "Kirim Pesan"}
                    disabled={newMessage.trim() === "" || !currentUser?.id}> 
              <FontAwesomeIcon icon={faPaperPlane} className="text-base md:text-lg"/> 
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
