// supabase/functions/telegram-auth/index.ts (VERSI FINAL DENGAN PARSING MANUAL)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData) throw new Error('initData tidak ditemukan');

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) throw new Error("Hash tidak ada di dalam initData");

    // --- [PERBAIKAN UTAMA] Cara paling andal untuk membuat data_check_string ---
    // Memecah string mentah, memfilter hash, mengurutkan, lalu menggabungkan.
    const dataCheckArr = initData
      .split('&')
      .map(pair => decodeURIComponent(pair))
      .filter(pair => !pair.startsWith('hash=')) // Filter hash secara eksplisit
      .sort();
    
    const dataCheckString = dataCheckArr.join('\n');
    // --- AKHIR DARI PERBAIKAN ---

    const secretKey = await crypto.subtle.importKey('raw', new TextEncoder().encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const hmac = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(dataCheckString));
    const hex = new Uint8Array(hmac).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

    if (hex !== hash) {
      console.error(`Validasi Hash Gagal. Server: ${hex} | Client: ${hash}`);
      console.error(`Data Check String yang digunakan server: \n${dataCheckString}`);
      throw new Error('Verifikasi data gagal! Hash tidak cocok.');
    }

    // Jika hash cocok, lanjutkan ke logika login
    const user = JSON.parse(params.get('user') || '{}');
    if (!user.id) throw new Error("Data user tidak valid di dalam initData.");
    
    const telegramUserId = user.id;
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    let { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('telegram_user_id', telegramUserId).single();

    if (!profile) {
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({ email: `${telegramUserId}@telegram.user`, email_confirm: true });
      if (authError) throw authError;
      
      const { data: newProfile, error: newProfileError } = await supabaseAdmin.from('profiles').insert({
          id: newUser.user.id,
          telegram_user_id: telegramUserId,
          username: user.username || `user_${telegramUserId}`,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || `User ${telegramUserId}`,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'T')}&background=1a1a2e&color=fff`,
          email: newUser.user.email
        }).select().single();
        
      if (newProfileError) throw newProfileError;
      profile = newProfile;
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    });

    if (sessionError) throw sessionError;

    // Kembalikan token ke client
    return new Response(JSON.stringify({
      access_token: sessionData.properties.access_token,
      refresh_token: sessionData.properties.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[ERROR FINAL DI FUNGSI] ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
