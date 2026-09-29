import assert from 'node:assert/strict';
import { copyForReason } from '../shopify/merchantCopy.ts';
import {
  buildRequestAvailability,
  connectCatalogView,
  connectPrimaryAction,
  consumeShopifyReturnQuery,
  normalizeCatalog,
  normalizeCollectionNames,
  normalizeConnectionStatus,
  normalizeShopDomainInput,
  normalizeSyncStatus,
  onboardingSyncWarning,
  readAuthorizationUrl,
  safeReturnedShop,
  shouldAutoStartCatalogSync,
} from './normalizers.ts';

const connected = normalizeConnectionStatus(
  {
    success: true,
    data: {
      isConnected: true,
      shop: 'northline.myshopify.com',
      shopId: 'gid://shopify/Shop/99',
      accessToken: 'shpat_should_not_leak',
      connectedAt: '2026-09-23T00:00:00.000Z',
    },
  },
  true
);

assert.equal(connected.statusKnown, true);
assert.equal(connected.isConnected, true);
assert.equal(connected.shopDomain, 'northline.myshopify.com');
assert.equal(connected.shopId, 'gid://shopify/Shop/99');
assert.equal('accessToken' in connected, false);
assert.equal(connected.webhookRegistrationError, null);
assert.equal(connected.lastSyncAt, null);

const webhookConnected = normalizeConnectionStatus(
  {
    data: {
      isConnected: true,
      shop: 'northline.myshopify.com',
      webhookRegistrationError: 'inventory_levels/update was not registered',
      lastSyncAt: '2026-09-23T00:00:00.000Z',
    },
  },
  true
);
assert.equal(webhookConnected.webhookRegistrationError, 'inventory_levels/update was not registered');
assert.equal(webhookConnected.lastSyncAt, '2026-09-23T00:00:00.000Z');

const leakedWebhook = normalizeConnectionStatus(
  {
    data: {
      isConnected: true,
      shop: 'northline.myshopify.com',
      webhookRegistrationError: 'shpat_secret',
    },
  },
  true
);
assert.equal(leakedWebhook.webhookRegistrationError, null);

assert.equal(
  normalizeConnectionStatus(
    { data: { isConnected: false, webhookRegistrationError: 'should stay hidden', lastSyncAt: '2026-09-23T00:00:00.000Z' } },
    true
  ).webhookRegistrationError,
  null
);

const disconnected = normalizeConnectionStatus(
  { data: { isConnected: false, shop: null } },
  true
);
assert.equal(disconnected.statusKnown, true);
assert.equal(disconnected.isConnected, false);

const unknown = normalizeConnectionStatus(null, false);
assert.equal(unknown.statusKnown, false);

assert.deepEqual(normalizeSyncStatus({ data: { state: 'succeeded' } }, true), {
  state: 'succeeded',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
});

assert.equal(
  normalizeSyncStatus(
    { data: { inProgress: false, errors: [], lastFullSync: '2026-09-01T00:00:00.000Z' } },
    true
  ).state,
  'succeeded'
);

assert.equal(
  normalizeSyncStatus({ data: { inProgress: true, errors: [], stats: {} } }, true).state,
  'in_progress'
);

assert.equal(
  normalizeSyncStatus({ data: { inProgress: false, errors: ['timeout'] } }, true).state,
  'failed'
);

assert.equal(
  normalizeSyncStatus({ data: { inProgress: false, errors: [] } }, true).state,
  'not_started'
);

assert.equal(normalizeSyncStatus({ data: { unexpected: true } }, true).state, 'unavailable');
assert.equal(
  normalizeSyncStatus({ data: { lastSyncAt: '2026-09-23T00:00:00.000Z' } }, true).eligibleForBuild,
  false
);
assert.equal(
  normalizeSyncStatus({ data: { lastSyncAt: '2026-09-23T00:00:00.000Z' } }, true).state,
  'unavailable'
);
assert.equal(
  normalizeSyncStatus(
    {
      data: {
        status: 'failed',
        eligibleForBuild: false,
        eligibilityReason: 'catalog_sync_not_succeeded',
        errorSummary: 'shpat_secret leaked',
      },
    },
    false
  ).detail,
  null
);
assert.equal(normalizeSyncStatus(null, false).state, 'unavailable');

assert.deepEqual(
  normalizeCatalog(
    { data: { products: { total: 12 }, orders: { total: 3 } } },
    true
  ),
  { productCount: 12, orderCount: 3 }
);

assert.deepEqual(
  normalizeCollectionNames(
    { data: { collections: [{ title: 'New' }, { name: 'Staff picks' }, { title: '  ' }] } },
    true
  ),
  ['New', 'Staff picks']
);

assert.equal(normalizeShopDomainInput('North-Line'), 'north-line.myshopify.com');
assert.equal(normalizeShopDomainInput('https://north-line.myshopify.com/admin'), 'north-line.myshopify.com');
assert.equal(normalizeShopDomainInput('not a shop'), null);

assert.equal(
  readAuthorizationUrl({
    data: { authorizationUrl: 'https://north-line.myshopify.com/admin/oauth/authorize?client_id=1' },
  }),
  'https://north-line.myshopify.com/admin/oauth/authorize?client_id=1'
);
assert.equal(readAuthorizationUrl({ data: { authorizationUrl: 'https://evil.example/steal' } }), null);
assert.equal(readAuthorizationUrl({ data: { authorizationUrl: 'javascript:alert(1)' } }), null);

assert.equal(
  normalizeSyncStatus(
    {
      data: {
        status: 'succeeded',
        eligibleForBuild: true,
        eligibilityReason: null,
        lastSyncAt: '2026-09-23T00:00:00.000Z',
      },
    },
    true
  ).eligibleForBuild,
  true
);

const idleDespiteTimestamps = normalizeSyncStatus(
  {
    data: {
      status: 'idle',
      eligibleForBuild: false,
      eligibilityReason: 'catalog_sync_not_succeeded',
      lastSyncAt: '2026-09-23T00:00:00.000Z',
      lastSucceededAt: '2026-09-01T00:00:00.000Z',
    },
  },
  true
);
assert.equal(idleDespiteTimestamps.state, 'not_started');
assert.equal(idleDespiteTimestamps.eligibleForBuild, false);
assert.equal(idleDespiteTimestamps.lastSucceededAt, '2026-09-01T00:00:00.000Z');

const succeededButDisconnected = normalizeSyncStatus(
  {
    data: {
      status: 'succeeded',
      eligibleForBuild: false,
      eligibilityReason: 'shopify_not_connected',
      lastSyncAt: '2026-09-23T00:00:00.000Z',
    },
  },
  true
);
assert.equal(succeededButDisconnected.eligibleForBuild, false);
assert.equal(succeededButDisconnected.eligibilityReason, 'shopify_not_connected');

assert.equal(
  normalizeSyncStatus(
    { data: { inProgress: false, errors: [], lastFullSync: '2026-09-01T00:00:00.000Z' } },
    true
  ).eligibleForBuild,
  false
);

const eligibleSync = {
  state: 'succeeded' as const,
  detail: null,
  eligibleForBuild: true,
  eligibilityReason: null,
};
assert.equal(buildRequestAvailability(eligibleSync, connected).enabled, true);
assert.equal(buildRequestAvailability(eligibleSync, disconnected).enabled, false);
assert.equal(buildRequestAvailability(eligibleSync, disconnected).action, 'connect');
assert.match(
  buildRequestAvailability(eligibleSync, disconnected).reason ?? '',
  /Reconnect before requesting a build/
);
assert.equal(
  buildRequestAvailability({
    state: 'succeeded',
    detail: null,
    eligibleForBuild: false,
    eligibilityReason: null,
  }).enabled,
  false
);
assert.equal(
  buildRequestAvailability({
    state: 'not_started',
    detail: null,
    eligibleForBuild: false,
    eligibilityReason: 'catalog_sync_not_succeeded',
  }).action,
  'sync'
);
assert.equal(
  buildRequestAvailability({
    state: 'unavailable',
    detail: null,
    eligibleForBuild: false,
    eligibilityReason: null,
  }).action,
  'retry'
);
assert.equal(
  buildRequestAvailability(succeededButDisconnected, connected).action,
  'connect'
);

const billingSync = normalizeSyncStatus(
  {
    success: false,
    code: 'shopify_payment_required',
    error: 'Shopify API error: Payment Required',
  },
  false,
  402
);
assert.equal(billingSync.block, 'billing');
assert.equal(billingSync.state, 'failed');
assert.equal(buildRequestAvailability(billingSync, connected).action, 'billing');
assert.equal(buildRequestAvailability(billingSync, connected).enabled, false);
assert.match(buildRequestAvailability(billingSync, connected).reason ?? '', /will not change that/);

const billingSummary = normalizeSyncStatus(
  {
    data: {
      status: 'failed',
      eligibleForBuild: false,
      eligibilityReason: 'catalog_sync_not_succeeded',
      errorSummary: 'Shopify API error: Payment Required',
    },
  },
  true,
  200
);
assert.equal(billingSummary.block, 'billing');
assert.match(billingSummary.detail ?? '', /will not change that/);

const reconnectSync = normalizeSyncStatus(
  {
    success: false,
    code: 'shopify_reconnect_required',
    error: 'Shopify access token could not be read. Reconnect the store to restore catalog sync.',
  },
  false,
  409
);
assert.equal(reconnectSync.block, 'reconnect');
assert.equal(buildRequestAvailability(reconnectSync, connected).action, 'connect');

const genericFailure = normalizeSyncStatus({ success: false, error: 'Failed to fetch collections' }, false, 500);
assert.equal(genericFailure.block ?? null, null);
assert.equal(genericFailure.state, 'unavailable');

const stillSynced = normalizeSyncStatus(
  { data: { status: 'succeeded', eligibleForBuild: true, errorSummary: 'Payment Required' } },
  true,
  200
);
assert.equal(stillSynced.block ?? null, null);
assert.equal(stillSynced.eligibleForBuild, true);

assert.equal(
  onboardingSyncWarning({
    statusKnown: true,
    isConnected: true,
    sync: { state: 'succeeded', detail: null },
  }),
  null
);
assert.ok(
  onboardingSyncWarning({
    statusKnown: true,
    isConnected: false,
    sync: { state: 'not_started', detail: null },
  })
);

assert.deepEqual(connectPrimaryAction({ liveRedirectEnabled: false, isConnected: false }), {
  kind: 'continue',
  label: 'Continue',
});
assert.deepEqual(connectPrimaryAction({ liveRedirectEnabled: true, isConnected: false }), {
  kind: 'start',
  label: 'Connect Shopify',
});
assert.deepEqual(connectPrimaryAction({ liveRedirectEnabled: true, isConnected: true }), {
  kind: 'continue',
  label: 'Continue to Brand',
});
assert.deepEqual(connectPrimaryAction({ liveRedirectEnabled: false, isConnected: true }), {
  kind: 'continue',
  label: 'Continue to Brand',
});

assert.equal(shouldAutoStartCatalogSync('not_started'), true);
assert.equal(shouldAutoStartCatalogSync('failed'), true);
assert.equal(shouldAutoStartCatalogSync('failed', 'billing'), false);
assert.equal(shouldAutoStartCatalogSync('failed', 'reconnect'), false);
assert.equal(shouldAutoStartCatalogSync('in_progress'), false);
assert.equal(shouldAutoStartCatalogSync('succeeded'), false);
assert.equal(shouldAutoStartCatalogSync('unavailable'), false);

const idleView = connectCatalogView(
  { state: 'not_started', detail: null, eligibleForBuild: false, eligibilityReason: null },
  null
);
assert.equal(idleView.headline, 'Not synced yet');
assert.equal(idleView.count, null);
assert.equal(idleView.showSyncAgain, true);

const syncingView = connectCatalogView(
  { state: 'in_progress', detail: null, eligibleForBuild: false, eligibilityReason: null },
  12
);
assert.equal(syncingView.busy, true);
assert.equal(syncingView.count, null);
assert.equal(syncingView.showSyncAgain, false);
assert.match(syncingView.support ?? '', /Not synced yet/);

const syncedView = connectCatalogView(
  { state: 'succeeded', detail: null, eligibleForBuild: true, eligibilityReason: null },
  128
);
assert.equal(syncedView.count, 128);
assert.equal(syncedView.countNoun, 'products');
assert.equal(syncedView.headline, 'Synced');

const oneProduct = connectCatalogView(
  { state: 'succeeded', detail: null, eligibleForBuild: true, eligibilityReason: null },
  1
);
assert.equal(oneProduct.countNoun, 'product');

const syncedWithoutCount = connectCatalogView(
  { state: 'succeeded', detail: null, eligibleForBuild: true, eligibilityReason: null },
  null
);
assert.equal(syncedWithoutCount.count, null);
assert.match(syncedWithoutCount.support ?? '', /not available yet/i);

const failedView = connectCatalogView(
  {
    state: 'failed',
    detail: 'Catalog sync failed. Use Sync again.',
    eligibleForBuild: false,
    eligibilityReason: 'catalog_sync_not_succeeded',
  },
  null
);
assert.equal(failedView.headline, 'Sync failed');
assert.equal(failedView.support, 'Catalog sync failed. Use Sync again.');
assert.equal(failedView.showSyncAgain, true);

assert.deepEqual(
  consumeShopifyReturnQuery('step=connect&shopify=connected&shop=northline.myshopify.com'),
  { query: 'step=connect', changed: true }
);
assert.deepEqual(consumeShopifyReturnQuery('shopify=error&reason=invalid_state&error=legacy'), {
  query: 'step=connect',
  changed: true,
});
assert.deepEqual(consumeShopifyReturnQuery('step=brand&shop=northline.myshopify.com'), {
  query: 'step=brand&shop=northline.myshopify.com',
  changed: false,
});

assert.equal(safeReturnedShop('Northline.myshopify.com'), 'northline.myshopify.com');
assert.equal(safeReturnedShop('https://northline.myshopify.com'), null);
assert.equal(safeReturnedShop('shop<script>'), null);

const backendReasons = [
  'missing_parameters',
  'invalid_hmac',
  'invalid_state',
  'token_exchange_failed',
  'oauth_not_configured',
  'invalid_shop',
  'shop_taken',
  'shop_switch_required',
  'store_not_found',
  'store_required',
  'credential_save_failed',
  'oauth_failed',
  'revoke_failed',
];
const unknownReason = copyForReason('not_a_backend_reason');
for (const code of backendReasons) {
  assert.notEqual(copyForReason(code), unknownReason, code);
}

const overviewWithItems = {
  data: {
    products: {
      total: 12,
      items: [
        {
          title: 'Linen shirt',
          price: 48,
          currency: 'USD',
          images: [{ url: 'https://cdn.example/shirt.jpg', position: 2 }, { url: 'https://cdn.example/front.jpg', position: 1 }],
        },
      ],
    },
    orders: { total: 3 },
  },
};
assert.deepEqual(normalizeCatalog(overviewWithItems, true), { productCount: 12, orderCount: 3 });

console.log('onboarding normalizers ok');
