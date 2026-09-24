'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useDashboardShopify } from '@/components/dashboard/ShopifyStatusProvider';
import { loadBrandingSaved, loadConnectedHome, type ConnectedHomeFacts } from '@/lib/dashboard/loadHome';
import type { BrandingSaved } from '@/lib/dashboard/homeModel';
import { ConnectedHome } from '@/components/dashboard/home/ConnectedHome';
import { SetupHome } from '@/components/dashboard/home/SetupHome';

type HomeModel =
  | { kind: 'loading' }
  | { kind: 'unknown' }
  | { kind: 'setup'; brandingSaved: BrandingSaved }
  | { kind: 'connected'; facts: ConnectedHomeFacts };

export function DashboardHome() {
  const { data: session, status: sessionStatus } = useSession();
  const shopify = useDashboardShopify();
  const [reloadKey, setReloadKey] = useState(0);
  const [model, setModel] = useState<HomeModel>({ kind: 'loading' });

  const storeName = session?.user?.storeName?.trim() || 'your store';
  const storeId = session?.user?.storeId;

  useEffect(() => {
    if (sessionStatus === 'loading' || shopify.isLoading) return;

    let cancelled = false;
    const connection = shopify.status;

    async function load() {
      if (!connection || shopify.error) {
        if (!cancelled) setModel({ kind: 'unknown' });
        return;
      }

      if (!connection.isConnected) {
        const brandingSaved = await loadBrandingSaved(storeId);
        if (!cancelled) setModel({ kind: 'setup', brandingSaved });
        return;
      }

      const facts = await loadConnectedHome(storeId);
      if (!cancelled) setModel({ kind: 'connected', facts });
    }

    setModel({ kind: 'loading' });
    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, shopify.isLoading, shopify.status, shopify.error, storeId, reloadKey]);

  if (model.kind === 'loading') {
    return <HomeSkeleton />;
  }

  if (model.kind === 'unknown') {
    return (
      <div className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white px-5 py-6">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-950">Home</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          We could not check your Shopify connection. Nothing here is marked connected until that succeeds.
        </p>
        <Button
          type="button"
          className="mt-4 h-11 rounded-lg px-4"
          onClick={() => {
            void shopify.refetch();
            setReloadKey((value) => value + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (model.kind === 'setup') {
    return <SetupHome storeName={storeName} brandingSaved={model.brandingSaved} />;
  }

  return (
    <ConnectedHome
      storeName={storeName}
      shop={shopify.status?.shop ?? null}
      facts={model.facts}
    />
  );
}

function HomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading home</span>
      <div className="h-4 w-16 rounded bg-slate-200/80 motion-safe:animate-pulse" />
      <div className="mt-3 h-8 w-56 max-w-full rounded bg-slate-200/80 motion-safe:animate-pulse" />
      <div className="mt-3 h-4 w-full max-w-md rounded bg-slate-100 motion-safe:animate-pulse" />
      <div className="mt-8 h-72 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
