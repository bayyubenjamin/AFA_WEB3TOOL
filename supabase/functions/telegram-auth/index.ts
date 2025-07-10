import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ Kalau pakai Deno di Supabase Edge Function, tidak bisa pakai 'node:crypto'
import { encode as encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

function checkTelegramAuth(initData: string, botToken: string): boolean {
  const encoder = new TextEncoder();
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");

  const secretKey = new Uint8Array(
    crypto.subtle
      .digestSync?.("SHA-256", encoder.encode(botToken)) ??
    []
  );

  return crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then((key) =>
    crypto.subtle.sign("HMAC", key, encoder.encode(dataCheckString))
  ).then((sig) => {
    const hmac = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hmac === hash;
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { initData } = await req.json();
    if (!initData) {
      return new Response(JSON.stringify({ error: "Missing initData" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const isValid = await checkTelegramAuth(initData, TELEGRAM_BOT_TOKEN);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid hash" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchParams = new URLSearchParams(initData);
    const userJson = searchParams.get("user");
    const telegramUserId = JSON.parse(userJson || "{}").id;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "telegram",
      token: telegramUserId,
    });

    if (error) {
      console.error("SignIn error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
});

