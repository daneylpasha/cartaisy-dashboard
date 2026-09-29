import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectStep } from '@/components/onboarding/steps/ConnectStep';
import { ShopifyStoreAddressHelp } from '@/components/shopify/ShopifyStoreAddressHelp';
import type { ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';
import type { ShopifyReturnCopy } from '@/lib/shopify/merchantCopy';

const here = dirname(fileURLToPath(import.meta.url));
const settingsSource = readFileSync(join(here, '../../components/shopify/ConnectShopify.tsx'), 'utf8');

const connection: ShopifyConnectionSnapshot = {
  statusKnown: true,
  isConnected: false,
  shopDomain: null,
  shopId: null,
  connectedAt: null,
  lastSyncAt: null,
  webhookRegistrationError: null,
};

const sync: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

function step(returnNotice: ShopifyReturnCopy | null): string {
  return renderToStaticMarkup(
    createElement(ConnectStep, {
      connection,
      sync,
      catalog: { productCount: null, orderCount: null, collections: [] },
      warning:
        'Shopify is not connected yet. You can confirm your brand. Build stays off until the store is connected and synced.',
      checking: false,
      startError: null,
      starting: false,
      returnNotice,
      suggestedShop: null,
      syncing: false,
      onStart: () => {},
      onContinue: () => {},
      onRefresh: () => {},
      onSyncAgain: () => {},
    })
  );
}

const help = renderToStaticMarkup(
  createElement(ShopifyStoreAddressHelp, {
    id: 'shop-help',
    size: 'sm',
    note: 'This opens Shopify so you can approve access.',
  })
);

const fresh = step(null);
const retry = step({
  tone: 'error',
  title: 'Shopify did not connect',
  body: 'Try the store address again.',
});

for (const markup of [fresh, retry, help]) {
  assert.match(markup, /your-store\.myshopify\.com/);
  assert.match(markup, /shop\.com/);
  assert.match(markup, /How to find it/);
  assert.match(markup, /address bar/);
  assert.match(markup, /admin\.shopify\.com\/store\/your-store/);
  assert.match(markup, /Settings, then Domains/);
  assert.match(markup, /https:\/\//);
  assert.equal(markup.includes('Cartaisy'), false);
  assert.equal(markup.includes('OAuth'), false);
  assert.equal(markup.includes('access token'), false);
}

assert.match(fresh, /placeholder="store-name\.myshopify\.com"/);
assert.match(fresh, />Connect Shopify</);
assert.match(fresh, />Continue without connecting</);
assert.equal(fresh.includes('Then connect again.'), false);
assert.match(retry, /Then connect again\./);
assert.match(retry, />Reconnect Shopify</);
assert.match(help, /This opens Shopify so you can approve access\./);
assert.match(settingsSource, /<ShopifyStoreAddressHelp/);
assert.match(settingsSource, /placeholder="your-store\.myshopify\.com"/);
assert.match(settingsSource, /note="This opens Shopify so you can approve access\."/);

console.log('store address help ok');
