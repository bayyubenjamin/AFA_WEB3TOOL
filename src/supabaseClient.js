// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '🚨 [Supabase] CRITICAL ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.'
  );
  // Jangan panggil createClient dengan undefined, ini akan menyebabkan crash runtime
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'afa-web3tool-auth',
      },
      global: {
        headers: { 'x-application-name': 'afa-web3tool' },
      },
      db: {
        schema: 'public',
      }
    });
  } catch (err) {
    console.error("🚨 [Supabase] Client creation failed:", err);
  }
}

// Export instance (bisa null jika config salah)
export const supabase = supabaseInstance;
