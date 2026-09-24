import { API_URL, customInstance } from '@/lib/api/mutator/custom-instance';
import { UNAVAILABLE_SYNC, normalizeSyncStatus } from '@/lib/onboarding/normalizers';
import type { SyncGate } from '@/lib/onboarding/types';
import {
  isBuildRequestId,
  messageForCreateFailure,
  normalizeBuildRequest,
  normalizeBuildRequestList,
  type BuildCreateBody,
  type BuildRequest,
  type CreateBuildFailure,
} from '@/lib/build/contract';

export type CreateBuildResult = { kind: 'created'; request: BuildRequest } | CreateBuildFailure;

export type ReadBuildResult =
  | { kind: 'ok'; request: BuildRequest }
  | { kind: 'missing' }
  | { kind: 'error'; message?: string };

export type ListBuildResult =
  | { kind: 'ok'; requests: BuildRequest[] }
  | { kind: 'error'; message: string };

/**
 * Build calls go through the dashboard mutator so a 401 refreshes the access
 * token and retries once. Callers still pass the token they just read; the
 * mutator uses it for the first attempt and replaces it only after a refresh.
 */
async function backend(
  token: string,
  path: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body != null) headers['Content-Type'] = 'application/json';

  const result = await customInstance<{ data: unknown; status: number }>(`${API_URL}${path}`, {
    method: init.method,
    body: init.body,
    token,
    headers,
  });
  const status = result.status;
  return { ok: status >= 200 && status < 300, status, body: result.data ?? null };
}

/**
 * Loads catalog sync and the build list together. A retry then refreshes the
 * wizard-owned Shopify connection snapshot. The snapshot runs after those
 * calls so a 401 refresh has already stored a new access token. A snapshot
 * failure does not hide a successful list.
 */
export async function loadBuildScreen(
  token: string,
  options?: { refreshConnection?: () => Promise<void> | void }
): Promise<{ sync: SyncGate; list: ListBuildResult }> {
  const [sync, list] = await Promise.all([fetchCatalogSync(token), listBuildRequests(token)]);
  if (options?.refreshConnection) {
    try {
      await options.refreshConnection();
    } catch {
      // The wizard snapshot stays as it was. Try again remains available.
    }
  }
  return { sync, list };
}

export async function fetchCatalogSync(token: string): Promise<SyncGate> {
  try {
    const result = await backend(token, '/shopify/sync', { method: 'GET' });
    return normalizeSyncStatus(result.body, result.ok);
  } catch {
    return UNAVAILABLE_SYNC;
  }
}

export async function syncCatalogAgain(token: string): Promise<SyncGate> {
  try {
    const result = await backend(token, '/shopify/sync', { method: 'POST' });
    const record =
      result.body && typeof result.body === 'object' ? (result.body as { code?: unknown }) : null;
    if (record?.code === 'SHOPIFY_NOT_CONNECTED') {
      return {
        state: 'not_started',
        detail: null,
        eligibleForBuild: false,
        eligibilityReason: 'shopify_not_connected',
      };
    }
    return normalizeSyncStatus(result.body, result.ok);
  } catch {
    return UNAVAILABLE_SYNC;
  }
}

export async function listBuildRequests(token: string): Promise<ListBuildResult> {
  try {
    const result = await backend(token, '/build-requests', { method: 'GET' });
    if (result.status === 401) {
      return { kind: 'error', message: 'Sign in again to see your build.' };
    }
    if (!result.ok) {
      return { kind: 'error', message: 'We could not load your build. Try again.' };
    }
    return { kind: 'ok', requests: normalizeBuildRequestList(result.body) };
  } catch {
    return { kind: 'error', message: 'We could not load your build. Try again.' };
  }
}

export async function getBuildRequest(token: string, id: string): Promise<ReadBuildResult> {
  if (!isBuildRequestId(id)) return { kind: 'missing' };
  try {
    const result = await backend(token, `/build-requests/${id}`, { method: 'GET' });
    if (result.status === 404) return { kind: 'missing' };
    if (result.status === 401) {
      return { kind: 'error', message: 'Sign in again to see your build.' };
    }
    if (!result.ok) return { kind: 'error' };
    const request = normalizeBuildRequest(result.body);
    return request ? { kind: 'ok', request } : { kind: 'error' };
  } catch {
    return { kind: 'error' };
  }
}

export async function createBuildRequest(token: string, body: BuildCreateBody): Promise<CreateBuildResult> {
  try {
    const result = await backend(token, '/build-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!result.ok) return messageForCreateFailure(result.status, result.body);
    const request = normalizeBuildRequest(result.body);
    if (!request) return { kind: 'error', message: 'We could not send your request. Try again.' };
    return { kind: 'created', request };
  } catch {
    return { kind: 'error', message: 'We could not send your request. Try again.' };
  }
}

export async function updateAccessNotes(
  token: string,
  id: string,
  accessNotes: string | null
): Promise<{ ok: true; request: BuildRequest } | { ok: false; message: string }> {
  if (!isBuildRequestId(id)) {
    return { ok: false, message: 'We could not save that note. Try again.' };
  }
  try {
    const result = await backend(token, `/build-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ checklist: { accessNotes } }),
    });
    if (result.status === 401) {
      return { ok: false, message: 'Sign in again to save the note.' };
    }
    if (!result.ok) {
      return { ok: false, message: 'We could not save that note. Try again.' };
    }
    const request = normalizeBuildRequest(result.body);
    if (!request) return { ok: false, message: 'We could not save that note. Try again.' };
    return { ok: true, request };
  } catch {
    return { ok: false, message: 'We could not save that note. Try again.' };
  }
}
