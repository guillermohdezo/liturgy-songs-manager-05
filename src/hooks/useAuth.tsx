import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
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

const AUTH_TOKEN_KEY = 'auth_token';

// Helper functions for storage (works both on web and Capacitor)
const getStoredToken = async (): Promise<string | null> => {
  try {
    // Try Capacitor Preferences first (works on mobile)
    const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
    if (value) return value;
  } catch (error) {
    console.log('[Auth] Preferences not available, trying localStorage');
  }

  // Fallback to localStorage (works on web)
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.log('[Auth] localStorage not available');
    return null;
  }
};

const setStoredToken = async (token: string) => {
  try {
    // Try Capacitor Preferences first
    await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
  } catch (error) {
    console.log('[Auth] Preferences not available, trying localStorage');
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
      console.log('[Auth] localStorage not available');
    }
  }
};

const removeStoredToken = async () => {
  try {
    // Try Capacitor Preferences first
    await Preferences.remove({ key: AUTH_TOKEN_KEY });
  } catch (error) {
    console.log('[Auth] Preferences not available, trying localStorage');
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
      console.log('[Auth] localStorage not available');
    }
  }
};

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
      const storedToken = await getStoredToken();
      if (storedToken) {
        console.log('[Auth] Token restored from storage:', storedToken.substring(0, 10) + '...');
        setToken(storedToken);
      }
    } catch (error) {
      console.error('[Auth] Error initializing auth:', error);
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
      await setStoredToken(data.token);
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
      await setStoredToken(data.token);
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
      console.error('[Auth] Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      await removeStoredToken();
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
