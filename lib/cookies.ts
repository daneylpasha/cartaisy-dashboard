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

// Get consent from cookie
export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch {
    return null;
  }
}

// Set consent cookie
export function setConsentCookie(consent: CookieConsent) {
  const expires = new Date();
  expires.setDate(expires.getDate() + CONSENT_COOKIE_EXPIRY);

  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consent)
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

/**
 * Analytics consent does not grant marketing storage, and marketing consent
 * does not grant analytics storage.
 */
export function gtagStorageConsent(consent: { analytics?: boolean; marketing?: boolean } | null | undefined): {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
} {
  return {
    analytics_storage: consent?.analytics === true ? 'granted' : 'denied',
    ad_storage: consent?.marketing === true ? 'granted' : 'denied',
  };
}

/**
 * Closing cookie preferences discards draft toggles.
 * Optional cookies stay at the stored choice, which is off until a choice is saved.
 */
export function consentAfterPreferencesDismiss(saved: CookieConsent): CookieConsent {
  return {
    necessary: true,
    analytics: saved.analytics === true,
    marketing: saved.marketing === true,
  };
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
