'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useCookieConsent } from './CookieConsentProvider';
import { CookieConsent, consentAfterPreferencesDismiss, isOnboardingWizardPath } from '@/lib/cookies';
import { marketingTypeClass } from '@/lib/fonts/manrope';
import { inkPrimaryMotionClass } from '@/lib/marketing/publicInk';

const actionBase =
  'inline-flex h-12 items-center justify-center rounded-[4px] px-2 text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]';
const outlinedAction = `${actionBase} border border-white/50 bg-transparent text-white`;
const filledAction = `${actionBase} bg-white text-slate-950 ${inkPrimaryMotionClass}`;
const authBannerSpacer = new Set(['/login', '/signup', '/forgot-password', '/reset-password']);

export default function CookieBanner() {
  const pathname = usePathname();
  const { consent, showBanner, acceptAll, rejectAll, acceptSelected, closeBanner, hasChosen } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [localConsent, setLocalConsent] = useState<CookieConsent>(consent);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    setLocalConsent(consent);
  }, [consent]);

  useEffect(() => {
    if (showBanner && !wasOpen.current && hasChosen) {
      setShowDetails(true);
      setLocalConsent(consent);
    }
    if (!showBanner) setShowDetails(false);
    wasOpen.current = showBanner;
  }, [showBanner, hasChosen, consent]);

  const dismissPreferences = () => {
    setLocalConsent(consentAfterPreferencesDismiss(consent));
    setShowDetails(false);
    if (hasChosen) closeBanner();
  };
  const dismissRef = useRef(dismissPreferences);
  dismissRef.current = dismissPreferences;

  useEffect(() => {
    const root = document.documentElement;
    const panel = panelRef.current;
    const skip =
      !showBanner ||
      !panel ||
      isOnboardingWizardPath(pathname) ||
      authBannerSpacer.has(pathname ?? '');
    if (skip) {
      root.style.paddingBottom = '';
      root.style.scrollPaddingBottom = '';
      return;
    }
    const apply = () => {
      const reserve = Math.max(0, Math.ceil(window.innerHeight - panel.getBoundingClientRect().top));
      const space = `${reserve}px`;
      root.style.paddingBottom = space;
      root.style.scrollPaddingBottom = space;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(panel);
    window.addEventListener('resize', apply);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', apply);
      root.style.paddingBottom = '';
      root.style.scrollPaddingBottom = '';
    };
  }, [showBanner, showDetails, pathname]);

  useEffect(() => {
    if (!showDetails) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('#cookie-heading')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismissRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showDetails]);

  if (!showBanner || isOnboardingWizardPath(pathname)) return null;

  const handleToggle = (key: keyof CookieConsent) => {
    if (key !== 'analytics') return;
    setLocalConsent((prev) => ({ ...prev, analytics: !prev.analytics, marketing: false }));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {showDetails ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close preferences"
          className="pointer-events-auto absolute inset-0 bg-black/50"
          onClick={dismissPreferences}
        />
      ) : null}
      <div
        ref={panelRef}
        role={showDetails ? 'dialog' : 'region'}
        aria-modal={showDetails ? true : undefined}
        aria-labelledby="cookie-heading"
        className={`${marketingTypeClass} pointer-events-auto absolute bottom-4 left-4 right-4 max-h-[min(32rem,calc(100dvh-2rem))] overflow-y-auto rounded-[8px] border border-neutral-700 bg-[#121212] p-6 shadow-lg sm:bottom-6 sm:left-6 sm:right-auto sm:w-full sm:max-w-[420px]`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="cookie-heading" tabIndex={-1} className="text-lg font-semibold text-white">
            Your privacy choices
          </h2>
          {showDetails || hasChosen ? (
            <button
              type="button"
              onClick={showDetails ? dismissPreferences : closeBanner}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-base font-normal leading-[1.6] text-slate-200">
          Essential cookies keep this site working. Optional analytics stay off unless you allow them.{' '}
          <Link href="/cookies" className="font-semibold text-white underline underline-offset-2">
            Cookie Policy
          </Link>
        </p>

        {showDetails ? (
          <div className="mt-5 space-y-4">
            <CookieSwitch
              id="cookie-necessary"
              label="Necessary"
              description="Required for the website to function properly."
              checked
              disabled
            />
            <CookieSwitch
              id="cookie-analytics"
              label="Analytics"
              description="Help us understand how visitors interact with our website."
              checked={localConsent.analytics}
              onToggle={() => handleToggle('analytics')}
            />
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
              <button type="button" onClick={rejectAll} className={outlinedAction}>
                Reject All
              </button>
              <button type="button" onClick={acceptAll} className={filledAction}>
                Accept All
              </button>
              <button type="button" onClick={() => acceptSelected(localConsent)} className={filledAction}>
                Save preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
            <button type="button" onClick={() => setShowDetails(true)} className={outlinedAction}>
              Customize
            </button>
            <button type="button" onClick={rejectAll} className={outlinedAction}>
              Reject All
            </button>
            <button type="button" onClick={acceptAll} className={filledAction}>
              Accept All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CookieSwitch({
  id,
  label,
  description,
  checked,
  disabled = false,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p id={id} className="text-base font-semibold text-white">
          {label}
        </p>
        <p id={`${id}-desc`} className="mt-1 text-base leading-[1.6] text-slate-200">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        id={`${id}-switch`}
        aria-checked={checked}
        aria-labelledby={id}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-11 w-16 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
          checked ? 'bg-white' : 'border border-white/50 bg-transparent'
        } ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          className={`absolute top-3 h-5 w-5 rounded-full ${checked ? 'left-8 bg-slate-950' : 'left-1 bg-white'}`}
        />
      </button>
    </div>
  );
}
