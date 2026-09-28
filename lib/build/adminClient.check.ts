import assert from 'node:assert/strict';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { listAdminBuildRequests, updateAdminBuildStatus } from '@/lib/build/adminClient';

const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const SECRET_NOTE = 'secret-access-note-should-not-leak';

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
  key: () => null,
  length: 0,
};

const location = { href: 'http://localhost/dashboard/admin/build-requests' };

Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'window', { value: { location }, configurable: true });
Object.defineProperty(globalThis, 'document', { value: { cookie: '' }, configurable: true });

interface Call {
  url: string;
  method: string;
  authorization: string;
  storeHeader: string;
  body: string;
}

const calls: Call[] = [];
let routes: Array<(call: Call) => Response | null> = [];

function installFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    const call: Call = {
      url,
      method: init?.method ?? 'GET',
      authorization: headers.get('authorization') ?? '',
      storeHeader: headers.get('x-store-id') ?? '',
      body: typeof init?.body === 'string' ? init.body : '',
    };
    calls.push(call);
    for (const route of routes) {
      const response = route(call);
      if (response) return response;
    }
    throw new Error(`unexpected ${call.method} ${url}`);
  }) as typeof fetch;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function path(url: string): string {
  return new URL(url).pathname;
}

function reset() {
  calls.length = 0;
  routes = [];
  memory.clear();
  location.href = 'http://localhost/dashboard/admin/build-requests';
  document.cookie = '';
  installFetch();
}

const queued = {
  id: REQUEST_ID,
  storeId: '66f1c2e0a1b2c3d4e5f60710',
  store: { id: '66f1c2e0a1b2c3d4e5f60710', name: 'Northwind', domain: 'northwind.myshopify.com' },
  platforms: {
    android: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z' },
    ios: { status: 'not_requested', updatedAt: '2026-09-23T20:00:00.000Z' },
  },
  checklist: { accessNotes: 'Apple developer invite sent.' },
  createdAt: '2026-09-23T20:00:00.000Z',
  updatedAt: '2026-09-23T20:00:00.000Z',
};

function listBody() {
  return {
    success: true,
    data: {
      requests: [queued],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    },
  };
}

function bearer(token: string): string {
  return `Bearer ${token}`;
}

async function main() {
  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/admin/build-requests') && call.method === 'GET' ? json(200, listBody()) : null,
  ];
  const listed = await listAdminBuildRequests('access-1', { page: 1, limit: 20, filter: 'open' });
  assert.equal(listed.kind, 'ok');
  if (listed.kind === 'ok') {
    assert.equal(listed.page.requests[0]?.storeName, 'Northwind');
    assert.equal(listed.page.requests[0]?.appName, null);
    assert.equal(listed.page.requests[0]?.storeId, '66f1c2e0a1b2c3d4e5f60710');
    assert.notEqual(listed.page.requests[0]?.storeId, REQUEST_ID);
    assert.equal(listed.page.requests[0]?.iconUrl, null);
    assert.equal(listed.page.requests[0]?.splashUrl, null);
    assert.equal(listed.page.requests[0]?.accessNotes, 'Apple developer invite sent.');
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.authorization, bearer('access-1'));
  assert.equal(calls[0]?.storeHeader, '');
  const listedUrl = new URL(calls[0]?.url ?? '');
  assert.equal(listedUrl.pathname.endsWith('/admin/build-requests'), true);
  assert.equal(listedUrl.searchParams.get('status'), 'queued,building,waiting_on_merchant');
  assert.equal(listedUrl.searchParams.has('storeId'), false);
  assert.equal(
    calls.some((call) => call.url.includes('/auth/refresh-token')),
    false
  );

  reset();
  tokenStorage.setTokens('owner-access', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).includes('/admin/build-requests')
        ? json(403, {
            success: false,
            error: 'Platform admin access required',
            data: { requests: [{ checklist: { accessNotes: SECRET_NOTE }, id: REQUEST_ID }] },
          })
        : null,
  ];
  const denied = await listAdminBuildRequests('owner-access', { limit: 1 });
  assert.equal(denied.kind, 'forbidden');
  assert.equal(JSON.stringify(denied).includes(SECRET_NOTE), false);
  assert.equal(JSON.stringify(denied).includes(REQUEST_ID), false);
  const deniedPatch = await updateAdminBuildStatus('owner-access', REQUEST_ID, 'android', 'ready');
  assert.equal(deniedPatch.kind, 'forbidden');
  assert.equal(JSON.stringify(deniedPatch).includes(SECRET_NOTE), false);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) => {
      if (call.method !== 'PATCH' || !path(call.url).endsWith(`/admin/build-requests/${REQUEST_ID}/status`)) {
        return null;
      }
      assert.equal(call.body, JSON.stringify({ ios: { status: 'waiting_on_merchant' } }));
      assert.equal(call.storeHeader, '');
      return json(200, {
        success: true,
        data: {
          ...queued,
          store: undefined,
          platforms: {
            android: queued.platforms.android,
            ios: { status: 'waiting_on_merchant', updatedAt: '2026-09-23T21:00:00.000Z' },
          },
        },
      });
    },
  ];
  const saved = await updateAdminBuildStatus('access-1', REQUEST_ID, 'ios', 'waiting_on_merchant');
  assert.equal(saved.kind, 'ok');
  if (saved.kind === 'ok') {
    assert.equal(saved.snapshot.platforms.ios.status, 'waiting_on_merchant');
    assert.equal(saved.snapshot.platforms.android.status, 'queued');
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  const local = await updateAdminBuildStatus('access-1', 'not-an-id', 'android', 'failed');
  assert.equal(local.kind, 'missing');
  assert.equal(calls.length, 0);

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  let attempts = 0;
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token') && call.method === 'POST') {
        return json(200, { data: { token: 'fresh-access', refreshToken: 'refresh-2', user: { id: 'user-1' } } });
      }
      if (path(call.url).endsWith('/admin/build-requests') && call.method === 'GET') {
        attempts += 1;
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        if (call.authorization === bearer('fresh-access')) return json(200, listBody());
      }
      return null;
    },
  ];
  const refreshed = await listAdminBuildRequests('stale-access', { filter: 'all' });
  assert.equal(refreshed.kind, 'ok');
  assert.equal(attempts, 2);
  assert.equal(tokenStorage.getToken(), 'fresh-access');
  assert.equal(location.href.includes('/login'), false);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      call.method === 'PATCH'
        ? json(400, { success: false, error: 'android.status must be one of: not_requested, queued, building, ready, failed, waiting_on_merchant', code: 'BUILD_REQUEST_INVALID' })
        : null,
  ];
  const invalid = await updateAdminBuildStatus('access-1', REQUEST_ID, 'android', 'ready');
  assert.equal(invalid.kind, 'invalid');
  if (invalid.kind === 'invalid') assert.match(invalid.message, /android.status must be one of/);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/admin/build-requests') && call.method === 'GET'
        ? json(200, {
            success: true,
            data: {
              requests: [
                {
                  ...queued,
                  store: {
                    id: '66f1c2e0a1b2c3d4e5f60710',
                    name: 'Northwind',
                    domain: 'northwind.myshopify.com',
                    appName: '  Harbor & Co  ',
                  },
                },
              ],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            },
          })
        : null,
  ];
  const named = await listAdminBuildRequests('access-1', { filter: 'all' });
  assert.equal(named.kind, 'ok');
  if (named.kind === 'ok') {
    assert.equal(named.page.requests[0]?.appName, 'Harbor & Co');
    assert.equal(named.page.requests[0]?.storeId, '66f1c2e0a1b2c3d4e5f60710');
    assert.equal(named.page.requests[0]?.storeName, 'Northwind');
    assert.equal(named.page.requests[0]?.storeDomain, 'northwind.myshopify.com');
    assert.notEqual(named.page.requests[0]?.storeId, REQUEST_ID);
    assert.equal(JSON.stringify(named.page).includes('Cartaisy'), false);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/admin/build-requests') && call.method === 'GET'
        ? json(200, {
            success: true,
            data: {
              requests: [
                {
                  ...queued,
                  store: {
                    name: 'Northwind',
                    domain: 'northwind.myshopify.com',
                    appName: '   ',
                  },
                },
              ],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            },
          })
        : null,
  ];
  const blankName = await listAdminBuildRequests('access-1', { filter: 'all' });
  assert.equal(blankName.kind, 'ok');
  if (blankName.kind === 'ok') {
    assert.equal(blankName.page.requests[0]?.appName, null);
    assert.equal(blankName.page.requests[0]?.storeId, null);
    assert.equal(blankName.page.requests[0]?.storeName, 'Northwind');
    assert.equal(JSON.stringify(blankName.page).includes('66f1c2e0a1b2c3d4e5f60710'), false);
    assert.notEqual(blankName.page.requests[0]?.storeId, REQUEST_ID);
    assert.equal(JSON.stringify(blankName.page).includes('Cartaisy'), false);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/admin/build-requests') && call.method === 'GET'
        ? json(200, {
            success: true,
            data: {
              requests: [
                {
                  ...queued,
                  store: {
                    id: '  66F1C2E0A1B2C3D4E5F60710  ',
                    name: 'Northwind',
                    domain: 'northwind.myshopify.com',
                  },
                },
              ],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            },
          })
        : null,
  ];
  const exactId = await listAdminBuildRequests('access-1', { filter: 'all' });
  assert.equal(exactId.kind, 'ok');
  if (exactId.kind === 'ok') {
    assert.equal(exactId.page.requests[0]?.storeId, '66F1C2E0A1B2C3D4E5F60710');
    assert.notEqual(exactId.page.requests[0]?.storeId, REQUEST_ID);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/admin/build-requests') && call.method === 'GET'
        ? json(200, {
            success: true,
            data: {
              requests: [
                {
                  ...queued,
                  store: {
                    id: 'northwind.myshopify.com',
                    name: 'Northwind',
                    domain: 'northwind.myshopify.com',
                    appName: 'Harbor',
                  },
                },
              ],
              pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            },
          })
        : null,
  ];
  const invalidId = await listAdminBuildRequests('access-1', { filter: 'all' });
  assert.equal(invalidId.kind, 'ok');
  if (invalidId.kind === 'ok') {
    assert.equal(invalidId.page.requests[0]?.storeId, null);
    assert.equal(invalidId.page.requests[0]?.appName, 'Harbor');
    assert.equal(invalidId.page.requests[0]?.storeDomain, 'northwind.myshopify.com');
    assert.equal(invalidId.page.requests[0]?.id, REQUEST_ID);
    assert.notEqual(invalidId.page.requests[0]?.storeId, REQUEST_ID);
    assert.equal(JSON.stringify(invalidId.page.requests[0]?.storeId), 'null');
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  const INSTALL_URL = 'https://u.expo.dev/artifact/android';
  routes = [
    (call) => {
      if (call.method !== 'PATCH' || !path(call.url).endsWith(`/admin/build-requests/${REQUEST_ID}/status`)) {
        return null;
      }
      assert.equal(call.body, JSON.stringify({ android: { status: 'ready', installUrl: INSTALL_URL } }));
      return json(200, {
        success: true,
        data: {
          ...queued,
          store: undefined,
          platforms: {
            android: { status: 'ready', updatedAt: '2026-09-23T22:00:00.000Z', installUrl: INSTALL_URL },
            ios: queued.platforms.ios,
          },
        },
      });
    },
  ];
  const linked = await updateAdminBuildStatus('access-1', REQUEST_ID, 'android', 'ready', `  ${INSTALL_URL}  `);
  assert.equal(linked.kind, 'ok');
  if (linked.kind === 'ok') {
    assert.equal(linked.snapshot.platforms.android.installUrl, INSTALL_URL);
    assert.equal(linked.snapshot.platforms.ios.installUrl, null);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) => {
      if (call.method !== 'PATCH') return null;
      assert.equal(call.body, JSON.stringify({ ios: { status: 'ready', installUrl: null } }));
      return json(200, {
        success: true,
        data: {
          ...queued,
          store: undefined,
          platforms: {
            android: queued.platforms.android,
            ios: { status: 'ready', updatedAt: '2026-09-23T22:00:00.000Z', installUrl: null },
          },
        },
      });
    },
  ];
  const cleared = await updateAdminBuildStatus('access-1', REQUEST_ID, 'ios', 'ready', null);
  assert.equal(cleared.kind, 'ok');
  if (cleared.kind === 'ok') assert.equal(cleared.snapshot.platforms.ios.installUrl, null);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [() => json(500, { error: 'should not be called' })];
  const rejected = await updateAdminBuildStatus('access-1', REQUEST_ID, 'android', 'ready', 'https://cdn.example/app.apk');
  assert.equal(rejected.kind, 'invalid');
  if (rejected.kind === 'invalid') assert.match(rejected.message, /expo\.dev or expo\.io/);
  assert.equal(calls.length, 0);
  const secretLink = await updateAdminBuildStatus(
    'access-1',
    REQUEST_ID,
    'android',
    'ready',
    'https://expo.dev/builds/shpat_secret'
  );
  assert.equal(secretLink.kind, 'invalid');
  assert.equal(calls.length, 0);
  assert.equal(JSON.stringify(secretLink).includes('shpat_'), false);

  console.log('admin build client ok');
}

void main();
