'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { drawableBrandImageUrl } from '@/lib/onboarding/brandAssets';
import { merchantDisplayName } from '@/lib/onboarding/appName';
import type { OnboardingStep } from '@/lib/onboarding/types';
import { ONBOARDING_STEPS } from '@/lib/onboarding/types';

const STEP_LABELS: Record<OnboardingStep, string> = {
  connect: 'Connect',
  brand: 'Brand',
  preview: 'Preview',
  ready: 'Ready',
};

/** Quiet label when no merchant name is known. */
export const WIZARD_HEADER_FALLBACK = 'Setup';

const SHOP_DOMAIN = /^(?:https?:\/\/)?[a-z0-9][a-z0-9-]*\.myshopify\.com\/?$/i;
const STORE_ID = /^[a-f0-9]{24}$/i;

function acceptableHeaderMark(value: string | null | undefined): string | null {
  const name = merchantDisplayName(value);
  if (!name) return null;
  if (SHOP_DOMAIN.test(name)) return null;
  if (STORE_ID.test(name)) return null;
  return name;
}

/**
 * Header mark for setup. Prefer the branding display name, then the store
 * name. A blank value, the platform wordmark, a shop domain, and a store id
 * are not used.
 */
export function wizardHeaderMark(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const name = acceptableHeaderMark(value);
    if (name) return name;
  }
  return WIZARD_HEADER_FALLBACK;
}

/**
 * Image beside the header name. The app icon wins; the logo is used only
 * when that icon is not drawable. `drawableBrandImageUrl` keeps public https
 * and in-memory blob previews, and drops token-shaped and other URLs.
 */
export function wizardHeaderImageUrl(
  iconUrl?: string | null,
  logoUrl?: string | null
): string | null {
  for (const value of [iconUrl, logoUrl]) {
    const url = drawableBrandImageUrl(typeof value === 'string' ? value : null);
    if (url) return url;
  }
  return null;
}

interface WizardChromeProps {
  step: OnboardingStep;
  wide?: boolean;
  /** Branding app display name, including an unsaved draft. */
  appName?: string | null;
  /** Session or profile store name. Used when the app name is not a mark. */
  storeName?: string | null;
  /** Branding app icon, including an unsaved blob preview. */
  iconUrl?: string | null;
  /** Branding logo. Shown only when the icon is not drawable. */
  logoUrl?: string | null;
  children: ReactNode;
}

export function WizardChrome({
  step,
  wide = false,
  appName = null,
  storeName = null,
  iconUrl = null,
  logoUrl = null,
  children,
}: WizardChromeProps) {
  const currentIndex = ONBOARDING_STEPS.indexOf(step);
  const mark = wizardHeaderMark(appName, storeName);
  const imageUrl = wizardHeaderImageUrl(iconUrl, logoUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && brokenFor !== imageUrl;
  const markBroken = (src: string) => {
    setBrokenFor((current) => (current === src ? current : src));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f6] text-slate-900">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          {showImage && imageUrl ? (
            // Merchant hosts and session blob previews are outside the image allowlist.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              decoding="async"
              ref={(node) => {
                if (node?.complete && node.naturalWidth === 0) markBroken(imageUrl);
              }}
              onError={() => markBroken(imageUrl)}
              className="size-8 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
            />
          ) : null}
          <p className="min-w-0 truncate font-heading text-[15px] font-semibold tracking-tight text-slate-950">
            {mark}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 text-sm text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          Exit setup
        </Link>
      </header>

      <div className={cn('mx-auto w-full px-5 pb-16 sm:px-8', wide ? 'max-w-5xl' : 'max-w-[720px]')}>
        <nav aria-label="Setup steps" className="mb-8">
          <ol className="flex items-center gap-3 overflow-x-auto pb-1">
            {ONBOARDING_STEPS.map((item, index) => {
              const complete = index < currentIndex;
              const current = index === currentIndex;
              return (
                <li key={item} className="flex shrink-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium',
                        current && 'bg-slate-950 text-white',
                        complete && 'bg-slate-950 text-white',
                        !current && !complete && 'border border-slate-300 bg-white text-slate-400'
                      )}
                      aria-hidden
                    >
                      {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        'truncate text-sm',
                        current ? 'font-medium text-slate-950' : 'text-slate-500'
                      )}
                      aria-current={current ? 'step' : undefined}
                    >
                      {STEP_LABELS[item]}
                    </span>
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <span className="h-px w-6 bg-slate-200 sm:w-10" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {children}
      </div>
    </div>
  );
}

interface WizardFooterProps {
  onBack?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  quietAction?: { label: string; onClick: () => void };
}

export function WizardFooter({
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  pending = false,
  pendingLabel = 'Saving...',
  quietAction,
}: WizardFooterProps) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="h-11 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Back
          </button>
        ) : quietAction ? (
          <button
            type="button"
            onClick={quietAction.onClick}
            className="h-11 px-1 text-left text-sm text-slate-600 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {quietAction.label}
          </button>
        ) : (
          <span />
        )}
      </div>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled || pending}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        {pending ? pendingLabel : primaryLabel}
      </button>
    </div>
  );
}

export function SetupNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="status">
      {children}
    </div>
  );
}
