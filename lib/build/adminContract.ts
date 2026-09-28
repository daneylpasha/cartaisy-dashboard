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
 * One cross-store build request for the ops queue. Requester ids and store
 * ids stay off this object so the screen cannot render them by accident.
 */
export interface AdminBuildRequest {
  id: string;
  storeName: string | null;
  storeDomain: string | null;
  /**
   * Cartaisy store name from `store.appName`. Optional on the ops payload.
   * The row title stays `storeName`.
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

/** Clipboard text for the EAS splash env. Pass an already public https URL. */
export function splashEnvAssignment(url: string): string {
  return `SPLASH_IMAGE_URL=${url}`;
}

function readStoreIdentity(value: unknown): {
  name: string | null;
  domain: string | null;
  appName: string | null;
  iconUrl: string | null;
  splashUrl: string | null;
} {
  const store = asRecord(value);
  const name = typeof store?.name === 'string' ? store.name.trim() : '';
  const domain = typeof store?.domain === 'string' ? store.domain.trim() : '';
  const appName = typeof store?.appName === 'string' ? store.appName.trim() : '';
  return {
    name: name || null,
    domain: domain || null,
    appName: appName || null,
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
