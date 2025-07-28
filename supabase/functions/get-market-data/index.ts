// supabase/functions/get-market-data/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Headers CORS yang benar untuk mengizinkan permintaan dari browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=';

serve(async (req) => {
  // Browser akan mengirim permintaan 'OPTIONS' dulu untuk cek izin CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Gunakan nama variabel standar yang sudah ada di 'secrets list' Anda
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: activeCoins, error: dbError } = await supabaseAdmin
      .from('crypto_rates')
      .select('id, coingecko_id')
      .eq('is_active', true)
      .not('coingecko_id', 'is', null);

    if (dbError) throw dbError;

    if (!activeCoins || activeCoins.length === 0) {
      return new Response(JSON.stringify({ message: "Tidak ada koin dengan coingecko_id untuk diperbarui." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const coinIdsString = activeCoins.map(coin => coin.coingecko_id).join(',');
    const marketResponse = await fetch(COINGECKO_API_BASE_URL + coinIdsString);
    if (!marketResponse.ok) {
      throw new Error(`Gagal mengambil data dari CoinGecko, status: ${marketResponse.status}`);
    }
    
    const marketData = await marketResponse.json();

    let updatedCount = 0;
    for (const coin of activeCoins) {
      const marketPriceUSD = marketData[coin.coingecko_id]?.usd;
      if (marketPriceUSD) {
        const { error: updateError } = await supabaseAdmin
          .from('crypto_rates')
          .update({ market_price_usd: marketPriceUSD }) // Hanya update harga pasar
          .eq('id', coin.id);

        if (updateError) {
          console.error(`Gagal update koin ID ${coin.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, message: `${updatedCount} harga pasar koin berhasil diperbarui.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("--- ERROR UTAMA DI DALAM FUNGSI ---", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
