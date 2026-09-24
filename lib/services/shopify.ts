import {
  disconnectShopify,
  getShopifyConnectionStatus,
  startShopifyConnect,
  syncShopify,
} from '@/lib/api/shopifyConnection';
import { ShopifyCollection, ShopifyStatus } from '@/types';

/**
 * Shopify connection helpers.
 * Status, connect, disconnect, and sync go to the backend.
 * The dashboard does not persist Shopify access tokens.
 */

export async function getConnectionStatus(): Promise<ShopifyStatus> {
  const status = await getShopifyConnectionStatus();
  return {
    isConnected: status.isConnected,
    shop: status.shop,
    connectedAt: status.connectedAt,
    scope: status.scope,
    status: status.status,
    lastSyncAt: status.lastSyncAt,
    webhookRegistrationError: status.webhookRegistrationError,
  };
}

export async function initiateOAuth(shop: string): Promise<{ authorizationUrl: string }> {
  return startShopifyConnect(shop);
}

export async function disconnect(): Promise<void> {
  await disconnectShopify();
}

export async function syncAgain(): Promise<void> {
  await syncShopify();
}

/**
 * Collections are loaded through the dashboard proxy, which calls the backend.
 * The proxy does not use a dashboard access token.
 */
export async function getCollections(): Promise<ShopifyCollection[]> {
  const response = await fetch('/api/shopify/collections', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: unknown } | null;
    const message =
      error && typeof error.error === 'string'
        ? error.error
        : "We couldn't load your collections. Try again.";
    throw new Error(message);
  }

  const data = await response.json();
  return data.data?.collections || data.data || [];
}
