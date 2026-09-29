'use client';

import { Check, ExternalLink } from 'lucide-react';
import {
  ACCESS_NOTES_MAX,
  buildProgressIndex,
  isLivePlatformStatus,
  isSettledBuildRequest,
  merchantInstallHref,
  outcomeCopy,
  platformProgressCopy,
  platformStatusLabel,
  primaryBuildAction,
  shouldPollBuildRequest,
  type BuildRequest,
  type PlatformKind,
  type PlatformStatus,
  type PrimaryBuildAction,
} from '@/lib/build/contract';
import type { BuildRequestAvailability } from '@/lib/onboarding/types';
import { InstallQrBoard } from '@/components/build/InstallQrBoard';
import { LauncherReadinessStrip } from '@/components/onboarding/LauncherReadinessStrip';
import { StoreSubmitControl } from '@/components/build/StoreSubmitControl';
import { readyInstallsFromRequest } from '@/lib/build/installPreview';
import {
  credentialForSubmit,
  presentStoreSubmit,
  shouldPollStoreSubmit,
  type StoreSubmitJobs,
  type StoreSubmitPresentation,
  type SubmitPlatform,
} from '@/lib/storeSubmit/contract';
import type { CredentialStatus } from '@/lib/storeCredentials/contract';

const PRIMARY_BUTTON =
  'inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

const QUIET_BUTTON =
  'mt-4 text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

export interface BuildMyAppViewProps {
  phase: 'loading' | 'error' | 'ready';
  loadError: string | null;
  availability: BuildRequestAvailability;
  mode: 'compose' | 'status';
  request: BuildRequest | null;
  android: boolean;
  ios: boolean;
  accessNotes: string;
  submitting: boolean;
  rechecking?: boolean;
  syncBusy: boolean;
  noteSaving: boolean;
  formError: string | null;
  /** Product count and last sync, when the catalog status has them. */
  statusLine?: string | null;
  /** Operational webhook registration error. Does not block a build by itself. */
  webhookNote?: string | null;
  /** Branding display name. Trimmed before it is shown. Does not affect submit. */
  appName?: string | null;
  /** Branding icon. Sanitized before a thumb is drawn. Does not affect submit. */
  iconUrl?: string | null;
  /** Branding splash. Sanitized before a thumb is drawn. Does not affect submit. */
  splashUrl?: string | null;
  /** True while branding is still loading and no draft was passed in. */
  launcherPending?: boolean;
  onAndroidChange: (value: boolean) => void;
  onIosChange: (value: boolean) => void;
  onNotesChange: (value: string) => void;
  onNotesBlur: () => void;
  onPrimary: (kind: PrimaryBuildAction['kind']) => void;
  onRequestAnother: () => void;
  onCancelAnother: () => void;
  onRetry: () => void;
  /** Per-platform store submit. Omitted while the merchant is still choosing a build. */
  storeSubmit?: StoreSubmitBindings | null;
}

export interface StoreSubmitBindings {
  credentialPhase: 'loading' | 'error' | 'ready';
  credentials: {
    apple: { status: CredentialStatus };
    google: { status: CredentialStatus };
  } | null;
  jobs: StoreSubmitJobs;
  busy: { android: boolean; ios: boolean };
  errors: { android: string | null; ios: string | null };
  onSubmit: (platform: SubmitPlatform) => void;
}

const PROGRESS_STEPS = [
  { key: 'queued', label: 'Queued' },
  { key: 'building', label: 'Building' },
  { key: 'ready', label: 'Ready' },
] as const;

function installActionLabel(platform: PlatformKind): string {
  return platform === 'android' ? 'Install Android build' : 'Install iOS build';
}

function pillClass(status: PlatformStatus | 'unknown'): string {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-800';
  if (status === 'failed') return 'bg-red-50 text-red-800';
  if (status === 'waiting_on_merchant') return 'bg-slate-950 text-white';
  return 'bg-slate-100 text-slate-700';
}

function PlatformChoice({
  platform,
  label,
  checked,
  disabled,
  onChange,
}: {
  platform: PlatformKind;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const box = checked
    ? 'border-slate-950 bg-slate-950 text-white'
    : disabled
      ? 'border-slate-200 bg-slate-50'
      : 'border-slate-300 bg-white';

  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3.5">
      <label className={`flex min-w-0 items-center gap-3 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          name={platform}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400 peer-focus-visible:ring-offset-2 ${box}`}
        >
          {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
        <span className="text-sm font-medium text-slate-950">{label}</span>
      </label>
    </div>
  );
}

function ProgressRail({ label, index }: { label: string; index: number }) {
  return (
    <ol aria-label={`${label} progress`} className="mt-4 grid grid-cols-3">
      {PROGRESS_STEPS.map((step, stepIndex) => {
        const state = stepIndex < index ? 'complete' : stepIndex === index ? 'current' : 'upcoming';
        const filled = state !== 'upcoming';
        return (
          <li
            key={step.key}
            data-step={step.key}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className="min-w-0"
          >
            <div className="flex items-center">
              <span
                aria-hidden
                className={`size-2.5 shrink-0 rounded-full ${
                  filled ? 'bg-slate-950' : 'border border-slate-300 bg-white'
                } ${state === 'current' && index < 2 ? 'motion-safe:animate-pulse' : ''}`}
              />
              {stepIndex < PROGRESS_STEPS.length - 1 ? (
                <span aria-hidden className={`ml-2 h-px flex-1 ${stepIndex < index ? 'bg-slate-950' : 'bg-slate-200'}`} />
              ) : null}
            </div>
            <p className={`mt-2 text-xs ${filled ? 'font-medium text-slate-950' : 'text-slate-400'}`}>{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

function PlatformStudio({
  platform,
  label,
  status,
  installUrl,
  submit,
  onStoreSubmit,
}: {
  platform: PlatformKind;
  label: string;
  status: PlatformStatus | 'unknown';
  installUrl: string | null;
  submit: StoreSubmitPresentation | null;
  onStoreSubmit: (platform: SubmitPlatform) => void;
}) {
  const installHref = merchantInstallHref(status, installUrl);
  const progress = buildProgressIndex(status);
  const live = isLivePlatformStatus(status);
  const quiet = status === 'not_requested';

  return (
    <div
      data-platform={platform}
      data-progress={status}
      aria-busy={live ? true : undefined}
      className={
        quiet
          ? 'rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4'
          : 'rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-[15px] font-semibold tracking-tight text-slate-950">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {platformProgressCopy(platform, status, Boolean(installHref))}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pillClass(status)}`}
        >
          {live ? <span aria-hidden className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" /> : null}
          {platformStatusLabel(platform, status)}
        </span>
      </div>
      {progress !== null ? <ProgressRail label={label} index={progress} /> : null}
      {installHref ? (
        <a
          href={installHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${PRIMARY_BUTTON} mt-4 w-full gap-2`}
        >
          {installActionLabel(platform)}
          <ExternalLink aria-hidden className="size-4" />
        </a>
      ) : null}
      {submit ? <StoreSubmitControl model={submit} onSubmit={() => onStoreSubmit(submit.platform)} /> : null}
    </div>
  );
}

export function BuildMyAppView({
  phase,
  loadError,
  availability,
  mode,
  request,
  android,
  ios,
  accessNotes,
  submitting,
  rechecking = false,
  syncBusy,
  noteSaving,
  formError,
  statusLine = null,
  webhookNote = null,
  appName = null,
  iconUrl = null,
  splashUrl = null,
  launcherPending = false,
  onAndroidChange,
  onIosChange,
  onNotesChange,
  onNotesBlur,
  onPrimary,
  onRequestAnother,
  onCancelAnother,
  onRetry,
  storeSubmit = null,
}: BuildMyAppViewProps) {
  const launcher = (
    <LauncherReadinessStrip appName={appName} iconUrl={iconUrl} splashUrl={splashUrl} pending={launcherPending} />
  );

  if (phase === 'loading') {
    return (
      <div className="mt-8">
        {launcher}
        <div className="mt-6" aria-busy="true">
          <p className="text-sm text-slate-600">Loading your build...</p>
          <div className="mt-6 space-y-3" aria-hidden>
            <div className="h-[108px] rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="h-[108px] rounded-2xl border border-slate-200 bg-slate-50" />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mt-8">
        {launcher}
        <p className="mt-6 text-sm leading-6 text-slate-600" role="alert">
          {loadError ?? 'We could not load your build. Try again.'}
        </p>
        <button type="button" onClick={onRetry} className={`${PRIMARY_BUTTON} mt-6`}>
          Try again
        </button>
      </div>
    );
  }

  const primary = primaryBuildAction({
    availability,
    mode,
    submitting,
    syncBusy,
    canSubmit: android || ios,
  });
  const locked = mode === 'status' || submitting;
  const androidStatus = mode === 'status' && request ? request.platforms.android.status : null;
  const iosStatus = mode === 'status' && request ? request.platforms.ios.status : null;
  const androidInstall = mode === 'status' && request ? request.platforms.android.installUrl : null;
  const iosInstall = mode === 'status' && request ? request.platforms.ios.installUrl : null;
  const installCodes = mode === 'status' ? readyInstallsFromRequest(request) : [];
  const settled = request ? isSettledBuildRequest(request) : false;
  const summary = mode === 'status' && request ? outcomeCopy(request) : null;
  const submitLive = Boolean(
    storeSubmit &&
      (['android', 'ios'] as const).some(
        (platform) => shouldPollStoreSubmit(storeSubmit.jobs[platform]?.status) || storeSubmit.busy[platform]
      )
  );
  const inFlight = (mode === 'status' && request ? shouldPollBuildRequest(request) : false) || submitLive;

  const submitModel = (platform: PlatformKind, status: PlatformStatus | 'unknown'): StoreSubmitPresentation | null => {
    if (mode !== 'status' || !storeSubmit || status === 'not_requested') return null;
    return presentStoreSubmit({
      platform,
      buildStatus: status,
      credential: credentialForSubmit(platform, storeSubmit.credentialPhase, storeSubmit.credentials),
      accountsUnavailable: storeSubmit.credentialPhase === 'error',
      job: storeSubmit.jobs[platform],
      busy: storeSubmit.busy[platform],
      error: storeSubmit.errors[platform],
    });
  };

  return (
    <div className="mt-8">
      {mode === 'compose' && availability.reason && (
        <p className="text-sm leading-6 text-slate-600" role="status">
          {availability.reason}
        </p>
      )}
      {mode === 'compose' && statusLine && (
        <p className={`text-sm leading-6 text-slate-500 ${availability.reason ? 'mt-1' : ''}`}>{statusLine}</p>
      )}
      {mode === 'compose' && webhookNote && (
        <p className="mt-2 text-sm leading-6 text-slate-600">{webhookNote}</p>
      )}
      {mode === 'compose' && availability.action === 'billing' && (
        <button type="button" onClick={() => onPrimary('connect')} className={QUIET_BUTTON}>
          Reconnect Shopify
        </button>
      )}
      {mode === 'compose' && webhookNote && availability.enabled && (
        <button type="button" onClick={() => onPrimary('connect')} className={QUIET_BUTTON}>
          Reconnect Shopify
        </button>
      )}
      {summary && (
        <p className="text-sm leading-6 text-slate-600" role="status">
          {summary}
        </p>
      )}
      {formError && (
        <p className="mt-3 text-sm leading-6 text-red-700" role="alert">
          {formError}
        </p>
      )}

      <div
        className={
          (mode === 'compose' && (availability.reason || statusLine || webhookNote)) || summary || formError
            ? 'mt-6'
            : ''
        }
      >
        {launcher}
      </div>

      {installCodes.length > 0 ? <InstallQrBoard installs={installCodes} /> : null}

      <fieldset className="mt-6 min-w-0">
        <legend className="text-sm font-medium text-slate-950">Platforms</legend>
        {inFlight ? (
          <p className="mt-2 text-sm leading-6 text-slate-500" role="status">
            This page updates on its own.
          </p>
        ) : null}
        <div className="mt-3 space-y-3" aria-live="polite">
          {mode === 'status' && androidStatus && iosStatus ? (
            <>
              <PlatformStudio
                platform="android"
                label="Android"
                status={androidStatus}
                installUrl={androidInstall}
                submit={submitModel('android', androidStatus)}
                onStoreSubmit={storeSubmit?.onSubmit ?? (() => undefined)}
              />
              <PlatformStudio
                platform="ios"
                label="iOS"
                status={iosStatus}
                installUrl={iosInstall}
                submit={submitModel('ios', iosStatus)}
                onStoreSubmit={storeSubmit?.onSubmit ?? (() => undefined)}
              />
            </>
          ) : (
            <>
              <PlatformChoice
                platform="android"
                label="Android"
                checked={android}
                disabled={locked}
                onChange={onAndroidChange}
              />
              <PlatformChoice platform="ios" label="iOS" checked={ios} disabled={locked} onChange={onIosChange} />
            </>
          )}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="build-access-note" className="text-sm font-medium text-slate-950">
          Access note
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Optional. A short note if we need access to a developer account.
        </p>
        <textarea
          id="build-access-note"
          value={accessNotes}
          maxLength={ACCESS_NOTES_MAX}
          rows={3}
          onChange={(event) => onNotesChange(event.target.value.slice(0, ACCESS_NOTES_MAX))}
          onBlur={onNotesBlur}
          placeholder="For example, an Apple developer invite is on the way."
          className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400"
        />
        {accessNotes.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {noteSaving ? 'Saving...' : `${accessNotes.length}/${ACCESS_NOTES_MAX}`}
          </p>
        )}
      </div>

      {primary.kind !== 'none' && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => onPrimary(primary.kind)}
            disabled={primary.disabled || rechecking}
            className={PRIMARY_BUTTON}
          >
            {rechecking ? 'Checking...' : primary.label}
          </button>
        </div>
      )}

      {mode === 'status' && settled && (
        <button type="button" onClick={onRequestAnother} className={QUIET_BUTTON}>
          Request another build
        </button>
      )}
      {mode === 'compose' && request && (
        <button type="button" onClick={onCancelAnother} className={QUIET_BUTTON}>
          Back to this build
        </button>
      )}
    </div>
  );
}
