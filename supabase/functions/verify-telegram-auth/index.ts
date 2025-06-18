// supabase/functions/verify-telegram-auth/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const telegramUserData = await req.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!botToken) {
      throw new Error('Telegram Bot Token is not configured.')
    }
    if (!telegramUserData || !telegramUserData.hash) {
      throw new Error('Telegram user data is missing or invalid.')
    }

    // --- Verifikasi Keamanan Hash dari Telegram ---
    const encoder = new TextEncoder()
    const checkString = Object.keys(telegramUserData)
      .filter((key) => key !== 'hash')
      .map((key) => `${key}=${telegramUserData[key]}`)
      .sort()
      .join('\n')

    const secretKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', encoder.encode(botToken)),
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign']
    )

    const hmac = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(checkString))
    const hmacHex = Array.from(new Uint8Array(hmac)).map(b => b.toString(16).padStart(2, '0')).join('')

    if (hmacHex !== telegramUserData.hash) {
      throw new Error('Telegram data verification failed. Invalid hash.')
    }
    // --- Akhir Verifikasi Keamanan ---

    // Jika verifikasi berhasil, lanjutkan
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("User not found.")

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        telegram_user_id: telegramUserData.id,
        // Anda juga bisa menyimpan data lain jika mau
        // name: `${telegramUserData.first_name} ${telegramUserData.last_name || ''}`.trim(),
        // avatar_url: telegramUserData.photo_url
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: 'Akun Telegram berhasil terhubung!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
