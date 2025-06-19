// supabase/functions/request-telegram-login/index.ts (Perbaikan Tombol)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fungsi untuk membuat hash dari token
async function hashToken(token: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { telegram_id } = await req.json();
    if (!telegram_id) {
      throw new Error("Parameter 'telegram_id' diperlukan.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buat token unik dan waktu kedaluwarsa (misal: 5 menit)
    const token = crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 2. Simpan hash token ke database
    const { error: insertError } = await supabaseAdmin
      .from('telegram_login_requests')
      .insert({
        telegram_id: telegram_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (insertError) throw insertError;

    // 3. Buat URL Login untuk tombol di bot
    const APP_URL = Deno.env.get('VITE_SITE_URL') || 'https://afatestweb.vercel.app';
    const loginUrl = `${APP_URL}/auth/telegram/callback?token=${token}`;
    
    // 4. Kirim pesan ke pengguna melalui bot
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegram_id,
        text: `🔥 Klik tombol di bawah ini untuk masuk ke AFA Web3Tool.\n\nURL ini akan kedaluwarsa dalam 5 menit.`,
        // --- [PERUBAHAN UTAMA DI SINI] ---
        // Kita ganti 'login_url' menjadi 'web_app'
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Buka Aplikasi & Login', // Teks tombol bisa diubah
                web_app: { 
                  url: loginUrl 
                }
              },
            ],
          ],
        },
        // --- Akhir Perubahan Utama ---
      }),
    });
    
    const result = await response.json();
    if (!result.ok) {
        throw new Error(`Telegram API Error: ${result.description}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Silakan cek bot Telegram Anda.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
