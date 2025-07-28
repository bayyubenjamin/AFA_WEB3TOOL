// src/services/api.js

import { supabase } from '../supabaseClient';

// Bagian ini ditambah karena:
// - Mengisolasi logika panggilan API dari komponen, membuatnya lebih bersih.
// - Memudahkan pengelolaan endpoint dan kunci API di satu tempat.

/**
 * Mengambil estimasi biaya gas dari Supabase Edge Function.
 * @param {string} network - Nama jaringan (cth: 'mainnet', 'bsc').
 * @returns {Promise<object>} - Data estimasi gas.
 */
export const getGasFee = async (network) => {
  const { data, error } = await supabase.functions.invoke('get-gas-fee', {
    body: { network },
  });
  if (error) throw error;
  return data;
};

/**
 * Mengambil harga tukar mata uang (cth: USD ke IDR).
 * @returns {Promise<number>} - Nilai tukar.
 */
export const getUsdToIdrRate = async () => {
  // Untuk saat ini, kita hardcode. Di produksi, gunakan API kurs mata uang.
  return 16300;
};
