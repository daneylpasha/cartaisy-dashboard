'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { planBrandAssetSave, saveStoredBrandAsset, uploadBrandAsset } from '@/lib/onboarding/branding';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import { loadShopifySnapshot } from '@/lib/onboarding/shopifyConnect';
import { useReadyInstallPreview } from '@/hooks/useReadyInstallPreview';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';
import {
  settingsBrandImageUrl,
  StoreAppBrandView,
} from '@/components/settings/StoreAppBrandView';

const QUIET_SYNC: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

interface StoreAppBrandProps {
  draft: BrandingDraft | null;
  setDraft: Dispatch<SetStateAction<BrandingDraft | null>>;
  loading: boolean;
  loadError: string | null;
  refreshKey: number;
  onRetry: () => void;
  appName: string;
}

export function StoreAppBrand({
  draft,
  setDraft,
  loading,
  loadError,
  refreshKey,
  onRetry,
  appName,
}: StoreAppBrandProps) {
  const installPreview = useReadyInstallPreview('settings');
  const { data: session, status } = useSession();
  const storeId = session?.user?.storeId?.trim() || null;
  const assetRequestRef = useRef({ icon: 0, splash: 0 });
  const persistedIconRef = useRef<string | null>(null);
  const persistedSplashRef = useRef<string | null>(null);
  const seenName = useRef<string | null>(null);
  const blobs = useRef(new Set<string>());

  const [catalog, setCatalog] = useState<LockedCatalog>(EMPTY_CATALOG);
  const [sync, setSync] = useState<SyncGate>(QUIET_SYNC);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [iconUploading, setIconUploading] = useState(false);
  const [splashUploading, setSplashUploading] = useState(false);

  useEffect(() => {
    const current = blobs.current;
    return () => {
      for (const url of current) URL.revokeObjectURL(url);
      current.clear();
    };
  }, []);

  useEffect(() => {
    if (!draft) return;
    if (draft.iconPersisted) persistedIconRef.current = draft.iconUrl;
    if (draft.splashPersisted) persistedSplashRef.current = draft.splashUrl;
  }, [draft]);

  useEffect(() => {
    const next = appName.trim();
    if (seenName.current === null) {
      seenName.current = next;
      return;
    }
    if (seenName.current === next) return;
    seenName.current = next;
    if (!next) return;
    setDraft((current) => (current && current.appName !== next ? { ...current, appName: next } : current));
  }, [appName, setDraft]);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    const token = tokenStorage.getToken();

    async function loadSnapshot() {
      if (!storeId || !token) return;
      const snapshot = await loadShopifySnapshot(token).catch(() => null);
      if (cancelled || !snapshot) return;
      setCatalog(snapshot.catalog);
      setSync(snapshot.sync);
    }

    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [status, storeId, refreshKey]);

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
      retrying={loading && refreshKey > 0}
      onRetry={() => {
        if (loading || iconUploading || splashUploading) return;
        setFieldError(null);
        onRetry();
      }}
      onIconFile={(file) => void handleBrandAsset('icon', file)}
      onSplashFile={(file) => void handleBrandAsset('splash', file)}
      onImageError={setFieldError}
      installPreview={installPreview}
    />
  );
}
