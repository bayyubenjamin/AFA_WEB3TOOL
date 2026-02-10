import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { verifyMessage } from "https://esm.sh/@ambire/signature-validator@1.0.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";
import { ethers } from "https://esm.sh/ethers@6.11.1?target=deno";

// PERBAIKAN DI SINI: Tambahkan 'x-application-name' ke headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const rpcUrls = {
  '0x1': 'https://rpc.ankr.com/eth', 
  '0x89': 'https://polygon-rpc.com/',
  '0x38': 'https://bsc-dataseed.binance.org/', 
  '0xa4b1': 'https://arb1.arbitrum.io/rpc',
  '0xa': 'https://mainnet.optimism.io', 
  '0x2105': 'https://mainnet.base.org',
  '0xaa36a7': 'https://rpc.sepolia.org', 
  '0x14a34': 'https://sepolia.base.org',
  '0xaa37dc': 'https://sepolia.optimism.io',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { address, signature, chainId } = body;

    if (!address || !signature || !chainId) {
      throw new Error("Request body must contain address, signature, and chainId.");
    }

    const rpcUrl = rpcUrls[chainId];
    if (!rpcUrl) {
      throw new Error(`Unsupported network: Chain ID ${chainId}. Pastikan Anda terhubung ke jaringan yang didukung.`);
    }

    // Gunakan provider Ethers v6
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const originalMessage = `Selamat datang di AFA Web3Tool! Tanda tangani pesan ini untuk membuktikan kepemilikan wallet dan melanjutkan.`; 
    // Pastikan pesan ini SAMA PERSIS dengan di frontend (PageLogin.jsx)

    // Validasi Signature
    const isValid = await verifyMessage({ 
      signer: address, 
      message: originalMessage, 
      signature, 
      provider 
    });

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature. Tanda tangan tidak cocok." }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // --- SETUP SUPABASE ADMIN ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration (URL or Service Role Key).");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    let userId: string;

    // 1. Cari User berdasarkan wallet address di table profiles
    const { data: existingProfile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('web3_address', address)
      .single();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // 2. Jika user baru, buat akun Auth
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: `${address.toLowerCase()}@wallet.afa-tool.com`,
        password: crypto.randomUUID(), // Password random dummy
        user_metadata: { web3_address: address, name: `User ${address.slice(0, 6)}` },
        email_confirm: true,
      });

      if (createUserError) throw createUserError;
      userId = newUser.user.id;

      // Update profile dengan address
      await supabaseAdmin
        .from('profiles')
        .update({ web3_address: address })
        .eq('id', userId);
    }

    // --- BUAT JWT CUSTOM ---
    const jwtSecret = Deno.env.get("APP_JWT_SECRET");
    if (!jwtSecret) throw new Error("APP_JWT_SECRET is not set in Edge Function secrets.");

    const key = await crypto.subtle.importKey(
      "raw", 
      new TextEncoder().encode(jwtSecret), 
      { name: "HMAC", hash: "SHA-256" }, 
      false, 
      ["sign", "verify"]
    );

    const accessToken = await create({ alg: "HS256", type: "JWT" }, {
      sub: userId, 
      role: "authenticated", 
      aud: "authenticated",
      exp: getNumericDate(60 * 60 * 24), // Token berlaku 24 jam
      user_metadata: { web3_address: address },
    }, key);

    return new Response(JSON.stringify({
      access_token: accessToken, 
      refresh_token: accessToken, // Sederhananya pakai token yang sama, idealnya generate refresh token terpisah
      user_id: userId, 
      address: address,
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Error in login-with-wallet function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
