import { NextRequest } from 'next/server';
import { retiredShopifyCallbackRedirect } from '@/lib/shopify/retiredDashboardOAuth';

/**
 * Retired. Shopify's OAuth callback is handled by the backend.
 * This route does not exchange the code or write an access token.
 */
export async function GET(request: NextRequest) {
  return retiredShopifyCallbackRedirect(request);
}
