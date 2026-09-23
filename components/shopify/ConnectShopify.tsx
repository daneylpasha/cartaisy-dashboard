'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth';
import { useShopifyStatus } from '@/hooks/useShopifyStatus';
import * as shopifyService from '@/lib/services/shopify';
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

function formatQuietDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function Notice({ tone, children }: { tone: 'error' | 'success'; children: string }) {
  const styles =
    tone === 'error'
      ? 'border-slate-200 bg-slate-50 text-slate-700'
      : 'border-slate-200 bg-white text-slate-700';

  return (
    <p role="alert" className={`rounded-md border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}

export function ConnectShopify() {
  const { data: session } = useSession();
  const { status, isLoading, error, refetch } = useShopifyStatus();
  const [shop, setShop] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connectedShop = status?.isConnected ? status.shop : null;
  const connectedOn = formatQuietDate(status?.connectedAt);
  const lastSynced = formatQuietDate(status?.lastSyncAt);

  const beginConnect = async (shopValue: string) => {
    setActionError('');
    setSyncMessage('');

    if (!session?.user) {
      setActionError('Sign in again to connect your store.');
      return;
    }

    setIsConnecting(true);
    try {
      const result = await shopifyService.initiateOAuth(shopValue);
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "We couldn't connect your store. Try again.");
      setIsConnecting(false);
    }
  };

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    await beginConnect(shop);
  };

  const handleReconnect = async () => {
    if (!connectedShop) {
      setActionError('Enter your store address, like your-store.myshopify.com.');
      return;
    }
    await beginConnect(connectedShop);
  };

  const handleSync = async () => {
    setActionError('');
    setSyncMessage('');
    setIsSyncing(true);
    try {
      await shopifyService.syncAgain();
      setSyncMessage('Your store data is up to date.');
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "We couldn't sync your store. Try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setActionError('');
    setIsDisconnecting(true);
    try {
      await shopifyService.disconnect();
      setShowDisconnectDialog(false);
      setSyncMessage('');
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
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your store…
            </p>
          ) : connectedShop ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connected-shop" className="text-sm font-medium text-slate-700">
                  Store address
                </Label>
                <Input
                  id="connected-shop"
                  value={connectedShop}
                  readOnly
                  aria-readonly="true"
                  className="h-10 bg-slate-50 text-slate-800"
                />
                <p className="text-sm text-slate-500">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-600 align-middle" />
                  Connected{connectedOn ? ` on ${connectedOn}` : ''}
                  {lastSynced ? ` · Last synced ${lastSynced}` : ''}
                </p>
              </div>

              {(error || actionError) && <Notice tone="error">{error || actionError}</Notice>}
              {syncMessage && <Notice tone="success">{syncMessage}</Notice>}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleReconnect}
                  disabled={isConnecting || isSyncing}
                  className="sm:min-w-36"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening Shopify…
                    </>
                  ) : (
                    'Reconnect'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSync}
                  disabled={isConnecting || isSyncing}
                  className="sm:min-w-36"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Syncing…
                    </>
                  ) : (
                    'Sync again'
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                Reconnect opens Shopify again for this same store.
              </p>

              <button
                type="button"
                onClick={() => setShowDisconnectDialog(true)}
                className="text-sm text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop" className="text-sm font-medium text-slate-700">
                  Store address
                </Label>
                <Input
                  id="shop"
                  type="text"
                  placeholder="your-store.myshopify.com"
                  value={shop}
                  onChange={(event) => setShop(event.target.value)}
                  disabled={isConnecting}
                  autoComplete="off"
                  className="h-10"
                />
                <p className="text-sm text-slate-500">
                  Use the address from your Shopify admin. You can leave off .myshopify.com.
                </p>
              </div>

              {(error || actionError) && <Notice tone="error">{error || actionError}</Notice>}

              <Button type="submit" disabled={isConnecting || !shop.trim()} className="w-full sm:w-auto">
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening Shopify…
                  </>
                ) : (
                  'Connect Shopify'
                )}
              </Button>
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
            <Button type="button" variant="outline" onClick={handleDisconnect} disabled={isDisconnecting}>
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
