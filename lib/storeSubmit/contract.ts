/**
 * Merchant store submit. The Apple private key, the Google service-account
 * JSON, and the Expo token are never part of this shape.
 *
 * Contract: cartaisy-backend `docs/cartaisy/STORE_SUBMIT_API.md`.
 */

import { isBuildRequestId, type PlatformStatus } from '../build/contract.ts';
import { containsCredentialSecret, type CredentialStatus } from '../storeCredentials/contract.ts';

/** Poll while a submit is still moving. A few seconds is enough. */
export const SUBMIT_STATUS_POLL_MS = 4000;

export const SUBMIT_STATUSES = ['queued', 'submitting', 'submitted', 'failed'] as const;

export type SubmitStatus = (typeof SUBMIT_STATUSES)[number];

export type SubmitPlatform = 'ios' | 'android';

export const STORE_ACCOUNTS_ANCHOR = '#store-accounts-heading';

export const SUBMIT_SIGN_IN_MESSAGE = 'Sign in again to submit this build.';
export const SUBMIT_FORBIDDEN_MESSAGE = 'You need to be a store admin to submit this build.';
export const SUBMIT_START_FAILED_MESSAGE = 'The store submit could not be started. Try again in a few minutes.';
export const SUBMIT_LOAD_FAILED_MESSAGE = 'Store submit could not be loaded. Try again.';
export const SUBMIT_NOT_READY_MESSAGE = 'This build needs to finish before it can be submitted.';
export const SUBMIT_CHECKING_ACCOUNTS_MESSAGE = 'Checking store accounts...';
export const SUBMIT_ACCOUNTS_UNAVAILABLE_MESSAGE =
  'Store accounts could not be loaded. Try again before submitting.';
export const SUBMIT_FAILED_FALLBACK_MESSAGE = 'This submit did not finish. You can try again.';
export const SUBMIT_FAILED_TITLE = 'This submit did not finish';
export const SUBMIT_MISSING_APPLE = 'Connect an App Store Connect API key before submitting to the App Store.';
export const SUBMIT_MISSING_GOOGLE = 'Connect a Google Play service account before submitting to Play.';
export const SUBMIT_ATTENTION_APPLE = 'Upload the App Store Connect API key again before submitting.';
export const SUBMIT_ATTENTION_GOOGLE = 'Upload the Google Play service account JSON again before submitting.';
export const SUBMIT_SENT_IOS_TITLE = 'Sent to App Store Connect';
export const SUBMIT_SENT_ANDROID_TITLE = 'Sent to Google Play';
export const SUBMIT_REVIEW_IOS =
  'Apple reviews this before it is available. Check App Store Connect for the review. It often takes a day or two, and it can take longer.';
export const SUBMIT_REVIEW_ANDROID =
  'It is on the internal testing track. Check Play Console for the review before testers can install it. It can finish the same day, and it can take longer.';
export const SUBMIT_PROGRESS_IOS = 'Sending this build to App Store Connect.';
export const SUBMIT_PROGRESS_ANDROID = 'Sending this build to Google Play.';
export const SUBMIT_QUEUED_COPY = 'Waiting to send this build.';
export const SUBMIT_QUEUED_TITLE = 'Waiting to send';
export const SUBMIT_SENDING_IOS_TITLE = 'Sending to App Store Connect';
export const SUBMIT_SENDING_ANDROID_TITLE = 'Sending to Google Play';

const UNSAFE_SUBMIT_TEXT =
  /EXPO_TOKEN|shpat_|shpss_|shpca_|shpct_|shpua_|easBuildId|easSubmissionId|keyP8|access_token|api_secret|client_secret|refresh_token|serviceAccount|BEGIN [A-Z0-9 ]*PRIVATE/i;

export interface StoreSubmitJob {
  id: string;
  buildRequestId: string;
  platform: SubmitPlatform;
  status: SubmitStatus;
  createdAt: string;
  updatedAt: string;
  /** Fixed failure sentence. Null unless status is failed and the text is safe. */
  message: string | null;
}

export interface StoreSubmitJobs {
  android: StoreSubmitJob | null;
  ios: StoreSubmitJob | null;
}

export const EMPTY_STORE_SUBMITS: StoreSubmitJobs = { android: null, ios: null };

export type StoreSubmitTone = 'idle' | 'progress' | 'submitted' | 'failed';

export type StoreSubmitState = 'idle' | 'blocked' | 'submitting' | 'submitted' | 'failed';

export interface StoreSubmitPresentation {
  platform: SubmitPlatform;
  label: string;
  disabled: boolean;
  quiet: boolean;
  tone: StoreSubmitTone;
  state: StoreSubmitState;
  statusLabel: string | null;
  /** Confirmation title after a submit is sent or has failed. Null while it is still moving. */
  headline: string | null;
  /** Where to check the review, after a successful submit. No store URL. */
  nextStep: string | null;
  detail: string | null;
  guidance: string | null;
  alert: string | null;
  showConnect: boolean;
}

export function isSafeMerchantText(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 400) return false;
  if (containsCredentialSecret(trimmed)) return false;
  if (UNSAFE_SUBMIT_TEXT.test(trimmed)) return false;
  return true;
}

export function shouldPollStoreSubmit(status: SubmitStatus | null | undefined): boolean {
  return status === 'queued' || status === 'submitting';
}

export interface SubmitOutcomeCopy {
  tone: 'progress' | 'submitted' | 'failed';
  headline: string;
  body: string;
}

/**
 * Merchant copy for a submit the API already returned.
 * Progress stays a short status. Sent and failed name what happened next.
 * Nothing here is a store URL.
 */
export function submitOutcomeCopy(
  platform: SubmitPlatform,
  status: SubmitStatus,
  message: string | null
): SubmitOutcomeCopy {
  if (status === 'queued') {
    return { tone: 'progress', headline: SUBMIT_QUEUED_TITLE, body: SUBMIT_QUEUED_COPY };
  }
  if (status === 'submitting') {
    return {
      tone: 'progress',
      headline: platform === 'ios' ? SUBMIT_SENDING_IOS_TITLE : SUBMIT_SENDING_ANDROID_TITLE,
      body: platform === 'ios' ? SUBMIT_PROGRESS_IOS : SUBMIT_PROGRESS_ANDROID,
    };
  }
  if (status === 'submitted') {
    return {
      tone: 'submitted',
      headline: platform === 'ios' ? SUBMIT_SENT_IOS_TITLE : SUBMIT_SENT_ANDROID_TITLE,
      body: platform === 'ios' ? SUBMIT_REVIEW_IOS : SUBMIT_REVIEW_ANDROID,
    };
  }
  const body = message && isSafeMerchantText(message) ? message.trim() : SUBMIT_FAILED_FALLBACK_MESSAGE;
  return { tone: 'failed', headline: SUBMIT_FAILED_TITLE, body };
}

export interface HomeSubmitNotice {
  platform: SubmitPlatform;
  label: 'Android' | 'iOS';
  tone: 'progress' | 'submitted' | 'failed';
  headline: string;
  body: string;
}

/** Home notes for submits that are moving, sent, or failed. Idle builds are omitted. */
export function homeSubmitNotices(jobs: StoreSubmitJobs): HomeSubmitNotice[] {
  const notices: HomeSubmitNotice[] = [];
  for (const platform of ['android', 'ios'] as const) {
    const job = jobs[platform];
    if (!job) continue;
    const copy = submitOutcomeCopy(platform, job.status, job.message);
    notices.push({
      platform,
      label: platform === 'ios' ? 'iOS' : 'Android',
      tone: copy.tone,
      headline: copy.headline,
      body: copy.body,
    });
  }
  return notices;
}

export function homeSubmitTitle(notices: HomeSubmitNotice[]): string | null {
  if (notices.length === 0) return null;
  const tones = new Set(notices.map((notice) => notice.tone));
  if (tones.size === 1 && tones.has('progress')) return 'Sending to the store';
  if (tones.size === 1 && tones.has('submitted')) return 'Sent for review';
  if (tones.size === 1 && tones.has('failed')) return 'A submit needs another try';
  return 'Store submit';
}

export function submitActionLabel(platform: SubmitPlatform): string {
  return platform === 'ios' ? 'Submit to App Store' : 'Submit to Play';
}

export function credentialForSubmit(
  platform: SubmitPlatform,
  phase: 'loading' | 'error' | 'ready',
  credentials: { apple: { status: CredentialStatus }; google: { status: CredentialStatus } } | null
): CredentialStatus | 'unknown' {
  if (phase !== 'ready' || !credentials) return 'unknown';
  return platform === 'ios' ? credentials.apple.status : credentials.google.status;
}

function credentialBlock(platform: SubmitPlatform, credential: CredentialStatus | 'unknown', accountsUnavailable: boolean): {
  reason: string | null;
  showConnect: boolean;
} {
  if (credential === 'connected') return { reason: null, showConnect: false };
  if (credential === 'missing') {
    return {
      reason: platform === 'ios' ? SUBMIT_MISSING_APPLE : SUBMIT_MISSING_GOOGLE,
      showConnect: true,
    };
  }
  if (credential === 'needsAttention') {
    return {
      reason: platform === 'ios' ? SUBMIT_ATTENTION_APPLE : SUBMIT_ATTENTION_GOOGLE,
      showConnect: true,
    };
  }
  return {
    reason: accountsUnavailable ? SUBMIT_ACCOUNTS_UNAVAILABLE_MESSAGE : SUBMIT_CHECKING_ACCOUNTS_MESSAGE,
    showConnect: false,
  };
}

/**
 * What one platform's submit control shows. A missing account or an unfinished
 * build disables only this control.
 */
export function presentStoreSubmit(input: {
  platform: SubmitPlatform;
  buildStatus: PlatformStatus | 'unknown';
  credential: CredentialStatus | 'unknown';
  accountsUnavailable: boolean;
  job: StoreSubmitJob | null;
  busy: boolean;
  error: string | null;
}): StoreSubmitPresentation {
  const artifactReady = input.buildStatus === 'ready';
  const inFlight = Boolean(input.job && shouldPollStoreSubmit(input.job.status));
  const moving = input.busy || inFlight;
  const block = artifactReady
    ? credentialBlock(input.platform, input.credential, input.accountsUnavailable)
    : { reason: SUBMIT_NOT_READY_MESSAGE, showConnect: false };

  const tone: StoreSubmitTone = moving
    ? 'progress'
    : input.job?.status === 'submitted'
      ? 'submitted'
      : input.job?.status === 'failed'
        ? 'failed'
        : 'idle';
  const settled = !moving && input.job ? submitOutcomeCopy(input.platform, input.job.status, input.job.message) : null;
  const headline = settled && settled.tone !== 'progress' ? settled.headline : null;
  const nextStep = settled?.tone === 'submitted' ? settled.body : null;

  const blocked = block.reason !== null && !moving;
  const disabled = moving || blocked;
  const again = input.job?.status === 'failed' || input.job?.status === 'submitted';

  let detail: string | null = null;
  let guidance: string | null = null;
  if (tone === 'progress') {
    detail =
      input.job?.status === 'queued' && !input.busy
        ? SUBMIT_QUEUED_COPY
        : input.platform === 'ios'
          ? SUBMIT_PROGRESS_IOS
          : SUBMIT_PROGRESS_ANDROID;
  } else if (tone === 'submitted') {
    detail = nextStep;
    guidance = block.reason;
  } else if (tone === 'failed') {
    guidance = block.reason;
  } else {
    detail = block.reason;
  }

  const safeError = input.error && isSafeMerchantText(input.error) ? input.error.trim() : null;
  const interrupt = safeError === SUBMIT_SIGN_IN_MESSAGE || safeError === SUBMIT_FORBIDDEN_MESSAGE;
  let alert: string | null = null;
  if (safeError && (!moving || interrupt)) alert = safeError;
  else if (tone === 'failed') {
    alert = settled?.tone === 'failed' ? settled.body : SUBMIT_FAILED_FALLBACK_MESSAGE;
  }

  const statusLabel =
    tone === 'progress'
      ? input.job?.status === 'queued' && !input.busy
        ? 'Queued'
        : 'Submitting'
      : tone === 'submitted'
        ? 'Submitted'
        : tone === 'failed'
          ? 'Failed'
          : null;

  const state: StoreSubmitState = moving
    ? 'submitting'
    : tone === 'submitted'
      ? 'submitted'
      : tone === 'failed'
        ? 'failed'
        : blocked
          ? 'blocked'
          : 'idle';

  return {
    platform: input.platform,
    label: moving ? 'Submitting...' : again ? 'Submit again' : submitActionLabel(input.platform),
    disabled,
    quiet: tone === 'submitted' && !disabled,
    tone,
    state,
    statusLabel,
    headline,
    nextStep,
    detail,
    guidance,
    alert,
    showConnect: block.showConnect && !moving,
  };
}

export function normalizeStoreSubmit(payload: unknown): StoreSubmitJob | null {
  const data = readData(payload);
  if (!data) return null;
  if (typeof data.id !== 'string' || !isBuildRequestId(data.id)) return null;
  if (typeof data.buildRequestId !== 'string' || !isBuildRequestId(data.buildRequestId)) return null;
  if (data.platform !== 'ios' && data.platform !== 'android') return null;
  if (typeof data.status !== 'string' || !(SUBMIT_STATUSES as readonly string[]).includes(data.status)) return null;

  const createdAt = readIso(data.createdAt);
  const updatedAt = readIso(data.updatedAt);
  if (!createdAt || !updatedAt) return null;

  const status = data.status as SubmitStatus;
  const rawMessage = typeof data.message === 'string' ? data.message : null;
  const message =
    status === 'failed' && rawMessage && isSafeMerchantText(rawMessage) ? rawMessage.trim() : null;

  return {
    id: data.id,
    buildRequestId: data.buildRequestId,
    platform: data.platform,
    status,
    createdAt,
    updatedAt,
    message,
  };
}

export function normalizeStoreSubmitList(payload: unknown): StoreSubmitJobs {
  const data = readData(payload);
  const list = Array.isArray(data?.submits) ? data.submits : [];
  const jobs: StoreSubmitJobs = { android: null, ios: null };
  for (const item of list) {
    const job = normalizeStoreSubmit(item);
    if (!job) continue;
    const current = jobs[job.platform];
    if (!current || job.updatedAt >= current.updatedAt) jobs[job.platform] = job;
  }
  return jobs;
}

export function messageForSubmitFailure(status: number, payload: unknown, action: 'start' | 'load'): string {
  if (status === 401) return SUBMIT_SIGN_IN_MESSAGE;
  if (status === 403) return SUBMIT_FORBIDDEN_MESSAGE;
  const root = asRecord(payload);
  const error = typeof root?.error === 'string' ? root.error.trim() : '';
  if (error && isSafeMerchantText(error)) return error;
  return action === 'load' ? SUBMIT_LOAD_FAILED_MESSAGE : SUBMIT_START_FAILED_MESSAGE;
}

export function interpretSubmitStart(
  status: number,
  payload: unknown
): { kind: 'job'; job: StoreSubmitJob } | { kind: 'error'; message: string; code: string | null } {
  const root = asRecord(payload);
  const code = typeof root?.code === 'string' ? root.code : null;
  if (code === 'SUBMIT_ALREADY_IN_PROGRESS') {
    const job = normalizeStoreSubmit(root?.data ?? payload);
    if (job) return { kind: 'job', job };
  }
  if (status >= 200 && status < 300) {
    const job = normalizeStoreSubmit(payload);
    if (job) return { kind: 'job', job };
    return { kind: 'error', message: SUBMIT_START_FAILED_MESSAGE, code };
  }
  return { kind: 'error', message: messageForSubmitFailure(status, payload, 'start'), code };
}

function readIso(value: unknown): string | null {
  if (typeof value !== 'string' || !isSafeMerchantText(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function readData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
