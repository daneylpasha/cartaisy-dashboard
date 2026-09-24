import assert from 'node:assert/strict';
import {
  ADMIN_BUILD_PAGE_LIMIT,
  OPEN_BUILD_STATUSES,
  adminBuildRequestsPath,
  adminBuildStatusPath,
  applyStatusSnapshot,
  normalizeAdminBuildPage,
  normalizeAdminStatusSnapshot,
  opsPlatformStatusLabel,
  statusPatchBody,
  type AdminBuildRequest,
} from './adminContract.ts';

const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const STORE_ID = '66f1c2e0a1b2c3d4e5f60710';

const sample = {
  id: REQUEST_ID,
  storeId: STORE_ID,
  store: {
    id: STORE_ID,
    name: 'Northwind',
    domain: 'northwind.myshopify.com',
  },
  requestedBy: '66f1c2e0a1b2c3d4e5f60711',
  platforms: {
    android: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z' },
    ios: { status: 'waiting_on_merchant', updatedAt: '2026-09-23T21:00:00.000Z' },
  },
  checklist: { accessNotes: 'Apple developer invite sent.' },
  createdAt: '2026-09-23T20:00:00.000Z',
  updatedAt: '2026-09-23T21:00:00.000Z',
};

const page = normalizeAdminBuildPage({
  success: true,
  data: {
    requests: [sample],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
});

assert.ok(page);
assert.equal(page?.requests.length, 1);
const first = page?.requests[0];
assert.equal(first?.id, REQUEST_ID);
assert.equal(first?.storeName, 'Northwind');
assert.equal(first?.storeDomain, 'northwind.myshopify.com');
assert.equal(first?.accessNotes, 'Apple developer invite sent.');
assert.equal(first?.platforms.android.status, 'queued');
assert.equal(first?.platforms.ios.status, 'waiting_on_merchant');
assert.equal(JSON.stringify(first).includes(STORE_ID), false);
assert.equal(JSON.stringify(first).includes('requestedBy'), false);

const empty = normalizeAdminBuildPage({
  success: true,
  data: {
    requests: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  },
});
assert.deepEqual(empty, {
  requests: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
});

const missingStore = normalizeAdminBuildPage({
  data: {
    requests: [
      {
        ...sample,
        store: { id: STORE_ID, name: null, domain: null },
        checklist: { accessNotes: '   ' },
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
});
assert.equal(missingStore?.requests[0]?.storeName, null);
assert.equal(missingStore?.requests[0]?.storeDomain, null);
assert.equal(missingStore?.requests[0]?.accessNotes, null);

const skipped = normalizeAdminBuildPage({
  data: {
    requests: [{ id: 'not-an-id' }, sample],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
  },
});
assert.equal(skipped?.requests.length, 1);

assert.equal(normalizeAdminBuildPage({ data: { requests: [] } }), null);
assert.equal(normalizeAdminBuildPage({ success: false, error: 'Platform admin access required' }), null);

const openPath = adminBuildRequestsPath({ page: 1, limit: ADMIN_BUILD_PAGE_LIMIT, filter: 'open' });
assert.equal(openPath.startsWith('/admin/build-requests?'), true);
const openQuery = new URLSearchParams(openPath.split('?')[1]);
assert.equal(openQuery.get('page'), '1');
assert.equal(openQuery.get('limit'), '20');
assert.equal(openQuery.get('status'), OPEN_BUILD_STATUSES.join(','));
assert.equal(openQuery.has('storeId'), false);
assert.equal(openQuery.has('platform'), false);

const allPath = adminBuildRequestsPath({ page: 2, limit: 1, filter: 'all' });
const allQuery = new URLSearchParams(allPath.split('?')[1]);
assert.equal(allQuery.get('page'), '2');
assert.equal(allQuery.get('limit'), '1');
assert.equal(allQuery.has('status'), false);

assert.equal(adminBuildStatusPath(REQUEST_ID), `/admin/build-requests/${REQUEST_ID}/status`);
assert.deepEqual(statusPatchBody('android', 'ready'), { android: { status: 'ready' } });
assert.equal(JSON.stringify(statusPatchBody('ios', 'failed')).includes('android'), false);

assert.equal(opsPlatformStatusLabel('android', 'waiting_on_merchant'), 'Waiting on merchant');
assert.equal(opsPlatformStatusLabel('ios', 'waiting_on_merchant'), 'Waiting on Apple');
assert.equal(opsPlatformStatusLabel('android', 'ready'), 'Ready');
assert.equal(opsPlatformStatusLabel('ios', 'building'), 'Building');
assert.equal(opsPlatformStatusLabel('android', 'queued'), 'Queued');
assert.equal(opsPlatformStatusLabel('ios', 'failed'), 'Failed');

const snapshot = normalizeAdminStatusSnapshot({
  success: true,
  data: {
    ...sample,
    store: undefined,
    platforms: {
      android: { status: 'ready', updatedAt: '2026-09-23T22:00:00.000Z' },
      ios: sample.platforms.ios,
    },
    updatedAt: '2026-09-23T22:00:00.000Z',
  },
});
assert.ok(snapshot);
assert.ok(first);
const merged = applyStatusSnapshot(first as AdminBuildRequest, snapshot!);
assert.equal(merged.storeName, 'Northwind');
assert.equal(merged.storeDomain, 'northwind.myshopify.com');
assert.equal(merged.platforms.android.status, 'ready');
assert.equal(merged.platforms.ios.status, 'waiting_on_merchant');
assert.equal(merged.accessNotes, 'Apple developer invite sent.');

console.log('admin build contract ok');
