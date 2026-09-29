'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession, useAuth } from '@/lib/auth';
import { fetchBranding } from '@/lib/onboarding/branding';
import { ensureShellBrandingSession } from '@/lib/dashboard/shellBranding';
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
  const [draft, setDraft] = useState<BrandingDraft | null>(null);
  const [draftStoreId, setDraftStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const draftStoreRef = useRef<string | null>(null);

  // The session map keeps the settled draft. A Settings mount that runs after
  // the GET has finished must read this record, not call fetchBranding again.
  const pendingSession = status === 'loading';
  const branding = pendingSession
    ? null
    : ensureShellBrandingSession(storeId, getToken(), reloadKey, fetchBranding);
  const request = branding && branding.storeId === storeId ? branding.promise : null;
  const settledDraft = branding?.settled && branding.storeId === storeId ? branding.draft : null;
  const visibleDraft = settledDraft ?? (draftStoreId === storeId ? draft : null);

  useEffect(() => {
    if (!request || !storeId) {
      draftStoreRef.current = null;
      setDraft(null);
      setDraftStoreId(null);
      setLoading(pendingSession);
      setError(null);
      return;
    }

    let cancelled = false;
    if (draftStoreRef.current !== storeId) {
      setDraft(null);
      setDraftStoreId(null);
    }
    setLoading(!branding?.settled);
    request.then((result) => {
      if (cancelled) return;
      draftStoreRef.current = storeId;
      setDraft(result);
      setDraftStoreId(storeId);
      setError(result ? null : 'We could not load store branding.');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [request, storeId, pendingSession, branding?.settled]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const value = useMemo<DashboardBrandingValue>(
    () => ({
      storeId,
      logoUrl: visibleDraft?.logoUrl ?? null,
      draft: visibleDraft,
      loading,
      error,
      request,
      reload,
    }),
    [storeId, visibleDraft, loading, error, request, reload]
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
