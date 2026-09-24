import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_ENTRY_COOKIE,
  entryNeedsShopifyStatus,
  refererPathname,
  resolveEntry,
  shopifyConnectedFromStatus,
} from '@/lib/dashboard/entry';

const authRoutes = ['/login', '/signup'];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

function matchesAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(route));
}

function applyEntryCookie(response: NextResponse, action: 'set' | 'clear' | 'keep', secure: boolean) {
  if (action === 'keep') return response;
  if (action === 'clear') {
    response.cookies.set(AUTH_ENTRY_COOKIE, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure,
    });
    return response;
  }
  response.cookies.set(AUTH_ENTRY_COOKIE, '1', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 30,
    sameSite: 'lax',
    secure,
  });
  return response;
}

async function readShopifyConnected(token: string): Promise<boolean | null> {
  try {
    const response = await fetch(`${API_URL}/shopify/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    const payload: unknown = await response.json().catch(() => null);
    return shopifyConnectedFromStatus(payload, response.ok);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('cartaisy_token')?.value;
  const isAuthenticated = !!token;
  const secure = request.nextUrl.protocol === 'https:';

  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = matchesAuthRoute(pathname);
  const hasEntryCookie = request.cookies.get(AUTH_ENTRY_COOKIE)?.value === '1';
  const refererPath = refererPathname(request.headers.get('referer'), request.nextUrl.origin);

  let shopifyConnected: boolean | null = null;
  if (
    isAuthenticated &&
    token &&
    entryNeedsShopifyStatus({ pathname, isAuthRoute, hasEntryCookie, refererPath })
  ) {
    shopifyConnected = await readShopifyConnected(token);
  }

  const resolution = resolveEntry({
    pathname,
    isAuthenticated,
    isAuthRoute,
    hasEntryCookie,
    shopifyConnected,
    refererPath,
  });

  if (resolution.redirectTo) {
    const response = NextResponse.redirect(new URL(resolution.redirectTo, request.url));
    return applyEntryCookie(response, resolution.entryCookie, secure);
  }

  if (resolution.entryCookie === 'keep') {
    return NextResponse.next();
  }

  return applyEntryCookie(NextResponse.next(), resolution.entryCookie, secure);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
