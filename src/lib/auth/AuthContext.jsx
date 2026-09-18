import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth as authService } from '../api/authService';

const AuthContext = createContext(null);

/**
 * Single source of truth for member auth.
 * Session shape: { uid, email, displayName, isAdmin } | null
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(authService.current());
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const session = await authService.login({ email, password });
    setUser(session);
    return { user: session };
  }, []);

  const register = useCallback(async (data) => {
    const session = await authService.register(data);
    setUser(session);
    return { user: session };
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isLoggedIn: !!user, isAdmin: user?.isAdmin === true, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
