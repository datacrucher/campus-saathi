import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../data/types';
import { api, ApiError } from '../lib/api';

export interface SessionUser {
  role: Role;
  id: string;
  name: string;
  firstName: string;
  email: string;
  title: string;
}

interface AuthValue {
  user: SessionUser | null;
  checking: boolean;
  signInAs: (role: Role, remember?: boolean) => Promise<SessionUser>;
  signInWithEmail: (email: string, password: string, remember: boolean) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  sessionExpired: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export const homeFor = (role: Role) => `/${role}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api<{ user: SessionUser }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const signInAs = useCallback(async (role: Role, remember = false) => {
    const r = await api<{ user: SessionUser }>('/auth/demo', { body: { role, remember } });
    setUser(r.user);
    return r.user;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string, remember: boolean) => {
    const r = await api<{ user: SessionUser }>('/auth/login', { body: { email, password, remember } });
    setUser(r.user);
    return r.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
    setUser(null);
  }, []);

  const sessionExpired = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, checking, signInAs, signInWithEmail, signOut, sessionExpired }),
    [user, checking, signInAs, signInWithEmail, signOut, sessionExpired],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
