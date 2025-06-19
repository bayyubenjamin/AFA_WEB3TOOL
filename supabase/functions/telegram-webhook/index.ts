// supabase/functions/telegram-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const APP_URL = Deno.env.get('VITE_SITE_URL') || 'https://afatestweb.vercel.app'

serve(async (req) => {
  try {
    const payload = await req.json()

    // Ensure there is a text message in the payload
    if (payload.message && payload.message.text) {
      const message = payload.message
      const chat_id = message.chat.id
      const text = message.text.toLowerCase()

      // Check if the message is the /start command
      if (text === '/start') {
        const replyText = `🎉 **Welcome to AFA Web3Tool!**\n\nClick the button below to start your airdrop adventure, or join our community.`

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat_id,
            text: replyText,
            parse_mode: 'Markdown', // Enable bold formatting
            reply_markup: {
              inline_keyboard: [
                // First row: Button to open the Mini App
                [
                  { 
                    text: '🚀 Open App', 
                    web_app: { url: `${APP_URL}/login-telegram` } 
                  }
                ],
                // Second row: Buttons for the channel and group
                [
                  { text: '📣 Follow Channel', url: 'https://t.me/Airdrop4ll' },
                  { text: '💬 Join Group', url: 'https://t.me/afadiskusi' }
                ]
              ],
            },
          }),
        })
      }
    }

    // Always return a 200 OK response to Telegram to acknowledge receipt
    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    // If an error occurs, still return 200 OK so Telegram doesn't retry the same failed update
    return new Response('ok', { status: 200 })
  }
})
