'use client';

import { Check } from 'lucide-react';
import {
  ACCESS_NOTES_MAX,
  isSettledBuildRequest,
  outcomeCopy,
  platformStatusLabel,
  primaryBuildAction,
  type BuildRequest,
  type PlatformKind,
  type PlatformStatus,
  type PrimaryBuildAction,
} from '@/lib/build/contract';
import type { BuildRequestAvailability } from '@/lib/onboarding/types';

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
  onAndroidChange: (value: boolean) => void;
  onIosChange: (value: boolean) => void;
  onNotesChange: (value: string) => void;
  onNotesBlur: () => void;
  onPrimary: (kind: PrimaryBuildAction['kind']) => void;
  onRequestAnother: () => void;
  onCancelAnother: () => void;
  onRetry: () => void;
}

function statusClass(status: PlatformStatus | 'unknown'): string {
  if (status === 'ready') return 'text-sm text-emerald-700';
  if (status === 'failed') return 'text-sm text-red-700';
  if (status === 'waiting_on_merchant') return 'text-sm font-medium text-slate-950';
  return 'text-sm text-slate-500';
}

function PlatformRow({
  platform,
  label,
  checked,
  locked,
  status,
  onChange,
}: {
  platform: PlatformKind;
  label: string;
  checked: boolean;
  locked: boolean;
  status: PlatformStatus | 'unknown' | null;
  onChange: (value: boolean) => void;
}) {
  const box = checked
    ? 'border-slate-950 bg-slate-950 text-white'
    : locked
      ? 'border-slate-200 bg-slate-50'
      : 'border-slate-300 bg-white';

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
      <label className={`flex min-w-0 items-center gap-3 ${locked ? 'cursor-default' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          name={platform}
          checked={checked}
          disabled={locked}
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
      {status && (
        <span className={`${statusClass(status)} shrink-0 text-right`}>{platformStatusLabel(platform, status)}</span>
      )}
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
  onAndroidChange,
  onIosChange,
  onNotesChange,
  onNotesBlur,
  onPrimary,
  onRequestAnother,
  onCancelAnother,
  onRetry,
}: BuildMyAppViewProps) {
  if (phase === 'loading') {
    return (
      <div className="mt-8" aria-busy="true">
        <p className="text-sm text-slate-600">Loading your build...</p>
        <div className="mt-6 space-y-2" aria-hidden>
          <div className="h-[52px] rounded-xl border border-slate-200 bg-slate-50" />
          <div className="h-[52px] rounded-xl border border-slate-200 bg-slate-50" />
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mt-8">
        <p className="text-sm leading-6 text-slate-600" role="alert">
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
  const settled = request ? isSettledBuildRequest(request) : false;
  const summary = mode === 'status' && request ? outcomeCopy(request) : null;

  return (
    <div className="mt-8">
      {mode === 'compose' && availability.reason && (
        <p className="text-sm leading-6 text-slate-600" role="status">
          {availability.reason}
        </p>
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

      <fieldset
        className={`min-w-0 ${mode === 'compose' && availability.reason ? 'mt-6' : summary || formError ? 'mt-6' : ''}`}
      >
        <legend className="text-sm font-medium text-slate-950">Platforms</legend>
        <div className="mt-3 space-y-2" aria-live="polite">
          <PlatformRow
            platform="android"
            label="Android"
            checked={mode === 'status' ? androidStatus !== 'not_requested' : android}
            locked={locked}
            status={androidStatus}
            onChange={onAndroidChange}
          />
          <PlatformRow
            platform="ios"
            label="iOS"
            checked={mode === 'status' ? iosStatus !== 'not_requested' : ios}
            locked={locked}
            status={iosStatus}
            onChange={onIosChange}
          />
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
