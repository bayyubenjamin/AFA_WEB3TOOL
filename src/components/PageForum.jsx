// src/components/PageForum.jsx - KODE LENGKAP DAN SUDAH DIPERBAIKI
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSpinner, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { supabase } from '../supabaseClient';
import { useLanguage } from "../context/LanguageContext";
import translationsId from "../translations/id.json";
import translationsEn from "../translations/en.json";

const getTranslations = (lang) => {
    return lang === 'id' ? translationsId : translationsEn;
};

// --- Komponen Pesan (Message Bubble) ---
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


// --- Komponen Utama Forum ---
export default function PageForum({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).forumPage || {}; 

  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  
  const scrollToBottom = (behavior = "auto") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchProfiles = useCallback(async (userIds) => {
    const idsToFetch = [...userIds].filter(id => id && !profiles[id]);
    if (idsToFetch.length === 0) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', idsToFetch);

    if (!error && data) {
      const newProfiles = data.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      setProfiles(prev => ({ ...prev, ...newProfiles }));
    }
  }, [profiles]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select(`*`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('PageForum - Error fetching messages:', fetchError);
      setError(t.errorFetch || "Failed to load messages.");
    } else {
      setMessages(data);
      const userIds = new Set(data.map(m => m.user_id));
      await fetchProfiles(userIds);
    }
    setLoading(false);
  }, [t, fetchProfiles]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase.channel('forum-messages-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.user_id !== currentUser?.id) {
          setMessages(prev => [...prev, payload.new]);
          fetchProfiles(new Set([payload.new.user_id]));
        }
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [fetchMessages, fetchProfiles, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !currentUser.id || sending) return;
    
    setSending(true);
    
    const messageToSend = {
      content: newMessage.trim(),
      user_id: currentUser.id,
      channel_id: 'general' 
    };

    const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert(messageToSend)
        .select()
        .single();

    if (insertError) {
      alert((t.sendMessageError || "Failed to send message: ") + insertError.message); 
    } else if (insertedMessage) {
      setMessages(prevMessages => [...prevMessages, insertedMessage]);
      setNewMessage("");
      setTimeout(() => scrollToBottom("smooth"), 100);
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100%-var(--bottomnav-height))] lg-desktop:h-full overflow-hidden">
      
      <div className="flex-grow overflow-y-auto px-2 md:px-4 pt-4">
          {loading && (
              <div className="flex flex-col items-center justify-center h-full text-light-subtle dark:text-gray-500">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-3" />
                  <span>{t.loading || "Loading messages..."}</span>
              </div>
          )}
          {error && (
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
          {!loading && !error && (
              <div>
                  {messages.map(msg => (
                      <Message
                          key={msg.id}
                          msg={msg}
                          isCurrentUser={msg.user_id === currentUser?.id}
                          profile={profiles[msg.user_id] || currentUser}
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
