// supabase/functions/link-email-password/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Buat client dengan otorisasi pengguna yang memanggil fungsi ini
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Dapatkan data pengguna dari sesi aktif
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Akses ditolak: Pengguna tidak ditemukan.");

    // 3. Ambil email dan password baru dari request body
    const { new_email, new_password } = await req.json();
    if (!new_email || !new_password) {
      throw new Error("Email dan password baru diperlukan.");
    }
    if (new_password.length < 6) {
      throw new Error("Password harus terdiri dari minimal 6 karakter.");
    }

    // 4. Buat admin client untuk melakukan pembaruan
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Update data otentikasi pengguna
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email: new_email, password: new_password }
    );

    if (updateError) throw updateError;

    // 6. Update juga email di tabel 'profiles' agar konsisten
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ email: new_email })
      .eq('id', user.id);

    if (profileUpdateError) throw profileUpdateError;

    return new Response(JSON.stringify({ success: true, message: 'Email dan password berhasil ditambahkan!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
