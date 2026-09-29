import {
  applySettingsBrandProps,
  presentSettingsBrand,
  settingsBrandImageUrl,
  type SettingsBrandProps,
} from '@/components/settings/StoreAppBrandView';
import { mergeStoredBrandAssets, type StoredBrandAssets } from '@/lib/onboarding/brandAssets';
import { fetchBranding, fetchStoreProfile } from '@/lib/onboarding/branding';
import type { BrandingDraft } from '@/lib/onboarding/types';

export interface SettingsBrandingLoad {
  storeId: string;
  token: string;
  appName: string;
  fallbackLogo: string | null;
  loadBranding?: (storeId: string, token: string) => Promise<BrandingDraft | null>;
  loadProfile?: () => Promise<{ name: string | null; brandAssets: StoredBrandAssets }>;
}

/**
 * One branding GET for Settings → Store Branding.
 * Profile `brandAssets` fill an icon or splash the branding payload omitted.
 * Callers pass `loadBranding` only in checks.
 */
export async function loadSettingsBrandingDraft(input: SettingsBrandingLoad): Promise<BrandingDraft | null> {
  const loadBranding = input.loadBranding ?? fetchBranding;
  const loadProfile = input.loadProfile ?? fetchStoreProfile;
  const [branding, profile] = await Promise.all([
    loadBranding(input.storeId, input.token),
    loadProfile(),
  ]);
  if (!branding) return null;

  return presentSettingsBrand(
    mergeStoredBrandAssets(
      {
        ...branding,
        appName: (branding.appName || input.appName).trim(),
        logoUrl: branding.logoUrl ?? settingsBrandImageUrl(input.fallbackLogo),
      },
      profile.brandAssets
    )
  );
}

function propsFromDraft(draft: BrandingDraft): SettingsBrandProps {
  return {
    appName: draft.appName,
    logoUrl: draft.logoUrl,
    primaryColor: draft.primaryExplicit ?? null,
    secondaryColor: draft.secondaryExplicit ?? null,
  };
}

/** Logo upload or clear. Icon and splash stay on the draft. */
export function applySettingsLogo(draft: BrandingDraft, logoUrl: string | null): BrandingDraft {
  const current = propsFromDraft(draft);
  return applySettingsBrandProps(draft, current, { ...current, logoUrl });
}

/**
 * Color save or clear from the branding PATCH body.
 * Null is the platform default. Icon, splash, and logo stay put.
 */
export function applySettingsColors(
  draft: BrandingDraft,
  colors: { primaryColor: string | null; secondaryColor: string | null }
): BrandingDraft {
  const current = propsFromDraft(draft);
  return applySettingsBrandProps(draft, current, {
    ...current,
    primaryColor: colors.primaryColor,
    secondaryColor: colors.secondaryColor,
  });
}
