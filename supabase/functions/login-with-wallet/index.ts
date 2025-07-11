import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyMessage } from "https://esm.sh/@ambire/signature-validator";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";
import { ethers } from "https://esm.sh/ethers@6.7.0";

// --- CORS Headers dan Daftar RPC tidak berubah ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const rpcUrls = {
  '0x1': 'https://rpc.ankr.com/eth', '0x89': 'https://polygon-rpc.com/',
  '0x38': 'https://bsc-dataseed.binance.org/', '0xa4b1': 'https://arb1.arbitrum.io/rpc',
  '0xa': 'https://mainnet.optimism.io', '0x2105': 'https://mainnet.base.org',
  '0xaa36a7': 'https://rpc.sepolia.org', '0x14a34': 'https://sepolia.base.org',
  '0xaa37dc': 'https://sepolia.optimism.io',
};
// ---------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // --- Verifikasi tanda tangan (tidak berubah) ---
    const { address, signature, chainId } = await req.json();
    if (!address || !signature || !chainId) throw new Error("Request body must contain address, signature, and chainId.");

    const rpcUrl = rpcUrls[chainId];
    if (!rpcUrl) throw new Error(`Unsupported network: Chain ID ${chainId}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const originalMessage = `Logging in with wallet: ${address}`;
    const isValid = await verifyMessage({ signer: address, message: originalMessage, signature, provider });
    if (!isValid) return new Response(JSON.stringify({ error: "Invalid signature." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    // ---------------------------------------------------

    // --- ✅ LOGIKA BARU: CARI ATAU BUAT USER & BUAT JWT YANG BENAR ---
    
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let userId: string;

    // 1. CARI PENGGUNA DI TABEL `profiles` BERDASARKAN ALAMAT WALLET (LEBIH EFISIEN)
    const { data: existingProfile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('web3_address', address) // `ilike` untuk case-insensitive
      .single();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (existingProfile) {
      // Jika profil ditemukan, gunakan ID yang ada
      userId = existingProfile.id;
    } else {
      // Jika tidak ditemukan, buat pengguna baru di `auth.users`
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${address.toLowerCase()}@wallet.afa-tool.com`,
        user_metadata: { web3_address: address, name: `User ${address.slice(0, 6)}` },
        email_confirm: true,
      });
      if (createUserError) throw createUserError;
      userId = newUser.user.id;
      
      // Tautkan alamat wallet ke profil yang baru dibuat secara otomatis (jika ada trigger, ini opsional)
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ web3_address: address })
        .eq('id', userId);

      if (updateProfileError) console.error("Gagal menautkan web3_address ke profil baru:", updateProfileError.message);
    }

    // --- Pembuatan JWT (tidak berubah) ---
    const jwtSecret = Deno.env.get("APP_JWT_SECRET");
    if (!jwtSecret) throw new Error("APP_JWT_SECRET is not set in Edge Function secrets.");
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(jwtSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    const accessToken = await create({ alg: "HS256", type: "JWT" }, {
      sub: userId, role: "authenticated", aud: "authenticated",
      exp: getNumericDate(60 * 60), // Token berlaku 1 jam
      user_metadata: { web3_address: address },
    }, key);
    // ---------------------------------------------------

    return new Response(JSON.stringify({
      access_token: accessToken, refresh_token: accessToken,
      user_id: userId, address: address,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error in login-with-wallet function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
