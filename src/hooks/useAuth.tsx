import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { ApiClient } from '@/integrations/api/client';

export type AppRole = 'admin' | 'usuario';

interface AuthContextType {
  user: { id: string; email: string; nombre?: string } | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; nombre?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth - restore token from storage if exists
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to restore token from localStorage
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        // Try to validate token by calling an protected endpoint
        try {
          // For now, just assume token is valid if it exists
          // In production, you might want to verify it
          console.log('Token restored from storage');
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await ApiClient.login(email, password);
      setUser({
        id: data.user.id,
        email: data.user.email,
      });
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, nombre: string) => {
    try {
      const data = await ApiClient.signup(email, password, nombre);
      setUser({
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.nombre,
      });
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await ApiClient.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
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
