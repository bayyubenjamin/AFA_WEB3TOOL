// src/hooks/useForumMessages.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CACHE_KEY_MESSAGES = 'forum-messages-cache';
const CACHE_KEY_PROFILES = 'forum-profiles-cache';

/**
 * Hook kustom untuk mengelola pesan dan profil di forum, 
 * lengkap dengan caching dan real-time updates.
 * @param {object} currentUser - Objek pengguna yang sedang login.
 */
export const useForumMessages = (currentUser) => {
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfiles = useCallback(async (userIds, currentProfiles) => {
    const idsToFetch = [...userIds].filter(id => id && !currentProfiles[id]);
    if (idsToFetch.length === 0) return currentProfiles;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', idsToFetch);

    if (error) {
      console.error("Gagal fetch profil:", error);
      return currentProfiles;
    }
    
    const newProfiles = data.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});
    
    return { ...currentProfiles, ...newProfiles };
  }, []);

  const refreshMessages = useCallback(async (currentProfiles) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`*`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;

      const userIds = new Set(data.map(m => m.user_id));
      const updatedProfiles = await fetchProfiles(userIds, currentProfiles);

      setMessages(data);
      setProfiles(updatedProfiles);

      // Simpan ke cache
      localStorage.setItem(CACHE_KEY_MESSAGES, JSON.stringify(data));
      localStorage.setItem(CACHE_KEY_PROFILES, JSON.stringify(updatedProfiles));

    } catch (err) {
      setError("Gagal memuat pesan forum.");
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchProfiles]);

  useEffect(() => {
    let isMounted = true;
    let initialProfiles = {};

    // 1. Muat dari cache terlebih dahulu
    try {
      const cachedMessages = localStorage.getItem(CACHE_KEY_MESSAGES);
      const cachedProfiles = localStorage.getItem(CACHE_KEY_PROFILES);
      if (cachedMessages && cachedProfiles) {
        if (isMounted) {
          initialProfiles = JSON.parse(cachedProfiles);
          setMessages(JSON.parse(cachedMessages));
          setProfiles(initialProfiles);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Gagal memuat cache forum:", e);
      if (isMounted) setLoading(true);
    }

    // 2. Refresh data dari server di background
    refreshMessages(initialProfiles);
    
    // 3. Setup real-time subscription
    const channel = supabase.channel('forum-messages-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMessage = payload.new;
        if (isMounted) {
          setMessages(prev => [...prev, newMessage]);
          // Fetch profil baru jika belum ada
          setProfiles(prevProfiles => {
              if (!prevProfiles[newMessage.user_id]) {
                  fetchProfiles(new Set([newMessage.user_id]), prevProfiles).then(updated => setProfiles(updated));
              }
              return prevProfiles;
          });
        }
      })
      .subscribe();
      
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser, refreshMessages, fetchProfiles]);

  return { messages, profiles, loading, error, setMessages, setProfiles };
};
