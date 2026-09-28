'use client';

import { StoreSubmitControl } from '@/components/build/StoreSubmitControl';
import type { BuildRequest } from '@/lib/build/contract';
import type { StoreCredentialsStatus } from '@/lib/storeCredentials/contract';
import {
  credentialForSubmit,
  presentStoreSubmit,
  shouldPollStoreSubmit,
  type StoreSubmitJobs,
  type SubmitPlatform,
} from '@/lib/storeSubmit/contract';

const PRIMARY_BUTTON =
  'inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

export interface StoreSubmitSettingsViewProps {
  phase: 'loading' | 'error' | 'ready';
  request: BuildRequest | null;
  credentialPhase: 'loading' | 'error' | 'ready';
  credentials: StoreCredentialsStatus | null;
  jobs: StoreSubmitJobs;
  busy: { android: boolean; ios: boolean };
  errors: { android: string | null; ios: string | null };
  onSubmit: (platform: SubmitPlatform) => void;
  onRetry: () => void;
}

const PLATFORM_LABEL: Record<SubmitPlatform, string> = {
  android: 'Android',
  ios: 'iOS',
};

function requestedPlatforms(request: BuildRequest): SubmitPlatform[] {
  const platforms: SubmitPlatform[] = [];
  if (request.platforms.android.status !== 'not_requested') platforms.push('android');
  if (request.platforms.ios.status !== 'not_requested') platforms.push('ios');
  return platforms;
}

export function StoreSubmitSettingsView({
  phase,
  request,
  credentialPhase,
  credentials,
  jobs,
  busy,
  errors,
  onSubmit,
  onRetry,
}: StoreSubmitSettingsViewProps) {
  const platforms = phase === 'ready' && request ? requestedPlatforms(request) : [];
  const live = platforms.some((platform) => shouldPollStoreSubmit(jobs[platform]?.status) || busy[platform]);

  return (
    <section
      className="mt-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="store-submit-heading"
      data-store-submit="settings"
    >
      <h3 id="store-submit-heading" className="font-heading text-base font-semibold tracking-tight text-slate-950">
        Submit
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Send a finished build to the App Store or Google Play with this store&apos;s account. Each platform is
        separate. Preview and install links stay available either way.
      </p>
      {live ? (
        <p className="mt-2 text-sm leading-6 text-slate-500" role="status">
          This page updates on its own.
        </p>
      ) : null}

      {phase === 'loading' ? (
        <p className="mt-5 text-sm text-slate-600" aria-busy="true">
          Loading your build...
        </p>
      ) : null}

      {phase === 'error' ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-600" role="alert">
            We could not load your build. Try again.
          </p>
          <button type="button" onClick={onRetry} className={`${PRIMARY_BUTTON} mt-4`}>
            Try again
          </button>
        </div>
      ) : null}

      {phase === 'ready' && platforms.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-slate-600">
          When a build is ready, you can submit it here.
        </p>
      ) : null}

      {phase === 'ready' && request && platforms.length > 0 ? (
        <div className="mt-5 space-y-3">
          {platforms.map((platform) => {
            const status = request.platforms[platform].status;
            const model = presentStoreSubmit({
              platform,
              buildStatus: status === 'unknown' ? 'unknown' : status,
              credential: credentialForSubmit(platform, credentialPhase, credentials),
              accountsUnavailable: credentialPhase === 'error',
              job: jobs[platform],
              busy: busy[platform],
              error: errors[platform],
            });
            return (
              <article
                key={platform}
                className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <p className="font-heading text-[15px] font-semibold tracking-tight text-slate-950">
                  {PLATFORM_LABEL[platform]}
                </p>
                <StoreSubmitControl model={model} onSubmit={() => onSubmit(platform)} />
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
