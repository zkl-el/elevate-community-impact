// Moved from integrations/supabase/client.ts - now in lib/supabase
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    console.warn("Supabase env vars missing - using mock client for development/preview");
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
        })
      })
    } as any;
  }

  return createClient<Database>(url, key, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

// Usage: const supabase = createSupabaseClient();
