import { NextRequest, NextResponse } from 'next/server';

/**
 * Dashboard Shopify OAuth routes no longer exchange codes or store tokens.
 * A stale Partner redirect or an old client gets a calm return to settings.
 */
export const RETIRED_SHOPIFY_MESSAGE =
  'Refresh this page and connect your store again.';

export function retiredShopifyJson(): NextResponse {
  return NextResponse.json({ error: RETIRED_SHOPIFY_MESSAGE }, { status: 410 });
}

export function retiredShopifyCallbackRedirect(request: NextRequest): NextResponse {
  const configured = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  const origin = configured || request.nextUrl.origin;
  const url = new URL('/dashboard/settings', origin);
  url.searchParams.set('shopify', 'error');
  url.searchParams.set('reason', 'retired_callback');
  return NextResponse.redirect(url);
}
