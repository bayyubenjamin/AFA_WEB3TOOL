import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    // ✅ Pembuatan data_check_string sesuai Telegram docs
    const entries = [...params.entries()]
      .filter(([key]) => key !== 'hash')
      .sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(BOT_TOKEN!),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(dataCheckString)
    );
    const serverHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (serverHash !== hash) {
      console.error(`❌ [Hash Tidak Cocok]
Client hash: ${hash}
📥 DataCheckString: ${dataCheckString}
Server hash: ${serverHash}`);
      throw new Error("Verifikasi data gagal. Hash tidak cocok.");
    }

    const userRaw = params.get('user');
    if (!userRaw) throw new Error("User data tidak ditemukan di initData");
    const user = JSON.parse(userRaw);

    const telegramUserId = user.id;
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .single();

    if (!profile) {
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${telegramUserId}@telegram.user`,
        email_confirm: true,
      });
      if (authError) throw authError;

      const { data: newProfile, error: newProfileError } = await supabaseAdmin.from('profiles').insert({
        id: newUser.user.id,
        telegram_user_id: telegramUserId,
        username: user.username || `user_${telegramUserId}`,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || `User ${telegramUserId}`,
        avatar_url: user.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || 'U')}&background=1a1a2e&color=fff`,
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

    return new Response(JSON.stringify({
      access_token: sessionData.properties.access_token,
      refresh_token: sessionData.properties.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`❗ [ERROR Telegram Auth Function] ${error}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

