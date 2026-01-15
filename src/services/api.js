// src/services/api.js

import { supabase } from '../supabaseClient';

// Cache sederhana untuk nilai tukar agar tidak membebani API
let exchangeRateCache = {
  rate: null,
  timestamp: 0
};
const CACHE_DURATION = 1000 * 60 * 60; // 1 Jam

/**
 * Mengambil estimasi biaya gas dari Supabase Edge Function.
 * @param {string} network - Nama jaringan (cth: 'mainnet', 'bsc').
 * @returns {Promise<object>} - Data estimasi gas.
 * @throws {Error} Jika request gagal.
 */
export const getGasFee = async (network) => {
  try {
    const { data, error } = await supabase.functions.invoke('get-gas-fee', {
      body: { network },
    });
    
    if (error) throw new Error(error.message || 'Function invocation failed');
    return data;
  } catch (err) {
    console.error(`[API] Error fetching gas fee for ${network}:`, err);
    throw err; // Re-throw agar UI bisa menangani error state
  }
};

/**
 * Mengambil harga tukar mata uang (USD ke IDR).
 * Menggunakan strategi: Cache -> Live API -> Hardcoded Fallback.
 * @returns {Promise<number>} - Nilai tukar IDR.
 */
export const getUsdToIdrRate = async () => {
  const now = Date.now();

  // 1. Cek Cache
  if (exchangeRateCache.rate && (now - exchangeRateCache.timestamp < CACHE_DURATION)) {
    return exchangeRateCache.rate;
  }

  try {
    // 2. Coba Fetch Data Live (Contoh menggunakan open API publik)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const rate = data.rates.IDR;

    // Update Cache
    exchangeRateCache = {
      rate: rate,
      timestamp: now
    };

    return rate;
  } catch (error) {
    console.warn('[API] Gagal mengambil kurs live, menggunakan fallback:', error);
    
    // 3. Fallback Hardcoded (Diupdate)
    // Jika cache ada tapi expired, lebih baik pakai cache lama daripada hardcode
    return exchangeRateCache.rate || 16300; 
  }
};