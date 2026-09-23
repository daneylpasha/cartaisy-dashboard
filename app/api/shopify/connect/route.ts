import { retiredShopifyJson } from '@/lib/shopify/retiredDashboardOAuth';

/**
 * Retired. New connects call POST /api/v1/shopify/oauth/connect on the backend.
 * This route must not build an authorize URL or read Partner app secrets.
 */
export async function POST() {
  return retiredShopifyJson();
}
