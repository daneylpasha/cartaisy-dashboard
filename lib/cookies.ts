// Cookie consent types
export type CookieConsent = {
  necessary: boolean; // Always true, required for site function
  analytics: boolean;
  marketing: boolean;
};

export const CONSENT_COOKIE_NAME = 'cartaisy_cookie_consent';
export const CONSENT_COOKIE_EXPIRY = 365; // days

export const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

/**
 * Keep the stored shape, but never treat marketing as on.
 * Older cookies may still say marketing true; the next save writes false.
 */
export function normalizeConsent(input: unknown): CookieConsent {
  const record = input && typeof input === 'object' ? (input as { analytics?: unknown }) : {};
  return {
    necessary: true,
    analytics: record.analytics === true,
    marketing: false,
  };
}

export function parseConsentCookie(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null;
  try {
    return normalizeConsent(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function consentCookieValue(consent: CookieConsent): string {
  return JSON.stringify(normalizeConsent(consent));
}

export function acceptAllConsent(): CookieConsent {
  return normalizeConsent({ necessary: true, analytics: true, marketing: true });
}

export function rejectAllConsent(): CookieConsent {
  return normalizeConsent({ necessary: true, analytics: false, marketing: true });
}

// Get consent from cookie
export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!cookie) return null;

  const raw = cookie.slice(CONSENT_COOKIE_NAME.length + 1);
  try {
    return parseConsentCookie(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

// Set consent cookie
export function setConsentCookie(consent: CookieConsent) {
  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_COOKIE_EXPIRY);

  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    consentCookieValue(consent)
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// Check if user has made a consent choice
export function hasConsentChoice(): boolean {
  return getStoredConsent() !== null;
}

/** Optional analytics scripts load only after this stored choice is true. */
export function optionalAnalyticsAllowed(
  consent: { analytics?: boolean; marketing?: boolean } | null | undefined
): boolean {
  return consent?.analytics === true;
}

/** Analytics consent never grants ad storage. A legacy marketing flag stays denied. */
export function gtagStorageConsent(consent: { analytics?: boolean; marketing?: boolean } | null | undefined): {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'denied';
} {
  return {
    analytics_storage: consent?.analytics === true ? 'granted' : 'denied',
    ad_storage: 'denied',
  };
}

/**
 * Closing cookie preferences discards draft toggles.
 * Optional cookies stay at the stored choice, which is off until a choice is saved.
 */
export function consentAfterPreferencesDismiss(saved: CookieConsent): CookieConsent {
  return normalizeConsent(saved);
}

/**
 * The setup wizard's phone and brand card sit in the same viewport as the
 * sticky consent banner. Defer the banner on these paths only. This does not
 * record a choice; other routes still show the banner until the merchant chooses.
 */
export function isOnboardingWizardPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  return path === '/dashboard/onboarding' || path.startsWith('/dashboard/onboarding/');
}
