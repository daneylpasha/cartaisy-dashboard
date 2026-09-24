import assert from 'node:assert/strict';
import { recoveryStatusLine, sanitizeStatusText, shopifyRecoveryView } from './recovery.ts';
import type { SyncGate } from '../onboarding/types.ts';

function gate(partial: Partial<SyncGate> & Pick<SyncGate, 'state'>): SyncGate {
  return {
    detail: null,
    eligibleForBuild: false,
    eligibilityReason: null,
    ...partial,
  };
}

const connected = {
  statusKnown: true,
  isConnected: true,
  productCount: null as number | null,
  webhookError: null as string | null,
};

assert.equal(sanitizeStatusText('shpat_secret'), null);
assert.equal(sanitizeStatusText('customers/create was not registered'), 'customers/create was not registered');

const disconnected = shopifyRecoveryView({
  ...connected,
  isConnected: false,
  sync: gate({ state: 'not_started', eligibilityReason: 'shopify_not_connected' }),
});
assert.equal(disconnected.control?.kind, 'reconnect');
assert.equal(disconnected.headline, 'Shopify is disconnected');
assert.equal(disconnected.runAgain, false);

const revoked = shopifyRecoveryView({
  ...connected,
  isConnected: true,
  sync: gate({ state: 'succeeded', eligibilityReason: 'shopify_not_connected' }),
});
assert.equal(revoked.control?.kind, 'reconnect');

const failed = shopifyRecoveryView({
  ...connected,
  sync: gate({
    state: 'failed',
    detail: 'Catalog sync failed. Use Sync again.',
    eligibilityReason: 'catalog_sync_not_succeeded',
  }),
  webhookError: 'customers/create was not registered',
  productCount: 12,
});
assert.equal(failed.headline, 'Sync failed');
assert.equal(failed.support, 'Catalog sync failed. Use Sync again.');
assert.equal(failed.webhookNote, 'customers/create was not registered');
assert.equal(failed.productCount, null);
assert.deepEqual(failed.control, { kind: 'sync', disabled: false });

const syncing = shopifyRecoveryView({
  ...connected,
  sync: gate({ state: 'in_progress' }),
});
assert.equal(syncing.tone, 'working');
assert.deepEqual(syncing.control, { kind: 'sync', disabled: true });
assert.match(syncing.support ?? '', /Not synced yet/);

const idle = shopifyRecoveryView({
  ...connected,
  sync: gate({ state: 'not_started', eligibilityReason: 'catalog_sync_not_succeeded' }),
});
assert.equal(idle.headline, 'Not synced yet');
assert.match(idle.support ?? '', /Sync again/);
assert.equal(idle.control?.kind, 'sync');

const synced = shopifyRecoveryView({
  ...connected,
  sync: gate({
    state: 'succeeded',
    eligibleForBuild: true,
    lastSucceededAt: '2026-09-23T00:00:00.000Z',
  }),
  productCount: 128,
  lastSyncAt: '2026-09-01T00:00:00.000Z',
});
assert.equal(synced.headline, 'Synced');
assert.equal(synced.productCount, 128);
assert.equal(synced.countNoun, 'products');
assert.equal(synced.lastSyncLabel, 'Last synced September 23, 2026');
assert.equal(synced.control, null);
assert.equal(synced.runAgain, true);
assert.equal(recoveryStatusLine(synced), '128 products · Last synced September 23, 2026');

const webhookOnly = shopifyRecoveryView({
  ...connected,
  sync: gate({ state: 'succeeded', eligibleForBuild: true }),
  webhookError: 'Bearer shpat_secret',
  productCount: 4,
});
assert.equal(webhookOnly.webhookNote, null);
assert.equal(webhookOnly.control, null);
assert.equal(webhookOnly.runAgain, true);

const webhookReconnect = shopifyRecoveryView({
  ...connected,
  sync: gate({ state: 'succeeded', eligibleForBuild: true }),
  webhookError: 'inventory_levels/update was not registered',
  productCount: 4,
});
assert.equal(webhookReconnect.control?.kind, 'reconnect');
assert.equal(webhookReconnect.runAgain, false);
assert.equal(webhookReconnect.webhookNote, 'inventory_levels/update was not registered');

assert.equal(
  shopifyRecoveryView({
    statusKnown: false,
    isConnected: false,
    sync: gate({ state: 'unavailable' }),
    productCount: null,
    webhookError: null,
  }).control,
  null
);
