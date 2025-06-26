// supabase/functions/generate-mint-signature/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { ethers } from 'https://esm.sh/ethers@6.13.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Otentikasi pengguna
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Akses ditolak: Pengguna tidak login.")

    // 2. Dapatkan alamat wallet dari body request
    const { userAddress } = await req.json()
    if (!userAddress) throw new Error("Alamat wallet diperlukan.")

    // Ambil data profil untuk validasi dan nonce
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('web3_address, nonce')
      .eq('id', user.id)
      .single()

    if (profileError || profile === null) throw new Error("Profil tidak ditemukan.")
    if (userAddress.toLowerCase() !== profile.web3_address?.toLowerCase()) {
      throw new Error("Alamat wallet tidak cocok dengan profil.")
    }

    const userNonce = profile.nonce || 0

    // 3. Buat hash yang akan ditandatangani
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "address", "uint256"],
      ["AFA_MINT:", ethers.getAddress(userAddress), userNonce]
    )

    // 4. Dapatkan private key verifikator
    const verifierPrivateKey = Deno.env.get('AFA_VERIFIER_PRIVATE_KEY')
    if (!verifierPrivateKey) throw new Error("Kunci verifikator belum di-set.")

    const verifierWallet = new ethers.Wallet(verifierPrivateKey)

    // 5. Tandatangani HASH-nya, bukan pesannya. Ini menghasilkan signature 65-byte (r, s, v)
    const signature = await verifierWallet.sign(ethers.getBytes(messageHash))

    // 6. Kembalikan signature ke frontend
    return new Response(JSON.stringify({ signature }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    // Tambahkan logging error agar mudah dicari di Supabase dashboard/logs
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
