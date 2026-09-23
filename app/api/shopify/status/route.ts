import { retiredShopifyJson } from '@/lib/shopify/retiredDashboardOAuth';

/**
 * Retired. Connection status is GET /api/v1/shopify/status on the backend.
 * The dashboard store record is not the source of truth.
 */
export async function GET() {
  return retiredShopifyJson();
}
