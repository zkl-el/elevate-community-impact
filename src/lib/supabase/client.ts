// Singleton Supabase client to prevent multiple instances
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

let supabaseClient: SupabaseClient | null = null;

export function initializeSupabaseClient(): void {
  if (!supabaseClient) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      console.warn("Supabase env vars missing - using mock client");
      return;
    }

    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false, // Disable Supabase's built-in persistence - we manage it
      }
    });

    // Set the session token if it exists
    const session = getSession();
    if (session?.access_token) {
      supabaseClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: '',
        expires_in: 3600,
        expires_at: Math.floor(new Date(session.expires_at).getTime() / 1000),
        token_type: 'bearer',
        user: {
          id: session.user_id,
          aud: 'authenticated',
          role: 'authenticated',
          email: session.user.phone,
          phone: session.user.phone,
          user_metadata: {
            full_name: session.user.full_name,
            role: session.user.role,
          }
        } as any
      });
    }
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    initializeSupabaseClient();
  }

  if (!supabaseClient) {
    // Return mock client if initialization failed
    return {
      functions: {
        invoke: async (path: string, options: { body?: any }) => {
          console.warn(`[Supabase Mock] ${path}`, options.body);
          return {
            data: { success: false, error: 'Supabase not configured. Check Vercel env vars.' },
            error: null
          };
        }
      },
      rpc: async (fn: string) => {
        console.warn(`[Supabase Mock RPC] ${fn}`);
        return { data: null, error: { message: 'Supabase not configured' } };
      },
      from: async () => ({
        select: () => ({
          eq: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          maybeSingle: async () => ({ data: null, error: null })
        }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: async () => ({ data: null, error: { message: 'Supabase not configured' } })
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        setSession: async () => ({ data: { session: null }, error: null })
      }
    } as any;
  }

  return supabaseClient;
}

// Legacy function for backward compatibility - now returns singleton
export function createSupabaseClient(accessToken?: string) {
  const client = getSupabaseClient();

  // If access token is provided, set the session
  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer'
    }).catch(err => console.warn('Failed to set session:', err));
  }

  return client;
}

// Usage: const supabase = createSupabaseClient(accessToken);
