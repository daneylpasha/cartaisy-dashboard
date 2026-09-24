'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import {
  emptyBrandingDraft,
  fetchBranding,
  fetchStoreName,
  saveAppName,
  saveBrandColors,
  uploadLogo,
  uploadOptionalBrandAsset,
} from '@/lib/onboarding/branding';
import {
  EMPTY_CATALOG,
  UNAVAILABLE_SYNC,
  consumeShopifyReturnQuery,
  isOnboardingStep,
  onboardingSyncWarning,
  safeImageUrl,
  safeReturnedShop,
  shouldAutoStartCatalogSync,
} from '@/lib/onboarding/normalizers';
import {
  loadShopifySnapshot,
  onboardingReturnPath,
  startShopifyConnect,
} from '@/lib/onboarding/shopifyConnect';
import { fetchCatalogSync, syncCatalogAgain } from '@/lib/build/client';
import { BUILD_STATUS_POLL_MS } from '@/lib/build/contract';
import type {
  BrandingDraft,
  LockedCatalog,
  OnboardingStep,
  ShopifyConnectionSnapshot,
  SyncGate,
} from '@/lib/onboarding/types';
import { WizardChrome } from '@/components/onboarding/WizardChrome';
import { ConnectStep } from '@/components/onboarding/steps/ConnectStep';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { PreviewStep } from '@/components/onboarding/steps/PreviewStep';
import { ReadyStep } from '@/components/onboarding/steps/ReadyStep';
import { merchantMessageForShopifyAction, shopifyReturnCopy, type ShopifyReturnCopy } from '@/lib/shopify/merchantCopy';

const EMPTY_CONNECTION: ShopifyConnectionSnapshot = {
  statusKnown: false,
  isConnected: false,
  shopDomain: null,
  shopId: null,
  connectedAt: null,
};

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const { data: session, status } = useSession();
  const storeId = session?.user?.storeId;
  const sessionNameRef = useRef(session?.user?.storeName ?? '');
  sessionNameRef.current = session?.user?.storeName ?? '';
  const stepParam = searchParams.get('step');
  const step: OnboardingStep = isOnboardingStep(stepParam) ? stepParam : 'connect';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connection, setConnection] = useState<ShopifyConnectionSnapshot>(EMPTY_CONNECTION);
  const [sync, setSync] = useState<SyncGate>(UNAVAILABLE_SYNC);
  const [catalog, setCatalog] = useState<LockedCatalog>(EMPTY_CATALOG);
  const [draft, setDraft] = useState<BrandingDraft>(emptyBrandingDraft(''));
  const [savedName, setSavedName] = useState('');
  const [savedPrimary, setSavedPrimary] = useState(draft.primaryColor);
  const [savedSecondary, setSavedSecondary] = useState('');
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [primaryValid, setPrimaryValid] = useState(true);
  const [secondaryValid, setSecondaryValid] = useState(true);
  const [splashFile, setSplashFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [returnNotice, setReturnNotice] = useState<ShopifyReturnCopy | null>(() =>
    shopifyReturnCopy(searchParams.get('shopify'), searchParams.get('reason') ?? searchParams.get('error'))
  );
  const [returnedShop, setReturnedShop] = useState<string | null>(() =>
    safeReturnedShop(searchParams.get('shop'))
  );
  const [syncing, setSyncing] = useState(false);
  const returnedConnected = useRef(searchParams.get('shopify') === 'connected');
  const autoSyncStarted = useRef(false);
  const syncLock = useRef(false);
  if (searchParams.get('shopify') === 'connected') {
    returnedConnected.current = true;
  }

  useEffect(() => {
    const current = searchParams.toString();
    const consumed = consumeShopifyReturnQuery(current);
    if (!consumed.changed) return;
    const copy = shopifyReturnCopy(
      searchParams.get('shopify'),
      searchParams.get('reason') ?? searchParams.get('error')
    );
    if (copy) setReturnNotice(copy);
    const shop = safeReturnedShop(searchParams.get('shop'));
    if (shop) setReturnedShop(shop);
    router.replace(consumed.query ? `/dashboard/onboarding?${consumed.query}` : '/dashboard/onboarding?step=connect');
  }, [searchParams, router]);

  const go = useCallback(
    (next: OnboardingStep) => {
      router.push(`/dashboard/onboarding?step=${next}`);
    },
    [router]
  );

  const refreshShopifySnapshot = useCallback(async () => {
    const token = tokenStorage.getToken();
    if (!token) return;
    const snapshot = await loadShopifySnapshot(token, storeId);
    setConnection(snapshot.connection);
    setSync(snapshot.sync);
    setCatalog(snapshot.catalog);
  }, [storeId]);

  useEffect(() => {
    if (status === 'loading') return;

    let cancelled = false;
    const token = tokenStorage.getToken();
    const sessionName = sessionNameRef.current;

    async function load() {
      if (!storeId || !token) {
        if (!cancelled) {
          setBrandingError('Sign in again to continue setup.');
          setLoading(false);
        }
        return;
      }

      const [snapshot, branding, storeName] = await Promise.all([
        loadShopifySnapshot(token, storeId),
        fetchBranding(storeId, token),
        fetchStoreName(),
      ]);
      if (cancelled) return;

      setConnection(snapshot.connection);
      setCatalog(snapshot.catalog);
      if (!syncLock.current) setSync(snapshot.sync);

      const fallbackName = (storeName || sessionName).trim();
      if (!branding) {
        setDraft(emptyBrandingDraft(fallbackName));
        setSavedName(fallbackName);
        setBrandingError('We could not load your brand. Try again before saving.');
      } else {
        const next: BrandingDraft = {
          ...branding,
          appName: (branding.appName || fallbackName).trim(),
        };
        setDraft(next);
        setSavedName(next.appName);
        setSavedPrimary(next.primaryColor);
        setSavedSecondary(next.secondaryColor);
        setBrandingError(null);
      }
      setLoading(false);
      setRefreshing(false);
    }

    setRefreshing(reloadKey > 0);
    void load();
    return () => {
      cancelled = true;
    };
  }, [status, storeId, reloadKey]);

  const runCatalogSync = useCallback(async () => {
    if (syncLock.current) return;
    const token = tokenStorage.getToken();
    if (!token) {
      setSync((current) => ({
        ...current,
        state: 'failed',
        detail: merchantMessageForShopifyAction('sync', 401, ''),
        eligibleForBuild: false,
      }));
      return;
    }

    syncLock.current = true;
    setSyncing(true);
    setSync((current) => ({
      ...current,
      state: 'in_progress',
      detail: null,
      eligibleForBuild: false,
    }));

    try {
      const next = await syncCatalogAgain(token);
      if (next.state === 'in_progress') {
        setSync(next);
        return;
      }
      if (next.state === 'unavailable') {
        setSync({
          state: 'failed',
          detail: merchantMessageForShopifyAction('sync', 500, ''),
          eligibleForBuild: false,
          eligibilityReason: null,
        });
        return;
      }

      const snapshot = await loadShopifySnapshot(token);
      setConnection(snapshot.connection);
      setCatalog(snapshot.catalog);
      const terminal = snapshot.sync.state === 'succeeded' || snapshot.sync.state === 'failed';
      setSync(terminal ? snapshot.sync : next);
    } finally {
      syncLock.current = false;
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (loading || syncing || !returnedConnected.current || autoSyncStarted.current) return;
    if (!connection.statusKnown || !connection.isConnected) return;
    if (!shouldAutoStartCatalogSync(sync.state)) return;
    autoSyncStarted.current = true;
    void runCatalogSync();
  }, [loading, syncing, connection.statusKnown, connection.isConnected, sync.state, runCatalogSync]);

  useEffect(() => {
    if (syncing || sync.state !== 'in_progress') return;
    let cancelled = false;

    const timer = window.setInterval(() => {
      void (async () => {
        const token = tokenStorage.getToken();
        if (!token || cancelled || syncLock.current) return;
        const next = await fetchCatalogSync(token);
        if (cancelled || next.state === 'unavailable' || next.state === 'in_progress') return;
        const snapshot = await loadShopifySnapshot(token);
        if (cancelled || syncLock.current) return;
        setConnection(snapshot.connection);
        setCatalog(snapshot.catalog);
        const terminal = snapshot.sync.state === 'succeeded' || snapshot.sync.state === 'failed';
        setSync(terminal ? snapshot.sync : next);
      })();
    }, BUILD_STATUS_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sync.state, syncing]);

  const warning = onboardingSyncWarning({
    statusKnown: connection.statusKnown,
    isConnected: connection.isConnected,
    sync,
  });
  const connectNotice = step === 'connect' ? returnNotice : null;

  const rememberLocalImage = (kind: 'splash' | 'icon', file: File) => {
    const nextUrl = URL.createObjectURL(file);
    setDraft((current) => {
      const previous = kind === 'splash' ? current.splashUrl : current.iconUrl;
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
      if (kind === 'splash') {
        return { ...current, splashUrl: nextUrl, splashPersisted: false };
      }
      return { ...current, iconUrl: nextUrl, iconPersisted: false };
    });
    if (kind === 'splash') setSplashFile(file);
    else setIconFile(file);
  };

  const handleLogoFile = async (file: File) => {
    const token = tokenStorage.getToken();
    if (!storeId || !token) {
      setFieldError('Sign in again to upload a logo.');
      return;
    }
    setLogoUploading(true);
    setFieldError(null);
    const result = await uploadLogo(storeId, token, file);
    setLogoUploading(false);
    if (!result.ok || !result.logoUrl) {
      setFieldError(result.error ?? 'We could not upload the logo.');
      return;
    }
    setDraft((current) => ({ ...current, logoUrl: safeImageUrl(result.logoUrl) }));
  };

  const handleStart = async (shopDomain: string) => {
    const token = tokenStorage.getToken();
    if (!token) {
      setStartError('Sign in again to connect Shopify.');
      return;
    }
    setStarting(true);
    setStartError(null);
    const result = await startShopifyConnect(token, shopDomain, onboardingReturnPath());
    if (result.authorizationUrl) {
      window.location.assign(result.authorizationUrl);
      return;
    }
    setStartError(result.error);
    setStarting(false);
  };

  const handleSaveBrand = async () => {
    const token = tokenStorage.getToken();
    if (!storeId || !token) {
      setFieldError('Sign in again to save your brand.');
      return;
    }

    const name = draft.appName.trim();
    if (name.length < 2) {
      setFieldError('Enter an app name with at least 2 characters.');
      return;
    }

    setSaving(true);
    setFieldError(null);

    if (name !== savedName) {
      const saved = await saveAppName(name);
      if (!saved.ok) {
        setFieldError(saved.error);
        setSaving(false);
        return;
      }
      setSavedName(name);
    }

    const colors: { primaryColor?: string; secondaryColor?: string } = {};
    if (draft.primaryColor !== savedPrimary) colors.primaryColor = draft.primaryColor;
    if (draft.secondaryColor && draft.secondaryColor !== savedSecondary) {
      colors.secondaryColor = draft.secondaryColor;
    }
    if (Object.keys(colors).length > 0) {
      const saved = await saveBrandColors(storeId, token, colors);
      if (!saved.ok) {
        setFieldError(saved.error);
        setSaving(false);
        return;
      }
      setSavedPrimary(saved.draft?.primaryColor ?? draft.primaryColor);
      setSavedSecondary(saved.draft?.secondaryColor ?? draft.secondaryColor);
    }

    let next = { ...draft, appName: name };
    if (splashFile) {
      const uploaded = await uploadOptionalBrandAsset(storeId, token, 'splash', splashFile);
      if (uploaded.persisted && uploaded.url) {
        if (next.splashUrl?.startsWith('blob:')) URL.revokeObjectURL(next.splashUrl);
        next = { ...next, splashUrl: uploaded.url, splashPersisted: true };
        setSplashFile(null);
      } else {
        next = { ...next, splashPersisted: false };
      }
    }
    if (iconFile) {
      const uploaded = await uploadOptionalBrandAsset(storeId, token, 'icon', iconFile);
      if (uploaded.persisted && uploaded.url) {
        if (next.iconUrl?.startsWith('blob:')) URL.revokeObjectURL(next.iconUrl);
        next = { ...next, iconUrl: uploaded.url, iconPersisted: true };
        setIconFile(null);
      } else {
        next = { ...next, iconPersisted: false };
      }
    }

    setDraft(next);
    setSaving(false);
    go('preview');
  };

  const motionProps = reducedMotion
    ? { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <WizardChrome step={step} wide={step === 'preview'}>
      <AnimatePresence mode="wait">
        <motion.div key={loading ? 'loading' : step} {...motionProps}>
          {loading ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-sm text-slate-600">Loading your store...</p>
            </section>
          ) : brandingError && !storeId ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">Set up your app</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{brandingError}</p>
            </section>
          ) : step === 'connect' ? (
            <ConnectStep
              connection={connection}
              sync={sync}
              catalog={catalog}
              warning={warning}
              checking={refreshing}
              startError={startError}
              starting={starting}
              returnNotice={connectNotice}
              suggestedShop={returnedShop}
              syncing={syncing}
              onStart={handleStart}
              onContinue={() => go('brand')}
              onRefresh={() => setReloadKey((value) => value + 1)}
              onSyncAgain={() => void runCatalogSync()}
            />
          ) : step === 'brand' ? (
            <BrandingStep
              draft={draft}
              connection={connection}
              catalog={catalog}
              warning={warning}
              loadError={brandingError}
              fieldError={fieldError}
              saving={saving}
              logoUploading={logoUploading}
              primaryValid={primaryValid}
              secondaryValid={secondaryValid}
              onDraftChange={setDraft}
              onPrimaryValidity={setPrimaryValid}
              onSecondaryValidity={setSecondaryValid}
              onLogoFile={handleLogoFile}
              onSplashFile={(file) => rememberLocalImage('splash', file)}
              onIconFile={(file) => rememberLocalImage('icon', file)}
              onImageError={setFieldError}
              onBack={() => go('connect')}
              onContinue={handleSaveBrand}
              onRetry={() => setReloadKey((value) => value + 1)}
            />
          ) : step === 'preview' ? (
            <PreviewStep
              draft={draft}
              catalog={catalog}
              sync={sync}
              pending={refreshing}
              onBack={() => go('brand')}
              onContinue={() => go('ready')}
              onRetry={() => setReloadKey((value) => value + 1)}
            />
          ) : (
            <ReadyStep
              connection={connection}
              sync={sync}
              onBack={() => go('preview')}
              onConnectShopify={() => go('connect')}
              onCatalogUpdated={() => setReloadKey((value) => value + 1)}
              onRefreshConnection={refreshShopifySnapshot}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </WizardChrome>
  );
}
