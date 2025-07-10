// supabase/functions/telegram-auth/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  // Tangani preflight request untuk CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData) throw new Error('initData tidak ditemukan');

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash'); // Hapus hash dari parameter untuk validasi

    // Urutkan parameter secara alfabetis
    const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = sortedParams.map(([key, value]) => `${key}=${value}`).join('\n');

    // Buat secret key dari BOT_TOKEN
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Verifikasi hash
    const hmac = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(dataCheckString));
    const hex = new Uint8Array(hmac).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

    if (hex !== hash) {
      throw new Error('Verifikasi data gagal!');
    }
    
    // Jika verifikasi berhasil, parse data user
    const user = JSON.parse(params.get('user'));
    const telegramUserId = user.id;

    // Inisialisasi admin client Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );
    
    // Cari user di tabel 'profiles'
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .single();
      
    let authUserId = profile?.id;

    // Jika profil tidak ditemukan, buat user baru di auth dan profile
    if (!profile) {
      // Buat entri di Supabase Auth
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: `${telegramUserId}@telegram.user`, // Email dummy
        email_confirm: true,
      });

      if (authError) throw authError;
      authUserId = newUser.user.id;
      
      // Buat entri di tabel profiles
      const { data: newProfile, error: newProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUserId,
          telegram_user_id: telegramUserId,
          username: user.username || `user_${telegramUserId}`,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          avatar_url: `https://ui-avatars.com/api/?name=${user.first_name || 'T'}&background=random`
        })
        .select()
        .single();
        
      if (newProfileError) throw newProfileError;
      profile = newProfile;
    }
    
    // Buat session token untuk user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.id + '@telegram.user', // Gunakan email dummy yang konsisten jika user sudah ada
    });

    if (sessionError) throw sessionError;

    const accessToken = sessionData.properties.access_token;
    const refreshToken = sessionData.properties.refresh_token;

    // Kembalikan session ke client
    return new Response(JSON.stringify({
      message: 'Autentikasi berhasil',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: profile,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
