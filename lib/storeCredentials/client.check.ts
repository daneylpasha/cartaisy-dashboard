import assert from 'node:assert/strict';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import {
  connectAppleCredentials,
  connectGoogleCredentials,
  disconnectAppleCredentials,
  fetchStoreCredentials,
} from '@/lib/storeCredentials/client';
import {
  APPLE_INVALID_MESSAGE,
  CREDENTIAL_SAVE_FAILED_MESSAGE,
  CREDENTIAL_SIGN_IN_MESSAGE,
} from '@/lib/storeCredentials/contract';

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
  contentType: string | null;
  storeId: string | null;
  body: BodyInit | null | undefined;
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
      contentType: headers.get('content-type'),
      storeId: headers.get('x-store-id'),
      body: init?.body,
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

const pem = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';

function statusBody() {
  return {
    success: true,
    data: {
      apple: { status: 'connected', keyIdLast4: '34EF', issuerIdLast4: '072a', updatedAt: '2026-09-28T18:00:00.000Z' },
      google: {
        status: 'connected',
        clientEmail: 'play-submit@example-store.iam.gserviceaccount.com',
        privateKeyIdLast4: 'abcd',
        updatedAt: '2026-09-28T18:00:00.000Z',
      },
    },
  };
}

function appleFile(): File {
  return new File([pem], 'AuthKey_AB12CD34EF.p8', { type: 'application/octet-stream' });
}

function googleFile(): File {
  return new File(['{"type":"service_account"}'], 'play.json', { type: 'application/json' });
}

function formOf(call: Call | undefined): FormData {
  assert.ok(call?.body instanceof FormData);
  return call.body;
}

async function main() {
  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) => (path(call.url).endsWith('/store-credentials') && call.method === 'GET' ? json(200, statusBody()) : null),
  ];
  const listed = await fetchStoreCredentials('access-1');
  assert.equal(listed.ok, true);
  if (listed.ok) {
    assert.equal(listed.credentials.apple.keyIdLast4, '34EF');
    assert.equal(JSON.stringify(listed.credentials).includes('PRIVATE KEY'), false);
  }
  assert.equal(calls[0]?.authorization, bearer('access-1'));
  assert.equal(calls[0]?.storeId, null);
  assert.equal(calls.some((call) => call.url.includes('storeId=')), false);

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  let attempts = 0;
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token') && call.method === 'POST') return refreshedSession();
      if (path(call.url).endsWith('/store-credentials') && call.method === 'GET') {
        attempts += 1;
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        if (call.authorization === bearer('fresh-access')) return json(200, statusBody());
      }
      return null;
    },
  ];
  const refreshed = await fetchStoreCredentials('stale-access');
  assert.equal(refreshed.ok, true);
  assert.equal(attempts, 2);
  assert.equal(tokenStorage.getToken(), 'fresh-access');

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-dead');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return json(401, { error: 'expired' });
      if (path(call.url).endsWith('/store-credentials')) return json(401, { error: pem });
      return null;
    },
  ];
  const signedOut = await fetchStoreCredentials('stale-access');
  assert.equal(signedOut.ok, false);
  if (!signedOut.ok) {
    assert.equal(signedOut.message, CREDENTIAL_SIGN_IN_MESSAGE);
    assert.equal(signedOut.message.includes('PRIVATE KEY'), false);
  }

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  const invalid = await connectAppleCredentials('access-1', {
    keyId: 'nope',
    issuerId: 'nope',
    privateKey: appleFile(),
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.message, APPLE_INVALID_MESSAGE);
  assert.equal(calls.length, 0);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/store-credentials/apple') && call.method === 'POST'
        ? json(400, { success: false, error: `bad ${pem}`, code: 'STORE_CREDENTIALS_INVALID' })
        : null,
  ];
  const leaked = await connectAppleCredentials('access-1', {
    keyId: 'AB12CD34EF',
    issuerId: '12345678-1234-1234-1234-12345678072a',
    privateKey: appleFile(),
  });
  assert.equal(leaked.ok, false);
  if (!leaked.ok) {
    assert.equal(leaked.message, APPLE_INVALID_MESSAGE);
    assert.equal(leaked.message.includes('BEGIN'), false);
  }
  const posted = formOf(calls[0]);
  assert.equal(posted.get('keyId'), 'AB12CD34EF');
  assert.equal(posted.get('issuerId'), '12345678-1234-1234-1234-12345678072a');
  const uploaded = posted.get('privateKey');
  assert.ok(uploaded instanceof File);
  assert.equal(calls[0]?.contentType, null);
  assert.equal(calls[0]?.method, 'POST');
  assert.equal(path(calls[0]?.url ?? '').endsWith('/store-credentials/apple'), true);

  reset();
  tokenStorage.setTokens('stale-access', 'refresh-1');
  routes = [
    (call) => {
      if (path(call.url).endsWith('/auth/refresh-token')) return refreshedSession();
      if (path(call.url).endsWith('/store-credentials/google') && call.method === 'POST') {
        if (call.authorization === bearer('stale-access')) return json(401, { error: 'Unauthorized' });
        const form = formOf(call);
        assert.ok(form.get('serviceAccount') instanceof File);
        return json(200, statusBody());
      }
      return null;
    },
  ];
  const google = await connectGoogleCredentials('stale-access', { serviceAccount: googleFile() });
  assert.equal(google.ok, true);
  if (google.ok) {
    assert.equal(google.credentials.google.clientEmail, 'play-submit@example-store.iam.gserviceaccount.com');
    assert.equal(JSON.stringify(google.credentials).includes(pem), false);
  }
  assert.equal(calls.filter((call) => call.method === 'POST' && path(call.url).endsWith('/store-credentials/google')).length, 2);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [
    (call) =>
      path(call.url).endsWith('/store-credentials/apple') && call.method === 'DELETE'
        ? json(200, {
            success: true,
            data: { apple: { status: 'missing' }, google: { status: 'connected', clientEmail: 'play@example.com' } },
          })
        : null,
  ];
  const removed = await disconnectAppleCredentials('access-1');
  assert.equal(removed.ok, true);
  if (removed.ok) assert.equal(removed.credentials.apple.status, 'missing');
  assert.equal(calls[0]?.contentType, null);

  reset();
  tokenStorage.setTokens('access-1', 'refresh-1');
  routes = [(call) => (call.method === 'POST' ? json(500, { error: pem }) : null)];
  const failed = await connectGoogleCredentials('access-1', { serviceAccount: googleFile() });
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.message, CREDENTIAL_SAVE_FAILED_MESSAGE);
    assert.equal(failed.message.includes('PRIVATE'), false);
  }

  console.log('store credentials client ok');
}

void main();
