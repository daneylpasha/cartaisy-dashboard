/**
 * Dashboard client for the backend-owned Shopify connection.
 *
 * Contract (cartaisy-backend #153 / PR #157):
 * - POST /api/v1/shopify/oauth/connect → { authorizationUrl }
 * - GET  /api/v1/shopify/status → connected | disconnected
 * - POST /api/v1/shopify/disconnect
 * - POST /api/v1/shopify/sync
 *
 * The access token stays on the backend. This module never reads or sends
 * `shopify.accessToken`, and it does not send a client store id.
 */

import { API_URL, tokenStorage } from '@/lib/api/mutator/custom-instance';
import { normalizeCatalog } from '@/lib/onboarding/normalizers';
import { catalogBlockFromPayload } from '@/lib/shopify/catalogBlock';
import type { ShopifyCatalogBlockKind } from '@/lib/onboarding/types';
import {
  isShopifyAuthorizeUrl,
  merchantMessageForShopifyAction,
  networkMessage,
  normalizeShopInput,
  signedOutMessage,
  type ShopifyAction,
} from '@/lib/shopify/merchantCopy';

export class ShopifyConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyConnectionError';
  }
}

export interface ShopifyConnectionStatus {
  status: 'connected' | 'disconnected';
  isConnected: boolean;
  shop: string | null;
  scope: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  webhookRegistrationError: string | null;
}

type BackendBody = {
  success?: boolean;
  error?: unknown;
  message?: unknown;
  data?: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
};

const asNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const backendErrorText = (body: BackendBody): string => {
  if (typeof body.error === 'string') {
    return body.error;
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  return '';
};

async function readBody(response: Response): Promise<BackendBody> {
  try {
    const json = (await response.json()) as unknown;
    const record = asRecord(json);
    if (!record) {
      return {};
    }
    return record as BackendBody;
  } catch {
    return {};
  }
}

async function backendRequest(
  action: ShopifyAction,
  path: string,
  init: RequestInit
): Promise<BackendBody> {
  const token = tokenStorage.getToken();
  if (!token) {
    throw new ShopifyConnectionError(signedOutMessage(action));
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ShopifyConnectionError(networkMessage());
  }

  const body = await readBody(response);
  if (!response.ok || body.success === false) {
    throw new ShopifyConnectionError(
      merchantMessageForShopifyAction(action, response.status, backendErrorText(body))
    );
  }

  return body;
}

/**
 * Start the same connect flow used by Connect and Reconnect.
 * Redirect the browser to the returned Shopify authorize URL.
 */
export async function startShopifyConnect(shop: string): Promise<{ authorizationUrl: string }> {
  const normalized = normalizeShopInput(shop);
  if (!normalized) {
    throw new ShopifyConnectionError(
      'Enter your store address, like your-store.myshopify.com.'
    );
  }

  const body = await backendRequest('connect', '/shopify/oauth/connect', {
    method: 'POST',
    body: JSON.stringify({ shop: normalized }),
  });

  const data = asRecord(body.data);
  const authorizationUrl = data ? asNullableString(data.authorizationUrl) : null;
  if (!authorizationUrl || !isShopifyAuthorizeUrl(authorizationUrl)) {
    throw new ShopifyConnectionError("We couldn't open Shopify. Try again.");
  }

  return { authorizationUrl };
}

export async function getShopifyConnectionStatus(): Promise<ShopifyConnectionStatus> {
  const body = await backendRequest('status', '/shopify/status', { method: 'GET' });
  const data = asRecord(body.data);
  const statusValue = data ? asNullableString(data.status) : null;
  const isConnected = data?.isConnected === true || statusValue === 'connected';

  return {
    status: isConnected ? 'connected' : 'disconnected',
    isConnected,
    shop: isConnected && data ? asNullableString(data.shop) : null,
    scope: isConnected && data ? asNullableString(data.scope) : null,
    connectedAt: isConnected && data ? asNullableString(data.connectedAt) : null,
    lastSyncAt: isConnected && data ? asNullableString(data.lastSyncAt) : null,
    webhookRegistrationError:
      isConnected && data ? asNullableString(data.webhookRegistrationError) : null,
  };
}

export interface ShopifyOverviewRead {
  productCount: number | null;
  block: ShopifyCatalogBlockKind | null;
}

/**
 * Product total and catalog block from GET /shopify/overview.
 * A failed overview keeps the block when the body has a reconnect or billing code.
 */
export async function getShopifyOverview(): Promise<ShopifyOverviewRead> {
  const token = tokenStorage.getToken();
  if (!token) return { productCount: null, block: null };

  try {
    const response = await fetch(`${API_URL}/shopify/overview`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const body = (await response.json().catch(() => null)) as unknown;
    const block = catalogBlockFromPayload(body, response.ok, response.status);
    if (!response.ok || block) return { productCount: null, block };
    return { productCount: normalizeCatalog(body, true).productCount, block: null };
  } catch {
    return { productCount: null, block: null };
  }
}

/** Product total from GET /shopify/overview. Null when the overview cannot be read. */
export async function getOverviewProductCount(): Promise<number | null> {
  const overview = await getShopifyOverview();
  return overview.productCount;
}

/** Catalog block from the collections proxy. Null when the list loaded or the failure is generic. */
export async function fetchCollectionsCatalogBlock(): Promise<ShopifyCatalogBlockKind | null> {
  try {
    const response = await fetch('/api/shopify/collections', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const body = (await response.json().catch(() => null)) as unknown;
    return catalogBlockFromPayload(body, response.ok, response.status);
  } catch {
    return null;
  }
}

export async function disconnectShopify(): Promise<void> {
  await backendRequest('disconnect', '/shopify/disconnect', { method: 'POST' });
}

export async function syncShopify(): Promise<void> {
  await backendRequest('sync', '/shopify/sync', { method: 'POST' });
}
