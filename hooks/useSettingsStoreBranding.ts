'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { useDashboardBranding } from '@/components/dashboard/DashboardBrandingProvider';
import { loadSettingsBrandingDraft } from '@/lib/settings/storeBranding';
import type { BrandingDraft } from '@/lib/onboarding/types';

/**
 * Shared Settings → Store Branding draft.
 * `appName` and `fallbackLogo` are read when the load runs. Changing them
 * does not send another branding GET.
 * The shell promise is reused when it is in flight or already settled.
 * `retry` asks the shell to reload, which may fetch again.
 */
export function useSettingsStoreBranding(appName: string, fallbackLogo: string | null) {
  const { storeId: shellStoreId, request: shellRequest, reload } = useDashboardBranding();
  const { data: session, status } = useSession();
  const storeId = session?.user?.storeId?.trim() || null;
  const appNameRef = useRef(appName);
  const fallbackLogoRef = useRef(fallbackLogo);
  appNameRef.current = appName;
  fallbackLogoRef.current = fallbackLogo;

  const [draft, setDraft] = useState<BrandingDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    const token = tokenStorage.getToken();

    async function load() {
      if (!storeId || !token) {
        if (!cancelled) {
          setDraft(null);
          setLoadError('Sign in again to edit your app icon and splash.');
          setLoading(false);
        }
        return;
      }

      // The shell owns this store's GET. Wait until that promise is published.
      if (!shellRequest || shellStoreId !== storeId) return;

      setLoading(true);
      const next = await loadSettingsBrandingDraft({
        storeId,
        token,
        appName: appNameRef.current,
        fallbackLogo: fallbackLogoRef.current,
        loadBranding: () => shellRequest,
      });
      if (cancelled) return;
      if (!next) {
        setLoadError('We could not load your brand. Try again before replacing an image.');
        setLoading(false);
        return;
      }
      setDraft(next);
      setLoadError(null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [status, storeId, shellStoreId, shellRequest]);

  const retry = useCallback(() => {
    reload();
    setRefreshKey((key) => key + 1);
  }, [reload]);

  return { draft, setDraft, loading, loadError, refreshKey, retry };
}
