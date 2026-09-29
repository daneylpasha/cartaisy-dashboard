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
import { APP_NAME_WORDMARK_MESSAGE, isPlatformWordmark } from '@/lib/onboarding/appName';
import type { BrandingDraft } from '@/lib/onboarding/types';

export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const DEFAULT_PRIMARY_COLOR = '#FF6B6B';
/** Swatch shown when secondary is unset. Not a saved color. */
export const DEFAULT_SECONDARY_DISPLAY = '#FFFFFF';
export const PLATFORM_DEFAULT_COLOR_LABEL = 'Using the platform default';

export interface BrandColorSelection {
  /** Null means the platform default. A string is an explicit hex. */
  primary: string | null;
  secondary: string | null;
}

/** Fields for `PATCH /admin/stores/:storeId/branding`. Null clears that color. */
export type BrandColorPatch = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

const BRAND_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const BRAND_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export type BrandImageKind = 'logo' | 'icon' | 'splash';

export interface BrandImagePixels {
  width: number;
  height: number;
}

export type BrandImageValidation = { ok: true; message: null } | { ok: false; message: string };

/** Shown under Logo, App icon, and Splash. Sizes are for Android and iOS store art. */
export const BRAND_IMAGE_SIZE_GUIDE: Record<BrandImageKind, string> = {
  logo: 'Use 1024×1024, or a wide wordmark up to 2048×1024. Android and iOS show this in the header.',
  icon: 'App Store and Play need a square 1024×1024 icon.',
  splash:
    'Use 1284×2778 for a full-bleed opening screen on Android and iOS. A square from 256×256 to 2048×2048 also works.',
};

const LOGO_USE = 'Use 1024×1024, or a wide wordmark up to 2048×1024.';
const SPLASH_USE = 'Use 1284×2778, or a square from 256×256 to 2048×2048.';
const UNREADABLE_IMAGE = 'We could not read that image. Try another JPG, PNG, or WebP.';

export function validateBrandImage(file: File): BrandImageValidation {
  if (!BRAND_IMAGE_TYPES.includes(file.type as (typeof BRAND_IMAGE_TYPES)[number])) {
    return { ok: false, message: 'Use a JPG, PNG, or WebP image.' };
  }
  if (file.size > BRAND_IMAGE_MAX_BYTES) {
    return { ok: false, message: 'Image must be under 2MB.' };
  }
  return { ok: true, message: null };
}

function pixelLabel(width: number, height: number): string {
  return `${width}×${height}`;
}

function wholePixels(width: number, height: number): BrandImagePixels | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return null;
  return { width, height };
}

/**
 * Pixel rules for one brand asset. Type and file size are checked separately.
 * Splash accepts a portrait store size or a square logo-centered image.
 */
export function validateBrandImageDimensions(
  kind: BrandImageKind,
  size: BrandImagePixels
): BrandImageValidation {
  const pixels = wholePixels(size.width, size.height);
  if (!pixels) return { ok: false, message: UNREADABLE_IMAGE };
  const yours = pixelLabel(pixels.width, pixels.height);
  if (kind === 'icon') return validateIconPixels(pixels, yours);
  if (kind === 'splash') return validateSplashPixels(pixels, yours);
  return validateLogoPixels(pixels, yours);
}

function validateIconPixels(size: BrandImagePixels, yours: string): BrandImageValidation {
  if (size.width !== size.height) {
    return { ok: false, message: `App icon must be square. Yours is ${yours}. Use 1024×1024.` };
  }
  if (size.width < 512 || size.width > 1024) {
    return {
      ok: false,
      message: `App icon must be a square from 512×512 to 1024×1024. Yours is ${yours}. Use 1024×1024.`,
    };
  }
  return { ok: true, message: null };
}

function validateSplashPixels(size: BrandImagePixels, yours: string): BrandImageValidation {
  const { width, height } = size;
  if (width > height) {
    return { ok: false, message: `Splash must be portrait or square. Yours is ${yours}. ${SPLASH_USE}` };
  }
  if (width === height) {
    if (width >= 256 && width <= 2048) return { ok: true, message: null };
    return {
      ok: false,
      message: `A square splash must be from 256×256 to 2048×2048. Yours is ${yours}. ${SPLASH_USE}`,
    };
  }
  if (width >= 1080 && width <= 1290 && height >= 1920 && height <= 2796) {
    return { ok: true, message: null };
  }
  return {
    ok: false,
    message: `Splash must be 1080–1290 wide and 1920–2796 tall, or a square from 256×256 to 2048×2048. Yours is ${yours}. Use 1284×2778.`,
  };
}

/** Inclusive 1:3 through 3:1, compared in integers. */
function logoAspectOk(width: number, height: number): boolean {
  return width * 3 >= height && height * 3 >= width;
}

function validateLogoPixels(size: BrandImagePixels, yours: string): BrandImageValidation {
  const { width, height } = size;
  const sidesOk = width >= 256 && width <= 2048 && height >= 256 && height <= 2048;
  const aspectOk = logoAspectOk(width, height);
  if (sidesOk && aspectOk) return { ok: true, message: null };
  if (!sidesOk && !aspectOk) {
    return {
      ok: false,
      message: `Logo must be between 256 and 2048 pixels on each side, and between 1:3 and 3:1. Yours is ${yours}. ${LOGO_USE}`,
    };
  }
  if (!sidesOk) {
    return {
      ok: false,
      message: `Logo must be between 256 and 2048 pixels on each side. Yours is ${yours}. ${LOGO_USE}`,
    };
  }
  return {
    ok: false,
    message: `Logo must be between 1:3 and 3:1. Yours is ${yours}. ${LOGO_USE}`,
  };
}

function readBrandImageSizeFromElement(file: Blob): Promise<BrandImagePixels | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const finish = (size: BrandImagePixels | null) => {
      URL.revokeObjectURL(url);
      resolve(size);
    };
    image.onload = () => finish(wholePixels(image.naturalWidth, image.naturalHeight));
    image.onerror = () => finish(null);
    image.src = url;
  });
}

/** Natural pixel size. A file that cannot be decoded returns null. */
export function readBrandImageSize(file: Blob): Promise<BrandImagePixels | null> {
  if (typeof createImageBitmap !== 'function') return readBrandImageSizeFromElement(file);
  return createImageBitmap(file)
    .then((bitmap) => {
      const size = wholePixels(bitmap.width, bitmap.height);
      bitmap.close();
      return size;
    })
    .catch(() => readBrandImageSizeFromElement(file));
}

/**
 * Type, 2MB, then pixel size for this asset. Nothing is uploaded from here.
 * `readSize` is the decoder; tests pass a stub.
 */
export async function validateBrandImageFile(
  file: File,
  kind: BrandImageKind,
  readSize: (file: Blob) => Promise<BrandImagePixels | null> = readBrandImageSize
): Promise<BrandImageValidation> {
  const typeCheck = validateBrandImage(file);
  if (!typeCheck.ok) return typeCheck;
  try {
    const size = await readSize(file);
    if (!size) return { ok: false, message: UNREADABLE_IMAGE };
    return validateBrandImageDimensions(kind, size);
  } catch {
    return { ok: false, message: UNREADABLE_IMAGE };
  }
}

/**
 * Runs the pixel check, then hands a valid file to the existing upload.
 * A failing file never reaches `onFile`, so the previous image stays.
 * `isCurrent` drops a result when the merchant has already picked another file.
 */
export function acceptBrandImageFile(
  file: File,
  kind: BrandImageKind,
  onImageError: (message: string | null) => void,
  onFile: (file: File) => void,
  isCurrent: () => boolean = () => true,
  readSize?: (file: Blob) => Promise<BrandImagePixels | null>
): Promise<void> {
  return validateBrandImageFile(file, kind, readSize).then((check) => {
    if (!isCurrent()) return;
    if (!check.ok) {
      onImageError(check.message);
      return;
    }
    onImageError(null);
    onFile(file);
  });
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

/** A saved hex, or null when the payload has null, omits the field, or is not a hex. */
export function explicitBrandColor(value: unknown): string | null {
  const text = readString(value);
  if (!text || !HEX_COLOR_REGEX.test(text)) return null;
  return text;
}

export function displayPrimaryColor(explicit: string | null): string {
  return explicit ?? DEFAULT_PRIMARY_COLOR;
}

export function displaySecondaryColor(explicit: string | null): string {
  return explicit ?? DEFAULT_SECONDARY_DISPLAY;
}

/**
 * True when the form should say this color is the platform default.
 * An explicit hex is never that state, even when it matches the swatch fallback.
 * Drafts that do not track an explicit value yet treat an empty secondary, or a
 * primary equal to the display fallback, as the default.
 */
export function brandColorUsesPlatformDefault(
  explicit: string | null | undefined,
  display: string,
  kind: 'primary' | 'secondary'
): boolean {
  if (typeof explicit === 'string' && HEX_COLOR_REGEX.test(explicit)) return false;
  if (explicit === null) return true;
  const trimmed = display.trim();
  if (!trimmed) return true;
  if (kind === 'secondary') return false;
  return trimmed.toLowerCase() === DEFAULT_PRIMARY_COLOR.toLowerCase();
}

function resolvedExplicitColor(
  explicit: string | null | undefined,
  display: string,
  kind: 'primary' | 'secondary'
): string | null {
  if (typeof explicit === 'string' && HEX_COLOR_REGEX.test(explicit)) return explicit;
  if (explicit === null) return null;
  if (brandColorUsesPlatformDefault(undefined, display, kind)) return null;
  const trimmed = display.trim();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : null;
}

/** Explicit colors to save. Null is a clear, not the display fallback hex. */
export function brandColorSelection(draft: {
  primaryColor: string;
  secondaryColor: string;
  primaryExplicit?: string | null;
  secondaryExplicit?: string | null;
}): BrandColorSelection {
  return {
    primary: resolvedExplicitColor(draft.primaryExplicit, draft.primaryColor, 'primary'),
    secondary: resolvedExplicitColor(draft.secondaryExplicit, draft.secondaryColor, 'secondary'),
  };
}

/** Only colors that changed. A null value clears that color on the server. */
export function brandColorPatch(draft: BrandColorSelection, saved: BrandColorSelection): BrandColorPatch {
  const patch: BrandColorPatch = {};
  if (draft.primary !== saved.primary) patch.primaryColor = draft.primary;
  if (draft.secondary !== saved.secondary) patch.secondaryColor = draft.secondary;
  return patch;
}

export function emptyBrandingDraft(appName: string): BrandingDraft {
  return {
    appName,
    logoUrl: null,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: '',
    primaryExplicit: null,
    secondaryExplicit: null,
    splashUrl: null,
    iconUrl: null,
    splashPersisted: true,
    iconPersisted: true,
  };
}

export function brandingFromPayload(payload: unknown, appName: string): BrandingDraft {
  const data = brandingRecord(payload);
  if (!data) return emptyBrandingDraft(appName);

  const primaryExplicit = explicitBrandColor(data.primaryColor);
  const secondaryExplicit = explicitBrandColor(data.secondaryColor);
  const serverName = readString(data.appName);

  return {
    appName: serverName ?? appName,
    logoUrl: displayBrandImageUrl(readString(data.logoUrl)),
    primaryColor: displayPrimaryColor(primaryExplicit),
    secondaryColor: secondaryExplicit ?? '',
    primaryExplicit,
    secondaryExplicit,
    splashUrl: displayBrandImageUrl(readString(data.splashUrl) ?? readString(data.splashImageUrl)),
    iconUrl: displayBrandImageUrl(readString(data.iconUrl) ?? readString(data.appIconUrl)),
    splashPersisted: true,
    iconPersisted: true,
  };
}

type InflightBrandingRegistry = Map<string, Promise<BrandingDraft | null>>;

/**
 * One map for every copy of this module. Webpack can emit `branding.ts` in
 * both the sidebar chunk and the Settings chunk, and each copy would otherwise
 * keep its own Map.
 */
interface CartaisyInflightBrandingHost {
  __cartaisyInflightBranding?: InflightBrandingRegistry;
}

const inflightBranding: InflightBrandingRegistry = ((globalThis as CartaisyInflightBrandingHost)
  .__cartaisyInflightBranding ??= new Map());

async function readBranding(storeId: string, token: string): Promise<BrandingDraft | null> {
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

/**
 * One in-flight branding GET per store id.
 * The registry lives on `globalThis` so duplicated chunks share it. The key is
 * the store id only: two callers can hold different JWT strings for one store.
 * A caller that starts while that request is in flight waits on it.
 * A later call, after that request settles, fetches again.
 * The dashboard shell keeps the settled promise for the mounted frame.
 * This map is only the in-flight safety net.
 */
export function fetchBranding(storeId: string, token: string): Promise<BrandingDraft | null> {
  const pending = inflightBranding.get(storeId);
  if (pending) return pending;
  const request = readBranding(storeId, token).finally(() => {
    if (inflightBranding.get(storeId) === request) inflightBranding.delete(storeId);
  });
  inflightBranding.set(storeId, request);
  return request;
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
  if (isPlatformWordmark(name)) {
    return { ok: false, error: APP_NAME_WORDMARK_MESSAGE };
  }
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
  colors: BrandColorPatch
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

export async function clearLogo(
  storeId: string,
  token: string
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding/logo`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    const body = await readJson(response);
    const data = brandingRecord(body);
    if (!response.ok) {
      return {
        ok: false,
        error: readString(data?.error) ?? 'We could not remove the logo.',
      };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'We could not remove the logo.' };
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

/** The branding icon/splash route is not deployed. Other statuses are real failures. */
export function brandingAssetRouteMissing(status: number): boolean {
  return status === 404 || status === 405 || status === 501;
}

export type BrandAssetSavePlan =
  | { persist: 'branding'; url: string }
  | { persist: 'dashboard'; url: string }
  | { persist: 'none'; error: string };

/**
 * A successful branding POST already stored the https URL on the branding
 * document. Dashboard `brandAssets` is only for the signed-upload fallback.
 */
export function planBrandAssetSave(uploaded: {
  ok: boolean;
  url: string | null;
  storedByBrandingApi: boolean;
  error: string | null;
}): BrandAssetSavePlan {
  const url = uploaded.ok ? persistedBrandImageUrl(uploaded.url) : null;
  if (!url) {
    return { persist: 'none', error: uploaded.error ?? 'We could not upload the image.' };
  }
  if (uploaded.storedByBrandingApi) return { persist: 'branding', url };
  return { persist: 'dashboard', url };
}

/**
 * Prefer the branding upload route, the same style as the logo.
 * A missing route (404/405/501) falls through to the signed store-image
 * upload, which checks `canUpload` and registers the file before the URL
 * is kept. When the branding route succeeds, its response URL is the saved
 * value. The signed path is the only one stored on dashboard `brandAssets`.
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

  if (!brandingAssetRouteMissing(response.status)) {
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
