import assert from 'node:assert/strict';
import {
  catalogBlockCopy,
  catalogBlockFromPayload,
  classifyShopifyCatalogBlock,
  preferCatalogBlock,
  withCatalogBlock,
} from './catalogBlock.ts';
import type { SyncGate } from '../onboarding/types.ts';

const succeeded: SyncGate = {
  state: 'succeeded',
  detail: null,
  eligibleForBuild: true,
  eligibilityReason: null,
};

assert.equal(classifyShopifyCatalogBlock({ code: 'shopify_reconnect_required', status: 409 }), 'reconnect');
assert.equal(classifyShopifyCatalogBlock({ code: 'SHOPIFY_PAYMENT_REQUIRED', status: 402 }), 'billing');
assert.equal(classifyShopifyCatalogBlock({ code: 'shopify-store-billing-required' }), 'billing');
assert.equal(classifyShopifyCatalogBlock({ status: 402 }), 'billing');
assert.equal(
  classifyShopifyCatalogBlock({ message: 'Shopify API error: Payment Required', status: 500 }),
  'billing'
);
assert.equal(
  classifyShopifyCatalogBlock({
    message: 'Shopify access token could not be read. Reconnect the store to restore catalog sync.',
  }),
  'reconnect'
);
assert.equal(classifyShopifyCatalogBlock({ code: 'SHOPIFY_NOT_CONNECTED', status: 409 }), null);
assert.equal(classifyShopifyCatalogBlock({ code: 'CATALOG_SYNC_IN_PROGRESS', status: 409 }), null);
assert.equal(classifyShopifyCatalogBlock({ message: 'shpat_secret Payment Required' }), null);
assert.equal(classifyShopifyCatalogBlock({ message: 'Failed to fetch collections', status: 500 }), null);

const reconnectBody = catalogBlockFromPayload(
  {
    success: false,
    error: 'Shopify access token could not be read. Reconnect the store to restore catalog sync.',
    code: 'shopify_reconnect_required',
  },
  false,
  409
);
assert.equal(reconnectBody, 'reconnect');

const billingAlias = catalogBlockFromPayload(
  { success: false, error: 'This Shopify store needs an active plan.', code: 'shopify_store_billing_required' },
  false,
  409
);
assert.equal(billingAlias, 'billing');

const nested = catalogBlockFromPayload({ data: { code: 'shopify_payment_required' } }, false, 500);
assert.equal(nested, 'billing');

const healthy = catalogBlockFromPayload(
  { success: true, data: { status: 'succeeded', errorSummary: 'Payment Required' } },
  true,
  200
);
assert.equal(healthy, null);

const failedSummary = catalogBlockFromPayload(
  {
    success: true,
    data: { status: 'failed', errorSummary: 'Shopify API error: Payment Required' },
  },
  true,
  200
);
assert.equal(failedSummary, 'billing');

assert.equal(preferCatalogBlock(null, 'billing', 'reconnect'), 'reconnect');
assert.equal(preferCatalogBlock(null, undefined), null);

const blocked = withCatalogBlock(succeeded, 'billing');
assert.equal(blocked.block, 'billing');
assert.equal(blocked.eligibleForBuild, false);
assert.match(blocked.detail ?? '', /Syncing again will not change that/);
assert.equal(catalogBlockCopy('billing').headline, 'Shopify billing needs attention');
assert.equal(catalogBlockCopy('reconnect').headline, 'Reconnect Shopify');
assert.equal(catalogBlockCopy('billing').support.includes('Cartaisy'), false);
assert.equal(catalogBlockCopy('reconnect').support.includes('shpat_'), false);
