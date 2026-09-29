import { API_URL } from '@/lib/api/mutator/custom-instance';
import {
  EMPTY_CATALOG,
  PREVIEW_PRODUCT_LIMIT,
  normalizeCatalog,
  normalizeCollectionNames,
  normalizeConnectionStatus,
  normalizePreviewProducts,
  normalizeSyncStatus,
  readAuthorizationUrl,
} from '@/lib/onboarding/normalizers';
import type { ShopifySnapshot } from '@/lib/onboarding/types';
import { catalogBlockFromPayload, withCatalogBlock } from '@/lib/shopify/catalogBlock';
import { merchantMessageForShopifyAction } from '@/lib/shopify/merchantCopy';

/**
 * Backend-only Shopify connect for the onboarding wizard.
 *
 * This module must not call dashboard `/api/shopify/*` routes and must not
 * write `shopify.accessToken`. Live redirect is on. The merged backend
 * (cartaisy-backend #157) ignores a client `returnTo` and sends the browser
 * to `SHOPIFY_OAUTH_RETURN_URL` with `shopify=connected` or `shopify=error`.
 *
 * Expected backend contract:
 * - POST /shopify/oauth/connect { shop } -> { data: { authorizationUrl } }
 * - GET  /shopify/status -> connection facts, no access token
 * - GET  /shopify/sync -> durable catalog sync (`idle|syncing|succeeded|failed`) and `eligibleForBuild`
 * - GET  /shopify/overview -> product and order counts, and a product list when present
 * - GET  /shopify/collections -> collection names, read-only
 * - GET  /products?limit=4&sortBy=newest -> preview tiles after sync succeeds,
 *   scoped with the session store id (`X-Store-ID`). The merchant access token
 *   carries a user id, not a store id. No Shopify Admin token is sent.
 */
export const shopifyConnectContract: {
  readonly liveRedirectEnabled: boolean;
} = {
  liveRedirectEnabled: true,
};

const ENDPOINTS = {
  start: '/shopify/oauth/connect',
  status: '/shopify/status',
  syncStatus: '/shopify/sync',
  overview: '/shopify/overview',
  collections: '/shopify/collections',
  products: '/products',
} as const;

function storeHeader(storeId?: string | null): HeadersInit {
  if (!storeId || !/^[0-9a-fA-F]{24}$/.test(storeId)) return {};
  return { 'X-Store-ID': storeId };
}

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function getBackend(
  path: string,
  token: string,
  storeId?: string | null
): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: { ...authHeaders(token), ...storeHeader(storeId) },
    });
    const body = await readJson(response);
    return { ok: response.ok, status: response.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

export async function loadShopifySnapshot(token: string, storeId?: string | null): Promise<ShopifySnapshot> {
  const [status, sync] = await Promise.all([
    getBackend(ENDPOINTS.status, token),
    getBackend(ENDPOINTS.syncStatus, token),
  ]);

  const connection = normalizeConnectionStatus(status.body, status.ok);
  const syncGate = normalizeSyncStatus(sync.body, sync.ok, sync.status);

  const overview = await getBackend(ENDPOINTS.overview, token);
  const counts = normalizeCatalog(overview.body, overview.ok);
  const overviewBlock = catalogBlockFromPayload(overview.body, overview.ok, overview.status);
  const overviewProducts =
    syncGate.state === 'succeeded' ? normalizePreviewProducts(overview.body, overview.ok) : [];

  const [collectionsResponse, products] = await Promise.all([
    connection.isConnected
      ? getBackend(ENDPOINTS.collections, token)
      : Promise.resolve(null),
    syncGate.state === 'succeeded' && overviewProducts.length === 0
      ? getBackend(
          `${ENDPOINTS.products}?limit=${PREVIEW_PRODUCT_LIMIT}&sortBy=newest`,
          token,
          storeId
        ).then((response) => normalizePreviewProducts(response.body, response.ok))
      : Promise.resolve(overviewProducts),
  ]);

  const collections = collectionsResponse
    ? normalizeCollectionNames(collectionsResponse.body, collectionsResponse.ok)
    : [];
  const collectionsBlock = collectionsResponse
    ? catalogBlockFromPayload(collectionsResponse.body, collectionsResponse.ok, collectionsResponse.status)
    : null;
  const syncWithBlock = withCatalogBlock(withCatalogBlock(syncGate, overviewBlock), collectionsBlock);

  return {
    connection,
    sync: syncWithBlock,
    catalog: {
      ...EMPTY_CATALOG,
      ...counts,
      collections: syncWithBlock.block ? [] : collections,
      products: syncWithBlock.block || syncWithBlock.state !== 'succeeded' ? [] : products,
    },
  };
}

export interface StartShopifyConnectResult {
  authorizationUrl: string | null;
  error: string | null;
}

/**
 * Starts backend OAuth. Does not persist a token in dashboard Mongo.
 * `returnTo` is accepted so the wizard call site stays stable. The merged
 * backend does not use it; set `SHOPIFY_OAUTH_RETURN_URL` to the onboarding step.
 */
export async function startShopifyConnect(
  token: string,
  shopDomain: string,
  returnTo: string
): Promise<StartShopifyConnectResult> {
  try {
    const response = await fetch(`${API_URL}${ENDPOINTS.start}`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ shop: shopDomain, returnTo }),
    });
    const body = await readJson(response);
    if (!response.ok) {
      const record = body && typeof body === 'object' ? (body as { error?: unknown }) : null;
      const message = typeof record?.error === 'string' ? record.error : '';
      return {
        authorizationUrl: null,
        error: merchantMessageForShopifyAction('connect', response.status, message),
      };
    }

    const authorizationUrl = readAuthorizationUrl(body);
    if (!authorizationUrl) {
      return {
        authorizationUrl: null,
        error: 'Shopify could not be opened. Try again.',
      };
    }
    return { authorizationUrl, error: null };
  } catch {
    return {
      authorizationUrl: null,
      error: 'We could not reach Shopify setup. You can continue and confirm your brand.',
    };
  }
}

export function onboardingReturnPath(): string {
  if (typeof window === 'undefined') return '/dashboard/onboarding?step=connect';
  return `${window.location.origin}/dashboard/onboarding?step=connect`;
}
