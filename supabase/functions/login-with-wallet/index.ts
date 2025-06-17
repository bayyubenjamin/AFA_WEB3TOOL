// supabase/functions/login-with-wallet/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { ethers } from 'https://esm.sh/ethers@6.13.1'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.9.1/mod.ts'

const SIGN_MESSAGE = "Selamat datang di AFA Web3Tool! Tanda tangani pesan ini untuk membuktikan kepemilikan wallet dan melanjutkan."
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address, signature } = await req.json()
    if (!address || !signature) throw new Error("Alamat wallet dan signature diperlukan.")

    const recoveredAddress = ethers.verifyMessage(SIGN_MESSAGE, signature)
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error("Verifikasi tanda tangan gagal!")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('web3_address', address.toLowerCase())
      .single()

    let userId = profile?.id
    let user;

    if (!userId) {
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${address.toLowerCase()}@wallet.afa-web3.com`,
        email_confirm: true,
      })
      if (createUserError) throw createUserError
      
      user = newUser.user
      userId = user.id
      const username = `user_${address.substring(2, 8)}`

      const { error: newProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          web3_address: address.toLowerCase(),
          username, name: username,
          email: user.email,
          avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=${username.substring(0,2).toUpperCase()}`
        })
      if (newProfileError) throw newProfileError
    } else {
      const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (getUserError) throw getUserError
      user = existingUser.user
    }
    
    // PERUBAHAN DI SINI: Menggunakan nama secret yang baru
    const supabaseJwtSecret = Deno.env.get('AFA_JWT_SECRET');
    if (!supabaseJwtSecret) throw new Error("AFA_JWT_SECRET belum di-set di Edge Function secrets.")

    const expiration = getNumericDate(new Date().getTime() + 60 * 60 * 1000);

    const accessToken = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: userId,
        aud: "authenticated",
        role: "authenticated",
        exp: expiration
      },
      supabaseJwtSecret
    );

    const session = {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: expiration,
        user: user,
    }

    return new Response(JSON.stringify(session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
