// Di dalam file: src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Ambil URL dan Kunci dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- BAGIAN PENTING UNTUK DEBUGGING ---
// Kode ini akan langsung memberitahu Anda jika ada masalah dengan file .env
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = "Variabel Supabase (URL atau Anon Key) tidak ditemukan. Pastikan file .env.local Anda sudah benar dan server Vite sudah di-restart.";
  // Tampilkan error besar di konsol
  console.error('%c' + errorMessage, 'color: red; font-size: 16px; font-weight: bold;');
  // Tampilkan alert agar langsung terlihat oleh user
  alert(errorMessage);
}
// --- AKHIR BAGIAN DEBUGGING ---

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
