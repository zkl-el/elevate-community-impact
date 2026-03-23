import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSession, clearSession } from '@/lib/auth';

interface AuthContextType {
  user: any | null;
  roles: string[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.user);
      setRoles([session.user.role || 'member']);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const session = getSession();
      if (session) {
        setUser(session.user);
        setRoles([session.user.role || 'member']);
      } else {
        setUser(null);
        setRoles([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, roles, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
