/**
 * Post-login landing for /dashboard.
 *
 * Signal is the same Shopify connection snapshot the onboarding wizard uses
 * (`normalizeConnectionStatus` on GET /shopify/status). A connected store is
 * established and stays on Home. Unknown status does not redirect.
 *
 * The redirect runs only for the auth entry itself (login/signup, or the next
 * dashboard index hit after that visit). Later Home visits, Exit setup, and
 * every other /dashboard/* path stay put so the wizard cannot loop.
 */

import { normalizeConnectionStatus } from '../onboarding/normalizers.ts';

export const AUTH_ENTRY_COOKIE = 'cartaisy_auth_entry';

export type EntryCookieAction = 'set' | 'clear' | 'keep';

export interface EntryResolution {
  redirectTo: string | null;
  entryCookie: EntryCookieAction;
}

export function isDashboardIndex(pathname: string): boolean {
  return pathname === '/dashboard' || pathname === '/dashboard/';
}

export function refererPathname(referer: string | null, requestOrigin: string): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    if (url.origin !== requestOrigin) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

function isAuthReferer(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/signup/')
  );
}

function isOnboardingReferer(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/onboarding/');
}

/**
 * True only when a disconnected result would change the redirect.
 * Callers skip the status request otherwise.
 */
export function entryNeedsShopifyStatus(input: {
  pathname: string;
  isAuthRoute: boolean;
  hasEntryCookie: boolean;
  refererPath: string | null;
}): boolean {
  if (input.isAuthRoute) return true;
  if (!isDashboardIndex(input.pathname)) return false;
  if (isOnboardingReferer(input.refererPath)) return false;
  return input.hasEntryCookie || isAuthReferer(input.refererPath);
}

/**
 * `shopifyConnected` null means the status could not be read. That stays on
 * Home (or /dashboard from an auth page) instead of guessing.
 */
export function resolveEntry(input: {
  pathname: string;
  isAuthenticated: boolean;
  isAuthRoute: boolean;
  hasEntryCookie: boolean;
  shopifyConnected: boolean | null;
  refererPath: string | null;
}): EntryResolution {
  if (!input.isAuthenticated && input.isAuthRoute) {
    return { redirectTo: null, entryCookie: 'set' };
  }

  if (input.isAuthenticated && input.isAuthRoute) {
    return {
      redirectTo: input.shopifyConnected === false ? '/dashboard/onboarding' : '/dashboard',
      entryCookie: 'clear',
    };
  }

  const inDashboard = input.pathname === '/dashboard' || input.pathname.startsWith('/dashboard/');
  const arrivedFromAuth = input.hasEntryCookie || isAuthReferer(input.refererPath);
  const fromOnboarding = isOnboardingReferer(input.refererPath);

  if (
    input.isAuthenticated &&
    isDashboardIndex(input.pathname) &&
    arrivedFromAuth &&
    !fromOnboarding &&
    input.shopifyConnected === false
  ) {
    return { redirectTo: '/dashboard/onboarding', entryCookie: 'clear' };
  }

  if (input.isAuthenticated && inDashboard && arrivedFromAuth) {
    return { redirectTo: null, entryCookie: 'clear' };
  }

  return { redirectTo: null, entryCookie: 'keep' };
}

/**
 * Reads GET /shopify/status the way the wizard does.
 * HTTP failures and `success: false` are unknown, not "disconnected".
 */
export function shopifyConnectedFromStatus(payload: unknown, httpOk: boolean): boolean | null {
  if (!httpOk || !payload || typeof payload !== 'object') return null;
  if ('success' in payload && (payload as { success?: unknown }).success === false) return null;
  const snapshot = normalizeConnectionStatus(payload, true);
  if (!snapshot.statusKnown) return null;
  return snapshot.isConnected;
}
