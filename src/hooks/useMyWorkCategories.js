// src/hooks/useMyWorkCategories.js

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook kustom untuk mengambil dan menyimpan kategori pekerjaan pengguna dari Supabase
 * dengan caching di localStorage.
 *
 * @param {object} currentUser - Objek pengguna yang sedang login, harus memiliki properti `id`.
 * @returns {object} - Mengembalikan { categories, loading, error, refreshCategories }.
 */
export const useMyWorkCategories = (currentUser) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = currentUser?.id;

  // Kunci unik untuk localStorage berdasarkan ID pengguna
  const getCacheKey = useCallback(() => {
    return userId ? `mywork-categories-${userId}` : null;
  }, [userId]);

  // Fungsi untuk mengambil data terbaru dari Supabase
  const refreshCategories = useCallback(async () => {
    if (!userId) {
      setError("Pengguna tidak ditemukan.");
      setLoading(false);
      return;
    }

    // Tetap set loading ke true di awal refresh untuk background fetch
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_categories')
        .select(`
          id,
          name,
          icon,
          iconColor,
          display_order,
          user_airdrops (
            id,
            name,
            link,
            description,
            status,
            category_id,
            daily_done
          )
        `)
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
      
      // Jika berhasil, perbarui state dan localStorage
      setCategories(processedData);
      const cacheKey = getCacheKey();
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(processedData));
      }

    } catch (err) {
      console.error("Error fetching my work data:", err);
      setError("Gagal memuat data pekerjaan. Silakan coba lagi.");
    } finally {
      // Selesaikan loading setelah fetch selesai
      setLoading(false);
    }
  }, [userId, getCacheKey]);

  // Efek untuk memuat data saat komponen pertama kali dimuat
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Anda harus login untuk melihat data garapan.");
      return;
    }

    const cacheKey = getCacheKey();
    
    // 1. Coba muat dari cache terlebih dahulu
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setCategories(JSON.parse(cachedData));
        setLoading(false); // Tampilkan data cache, loading selesai untuk sementara
      }
    } catch (e) {
      console.error("Gagal memuat cache:", e);
      // Jika cache gagal, biarkan loading tetap true sampai fetch selesai
      setLoading(true);
    }

    // 2. Lakukan fetch data terbaru dari Supabase di background
    refreshCategories();

  }, [userId, refreshCategories, getCacheKey]);

  return { categories, loading, error, refreshCategories };
};
