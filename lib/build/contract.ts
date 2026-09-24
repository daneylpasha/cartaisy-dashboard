import type { BuildRequestAvailability } from '../onboarding/types.ts';

/** Poll while a requested platform is still moving. A few seconds is enough. */
export const BUILD_STATUS_POLL_MS = 4000;

export const ACCESS_NOTES_MAX = 280;

export const PLATFORM_STATUSES = [
  'not_requested',
  'queued',
  'building',
  'ready',
  'failed',
  'waiting_on_merchant',
] as const;

export type PlatformStatus = (typeof PLATFORM_STATUSES)[number];

export type PlatformKind = 'android' | 'ios';

export interface PlatformProgress {
  status: PlatformStatus | 'unknown';
}

/**
 * Merchant-facing build request. Store ids, requester ids, and any build
 * tooling identifiers are dropped on purpose.
 */
export interface BuildRequest {
  id: string;
  platforms: {
    android: PlatformProgress;
    ios: PlatformProgress;
  };
  accessNotes: string | null;
}

export interface BuildCreateBody {
  android: boolean;
  ios: boolean;
  checklist?: { accessNotes: string };
}

export type IneligibleReason = 'shopify_not_connected' | 'catalog_sync_not_succeeded';

export type CreateBuildFailure =
  | { kind: 'ineligible'; reason: IneligibleReason }
  | { kind: 'invalid'; message: string }
  | { kind: 'error'; message: string };

export interface PrimaryBuildAction {
  kind: 'connect' | 'sync' | 'retry' | 'submit' | 'none';
  label: string;
  disabled: boolean;
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const ACTIVE_STATUSES = new Set<PlatformStatus | 'unknown'>([
  'queued',
  'building',
  'waiting_on_merchant',
  'unknown',
]);

export function isBuildRequestId(value: string): boolean {
  return OBJECT_ID.test(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readRequestRecord(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

function readPlatform(value: unknown): PlatformProgress {
  const record = asRecord(value);
  const status = typeof record?.status === 'string' ? record.status : '';
  if ((PLATFORM_STATUSES as readonly string[]).includes(status)) {
    return { status: status as PlatformStatus };
  }
  return { status: 'unknown' };
}

export function normalizeBuildRequest(payload: unknown): BuildRequest | null {
  const data = readRequestRecord(payload);
  if (!data || typeof data.id !== 'string' || !isBuildRequestId(data.id)) return null;

  const platforms = asRecord(data.platforms);
  const checklist = asRecord(data.checklist);
  const notes = checklist?.accessNotes;
  const accessNotes = typeof notes === 'string' ? notes : notes === null ? null : null;

  return {
    id: data.id,
    platforms: {
      android: readPlatform(platforms?.android),
      ios: readPlatform(platforms?.ios),
    },
    accessNotes,
  };
}

export function normalizeBuildRequestList(payload: unknown): BuildRequest[] {
  const data = readRequestRecord(payload);
  const list = Array.isArray(data?.requests) ? data.requests : [];
  const requests: BuildRequest[] = [];
  for (const item of list) {
    const request = normalizeBuildRequest(item);
    if (request) requests.push(request);
  }
  return requests;
}

export function requestedPlatforms(request: BuildRequest): PlatformKind[] {
  const platforms: PlatformKind[] = [];
  if (request.platforms.android.status !== 'not_requested') platforms.push('android');
  if (request.platforms.ios.status !== 'not_requested') platforms.push('ios');
  return platforms;
}

/** Keep polling until every requested platform is ready or failed. */
export function shouldPollBuildRequest(request: BuildRequest): boolean {
  const requested = requestedPlatforms(request);
  if (requested.length === 0) return false;
  return requested.some((platform) => ACTIVE_STATUSES.has(request.platforms[platform].status));
}

export function isSettledBuildRequest(request: BuildRequest): boolean {
  const requested = requestedPlatforms(request);
  if (requested.length === 0) return false;
  return requested.every((platform) => {
    const status = request.platforms[platform].status;
    return status === 'ready' || status === 'failed';
  });
}

export function platformStatusLabel(platform: PlatformKind, status: PlatformStatus | 'unknown'): string {
  if (status === 'waiting_on_merchant') {
    return platform === 'ios' ? 'Waiting on Apple' : 'Waiting on you';
  }
  switch (status) {
    case 'not_requested':
      return 'Not requested';
    case 'queued':
      return 'Queued';
    case 'building':
      return 'Building';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return 'Updating';
  }
}

export function outcomeCopy(request: BuildRequest): string | null {
  if (!isSettledBuildRequest(request)) return null;
  const android = request.platforms.android.status;
  const ios = request.platforms.ios.status;
  if (android === 'ready' && ios === 'ready') return 'Android and iOS are ready.';
  if (android === 'ready' && ios === 'not_requested') return 'Android is ready.';
  if (ios === 'ready' && android === 'not_requested') return 'iOS is ready.';
  if (android === 'failed' && (ios === 'failed' || ios === 'not_requested')) {
    if (ios === 'failed') return 'The build did not finish. You can request it again.';
    return 'Android did not finish. You can request it again.';
  }
  if (ios === 'failed' && android === 'not_requested') return 'iOS did not finish. You can request it again.';
  return 'One app is ready. The other did not finish.';
}

export function buildCreatePayload(input: {
  android: boolean;
  ios: boolean;
  accessNotes: string;
}): { ok: true; body: BuildCreateBody } | { ok: false; message: string } {
  if (!input.android && !input.ios) {
    return { ok: false, message: 'Choose Android, iOS, or both.' };
  }
  const notes = input.accessNotes.trim();
  if (notes.length > ACCESS_NOTES_MAX) {
    return { ok: false, message: 'Keep the note under 280 characters.' };
  }
  const body: BuildCreateBody = {
    android: input.android,
    ios: input.ios,
  };
  if (notes) body.checklist = { accessNotes: notes };
  return { ok: true, body };
}

export function readIneligibleReason(payload: unknown): IneligibleReason | null {
  const root = asRecord(payload);
  if (!root || root.code !== 'BUILD_NOT_ELIGIBLE') return null;
  if (root.reason === 'shopify_not_connected' || root.reason === 'catalog_sync_not_succeeded') {
    return root.reason;
  }
  return null;
}

export function messageForCreateFailure(status: number, payload: unknown): CreateBuildFailure {
  const reason = status === 409 ? readIneligibleReason(payload) : null;
  if (reason) return { kind: 'ineligible', reason };

  if (status === 401) {
    return { kind: 'error', message: 'Sign in again to request a build.' };
  }
  if (status === 403) {
    return { kind: 'error', message: 'You need to be a store admin to request a build.' };
  }

  const root = asRecord(payload);
  const error = typeof root?.error === 'string' ? root.error : '';
  if (error === 'Choose Android, iOS, or both.') {
    return { kind: 'invalid', message: error };
  }
  if (/280|accessNotes|characters/i.test(error)) {
    return { kind: 'invalid', message: 'Keep the note under 280 characters.' };
  }
  return { kind: 'error', message: 'We could not send your request. Try again.' };
}

export function primaryBuildAction(input: {
  availability: BuildRequestAvailability;
  mode: 'compose' | 'status';
  submitting: boolean;
  syncBusy: boolean;
  canSubmit: boolean;
}): PrimaryBuildAction {
  if (input.mode === 'status') {
    return { kind: 'none', label: '', disabled: true };
  }
  if (!input.availability.enabled) {
    if (input.availability.action === 'connect') {
      return { kind: 'connect', label: 'Connect Shopify', disabled: false };
    }
    if (input.availability.action === 'retry') {
      return { kind: 'retry', label: 'Try again', disabled: false };
    }
    return { kind: 'sync', label: 'Sync again', disabled: input.syncBusy };
  }
  return {
    kind: 'submit',
    label: input.submitting ? 'Requesting...' : 'Build my app',
    disabled: input.submitting || !input.canSubmit,
  };
}
