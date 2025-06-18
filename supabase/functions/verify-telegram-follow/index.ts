// supabase/functions/verify-telegram-follow/index.ts (Versi Perbaikan)

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2' // <-- INI PERBAIKANNYA
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getTelegramId(supabaseAdmin: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin.from('profiles').select('telegram_id').eq('id', userId).single();
    if (error || !data?.telegram_id) {
        throw new Error("Akun Telegram belum terhubung. Silakan hubungkan akun Anda di halaman profil terlebih dahulu.");
    }
    return data.telegram_id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Akses ditolak.");

    const { channelId } = await req.json();
    if (!channelId) throw new Error("Parameter 'channelId' diperlukan.");
    
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const telegramId = await getTelegramId(supabaseAdmin, user.id);

    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!BOT_TOKEN) throw new Error("Secret TELEGRAM_BOT_TOKEN belum di-set.");
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: channelId, user_id: telegramId })
    });
    const result = await response.json();

    if (!result.ok) {
        if (result.description && result.description.includes("user not found")) {
             throw new Error("Verifikasi Gagal: Anda harus memulai chat dengan bot verifikasi kami (@afaweb3tool_bot) terlebih dahulu.");
        }
        throw new Error(`Telegram API Error: ${result.description || 'Gagal memeriksa keanggotaan.'}`);
    }
    
    const status = result.result.status;
    const isMember = ['member', 'administrator', 'creator'].includes(status);
    
    return new Response(JSON.stringify({ verified: isMember }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
