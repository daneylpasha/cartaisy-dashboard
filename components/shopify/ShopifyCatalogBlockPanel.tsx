'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { catalogBlockCopy } from '@/lib/shopify/catalogBlock';
import type { ShopifyCatalogBlockKind } from '@/lib/onboarding/types';
import * as shopifyService from '@/lib/services/shopify';

const FILLED =
  'mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:w-auto';

const QUIET =
  'mt-4 inline-flex h-9 items-center text-sm font-medium text-slate-700 underline-offset-4 transition-colors hover:text-slate-950 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

/**
 * Honest catalog block. Reconnect is the primary action. Billing stays calm
 * and offers reconnect only as a secondary action.
 */
export function ShopifyCatalogBlockPanel({
  block,
  shop,
}: {
  block: ShopifyCatalogBlockKind;
  shop: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = catalogBlockCopy(block);
  const primary = block === 'reconnect';

  const reconnect = async () => {
    if (!shop) return;
    setPending(true);
    setError(null);
    try {
      const result = await shopifyService.initiateOAuth(shop);
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't open Shopify. Try again.");
      setPending(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5" aria-live="polite">
      <h2 className="text-sm font-semibold text-slate-950">{copy.headline}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">{copy.support}</p>
      {shop ? (
        <button
          type="button"
          onClick={() => void reconnect()}
          disabled={pending}
          className={primary ? FILLED : QUIET}
        >
          {primary && pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {pending ? 'Opening Shopify…' : 'Reconnect Shopify'}
        </button>
      ) : (
        <Link href="/dashboard/settings" className={primary ? FILLED : QUIET}>
          Reconnect Shopify
        </Link>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">
          {error}
        </p>
      )}
    </section>
  );
}
