import assert from 'node:assert/strict';
import {
  buildRequestAvailability,
  connectPrimaryAction,
  normalizeCatalog,
  normalizeCollectionNames,
  normalizeConnectionStatus,
  normalizeShopDomainInput,
  normalizeSyncStatus,
  onboardingSyncWarning,
  readAuthorizationUrl,
  readableTextOn,
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

assert.equal(buildRequestAvailability({ state: 'succeeded', detail: null }).enabled, true);
assert.equal(buildRequestAvailability({ state: 'not_started', detail: null }).enabled, false);
assert.equal(buildRequestAvailability({ state: 'unavailable', detail: null }).enabled, false);

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
  label: 'Continue',
});

assert.equal(readableTextOn('#ffffff'), '#111111');
assert.equal(readableTextOn('#111111'), '#ffffff');
assert.equal(readableTextOn('#FF6B6B'), '#ffffff');

console.log('onboarding normalizers ok');
