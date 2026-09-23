import { NextRequest } from 'next/server';
import { retiredShopifyCallbackRedirect } from '@/lib/shopify/retiredDashboardOAuth';

/**
 * Retired. The Partner app redirect belongs on the backend
 * (`GET /api/v1/shopify/oauth/callback`). This dashboard route does not
 * exchange the code or write `shopify.accessToken`.
 */
export async function GET(request: NextRequest) {
  return retiredShopifyCallbackRedirect(request);
}
