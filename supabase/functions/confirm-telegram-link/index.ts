// supabase/functions/confirm-telegram-link/index.ts (Versi Final dengan Pengambilan Foto Profil)

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getProfileForLinking(supabaseAdmin: SupabaseClient, userId: string) {
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('telegram_verification_code, telegram_code_expires_at')
        .eq('id', userId)
        .single();
    
    if (error) throw new Error("Profil Anda tidak ditemukan atau terjadi kesalahan.");
    if (!profile.telegram_verification_code || !profile.telegram_code_expires_at) {
        throw new Error("Silakan buat kode verifikasi terlebih dahulu di halaman profil.");
    }
    if (new Date(profile.telegram_code_expires_at) < new Date()) {
        throw new Error("Kode verifikasi sudah kedaluwarsa. Silakan buat yang baru.");
    }
    
    return profile;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Akses ditolak. Anda harus login untuk melakukan aksi ini.");

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const profile = await getProfileForLinking(supabaseAdmin, user.id);
    const verificationCode = profile.telegram_verification_code;

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100&offset=-100`;

    const response = await fetch(telegramApiUrl);
    const updates = await response.json();

    if (!updates.ok) throw new Error("Gagal mengambil data dari Telegram Bot.");
    
    let foundTelegramUser = null;

    for (const update of updates.result) {
        if (update.message && update.message.text && update.message.text.includes(verificationCode)) {
            foundTelegramUser = update.message.from;
            break; 
        }
    }
    
    if (!foundTelegramUser) {
        throw new Error("Kode verifikasi tidak ditemukan. Pastikan Anda telah mengirim kode yang benar ke bot @afaweb3tool_bot.");
    }

    // --- [LOGIKA BARU] ---
    // Ambil detail profil dari Telegram untuk mendapatkan foto
    const tgChatRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${foundTelegramUser.id}`);
    if (!tgChatRes.ok) throw new Error("Gagal mengambil data profil dari Telegram.");
    const tgChatData = await tgChatRes.json();

    let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(foundTelegramUser.first_name || 'T')}&background=7f5af0&color=fff`; // Fallback
    if (tgChatData.result.photo) {
        const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${tgChatData.result.photo.small_file_id}`);
        if(fileRes.ok) {
            const fileData = await fileRes.json();
            avatarUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        }
    }
    // --- [AKHIR LOGIKA BARU] ---

    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
            telegram_id: foundTelegramUser.id,
            telegram_handle: foundTelegramUser.username || null,
            avatar_url: avatarUrl, // <-- [PERUBAHAN] Simpan URL foto profil
            telegram_verification_code: null, 
            telegram_code_expires_at: null
        })
        .eq('id', user.id);

    if (updateError) throw updateError;
    
    return new Response(JSON.stringify({ success: true, message: "Akun Telegram berhasil terhubung!" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
