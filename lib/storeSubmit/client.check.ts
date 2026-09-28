import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { getStoreSubmit, listStoreSubmits, startStoreSubmit } from '@/lib/storeSubmit/client';
import { SUBMIT_SIGN_IN_MESSAGE, SUBMIT_START_FAILED_MESSAGE } from '@/lib/storeSubmit/contract';

const here = dirname(fileURLToPath(import.meta.url));
const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const JOB_ID = '66f1c2e0a1b2c3d4e5f60720';
const PEM = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';

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

function bearer(token: string): string {
  return `Bearer ${token}`;
}

function refreshedSession() {
  return json(200, { data: { token: 'fresh-access', refreshToken: 'refresh-2', user: { id: 'user-1' } } });
}

function submitBody(status: string) {
  return {
    success: true,
    data: {
      id: JOB_ID,
      buildRequestId: REQUEST_ID,
      platform: 'ios',
      status,
      createdAt: '2026-09-28T20:00:00.000Z',
      updatedAt: '2026-09-28T20:00:00.000Z',
      easBuildId: 'hidden-build',
      privateKey: PEM,
    },
  };
}

async function main() {
  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith(`/build-requests/${REQUEST_ID}/submits`) && call.method === 'GET'
        ? json(200, { success: true, data: { submits: [submitBody('submitted').data] } })
        : null,
  ];
  const listed = await listStoreSubmits('access-1', REQUEST_ID);
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(listed.jobs.ios?.status, 'submitted');
    assert.equal(listed.jobs.android, null);
    assert.equal(JSON.stringify(listed.jobs).includes('BEGIN'), false);
    assert.equal(JSON.stringify(listed.jobs).includes('hidden-build'), false);
  }
  assert.equal(calls[0]?.authorization, bearer('access-1'));
  assert.equal(calls[0]?.url.includes('storeId'), false);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) => {
      assert.equal(call.method, 'POST');
      assert.equal(call.body, JSON.stringify({ platform: 'android' }));
      assert.equal(call.body.includes('storeId'), false);
      assert.equal(call.url.includes('storeId'), false);
      return json(201, {
        success: true,
        data: { ...submitBody('submitting').data, platform: 'android' },
      });
    },
  ];
  const started = await startStoreSubmit('access-1', REQUEST_ID, 'android');
  assert.equal(started.ok, true);
  if (started.ok) {
    assert.equal(started.job.platform, 'android');
    assert.equal(started.job.status, 'submitting');
    assert.equal(JSON.stringify(started.job).includes('BEGIN'), false);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    () =>
      json(409, {
        success: false,
        error: 'A submit is already in progress for this platform.',
        code: 'SUBMIT_ALREADY_IN_PROGRESS',
        data: { ...submitBody('queued').data, platform: 'ios' },
      }),
  ];
  const racing = await startStoreSubmit('access-1', REQUEST_ID, 'ios');
  assert.equal(racing.ok, true);
  if (racing.ok) assert.equal(racing.job.status, 'queued');

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    () =>
      json(409, {
        success: false,
        error: PEM,
        code: 'SUBMIT_CREDENTIALS_MISSING',
      }),
  ];
  const leaked = await startStoreSubmit('access-1', REQUEST_ID, 'ios');
  assert.equal(leaked.ok, false);
  if (!leaked.ok) {
    assert.equal(leaked.message, SUBMIT_START_FAILED_MESSAGE);
    assert.equal(leaked.message.includes('BEGIN'), false);
  }

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  let attempts = 0;
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token') && call.method === 'POST') {
        assert.equal(JSON.parse(call.body).refreshToken, 'refresh-1');
        return refreshedSession();
      }
      if (path(call.url).endsWith(`/build-requests/${REQUEST_ID}/submits/ios`) && call.method === 'GET') {
        attempts += 1;
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        return json(200, submitBody('submitted'));
      }
      return null;
    },
  ];
  const refreshed = await getStoreSubmit('stale-access', REQUEST_ID, 'ios');
  assert.equal(refreshed.ok, true);
  assert.equal(attempts, 2);
  assert.equal(tokenStorage.getToken(), 'fresh-access');
  if (refreshed.ok) assert.equal(refreshed.job.status, 'submitted');

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-dead');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return json(401, { error: 'expired' });
      if (path(call.url).includes('/submits')) return json(401, { error: PEM });
      return null;
    },
  ];
  const signedOut = await listStoreSubmits('stale-access', REQUEST_ID);
  assert.equal(signedOut.ok, false);
  if (!signedOut.ok) {
    assert.equal(signedOut.message, SUBMIT_SIGN_IN_MESSAGE);
    assert.equal(signedOut.message.includes('BEGIN'), false);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [() => json(404, { success: false, error: 'Store submit not found' })];
  const missing = await getStoreSubmit('access-1', REQUEST_ID, 'android');
  assert.deepEqual(missing, { ok: false, missing: true });

  const source = readFileSync(join(here, 'client.ts'), 'utf8');
  const hookSource = readFileSync(join(here, 'useStoreSubmits.ts'), 'utf8');
  assert.match(source, /JSON\.stringify\(\{ platform \}\)/);
  assert.doesNotMatch(source, /storeId|privateKey|serviceAccount|EXPO_TOKEN|console\.(log|debug|info|error|warn)/);
  assert.doesNotMatch(hookSource, /console\.(log|debug|info|error|warn)/);
  assert.match(hookSource, /visibilitychange/);

  console.log('store submit client ok');
}

void main();
