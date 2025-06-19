// supabase/functions/verify-telegram-login/index.ts (Versi Final Diperbaiki)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// --- [TAMBAHAN] Impor untuk membuat JWT ---
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.9.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { token } = await req.json();
    if (!token) throw new Error("Token diperlukan.");

    const tokenHash = await hashToken(token);
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: request, error: requestError } = await supabaseAdmin
      .from('telegram_login_requests')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (requestError || !request) throw new Error("Token tidak valid atau tidak ditemukan.");
    
    await supabaseAdmin.from('telegram_login_requests').delete().eq('id', request.id);

    if (new Date(request.expires_at) < new Date()) {
      throw new Error("Token sudah kedaluwarsa. Silakan coba lagi.");
    }
    
    const telegramId = request.telegram_id;

    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('telegram_user_id', telegramId)
      .single();

    let userId: string;
    let authUser;

    if (profile) {
      // Pengguna sudah ada, ambil data auth-nya
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (error) throw error;
      authUser = data.user;
      userId = authUser.id;
    } else {
      // Pengguna belum ada, buat pengguna baru
      const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const tgUserRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${telegramId}`);
      const tgUserData = await tgUserRes.json();
      
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${telegramId}@telegram.user`,
        email_confirm: true,
      });
      if (createUserError) throw createUserError;
      
      authUser = newUser.user;
      userId = authUser.id;
      
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        telegram_user_id: telegramId,
        name: `${tgUserData.result.first_name} ${tgUserData.result.last_name || ''}`.trim(),
        username: tgUserData.result.username || `user${telegramId}`,
        avatar_url: `https://ui-avatars.com/api/?name=${tgUserData.result.first_name}&background=7f5af0&color=fff`,
        email: authUser.email,
      });
    }

    // --- [PERUBAHAN UTAMA] Membuat JWT secara manual ---
    const jwtSecret = Deno.env.get('AFA_JWT_SECRET');
    if (!jwtSecret) throw new Error("Secret AFA_JWT_SECRET belum di-set.");

    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign", "verify"]
    );
    
    const expiration = getNumericDate(new Date().getTime() + 60 * 60 * 1000); // Sesi berlaku 1 jam

    const accessToken = await create(
      { alg: "HS256", typ: "JWT" },
      { sub: userId, aud: "authenticated", role: "authenticated", exp: expiration },
      key
    );
    // --- Akhir Perubahan Utama ---

    // Buat objek sesi yang akan dikirim ke frontend
    const session = {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: expiration,
        user: authUser, // Kirim juga data pengguna
        refresh_token: 'dummy-refresh-token' // Supabase-js butuh ini, bisa diisi dummy
    }

    // Kembalikan sesi yang sudah jadi
    return new Response(JSON.stringify(session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
