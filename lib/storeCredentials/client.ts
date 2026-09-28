import { API_URL, customInstance } from '@/lib/api/mutator/custom-instance';
import {
  appleSubmissionError,
  googleSubmissionError,
  messageForCredentialFailure,
  normalizeStoreCredentials,
  CREDENTIAL_SAVE_FAILED_MESSAGE,
  type CredentialPlatform,
  type StoreCredentialsStatus,
} from '@/lib/storeCredentials/contract';

export type CredentialReadResult =
  | { ok: true; credentials: StoreCredentialsStatus }
  | { ok: false; message: string };

export type CredentialWriteResult = CredentialReadResult;

/**
 * Store-credential calls go through the dashboard mutator so a 401 refreshes
 * the access token and retries once. The store is the authenticated store.
 * This module does not send a client store id and does not read file text.
 */
async function requestCredentials(
  token: string,
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: FormData
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const result = await customInstance<{ data: unknown; status: number }>(`${API_URL}${path}`, {
    method,
    body,
    token,
    headers: { Accept: 'application/json' },
  });
  const status = result.status;
  return { ok: status >= 200 && status < 300, status, body: result.data ?? null };
}

function saved(body: unknown, action: 'load' | 'save' | 'remove', platform?: CredentialPlatform): CredentialReadResult {
  const credentials = normalizeStoreCredentials(body);
  if (!credentials) {
    return { ok: false, message: messageForCredentialFailure(500, null, action, platform) };
  }
  return { ok: true, credentials };
}

export async function fetchStoreCredentials(token: string): Promise<CredentialReadResult> {
  try {
    const result = await requestCredentials(token, '/store-credentials', 'GET');
    if (!result.ok) {
      return { ok: false, message: messageForCredentialFailure(result.status, result.body, 'load') };
    }
    return saved(result.body, 'load');
  } catch {
    return { ok: false, message: messageForCredentialFailure(0, null, 'load') };
  }
}

export async function connectAppleCredentials(
  token: string,
  input: { keyId: string; issuerId: string; privateKey: File }
): Promise<CredentialWriteResult> {
  if (!(input.privateKey instanceof Blob)) {
    return { ok: false, message: CREDENTIAL_SAVE_FAILED_MESSAGE };
  }
  const local = appleSubmissionError({
    keyId: input.keyId,
    issuerId: input.issuerId,
    file: input.privateKey,
  });
  if (local) return { ok: false, message: local };

  const form = new FormData();
  form.append('keyId', input.keyId.trim());
  form.append('issuerId', input.issuerId.trim());
  form.append('privateKey', input.privateKey, input.privateKey.name);

  try {
    const result = await requestCredentials(token, '/store-credentials/apple', 'POST', form);
    if (!result.ok) {
      return { ok: false, message: messageForCredentialFailure(result.status, result.body, 'save', 'apple') };
    }
    return saved(result.body, 'save', 'apple');
  } catch {
    return { ok: false, message: messageForCredentialFailure(0, null, 'save', 'apple') };
  }
}

export async function connectGoogleCredentials(
  token: string,
  input: { serviceAccount: File }
): Promise<CredentialWriteResult> {
  if (!(input.serviceAccount instanceof Blob)) {
    return { ok: false, message: CREDENTIAL_SAVE_FAILED_MESSAGE };
  }
  const local = googleSubmissionError(input.serviceAccount);
  if (local) return { ok: false, message: local };

  const form = new FormData();
  form.append('serviceAccount', input.serviceAccount, input.serviceAccount.name);

  try {
    const result = await requestCredentials(token, '/store-credentials/google', 'POST', form);
    if (!result.ok) {
      return { ok: false, message: messageForCredentialFailure(result.status, result.body, 'save', 'google') };
    }
    return saved(result.body, 'save', 'google');
  } catch {
    return { ok: false, message: messageForCredentialFailure(0, null, 'save', 'google') };
  }
}

export async function disconnectAppleCredentials(token: string): Promise<CredentialWriteResult> {
  return disconnect(token, '/store-credentials/apple', 'apple');
}

export async function disconnectGoogleCredentials(token: string): Promise<CredentialWriteResult> {
  return disconnect(token, '/store-credentials/google', 'google');
}

async function disconnect(
  token: string,
  path: string,
  platform: CredentialPlatform
): Promise<CredentialWriteResult> {
  try {
    const result = await requestCredentials(token, path, 'DELETE');
    if (!result.ok) {
      return { ok: false, message: messageForCredentialFailure(result.status, result.body, 'remove', platform) };
    }
    return saved(result.body, 'remove', platform);
  } catch {
    return { ok: false, message: messageForCredentialFailure(0, null, 'remove', platform) };
  }
}
