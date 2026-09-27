import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Case, Priority, Status } from './types';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../lib/api';

const POLL_MS = 20_000;

export interface NewCaseInput {
  title: string;
  description: string;
  departmentId: string;
  contactPreference: Case['contactPreference'];
}

export interface CasePatch {
  status?: Status;
  priority?: Priority;
  assigneeId?: string | null;
  departmentId?: string;
}

interface CaseStoreValue {
  cases: Case[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  getCase: (id: string) => Case | undefined;
  createCase: (input: NewCaseInput) => Promise<Case>;
  updateCase: (id: string, patch: CasePatch) => Promise<Case>;
  postMessage: (id: string, body: string, opts?: { internal?: boolean; setWaiting?: boolean }) => Promise<Case>;
  resolve: (id: string, text: string) => Promise<Case>;
  reopen: (id: string) => Promise<Case>;
  resetDemo: () => Promise<void>;
}

const Ctx = createContext<CaseStoreValue | null>(null);

export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const { user, sessionExpired } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id;
  const loading = !!userId && loadedFor !== userId;
  const loadSeq = useRef(0);

  const call = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) sessionExpired();
      throw e;
    }
  }, [sessionExpired]);

  const reload = useCallback(async () => {
    const seq = ++loadSeq.current;
    try {
      const r = await call(() => api<{ cases: Case[] }>('/cases'));
      if (seq === loadSeq.current) { setCases(r.cases); setError(null); }
    } catch (e) {
      if (seq === loadSeq.current) setError(e instanceof Error ? e.message : 'Couldn’t load cases.');
    }
  }, [call]);

  useEffect(() => {
    setCases([]);
    setError(null);
    if (!userId) return;
    reload().finally(() => setLoadedFor(userId));
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') reload(); }, POLL_MS);
    return () => window.clearInterval(t);
  }, [userId, reload]);

  const upsert = useCallback((c: Case) => {
    setCases((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c]));
    return c;
  }, []);

  const mutate = useCallback(
    (path: string, body: unknown, method = 'POST') => call(() => api<{ case: Case }>(path, { method, body })).then((r) => upsert(r.case)),
    [call, upsert],
  );

  const getCase = useCallback((id: string) => cases.find((c) => c.id === id.toUpperCase()), [cases]);
  const createCase = useCallback((input: NewCaseInput) => mutate('/cases', input), [mutate]);
  const updateCase = useCallback((id: string, patch: CasePatch) => mutate(`/cases/${id}`, patch, 'PATCH'), [mutate]);
  const postMessage = useCallback(
    (id: string, body: string, opts: { internal?: boolean; setWaiting?: boolean } = {}) => mutate(`/cases/${id}/messages`, { body, ...opts }),
    [mutate],
  );
  const resolve = useCallback((id: string, text: string) => mutate(`/cases/${id}/resolve`, { text }), [mutate]);
  const reopen = useCallback((id: string) => mutate(`/cases/${id}/reopen`, {}), [mutate]);
  const resetDemo = useCallback(async () => {
    await call(() => api('/admin/reset-demo', { method: 'POST' }));
    await reload();
  }, [call, reload]);

  const value = useMemo<CaseStoreValue>(() => ({
    cases, loading, error, reload, getCase, createCase, updateCase, postMessage, resolve, reopen, resetDemo,
  }), [cases, loading, error, reload, getCase, createCase, updateCase, postMessage, resolve, reopen, resetDemo]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCases() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCases must be used inside CaseStoreProvider');
  return ctx;
}
