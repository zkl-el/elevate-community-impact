// ClickPesa - Initiate USSD Push payment (mobile money)
// Generates JWT, builds checksum, creates pending contribution row, calls ClickPesa.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLICKPESA_BASE = "https://api.clickpesa.com";
const CLIENT_ID = Deno.env.get("CLICKPESA_CLIENT_ID")!;
const API_KEY = Deno.env.get("CLICKPESA_API_KEY")!;
const CHECKSUM_KEY = Deno.env.get("CLICKPESA_CHECKSUM_KEY")!;

// In-memory token cache (per cold start)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function generateToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${CLICKPESA_BASE}/third-parties/generate-token`, {
    method: "POST",
    headers: {
      "client-id": CLIENT_ID,
      "api-key": API_KEY,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[clickpesa] token error", res.status, text);
    throw new Error(`Token generation failed: ${res.status} ${text}`);
  }
  const data = JSON.parse(text);
  // ClickPesa returns token in either `token` or `Authorization` like "Bearer xxx"
  const raw: string = data.token ?? data.Authorization ?? "";
  const token = raw.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Empty token from ClickPesa");
  cachedToken = { token, expiresAt: Date.now() + 55 * 60_000 };
  return token;
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Build checksum: alphabetically-sorted keys, exclude checksum & checksumMethod, concatenate values
async function buildChecksum(payload: Record<string, unknown>): Promise<string> {
  const keys = Object.keys(payload)
    .filter((k) => k !== "checksum" && k !== "checksumMethod")
    .sort();
  const message = keys.map((k) => String(payload[k] ?? "")).join("");
  return await hmacSha256Hex(CHECKSUM_KEY, message);
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("255")) return digits;
  if (digits.startsWith("0")) return "255" + digits.slice(1);
  if (digits.length === 9) return "255" + digits;
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { amount, phone, userId, projectId, reference: noteRef } = body ?? {};

    if (!amount || Number(amount) < 500 || Number(amount) > 3_000_000) {
      return new Response(JSON.stringify({ success: false, error: "Amount must be between 500 and 3000000" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Phone required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length !== 12) {
      return new Response(JSON.stringify({ success: false, error: "Invalid phone format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Unique reference (max 20 chars per ClickPesa). base36 keeps it short.
    const orderReference = `CK${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      .toUpperCase()
      .slice(0, 20);

    // Insert pending contribution
    const { data: contribution, error: insertError } = await supabase
      .from("contributions")
      .insert({
        user_id: userId ?? null,
        project_id: projectId ?? null,
        amount: Number(amount),
        method: "mobile_money",
        reference: noteRef ?? null,
        status: "pending",
        clickpesa_order_reference: orderReference,
        payment_provider: "clickpesa",
        currency: "TZS",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[clickpesa] insert error", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to record contribution" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get JWT
    const token = await generateToken();

    // Build USSD push payload
    // NOTE: checksum is only required if explicitly enabled in the ClickPesa dashboard.
    // This account has it disabled, so we omit it entirely (sending one triggers "Invalid checksum").
    const finalPayload: Record<string, unknown> = {
      amount: String(amount),
      currency: "TZS",
      orderReference,
      phoneNumber: normalizedPhone,
    };

    console.log("[clickpesa] initiating", { orderReference, amount, phone: normalizedPhone });

    const cpRes = await fetch(`${CLICKPESA_BASE}/third-parties/payments/initiate-ussd-push-request`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalPayload),
    });
    const cpText = await cpRes.text();
    let cpData: any;
    try { cpData = JSON.parse(cpText); } catch { cpData = { raw: cpText }; }

    console.log("[clickpesa] response", cpRes.status, cpData);

    if (!cpRes.ok) {
      await supabase
        .from("contributions")
        .update({ status: "failed" })
        .eq("id", contribution.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: cpData?.message || cpData?.error || "ClickPesa request failed",
          details: cpData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderReference,
        contributionId: contribution.id,
        provider: cpData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[clickpesa] fatal", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
