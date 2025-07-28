// supabase/functions/get-gas-fee/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Ganti dengan API Key Etherscan Anda
const ETHERSCAN_API_KEY = Deno.env.get('ETHERSCAN_API_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bagian ini ditambah karena:
// - Menyediakan endpoint untuk mendapatkan estimasi biaya gas secara real-time.
// - Menggunakan API eksternal (Etherscan) untuk data yang akurat.
serve(async (req) => {
  const { network } = await req.json();
  
  // Mapping jaringan ke endpoint API Etherscan
  const apiUrls = {
    'mainnet': `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`,
    'bsc': `https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=${Deno.env.get('BSCSCAN_API_KEY')}`,
    // Tambahkan jaringan lain di sini
  };

  const url = apiUrls[network];
  if (!url) {
    return new Response(JSON.stringify({ error: 'Jaringan tidak didukung' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const gasResponse = await fetch(url);
    if (!gasResponse.ok) throw new Error('Gagal mengambil data gas');
    const gasData = await gasResponse.json();

    return new Response(JSON.stringify(gasData.result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
