'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SetupNotice, WizardFooter } from '@/components/onboarding/WizardChrome';
import { connectPrimaryAction, normalizeShopDomainInput } from '@/lib/onboarding/normalizers';
import { shopifyRecoveryView } from '@/lib/shopify/recovery';
import { ShopifyRecoveryStatus } from '@/components/shopify/ShopifyRecoveryStatus';
import { shopifyConnectContract } from '@/lib/onboarding/shopifyConnect';
import type { ShopifyReturnCopy } from '@/lib/shopify/merchantCopy';
import type { LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

interface ConnectStepProps {
  connection: ShopifyConnectionSnapshot;
  sync: SyncGate;
  catalog: LockedCatalog;
  warning: string | null;
  checking: boolean;
  startError: string | null;
  starting: boolean;
  returnNotice: ShopifyReturnCopy | null;
  suggestedShop: string | null;
  syncing: boolean;
  onStart: (shopDomain: string) => void;
  onContinue: () => void;
  onRefresh: () => void;
  onSyncAgain: () => void;
}

export function ConnectStep({
  connection,
  sync,
  catalog,
  warning,
  checking,
  startError,
  starting,
  returnNotice,
  suggestedShop,
  syncing,
  onStart,
  onContinue,
  onRefresh,
  onSyncAgain,
}: ConnectStepProps) {
  const [shop, setShop] = useState(suggestedShop ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const action = connectPrimaryAction({
    liveRedirectEnabled: shopifyConnectContract.liveRedirectEnabled,
    isConnected: connection.isConnected,
  });
  const confirmed = connection.statusKnown && connection.isConnected;
  const justConnected = returnNotice?.tone === 'success' && confirmed;
  const returnError = returnNotice?.tone === 'error' && !confirmed ? returnNotice : null;
  const unconfirmedReturn = returnNotice?.tone === 'success' && connection.statusKnown && !connection.isConnected;
  const catalogView = confirmed
    ? shopifyRecoveryView({
        statusKnown: true,
        isConnected: true,
        sync,
        productCount: catalog.productCount,
        webhookError: connection.webhookRegistrationError,
        lastSyncAt: connection.lastSyncAt,
      })
    : null;
  const showWarning = Boolean(warning) && !confirmed && !returnError && !unconfirmedReturn;

  const handlePrimary = () => {
    if (action.kind === 'continue') {
      onContinue();
      return;
    }
    const domain = normalizeShopDomainInput(shop);
    if (!domain) {
      setFieldError('Enter the store address, like store-name.myshopify.com.');
      return;
    }
    setFieldError(null);
    onStart(domain);
  };

  const title = justConnected ? returnNotice.title : 'Connect Shopify';
  const lede = justConnected
    ? returnNotice.body
    : confirmed
      ? 'This store is connected. Next, confirm the brand.'
      : 'Connect the store this app will sell from. You only do this once.';

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 1</p>
      <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">{lede}</p>

      {returnError && (
        <div className="mt-8 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3.5" role="alert">
          <p className="text-sm font-medium text-red-950">{returnError.title}</p>
          <p className="mt-1 text-sm leading-6 text-red-900/80">{returnError.body}</p>
        </div>
      )}

      {unconfirmedReturn && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5" role="status">
          <p className="text-sm font-medium text-slate-950">Connection not confirmed</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Shopify sent you back, but this store is not connected yet. Try again.
          </p>
        </div>
      )}

      {( !shopifyConnectContract.liveRedirectEnabled || showWarning) && (
        <div className="mt-8">
          <SetupNotice>
            {!shopifyConnectContract.liveRedirectEnabled && (
              <p>
                Secure connect is not switched on in this dashboard yet. When it is, this step opens Shopify so you can approve access. Nothing on this step stores a Shopify access token.
              </p>
            )}
            {showWarning && warning && (
              <p className={shopifyConnectContract.liveRedirectEnabled ? undefined : 'mt-2'}>{warning}</p>
            )}
          </SetupNotice>
        </div>
      )}

      {confirmed && catalogView ? (
        <div className="mt-8">
          <ShopifyRecoveryStatus
            shopDomain={connection.shopDomain}
            view={catalogView}
            pending={syncing || starting}
            onSyncAgain={onSyncAgain}
            onReconnect={() => {
              if (connection.shopDomain) onStart(connection.shopDomain);
            }}
          />
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${connection.isConnected ? 'bg-emerald-600' : 'bg-slate-300'}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-950">
              {checking ? 'Checking connection' : connection.isConnected ? 'Connected' : 'Not connected'}
            </p>
            <p className="truncate text-sm text-slate-600">
              {connection.shopDomain ?? 'No store linked yet'}
            </p>
          </div>
          {checking && <Loader2 className="ml-auto h-4 w-4 animate-spin text-slate-400" aria-hidden />}
        </div>
      )}

      {action.kind === 'start' && (
        <div className="mt-6 space-y-2">
          <Label htmlFor="shop-domain">Shopify store</Label>
          <Input
            id="shop-domain"
            value={shop}
            onChange={(event) => setShop(event.target.value)}
            placeholder="store-name.myshopify.com"
            autoComplete="off"
            className="h-11"
            aria-invalid={Boolean(fieldError)}
          />
          <p className="text-xs leading-5 text-slate-500">
            {returnError || unconfirmedReturn
              ? 'Use the .myshopify.com address, then connect again.'
              : 'Use the .myshopify.com address.'}
          </p>
        </div>
      )}

      {(fieldError || startError) && (
        <p className="mt-4 text-sm leading-6 text-red-700" role="alert">
          {fieldError || startError}
        </p>
      )}

      {!connection.statusKnown && !checking && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          Check again
        </button>
      )}

      <WizardFooter
        primaryLabel={
          action.kind === 'start' && (returnError || unconfirmedReturn) ? 'Reconnect Shopify' : action.label
        }
        onPrimary={handlePrimary}
        pending={starting}
        pendingLabel="Opening Shopify..."
        primaryDisabled={checking}
        quietAction={
          action.kind === 'start'
            ? { label: 'Continue without connecting', onClick: onContinue }
            : undefined
        }
      />
    </section>
  );
}
