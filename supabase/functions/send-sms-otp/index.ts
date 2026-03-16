import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as any;

    const { phone, full_name, mode } = await req.json();
    if (!phone) throw new Error('Phone number is required');
    if (!mode || !['signup', 'signin'].includes(mode)) throw new Error('mode must be "signup" or "signin"');

    // Normalize phone number
    let normalizedPhone = phone.trim();
    normalizedPhone = normalizedPhone.replace(/\s+/g, "");
    normalizedPhone = normalizedPhone.replace(/[^0-9+]/g, "");

    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "255" + normalizedPhone.slice(1);
    }

    if (normalizedPhone.startsWith("+255")) {
      normalizedPhone = normalizedPhone.replace("+", "");
    }

    if (!normalizedPhone.startsWith("255") || normalizedPhone.length !== 12) {
      throw new Error("Invalid phone number format");
    }

    const international = "0" + normalizedPhone.slice(3);

// rate limit: max 3 OTP requests per minute per phone (task req)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent, error: countError } = await supabaseClient
      .from('otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('phone', international)
      .gte('created_at', oneMinuteAgo);
    if (countError) console.warn('Rate limit count error:', countError);
    if (recent?.count && recent.count >= 3) {
      throw new Error('Too many OTP requests. Please wait 1 minute (max 3/min).');
    }

    // clean expired
    const { error: deleteError } = await supabaseClient
      .from('otp_codes')
      .delete()
      .eq('phone', international)
      .lte('expires_at', new Date().toISOString());
    if (deleteError) console.warn('Cleanup error:', deleteError);
    
    // Mode-based user existence validation
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('phone', international)
      .maybeSingle();

    if (mode === 'signup' && existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User already exists. Please sign in.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (mode === 'signin' && !existingUser) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User does not exist. Please sign up.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Cleaned expired OTPs for ${international}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseClient
      .from('otp_codes')
      .insert({ phone: international, otp, expires_at: expiresAt, full_name });
    if (insertError) throw insertError;
    console.log(`OTP inserted for ${international}: ${otp}, expires ${expiresAt}`);

    // Mock SMS mode for dev/testing - skips real SMS
    if (Deno.env.get('MOCK_SMS') === 'true') {
      console.log(`MOCK SMS to ${international}: Your verification code is ${otp}`);
      return new Response(JSON.stringify({ success: true, message: 'MOCK OTP sent (check logs/DB)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get SMS credentials from environment variables
    const username = Deno.env.get("SMS_USERNAME");
    const password = Deno.env.get("SMS_PASSWORD");

    if (!username || !password) {
      throw new Error("SMS credentials not configured");
    }

    const auth = btoa(`${username}:${password}`);

    // Real SMS provider
    const smsPayload = {
      from: "CHUOKKUUSDA",
      to: normalizedPhone,
      text: `Your verification code is ${otp}`,
      reference: `otp-${Date.now()}`
    };
    console.log('SMS request:', JSON.stringify(smsPayload));
    console.log("SMS SENT TO:", normalizedPhone);
    
    const smsResp = await fetch('https://messaging-service.co.tz/api/sms/v1/text/single', {
      method: 'POST',
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(smsPayload),
    });
    
    const smsResult = await smsResp.text();
    console.log('SMS STATUS:', smsResp.status);
    console.log('SMS RESPONSE:', smsResult);  

    if (!smsResp.ok) {
      console.error('SMS error', smsResp.status, smsResult);
      throw new Error(`SMS provider failed: ${smsResp.status}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

console.log('send-sms-otp function ready');
