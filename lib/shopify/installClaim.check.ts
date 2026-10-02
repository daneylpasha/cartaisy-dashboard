import assert from 'node:assert/strict';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { SHOPIFY_CLAIM_FRAGMENT_BOOT } from '@/lib/shopify/claimFragmentBoot';
import {
  ensurePendingShopifyClaim,
  hashWithoutClaimToken,
  noticeForClaimFailure,
  performShopifyClaim,
  readClaimTokenFromHash,
  resetPendingShopifyClaimForTests,
  returnPathAfterClaim,
  takeBrowserClaimToken,
} from '@/lib/shopify/installClaim';
import { shopifyClaimRetryCopy } from '@/lib/shopify/merchantCopy';

const TOKEN = 'ab'.repeat(32);
const OTHER = 'cd'.repeat(32);
const SHOP = 'northline.myshopify.com';

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

const locationState = {
  pathname: '/dashboard/onboarding',
  search: '',
  hash: '',
};

const location = {
  get pathname() {
    return locationState.pathname;
  },
  get search() {
    return locationState.search;
  },
  get hash() {
    return locationState.hash;
  },
  href: 'http://localhost/dashboard/onboarding',
};

const history = {
  state: { idx: 1 },
  replaceState(_state: unknown, _title: string, url: string) {
    const hashAt = url.indexOf('#');
    locationState.hash = hashAt === -1 ? '' : url.slice(hashAt);
    assert.equal(url.includes(TOKEN), false);
    assert.equal(url.includes(OTHER), false);
  },
};

Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'document', { value: { cookie: '' }, configurable: true });
Object.defineProperty(globalThis, 'window', {
  value: location ? { location, history } : {},
  configurable: true,
});
Object.assign(window, { location, history });

interface Call {
  url: string;
  method: string;
  authorization: string;
  storeId: string;
  body: string;
}

const calls: Call[] = [];

function installFetch(handler: (call: Call) => Response) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    const call: Call = {
      url,
      method: init?.method ?? 'GET',
      authorization: headers.get('authorization') ?? '',
      storeId: headers.get('x-store-id') ?? '',
      body: typeof init?.body === 'string' ? init.body : '',
    };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function reset() {
  calls.length = 0;
  memory.clear();
  document.cookie = '';
  locationState.pathname = '/dashboard/onboarding';
  locationState.search = '';
  locationState.hash = '';
  delete window.__cartaisyShopifyClaim;
  resetPendingShopifyClaimForTests();
  tokenStorage.setTokens('session-jwt', 'refresh-jwt');
}

assert.equal(readClaimTokenFromHash(`#claim_token=${TOKEN}`), TOKEN);
assert.equal(readClaimTokenFromHash(`#keep=1&claim_token=${TOKEN}`), TOKEN);
assert.equal(readClaimTokenFromHash(`?claim_token=${TOKEN}`), null);
assert.equal(readClaimTokenFromHash('#claim_token=short'), null);
assert.equal(readClaimTokenFromHash(''), null);

const stripped = hashWithoutClaimToken(`#keep=1&claim_token=${TOKEN}`);
assert.equal(stripped.includes(TOKEN), false);
assert.equal(stripped.includes('claim_token'), false);
assert.match(stripped, /keep=1/);
assert.equal(hashWithoutClaimToken(`#claim_token=${TOKEN}`), '');

assert.equal(SHOPIFY_CLAIM_FRAGMENT_BOOT.includes(TOKEN), false);
assert.equal(SHOPIFY_CLAIM_FRAGMENT_BOOT.includes('localStorage'), false);
assert.equal(SHOPIFY_CLAIM_FRAGMENT_BOOT.includes('gtag'), false);

function runBoot(search: string, hash: string) {
  const state = { pathname: '/dashboard/onboarding', search, hash };
  let written = '';
  const fakeWindow: Window & { __cartaisyShopifyClaim?: string } = {
    location: {
      get pathname() {
        return state.pathname;
      },
      get search() {
        return state.search;
      },
      get hash() {
        return state.hash;
      },
    },
    history: {
      state: { idx: 0 },
      replaceState(_next: unknown, _title: string, url?: string | URL | null) {
        written = String(url ?? '');
        const hashAt = written.indexOf('#');
        state.hash = hashAt === -1 ? '' : written.slice(hashAt);
      },
    },
  } as unknown as Window & { __cartaisyShopifyClaim?: string };
  const run = new Function('window', SHOPIFY_CLAIM_FRAGMENT_BOOT) as (target: Window) => void;
  run(fakeWindow);
  return { written, stashed: fakeWindow.__cartaisyShopifyClaim, hash: state.hash };
}

const booted = runBoot(
  `?step=connect&shopify=connected&shop=${SHOP}&claim=pending`,
  `#claim_token=${TOKEN}`
);
assert.equal(booted.stashed, TOKEN);
assert.equal(booted.hash, '');
assert.equal(booted.written.includes(TOKEN), false);
assert.equal(booted.written.includes('claim_token'), false);
assert.match(booted.written, /claim=pending/);

const ignored = runBoot(`?step=connect&shopify=connected&shop=${SHOP}`, `#claim_token=${TOKEN}`);
assert.equal(ignored.stashed, undefined);
assert.equal(ignored.hash, '');
assert.equal(ignored.written.includes(TOKEN), false);

const kept = runBoot(
  `?step=connect&shopify=connected&shop=${SHOP}&claim=pending`,
  `#section=1&claim_token=${TOKEN}`
);
assert.equal(kept.stashed, TOKEN);
assert.equal(kept.hash.includes(TOKEN), false);
assert.match(kept.hash, /section=1/);

reset();
locationState.hash = `#claim_token=${TOKEN}`;
locationState.search = `?claim_token=${OTHER}&claim=pending`;
assert.equal(takeBrowserClaimToken(), TOKEN);
assert.equal(locationState.hash.includes('claim_token'), false);
assert.equal(window.__cartaisyShopifyClaim, undefined);
assert.equal(takeBrowserClaimToken(), null);

reset();
window.__cartaisyShopifyClaim = TOKEN;
locationState.hash = '';
assert.equal(takeBrowserClaimToken(), TOKEN);
assert.equal(window.__cartaisyShopifyClaim, undefined);

assert.equal(
  returnPathAfterClaim(
    '/dashboard/onboarding',
    `step=connect&shopify=connected&shop=${SHOP}&claim=pending`
  ),
  '/dashboard/onboarding?step=connect'
);
assert.equal(
  returnPathAfterClaim('/dashboard/settings', `shopify=connected&shop=${SHOP}&claim=pending&claim_token=${TOKEN}`),
  '/dashboard/settings'
);
assert.equal(
  returnPathAfterClaim(
    '/dashboard/onboarding',
    `step=connect&shopify=connected&claim_token=${TOKEN}`
  ).includes(TOKEN),
  false
);

const retry = noticeForClaimFailure(404, 'No pending Shopify install to claim for this shop');
assert.equal(retry, shopifyClaimRetryCopy);
assert.equal(JSON.stringify(retry).includes(TOKEN), false);
assert.match(retry.body, /Shopify again/);
assert.match(retry.body, /reconnect/i);

async function main() {
reset();
let claimPosts = 0;
installFetch((call) => {
  if (call.url.includes('/shopify/oauth/claim') && call.method === 'POST') {
    claimPosts += 1;
    assert.equal(call.url.includes(TOKEN), false);
    assert.equal(call.storeId, '');
    assert.equal(call.authorization, 'Bearer session-jwt');
    assert.deepEqual(JSON.parse(call.body), { shop: SHOP, claimToken: TOKEN });
    return json(200, {
      success: true,
      data: { status: 'connected', shop: SHOP },
    });
  }
  throw new Error(`unexpected ${call.method} ${call.url}`);
});

const success = await performShopifyClaim(SHOP, TOKEN);
assert.equal(success.connected, true);
assert.equal(success.notice.tone, 'success');
assert.equal(success.notice.title, 'Store connected');
assert.equal(claimPosts, 1);
assert.equal(calls.some((call) => call.url.includes('/shopify/oauth/connect')), false);

reset();
claimPosts = 0;
locationState.hash = `#claim_token=${TOKEN}`;
const first = ensurePendingShopifyClaim(SHOP);
const second = ensurePendingShopifyClaim(SHOP);
const [one, two] = await Promise.all([first, second]);
assert.equal(one, two);
assert.equal(one.connected, true);
assert.equal(claimPosts, 1);
assert.equal(locationState.hash.includes(TOKEN), false);

reset();
installFetch(() => json(404, { success: false, error: `No pending Shopify install ${TOKEN}` }));
const expired = await performShopifyClaim(SHOP, TOKEN);
assert.equal(expired.connected, false);
assert.equal(expired.notice, shopifyClaimRetryCopy);
assert.equal(JSON.stringify(expired.notice).includes(TOKEN), false);

reset();
installFetch(() =>
  json(409, { success: false, error: 'This shop is already connected to another account' })
);
const taken = await performShopifyClaim(SHOP, TOKEN);
assert.equal(taken.connected, false);
assert.match(taken.notice.body, /another account/);
assert.equal(taken.notice.body.includes(TOKEN), false);

reset();
memory.clear();
installFetch(() => {
  throw new Error('claim should not post without a session');
});
const signedOut = await performShopifyClaim(SHOP, TOKEN);
assert.match(signedOut.notice.body, /Sign in again/);
assert.equal(calls.length, 0);

reset();
const missing = await performShopifyClaim(SHOP, null);
assert.equal(missing.notice, shopifyClaimRetryCopy);
assert.equal(calls.length, 0);

const shortToken = await performShopifyClaim(SHOP, 'not-a-nonce');
assert.equal(shortToken.notice, shopifyClaimRetryCopy);
assert.equal(calls.length, 0);

reset();
installFetch(() => {
  throw new Error('offline');
});
const offline = await performShopifyClaim(SHOP, TOKEN);
assert.match(offline.notice.body, /reach the server/);
assert.equal(offline.notice.body.includes(TOKEN), false);

console.log('shopify install claim ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
