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

    const { userAddress, chainId } = await req.json()
    if (!userAddress) throw new Error("Alamat wallet diperlukan.")
    if (!chainId) throw new Error("ID Jaringan (chainId) diperlukan.")

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

    // --- UPDATE: Menambahkan Base Mainnet (8453) ---
    const verifierKeys: Record<string, string | undefined> = {
      '11155420': Deno.env.get('OP_SEPOLIA_VERIFIER_PK'),
      '84532': Deno.env.get('BASE_SEPOLIA_VERIFIER_PK'),
      '8453': Deno.env.get('BASE_MAINNET_VERIFIER_PK'), // <--- INI YANG PENTING
    };

    const verifierPrivateKey = verifierKeys[chainId.toString()];

    if (!verifierPrivateKey) {
      throw new Error(`Jaringan (chainId: ${chainId}) tidak didukung atau Private Key belum dikonfigurasi.`);
    }
    
    const verifierWallet = new ethers.Wallet(verifierPrivateKey)

    const sigObj = verifierWallet.signingKey.sign(messageHash);
    const signature = ethers.Signature.from(sigObj).serialized;

    return new Response(JSON.stringify({ signature }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    const msg = error?.message || error?.toString() || "Unknown error";
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
