import { API_URL, customInstance, tokenStorage } from '@/lib/api/mutator/custom-instance';
import { SHOPIFY_CLAIM_FRAGMENT_BOOT } from '@/lib/shopify/claimFragmentBoot';
import { consumeShopifyReturnQuery } from '@/lib/onboarding/normalizers';
import {
  merchantMessageForShopifyAction,
  networkMessage,
  shopifyClaimRetryCopy,
  shopifyReturnCopy,
  type ShopifyReturnCopy,
} from '@/lib/shopify/merchantCopy';

/**
 * App Store install claim.
 *
 * The backend redirects to SHOPIFY_OAUTH_RETURN_URL with
 * `shopify=connected&shop=…&claim=pending` and a one-time `#claim_token=`
 * fragment. This module reads that fragment, posts it once to
 * `POST /api/v1/shopify/oauth/claim`, and drops it from the URL.
 *
 * `claimToken` is not a Shopify Admin token, but it is a bearer for one.
 * Never log it, never copy it into the query string, and never send it to
 * analytics. Dashboard Connect (`POST /shopify/oauth/connect`) is unchanged.
 */

const CLAIM_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export const SHOPIFY_CLAIMED_EVENT = 'cartaisy:shopify-claimed';

export { SHOPIFY_CLAIM_FRAGMENT_BOOT };

declare global {
  interface Window {
    __cartaisyShopifyClaim?: string;
  }
}

export interface ShopifyClaimOutcome {
  connected: boolean;
  notice: ShopifyReturnCopy;
}

export function readClaimTokenFromHash(hash: string): string | null {
  if (!hash || hash.includes('?')) return null;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw || !raw.includes('claim_token')) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }
  const value = params.get('claim_token');
  if (!value || !CLAIM_TOKEN_PATTERN.test(value)) return null;
  return value;
}

/** Fragment with `claim_token` removed. Other hash params stay. Empty when nothing remains. */
export function hashWithoutClaimToken(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw || !raw.includes('claim_token')) {
    return hash.startsWith('#') || hash === '' ? hash : `#${hash}`;
  }
  const params = new URLSearchParams(raw);
  params.delete('claim_token');
  const next = params.toString();
  return next ? `#${next}` : '';
}

export function stripClaimTokenFromBrowserUrl(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash || '';
  const params = new URLSearchParams(window.location.search.replace(/^\?/, ''));
  const hadQueryToken = params.has('claim_token');
  if (!hash.includes('claim_token') && !hadQueryToken) return;
  params.delete('claim_token');
  const nextHash = hashWithoutClaimToken(hash);
  if (nextHash.includes('claim_token')) return;
  const search = params.toString();
  const path = `${window.location.pathname}${search ? `?${search}` : ''}${nextHash}`;
  window.history.replaceState(window.history.state, '', path);
}

/**
 * Read the one-time nonce from the boot stash or the fragment, then drop it
 * from the address bar. Returns null when the fragment has no valid token.
 */
export function takeBrowserClaimToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stashed = window.__cartaisyShopifyClaim;
  delete window.__cartaisyShopifyClaim;
  const fromHash = readClaimTokenFromHash(window.location.hash);
  stripClaimTokenFromBrowserUrl();
  if (typeof stashed === 'string' && CLAIM_TOKEN_PATTERN.test(stashed)) return stashed;
  return fromHash;
}

function errorText(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const record = body as { error?: unknown; message?: unknown };
  if (typeof record.error === 'string') return record.error;
  if (typeof record.message === 'string') return record.message;
  return '';
}

function withoutClaimSecret(text: string, claimToken: string | null): string {
  if (!text) return '';
  if (claimToken && text.includes(claimToken)) return '';
  if (/claim_token/i.test(text)) return '';
  return text;
}

export function noticeForClaimFailure(status: number, backendError: string): ShopifyReturnCopy {
  const text = backendError.toLowerCase();
  if (
    status === 404 ||
    text.includes('no pending') ||
    text.includes('claim token') ||
    text.includes('pending install')
  ) {
    return shopifyClaimRetryCopy;
  }
  return {
    tone: 'error',
    title: "Couldn't connect",
    body: merchantMessageForShopifyAction('connect', status, backendError),
  };
}

export async function performShopifyClaim(
  shop: string | null,
  claimToken: string | null
): Promise<ShopifyClaimOutcome> {
  if (!shop || !claimToken || !CLAIM_TOKEN_PATTERN.test(claimToken)) {
    return { connected: false, notice: shopifyClaimRetryCopy };
  }

  const sessionToken = tokenStorage.getToken();
  if (!sessionToken) {
    return {
      connected: false,
      notice: {
        tone: 'error',
        title: "Couldn't connect",
        body: merchantMessageForShopifyAction('connect', 401, ''),
      },
    };
  }

  try {
    const result = await customInstance<{ data: unknown; status: number }>(
      `${API_URL}/shopify/oauth/claim`,
      {
        method: 'POST',
        token: sessionToken,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop, claimToken }),
      }
    );
    const body = result.data;
    const record =
      body && typeof body === 'object' ? (body as { success?: unknown }) : null;
    const safeError = withoutClaimSecret(errorText(body), claimToken);
    if (result.status >= 200 && result.status < 300 && record?.success !== false) {
      const notice = shopifyReturnCopy('connected', null);
      return {
        connected: true,
        notice: notice ?? {
          tone: 'success',
          title: 'Store connected',
          body: 'Your Shopify store is connected.',
        },
      };
    }
    return { connected: false, notice: noticeForClaimFailure(result.status, safeError) };
  } catch {
    return {
      connected: false,
      notice: {
        tone: 'error',
        title: "Couldn't connect",
        body: networkMessage(),
      },
    };
  }
}

let flight: Promise<ShopifyClaimOutcome> | null = null;

/** One claim per page load. A second caller awaits the same request. */
export function ensurePendingShopifyClaim(shop: string | null): Promise<ShopifyClaimOutcome> {
  if (!flight) {
    const claimToken = takeBrowserClaimToken();
    flight = performShopifyClaim(shop, claimToken);
  }
  return flight;
}

/** Test-only reset. Production has one claim per full page load. */
export function resetPendingShopifyClaimForTests(): void {
  flight = null;
}

export function returnPathAfterClaim(
  pathname: string,
  search: string
): string {
  const onboarding =
    pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/onboarding/');
  const consumed = consumeShopifyReturnQuery(search, {
    fallbackStep: onboarding ? 'connect' : null,
  });
  return consumed.query ? `${pathname}?${consumed.query}` : pathname;
}
