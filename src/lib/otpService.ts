import { supabase } from "./supabase";

export interface OTPResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  // tokens returned from server; access_token is the Supabase session token
  access_token?: string;
  refresh_token?: string;
  // legacy field (some older code might still reference it)
  session_token?: string;
  user_id?: string;
  user?: {
    id: string;
    full_name: string;
    phone: string;
    category: string;
  };
  expires_at?: string;
  error?: string;
}

export interface SignInResponse extends VerifyResponse {}

class OTPService {
  private supabaseUrl: string = 'https://lyriycokryccjrhuqqmj.supabase.co';

  async generateOTP(phone: string, fullName?: string, mode: 'signup' | 'signin' = 'signup'): Promise<OTPResponse> {
    // Format phone to +255XXXXXXXXX
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '255' + normalized.slice(1);
    if (!normalized.startsWith('255')) normalized = '255' + normalized; // fallback
    normalized = '+' + normalized;

    console.log('generateOTP called with', normalized, fullName, mode);

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        console.error('VITE_SUPABASE_ANON_KEY is missing');
        return { success: false, error: 'Configuration error: missing Supabase anon key' };
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-sms-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ phone: normalized, full_name: fullName, mode }),
      });

      const data = await response.json();
      console.log('send-sms-otp response', response.status, data);
      if (!response.ok) {
        // include status/code so caller can see what went wrong
        const errMsg = data.error || `HTTP ${response.status} ${response.statusText}`;
        console.warn('generateOTP failed with', response.status, data);
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized (401) - check Supabase anon key in env' };
        }
        return { success: false, error: errMsg };
      }
      return { success: true, message: data.message };
    } catch (error) {
      console.error('OTP generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(phone: string, otpCode: string): Promise<VerifyResponse> {
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '255' + normalized.slice(1);
    if (!normalized.startsWith('255')) normalized = '255' + normalized;
    normalized = '+' + normalized;

    console.log('verifyOTP called with', normalized, otpCode);

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        console.error('VITE_SUPABASE_ANON_KEY is missing');
        return { success: false, error: 'Configuration error: missing Supabase anon key' };
      }
      const response = await fetch(`${this.supabaseUrl}/functions/v1/custom-phone-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ phone: normalized, otp: otpCode }),
      });

      const data = await response.json();
      console.log('verify-sms-otp response', response.status, data);
      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Unauthorized (401) - check Supabase anon key in env' };
        }
        return { success: false, error: data.error || 'Verification failed' };
      }
      // if the server returned Supabase tokens, apply them
      const tokens: { access_token: string; refresh_token: string } | null =
        data.access_token && data.refresh_token
          ? { access_token: data.access_token, refresh_token: data.refresh_token }
          : data.session_token && data.refresh_token
          ? { access_token: data.session_token, refresh_token: data.refresh_token }
          : null;
      // Custom session - store token in localStorage
      if (data.access_token) {
        localStorage.setItem('custom_access_token', data.access_token);
        localStorage.setItem('custom_expires_at', data.expires_at);
        localStorage.setItem('custom_user', JSON.stringify(data.user));
        console.log('custom session set', data.access_token);
      }
      return data as VerifyResponse;
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      };
    }
  }

  async signIn(phone: string): Promise<SignInResponse> {
    // Normalize to TZ 0XXXXXXXXX
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('255')) {
      normalized = '0' + normalized.slice(3);
    }
    // else assume 0.. or error in func

    console.log('signIn called with', normalized);

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        return { success: false, error: 'Missing anon key' };
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ phone: normalized }),
      });

      const data = await response.json();
      console.log('sign-in response', response.status, data);
      if (!response.ok) {
        return { success: false, error: data.error || 'Sign in failed' };
      }
      const tokens = { access_token: data.access_token, refresh_token: data.refresh_token };
      if (tokens.access_token) {
        await supabase.auth.setSession(tokens);
      }
      return data as SignInResponse;
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Sign in failed' };
    }
  }
}

export const otpService = new OTPService();

export const signOutCustom = async () => {
  localStorage.removeItem('custom_access_token');
  localStorage.removeItem('custom_expires_at');
  localStorage.removeItem('custom_user');
};


