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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Akses ditolak: Pengguna tidak login.")

    const { userAddress } = await req.json()
    if (!userAddress) throw new Error("Alamat wallet diperlukan.")

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

    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "address", "uint256"],
      ["AFA_MINT:", ethers.getAddress(userAddress), userNonce]
    )

    const verifierPrivateKey = Deno.env.get('AFA_VERIFIER_PRIVATE_KEY')
    if (!verifierPrivateKey) throw new Error("Kunci verifikator belum di-set.")

    const verifierWallet = new ethers.Wallet(verifierPrivateKey)

    const signature = await verifierWallet.signMessage(ethers.getBytes(messageHash))

    return new Response(JSON.stringify({ signature }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    const msg = error?.message || error?.toString() || "Unknown error";
    console.log("=== EDGE FUNCTION ERROR ===");
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
