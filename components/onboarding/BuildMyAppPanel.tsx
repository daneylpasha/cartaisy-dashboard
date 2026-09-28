'use client';

import { useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { useSession } from '@/lib/auth';
import { mergeStoredBrandAssets } from '@/lib/onboarding/brandAssets';
import { emptyBrandingDraft, fetchBranding, fetchStoreProfile } from '@/lib/onboarding/branding';
import {
  createBuildRequest,
  fetchCatalogSync,
  getBuildRequest,
  loadBuildScreen,
  syncCatalogAgain,
  updateAccessNotes,
} from '@/lib/build/client';
import {
  BUILD_STATUS_POLL_MS,
  buildCreatePayload,
  isSameBuildSnapshot,
  shouldPollBuildRequest,
  type BuildRequest,
  type PrimaryBuildAction,
} from '@/lib/build/contract';
import { buildRequestAvailability } from '@/lib/onboarding/normalizers';
import type { ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';
import { recoveryStatusLine, shopifyRecoveryView } from '@/lib/shopify/recovery';
import { launcherDisplayName } from '@/components/onboarding/LauncherReadinessStrip';
import { BuildMyAppView } from '@/components/onboarding/BuildMyAppView';
import { fetchStoreCredentials } from '@/lib/storeCredentials/client';
import { CREDENTIAL_SIGN_IN_MESSAGE } from '@/lib/storeCredentials/contract';
import type { StoreAccountSnapshot } from '@/components/build/StoreCredentialsPanel';
import { useStoreSubmits } from '@/lib/storeSubmit/useStoreSubmits';

interface LauncherDraft {
  appName: string | null;
  iconUrl: string | null;
  splashUrl: string | null;
}

interface BuildMyAppPanelProps {
  connection: ShopifyConnectionSnapshot;
  initialSync: SyncGate;
  productCount: number | null;
  onConnectShopify: () => void;
  onCatalogUpdated: () => void;
  onRefreshConnection: () => Promise<void> | void;
  /** Wizard branding draft. When omitted, the panel reads branding itself. */
  launcher?: LauncherDraft;
  /** Live store-account status from the credential section. When omitted, this panel loads it. */
  storeAccounts?: StoreAccountSnapshot;
}

export function BuildMyAppPanel({
  connection,
  initialSync,
  productCount,
  onConnectShopify,
  onCatalogUpdated,
  onRefreshConnection,
  launcher,
  storeAccounts,
}: BuildMyAppPanelProps) {
  const { data: session, status: sessionStatus } = useSession();
  const hasLauncher = launcher !== undefined;
  const [fetchedLauncher, setFetchedLauncher] = useState<LauncherDraft | null>(null);
  const [sync, setSync] = useState(initialSync);
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [request, setRequest] = useState<BuildRequest | null>(null);
  const [composing, setComposing] = useState(false);
  const [android, setAndroid] = useState(true);
  const [ios, setIos] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fetchedAccounts, setFetchedAccounts] = useState<StoreAccountSnapshot | null>(null);

  const gate = buildRequestAvailability(sync, {
    isConnected: connection.isConnected,
    statusKnown: connection.statusKnown,
  });
  const recovery = shopifyRecoveryView({
    statusKnown: connection.statusKnown,
    isConnected: connection.isConnected,
    sync,
    productCount,
    webhookError: connection.webhookRegistrationError,
    lastSyncAt: connection.lastSyncAt,
  });
  const syncBusy = syncing || sync.state === 'in_progress';
  const availability = syncBusy
    ? { enabled: false as const, action: 'sync' as const, reason: 'Syncing your catalog…' }
    : gate;
  const mode = request && !composing ? 'status' : 'compose';
  const requestId = request?.id ?? null;
  const polling = Boolean(request && shouldPollBuildRequest(request));
  const accounts = storeAccounts ?? fetchedAccounts;
  const storeSubmits = useStoreSubmits(mode === 'status' ? requestId : null);

  useEffect(() => {
    if (storeAccounts) return;
    let cancelled = false;

    async function loadAccounts() {
      const token = tokenStorage.getToken();
      if (!token) {
        if (!cancelled) {
          setFetchedAccounts({ phase: 'error', credentials: null, loadError: CREDENTIAL_SIGN_IN_MESSAGE });
        }
        return;
      }
      const result = await fetchStoreCredentials(token);
      if (cancelled) return;
      if (!result.ok) {
        setFetchedAccounts({ phase: 'error', credentials: null, loadError: result.message });
        return;
      }
      setFetchedAccounts({ phase: 'ready', credentials: result.credentials, loadError: null });
    }

    void loadAccounts();
    return () => {
      cancelled = true;
    };
  }, [storeAccounts]);

  useEffect(() => {
    if (hasLauncher) return;
    let cancelled = false;

    async function loadLauncher() {
      if (sessionStatus === 'loading') return;
      const token = tokenStorage.getToken();
      const storeId = session?.user?.storeId;
      if (!token || !storeId) {
        if (!cancelled) setFetchedLauncher({ appName: null, iconUrl: null, splashUrl: null });
        return;
      }
      const [branding, profile] = await Promise.all([
        fetchBranding(storeId, token),
        fetchStoreProfile(),
      ]);
      if (cancelled) return;
      const draft = mergeStoredBrandAssets(branding ?? emptyBrandingDraft(''), profile.brandAssets);
      const appName =
        launcherDisplayName(branding?.appName) ??
        launcherDisplayName(profile.name) ??
        launcherDisplayName(session?.user?.storeName);
      setFetchedLauncher({ appName, iconUrl: draft.iconUrl, splashUrl: draft.splashUrl });
    }

    void loadLauncher();
    return () => {
      cancelled = true;
    };
  }, [hasLauncher, sessionStatus, session?.user?.storeId, session?.user?.storeName]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = tokenStorage.getToken();
        if (!token) {
          if (!cancelled) {
            setPhase('error');
            setLoadError('Sign in again to request a build.');
          }
          return;
        }

        const screen = await loadBuildScreen(token, {
          refreshConnection: loadKey > 0 ? () => onRefreshConnection() : undefined,
        });
        if (cancelled) return;

        setSync((current) =>
          screen.sync.state === 'unavailable' && current.state !== 'unavailable' ? current : screen.sync
        );

        if (screen.list.kind === 'error') {
          setPhase('error');
          setLoadError(screen.list.message);
          return;
        }

        const newest = screen.list.requests[0] ?? null;
        setRequest(newest);
        if (newest) {
          setNotes(newest.accessNotes ?? '');
          setAndroid(newest.platforms.android.status !== 'not_requested');
          setIos(newest.platforms.ios.status !== 'not_requested');
          setComposing(false);
        }
        setPhase('ready');
      } catch {
        if (!cancelled) {
          setPhase('error');
          setLoadError('We could not load your build. Try again.');
        }
      } finally {
        if (!cancelled) setRechecking(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadKey, onRefreshConnection]);

  useEffect(() => {
    if (!polling || !requestId) return;
    let cancelled = false;
    let timer = 0;
    let inFlight = false;

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void run();
      }, BUILD_STATUS_POLL_MS);
    };

    const run = async () => {
      if (cancelled || inFlight) return;
      const token = tokenStorage.getToken();
      if (!token) return;
      inFlight = true;
      const result = await getBuildRequest(token, requestId);
      inFlight = false;
      if (cancelled) return;
      if (result.kind === 'ok') {
        setRequest((current) => (isSameBuildSnapshot(current, result.request) ? current : result.request));
        if (shouldPollBuildRequest(result.request)) schedule();
        return;
      }
      if (result.kind === 'missing') {
        setRequest(null);
        setComposing(false);
        setFormError('We could not find that build. You can request it again.');
        return;
      }
      if (result.message) {
        setFormError(result.message);
        return;
      }
      schedule();
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible' || cancelled || inFlight) return;
      window.clearTimeout(timer);
      void run();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [polling, requestId]);

  useEffect(() => {
    if (sync.state !== 'in_progress' || syncing) return;
    let cancelled = false;
    let timer = 0;

    const schedule = () => {
      timer = window.setTimeout(async () => {
        const token = tokenStorage.getToken();
        if (!token || cancelled) return;
        const next = await fetchCatalogSync(token);
        if (cancelled) return;
        if (next.state === 'unavailable') {
          schedule();
          return;
        }
        setSync(next);
        if (next.state === 'in_progress') schedule();
      }, BUILD_STATUS_POLL_MS);
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sync.state, syncing]);

  const retry = () => {
    setFormError(null);
    if (phase === 'ready') setRechecking(true);
    else setPhase('loading');
    setLoadKey((value) => value + 1);
  };

  const handleSync = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setFormError('Sign in again to sync your catalog.');
      return;
    }
    setSyncing(true);
    setFormError(null);
    const next = await syncCatalogAgain(token);
    setSyncing(false);
    if (next.state === 'unavailable' && !next.eligibilityReason) {
      setFormError('We could not sync your catalog. Try again.');
      return;
    }
    setSync(next);
    onCatalogUpdated();
  };

  const handleSubmit = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setFormError('Sign in again to request a build.');
      return;
    }
    const payload = buildCreatePayload({ android, ios, accessNotes: notes });
    if (!payload.ok) {
      setFormError(payload.message);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const result = await createBuildRequest(token, payload.body);
    setSubmitting(false);
    if (result.kind === 'created') {
      setRequest(result.request);
      setComposing(false);
      setAndroid(result.request.platforms.android.status !== 'not_requested');
      setIos(result.request.platforms.ios.status !== 'not_requested');
      setNotes(result.request.accessNotes ?? '');
      return;
    }
    if (result.kind === 'ineligible') {
      setSync((current) => ({
        ...current,
        eligibleForBuild: false,
        eligibilityReason: result.reason,
      }));
      return;
    }
    setFormError(result.message);
  };

  const handlePrimary = (kind: PrimaryBuildAction['kind']) => {
    if (kind === 'connect') {
      onConnectShopify();
      return;
    }
    if (kind === 'retry') {
      retry();
      return;
    }
    if (kind === 'sync') {
      void handleSync();
      return;
    }
    if (kind === 'submit') {
      void handleSubmit();
    }
  };

  const handleNotesBlur = async () => {
    if (!request || composing) return;
    const token = tokenStorage.getToken();
    if (!token) return;
    const next = notes.trim();
    const saved = (request.accessNotes ?? '').trim();
    if (next === saved || next.length > 280) return;
    setNoteSaving(true);
    const result = await updateAccessNotes(token, request.id, next.length > 0 ? next : null);
    setNoteSaving(false);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setRequest(result.request);
    setNotes(result.request.accessNotes ?? '');
    setFormError(null);
  };

  return (
    <BuildMyAppView
      phase={phase}
      loadError={loadError}
      availability={availability}
      mode={mode}
      request={request}
      android={android}
      ios={ios}
      accessNotes={notes}
      submitting={submitting}
      rechecking={rechecking}
      syncBusy={syncBusy}
      noteSaving={noteSaving}
      formError={formError}
      statusLine={recoveryStatusLine(recovery)}
      webhookNote={recovery.webhookNote}
      appName={launcher ? launcher.appName : fetchedLauncher?.appName}
      iconUrl={launcher ? launcher.iconUrl : fetchedLauncher?.iconUrl}
      splashUrl={launcher ? launcher.splashUrl : fetchedLauncher?.splashUrl}
      launcherPending={launcher === undefined && fetchedLauncher === null}
      storeSubmit={
        mode === 'status' && request
          ? {
              credentialPhase: accounts?.phase ?? 'loading',
              credentials: accounts?.credentials ?? null,
              jobs: storeSubmits.jobs,
              busy: storeSubmits.busy,
              errors: storeSubmits.errors,
              onSubmit: (platform) => {
                void storeSubmits.start(platform);
              },
            }
          : null
      }
      onAndroidChange={setAndroid}
      onIosChange={setIos}
      onNotesChange={setNotes}
      onNotesBlur={() => {
        void handleNotesBlur();
      }}
      onPrimary={handlePrimary}
      onRequestAnother={() => {
        setComposing(true);
        setAndroid(true);
        setIos(true);
        setFormError(null);
      }}
      onCancelAnother={() => {
        setComposing(false);
        setFormError(null);
        if (!request) return;
        setAndroid(request.platforms.android.status !== 'not_requested');
        setIos(request.platforms.ios.status !== 'not_requested');
        setNotes(request.accessNotes ?? '');
      }}
      onRetry={retry}
    />
  );
}
