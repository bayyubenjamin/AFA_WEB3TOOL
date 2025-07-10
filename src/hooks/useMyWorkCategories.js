// src/hooks/useMyWorkCategories.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook kustom untuk mengambil dan menyimpan kategori pekerjaan pengguna dari Supabase
 * dengan caching di localStorage.
 *
 * @param {object} currentUser - Objek pengguna yang sedang login dari Supabase.
 * @param {object} translations - Objek terjemahan (misal: pageMyWorkT).
 * @returns {object} - Mengembalikan { categories, setCategories, loading, error, refreshCategories }.
 */
export const useMyWorkCategories = (currentUser, translations) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = currentUser?.id;

  // Fungsi untuk mendapatkan kunci cache yang unik berdasarkan ID pengguna
  const getCacheKey = useCallback(() => {
    return userId ? `mywork-categories-${userId}` : null;
  }, [userId]);

  // Mengganti nama `fetchData` menjadi `refreshCategories`
  const refreshCategories = useCallback(async () => {
    if (!userId) {
      setError(translations.errorAuth);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_categories')
        .select(`*, user_airdrops (*)`) // Menggunakan query select yang sama persis
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const processedData = (data || [])
        .filter(cat => cat != null)
        .map(cat => {
            const validAirdrops = (cat.user_airdrops || []).filter(item => item != null);
            validAirdrops.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            return { ...cat, user_airdrops: validAirdrops };
      });
      
      // Jika fetch berhasil, perbarui state dan simpan ke localStorage
      setCategories(processedData);
      const cacheKey = getCacheKey();
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(processedData));
      }

    } catch (err) {
      console.error("Error fetching my work data:", err);
      setError(translations.errorFetch); // Menggunakan pesan error dari terjemahan
    } finally {
      setLoading(false);
    }
  }, [userId, getCacheKey, translations]);

  // Efek untuk memuat data saat komponen pertama kali dimuat
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError(translations.errorAuth);
      return;
    }

    const cacheKey = getCacheKey();
    let isMounted = true;
    
    // Langkah 1: Coba muat dari cache untuk tampilan instan
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        if (isMounted) {
            setCategories(JSON.parse(cachedData));
            setLoading(false); // Tampilkan data cache, UI tidak perlu menunggu fetch
        }
      }
    } catch (e) {
      console.error("Gagal memuat cache:", e);
      if (isMounted) setLoading(true); // Jika cache gagal, kembali ke state loading awal
    }

    // Langkah 2: Lakukan fetch data terbaru dari Supabase di background
    refreshCategories();

    return () => {
        isMounted = false;
    }

  }, [userId, refreshCategories, getCacheKey, translations]);

  return { categories, setCategories, loading, error, refreshCategories };
};
