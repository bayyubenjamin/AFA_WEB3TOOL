import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Mengambil URL foto profil pengguna dari Telegram Bot API.
 * @param userId - ID pengguna Telegram.
 * @param botToken - Token bot Telegram Anda.
 * @returns URL lengkap ke file foto atau null jika gagal.
 */
async function getTelegramProfilePhotoUrl(userId: number, botToken: string): Promise<string | null> {
  try {
    // Langkah 1: Dapatkan daftar foto profil pengguna
    const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    if (!photoRes.ok) {
      console.error('Gagal mendapatkan daftar foto profil dari Telegram:', await photoRes.text());
      return null;
    }
    const photoData = await photoRes.json();
    if (!photoData.ok || !photoData.result || photoData.result.total_count === 0) {
      console.log(`Tidak ada foto profil yang ditemukan untuk user ID: ${userId}`);
      return null;
    }

    // Ambil file_id dari foto dengan resolusi terbaik (biasanya yang terakhir di array)
    const bestPhoto = photoData.result.photos[0].pop();
    const fileId = bestPhoto.file_id;

    // Langkah 2: Dapatkan path file dari file_id
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    if (!fileRes.ok) {
      console.error('Gagal mendapatkan path file dari Telegram:', await fileRes.text());
      return null;
    }
    const fileData = await fileRes.json();
    if (!fileData.ok) {
      return null;
    }
    const filePath = fileData.result.file_path;

    // Langkah 3: Kembalikan URL lengkap untuk mengakses file tersebut
    return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  } catch (error) {
    console.error('Error saat proses mengambil foto profil Telegram:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle preflight request for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    const BOT_TOKEN = Deno.env.get('BOT_TOKEN');

    if (!BOT_TOKEN) {
      throw new Error("BOT_TOKEN tidak ditemukan di Supabase environment variables.");
    }

    // Di sini Anda idealnya harus memvalidasi hash dari initData untuk keamanan
    const urlParams = new URLSearchParams(initData);
    const user = JSON.parse(urlParams.get('user') || '{}');

    if (!user.id) {
      throw new Error("Data user dari initData tidak valid.");
    }

    // Gunakan service_role key untuk akses admin di backend
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const userId = user.id.toString();
    const userEmail = `${userId}@telegram.user`; // Email dummy yang konsisten

    // Cek apakah user sudah ada di auth.users
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Jika user belum ada di sistem autentikasi, buat baru
    if (getUserError && getUserError.message === 'User not found') {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: userId,
        email: userEmail,
        email_confirm: true, // Auto-konfirmasi karena sumbernya terpercaya (Telegram)
        user_metadata: {
          user_name: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });
      if (createError) throw createError;
    } else if (getUserError) {
      throw getUserError;
    }
    
    // Ambil URL foto profil dari Telegram API
    const photoUrl = await getTelegramProfilePhotoUrl(user.id, BOT_TOKEN);

    // Siapkan data profil untuk di-update atau dibuat (upsert)
    const profileData = {
      id: userId,
      username: user.username || `user_${user.id}`,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      // Hanya update avatar_url jika kita berhasil mendapatkannya
      ...(photoUrl && { avatar_url: photoUrl }), 
      telegram_user_id: user.id,
    };

    // Update atau buat profil di tabel 'profiles'
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (upsertError) {
        console.error("Gagal upsert profil:", upsertError);
        throw upsertError;
    }

    // Buat sesi JWT (magic link) untuk user
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });
    if (tokenError) throw tokenError;

    // Kirim token kembali ke frontend
    return new Response(
      JSON.stringify({
        access_token: tokenData.properties.access_token,
        refresh_token: tokenData.properties.refresh_token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error di dalam Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
