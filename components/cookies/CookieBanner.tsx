'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Main Banner */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
              <Cookie className="w-6 h-6 text-purple-400" />
            </div>

            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">We value your privacy</h3>
              <p className="text-slate-400 text-sm mb-4">
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                Read our{' '}
                <Link href="/cookies" className="text-purple-400 hover:text-purple-300 underline">
                  Cookie Policy
                </Link>{' '}
                for more information.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={acceptAll}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Accept All
                </button>
                <button
                  onClick={rejectAll}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-5 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
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
          <div className="border-t border-slate-700 p-6 bg-slate-800/50">
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
              <button
                onClick={handleSavePreferences}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
