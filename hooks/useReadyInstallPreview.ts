'use client';

import { useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { listBuildRequests } from '@/lib/build/client';
import {
  installPreviewFromList,
  installPreviewWhileLoading,
  type InstallPreviewModel,
} from '@/lib/build/installPreview';

/**
 * Loads the store build list for Brand, Preview, and Settings.
 * Starts in loading so a finished install is not covered before the list returns.
 * A refresh keeps an already-known install on screen.
 */
export function useReadyInstallPreview(refreshKey: string): InstallPreviewModel {
  const [snapshot, setSnapshot] = useState<{ key: string; model: InstallPreviewModel }>({
    key: refreshKey,
    model: { phase: 'loading', installs: [] },
  });

  const model = snapshot.key === refreshKey ? snapshot.model : installPreviewWhileLoading(snapshot.model);

  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getToken();
    if (!token) {
      setSnapshot((current) => {
        const base = current.key === refreshKey ? current.model : installPreviewWhileLoading(current.model);
        return { key: refreshKey, model: installPreviewFromList(base, { kind: 'error' }) };
      });
      return;
    }
    void listBuildRequests(token).then((result) => {
      if (cancelled) return;
      const list = result.kind === 'ok' ? result : { kind: 'error' as const };
      setSnapshot((current) => {
        const base = current.key === refreshKey ? current.model : installPreviewWhileLoading(current.model);
        return { key: refreshKey, model: installPreviewFromList(base, list) };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return model;
}
