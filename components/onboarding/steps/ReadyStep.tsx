'use client';

import Link from 'next/link';
import { BuildMyAppPanel } from '@/components/onboarding/BuildMyAppPanel';
import type { ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

interface ReadyStepProps {
  connection: ShopifyConnectionSnapshot;
  sync: SyncGate;
  onBack: () => void;
  onConnectShopify: () => void;
  onCatalogUpdated: () => void;
  onRefreshConnection: () => Promise<void> | void;
}

export function ReadyStep({
  connection,
  sync,
  onBack,
  onConnectShopify,
  onCatalogUpdated,
  onRefreshConnection,
}: ReadyStepProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 4</p>
      <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
        Build my app
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">
        Choose Android, iOS, or both. We will show each one here as it moves forward.
      </p>

      <BuildMyAppPanel
        connection={connection}
        initialSync={sync}
        onConnectShopify={onConnectShopify}
        onCatalogUpdated={onCatalogUpdated}
        onRefreshConnection={onRefreshConnection}
      />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-slate-100 pt-6">
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
