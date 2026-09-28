'use client';

import { useState } from 'react';
import { displayBrandImageUrl } from '@/lib/onboarding/brandAssets';
import {
  BRAND_STEP_HREF,
  STORE_BRANDING_HREF,
  launcherDisplayName,
} from '@/components/onboarding/LauncherReadinessStrip';

const LINK_CLASS =
  'font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

/**
 * Public https splash, or a blob draft the brand phone already shows.
 * Token-shaped and other non-https URLs are dropped.
 */
export function splashBootImageUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const url = displayBrandImageUrl(value.trim());
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('https:')) return url;
  return null;
}

interface SplashBootMockProps {
  appName: string;
  splashUrl: string | null;
}

export function SplashBootMock({ appName, splashUrl }: SplashBootMockProps) {
  const name = launcherDisplayName(appName);
  const splash = splashBootImageUrl(splashUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const showSplash = Boolean(splash) && brokenFor !== splash;

  return (
    <figure data-splash-boot-mock className="mx-auto mt-4 w-full max-w-[17.5rem]">
      <figcaption className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        Opening screen
      </figcaption>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/90">
        <div className="flex flex-col items-center bg-[radial-gradient(120%_100%_at_50%_0%,#f8fafc_0%,#e8eef4_46%,#d7e0ea_100%)] px-4 pb-4 pt-4">
          <div className="rounded-[1.15rem] bg-[#16161a] p-[3px] shadow-[0_12px_22px_-16px_rgba(15,23,42,0.85)] ring-1 ring-black/10">
            <div
              data-splash-frame
              className="relative aspect-[9/16] w-[6.25rem] overflow-hidden rounded-[0.95rem] bg-slate-100"
            >
              {showSplash && splash ? (
                // Merchant hosts and session blob previews are outside the image allowlist.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={splash}
                  alt=""
                  referrerPolicy="no-referrer"
                  decoding="async"
                  onError={() => setBrokenFor(splash)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#e7edf3_100%)]" />
              )}
            </div>
          </div>
          {name ? (
            <p
              className="mt-2.5 line-clamp-2 w-full max-w-[10rem] text-center text-[11px] font-medium leading-[1.15] tracking-tight text-slate-900"
              title={name}
            >
              {name}
            </p>
          ) : null}
        </div>
        {showSplash ? null : (
          <p className="border-t border-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-600">
            Add a splash in{' '}
            <a href={BRAND_STEP_HREF} className={LINK_CLASS}>
              Brand
            </a>
            {' or '}
            <a href={STORE_BRANDING_HREF} className={LINK_CLASS}>
              Store Branding
            </a>
            . You can request a build either way.
          </p>
        )}
      </div>
    </figure>
  );
}
