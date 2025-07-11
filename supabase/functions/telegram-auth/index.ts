import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// (Fungsi validate tidak perlu diubah, tetap sama)
async function validate(initData: string, botToken: string) {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) throw new Error('Validasi gagal: Hash tidak ditemukan.');
  urlParams.delete('hash');
  const dataToCheck: string[] = [];
  urlParams.sort();
  urlParams.forEach((value, key) => dataToCheck.push(`${key}=${value}`));
  const dataCheckString = dataToCheck.join('\n');
  const secretKey = await crypto.subtle.importKey('raw', new TextEncoder().encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(botToken));
  const finalKey = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', finalKey, new TextEncoder().encode(dataCheckString));
  const hexSignature = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hexSignature !== hash) throw new Error('Validasi gagal: Hash tidak cocok.');
  return JSON.parse(urlParams.get('user') || '{}');
}

// Logika utama Edge Function dengan penanganan error duplikat
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const initData = body.initData;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!initData || !botToken) throw new Error('initData atau TELEGRAM_BOT_TOKEN tidak ada.');

    const telegramUser = await validate(initData, botToken);
    if (!telegramUser || !telegramUser.id) throw new Error('Data pengguna Telegram tidak valid.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let userId: string;

    // Cek dulu apakah ada profil dengan telegram_id ini
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (profile) {
      userId = profile.id;
    } else {
      // Jika profil tidak ada, coba buat user baru
      const potentialEmail = `${telegramUser.username || telegramUser.id}@telegram.user`;
      try {
        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: potentialEmail,
          email_confirm: true,
          user_metadata: { name: telegramUser.first_name, username: telegramUser.username, avatar_url: telegramUser.photo_url },
        });

        if (signUpError) throw signUpError;
        userId = newUser.user.id;
        
        // Buat profil baru untuk user yang baru dibuat
        await supabaseAdmin.from('profiles').insert({
            id: userId,
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            avatar_url: telegramUser.photo_url,
        });

      } catch (error) {
        // --- INI BAGIAN PENTINGNYA ---
        // Jika errornya adalah "User already registered"
        if (error.message.includes('User already registered')) {
          // Cari user yang sudah ada itu berdasarkan emailnya
          const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(potentialEmail);
          if (getUserError) throw new Error(`Gagal mengambil user yang sudah ada: ${getUserError.message}`);
          
          userId = existingUser.user.id;
          
          // Pastikan profilnya juga ada dan terhubung
          await supabaseAdmin.from('profiles').upsert({
            id: userId,
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            avatar_url: telegramUser.photo_url,
          }, { onConflict: 'id' });

        } else {
          // Jika errornya bukan duplikat, lempar error aslinya
          throw error;
        }
      }
    }

    // Buat sesi untuk user ID yang sudah kita dapatkan
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: (await supabaseAdmin.auth.admin.getUserById(userId)).data.user!.email!,
    });
    
    if (error) throw error;

    return new Response(
      JSON.stringify({ access_token: data.properties.access_token, refresh_token: data.properties.refresh_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

