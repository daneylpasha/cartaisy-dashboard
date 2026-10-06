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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
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
                className="text-slate-500 hover:text-white transition-colors"
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
                  onClick={() => handleToggle('analytics')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
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
                  onClick={() => handleToggle('marketing')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
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
