import { persistedBrandImageUrl } from '@/lib/onboarding/brandAssets';
import {
  PLATFORM_STATUSES,
  platformStatusLabel,
  type PlatformKind,
  type PlatformStatus,
} from './contract.ts';

/** Open manual-build queue. Matches the backend work-queue example. */
export const OPEN_BUILD_STATUSES = ['queued', 'building', 'waiting_on_merchant'] as const satisfies readonly PlatformStatus[];

export const ADMIN_BUILD_PAGE_LIMIT = 20;

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export interface AdminPlatformState {
  status: PlatformStatus | 'unknown';
  updatedAt: string | null;
}

/**
 * One cross-store build request for the ops queue. Requester ids stay off
 * this object. `storeId` is only the merchant store ObjectId from `store.id`,
 * kept so ops can copy `EXPO_PUBLIC_STORE_ID`. It is not the row title and
 * it is never taken from the build-request id.
 */
export interface AdminBuildRequest {
  id: string;
  storeName: string | null;
  storeDomain: string | null;
  /**
   * Merchant store ObjectId from `store.id` only. Optional. Trimmed.
   * A 24-character hex id, or null when missing or invalid. Not the
   * build-request id, shop domain, or app name. Not the row title.
   */
  storeId?: string | null;
  /**
   * Merchant display name from `store.appName`. Optional on the ops payload.
   * Trimmed. Null when missing, blank, or whitespace-only. The row title
   * stays `storeName`. Never invented from Cartaisy, the shop domain, or a store id.
   */
  appName?: string | null;
  /**
   * Public https app icon. Optional on the ops payload. Null when absent,
   * not https, or token-shaped. Never invented.
   */
  iconUrl?: string | null;
  /**
   * Public https splash. Optional on the ops payload. Null when absent,
   * not https, or token-shaped. Never invented.
   */
  splashUrl?: string | null;
  platforms: {
    android: AdminPlatformState;
    ios: AdminPlatformState;
  };
  accessNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminBuildPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdminBuildPage {
  requests: AdminBuildRequest[];
  pagination: AdminBuildPagination;
}

/** Platform fields returned by the status PATCH. Store identity is not included. */
export interface AdminStatusSnapshot {
  id: string;
  platforms: AdminBuildRequest['platforms'];
  accessNotes: string | null;
  updatedAt: string | null;
}

export type AdminQueueFilter = 'open' | 'all';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && OBJECT_ID.test(value);
}

function readTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString();
}

function readPlatform(value: unknown): AdminPlatformState {
  const record = asRecord(value);
  const status = typeof record?.status === 'string' ? record.status : '';
  const known = (PLATFORM_STATUSES as readonly string[]).includes(status);
  return {
    status: known ? (status as PlatformStatus) : 'unknown',
    updatedAt: readTimestamp(record?.updatedAt),
  };
}

function readNotes(checklist: unknown): string | null {
  const record = asRecord(checklist);
  const notes = record?.accessNotes;
  if (typeof notes !== 'string') return null;
  const trimmed = notes.trim();
  return trimmed ? trimmed : null;
}

/** Signed-upload and OAuth markers the branding helper does not already name. */
const OPS_SECRET_URL = /api_secret|client_secret|refresh_token|api_key/i;

/**
 * Public https image for the ops queue. Reuses `persistedBrandImageUrl`,
 * which drops token-shaped values, http, and blob previews. Embedded
 * credentials and signed-upload or OAuth markers are dropped here so they
 * cannot be drawn or copied. Missing values stay null.
 */
export function opsBrandImageUrl(value: unknown): string | null {
  const url = persistedBrandImageUrl(value);
  if (!url || OPS_SECRET_URL.test(url)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return null;
  } catch {
    return null;
  }
  return url;
}

/** `KEY=value` for the ops clipboard. No quotes around the value. */
function envAssignment(key: string, value: string): string {
  return `${key}=${value}`;
}

/**
 * Merchant display name for the ops queue. Blank and whitespace-only values
 * stay null. Does not invent a name.
 */
export function opsAppName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name || null;
}

/** Clipboard text for the EAS app name. Pass an already trimmed non-empty name. */
export function appNameEnvAssignment(name: string): string {
  return envAssignment('APP_NAME', name);
}

/** Clipboard text for the EAS icon env. Pass an already public https URL. */
export function iconEnvAssignment(url: string): string {
  return envAssignment('ICON_IMAGE_URL', url);
}

/** Clipboard text for the EAS splash env. Pass an already public https URL. */
export function splashEnvAssignment(url: string): string {
  return envAssignment('SPLASH_IMAGE_URL', url);
}

/**
 * Merchant store ObjectId for the ops queue. Accepts a 24-character hex id
 * after trim, preserving that exact string. Anything else stays null. Does
 * not invent an id.
 */
export function opsStoreId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return isObjectId(id) ? id : null;
}

/** Clipboard text for the EAS store id. Pass an already valid ObjectId. */
export function storeIdEnvAssignment(storeId: string): string {
  return envAssignment('EXPO_PUBLIC_STORE_ID', storeId);
}

/**
 * Every copyable launcher assignment for one ops row.
 * Order matches the fictional handoff in Cartaisy
 * `docs/MOBILE_MERCHANT_PROVISIONING_RUNBOOK.md`:
 * APP_NAME, ICON_IMAGE_URL, SPLASH_IMAGE_URL, EXPO_PUBLIC_STORE_ID.
 * One `KEY=value` per line, no quotes, LF newlines, no blank lines.
 * A line is included only when that field's single-copy control would
 * exist. Null when none qualify. Does not invent values.
 */
export function easEnvAssignments(fields: {
  appName?: unknown;
  iconUrl?: unknown;
  splashUrl?: unknown;
  storeId?: unknown;
}): string | null {
  const lines: string[] = [];
  const appName = opsAppName(fields.appName);
  const iconUrl = opsBrandImageUrl(fields.iconUrl);
  const splashUrl = opsBrandImageUrl(fields.splashUrl);
  const storeId = opsStoreId(fields.storeId);
  if (appName) lines.push(appNameEnvAssignment(appName));
  if (iconUrl) lines.push(iconEnvAssignment(iconUrl));
  if (splashUrl) lines.push(splashEnvAssignment(splashUrl));
  if (storeId) lines.push(storeIdEnvAssignment(storeId));
  return lines.length > 0 ? lines.join('\n') : null;
}

function readStoreIdentity(value: unknown): {
  name: string | null;
  domain: string | null;
  appName: string | null;
  storeId: string | null;
  iconUrl: string | null;
  splashUrl: string | null;
} {
  const store = asRecord(value);
  const name = typeof store?.name === 'string' ? store.name.trim() : '';
  const domain = typeof store?.domain === 'string' ? store.domain.trim() : '';
  return {
    name: name || null,
    domain: domain || null,
    appName: opsAppName(store?.appName),
    storeId: opsStoreId(store?.id),
    iconUrl: opsBrandImageUrl(store?.iconUrl),
    splashUrl: opsBrandImageUrl(store?.splashUrl),
  };
}

export function normalizeAdminBuildRequest(payload: unknown): AdminBuildRequest | null {
  const data = readData(payload);
  if (!data || !isObjectId(data.id)) return null;
  const platforms = asRecord(data.platforms);
  const store = readStoreIdentity(data.store);
  return {
    id: data.id,
    storeName: store.name,
    storeDomain: store.domain,
    appName: store.appName,
    storeId: store.storeId,
    iconUrl: store.iconUrl,
    splashUrl: store.splashUrl,
    platforms: {
      android: readPlatform(platforms?.android),
      ios: readPlatform(platforms?.ios),
    },
    accessNotes: readNotes(data.checklist),
    createdAt: readTimestamp(data.createdAt),
    updatedAt: readTimestamp(data.updatedAt),
  };
}

export function normalizeAdminStatusSnapshot(payload: unknown): AdminStatusSnapshot | null {
  const request = normalizeAdminBuildRequest(payload);
  if (!request) return null;
  return {
    id: request.id,
    platforms: request.platforms,
    accessNotes: request.accessNotes,
    updatedAt: request.updatedAt,
  };
}

function readPagination(value: unknown): AdminBuildPagination | null {
  const record = asRecord(value);
  if (!record) return null;
  const page = record.page;
  const limit = record.limit;
  const total = record.total;
  const pages = record.pages;
  if (
    typeof page !== 'number' ||
    typeof limit !== 'number' ||
    typeof total !== 'number' ||
    typeof pages !== 'number'
  ) {
    return null;
  }
  if (!Number.isInteger(page) || !Number.isInteger(limit) || !Number.isInteger(total) || !Number.isInteger(pages)) {
    return null;
  }
  if (page < 1 || limit < 1 || total < 0 || pages < 0) return null;
  return { page, limit, total, pages };
}

export function normalizeAdminBuildPage(payload: unknown): AdminBuildPage | null {
  const data = readData(payload);
  if (!data || !Array.isArray(data.requests)) return null;
  const pagination = readPagination(data.pagination);
  if (!pagination) return null;
  const requests: AdminBuildRequest[] = [];
  for (const item of data.requests) {
    const request = normalizeAdminBuildRequest(item);
    if (request) requests.push(request);
  }
  return { requests, pagination };
}

export function adminBuildRequestsPath(input: {
  page?: number;
  limit?: number;
  filter?: AdminQueueFilter;
}): string {
  const params = new URLSearchParams();
  if (input.page != null) params.set('page', String(input.page));
  if (input.limit != null) params.set('limit', String(input.limit));
  if (input.filter === 'open') params.set('status', OPEN_BUILD_STATUSES.join(','));
  const query = params.toString();
  return query ? `/admin/build-requests?${query}` : '/admin/build-requests';
}

export function adminBuildStatusPath(id: string): string {
  return `/admin/build-requests/${id}/status`;
}

/**
 * Merchant labels, except Android `waiting_on_merchant`. "Waiting on you" is
 * the merchant's label. On this screen that phrase would mean the operator.
 */
export function opsPlatformStatusLabel(platform: PlatformKind, status: PlatformStatus | 'unknown'): string {
  if (platform === 'android' && status === 'waiting_on_merchant') return 'Waiting on merchant';
  return platformStatusLabel(platform, status);
}

export function applyStatusSnapshot(current: AdminBuildRequest, next: AdminStatusSnapshot): AdminBuildRequest {
  return {
    ...current,
    platforms: next.platforms,
    accessNotes: next.accessNotes,
    updatedAt: next.updatedAt ?? current.updatedAt,
  };
}

export function statusPatchBody(platform: PlatformKind, status: PlatformStatus): Record<string, { status: PlatformStatus }> {
  return { [platform]: { status } };
}
