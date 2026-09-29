'use client';

import { StoreAppBrand } from '@/components/settings/StoreAppBrand';
import { StoreBrandingColors } from '@/components/settings/StoreBrandingColors';
import { StoreLogoUpload } from '@/components/settings/StoreLogoUpload';
import { useSettingsStoreBranding } from '@/hooks/useSettingsStoreBranding';
import { applySettingsColors, applySettingsLogo } from '@/lib/settings/storeBranding';

interface StoreBrandingSectionProps {
  storeName: string;
  appName: string;
  fallbackLogo?: string | null;
  onLogoChange: (logoUrl: string | null) => void;
  onColorsChange: (colors: { primaryColor: string | null; secondaryColor: string | null }) => void;
}

export function StoreBrandingSection({
  storeName,
  appName,
  fallbackLogo = null,
  onLogoChange,
  onColorsChange,
}: StoreBrandingSectionProps) {
  const { draft, setDraft, loading, loadError, refreshKey, retry } = useSettingsStoreBranding(
    appName,
    fallbackLogo
  );
  const initialLoading = loading && !draft;
  const blockedLoad = draft ? null : loadError;

  return (
    <>
      <StoreLogoUpload
        logoUrl={draft?.logoUrl ?? null}
        storeName={storeName}
        loading={initialLoading}
        onLogoChange={(logoUrl) => {
          setDraft((current) => (current ? applySettingsLogo(current, logoUrl) : current));
          onLogoChange(logoUrl);
        }}
      />
      <StoreBrandingColors
        primaryExplicit={draft?.primaryExplicit ?? null}
        secondaryExplicit={draft?.secondaryExplicit ?? null}
        loading={initialLoading}
        loadError={blockedLoad}
        onRetry={retry}
        onColorsChange={(colors) => {
          setDraft((current) => (current ? applySettingsColors(current, colors) : current));
          onColorsChange(colors);
        }}
      />
      <StoreAppBrand
        draft={draft}
        setDraft={setDraft}
        loading={loading}
        loadError={loadError}
        refreshKey={refreshKey}
        onRetry={retry}
        appName={appName}
      />
    </>
  );
}
