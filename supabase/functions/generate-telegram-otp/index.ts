// supabase/functions/generate-telegram-otp/index.ts

// [PERBAIKAN] Menggunakan URL lengkap untuk impor, sesuai standar Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fungsi untuk membuat OTP 6 digit
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Fungsi untuk membuat hash dari OTP (untuk keamanan)
async function hashOtp(otp: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Buat Supabase client yang menggunakan otorisasi pengguna
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // 2. Dapatkan data pengguna dari token JWT yang dikirim
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error("Pengguna tidak ditemukan. Silakan login kembali.");
    }

    // 3. Buat OTP dan waktu kedaluwarsa (misal: 5 menit dari sekarang)
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 4. Simpan hash dan waktu kedaluwarsa ke profil pengguna
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        telegram_otp_hash: otpHash,
        telegram_otp_expires_at: expiresAt
      })
      .eq('id', user.id)

    if (updateError) {
      // Log error ini di server untuk debugging
      console.error('Supabase update error:', updateError);
      throw new Error("Gagal memperbarui profil dengan kode OTP.");
    }

    // 5. Kirim kembali OTP yang asli (bukan hash) ke aplikasi frontend
    return new Response(JSON.stringify({ otp }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
