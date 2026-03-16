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

    const { phone } = await req.json();
    if (!phone) throw new Error('Phone number required');

    // Normalize to TZ international 0XXXXXXXXX
    let normalizedPhone = phone.trim().replace(/\D/g, '');
    if (normalizedPhone.startsWith('255')) {
      normalizedPhone = '0' + normalizedPhone.slice(3);
    } else if (normalizedPhone.startsWith('0')) {
      // already TZ
    } else {
      throw new Error('Phone must be 0XXXXXXXXX or 255XXXXXXXXX');
    }

    const international = normalizedPhone; // 0XXXXXXXXX for DB

    console.log('Sign in attempt for phone:', international);

    // check if profile exists
    const { data: user, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('phone', international)
      .single();

    if (error || !user) {
      console.log('User not found for sign in:', international);
      return new Response(JSON.stringify({ success: false, error: 'Phone not registered. Please sign up first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // success - return session tokens
    console.log('Sign in success for:', user.id);

    const access_token = 'signin-session-' + user.id;
    const refresh_token = 'signin-refresh-' + Date.now();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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

console.log('sign-in function ready');

