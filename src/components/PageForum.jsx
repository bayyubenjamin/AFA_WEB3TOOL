// src/components/PageForum.jsx (FINAL FIX 2 - MOBILE KEYBOARD FIX)
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

// --- Helper Functions ---
const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
        return "timestamp_error";
    }
};

const GlitchText = ({ text }) => (
    <span className="glitch" data-text={text}>{text}</span>
);

// --- Main Component ---
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
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const fetchMessages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select(`
        *,
        profile:profiles (username)
      `)
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchMessages())
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') { setError(null); }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`PageForum: Realtime subscription failed! Status: ${status}`, err);
          setError(t.errorRealtime || "REALTIME CONNECTION FAILED");
        }
      });
    return () => supabase.removeChannel(channel);
  }, [fetchMessages, t]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !currentUser.id) return;

    const { error: insertError } = await supabase.from('messages').insert([{
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

  // --- STYLING ---
  const terminalGreen = 'text-green-400';
  const terminalRed = 'text-red-400';
  const terminalBlue = 'text-blue-400';
  const terminalGray = 'text-gray-500';

  return (
    // ========================================================================
    // ======================= PERUBAHAN UTAMA DI SINI ========================
    // ========================================================================
    // Mengganti `h-full` dengan kalkulasi tinggi viewport yang benar.
    // Menghapus `p-2 md:p-4` karena akan diatur oleh parent di App.jsx
    <div className="h-[calc(100vh-var(--header-height)-var(--bottomnav-height))] w-full bg-black text-white font-mono flex flex-col overflow-hidden">
    {/* ======================= AKHIR PERUBAHAN UTAMA ========================== */}
        {/* Terminal Header */}
        <div className="flex-shrink-0 border-b-2 border-green-500/50 pb-2 mb-2 text-center px-2 md:px-4 pt-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">
                <GlitchText text="AFA :: GENERAL-CHAT" />
            </h1>
            <p className={`${terminalGray} text-xs`}>[Status: Connected]</p>
        </div>

        {/* Message Container */}
        <div className="flex-grow overflow-y-auto px-2 md:px-4 pr-3">
            {loading && (
                <div className="flex items-center h-full">
                    <FontAwesomeIcon icon={faSpinner} spin className={`${terminalGreen} mr-2`} />
                    <span>Loading transmissions...</span>
                </div>
            )}
            {error && (
                <div className="text-center h-full text-red-400">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mb-2"/>
                    <p className="font-bold">!! CRITICAL ERROR !!</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            {!loading && !error && (
                <div className="space-y-2">
                    {messages.map(msg => {
                        const isCurrentUser = msg.user_id === currentUser?.id;
                        const senderName = isCurrentUser ? (currentUser.username || 'you') : (msg.profile?.username || 'guest');
                        return (
                            <div key={msg.id} className="flex text-sm leading-tight">
                                <span className={`${terminalGray} flex-shrink-0`}>[{formatTimestamp(msg.created_at)}]</span>
                                <span className={`mx-2 font-bold ${isCurrentUser ? terminalBlue : terminalRed}`}>{senderName}:</span>
                                <p className="flex-grow whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                        )
                    })}
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="flex-shrink-0 p-3 md:p-4 mt-2 border-t-2 border-green-500/50">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <span className={`${terminalGreen} font-bold`}>{currentUser?.username || 'anon'}>$&nbsp;</span>
                <input 
                    ref={messageInputRef}
                    type="text" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder={!currentUser?.id ? "ACCESS DENIED" : "Enter command..."} 
                    disabled={!currentUser?.id}
                    className="flex-grow bg-transparent border-none focus:ring-0 text-green-400 placeholder-gray-600 p-1"
                    autoComplete="off"
                />
                <button 
                    type="submit" 
                    className={`bg-green-500/80 text-black font-bold px-4 py-1 hover:bg-green-400 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}
                    disabled={newMessage.trim() === "" || !currentUser?.id}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </form>
        </div>
    </div>
  );
}
