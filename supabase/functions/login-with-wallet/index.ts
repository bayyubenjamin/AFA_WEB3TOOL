// supabase/functions/login-with-wallet/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { ethers } from 'https://esm.sh/ethers@6.13.1'

// Pesan ini HARUS SAMA PERSIS dengan yang ada di frontend Anda
const SIGN_MESSAGE = "Selamat datang di AFA Web3Tool! Tanda tangani pesan ini untuk membuktikan kepemilikan wallet dan melanjutkan."

// Header CORS untuk memperbolehkan request dari browser
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

    if (!userId) {
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${address.toLowerCase()}@wallet.afa-web3.com`,
        email_confirm: true,
      })

      if (createUserError) throw createUserError
      userId = newUser.user.id
      const username = `user_${address.substring(2, 8)}`

      const { error: newProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          web3_address: address.toLowerCase(),
          username: username,
          name: username,
          email: `${address.toLowerCase()}@wallet.afa-web3.com`,
          avatar_url: `https://placehold.co/100x100/7f5af0/FFFFFF?text=${username.substring(0,2).toUpperCase()}`
        })

      if (newProfileError) throw newProfileError
    }
    
    // @ts-ignore: Method ini ada tapi tidak didefinisikan di tipe publik
    const { data, error: sessionError } = await supabaseAdmin.auth.signInWithId(userId);

    if (sessionError) throw sessionError
    if (!data.session) throw new Error("Gagal membuat sesi setelah verifikasi.")

    return new Response(JSON.stringify(data.session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
