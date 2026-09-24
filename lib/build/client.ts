import { API_URL } from '@/lib/api/mutator/custom-instance';
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
  | { kind: 'error' };

export type ListBuildResult =
  | { kind: 'ok'; requests: BuildRequest[] }
  | { kind: 'error'; message: string };

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Accept: 'application/json',
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

async function backend(
  token: string,
  path: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token, Boolean(init.body)),
      ...init.headers,
    },
  });
  const body = await readJson(response);
  return { ok: response.ok, status: response.status, body };
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
