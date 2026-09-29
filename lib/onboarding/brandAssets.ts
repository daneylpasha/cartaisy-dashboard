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

const BRAND_MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type BrandMime = keyof typeof BRAND_MIME_EXT;

/** Shown when a saved logo cannot be copied onto the app icon. */
export const USE_LOGO_AS_ICON_ERROR = 'We could not use that logo. Add an image for the app icon.';

/** Shown when a saved logo cannot be copied onto the splash. */
export const USE_LOGO_AS_SPLASH_ERROR = 'We could not use that logo. Add an image for the splash.';

/**
 * Https or in-memory blob image that can be drawn or copied.
 * Token-shaped and other URLs, including plain http, are not drawable.
 */
export function drawableBrandImageUrl(value: string | null): string | null {
  if (typeof value !== 'string') return null;
  const url = displayBrandImageUrl(value.trim());
  if (!url) return null;
  if (url.startsWith('https:') || url.startsWith('blob:')) return url;
  return null;
}

function mimeFromHeader(value: string): BrandMime | null {
  const normalized = value.split(';')[0]?.trim().toLowerCase() ?? '';
  if (normalized === 'image/jpg' || normalized === 'image/pjpeg') return 'image/jpeg';
  if (normalized === 'image/jpeg' || normalized === 'image/png' || normalized === 'image/webp') {
    return normalized;
  }
  return null;
}

function mimeFromPath(url: string): BrandMime | null {
  if (url.startsWith('blob:')) return null;
  try {
    const ext = new URL(url).pathname.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
  } catch {
    return null;
  }
  return null;
}

function brandMime(blobType: string, url: string): BrandMime | null {
  const fromHeader = mimeFromHeader(blobType);
  if (fromHeader) return fromHeader;
  const bare = blobType.split(';')[0]?.trim().toLowerCase() ?? '';
  if (bare && bare !== 'application/octet-stream' && bare !== 'binary/octet-stream') return null;
  return mimeFromPath(url);
}

/**
 * Reads a drawable logo into a file for the existing icon or splash upload.
 * A failed fetch, an empty body, or a non-image response returns null.
 * This does not invent a URL.
 */
export async function fileFromDrawableLogo(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<File | null> {
  const safe = drawableBrandImageUrl(url);
  if (!safe) return null;
  try {
    const response = await fetchImpl(safe);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size <= 0) return null;
    const mime = brandMime(blob.type, safe);
    if (!mime) return null;
    return new File([blob], `logo.${BRAND_MIME_EXT[mime]}`, { type: mime });
  } catch {
    return null;
  }
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

/** Shown when the signed store-image upload is refused by `canUpload` or register. */
export const IMAGE_LIMIT_MESSAGE =
  'You have reached the image limit. Remove an unused image, then try again.';

export interface SignedUploadCredentials {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export type SignedUploadGate =
  | { ok: true; credentials: SignedUploadCredentials }
  | { ok: false; reason: 'quota' | 'invalid' };

function readNonEmpty(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * The notification image uploader only uploads when `canUpload` is true.
 * A false flag is the quota refusal. A missing flag is not treated as permission.
 */
export function readSignedUploadSignature(data: Record<string, unknown> | null): SignedUploadGate {
  if (!data) return { ok: false, reason: 'invalid' };
  if (data.canUpload === false) return { ok: false, reason: 'quota' };
  if (data.canUpload !== true) return { ok: false, reason: 'invalid' };

  const signature = readNonEmpty(data.signature);
  const cloudName = readNonEmpty(data.cloudName);
  const apiKey = readNonEmpty(data.apiKey);
  const folder = readNonEmpty(data.folder);
  const timestamp =
    typeof data.timestamp === 'number'
      ? data.timestamp
      : typeof data.timestamp === 'string' && data.timestamp.trim() !== ''
        ? Number(data.timestamp)
        : Number.NaN;
  if (!signature || !cloudName || !apiKey || !folder || !Number.isFinite(timestamp)) {
    return { ok: false, reason: 'invalid' };
  }
  return {
    ok: true,
    credentials: { signature, timestamp, cloudName, apiKey, folder },
  };
}

/** Body for `POST /notifications/stores/:storeId/images/register`. */
export interface StoreImageRegistration {
  publicId: string;
  url: string;
  secureUrl: string;
  size: number;
  width?: number;
  height?: number;
  format?: string;
}

function plainRemoteUrl(value: unknown): string | null {
  const raw = readNonEmpty(value);
  if (!raw || TOKEN_SHAPED.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Cloudinary's upload response, reduced to the fields the register route requires. */
export function registerPayloadFromCloudinary(result: Record<string, unknown> | null): StoreImageRegistration | null {
  if (!result) return null;
  const publicId = readNonEmpty(result.public_id);
  const url = plainRemoteUrl(result.url);
  const secureUrl = persistedBrandImageUrl(readNonEmpty(result.secure_url));
  const size = typeof result.bytes === 'number' && Number.isFinite(result.bytes) && result.bytes > 0 ? result.bytes : null;
  if (!publicId || !url || !secureUrl || size === null) return null;
  if (TOKEN_SHAPED.test(publicId)) return null;

  const width = typeof result.width === 'number' && Number.isFinite(result.width) ? result.width : undefined;
  const height = typeof result.height === 'number' && Number.isFinite(result.height) ? result.height : undefined;
  const format = readNonEmpty(result.format) ?? undefined;
  return { publicId, url, secureUrl, size, width, height, format };
}

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
