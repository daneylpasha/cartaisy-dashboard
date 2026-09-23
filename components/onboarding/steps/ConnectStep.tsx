'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SetupNotice, WizardFooter } from '@/components/onboarding/WizardChrome';
import { connectPrimaryAction, normalizeShopDomainInput } from '@/lib/onboarding/normalizers';
import { shopifyConnectContract } from '@/lib/onboarding/shopifyConnect';
import type { ShopifyConnectionSnapshot } from '@/lib/onboarding/types';

interface ConnectStepProps {
  connection: ShopifyConnectionSnapshot;
  warning: string | null;
  checking: boolean;
  startError: string | null;
  starting: boolean;
  onStart: (shopDomain: string) => void;
  onContinue: () => void;
  onRefresh: () => void;
}

export function ConnectStep({
  connection,
  warning,
  checking,
  startError,
  starting,
  onStart,
  onContinue,
  onRefresh,
}: ConnectStepProps) {
  const [shop, setShop] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const action = connectPrimaryAction({
    liveRedirectEnabled: shopifyConnectContract.liveRedirectEnabled,
    isConnected: connection.isConnected,
  });

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

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Step 1</p>
      <h1 className="font-heading mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
        Connect Shopify
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600">
        Connect the store this app will sell from. You only do this once.
      </p>

      {( !shopifyConnectContract.liveRedirectEnabled || warning) && (
        <div className="mt-8">
          <SetupNotice>
            {!shopifyConnectContract.liveRedirectEnabled && (
              <p>
                Secure connect is not switched on in this dashboard yet. When it is, this step opens Shopify so you can approve access. Nothing on this step stores a Shopify access token.
              </p>
            )}
            {warning && (
              <p className={shopifyConnectContract.liveRedirectEnabled ? undefined : 'mt-2'}>
                {warning}
              </p>
            )}
          </SetupNotice>
        </div>
      )}

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

      {connection.shopId && (
        <p className="mt-3 text-sm text-slate-600">
          Shop ID <span className="font-medium text-slate-900">{connection.shopId}</span>
          <span className="text-slate-500"> · read only</span>
        </p>
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
          <p className="text-xs text-slate-500">Use the .myshopify.com address.</p>
        </div>
      )}

      {(fieldError || startError) && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {fieldError || startError}
        </p>
      )}

      {!connection.statusKnown && !checking && (
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
        >
          Check again
        </button>
      )}

      <WizardFooter
        primaryLabel={action.label}
        onPrimary={handlePrimary}
        pending={starting}
        primaryDisabled={checking}
        quietAction={
          action.kind === 'start'
            ? { label: 'Continue without connecting', onClick: onContinue }
            : connection.isConnected && shopifyConnectContract.liveRedirectEnabled && connection.shopDomain
              ? {
                  label: 'Connect again',
                  onClick: () => onStart(connection.shopDomain as string),
                }
              : undefined
        }
      />
    </section>
  );
}
