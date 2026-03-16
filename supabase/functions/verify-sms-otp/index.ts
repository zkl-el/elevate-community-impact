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

// Check OTP attempt limit: max 5 unverified attempts per 5min (task req)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: attempts, error: attemptsError } = await supabaseClient
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', international)
      .eq('verified', false)
      .gte('created_at', fiveMinAgo);
    if (attemptsError) console.error('Attempts count error:', attemptsError);
    else if (attempts && attempts >= 5) {
      console.log(`Too many attempts for ${international}: ${attempts}`);
      return new Response(JSON.stringify({ success: false, error: 'Too many verification attempts. Please request new OTP.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // PURE PHONE AUTH - Find profile by phone
    let profile = null;
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("phone", international)
      .maybeSingle();
    profile = existingProfile;

    let authUserId: string;

    if (!profile) {
      // Create auth user with phone
      const password = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        phone: international,
        password,
        phone_confirm: true,
        user_metadata: {
          full_name: record.full_name
        }
      });

      if (createError) throw createError;

      authUserId = newUser.user.id;

// Create profile with select (task: role 'member')
      const { data: newProfile, error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
          id: authUserId,
          phone: international,
          full_name: record.full_name,
          role: 'member'
        })
        .select()
        .single();
      if (profileError) throw profileError;
      
      profile = newProfile;

    } else {
      authUserId = profile.id;
    }
    
    // Phone auth session: Use temp password + signInWithPassword (works for phone users after phone_confirm=true)
    const tempPassword = crypto.randomUUID();
    await supabaseClient.auth.admin.updateUserById(authUserId, { password: tempPassword });
    
    const { data: { session }, error: signInError } = await supabaseClient.auth.signInWithPassword({
      phone: international,
      password: tempPassword
    });
    
    if (signInError) {
      console.error('signInWithPassword error:', signInError);
      throw new Error('Session generation failed: ' + signInError.message);
    }
    
    const access_token = session.access_token;
    const refresh_token = session.refresh_token;
    const expires_at = session.expires_at.toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        access_token,
        refresh_token,
        user_id: profile ? profile.id : authUserId,
        user: profile,
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
