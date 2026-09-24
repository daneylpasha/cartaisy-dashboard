import { safeImageUrl } from '@/lib/onboarding/normalizers';
import type { BrandingDraft } from '@/lib/onboarding/types';

const TOKEN_SHAPED = /shpat_|shpss_|shpca_|shpct_|shpua_|access_token|bearer\s/i;

/** Http(s) image safe to draw. Blob previews are allowed. Token-shaped URLs are not. */
export function displayBrandImageUrl(value: string | null): string | null {
  const url = safeImageUrl(value);
  if (!url) return null;
  if (url.startsWith('blob:')) return url;
  if (TOKEN_SHAPED.test(url)) return null;
  return url;
}

/** Https URL safe to store. Blob and token-shaped values are rejected. */
export function persistedBrandImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = displayBrandImageUrl(value.trim());
  if (!url || !url.startsWith('https:')) return null;
  return url;
}

export interface StoredBrandAssets {
  iconUrl: string | null;
  splashUrl: string | null;
}

export const EMPTY_STORED_BRAND_ASSETS: StoredBrandAssets = {
  iconUrl: null,
  splashUrl: null,
};

/**
 * Backend branding wins when it already returned an icon or splash.
 * Stored dashboard URLs fill the gaps so a reload still shows the assets
 * the branding payload does not include yet.
 */
export function mergeStoredBrandAssets(draft: BrandingDraft, stored: StoredBrandAssets): BrandingDraft {
  const iconUrl = draft.iconUrl ?? stored.iconUrl;
  const splashUrl = draft.splashUrl ?? stored.splashUrl;
  return {
    ...draft,
    iconUrl,
    splashUrl,
    iconPersisted: true,
    splashPersisted: true,
  };
}
