'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '@/components/cookies/CookieConsentProvider';
import { optionalAnalyticsAllowed } from '@/lib/cookies';
import GoogleAnalytics from './GoogleAnalytics';
import VercelAnalytics from './VercelAnalytics';
import VercelSpeedInsights from './SpeedInsights';

const OPTIONAL_ANALYTICS_SCRIPT =
  'script[src*="googletagmanager.com/gtag"], script[src*="/_vercel/insights"], script[src*="/_vercel/speed-insights"], script[src*="va.vercel-scripts.com"], script#google-consent-default, script#google-analytics';

/** Drop already-injected optional analytics tags after consent is withdrawn. */
export function removeOptionalAnalyticsScripts(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(OPTIONAL_ANALYTICS_SCRIPT).forEach((node) => node.remove());
}

export default function ConsentGatedAnalytics() {
  const { consent, hasChosen } = useCookieConsent();
  const allowed = hasChosen && optionalAnalyticsAllowed(consent);

  useEffect(() => {
    if (allowed) return;
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (measurementId) {
      (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = true;
    }
    removeOptionalAnalyticsScripts();
  }, [allowed]);

  if (!allowed) return null;

  return (
    <>
      <GoogleAnalytics />
      <VercelAnalytics />
      <VercelSpeedInsights />
    </>
  );
}
