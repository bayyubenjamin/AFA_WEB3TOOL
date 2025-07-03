import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { ethers } from 'https://esm.sh/ethers@6.13.1'

// Header CORS tidak berubah
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handler untuk preflight request tidak berubah
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Otentikasi pengguna tidak berubah
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Akses ditolak: Pengguna tidak login.")

    // --- PERUBAHAN 1: Ambil `chainId` dari body request ---
    const { userAddress, chainId } = await req.json()
    if (!userAddress) throw new Error("Alamat wallet diperlukan.")
    if (!chainId) throw new Error("ID Jaringan (chainId) diperlukan.")

    // Logika validasi profil tidak berubah
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

    // Logika pembuatan message hash tidak berubah
    const messageHash = ethers.solidityPackedKeccak256(
      ["string", "address", "uint256"],
      ["AFA_MINT:", ethers.getAddress(userAddress), userNonce]
    )

    // --- PERUBAHAN 2: Pilih Private Key berdasarkan chainId ---
    // Pastikan Anda sudah mengatur kedua environment variable ini di Supabase
    const verifierKeys = {
      '11155420': Deno.env.get('OP_SEPOLIA_VERIFIER_PK'),  // Kunci untuk Optimism Sepolia
      '84532': Deno.env.get('BASE_SEPOLIA_VERIFIER_PK'),   // Kunci untuk Base Sepolia
    };

    const verifierPrivateKey = verifierKeys[chainId];

    if (!verifierPrivateKey) {
      throw new Error(`Jaringan (chainId: ${chainId}) tidak didukung.`);
    }
    
    // Gunakan private key yang sudah dipilih
    const verifierWallet = new ethers.Wallet(verifierPrivateKey)

    // Logika penandatanganan tidak berubah
    const sigObj = verifierWallet.signingKey.sign(messageHash);
    const signature = ethers.Signature.from(sigObj).serialized;

    // Respon tidak berubah
    return new Response(JSON.stringify({ signature }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    // Penanganan error tidak berubah
    const msg = error?.message || error?.toString() || "Unknown error";
    console.log("=== EDGE FUNCTION ERROR ===");
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
