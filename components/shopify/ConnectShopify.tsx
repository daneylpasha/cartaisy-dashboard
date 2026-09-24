'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import { useShopifyStatus } from '@/hooks/useShopifyStatus';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { getOverviewProductCount } from '@/lib/api/shopifyConnection';
import { fetchCatalogSync, syncCatalogAgain } from '@/lib/build/client';
import { BUILD_STATUS_POLL_MS } from '@/lib/build/contract';
import { UNAVAILABLE_SYNC } from '@/lib/onboarding/normalizers';
import type { SyncGate } from '@/lib/onboarding/types';
import { shopifyRecoveryView } from '@/lib/shopify/recovery';
import * as shopifyService from '@/lib/services/shopify';
import { ShopifyRecoveryStatus } from '@/components/shopify/ShopifyRecoveryStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export function ConnectShopify() {
  const { data: session } = useSession();
  const { status, isLoading, error, refetch } = useShopifyStatus();
  const [shop, setShop] = useState('');
  const [sync, setSync] = useState<SyncGate>(UNAVAILABLE_SYNC);
  const [syncReady, setSyncReady] = useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [pending, setPending] = useState<'sync' | 'reconnect' | null>(null);
  const [actionError, setActionError] = useState('');
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connected = Boolean(status?.isConnected && status.shop);

  useEffect(() => {
    if (isLoading) return;
    if (!connected) {
      setSync(UNAVAILABLE_SYNC);
      setProductCount(null);
      setSyncReady(true);
      return;
    }

    let cancelled = false;
    setSyncReady(false);

    void (async () => {
      const token = tokenStorage.getToken();
      if (!token) {
        if (!cancelled) setSyncReady(true);
        return;
      }
      const [next, count] = await Promise.all([fetchCatalogSync(token), getOverviewProductCount()]);
      if (cancelled) return;
      setSync(next);
      setProductCount(count);
      setSyncReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, isLoading, status?.shop]);

  useEffect(() => {
    if (!connected || pending || sync.state !== 'in_progress') return;
    let cancelled = false;

    const timer = window.setInterval(() => {
      void (async () => {
        const token = tokenStorage.getToken();
        if (!token || cancelled) return;
        const next = await fetchCatalogSync(token);
        if (cancelled || next.state === 'unavailable' || next.state === 'in_progress') return;
        setSync(next);
        if (next.state === 'succeeded') {
          setProductCount(await getOverviewProductCount());
        }
        await refetch();
      })();
    }, BUILD_STATUS_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [connected, pending, refetch, sync.state]);

  const view = shopifyRecoveryView({
    statusKnown: !isLoading && !error && status != null && (!connected || syncReady),
    isConnected: connected,
    sync,
    productCount,
    webhookError: status?.webhookRegistrationError ?? null,
    lastSyncAt: status?.lastSyncAt ?? null,
  });

  const beginConnect = async (shopValue: string) => {
    setActionError('');
    if (!session?.user) {
      setActionError('Sign in again to connect your store.');
      return;
    }
    setPending('reconnect');
    try {
      const result = await shopifyService.initiateOAuth(shopValue);
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "We couldn't connect your store. Try again.");
      setPending(null);
    }
  };

  const handleSync = async () => {
    setActionError('');
    const token = tokenStorage.getToken();
    if (!token) {
      setActionError('Sign in again to sync your store.');
      return;
    }
    setPending('sync');
    setSync((current) => ({
      ...current,
      state: 'in_progress',
      detail: null,
      eligibleForBuild: false,
    }));
    const next = await syncCatalogAgain(token);
    setSync(next.state === 'unavailable' ? { ...next, state: 'failed', detail: "We couldn't sync your store. Try again." } : next);
    if (next.state === 'succeeded') {
      setProductCount(await getOverviewProductCount());
    }
    if (next.eligibilityReason === 'shopify_not_connected' || next.state === 'succeeded') {
      await refetch();
    }
    setPending(null);
  };

  const handleDisconnect = async () => {
    setActionError('');
    setIsDisconnecting(true);
    try {
      await shopifyService.disconnect();
      setShowDisconnectDialog(false);
      setSync(UNAVAILABLE_SYNC);
      setProductCount(null);
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "We couldn't disconnect your store. Try again.");
      setShowDisconnectDialog(false);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium text-slate-900">Shopify</CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Connect the store this app sells from.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading || (connected && !syncReady) ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your store…
            </p>
          ) : error && !status ? (
            <div className="space-y-3">
              <p role="alert" className="text-sm leading-6 text-slate-600">
                {error}
              </p>
              <Button type="button" variant="outline" onClick={() => void refetch()}>
                Check again
              </Button>
            </div>
          ) : connected ? (
            <div className="space-y-4">
              <ShopifyRecoveryStatus
                shopDomain={status?.shop ?? null}
                view={view}
                pending={pending === 'sync'}
                onSyncAgain={() => void handleSync()}
                onReconnect={() => void beginConnect(status?.shop ?? '')}
              />
              {actionError && (
                <p role="alert" className="text-sm leading-6 text-slate-600">
                  {actionError}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowDisconnectDialog(true)}
                className="text-sm text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!shop.trim() || pending) return;
                void beginConnect(shop);
              }}
              className="space-y-4"
            >
              <ShopifyRecoveryStatus
                shopDomain={null}
                view={view}
                pending={pending === 'reconnect'}
                reconnectDisabled={!shop.trim() || pending === 'reconnect'}
                onReconnect={() => void beginConnect(shop)}
              >
                <div className="mt-4 space-y-2">
                  <Label htmlFor="shop" className="text-sm font-medium text-slate-700">
                    Store address
                  </Label>
                  <Input
                    id="shop"
                    type="text"
                    placeholder="your-store.myshopify.com"
                    value={shop}
                    onChange={(event) => setShop(event.target.value)}
                    disabled={pending === 'reconnect'}
                    autoComplete="off"
                    className="h-11"
                  />
                  <p className="text-sm leading-6 text-slate-500">
                    Use the address from your Shopify admin. This opens Shopify so you can approve access.
                  </p>
                </div>
              </ShopifyRecoveryStatus>
              {(error || actionError) && (
                <p role="alert" className="text-sm leading-6 text-slate-600">
                  {error || actionError}
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogTitle>Disconnect this store?</DialogTitle>
          <DialogDescription>
            Your app will stop using this Shopify store until you connect it again.
          </DialogDescription>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleDisconnect()} disabled={isDisconnecting}>
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disconnecting…
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
