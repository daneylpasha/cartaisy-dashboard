'use client';

import { useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { listBuildRequests } from '@/lib/build/client';
import type { BuildRequest } from '@/lib/build/contract';
import type { StoreCredentialsStatus } from '@/lib/storeCredentials/contract';
import { EMPTY_STORE_SUBMITS } from '@/lib/storeSubmit/contract';
import { useStoreSubmits } from '@/lib/storeSubmit/useStoreSubmits';
import { StoreSubmitSettingsView } from '@/components/build/StoreSubmitSettingsView';

export function StoreSubmitSettings({
  credentialPhase,
  credentials,
}: {
  credentialPhase: 'loading' | 'error' | 'ready';
  credentials: StoreCredentialsStatus | null;
}) {
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
  const [request, setRequest] = useState<BuildRequest | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const submits = useStoreSubmits(phase === 'ready' ? (request?.id ?? null) : null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = tokenStorage.getToken();
      if (!token) {
        if (!cancelled) {
          setRequest(null);
          setPhase('error');
        }
        return;
      }
      const list = await listBuildRequests(token);
      if (cancelled) return;
      if (list.kind === 'error') {
        setRequest(null);
        setPhase('error');
        return;
      }
      setRequest(list.requests[0] ?? null);
      setPhase('ready');
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  return (
    <StoreSubmitSettingsView
      phase={phase}
      request={request}
      credentialPhase={credentialPhase}
      credentials={credentials}
      jobs={phase === 'ready' ? submits.jobs : EMPTY_STORE_SUBMITS}
      busy={submits.busy}
      errors={submits.errors}
      onSubmit={(platform) => {
        void submits.start(platform);
      }}
      onRetry={() => {
        setPhase('loading');
        setLoadKey((value) => value + 1);
      }}
    />
  );
}
