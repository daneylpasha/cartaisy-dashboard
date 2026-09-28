/**
 * Merchant store-credential status. The Apple private key and the Google
 * service-account JSON are never part of this shape.
 *
 * Contract: cartaisy-backend `docs/cartaisy/STORE_CREDENTIALS_API.md`.
 */

export const CREDENTIAL_FILE_MAX_BYTES = 64 * 1024;

export const APPLE_INVALID_MESSAGE =
  'Check the key ID and issuer ID, then upload the App Store Connect API key (.p8) again.';
export const GOOGLE_INVALID_MESSAGE = 'Upload the Google Play service account JSON file again.';
export const APPLE_NEEDS_ATTENTION_MESSAGE = 'Upload the App Store Connect API key again.';
export const GOOGLE_NEEDS_ATTENTION_MESSAGE = 'Upload the Google Play service account JSON again.';
export const CREDENTIAL_FILE_TOO_LARGE_MESSAGE = 'That file is too large. Upload the original key file.';
export const CREDENTIAL_FILE_UNREADABLE_MESSAGE = 'That file could not be read. Upload the original key file.';
export const CREDENTIAL_SAVE_FAILED_MESSAGE = 'Those credentials could not be saved. Try again.';
export const CREDENTIAL_LOAD_FAILED_MESSAGE = 'Store credentials could not be loaded. Try again.';
export const CREDENTIAL_REMOVE_FAILED_MESSAGE = 'Those credentials could not be removed. Try again.';
export const CREDENTIAL_SIGN_IN_MESSAGE = 'Sign in again to connect your store accounts.';
export const CREDENTIAL_FORBIDDEN_MESSAGE = 'You need to be a store admin to connect store accounts.';

export const CREDENTIALS_HELPER =
  'Connect the Apple and Google accounts this store publishes with. You will need them before a later submit to the App Store or Google Play. Preview, Build my app, and install links stay available either way.';

export const BUILD_SETUP_SETTINGS_HREF = '/dashboard/settings#build-setup';
export const BUILD_MY_APP_HREF = '/dashboard/onboarding?step=ready';

const APPLE_KEY_ID = /^[A-Za-z0-9]{10}$/;
const APPLE_ISSUER_ID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const LAST4 = /^[A-Za-z0-9_-]{4}$/;
const GOOGLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECRET_MARKERS = ['-----BEGIN', 'PRIVATE KEY', 'private_key'];

const SAFE_ERROR_MESSAGES = new Set([
  APPLE_INVALID_MESSAGE,
  GOOGLE_INVALID_MESSAGE,
  APPLE_NEEDS_ATTENTION_MESSAGE,
  GOOGLE_NEEDS_ATTENTION_MESSAGE,
  CREDENTIAL_FILE_TOO_LARGE_MESSAGE,
  CREDENTIAL_FILE_UNREADABLE_MESSAGE,
  CREDENTIAL_SAVE_FAILED_MESSAGE,
  CREDENTIAL_LOAD_FAILED_MESSAGE,
  CREDENTIAL_REMOVE_FAILED_MESSAGE,
]);

export type CredentialStatus = 'connected' | 'missing' | 'needsAttention';

export type CredentialPlatform = 'apple' | 'google';

export interface AppleCredentialStatus {
  status: CredentialStatus;
  keyIdLast4: string | null;
  issuerIdLast4: string | null;
  updatedAt: string | null;
  message: string | null;
}

export interface GoogleCredentialStatus {
  status: CredentialStatus;
  clientEmail: string | null;
  privateKeyIdLast4: string | null;
  updatedAt: string | null;
  message: string | null;
}

export interface StoreCredentialsStatus {
  apple: AppleCredentialStatus;
  google: GoogleCredentialStatus;
}

export interface CredentialFileInput {
  name: string;
  size: number;
}

const MISSING_APPLE: AppleCredentialStatus = {
  status: 'missing',
  keyIdLast4: null,
  issuerIdLast4: null,
  updatedAt: null,
  message: null,
};

const MISSING_GOOGLE: GoogleCredentialStatus = {
  status: 'missing',
  clientEmail: null,
  privateKeyIdLast4: null,
  updatedAt: null,
  message: null,
};

export const EMPTY_STORE_CREDENTIALS: StoreCredentialsStatus = {
  apple: MISSING_APPLE,
  google: MISSING_GOOGLE,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function containsCredentialSecret(value: string): boolean {
  return SECRET_MARKERS.some((marker) => value.includes(marker));
}

export function credentialStatusLabel(status: CredentialStatus): string {
  if (status === 'connected') return 'Connected';
  if (status === 'needsAttention') return 'Needs attention';
  return 'Not connected';
}

/** The upload form stays open until a platform is connected. Replace reopens it. */
export function credentialFormOpen(status: CredentialStatus, replacing: boolean): boolean {
  return status !== 'connected' || replacing;
}

export function canDisconnectCredential(status: CredentialStatus): boolean {
  return status === 'connected' || status === 'needsAttention';
}

export function formatCredentialUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const month = MONTHS[date.getUTCMonth()];
  if (!month) return null;
  return `Saved ${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Filename only. A name that looks like key material is not shown. */
export function safeCredentialFileName(name: string | null | undefined): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const base = trimmed.split(/[/\\]/).pop() ?? trimmed;
  if (!base || base.length > 180 || containsCredentialSecret(base)) return 'Selected file';
  return base;
}

export function appleSubmissionError(input: {
  keyId: string;
  issuerId: string;
  file: CredentialFileInput | null;
}): string | null {
  const keyId = input.keyId.trim();
  const issuerId = input.issuerId.trim();
  if (!keyId || !issuerId || !input.file) {
    return 'Add the Key ID, the Issuer ID, and the App Store Connect API key (.p8).';
  }
  if (!APPLE_KEY_ID.test(keyId) || !APPLE_ISSUER_ID.test(issuerId)) {
    return APPLE_INVALID_MESSAGE;
  }
  return credentialFileError(input.file, 'apple');
}

export function googleSubmissionError(file: CredentialFileInput | null): string | null {
  if (!file) return 'Upload the Google Play service account JSON file.';
  return credentialFileError(file, 'google');
}

function credentialFileError(file: CredentialFileInput, platform: CredentialPlatform): string | null {
  if (file.size <= 0) {
    return platform === 'apple' ? APPLE_INVALID_MESSAGE : GOOGLE_INVALID_MESSAGE;
  }
  if (file.size > CREDENTIAL_FILE_MAX_BYTES) return CREDENTIAL_FILE_TOO_LARGE_MESSAGE;
  const name = file.name.trim().toLowerCase();
  if (platform === 'apple' && !name.endsWith('.p8')) return APPLE_INVALID_MESSAGE;
  if (platform === 'google' && !name.endsWith('.json')) return GOOGLE_INVALID_MESSAGE;
  return null;
}

export function messageForCredentialFailure(
  status: number,
  payload: unknown,
  action: 'load' | 'save' | 'remove',
  platform?: CredentialPlatform
): string {
  if (status === 401) return CREDENTIAL_SIGN_IN_MESSAGE;
  if (status === 403) return CREDENTIAL_FORBIDDEN_MESSAGE;

  const root = asRecord(payload);
  const error = typeof root?.error === 'string' ? root.error : '';
  if (SAFE_ERROR_MESSAGES.has(error) && !containsCredentialSecret(error)) return error;

  if (status === 400 && root?.code === 'STORE_CREDENTIALS_INVALID') {
    if (platform === 'apple') return APPLE_INVALID_MESSAGE;
    if (platform === 'google') return GOOGLE_INVALID_MESSAGE;
  }

  if (action === 'load') return CREDENTIAL_LOAD_FAILED_MESSAGE;
  if (action === 'remove') return CREDENTIAL_REMOVE_FAILED_MESSAGE;
  return CREDENTIAL_SAVE_FAILED_MESSAGE;
}

/**
 * Reads the status envelope and keeps only safe metadata. A private key,
 * ciphertext, or service-account blob on the payload is ignored.
 */
export function normalizeStoreCredentials(payload: unknown): StoreCredentialsStatus | null {
  const data = readData(payload);
  if (!data) return null;
  if (!('apple' in data) && !('google' in data)) return null;
  return {
    apple: normalizeApple(data.apple),
    google: normalizeGoogle(data.google),
  };
}

function normalizeApple(value: unknown): AppleCredentialStatus {
  const record = asRecord(value);
  const status = readStatus(record?.status);
  if (!record || status === 'missing') return { ...MISSING_APPLE };
  return {
    status,
    keyIdLast4: readLast4(record.keyIdLast4),
    issuerIdLast4: readLast4(record.issuerIdLast4),
    updatedAt: readUpdatedAt(record.updatedAt),
    message: status === 'needsAttention' ? APPLE_NEEDS_ATTENTION_MESSAGE : null,
  };
}

function normalizeGoogle(value: unknown): GoogleCredentialStatus {
  const record = asRecord(value);
  const status = readStatus(record?.status);
  if (!record || status === 'missing') return { ...MISSING_GOOGLE };
  return {
    status,
    clientEmail: readEmail(record.clientEmail),
    privateKeyIdLast4: readLast4(record.privateKeyIdLast4),
    updatedAt: readUpdatedAt(record.updatedAt),
    message: status === 'needsAttention' ? GOOGLE_NEEDS_ATTENTION_MESSAGE : null,
  };
}

function readData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

function readStatus(value: unknown): CredentialStatus {
  if (value === 'connected' || value === 'missing' || value === 'needsAttention') return value;
  return 'missing';
}

function readLast4(value: unknown): string | null {
  if (typeof value !== 'string' || !LAST4.test(value) || containsCredentialSecret(value)) return null;
  return value;
}

function readEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (!email || email.length > 320 || !GOOGLE_EMAIL.test(email) || containsCredentialSecret(email)) return null;
  return email;
}

function readUpdatedAt(value: unknown): string | null {
  if (typeof value !== 'string' || containsCredentialSecret(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
