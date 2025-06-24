// supabase/functions/metadata/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// URL GAMBAR DEFAULT ANDA. Simpan di sini.
const DEFAULT_IMAGE_URL = "https://ik.imagekit.io/5spt6gb2z/Gambar%20GIF.gif";

serve(async (req) => {
  // Dapatkan tokenId dari URL, contoh: /functions/v1/metadata/1
  const url = new URL(req.url);
  const tokenId = url.pathname.split('/').pop();

  // Jika tidak ada tokenId, kembalikan error
  if (!tokenId || isNaN(parseInt(tokenId))) {
    return new Response(JSON.stringify({ error: "Token ID tidak valid." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Buat metadata secara dinamis
  const metadata = {
    name: `AFA Identity #${tokenId}`,
    description: "A unique, on-chain passport to the AFA Web3Tool ecosystem.",
    // Gunakan URL gambar yang sudah Anda siapkan di atas
    image: DEFAULT_IMAGE_URL,
    attributes: [
      {
        "trait_type": "Level",
        "value": "1" // Di masa depan, ini bisa diambil dari database
      },
      {
        "trait_type": "Status",
        "value": "Standard" // Ini juga bisa dinamis
      }
    ]
  };

  // Kembalikan sebagai response JSON
  return new Response(JSON.stringify(metadata), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    status: 200
  });
})
