// supabase/functions/login-with-telegram/index.ts (Pastikan sudah seperti ini)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ... (fungsi verifyTelegramAuth tetap sama) ...
async function verifyTelegramAuth(botToken: string, authData: Record<string, any>): Promise<boolean> {
  const encoder = new TextEncoder();
  const checkString = Object.keys(authData)
    .filter((key) => key !== 'hash')
    .map((key) => `${key}=${authData[key]}`)
    .sort()
    .join('\n');

  const secretKey = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', encoder.encode(botToken)),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign']
  );

  const hmac = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(checkString));
  const hmacHex = Array.from(new Uint8Array(hmac)).map(b => b.toString(16).padStart(2, '0')).join('');

  return hmacHex === authData.hash;
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const telegramUser = await req.json();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) throw new Error('Telegram Bot Token is not configured.');
    if (!telegramUser || !telegramUser.hash) throw new Error('Telegram user data is invalid.');

    const isVerified = await verifyTelegramAuth(botToken, telegramUser);
    if (!isVerified) {
      throw new Error('Telegram data verification failed. Invalid hash.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('telegram_user_id', telegramUser.id)
      .single();

    let userId = profile?.id;
    let authUserResponse;

    if (userId) {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (error) throw error;
      authUserResponse = data;

      await supabaseAdmin
        .from('profiles')
        .update({ telegram_avatar_url: telegramUser.photo_url || null })
        .eq('id', userId)

    } else {
      const { data, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${telegramUser.id}@telegram.user`,
        email_confirm: true,
      });

      if (createUserError) throw createUserError;
      
      authUserResponse = data;
      userId = authUserResponse.user.id;

      const { error: newProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          telegram_user_id: telegramUser.id,
          name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          username: telegramUser.username || `user${telegramUser.id}`,
          avatar_url: telegramUser.photo_url || `https://ui-avatars.com/api/?name=${telegramUser.first_name}&background=7f5af0&color=fff`,
          telegram_avatar_url: telegramUser.photo_url || null, // INI YANG PENTING
          email: authUserResponse.user.email,
        });

      if (newProfileError) throw newProfileError;
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: authUserResponse.user.email!,
    });
    
    if(sessionError) throw sessionError;

    return new Response(JSON.stringify(sessionData), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in login-with-telegram function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
});
