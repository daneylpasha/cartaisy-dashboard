import { API_URL, customInstance } from '@/lib/api/mutator/custom-instance';
import { isBuildRequestId, type PlatformKind, type PlatformStatus } from '@/lib/build/contract';
import {
  adminBuildRequestsPath,
  adminBuildStatusPath,
  normalizeAdminBuildPage,
  normalizeAdminStatusSnapshot,
  statusPatchBody,
  type AdminBuildPage,
  type AdminQueueFilter,
  type AdminStatusSnapshot,
} from '@/lib/build/adminContract';

export type AdminListResult =
  | { kind: 'ok'; page: AdminBuildPage }
  | { kind: 'forbidden' }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'error'; message: string };

export type AdminStatusResult =
  | { kind: 'ok'; snapshot: AdminStatusSnapshot }
  | { kind: 'forbidden' }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

const SIGN_IN = 'Sign in again to update build requests.';
const LOAD_ERROR = 'We could not load build requests. Try again.';
const SAVE_ERROR = 'We could not update that status. Try again.';

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

function errorText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== 'string') return null;
  const trimmed = error.trim();
  return trimmed || null;
}

function gate(
  status: number,
  payload: unknown,
  fallback: string
): { kind: 'unauthorized'; message: string } | { kind: 'forbidden' } | { kind: 'error'; message: string } | null {
  if (status === 401) return { kind: 'unauthorized', message: SIGN_IN };
  if (status === 403) return { kind: 'forbidden' };
  if (status < 200 || status >= 300) {
    return { kind: 'error', message: errorText(payload) ?? fallback };
  }
  return null;
}

export async function listAdminBuildRequests(
  token: string,
  query: { page?: number; limit?: number; filter?: AdminQueueFilter }
): Promise<AdminListResult> {
  try {
    const result = await backend(token, adminBuildRequestsPath(query), { method: 'GET' });
    const blocked = gate(result.status, result.body, LOAD_ERROR);
    if (blocked) return blocked;
    const page = normalizeAdminBuildPage(result.body);
    if (!page) return { kind: 'error', message: LOAD_ERROR };
    return { kind: 'ok', page };
  } catch {
    return { kind: 'error', message: LOAD_ERROR };
  }
}

export async function updateAdminBuildStatus(
  token: string,
  id: string,
  platform: PlatformKind,
  status: PlatformStatus
): Promise<AdminStatusResult> {
  if (!isBuildRequestId(id)) return { kind: 'missing' };
  try {
    const result = await backend(token, adminBuildStatusPath(id), {
      method: 'PATCH',
      body: JSON.stringify(statusPatchBody(platform, status)),
    });
    if (result.status === 404) return { kind: 'missing' };
    if (result.status === 400) {
      return { kind: 'invalid', message: errorText(result.body) ?? 'That status is not allowed.' };
    }
    const blocked = gate(result.status, result.body, SAVE_ERROR);
    if (blocked) return blocked;
    const snapshot = normalizeAdminStatusSnapshot(result.body);
    if (!snapshot || snapshot.id !== id) return { kind: 'error', message: SAVE_ERROR };
    return { kind: 'ok', snapshot };
  } catch {
    return { kind: 'error', message: SAVE_ERROR };
  }
}
