'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { fetchBranding, fetchStoreProfile, planBrandAssetSave, saveStoredBrandAsset, uploadBrandAsset } from '@/lib/onboarding/branding';
import { mergeStoredBrandAssets } from '@/lib/onboarding/brandAssets';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import { loadShopifySnapshot } from '@/lib/onboarding/shopifyConnect';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';
import {
  applySettingsBrandProps,
  presentSettingsBrand,
  settingsBrandImageUrl,
  StoreAppBrandView,
  type SettingsBrandProps,
} from '@/components/settings/StoreAppBrandView';

const QUIET_SYNC: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

interface StoreAppBrandProps {
  appName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

function brandProps(input: StoreAppBrandProps): SettingsBrandProps {
  return {
    appName: input.appName,
    logoUrl: input.logoUrl ?? null,
    primaryColor: input.primaryColor ?? null,
    secondaryColor: input.secondaryColor ?? null,
  };
}

export function StoreAppBrand({
  appName,
  logoUrl = null,
  primaryColor = null,
  secondaryColor = null,
}: StoreAppBrandProps) {
  const { data: session, status } = useSession();
  const storeId = session?.user?.storeId?.trim() || null;
  const propsRef = useRef(brandProps({ appName, logoUrl, primaryColor, secondaryColor }));
  propsRef.current = brandProps({ appName, logoUrl, primaryColor, secondaryColor });
  const seenProps = useRef<SettingsBrandProps | null>(null);
  const assetRequestRef = useRef({ icon: 0, splash: 0 });
  const persistedIconRef = useRef<string | null>(null);
  const persistedSplashRef = useRef<string | null>(null);
  const blobs = useRef(new Set<string>());

  const [draft, setDraft] = useState<BrandingDraft | null>(null);
  const [catalog, setCatalog] = useState<LockedCatalog>(EMPTY_CATALOG);
  const [sync, setSync] = useState<SyncGate>(QUIET_SYNC);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [iconUploading, setIconUploading] = useState(false);
  const [splashUploading, setSplashUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const current = blobs.current;
    return () => {
      for (const url of current) URL.revokeObjectURL(url);
      current.clear();
    };
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    const token = tokenStorage.getToken();
    const startedProps = propsRef.current;

    async function load() {
      if (!storeId || !token) {
        if (!cancelled) {
          setDraft(null);
          setLoadError('Sign in again to edit your app icon and splash.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const [branding, profile, snapshot] = await Promise.all([
        fetchBranding(storeId, token),
        fetchStoreProfile(),
        loadShopifySnapshot(token, storeId).catch(() => null),
      ]);
      if (cancelled) return;

      if (!branding) {
        setLoadError('We could not load your brand. Try again before replacing an image.');
        setLoading(false);
        return;
      }

      const merged = presentSettingsBrand(
        mergeStoredBrandAssets(
          {
            ...branding,
            // Blank stays blank. The in-app phone supplies its own placeholder.
            appName: (branding.appName || startedProps.appName).trim(),
            logoUrl: branding.logoUrl ?? settingsBrandImageUrl(startedProps.logoUrl),
          },
          profile.brandAssets
        )
      );
      const next = applySettingsBrandProps(merged, startedProps, propsRef.current);
      setDraft(next);
      persistedIconRef.current = next.iconUrl;
      persistedSplashRef.current = next.splashUrl;
      seenProps.current = propsRef.current;
      if (snapshot) {
        setCatalog(snapshot.catalog);
        setSync(snapshot.sync);
      }
      setLoadError(null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [status, storeId, reloadKey]);

  useEffect(() => {
    const next = brandProps({ appName, logoUrl, primaryColor, secondaryColor });
    const prev = seenProps.current;
    if (!prev) {
      seenProps.current = next;
      return;
    }
    if (
      prev.appName === next.appName &&
      prev.logoUrl === next.logoUrl &&
      prev.primaryColor === next.primaryColor &&
      prev.secondaryColor === next.secondaryColor
    ) {
      return;
    }
    seenProps.current = next;
    setDraft((current) => (current ? applySettingsBrandProps(current, prev, next) : current));
  }, [appName, logoUrl, primaryColor, secondaryColor]);

  function release(url: string | null) {
    if (!url?.startsWith('blob:')) return;
    if (blobs.current.delete(url)) URL.revokeObjectURL(url);
  }

  const handleBrandAsset = async (kind: 'icon' | 'splash', file: File) => {
    const token = tokenStorage.getToken();
    const label = kind === 'icon' ? 'app icon' : 'splash image';
    if (!storeId || !token) {
      setFieldError(`Sign in again to upload the ${label}.`);
      return;
    }

    const requestId = ++assetRequestRef.current[kind];
    const previewUrl = URL.createObjectURL(file);
    blobs.current.add(previewUrl);
    const persistedRef = kind === 'icon' ? persistedIconRef : persistedSplashRef;
    const setUploading = kind === 'icon' ? setIconUploading : setSplashUploading;

    setDraft((current) => {
      if (!current) return current;
      const previous = kind === 'icon' ? current.iconUrl : current.splashUrl;
      release(previous);
      if (kind === 'icon') return { ...current, iconUrl: previewUrl, iconPersisted: false };
      return { ...current, splashUrl: previewUrl, splashPersisted: false };
    });
    setUploading(true);
    setFieldError(null);

    const uploaded = await uploadBrandAsset(storeId, token, kind, file);
    if (assetRequestRef.current[kind] !== requestId) {
      release(previewUrl);
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
      release(previewUrl);
      return;
    }

    const persistedUrl = url ? settingsBrandImageUrl(url) : null;
    setUploading(false);
    if (!persistedUrl) {
      release(previewUrl);
      setDraft((current) => {
        if (!current) return current;
        const showing = kind === 'icon' ? current.iconUrl : current.splashUrl;
        if (showing !== previewUrl) return current;
        if (kind === 'icon') return { ...current, iconUrl: persistedRef.current, iconPersisted: true };
        return { ...current, splashUrl: persistedRef.current, splashPersisted: true };
      });
      setFieldError(saveError ?? uploaded.error ?? `We could not upload the ${label}.`);
      return;
    }

    let applied = false;
    setDraft((current) => {
      if (!current) return current;
      const showing = kind === 'icon' ? current.iconUrl : current.splashUrl;
      if (showing !== previewUrl) return current;
      applied = true;
      if (kind === 'icon') return { ...current, iconUrl: persistedUrl, iconPersisted: true };
      return { ...current, splashUrl: persistedUrl, splashPersisted: true };
    });
    if (applied) persistedRef.current = persistedUrl;
    release(previewUrl);
  };

  return (
    <StoreAppBrandView
      draft={draft}
      catalog={catalog}
      sync={sync}
      loadError={loadError}
      fieldError={fieldError}
      iconUploading={iconUploading}
      splashUploading={splashUploading}
      retrying={loading && reloadKey > 0}
      onRetry={() => {
        if (loading || iconUploading || splashUploading) return;
        setFieldError(null);
        setReloadKey((key) => key + 1);
      }}
      onIconFile={(file) => void handleBrandAsset('icon', file)}
      onSplashFile={(file) => void handleBrandAsset('splash', file)}
      onImageError={setFieldError}
    />
  );
}
