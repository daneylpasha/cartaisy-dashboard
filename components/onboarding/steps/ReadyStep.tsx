'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buildRequestAvailability } from '@/lib/onboarding/normalizers';
import type { ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

interface ReadyStepProps {
  connection: ShopifyConnectionSnapshot;
  sync: SyncGate;
  appName: string;
  onBack: () => void;
}

const SYNC_LABEL: Record<SyncGate['state'], string> = {
  succeeded: 'Synced',
  in_progress: 'Syncing',
  failed: 'Sync needs another try',
  not_started: 'Not synced yet',
  unavailable: 'Sync status unavailable',
};

export function ReadyStep({ connection, sync, appName, onBack }: ReadyStepProps) {
  const build = buildRequestAvailability(sync);
  const [placeholderOpen, setPlaceholderOpen] = useState(false);

  const rows = [
    { label: 'Account', value: 'Created' },
    { label: 'Shopify', value: connection.isConnected ? 'Connected' : 'Not connected yet' },
    { label: 'Brand', value: appName.trim() ? 'Confirmed' : 'Needs a name' },
    { label: 'Preview', value: 'Starting home ready' },
    { label: 'Sync', value: SYNC_LABEL[sync.state] },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 4</p>
      <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
        Ready for build
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">
        Setup for your app is in place. The next step is to request a build. That screen is not open yet.
      </p>

      <dl className="mt-8 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="text-sm font-medium text-slate-950">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <button
          type="button"
          disabled={!build.enabled}
          onClick={() => setPlaceholderOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Build my app
        </button>
        {build.reason && <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{build.reason}</p>}
        {placeholderOpen && build.enabled && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700" role="status">
            Build requests open on the next screen. That screen is not part of this setup yet, so nothing was submitted.
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="h-11 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Back
        </button>
        <Link href="/dashboard" className="text-sm font-medium text-slate-950 underline-offset-4 hover:underline">
          Go to the dashboard
        </Link>
      </div>
    </section>
  );
}
