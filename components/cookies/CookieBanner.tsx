'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useCookieConsent } from './CookieConsentProvider';
import { CookieConsent, isOnboardingWizardPath } from '@/lib/cookies';

export default function CookieBanner() {
  const pathname = usePathname();
  const { consent, showBanner, acceptAll, rejectAll, acceptSelected, closeBanner, hasChosen } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [localConsent, setLocalConsent] = useState<CookieConsent>(consent);

  // Sync local consent with context consent when it changes
  useEffect(() => {
    setLocalConsent(consent);
  }, [consent]);

  if (!showBanner || isOnboardingWizardPath(pathname)) return null;

  const handleToggle = (key: keyof CookieConsent) => {
    if (key === 'necessary') return; // Can't toggle necessary cookies
    setLocalConsent(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = () => {
    acceptSelected(localConsent);
  };

  const primaryAction =
    'inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300';
  const secondaryAction =
    'inline-flex min-h-10 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300';

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[22.5rem]">
      <div className="max-h-[min(32rem,calc(100vh-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#121214] shadow-2xl">
        {/* Main Banner */}
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-slate-300 text-sm">
                Cookies run this site. Analytics and marketing cookies stay off unless you allow them.{' '}
                <Link href="/cookies" className="text-white underline underline-offset-2">
                  Cookie Policy
                </Link>
              </p>

              {/* Action Buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={acceptAll} className={primaryAction}>
                  Accept All
                </button>
                <button onClick={rejectAll} className={secondaryAction}>
                  Reject All
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`${secondaryAction} gap-1`}
                >
                  Customize
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Close button (only if already chosen) */}
            {hasChosen && (
              <button
                onClick={closeBanner}
                className="rounded-md text-slate-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Cookie Details */}
        {showDetails && (
          <div className="border-t border-slate-700 px-4 py-3 bg-slate-800/50">
            <div className="space-y-4">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">Necessary Cookies</h4>
                  <p className="text-slate-400 text-xs">Required for the website to function properly.</p>
                </div>
                <div className="px-3 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">
                  Always Active
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">Analytics Cookies</h4>
                  <p className="text-slate-400 text-xs">Help us understand how visitors interact with our website.</p>
                </div>
                <button
                  type="button"
                  aria-pressed={localConsent.analytics}
                  aria-label="Analytics cookies"
                  onClick={() => handleToggle('analytics')}
                  className={`relative h-6 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                    localConsent.analytics ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      localConsent.analytics ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">Marketing Cookies</h4>
                  <p className="text-slate-400 text-xs">Used to deliver personalized advertisements.</p>
                </div>
                <button
                  type="button"
                  aria-pressed={localConsent.marketing}
                  aria-label="Marketing cookies"
                  onClick={() => handleToggle('marketing')}
                  className={`relative h-6 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                    localConsent.marketing ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      localConsent.marketing ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleSavePreferences} className={primaryAction}>
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
