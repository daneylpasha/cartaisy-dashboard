import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShopifyRecoveryStatus } from '@/components/shopify/ShopifyRecoveryStatus';
import { shopifyRecoveryView } from '@/lib/shopify/recovery';
import type { SyncGate } from '@/lib/onboarding/types';

function gate(partial: Partial<SyncGate> & Pick<SyncGate, 'state'>): SyncGate {
  return {
    detail: null,
    eligibleForBuild: false,
    eligibilityReason: null,
    ...partial,
  };
}

function html(view: ReturnType<typeof shopifyRecoveryView>, shopDomain: string | null): string {
  return renderToStaticMarkup(
    createElement(ShopifyRecoveryStatus, {
      shopDomain,
      view,
      onSyncAgain: () => {},
      onReconnect: () => {},
    })
  );
}

function buttons(markup: string, label: string): number {
  return markup.split(`>${label}<`).length - 1;
}

const forbidden = ['shpat_', 'accessToken', 'Admin API', 'api key', 'API key'];

const connected = html(
  shopifyRecoveryView({
    statusKnown: true,
    isConnected: true,
    sync: gate({
      state: 'succeeded',
      eligibleForBuild: true,
      lastSucceededAt: '2026-09-23T00:00:00.000Z',
    }),
    productCount: 128,
    webhookError: null,
  }),
  'northline.myshopify.com'
);
assert.equal(buttons(connected, 'Sync again'), 1);
assert.equal(buttons(connected, 'Reconnect Shopify'), 0);
assert.ok(connected.includes('128'));
assert.ok(connected.includes('Last synced September 23, 2026'));
assert.equal(connected.includes('Shop ID'), false);

const failed = html(
  shopifyRecoveryView({
    statusKnown: true,
    isConnected: true,
    sync: gate({
      state: 'failed',
      detail: 'Catalog sync failed. Use Sync again.',
      eligibilityReason: 'catalog_sync_not_succeeded',
    }),
    productCount: 12,
    webhookError: 'inventory_levels/update was not registered',
  }),
  'northline.myshopify.com'
);
assert.equal(buttons(failed, 'Sync again'), 1);
assert.equal(buttons(failed, 'Reconnect Shopify'), 0);
assert.ok(failed.includes('Catalog sync failed. Use Sync again.'));
assert.ok(failed.includes('inventory_levels/update was not registered'));
assert.equal(failed.includes('>12<'), false);

const disconnected = html(
  shopifyRecoveryView({
    statusKnown: true,
    isConnected: false,
    sync: gate({ state: 'not_started', eligibilityReason: 'shopify_not_connected' }),
    productCount: null,
    webhookError: 'should not show',
  }),
  null
);
assert.equal(buttons(disconnected, 'Reconnect Shopify'), 1);
assert.equal(buttons(disconnected, 'Sync again'), 0);
assert.equal(disconnected.includes('should not show'), false);

for (const markup of [connected, failed, disconnected]) {
  for (const word of forbidden) {
    assert.equal(markup.toLowerCase().includes(word.toLowerCase()), false, markup);
  }
}

console.log('recovery view ok');
