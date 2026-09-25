import { API_URL } from '@/lib/api/mutator/custom-instance';
import {
  displayBrandImageUrl,
  EMPTY_STORED_BRAND_ASSETS,
  IMAGE_LIMIT_MESSAGE,
  persistedBrandImageUrl,
  readSignedUploadSignature,
  registerPayloadFromCloudinary,
  type StoredBrandAssets,
} from '@/lib/onboarding/brandAssets';
import type { BrandingDraft } from '@/lib/onboarding/types';

export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const DEFAULT_PRIMARY_COLOR = '#FF6B6B';

const BRAND_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const BRAND_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export interface BrandImageValidation {
  ok: boolean;
  message: string | null;
}

export function validateBrandImage(file: File): BrandImageValidation {
  if (!BRAND_IMAGE_TYPES.includes(file.type as (typeof BRAND_IMAGE_TYPES)[number])) {
    return { ok: false, message: 'Use a JPG, PNG, or WebP image.' };
  }
  if (file.size > BRAND_IMAGE_MAX_BYTES) {
    return { ok: false, message: 'Image must be under 2MB.' };
  }
  return { ok: true, message: null };
}

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function brandingRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

export function emptyBrandingDraft(appName: string): BrandingDraft {
  return {
    appName,
    logoUrl: null,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: '',
    splashUrl: null,
    iconUrl: null,
    splashPersisted: true,
    iconPersisted: true,
  };
}

export function brandingFromPayload(payload: unknown, appName: string): BrandingDraft {
  const data = brandingRecord(payload);
  if (!data) return emptyBrandingDraft(appName);

  const primary = readString(data.primaryColor);
  const secondary = readString(data.secondaryColor) ?? '';
  const serverName = readString(data.appName);

  return {
    appName: serverName ?? appName,
    logoUrl: displayBrandImageUrl(readString(data.logoUrl)),
    primaryColor: primary && HEX_COLOR_REGEX.test(primary) ? primary : DEFAULT_PRIMARY_COLOR,
    secondaryColor: secondary && HEX_COLOR_REGEX.test(secondary) ? secondary : '',
    splashUrl: displayBrandImageUrl(readString(data.splashUrl) ?? readString(data.splashImageUrl)),
    iconUrl: displayBrandImageUrl(readString(data.iconUrl) ?? readString(data.appIconUrl)),
    splashPersisted: true,
    iconPersisted: true,
  };
}

export async function fetchBranding(storeId: string, token: string): Promise<BrandingDraft | null> {
  try {
    const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding`, {
      headers: authHeaders(token),
    });
    const body = await readJson(response);
    if (!response.ok) return null;
    return brandingFromPayload(body, '');
  } catch {
    return null;
  }
}

export async function fetchStoreProfile(): Promise<{ name: string | null; brandAssets: StoredBrandAssets }> {
  try {
    const response = await fetch('/api/store');
    const body = (await readJson(response)) as {
      data?: { name?: unknown; brandAssets?: unknown };
    } | null;
    if (!response.ok || !body?.data) {
      return { name: null, brandAssets: EMPTY_STORED_BRAND_ASSETS };
    }
    const assets =
      body.data.brandAssets && typeof body.data.brandAssets === 'object'
        ? (body.data.brandAssets as Record<string, unknown>)
        : {};
    return {
      name: readString(body.data.name),
      brandAssets: {
        iconUrl: displayBrandImageUrl(readString(assets.iconUrl)),
        splashUrl: displayBrandImageUrl(readString(assets.splashUrl)),
      },
    };
  } catch {
    return { name: null, brandAssets: EMPTY_STORED_BRAND_ASSETS };
  }
}

export async function saveAppName(name: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/store', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const body = (await readJson(response)) as { error?: unknown } | null;
    if (!response.ok) {
      return {
        ok: false,
        error: readString(body?.error) ?? 'We could not save the app name.',
      };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'We could not save the app name.' };
  }
}

export async function saveBrandColors(
  storeId: string,
  token: string,
  colors: { primaryColor?: string; secondaryColor?: string }
): Promise<{ ok: boolean; error: string | null; draft: BrandingDraft | null }> {
  try {
    const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding`, {
      method: 'PATCH',
      headers: authHeaders(token, true),
      body: JSON.stringify(colors),
    });
    const body = await readJson(response);
    const record = brandingRecord(body);
    if (!response.ok) {
      return {
        ok: false,
        error: readString(record?.error) ?? 'We could not save your colors.',
        draft: null,
      };
    }
    return { ok: true, error: null, draft: brandingFromPayload(body, '') };
  } catch {
    return { ok: false, error: 'We could not save your colors.', draft: null };
  }
}

export async function uploadLogo(
  storeId: string,
  token: string,
  file: File
): Promise<{ ok: boolean; logoUrl: string | null; error: string | null }> {
  const formData = new FormData();
  formData.append('logo', file);
  try {
    const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding/logo`, {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
    const body = await readJson(response);
    const data = brandingRecord(body);
    if (!response.ok) {
      return {
        ok: false,
        logoUrl: null,
        error: readString(data?.error) ?? 'We could not upload the logo.',
      };
    }
    return { ok: true, logoUrl: displayBrandImageUrl(readString(data?.logoUrl)), error: null };
  } catch {
    return { ok: false, logoUrl: null, error: 'We could not upload the logo.' };
  }
}

export type OptionalBrandAsset = 'splash' | 'icon';

const SIGNED_UPLOAD_TRANSFORMATION = 'c_limit,w_1024,h_1024,q_auto:good,f_auto';

function assetLabel(kind: OptionalBrandAsset): string {
  return kind === 'icon' ? 'app icon' : 'splash image';
}

function readAssetUrl(kind: OptionalBrandAsset, data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  return persistedBrandImageUrl(
    readString(data.url) ??
      readString(data[`${kind}Url`]) ??
      readString(kind === 'splash' ? data.splashImageUrl : data.appIconUrl)
  );
}

/**
 * Prefer the branding upload route, the same style as the logo.
 * A missing route (404/405/501) falls through to the signed store-image
 * upload, which checks `canUpload` and registers the file before the URL
 * is kept. The caller stores that https URL with the brand.
 */
export async function uploadBrandAsset(
  storeId: string,
  token: string,
  kind: OptionalBrandAsset,
  file: File
): Promise<{ ok: boolean; url: string | null; storedByBrandingApi: boolean; error: string | null }> {
  const fallback = `We could not upload the ${assetLabel(kind)}.`;
  const formData = new FormData();
  formData.append('image', file);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/admin/stores/${storeId}/branding/${kind}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
  } catch {
    return { ok: false, url: null, storedByBrandingApi: false, error: fallback };
  }

  if (response.status !== 404 && response.status !== 405 && response.status !== 501) {
    const body = await readJson(response);
    const data = brandingRecord(body);
    if (!response.ok) {
      return {
        ok: false,
        url: null,
        storedByBrandingApi: false,
        error: readString(data?.error) ?? fallback,
      };
    }
    const url = readAssetUrl(kind, data);
    if (!url) return { ok: false, url: null, storedByBrandingApi: false, error: fallback };
    return { ok: true, url, storedByBrandingApi: true, error: null };
  }

  const signed = await uploadSignedStoreImage(storeId, token, file, fallback);
  if (!signed.ok) return { ok: false, url: null, storedByBrandingApi: false, error: signed.error };
  return { ok: true, url: signed.url, storedByBrandingApi: false, error: null };
}

/**
 * Same lifecycle as `ImageUploader`: refuse when `canUpload` is false,
 * upload with the signed fields, then `POST .../images/register`.
 * The https URL is returned only after registration succeeds.
 */
async function uploadSignedStoreImage(
  storeId: string,
  token: string,
  file: File,
  fallback: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${API_URL}/notifications/stores/${storeId}/images/signature`, {
      headers: authHeaders(token),
    });
    const body = await readJson(response);
    const data = brandingRecord(body);
    if (!response.ok) return { ok: false, error: fallback };

    const gate = readSignedUploadSignature(data);
    if (!gate.ok) {
      return { ok: false, error: gate.reason === 'quota' ? IMAGE_LIMIT_MESSAGE : fallback };
    }

    const { signature, timestamp, cloudName, apiKey, folder } = gate.credentials;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('transformation', SIGNED_UPLOAD_TRANSFORMATION);

    const uploaded = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const result = (await readJson(uploaded)) as Record<string, unknown> | null;
    if (!uploaded.ok) return { ok: false, error: fallback };

    const registration = registerPayloadFromCloudinary(result);
    if (!registration) return { ok: false, error: fallback };

    const registered = await fetch(`${API_URL}/notifications/stores/${storeId}/images/register`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify(registration),
    });
    if (!registered.ok) {
      const registerBody = brandingRecord(await readJson(registered));
      const message = readString(registerBody?.message) ?? readString(registerBody?.error) ?? '';
      return { ok: false, error: /limit/i.test(message) ? IMAGE_LIMIT_MESSAGE : fallback };
    }
    return { ok: true, url: registration.secureUrl };
  } catch {
    return { ok: false, error: fallback };
  }
}

export async function saveStoredBrandAsset(
  kind: OptionalBrandAsset,
  url: string
): Promise<{ ok: boolean; error: string | null }> {
  const persisted = persistedBrandImageUrl(url);
  if (!persisted) return { ok: false, error: 'Use an https image address.' };
  const field = kind === 'icon' ? 'iconUrl' : 'splashUrl';
  try {
    const response = await fetch('/api/store', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandAssets: { [field]: persisted } }),
    });
    const body = (await readJson(response)) as { error?: unknown } | null;
    if (!response.ok) {
      return { ok: false, error: readString(body?.error) ?? 'We could not save that image.' };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'We could not save that image.' };
  }
}
