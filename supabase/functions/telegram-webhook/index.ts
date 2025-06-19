// supabase/functions/telegram-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const APP_URL = Deno.env.get('VITE_SITE_URL') || 'https://afatestweb.vercel.app'

serve(async (req) => {
  try {
    const payload = await req.json()

    // Pastikan ada pesan teks di dalam payload
    if (payload.message && payload.message.text) {
      const message = payload.message
      const chat_id = message.chat.id
      const text = message.text.toLowerCase()

      // Cek apakah pesan adalah perintah /start
      if (text === '/start') {
        const replyText = `🎉 Selamat Datang di AFA Web3Tool!\n\nKlik tombol di bawah ini untuk memulai petualangan airdrop Anda.`

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat_id,
            text: replyText,
            reply_markup: {
              // Membuat tombol yang langsung membuka Mini App
              inline_keyboard: [
                [{ text: '🚀 Buka Aplikasi', web_app: { url: `${APP_URL}/login-telegram` } }],
              ],
            },
          }),
        })
      }
    }

    // Selalu kembalikan status 200 OK ke Telegram untuk menandakan webhook berhasil
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Jika ada error, tetap kembalikan status 200 agar Telegram tidak terus mencoba mengirim update yang sama
    return new Response('ok', { status: 200 })
  }
})
