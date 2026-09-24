'use client';

import { useState } from 'react';
import { safeImageUrl } from '@/lib/onboarding/normalizers';
import type { BrandingDraft } from '@/lib/onboarding/types';

export function BrandHandoff({ draft }: { draft: BrandingDraft }) {
  const name = draft.appName.trim() || 'Your app';
  const iconUrl = safeImageUrl(draft.iconUrl);
  const initial = name.charAt(0).toUpperCase();
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const showIcon = Boolean(iconUrl) && brokenFor !== iconUrl;

  return (
    <div className="mt-8 flex items-center gap-3">
      {showIcon && iconUrl ? (
        // Merchant image hosts are outside the Next image allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200"
          onError={() => setBrokenFor(iconUrl)}
        />
      ) : (
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600"
        >
          {initial}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Your app</p>
        <p className="truncate font-heading text-base font-semibold tracking-tight text-slate-950">{name}</p>
      </div>
    </div>
  );
}
