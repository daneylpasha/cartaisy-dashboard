import { API_URL, customInstance } from '@/lib/api/mutator/custom-instance';
import { isBuildRequestId } from '@/lib/build/contract';
import {
  interpretSubmitStart,
  messageForSubmitFailure,
  normalizeStoreSubmit,
  normalizeStoreSubmitList,
  SUBMIT_LOAD_FAILED_MESSAGE,
  SUBMIT_START_FAILED_MESSAGE,
  type StoreSubmitJob,
  type StoreSubmitJobs,
  type SubmitPlatform,
} from '@/lib/storeSubmit/contract';

export type ListSubmitResult = { ok: true; jobs: StoreSubmitJobs } | { ok: false; message: string };

export type ReadSubmitResult =
  | { ok: true; job: StoreSubmitJob }
  | { ok: false; missing: true }
  | { ok: false; message: string };

export type StartSubmitResult = { ok: true; job: StoreSubmitJob } | { ok: false; message: string };

/**
 * Store-submit calls go through the dashboard mutator so a 401 refreshes the
 * access token and retries once. The store is the authenticated store. This
 * module does not send a client store id and does not log response bodies.
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

export async function listStoreSubmits(token: string, buildRequestId: string): Promise<ListSubmitResult> {
  if (!isBuildRequestId(buildRequestId)) return { ok: false, message: SUBMIT_LOAD_FAILED_MESSAGE };
  try {
    const result = await backend(token, `/build-requests/${buildRequestId}/submits`, { method: 'GET' });
    if (!result.ok) {
      return { ok: false, message: messageForSubmitFailure(result.status, result.body, 'load') };
    }
    return { ok: true, jobs: normalizeStoreSubmitList(result.body) };
  } catch {
    return { ok: false, message: messageForSubmitFailure(0, null, 'load') };
  }
}

export async function getStoreSubmit(
  token: string,
  buildRequestId: string,
  platform: SubmitPlatform
): Promise<ReadSubmitResult> {
  if (!isBuildRequestId(buildRequestId)) return { ok: false, message: SUBMIT_LOAD_FAILED_MESSAGE };
  if (platform !== 'ios' && platform !== 'android') {
    return { ok: false, message: SUBMIT_LOAD_FAILED_MESSAGE };
  }
  try {
    const result = await backend(token, `/build-requests/${buildRequestId}/submits/${platform}`, {
      method: 'GET',
    });
    if (result.status === 404) return { ok: false, missing: true };
    if (!result.ok) {
      return { ok: false, message: messageForSubmitFailure(result.status, result.body, 'load') };
    }
    const job = normalizeStoreSubmit(result.body);
    return job ? { ok: true, job } : { ok: false, message: SUBMIT_LOAD_FAILED_MESSAGE };
  } catch {
    return { ok: false, message: messageForSubmitFailure(0, null, 'load') };
  }
}

export async function startStoreSubmit(
  token: string,
  buildRequestId: string,
  platform: SubmitPlatform
): Promise<StartSubmitResult> {
  if (!isBuildRequestId(buildRequestId) || (platform !== 'ios' && platform !== 'android')) {
    return { ok: false, message: SUBMIT_START_FAILED_MESSAGE };
  }
  try {
    const result = await backend(token, `/build-requests/${buildRequestId}/submits`, {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
    const interpreted = interpretSubmitStart(result.status, result.body);
    if (interpreted.kind === 'job') return { ok: true, job: interpreted.job };
    return { ok: false, message: interpreted.message };
  } catch {
    return { ok: false, message: messageForSubmitFailure(0, null, 'start') };
  }
}
