// src/hooks/useAirdropDetail.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LS_AIRDROPS_LAST_VISIT_KEY = 'airdropsLastVisitTimestamp';

/**
 * Hook kustom untuk mengambil detail airdrop tunggal beserta pembaruannya (updates),
 * dengan sistem caching di localStorage.
 * @param {string} airdropSlug - Slug dari URL airdrop.
 */
export const useAirdropDetail = (airdropSlug) => {
  const [data, setData] = useState({ airdrop: null, updates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  // Kunci cache dinamis berdasarkan slug airdrop
  const getCacheKey = useCallback(() => {
    return airdropSlug ? `airdrop-detail-${airdropSlug}` : null;
  }, [airdropSlug]);

  // Fungsi untuk mengambil data terbaru dari server
  const refreshAirdropDetail = useCallback(async () => {
    if (!airdropSlug) {
      setLoading(false);
      setError("Airdrop slug tidak ditemukan di URL.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ambil data airdrop utama
      const { data: airdropData, error: airdropError } = await supabase
        .from('airdrops')
        .select('*')
        .eq('slug', airdropSlug)
        .single();

      if (airdropError) throw airdropError;
      if (!airdropData) throw new Error("Airdrop tidak ditemukan.");

      // Ambil data updates yang berelasi
      const { data: updatesData, error: updatesError } = await supabase
        .from('AirdropUpdates')
        .select('*, profiles(username, avatar_url)')
        .eq('airdrop_id', airdropData.id)
        .order('created_at', { ascending: true });

      if (updatesError) throw updatesError;

      const fullData = { airdrop: airdropData, updates: updatesData || [] };

      // Simpan data gabungan ke state dan cache
      setData(fullData);
      const cacheKey = getCacheKey();
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(fullData));
      }
      
      // Logika untuk notifikasi update baru (tetap dipertahankan)
      const lastVisitTimestamp = localStorage.getItem(LS_AIRDROPS_LAST_VISIT_KEY);
      const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : null;
      if (lastVisitDate && updatesData && updatesData.length > 0) {
        const hasUnseenUpdate = updatesData.some(update => new Date(update.created_at) > lastVisitDate);
        setHasNewUpdates(hasUnseenUpdate);
      }

    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }, [airdropSlug, getCacheKey]);

  useEffect(() => {
    let isMounted = true;
    const cacheKey = getCacheKey();

    if (!cacheKey) {
      setError("Slug tidak valid.");
      setLoading(false);
      return;
    }

    // 1. Coba muat dari cache
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        if (isMounted) {
          const parsedData = JSON.parse(cachedData);
          setData(parsedData);
          setLoading(false); // Data cache ditampilkan, UI tidak menunggu
        }
      }
    } catch (e) {
      console.error("Gagal memuat cache detail airdrop:", e);
      if (isMounted) setLoading(true);
    }

    // 2. Selalu refresh data dari server di background
    refreshAirdropDetail();

    return () => {
      isMounted = false;
    }
  }, [airdropSlug, getCacheKey, refreshAirdropDetail]);

  return { ...data, loading, error, hasNewUpdates, refreshAirdropDetail };
};
