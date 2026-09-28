'use client';

import { useState } from 'react';
import { persistedBrandImageUrl } from '@/lib/onboarding/brandAssets';

export const BRAND_STEP_HREF = '/dashboard/onboarding?step=brand';
export const STORE_BRANDING_HREF = '/dashboard/settings#store-branding';

/** Public https thumb. Token-shaped, http, and blob values stay off the strip. */
export function launcherThumbUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  return persistedBrandImageUrl(value);
}

interface LauncherReadinessStripProps {
  iconUrl?: string | null;
  splashUrl?: string | null;
  pending?: boolean;
}

export function LauncherReadinessStrip({
  iconUrl = null,
  splashUrl = null,
  pending = false,
}: LauncherReadinessStripProps) {
  const icon = launcherThumbUrl(iconUrl);
  const splash = launcherThumbUrl(splashUrl);

  if (pending) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3" aria-busy="true">
        <p className="text-sm text-slate-500">Checking your icon and splash...</p>
      </div>
    );
  }

  const missingIcon = !icon;
  const missingSplash = !splash;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
        role="group"
        aria-label="Launcher assets"
      >
        <AssetCell label="App icon" url={icon} shape="icon" />
        <AssetCell label="Splash" url={splash} shape="splash" />
      </div>
      {missingIcon || missingSplash ? (
        <p className="border-t border-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-600">
          {missingLead(missingIcon, missingSplash)}{' '}
          <a
            href={BRAND_STEP_HREF}
            className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Brand
          </a>
          {' or '}
          <a
            href={STORE_BRANDING_HREF}
            className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Store Branding
          </a>
          . You can request a build either way.
        </p>
      ) : null}
    </div>
  );
}

function missingLead(missingIcon: boolean, missingSplash: boolean): string {
  if (missingIcon && missingSplash) return 'Add an app icon and a splash in';
  if (missingIcon) return 'Add an app icon in';
  return 'Add a splash in';
}

function AssetCell({
  label,
  url,
  shape,
}: {
  label: string;
  url: string | null;
  shape: 'icon' | 'splash';
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-2.5">
      <Thumb url={url} shape={shape} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-950">{label}</p>
        <p className={url ? 'text-xs font-medium text-emerald-700' : 'text-xs text-slate-500'}>
          {url ? 'Ready' : 'Not added'}
        </p>
      </div>
    </div>
  );
}

function Thumb({ url, shape }: { url: string | null; shape: 'icon' | 'splash' }) {
  const [broken, setBroken] = useState(false);
  const frame = shape === 'icon' ? 'size-8 rounded-[22%]' : 'h-8 w-12 rounded-md';
  const show = Boolean(url) && !broken;

  return (
    <span aria-hidden className={`block shrink-0 overflow-hidden border border-slate-200 bg-slate-50 ${frame}`}>
      {show && url ? (
        // Merchant image hosts are outside the Next image allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          decoding="async"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
}
