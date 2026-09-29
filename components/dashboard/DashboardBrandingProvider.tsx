'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession, useAuth } from '@/lib/auth';
import { fetchBranding } from '@/lib/onboarding/branding';
import { nextShellBrandingRequest, type ShellBrandingRequest } from '@/lib/dashboard/shellBranding';
import type { BrandingDraft } from '@/lib/onboarding/types';

export interface DashboardBrandingValue {
  storeId: string | null;
  logoUrl: string | null;
  draft: BrandingDraft | null;
  loading: boolean;
  error: string | null;
  /** In-flight or settled shell load for `storeId`. Null until the shell starts it. */
  request: Promise<BrandingDraft | null> | null;
  reload: () => void;
}

const DashboardBrandingContext = createContext<DashboardBrandingValue | null>(null);

export function DashboardBrandingProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { getToken } = useAuth();
  const storeId = session?.user?.storeId?.trim() || null;
  const [reloadKey, setReloadKey] = useState(0);
  const [held, setHeld] = useState<ShellBrandingRequest | null>(null);
  const [draft, setDraft] = useState<BrandingDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const draftStoreId = useRef<string | null>(null);

  // Start the load during render so Sidebar and Settings observe the same
  // promise in this commit, including after it has already settled.
  // `nextShellBrandingRequest` returns the held promise until `reload` bumps the key.
  const pendingSession = status === 'loading';
  let active = held;
  if (!pendingSession) {
    const token = getToken();
    const next = nextShellBrandingRequest(held, storeId, token, reloadKey, fetchBranding);
    if (next !== held) setHeld(next);
    active = next;
  }

  const request =
    !pendingSession && active && active.storeId === storeId && active.reloadKey === reloadKey
      ? active.promise
      : null;

  useEffect(() => {
    if (!request || !storeId) {
      draftStoreId.current = null;
      setDraft(null);
      setLoading(pendingSession);
      setError(null);
      return;
    }

    let cancelled = false;
    if (draftStoreId.current !== storeId) setDraft(null);
    setLoading(true);
    request.then((result) => {
      if (cancelled) return;
      draftStoreId.current = storeId;
      setDraft(result);
      setError(result ? null : 'We could not load store branding.');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [request, storeId, pendingSession]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo<DashboardBrandingValue>(
    () => ({
      storeId,
      logoUrl: draft?.logoUrl ?? null,
      draft,
      loading,
      error,
      request,
      reload,
    }),
    [storeId, draft, loading, error, request, reload]
  );

  return <DashboardBrandingContext.Provider value={value}>{children}</DashboardBrandingContext.Provider>;
}

export function useDashboardBranding(): DashboardBrandingValue {
  const value = useContext(DashboardBrandingContext);
  if (!value) {
    throw new Error('useDashboardBranding must be used inside DashboardBrandingProvider');
  }
  return value;
}
