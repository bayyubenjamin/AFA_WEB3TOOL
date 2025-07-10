// src/hooks/useAirdropsWithUpdates.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CACHE_KEY = 'airdrops-cache-data'; // Kunci untuk cache data airdrop
const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp'; // Kunci untuk kunjungan terakhir

/**
 * Hook kustom untuk mengambil data airdrop beserta pembaruan (updates),
 * memprosesnya, dan menyimpannya di cache.
 */
export const useAirdropsWithUpdates = () => {
  const [airdrops, setAirdrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAirdrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Logika dari `fetchAirdrops` asli Anda dipindahkan ke sini
      const lastVisitTimestamp = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY);
      const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : new Date(0);

      const { data, error: fetchError } = await supabase
        .from('airdrops')
        .select('*, AirdropUpdates(created_at)');

      if (fetchError) throw fetchError;

      const processedData = (data || []).map(airdrop => {
        const updates = airdrop.AirdropUpdates;
        let lastActivityAt = new Date(airdrop.created_at);
        let hasNewUpdate = false;
        
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const isNewlyPosted = new Date(airdrop.created_at) > fortyEightHoursAgo;

        if (updates && updates.length > 0) {
          const mostRecentUpdateDate = new Date(Math.max(...updates.map(u => new Date(u.created_at))));
          if (mostRecentUpdateDate > lastActivityAt) {
            lastActivityAt = mostRecentUpdateDate;
          }
          if (mostRecentUpdateDate > fortyEightHoursAgo) {
            hasNewUpdate = true;
          }
        }
        
        const isNewForUser = lastActivityAt > lastVisitDate;
        
        const { AirdropUpdates, ...rest } = airdrop;
        return { ...rest, hasNewUpdate, isNewlyPosted, lastActivityAt, isNewForUser };
      });
      
      processedData.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
      
      // Update state dan simpan ke cache
      setAirdrops(processedData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(processedData));

    } catch (err) {
      setError(err.message || "Gagal memuat data airdrop.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Coba muat dari cache terlebih dahulu
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        if (isMounted) {
          setAirdrops(JSON.parse(cachedData));
          setLoading(false); // Data cache ditampilkan, UI tidak menunggu
        }
      }
    } catch (e) {
      console.error("Gagal memuat cache airdrops:", e);
      if (isMounted) setLoading(true);
    }

    // 2. Selalu refresh data dari server di background
    refreshAirdrops();

    return () => {
      isMounted = false;
    }
  }, [refreshAirdrops]);

  return { airdrops, loading, error, refreshAirdrops };
};
