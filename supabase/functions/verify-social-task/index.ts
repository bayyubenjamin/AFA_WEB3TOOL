// supabase/functions/verify-social-task/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// Impor SDK vlayer (asumsi ada versi Deno/server-side)
// Jika tidak ada, logika ini perlu disesuaikan berdasarkan dokumentasi vlayer
import { Vlayer } from 'npm:@vlayer/sdk'; // Contoh impor dari npm

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Inisialisasi vlayer dengan API Key Anda dari environment variables
const vlayer = new Vlayer({
    apiKey: Deno.env.get('VLAYER_API_KEY')!,
});

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
    if (!user) throw new Error("User not found.")

    const { taskType, targetUrl } = await req.json()

    // Ambil kredensial pengguna (misal: dari tabel 'profiles')
    // Ini diperlukan agar API call ke pihak ketiga bisa dilakukan atas nama pengguna.
    // Contoh: Ambil access token Twitter/Telegram dari profil pengguna.
    // const { data: profile } = await supabaseClient.from('profiles').select('twitter_access_token').eq('id', user.id).single();
    // if (!profile || !profile.twitter_access_token) {
    //   throw new Error("User's social media account is not linked.");
    // }

    let isTaskCompleted = false;

    // Logika untuk memverifikasi tugas berdasarkan tipenya
    if (taskType === 'twitter') {
        // CONTOH: Panggil API Twitter untuk verifikasi
        // const twitterApiUrl = `https://api.twitter.com/2/users/${user.twitter_id}/following`;
        // const response = await fetch(twitterApiUrl, { headers: { 'Authorization': `Bearer ${profile.twitter_access_token}`}});
        // const data = await response.json();
        // isTaskCompleted = data.data.some(followedUser => followedUser.username.toLowerCase() === 'bayybayss');
        // Saat ini kita asumsikan saja tugasnya berhasil untuk demonstrasi.
        isTaskCompleted = true;
    } else if (taskType === 'telegram') {
        // Logika verifikasi Telegram
        isTaskCompleted = true; // Placeholder
    }

    if (!isTaskCompleted) {
        throw new Error("Task not completed yet.");
    }
    
    // Jika tugas selesai, buat bukti (proof) menggunakan vlayer
    // Strukturnya akan sangat bergantung pada cara kerja vlayer SDK
    // Berikut adalah contoh konseptual
    const proofResult = await vlayer.prove({
        // Jenis bukti, misalnya 'https-request'
        type: 'https-request', 
        // Request yang ingin dibuktikan (misalnya, pemanggilan API Twitter)
        request: {
            method: 'GET',
            url: 'https://api.twitter.com/2/users/me/following', // URL API yang dipanggil
            // Headers dan body yang relevan
        },
        // Data response yang ingin dibuktikan ada di dalamnya
        responseMatch: {
            // Contoh: buktikan bahwa response body mengandung username 'bayybayss'
            body: { includes: 'bayybayss' }
        }
    });

    return new Response(JSON.stringify(proofResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
