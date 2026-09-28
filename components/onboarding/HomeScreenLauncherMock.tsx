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
 * Public https icon, or a blob draft the brand phone already shows.
 * Token-shaped and other non-https URLs are dropped.
 */
export function launcherMockIconUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const url = displayBrandImageUrl(value.trim());
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('https:')) return url;
  return null;
}

interface HomeScreenLauncherMockProps {
  appName: string;
  iconUrl: string | null;
}

export function HomeScreenLauncherMock({ appName, iconUrl }: HomeScreenLauncherMockProps) {
  const name = launcherDisplayName(appName);
  const icon = launcherMockIconUrl(iconUrl);
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const showIcon = Boolean(icon) && brokenFor !== icon;
  const missingName = !name;
  const missingIcon = !showIcon;

  return (
    <figure data-launcher-mock className="mx-auto mt-5 w-full max-w-[17.5rem]">
      <figcaption className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        Home screen
      </figcaption>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/90">
        <div
          data-home-screen
          className="flex justify-center bg-[radial-gradient(120%_100%_at_50%_0%,#f8fafc_0%,#e8eef4_46%,#d7e0ea_100%)] px-4 pb-4 pt-5"
        >
          <div className="flex w-[4.75rem] flex-col items-center">
            {showIcon && icon ? (
              // Merchant hosts and session blob previews are outside the image allowlist.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={icon}
                alt=""
                referrerPolicy="no-referrer"
                decoding="async"
                onError={() => setBrokenFor(icon)}
                className="size-14 rounded-[22%] object-cover shadow-[0_10px_18px_-12px_rgba(15,23,42,0.75)] ring-1 ring-black/10"
              />
            ) : (
              <IconSilhouette />
            )}
            {name ? (
              <p
                className="mt-1.5 line-clamp-2 w-full text-center text-[11px] font-medium leading-[1.15] tracking-tight text-slate-900"
                title={name}
              >
                {name}
              </p>
            ) : null}
          </div>
        </div>
        {missingName || missingIcon ? (
          <p className="border-t border-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-600">
            {missingLead(missingName, missingIcon)}{' '}
            <a href={BRAND_STEP_HREF} className={LINK_CLASS}>
              Brand
            </a>
            {' or '}
            <a href={STORE_BRANDING_HREF} className={LINK_CLASS}>
              Store Branding
            </a>
            . You can request a build either way.
          </p>
        ) : null}
      </div>
    </figure>
  );
}

function missingLead(missingName: boolean, missingIcon: boolean): string {
  if (missingName && missingIcon) return 'Add an app name and an app icon in';
  if (missingName) return 'Add an app name in';
  return 'Add an app icon in';
}

function IconSilhouette() {
  return (
    <span
      aria-hidden
      className="flex size-14 items-center justify-center rounded-[22%] bg-white/70 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]"
    >
      <svg viewBox="0 0 24 24" className="size-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="4" />
      </svg>
    </span>
  );
}
