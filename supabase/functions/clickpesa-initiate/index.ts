// ClickPesa - Generate Hosted Checkout URL
// User is redirected to a ClickPesa-hosted page where they can pay via
// mobile money (M-Pesa, Tigo, Airtel, Halopesa), bank transfer, or card.
// We create a "pending" contribution row, ask ClickPesa for a checkout URL,
// and return that URL to the frontend, which opens it in a new tab/window.
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
const CHECKSUM_KEY = Deno.env.get("CLICKPESA_CHECKSUM_KEY") ?? "";

// In-memory token cache (per cold start)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function generateToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${CLICKPESA_BASE}/third-parties/generate-token`, {
    method: "POST",
    headers: { "client-id": CLIENT_ID, "api-key": API_KEY },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[clickpesa] token error", res.status, text);
    throw new Error(`Token generation failed: ${res.status} ${text}`);
  }
  const data = JSON.parse(text);
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

async function buildChecksum(payload: Record<string, unknown>): Promise<string> {
  const keys = Object.keys(payload)
    .filter((k) => k !== "checksum" && k !== "checksumMethod")
    .sort();
  const message = keys.map((k) => String(payload[k] ?? "")).join("");
  return await hmacSha256Hex(CHECKSUM_KEY, message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      amount,
      phone,
      userId,
      projectId,
      reference: noteRef,
      customerName,
      customerEmail,
    } = body ?? {};

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500 || numAmount > 3_000_000) {
      return new Response(
        JSON.stringify({ success: false, error: "Amount must be between 500 and 3,000,000 TZS" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Unique reference (max 20 chars per ClickPesa). base36 keeps it short.
    const orderReference = `CK${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      .toUpperCase()
      .slice(0, 20);

    // Insert pending contribution row up-front so we can track it via webhook/poll.
    const { data: contribution, error: insertError } = await supabase
      .from("contributions")
      .insert({
        user_id: userId ?? null,
        project_id: projectId ?? null,
        amount: numAmount,
        method: "hosted_checkout",
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

    const token = await generateToken();

    // Build hosted checkout payload. ClickPesa hosted endpoint accepts mobile money,
    // bank transfer, and card payments — the user picks one on the hosted page.
    const checkoutPayload: Record<string, unknown> = {
      amount: String(numAmount),
      currency: "TZS",
      orderReference,
    };
    if (customerName) checkoutPayload.customerName = String(customerName);
    if (customerEmail) checkoutPayload.customerEmail = String(customerEmail);
    if (phone) checkoutPayload.customerPhoneNumber = String(phone).replace(/\D/g, "");

    // Add checksum only when a checksum key is configured for this account
    if (CHECKSUM_KEY) {
      checkoutPayload.checksum = await buildChecksum(checkoutPayload);
    }

    console.log("[clickpesa] generating hosted checkout", { orderReference, amount: numAmount });

    const cpRes = await fetch(`${CLICKPESA_BASE}/webshop/generate-checkout-url`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });
    const cpText = await cpRes.text();
    let cpData: any;
    try { cpData = JSON.parse(cpText); } catch { cpData = { raw: cpText }; }

    console.log("[clickpesa] hosted response", cpRes.status, cpData);

    if (!cpRes.ok) {
      // Mark as failed and return a friendly error
      await supabase
        .from("contributions")
        .update({ status: "failed" })
        .eq("id", contribution.id);

      const rawMsg = String(cpData?.message || cpData?.error || "Could not start payment");
      return new Response(
        JSON.stringify({ success: false, error: rawMsg, details: cpData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const checkoutUrl: string | undefined =
      cpData?.checkoutLink ||
      cpData?.checkout_url ||
      cpData?.checkoutUrl ||
      cpData?.url ||
      cpData?.data?.checkoutUrl ||
      cpData?.data?.url;

    if (!checkoutUrl) {
      console.error("[clickpesa] no checkoutUrl in response", cpData);
      await supabase
        .from("contributions")
        .update({ status: "failed" })
        .eq("id", contribution.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: "ClickPesa did not return a checkout URL. Please try again.",
          details: cpData,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderReference,
        contributionId: contribution.id,
        checkoutUrl,
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
