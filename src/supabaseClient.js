// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- BAGIAN UNTUK DEBUGGING ---
// Kode ini akan mencetak URL dan Kunci Anda ke console browser
// untuk memastikan file .env sudah terbaca.
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '*** Loaded ***' : '!!! NOT LOADED !!!');
// --- AKHIR BAGIAN DEBUGGING ---

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
