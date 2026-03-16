import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as any;

    const { phone, otp } = await req.json();

    // Same OTP logic...
    // Normalize phone...
    let normalizedPhone = phone.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (normalizedPhone.startsWith("0")) normalizedPhone = "255" + normalizedPhone.slice(1);
    if (normalizedPhone.startsWith("+255")) normalizedPhone = normalizedPhone.replace("+", "");
    if (!normalizedPhone.startsWith("255") || normalizedPhone.length !== 12) throw new Error("Invalid phone");

    const international = "0" + normalizedPhone.slice(3);

    // Verify OTP (same as before)
    const { data: record } = await supabaseClient.from('otp_codes').select('*').eq('phone', international).eq('otp', otp).eq('verified', false).gte('expires_at', new Date().toISOString()).maybeSingle();
    if (!record) return new Response(JSON.stringify({ success: false, error: 'Invalid OTP' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    await supabaseClient.from('otp_codes').update({ verified: true }).eq('id', record.id);

    // Get or create profile (no auth.users)
    let profile = await supabaseClient.from("profiles").select("*").eq("phone", international).maybeSingle();
    let profileData;

    if (!profile.data) {
      const newId = crypto.randomUUID();
      const newProfile = await supabaseClient.from("profiles").insert({
        id: newId,
        phone: international,
        full_name: record.full_name || 'Unknown',
        role: 'member'
      }).select().single();
      profileData = newProfile.data;
    } else {
      profileData = profile.data;
    }

    // Generate custom session token (simple UUID, expires 7 days)
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseClient.from("profiles").update({ 
      access_token: token, 
      token_expires_at: expires 
    }).eq('id', profileData.id);

    return new Response(JSON.stringify({
      success: true,
      access_token: token,
      expires_at: expires,
      user: profileData
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

console.log('custom-phone-session ready');
