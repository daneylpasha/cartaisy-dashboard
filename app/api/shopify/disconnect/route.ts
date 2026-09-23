import { retiredShopifyJson } from '@/lib/shopify/retiredDashboardOAuth';

/**
 * Retired. Disconnect calls POST /api/v1/shopify/disconnect on the backend,
 * which revokes the token. This route must not clear or rewrite dashboard tokens.
 */
export async function POST() {
  return retiredShopifyJson();
}
