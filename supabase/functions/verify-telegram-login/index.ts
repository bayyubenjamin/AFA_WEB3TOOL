// supabase/functions/verify-telegram-login/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

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

    // 1. Cari token di database
    const { data: request, error: requestError } = await supabaseAdmin
      .from('telegram_login_requests')
      .select('*')
      .eq('token_hash', tokenHash)
      .single();

    if (requestError || !request) throw new Error("Token tidak valid atau tidak ditemukan.");
    
    // 2. Hapus token agar tidak bisa digunakan lagi
    await supabaseAdmin.from('telegram_login_requests').delete().eq('id', request.id);

    // 3. Cek apakah token sudah kedaluwarsa
    if (new Date(request.expires_at) < new Date()) {
      throw new Error("Token sudah kedaluwarsa. Silakan coba lagi.");
    }
    
    const telegramId = request.telegram_id;

    // 4. Logika untuk mencari atau membuat pengguna (mirip dengan fungsi sebelumnya)
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, username, avatar_url, email')
      .eq('telegram_user_id', telegramId)
      .single();

    let userId: string;
    let userEmail: string;

    if (profile) {
      userId = profile.id;
      userEmail = profile.email;
    } else {
      // Dapatkan data user dari Telegram API untuk membuat profil yang lebih baik
      const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const tgUserRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${telegramId}`);
      const tgUserData = await tgUserRes.json();
      
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${telegramId}@telegram.user`,
        email_confirm: true,
      });
      if (createUserError) throw createUserError;

      userId = newUser.user.id;
      userEmail = newUser.user.email!;
      
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        telegram_user_id: telegramId,
        name: `${tgUserData.result.first_name} ${tgUserData.result.last_name || ''}`.trim(),
        username: tgUserData.result.username || `user${telegramId}`,
        avatar_url: `https://ui-avatars.com/api/?name=${tgUserData.result.first_name}&background=7f5af0&color=fff`,
        email: userEmail,
      });
    }

    // 5. Buat sesi untuk pengguna
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
    });
    
    if (sessionError) throw sessionError;

    return new Response(JSON.stringify(sessionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
