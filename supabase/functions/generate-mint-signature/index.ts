// supabase/functions/generate-mint-signature/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { ethers } from 'https://esm.sh/ethers@6.13.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tipe data untuk payload yang diharapkan
interface MintRequestPayload {
  userAddress: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Dapatkan client Supabase berdasarkan otorisasi pengguna
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Dapatkan data pengguna yang sedang login
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error("Akses ditolak: Pengguna tidak ditemukan atau tidak login.")
    }

    // 3. Dapatkan alamat wallet pengguna dari request body
    const { userAddress }: MintRequestPayload = await req.json()
    if (!userAddress) {
      throw new Error("Alamat wallet pengguna diperlukan.")
    }
    
    // 4. Buat admin client untuk cek profil
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    // 5. Verifikasi Prasyarat di Sisi Server
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('web3_address, telegram_user_id, email')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      throw new Error("Profil tidak ditemukan.");
    }

    // -- Validasi Checklist --
    if (!profile.web3_address || profile.web3_address.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error("Wallet yang terhubung tidak sesuai dengan profil Anda.");
    }
    if (!profile.telegram_user_id) {
      throw new Error("Akun Telegram belum terhubung.");
    }
    if (profile.email.endsWith('@wallet.afa-web3.com') || profile.email.endsWith('@telegram.user')) {
      throw new Error("Akun Anda belum diamankan dengan email dan password utama.");
    }

    // 6. Dapatkan private key verifikator dari Supabase Secrets
    const verifierPrivateKey = Deno.env.get('AFA_VERIFIER_PRIVATE_KEY');
    if (!verifierPrivateKey) {
      throw new Error("Kunci verifikator (AFA_VERIFIER_PRIVATE_KEY) belum di-set di Supabase Secrets.");
    }

    // 7. Buat wallet verifikator menggunakan ethers
    const verifierWallet = new ethers.Wallet(verifierPrivateKey);

    // 8. Buat pesan yang akan ditandatangani
    // Pesan ini harus unik untuk setiap pengguna dan sulit dipalsukan
    const messageToSign = `AFA_MINT:${userAddress.toLowerCase()}:${user.id}`;
    const messageHash = ethers.id(messageToSign); // ethers.id adalah alias untuk ethers.keccak256(ethers.toUtf8Bytes(message))
    
    // 9. Tandatangani hash pesan
    const signature = await verifierWallet.signMessage(ethers.getBytes(messageHash));
    
    // 10. Kembalikan signature ke frontend
    return new Response(JSON.stringify({ signature, messageHash }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
