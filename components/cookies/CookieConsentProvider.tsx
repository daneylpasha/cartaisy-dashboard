'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CookieConsent,
  acceptAllConsent,
  defaultConsent,
  getStoredConsent,
  gtagStorageConsent,
  normalizeConsent,
  rejectAllConsent,
  setConsentCookie,
} from '@/lib/cookies';

type ConsentContextType = {
  consent: CookieConsent;
  hasChosen: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptSelected: (consent: CookieConsent) => void;
  openSettings: () => void;
  closeBanner: () => void;
};

const ConsentContext = createContext<ConsentContextType | null>(null);

export function useCookieConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
}

export default function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);
  const [hasChosen, setHasChosen] = useState(true); // Default true to prevent flash
  const [showBanner, setShowBanner] = useState(false);

  // Load stored consent on mount
  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      setHasChosen(true);
    } else {
      setHasChosen(false);
      setShowBanner(true);
    }
  }, []);

  // Update analytics when consent changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', gtagStorageConsent(consent));
    }
  }, [consent]);

  const acceptAll = () => {
    const fullConsent = acceptAllConsent();
    setConsent(fullConsent);
    setConsentCookie(fullConsent);
    setHasChosen(true);
    setShowBanner(false);
  };

  const rejectAll = () => {
    const minimalConsent = rejectAllConsent();
    setConsent(minimalConsent);
    setConsentCookie(minimalConsent);
    setHasChosen(true);
    setShowBanner(false);
  };

  const acceptSelected = (selectedConsent: CookieConsent) => {
    const newConsent = normalizeConsent(selectedConsent);
    setConsent(newConsent);
    setConsentCookie(newConsent);
    setHasChosen(true);
    setShowBanner(false);
  };

  const openSettings = () => {
    setShowBanner(true);
  };

  const closeBanner = () => {
    if (hasChosen) {
      setShowBanner(false);
    }
  };

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasChosen,
        showBanner,
        acceptAll,
        rejectAll,
        acceptSelected,
        openSettings,
        closeBanner,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}
