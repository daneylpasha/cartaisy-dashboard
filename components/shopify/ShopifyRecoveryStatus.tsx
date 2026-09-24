'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import type { ShopifyRecoveryView } from '@/lib/shopify/recovery';

const FILLED =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:w-auto';

const QUIET =
  'inline-flex h-9 items-center text-sm font-medium text-slate-700 underline-offset-4 transition-colors hover:text-slate-950 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

function dotClass(tone: ShopifyRecoveryView['tone']): string {
  if (tone === 'ready') return 'bg-emerald-600';
  if (tone === 'disconnected' || tone === 'unknown') return 'bg-slate-300';
  return 'bg-slate-400';
}

export function ShopifyRecoveryStatus({
  shopDomain,
  view,
  pending = false,
  reconnectDisabled = false,
  onSyncAgain,
  onReconnect,
  children,
}: {
  shopDomain: string | null;
  view: ShopifyRecoveryView;
  pending?: boolean;
  reconnectDisabled?: boolean;
  onSyncAgain?: () => void;
  onReconnect?: () => void;
  children?: ReactNode;
}) {
  const syncBusy = pending || (view.control?.kind === 'sync' && view.control.disabled);
  const showFilledSync = view.control?.kind === 'sync';
  const showQuietSync = view.runAgain && !view.control;
  const showReconnect = view.control?.kind === 'reconnect';
  const domain =
    shopDomain ?? (view.tone === 'disconnected' ? 'No store linked' : 'Shopify');

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-live="polite" aria-busy={syncBusy}>
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(view.tone)}`} aria-hidden />
        <p className="min-w-0 truncate text-sm font-medium text-slate-950">{domain}</p>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
        {view.productCount !== null && view.countNoun && (
          <div className="mb-4">
            <p className="font-heading text-[2rem] font-semibold leading-none tracking-tight text-slate-950 tabular-nums">
              {view.productCount.toLocaleString('en-US')}
            </p>
            <p className="mt-2 text-sm text-slate-600">{view.countNoun}</p>
          </div>
        )}
        <p className="text-sm font-medium text-slate-950">{view.headline}</p>
        {view.support && <p className="mt-1 text-sm leading-6 text-slate-600">{view.support}</p>}
        {view.lastSyncLabel && <p className="mt-1 text-sm text-slate-500">{view.lastSyncLabel}</p>}
        {view.webhookNote && <p className="mt-2 text-sm leading-6 text-slate-600">{view.webhookNote}</p>}
        {children}
        {showFilledSync && (
          <div className="mt-4">
            <button type="button" onClick={onSyncAgain} disabled={syncBusy || !onSyncAgain} className={FILLED}>
              {syncBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {syncBusy ? 'Syncing…' : 'Sync again'}
            </button>
          </div>
        )}
        {showReconnect && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onReconnect}
              disabled={pending || reconnectDisabled || !onReconnect}
              className={FILLED}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {pending ? 'Opening Shopify…' : 'Reconnect Shopify'}
            </button>
          </div>
        )}
        {showQuietSync && (
          <div className="mt-3">
            <button type="button" onClick={onSyncAgain} disabled={pending || !onSyncAgain} className={QUIET}>
              {pending ? 'Syncing…' : 'Sync again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
