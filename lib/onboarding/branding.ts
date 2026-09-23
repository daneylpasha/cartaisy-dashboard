import { API_URL } from '@/lib/api/mutator/custom-instance';
import { safeImageUrl } from '@/lib/onboarding/normalizers';
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
    logoUrl: safeImageUrl(readString(data.logoUrl)),
    primaryColor: primary && HEX_COLOR_REGEX.test(primary) ? primary : DEFAULT_PRIMARY_COLOR,
    secondaryColor: secondary && HEX_COLOR_REGEX.test(secondary) ? secondary : '',
    splashUrl: safeImageUrl(readString(data.splashUrl) ?? readString(data.splashImageUrl)),
    iconUrl: safeImageUrl(readString(data.iconUrl) ?? readString(data.appIconUrl)),
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

export async function fetchStoreName(): Promise<string | null> {
  try {
    const response = await fetch('/api/store');
    const body = (await readJson(response)) as { data?: { name?: unknown } } | null;
    if (!response.ok) return null;
    return readString(body?.data?.name);
  } catch {
    return null;
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
    return { ok: true, logoUrl: safeImageUrl(readString(data?.logoUrl)), error: null };
  } catch {
    return { ok: false, logoUrl: null, error: 'We could not upload the logo.' };
  }
}

export type OptionalBrandAsset = 'splash' | 'icon';

/**
 * Splash and app icon are not on the current branding API (logo + colors only).
 * A 404/405 means the preview can keep the local image and setup can continue.
 * When the API accepts these paths, this function starts persisting them
 * without a wizard rewrite.
 */
export async function uploadOptionalBrandAsset(
  storeId: string,
  token: string,
  kind: OptionalBrandAsset,
  file: File
): Promise<{ persisted: boolean; url: string | null }> {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding/${kind}`, {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
    if (response.status === 404 || response.status === 405 || response.status === 501) {
      return { persisted: false, url: null };
    }
    const body = await readJson(response);
    const data = brandingRecord(body);
    if (!response.ok) return { persisted: false, url: null };
    const url = safeImageUrl(
      readString(data?.url) ??
        readString(data?.[`${kind}Url`]) ??
        readString(kind === 'splash' ? data?.splashUrl : data?.iconUrl)
    );
    return { persisted: true, url };
  } catch {
    return { persisted: false, url: null };
  }
}
