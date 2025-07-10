// src/hooks/useEvents.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CACHE_KEY_EVENTS = 'events-cache-data';

/**
 * Hook kustom untuk mengambil daftar event dari Supabase,
 * dengan sistem caching di localStorage.
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mengganti nama `fetchEventsData` menjadi `refreshEvents`
  const refreshEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const { data, error: fetchError } = await supabase
            .from('events')
            .select(`*`) // Ambil semua kolom
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        // Update state dan simpan ke cache
        setEvents(data || []);
        localStorage.setItem(CACHE_KEY_EVENTS, JSON.stringify(data || []));

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Coba muat dari cache terlebih dahulu
    try {
      const cachedData = localStorage.getItem(CACHE_KEY_EVENTS);
      if (cachedData) {
        if (isMounted) {
          setEvents(JSON.parse(cachedData));
          setLoading(false); // Data cache ditampilkan, UI tidak menunggu
        }
      }
    } catch (e) {
      console.error("Gagal memuat cache events:", e);
      if (isMounted) setLoading(true);
    }

    // 2. Selalu refresh data dari server di background
    refreshEvents();

    return () => {
      isMounted = false;
    }
  }, [refreshEvents]);

  return { events, loading, error, refreshEvents };
};
