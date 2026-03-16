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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ) as any;

    const adminHeaders = {
      apikey: serviceKey,
      Authorization: `Service ${serviceKey}`,
    };

    const { phone, otp } = await req.json();
    if (!phone || !otp) throw new Error('Phone and otp required');

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

    // find matching unverified code
    console.log(`Verifying OTP for phone ${international}, code: ${otp}`);

    const { data: record, error } = await supabaseClient
      .from('otp_codes')
      .select('*')
      .eq('phone', international)
      .eq('otp', otp)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('OTP query error:', error);
      throw error;
    }
    if (!record) {
      console.log(`No matching OTP found for ${international}, ${otp}`);
      return new Response(JSON.stringify({ success: false, error: 'Invalid or expired code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Valid OTP found, marking verified:', record.id);

    // mark verified
    await supabaseClient
      .from('otp_codes')
      .update({ verified: true })
      .eq('id', record.id);

    // ensure profile exists - create Supabase auth user first
    let user: any = null;
    const { data: existing } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('phone', international)
      .maybeSingle();

    if (!existing) {
      // Create user in Supabase Auth
      const email = `${normalizedPhone}@churchapp.local`;
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email,
        password: Math.random().toString(36) + Date.now().toString(),
        phone: international,
        user_metadata: { phone: international, full_name: record.full_name }
      });

      if (authError) {
        console.error('Failed to create auth user:', authError);
        throw authError;
      }

      // Create profile with the auth user ID
      const { data: newProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .insert({ 
          id: authUser.user.id,
          phone: international, 
          full_name: record.full_name, 
          category: 'church_member' 
        })
        .single();
      
      if (profileError) {
        console.error('Failed to create profile:', profileError);
        throw profileError;
      }
      
      user = newProfile;
    } else {
      user = existing;
    }

    // create a Supabase auth session for the user
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.admin.createSession({
        user_id: user.id,
      });
    
    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      throw sessionError;
    }

    const access_token = sessionData?.access_token;
    const refresh_token = sessionData?.refresh_token;
    const expires_at = sessionData?.expires_at;

    return new Response(
      JSON.stringify({
        success: true,
        access_token,
        refresh_token,
        user_id: user.id,
        user,
        expires_at,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

console.log('verify-sms-otp function ready');
