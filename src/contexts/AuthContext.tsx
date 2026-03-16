import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
// import { otpService } from "@/lib/otpService"; // Removed - pure Supabase auth
// import type { Tables } from "@/types/supabase";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  category: string;
}
type AppRole = "super_admin" | "finance_admin" | "group_leader" | "member";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (type: 'otp' | 'password', phone: string, options?: { password?: string; fullName?: string }) => Promise<{ data: any; error: any }>;
}

  const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  login: async () => ({ data: null, error: new Error('Not implemented') }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles(data?.map((r) => r.role) || []);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
    localStorage.removeItem("session_token");
  };

  const login = async (type: 'otp' | 'password', phone: string, options: { password?: string; fullName?: string } = {}) => {
    try {
      let result;
      // Use custom edge function for Tanzania SMS OTP support
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        throw new Error('Missing VITE_SUPABASE_ANON_KEY');
      }
      
      const url = `https://lyriycokryccjrhuqqmj.supabase.co/functions/v1/${type === 'otp' ? 'send-sms-otp' : 'sign-in'}`;
      const body = type === 'otp' ? 
        { phone, ...(options.fullName && { full_name: options.fullName }), mode: options.fullName ? 'signup' : 'signin' } :
        { phone };
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Auth failed');
      }
      result = { data, error: null };
      
      // Set session if tokens returned
      if (data.access_token && data.refresh_token) {
        await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      }

      if (result.error) {
        return { data: null, error: result.error };
      }

      // Refresh session to update state immediately
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        setUser(refreshed.session.user);
        await Promise.all([
          fetchProfile(refreshed.session.user.id),
          fetchRoles(refreshed.session.user.id)
        ]);
      }

      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

// Removed custom signIn - use Supabase auth

  // Pure Supabase auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      roles, 
      loading, 
      signOut, 
      refreshProfile,
      login 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

