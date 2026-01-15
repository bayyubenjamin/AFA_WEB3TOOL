// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Ambil URL dan Kunci dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validasi Environment Variables
 * Memastikan aplikasi tidak berjalan dengan konfigurasi kosong yang membingungkan.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Critical Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env file.'
  );
}

/**
 * Supabase Client Configuration
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Memastikan sesi bertahan saat refresh & tab ditutup
    persistSession: true,
    // Otomatis refresh token sebelum expired
    autoRefreshToken: true,
    // Deteksi session dari URL (berguna untuk OAuth/Magic Link)
    detectSessionInUrl: true,
    // Opsi storage key (default: sb-<ref>-auth-token)
    storageKey: 'afa-web3tool-auth',
  },
  global: {
    // Header custom jika diperlukan (misal untuk versi app)
    headers: { 'x-application-name': 'afa-web3tool' },
  },
  // Opsi db jika menggunakan schema selain public (jarang diubah tapi baik didefinisikan)
  db: {
    schema: 'public',
  }
});
