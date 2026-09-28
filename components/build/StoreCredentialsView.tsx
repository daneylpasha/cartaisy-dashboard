'use client';

import type { ReactNode } from 'react';
import {
  BUILD_MY_APP_HREF,
  BUILD_SETUP_SETTINGS_HREF,
  CREDENTIALS_HELPER,
  canDisconnectCredential,
  credentialFormOpen,
  credentialStatusLabel,
  formatCredentialUpdatedAt,
  safeCredentialFileName,
  type AppleCredentialStatus,
  type CredentialStatus,
  type GoogleCredentialStatus,
  type StoreCredentialsStatus,
} from '@/lib/storeCredentials/contract';

const PRIMARY_BUTTON =
  'inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

const QUIET_BUTTON =
  'text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

const FIELD =
  'mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 disabled:bg-slate-50';

const FILE_INPUT =
  'mt-2 block w-full text-sm text-slate-600 file:mr-3 file:inline-flex file:h-9 file:cursor-pointer file:items-center file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60';

export interface PlatformFormState {
  open: boolean;
  submitting: boolean;
  error: string | null;
  confirmingDisconnect: boolean;
  fileName: string | null;
  fileKey: number;
}

export interface AppleFormState extends PlatformFormState {
  keyId: string;
  issuerId: string;
}

export interface StoreCredentialsViewProps {
  surface: 'build' | 'settings';
  phase: 'loading' | 'error' | 'ready';
  loadError: string | null;
  credentials: StoreCredentialsStatus | null;
  apple: AppleFormState;
  google: PlatformFormState;
  onRetry: () => void;
  onAppleKeyId: (value: string) => void;
  onAppleIssuerId: (value: string) => void;
  onAppleFile: (file: File | null) => void;
  onAppleSubmit: () => void;
  onAppleReplace: () => void;
  onAppleCancelReplace: () => void;
  onAppleAskDisconnect: () => void;
  onAppleConfirmDisconnect: () => void;
  onAppleCancelDisconnect: () => void;
  onGoogleFile: (file: File | null) => void;
  onGoogleSubmit: () => void;
  onGoogleReplace: () => void;
  onGoogleCancelReplace: () => void;
  onGoogleAskDisconnect: () => void;
  onGoogleConfirmDisconnect: () => void;
  onGoogleCancelDisconnect: () => void;
}

function pillClass(status: CredentialStatus): string {
  if (status === 'connected') return 'bg-emerald-50 text-emerald-800';
  if (status === 'needsAttention') return 'bg-amber-50 text-amber-900';
  return 'bg-slate-100 text-slate-600';
}

function StatusPill({ status }: { status: CredentialStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${pillClass(status)}`}>
      {credentialStatusLabel(status)}
    </span>
  );
}

function Card({
  platform,
  title,
  status,
  children,
}: {
  platform: 'apple' | 'google';
  title: string;
  status: CredentialStatus;
  children: ReactNode;
}) {
  return (
    <article
      data-platform={platform}
      data-status={status}
      className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-heading text-[15px] font-semibold tracking-tight text-slate-950">{title}</h4>
        <StatusPill status={status} />
      </div>
      {children}
    </article>
  );
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-3 text-sm leading-6 text-red-700" role="alert">
      {message}
    </p>
  );
}

function SavedLine({ iso }: { iso: string | null }) {
  const label = formatCredentialUpdatedAt(iso);
  if (!label) return null;
  return <p className="mt-1 text-xs text-slate-500">{label}</p>;
}

function DisconnectConfirm({
  prompt,
  busy,
  onConfirm,
  onCancel,
}: {
  prompt: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm leading-6 text-slate-600">{prompt}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" onClick={onConfirm} disabled={busy} className={PRIMARY_BUTTON}>
          {busy ? 'Removing...' : 'Disconnect'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={QUIET_BUTTON}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function QuietActions({
  replaceLabel,
  onReplace,
  onDisconnect,
  showReplace,
}: {
  replaceLabel: string;
  onReplace: () => void;
  onDisconnect: () => void;
  showReplace: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {showReplace ? (
        <button type="button" onClick={onReplace} className={QUIET_BUTTON}>
          {replaceLabel}
        </button>
      ) : null}
      <button type="button" onClick={onDisconnect} className={QUIET_BUTTON}>
        Disconnect
      </button>
    </div>
  );
}

export function StoreCredentialsView({
  surface,
  phase,
  loadError,
  credentials,
  apple,
  google,
  onRetry,
  onAppleKeyId,
  onAppleIssuerId,
  onAppleFile,
  onAppleSubmit,
  onAppleReplace,
  onAppleCancelReplace,
  onAppleAskDisconnect,
  onAppleConfirmDisconnect,
  onAppleCancelDisconnect,
  onGoogleFile,
  onGoogleSubmit,
  onGoogleReplace,
  onGoogleCancelReplace,
  onGoogleAskDisconnect,
  onGoogleConfirmDisconnect,
  onGoogleCancelDisconnect,
}: StoreCredentialsViewProps) {
  const frame =
    surface === 'settings' ? 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6' : 'mt-10 border-t border-slate-100 pt-8';

  return (
    <section className={frame} aria-labelledby="store-accounts-heading" data-credentials="store">
      <h3 id="store-accounts-heading" className="font-heading text-base font-semibold tracking-tight text-slate-950">
        App Store and Play
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{CREDENTIALS_HELPER}</p>
      {surface === 'build' ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          You can update these later in{' '}
          <a
            href={BUILD_SETUP_SETTINGS_HREF}
            className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Settings
          </a>
          .
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          The same connection is on{' '}
          <a
            href={BUILD_MY_APP_HREF}
            className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Build my app
          </a>
          .
        </p>
      )}

      {phase === 'loading' ? (
        <div className="mt-5" aria-busy="true">
          <p className="text-sm text-slate-600">Loading store accounts...</p>
          <div className="mt-4 space-y-3" aria-hidden>
            <div className="h-24 rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="h-24 rounded-2xl border border-slate-200 bg-slate-50" />
          </div>
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-600" role="alert">
            {loadError ?? 'We could not load your store accounts. Try again.'}
          </p>
          <button type="button" onClick={onRetry} className={`${PRIMARY_BUTTON} mt-4`}>
            Try again
          </button>
        </div>
      ) : null}

      {phase === 'ready' && credentials ? (
        <div className={`mt-5 grid gap-3 ${surface === 'settings' ? 'lg:grid-cols-2' : ''}`}>
          <AppleCard
            status={credentials.apple}
            form={apple}
            onKeyId={onAppleKeyId}
            onIssuerId={onAppleIssuerId}
            onFile={onAppleFile}
            onSubmit={onAppleSubmit}
            onReplace={onAppleReplace}
            onCancelReplace={onAppleCancelReplace}
            onAskDisconnect={onAppleAskDisconnect}
            onConfirmDisconnect={onAppleConfirmDisconnect}
            onCancelDisconnect={onAppleCancelDisconnect}
          />
          <GoogleCard
            status={credentials.google}
            form={google}
            onFile={onGoogleFile}
            onSubmit={onGoogleSubmit}
            onReplace={onGoogleReplace}
            onCancelReplace={onGoogleCancelReplace}
            onAskDisconnect={onGoogleAskDisconnect}
            onConfirmDisconnect={onGoogleConfirmDisconnect}
            onCancelDisconnect={onGoogleCancelDisconnect}
          />
        </div>
      ) : null}
    </section>
  );
}

function AppleCard({
  status,
  form,
  onKeyId,
  onIssuerId,
  onFile,
  onSubmit,
  onReplace,
  onCancelReplace,
  onAskDisconnect,
  onConfirmDisconnect,
  onCancelDisconnect,
}: {
  status: AppleCredentialStatus;
  form: AppleFormState;
  onKeyId: (value: string) => void;
  onIssuerId: (value: string) => void;
  onFile: (file: File | null) => void;
  onSubmit: () => void;
  onReplace: () => void;
  onCancelReplace: () => void;
  onAskDisconnect: () => void;
  onConfirmDisconnect: () => void;
  onCancelDisconnect: () => void;
}) {
  const showForm = credentialFormOpen(status.status, form.open);
  const fileName = safeCredentialFileName(form.fileName);

  return (
    <Card platform="apple" title="App Store Connect" status={status.status}>
      {status.status === 'missing' ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Upload the App Store Connect API key for this store. Use the Key ID, the Issuer ID, and the .p8 file.
        </p>
      ) : null}
      {status.status === 'needsAttention' ? (
        <p className="mt-2 text-sm leading-6 text-amber-900" role="status">
          {status.message ?? 'Upload the App Store Connect API key again.'}
        </p>
      ) : null}
      {status.status === 'connected' ? (
        <div className="mt-3" role="status">
          {status.keyIdLast4 ? (
            <p className="text-sm text-slate-950">Key ID ending in {status.keyIdLast4}</p>
          ) : (
            <p className="text-sm text-slate-600">Connected. The key id is not available to show.</p>
          )}
          {status.issuerIdLast4 ? (
            <p className="mt-1 text-sm text-slate-600">Issuer ID ending in {status.issuerIdLast4}</p>
          ) : null}
          <SavedLine iso={status.updatedAt} />
        </div>
      ) : null}
      {status.status === 'needsAttention' && (status.keyIdLast4 || status.issuerIdLast4) ? (
        <div className="mt-3">
          {status.keyIdLast4 ? <p className="text-sm text-slate-600">Key ID ending in {status.keyIdLast4}</p> : null}
          {status.issuerIdLast4 ? (
            <p className="mt-1 text-sm text-slate-600">Issuer ID ending in {status.issuerIdLast4}</p>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <div className="mt-4">
          <label htmlFor="apple-key-id" className="text-sm font-medium text-slate-950">
            Key ID
          </label>
          <input
            id="apple-key-id"
            value={form.keyId}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={10}
            disabled={form.submitting}
            onChange={(event) => onKeyId(event.target.value)}
            className={FIELD}
          />
          <label htmlFor="apple-issuer-id" className="mt-3 block text-sm font-medium text-slate-950">
            Issuer ID
          </label>
          <input
            id="apple-issuer-id"
            value={form.issuerId}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={36}
            disabled={form.submitting}
            onChange={(event) => onIssuerId(event.target.value)}
            className={FIELD}
          />
          <label htmlFor="apple-private-key" className="mt-3 block text-sm font-medium text-slate-950">
            API key
          </label>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            The .p8 file from App Store Connect. It is stored on the server and is not shown again.
          </p>
          <input
            id="apple-private-key"
            key={form.fileKey}
            type="file"
            accept=".p8"
            disabled={form.submitting}
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            className={FILE_INPUT}
          />
          {fileName ? <p className="mt-2 text-xs text-slate-500">{fileName}</p> : null}
          <FieldError message={form.error} />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onSubmit} disabled={form.submitting} className={PRIMARY_BUTTON}>
              {form.submitting ? 'Connecting...' : 'Connect Apple'}
            </button>
            {status.status === 'connected' ? (
              <button type="button" onClick={onCancelReplace} disabled={form.submitting} className={QUIET_BUTTON}>
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {canDisconnectCredential(status.status) && form.confirmingDisconnect ? (
        <DisconnectConfirm
          prompt="Disconnect App Store Connect? You can upload the key again later."
          busy={form.submitting}
          onConfirm={onConfirmDisconnect}
          onCancel={onCancelDisconnect}
        />
      ) : null}

      {canDisconnectCredential(status.status) && !form.confirmingDisconnect && !showForm ? (
        <QuietActions
          replaceLabel="Replace key"
          showReplace
          onReplace={onReplace}
          onDisconnect={onAskDisconnect}
        />
      ) : null}

      {status.status === 'needsAttention' && !form.confirmingDisconnect ? (
        <div className="mt-4">
          <button type="button" onClick={onAskDisconnect} className={QUIET_BUTTON}>
            Disconnect
          </button>
        </div>
      ) : null}
    </Card>
  );
}

function GoogleCard({
  status,
  form,
  onFile,
  onSubmit,
  onReplace,
  onCancelReplace,
  onAskDisconnect,
  onConfirmDisconnect,
  onCancelDisconnect,
}: {
  status: GoogleCredentialStatus;
  form: PlatformFormState;
  onFile: (file: File | null) => void;
  onSubmit: () => void;
  onReplace: () => void;
  onCancelReplace: () => void;
  onAskDisconnect: () => void;
  onConfirmDisconnect: () => void;
  onCancelDisconnect: () => void;
}) {
  const showForm = credentialFormOpen(status.status, form.open);
  const fileName = safeCredentialFileName(form.fileName);

  return (
    <Card platform="google" title="Google Play" status={status.status}>
      {status.status === 'missing' ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">Upload the Google Play service account JSON for this store.</p>
      ) : null}
      {status.status === 'needsAttention' ? (
        <p className="mt-2 text-sm leading-6 text-amber-900" role="status">
          {status.message ?? 'Upload the Google Play service account JSON again.'}
        </p>
      ) : null}
      {status.status === 'connected' ? (
        <div className="mt-3" role="status">
          {status.clientEmail ? (
            <p className="break-all text-sm text-slate-950">{status.clientEmail}</p>
          ) : (
            <p className="text-sm text-slate-600">Connected. The account email is not available to show.</p>
          )}
          {status.privateKeyIdLast4 ? (
            <p className="mt-1 text-sm text-slate-600">Key ID ending in {status.privateKeyIdLast4}</p>
          ) : null}
          <SavedLine iso={status.updatedAt} />
        </div>
      ) : null}
      {status.status === 'needsAttention' && status.clientEmail ? (
        <p className="mt-3 break-all text-sm text-slate-600">{status.clientEmail}</p>
      ) : null}

      {showForm ? (
        <div className="mt-4">
          <label htmlFor="google-service-account" className="text-sm font-medium text-slate-950">
            Service account
          </label>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            The JSON file from Google Play. It is stored on the server and is not shown again.
          </p>
          <input
            id="google-service-account"
            key={form.fileKey}
            type="file"
            accept=".json,application/json"
            disabled={form.submitting}
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            className={FILE_INPUT}
          />
          {fileName ? <p className="mt-2 text-xs text-slate-500">{fileName}</p> : null}
          <FieldError message={form.error} />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" onClick={onSubmit} disabled={form.submitting} className={PRIMARY_BUTTON}>
              {form.submitting ? 'Connecting...' : 'Connect Google Play'}
            </button>
            {status.status === 'connected' ? (
              <button type="button" onClick={onCancelReplace} disabled={form.submitting} className={QUIET_BUTTON}>
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {canDisconnectCredential(status.status) && form.confirmingDisconnect ? (
        <DisconnectConfirm
          prompt="Disconnect Google Play? You can upload the file again later."
          busy={form.submitting}
          onConfirm={onConfirmDisconnect}
          onCancel={onCancelDisconnect}
        />
      ) : null}

      {canDisconnectCredential(status.status) && !form.confirmingDisconnect && !showForm ? (
        <QuietActions
          replaceLabel="Replace JSON"
          showReplace
          onReplace={onReplace}
          onDisconnect={onAskDisconnect}
        />
      ) : null}

      {status.status === 'needsAttention' && !form.confirmingDisconnect ? (
        <div className="mt-4">
          <button type="button" onClick={onAskDisconnect} className={QUIET_BUTTON}>
            Disconnect
          </button>
        </div>
      ) : null}
    </Card>
  );
}

export function emptyAppleForm(): AppleFormState {
  return {
    open: false,
    submitting: false,
    error: null,
    confirmingDisconnect: false,
    fileName: null,
    fileKey: 0,
    keyId: '',
    issuerId: '',
  };
}

export function emptyGoogleForm(): PlatformFormState {
  return {
    open: false,
    submitting: false,
    error: null,
    confirmingDisconnect: false,
    fileName: null,
    fileKey: 0,
  };
}
