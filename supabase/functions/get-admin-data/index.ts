// File: supabase/functions/get-admin-data/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Tangani preflight request untuk CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Ambil data rates dan transactions secara paralel
    const ratesPromise = supabaseAdmin.from('crypto_rates').select('*').order('token_symbol');
    const txPromise = supabaseAdmin.from('warung_transactions').select('*').order('created_at', { ascending: false });

    const [ratesRes, txRes] = await Promise.all([ratesPromise, txPromise]);

    if (ratesRes.error) throw ratesRes.error;
    if (txRes.error) throw txRes.error;

    const responseData = {
      rates: ratesRes.data,
      transactions: txRes.data,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
