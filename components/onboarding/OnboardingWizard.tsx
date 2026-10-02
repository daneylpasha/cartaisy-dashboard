'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { APP_NAME_WORDMARK_MESSAGE, isPlatformWordmark } from '@/lib/onboarding/appName';
import { mergeStoredBrandAssets } from '@/lib/onboarding/brandAssets';
import {
  brandColorPatch,
  brandColorSelection,
  emptyBrandingDraft,
  fetchBranding,
  fetchStoreProfile,
  planBrandAssetSave,
  saveAppName,
  saveBrandColors,
  saveStoredBrandAsset,
  uploadBrandAsset,
  uploadLogo,
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
import { useReadyInstallPreview } from '@/hooks/useReadyInstallPreview';
import { withCatalogBlock } from '@/lib/shopify/catalogBlock';
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
import { usePendingShopifyClaim } from '@/hooks/usePendingShopifyClaim';
import { merchantMessageForShopifyAction, shopifyReturnCopy, type ShopifyReturnCopy } from '@/lib/shopify/merchantCopy';

const EMPTY_CONNECTION: ShopifyConnectionSnapshot = {
  statusKnown: false,
  isConnected: false,
  shopDomain: null,
  shopId: null,
  connectedAt: null,
  lastSyncAt: null,
  webhookRegistrationError: null,
};

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion();
  const { data: session, status } = useSession();
  const storeId = session?.user?.storeId;
  const sessionNameRef = useRef(session?.user?.storeName ?? '');
  sessionNameRef.current = session?.user?.storeName ?? '';
  const claim = usePendingShopifyClaim();
  const stepParam = searchParams.get('step');
  const step: OnboardingStep = isOnboardingStep(stepParam) ? stepParam : 'connect';
  const installPreview = useReadyInstallPreview(step === 'brand' || step === 'preview' ? 'brand-preview' : step);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connection, setConnection] = useState<ShopifyConnectionSnapshot>(EMPTY_CONNECTION);
  const [sync, setSync] = useState<SyncGate>(UNAVAILABLE_SYNC);
  const [catalog, setCatalog] = useState<LockedCatalog>(EMPTY_CATALOG);
  const [draft, setDraft] = useState<BrandingDraft>(emptyBrandingDraft(''));
  const [savedName, setSavedName] = useState('');
  const [savedPrimary, setSavedPrimary] = useState<string | null>(null);
  const [savedSecondary, setSavedSecondary] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [splashUploading, setSplashUploading] = useState(false);
  const [primaryValid, setPrimaryValid] = useState(true);
  const [secondaryValid, setSecondaryValid] = useState(true);
  const persistedLogoRef = useRef<string | null>(null);
  const persistedIconRef = useRef<string | null>(null);
  const persistedSplashRef = useRef<string | null>(null);
  const assetRequestRef = useRef({ icon: 0, splash: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const [returnNotice, setReturnNotice] = useState<ShopifyReturnCopy | null>(() =>
    searchParams.get('claim') === 'pending'
      ? null
      : shopifyReturnCopy(searchParams.get('shopify'), searchParams.get('reason') ?? searchParams.get('error'))
  );
  const [returnedShop, setReturnedShop] = useState<string | null>(() =>
    safeReturnedShop(searchParams.get('shop'))
  );
  const [syncing, setSyncing] = useState(false);
  const returnedConnected = useRef(
    searchParams.get('shopify') === 'connected' && searchParams.get('claim') !== 'pending'
  );
  const autoSyncStarted = useRef(false);
  const syncLock = useRef(false);
  if (searchParams.get('shopify') === 'connected' && searchParams.get('claim') !== 'pending') {
    returnedConnected.current = true;
  }
  if (claim.notice?.tone === 'success') {
    returnedConnected.current = true;
  }

  useEffect(() => {
    if (searchParams.get('claim') === 'pending') return;
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
    const snapshot = await loadShopifySnapshot(token);
    setConnection(snapshot.connection);
    setSync(snapshot.sync);
    setCatalog(snapshot.catalog);
  }, []);

  useEffect(() => {
    if (status === 'loading' || claim.claiming) return;

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

      const [snapshot, branding, profile] = await Promise.all([
        loadShopifySnapshot(token),
        fetchBranding(storeId, token),
        fetchStoreProfile(),
      ]);
      if (cancelled) return;

      setConnection(snapshot.connection);
      setCatalog(snapshot.catalog);
      if (!syncLock.current) setSync(snapshot.sync);

      const fallbackName = (profile.name || sessionName).trim();
      if (!branding) {
        setDraft(emptyBrandingDraft(fallbackName));
        persistedLogoRef.current = null;
        persistedIconRef.current = null;
        persistedSplashRef.current = null;
        setSavedName(fallbackName);
        setBrandingError('We could not load your brand. Try again before saving.');
      } else {
        const next = mergeStoredBrandAssets(
          {
            ...branding,
            appName: (branding.appName || fallbackName).trim(),
          },
          profile.brandAssets
        );
        setDraft(next);
        persistedLogoRef.current = next.logoUrl;
        persistedIconRef.current = next.iconUrl;
        persistedSplashRef.current = next.splashUrl;
        setSavedName(next.appName);
        const loadedColors = brandColorSelection(next);
        setSavedPrimary(loadedColors.primary);
        setSavedSecondary(loadedColors.secondary);
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
  }, [status, storeId, reloadKey, claim.claiming]);

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
      setSync(withCatalogBlock(terminal ? snapshot.sync : next, next.block ?? null));
    } finally {
      syncLock.current = false;
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (loading || syncing || !returnedConnected.current || autoSyncStarted.current) return;
    if (!connection.statusKnown || !connection.isConnected) return;
    if (!shouldAutoStartCatalogSync(sync.state, sync.block)) return;
    autoSyncStarted.current = true;
    void runCatalogSync();
  }, [loading, syncing, connection.statusKnown, connection.isConnected, sync.state, sync.block, runCatalogSync]);

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
        setSync(withCatalogBlock(terminal ? snapshot.sync : next, next.block ?? null));
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
  const connectNotice = step === 'connect' ? (claim.notice ?? returnNotice) : null;

  const handleBrandAsset = async (kind: 'icon' | 'splash', file: File) => {
    const token = tokenStorage.getToken();
    const label = kind === 'icon' ? 'app icon' : 'splash image';
    if (!storeId || !token) {
      setFieldError(`Sign in again to upload the ${label}.`);
      return;
    }

    const requestId = ++assetRequestRef.current[kind];
    const previewUrl = URL.createObjectURL(file);
    const persistedRef = kind === 'icon' ? persistedIconRef : persistedSplashRef;
    const setUploading = kind === 'icon' ? setIconUploading : setSplashUploading;

    setDraft((current) => {
      const previous = kind === 'icon' ? current.iconUrl : current.splashUrl;
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
      if (kind === 'icon') return { ...current, iconUrl: previewUrl, iconPersisted: false };
      return { ...current, splashUrl: previewUrl, splashPersisted: false };
    });
    setUploading(true);
    setFieldError(null);

    const uploaded = await uploadBrandAsset(storeId, token, kind, file);
    if (assetRequestRef.current[kind] !== requestId) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    const plan = planBrandAssetSave(uploaded);
    let url: string | null = plan.persist === 'none' ? null : plan.url;
    let saveError: string | null = plan.persist === 'none' ? plan.error : null;
    if (plan.persist === 'dashboard') {
      const saved = await saveStoredBrandAsset(kind, plan.url);
      if (!saved.ok) {
        url = null;
        saveError = saved.error;
      }
    }

    if (assetRequestRef.current[kind] !== requestId) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    setUploading(false);
    if (!url) {
      URL.revokeObjectURL(previewUrl);
      setDraft((current) => {
        const showing = kind === 'icon' ? current.iconUrl : current.splashUrl;
        if (showing !== previewUrl) return current;
        if (kind === 'icon') return { ...current, iconUrl: persistedRef.current, iconPersisted: true };
        return { ...current, splashUrl: persistedRef.current, splashPersisted: true };
      });
      setFieldError(saveError ?? uploaded.error ?? `We could not upload the ${label}.`);
      return;
    }

    const persistedUrl = url;
    let applied = false;
    setDraft((current) => {
      const showing = kind === 'icon' ? current.iconUrl : current.splashUrl;
      if (showing !== previewUrl) return current;
      applied = true;
      if (kind === 'icon') return { ...current, iconUrl: persistedUrl, iconPersisted: true };
      return { ...current, splashUrl: persistedUrl, splashPersisted: true };
    });
    if (applied) persistedRef.current = persistedUrl;
    URL.revokeObjectURL(previewUrl);
  };

  const handleLogoFile = async (file: File) => {
    const token = tokenStorage.getToken();
    if (!storeId || !token) {
      setFieldError('Sign in again to upload a logo.');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setDraft((current) => {
      if (current.logoUrl?.startsWith('blob:')) URL.revokeObjectURL(current.logoUrl);
      return { ...current, logoUrl: previewUrl };
    });
    setLogoUploading(true);
    setFieldError(null);
    const result = await uploadLogo(storeId, token, file);
    setLogoUploading(false);
    if (!result.ok || !result.logoUrl) {
      URL.revokeObjectURL(previewUrl);
      setDraft((current) =>
        current.logoUrl === previewUrl ? { ...current, logoUrl: persistedLogoRef.current } : current
      );
      setFieldError(result.error ?? 'We could not upload the logo.');
      return;
    }
    const persisted = safeImageUrl(result.logoUrl);
    let applied = false;
    setDraft((current) => {
      if (current.logoUrl !== previewUrl) return current;
      applied = true;
      return { ...current, logoUrl: persisted };
    });
    if (applied) persistedLogoRef.current = persisted;
    URL.revokeObjectURL(previewUrl);
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
    if (isPlatformWordmark(name)) {
      setFieldError(APP_NAME_WORDMARK_MESSAGE);
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

    const colors = brandColorPatch(brandColorSelection(draft), {
      primary: savedPrimary,
      secondary: savedSecondary,
    });
    let savedColors: Awaited<ReturnType<typeof saveBrandColors>> | null = null;
    if (Object.keys(colors).length > 0) {
      savedColors = await saveBrandColors(storeId, token, colors);
      if (!savedColors.ok || !savedColors.draft) {
        setFieldError(savedColors.error);
        setSaving(false);
        return;
      }
      const nextColors = brandColorSelection(savedColors.draft);
      setSavedPrimary(nextColors.primary);
      setSavedSecondary(nextColors.secondary);
    }

    const savedDraft = savedColors?.draft ?? null;
    setDraft((current) => ({
      ...current,
      appName: name,
      ...(savedDraft
        ? {
            primaryColor: savedDraft.primaryColor,
            secondaryColor: savedDraft.secondaryColor,
            primaryExplicit: savedDraft.primaryExplicit ?? null,
            secondaryExplicit: savedDraft.secondaryExplicit ?? null,
          }
        : {}),
    }));
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
    <WizardChrome
      step={step}
      wide={step === 'brand' || step === 'preview'}
      appName={draft.appName}
      storeName={session?.user?.storeName}
      iconUrl={draft.iconUrl}
      logoUrl={draft.logoUrl}
    >
      <AnimatePresence mode="wait">
        <motion.div key={loading ? 'loading' : step} {...motionProps}>
          {loading ? (
            <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-sm text-slate-600">
                {claim.claiming ? 'Finishing your Shopify connection...' : 'Loading your store...'}
              </p>
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
              sync={sync}
              pending={refreshing}
              warning={warning}
              loadError={brandingError}
              fieldError={fieldError}
              saving={saving}
              logoUploading={logoUploading}
              iconUploading={iconUploading}
              splashUploading={splashUploading}
              primaryValid={primaryValid}
              secondaryValid={secondaryValid}
              onDraftChange={setDraft}
              onPrimaryValidity={setPrimaryValid}
              onSecondaryValidity={setSecondaryValid}
              onLogoFile={handleLogoFile}
              onSplashFile={(file) => void handleBrandAsset('splash', file)}
              onIconFile={(file) => void handleBrandAsset('icon', file)}
              onImageError={setFieldError}
              onBack={() => go('connect')}
              onContinue={handleSaveBrand}
              onRetry={() => setReloadKey((value) => value + 1)}
              installPreview={installPreview}
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
              installPreview={installPreview}
            />
          ) : (
            <ReadyStep
              draft={draft}
              connection={connection}
              sync={sync}
              productCount={catalog.productCount}
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
