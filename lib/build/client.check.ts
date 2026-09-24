import assert from 'node:assert/strict';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import {
  createBuildRequest,
  getBuildRequest,
  listBuildRequests,
  loadBuildScreen,
  updateAccessNotes,
} from '@/lib/build/client';

const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';

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

const location = { href: 'http://localhost/dashboard/onboarding?step=ready' };

Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'window', { value: { location }, configurable: true });
Object.defineProperty(globalThis, 'document', { value: { cookie: '' }, configurable: true });

interface Call {
  url: string;
  method: string;
  authorization: string;
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
  location.href = 'http://localhost/dashboard/onboarding?step=ready';
  document.cookie = '';
  installFetch();
}

const queued = {
  id: REQUEST_ID,
  platforms: {
    android: { status: 'queued' },
    ios: { status: 'not_requested' },
  },
  checklist: { accessNotes: null },
};

function listBody() {
  return { success: true, data: { requests: [queued] } };
}

function syncBody() {
  return { success: true, data: { status: 'succeeded', eligibleForBuild: true } };
}

function bearer(token: string): string {
  return `Bearer ${token}`;
}

function refreshedSession() {
  return json(200, { data: { token: 'fresh-access', refreshToken: 'refresh-2', user: { id: 'user-1' } } });
}

async function main() {
  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) => (path(call.url).endsWith('/build-requests') && call.method === 'GET' ? json(200, listBody()) : null),
  ];
  const listed = await listBuildRequests('access-1');
  assert.equal(listed.kind, 'ok');
  if (listed.kind === 'ok') assert.equal(listed.requests[0]?.id, REQUEST_ID);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.authorization, bearer('access-1'));
  assert.equal(
    calls.some((call) => call.url.includes('/auth/refresh-token')),
    false
  );

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  let buildAttempts = 0;
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token') && call.method === 'POST') {
        assert.equal(JSON.parse(call.body).refreshToken, 'refresh-1');
        return refreshedSession();
      }
      if (path(call.url).endsWith('/build-requests') && call.method === 'GET') {
        buildAttempts += 1;
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        if (call.authorization === bearer('fresh-access')) return json(200, listBody());
      }
      return null;
    },
  ];
  const refreshed = await listBuildRequests('stale-access');
  assert.equal(refreshed.kind, 'ok');
  assert.equal(buildAttempts, 2);
  assert.equal(tokenStorage.getToken(), 'fresh-access');
  assert.equal(location.href.includes('/login'), false);

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-dead');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return json(401, { error: 'expired' });
      if (path(call.url).endsWith('/build-requests') && call.method === 'GET') {
        return json(401, { error: 'Unauthorized' });
      }
      return null;
    },
  ];
  const signedOut = await listBuildRequests('stale-access');
  assert.equal(signedOut.kind, 'error');
  if (signedOut.kind === 'error') assert.match(signedOut.message, /Sign in again/);
  assert.equal(
    calls.filter((call) => path(call.url).endsWith('/build-requests')).length,
    1
  );
  assert.equal(location.href, '/login');
  assert.equal(tokenStorage.getToken(), null);

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return refreshedSession();
      if (path(call.url).endsWith(`/build-requests/${REQUEST_ID}`)) {
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        return json(200, { success: true, data: queued });
      }
      return null;
    },
  ];
  const read = await getBuildRequest('stale-access', REQUEST_ID);
  assert.equal(read.kind, 'ok');

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-dead');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return json(401, { error: 'expired' });
      if (path(call.url).includes('/build-requests/')) return json(401, { error: 'Unauthorized' });
      return null;
    },
  ];
  const unread = await getBuildRequest('stale-access', REQUEST_ID);
  assert.equal(unread.kind, 'error');
  if (unread.kind === 'error') assert.equal(unread.message, 'Sign in again to see your build.');

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/build-requests') && call.method === 'POST'
        ? json(409, { code: 'BUILD_NOT_ELIGIBLE', reason: 'shopify_not_connected' })
        : null,
  ];
  const blocked = await createBuildRequest('access-1', { android: true, ios: false });
  assert.deepEqual(blocked, { kind: 'ineligible', reason: 'shopify_not_connected' });
  assert.equal(
    calls.some((call) => call.url.includes('refresh-token')),
    false
  );

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return refreshedSession();
      if (call.method === 'POST' && path(call.url).endsWith('/build-requests')) {
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        return json(201, { success: true, data: queued });
      }
      return null;
    },
  ];
  const created = await createBuildRequest('stale-access', { android: true, ios: false });
  assert.equal(created.kind, 'created');

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return refreshedSession();
      if (call.method === 'PATCH') {
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        return json(200, {
          success: true,
          data: { ...queued, checklist: { accessNotes: 'Invite sent.' } },
        });
      }
      return null;
    },
  ];
  const notes = await updateAccessNotes('stale-access', REQUEST_ID, 'Invite sent.');
  assert.equal(notes.ok, true);
  if (notes.ok) assert.equal(notes.request.accessNotes, 'Invite sent.');

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  let snapshotToken: string | null = 'missing';
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return refreshedSession();
      if (path(call.url).endsWith('/shopify/sync')) {
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        return json(200, syncBody());
      }
      if (path(call.url).endsWith('/build-requests') && call.method === 'GET') {
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        return json(200, listBody());
      }
      return null;
    },
  ];
  const loaded = await loadBuildScreen('stale-access', {
    refreshConnection: () => {
      snapshotToken = tokenStorage.getToken();
    },
  });
  assert.equal(loaded.list.kind, 'ok');
  assert.equal(loaded.sync.eligibleForBuild, true);
  assert.equal(snapshotToken, 'fresh-access');

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/shopify/sync')) return json(200, syncBody());
      if (path(call.url).endsWith('/build-requests')) return json(200, listBody());
      return null;
    },
  ];
  let refreshes = 0;
  const withFailure = await loadBuildScreen('access-1', {
    refreshConnection: () => {
      refreshes += 1;
      throw new Error('status down');
    },
  });
  assert.equal(withFailure.list.kind, 'ok');
  assert.equal(refreshes, 1);
  const plain = await loadBuildScreen('access-1');
  assert.equal(refreshes, 1);
  assert.equal(plain.sync.eligibleForBuild, true);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [(call) => (path(call.url).includes('/build-requests/') ? json(404, { error: 'missing' }) : null)];
  const missing = await getBuildRequest('access-1', REQUEST_ID);
  assert.equal(missing.kind, 'missing');
  assert.equal(
    calls.some((call) => call.url.includes('refresh-token')),
    false
  );

  console.log('build client ok');
}

void main();
