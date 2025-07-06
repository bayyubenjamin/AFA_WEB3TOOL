// File: api/frame-handler.js

export default async function handler(req, res) {
  // Pastikan request datang dari Farcaster (metode POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya metode POST yang diizinkan' });
  }

  try {
    // Ambil data yang dikirim oleh Farcaster
    const body = req.body;
    const buttonIndex = body.untrustedData.buttonIndex;

    // ----- LOGIKA ANDA DIMULAI DI SINI -----

    // Jika Tombol 1 ("Cek Airdrop") ditekan
    if (buttonIndex === 1) {
      // Siapkan HTML untuk frame berikutnya
      const htmlResponse = `
        <!DOCTYPE html><html><head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="https://afatestweb.vercel.app/gambar-setelah-klik.png" />
          <meta property="fc:frame:button:1" content="Berhasil!" />
        </head></html>`;

      // Kirim frame baru sebagai respons
      return res.status(200).setHeader('Content-Type', 'text/html').send(htmlResponse);
    }

    // Jika ada tombol lain di masa depan, logikanya bisa ditambahkan di sini
    // else if (buttonIndex === 2) { ... }


    // Respons default jika ada kondisi yang tidak terduga
    return res.status(400).json({ error: 'Request tidak valid' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Terjadi kesalahan internal' });
  }
}
