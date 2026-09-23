'use client';

import { readableTextOn, safeImageUrl } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog } from '@/lib/onboarding/types';

interface SmartHomePreviewProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
}

const SAMPLE_PRODUCTS = ['1', '2', '3', '4'] as const;

export function SmartHomePreview({ draft, catalog }: SmartHomePreviewProps) {
  const appName = draft.appName.trim() || 'Your app';
  const initial = appName.charAt(0).toUpperCase();
  const headerMark = safeImageUrl(draft.iconUrl) || safeImageUrl(draft.logoUrl);
  const splashUrl = safeImageUrl(draft.splashUrl);
  const onPrimary = readableTextOn(draft.primaryColor);
  const chips = catalog.collections.slice(0, 3);
  const categories = chips.length > 0 ? chips : ['All', 'Featured', 'New'];
  const sectionTitle = catalog.collections[0] ?? 'Featured';

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_60px_-36px_rgba(15,23,42,0.45)]">
        <div className="flex h-7 items-end justify-center pb-1">
          <span className="h-1 w-14 rounded-full bg-slate-200" aria-hidden />
        </div>

        <div
          className="relative px-5 pb-5 pt-4"
          style={
            splashUrl
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.55)), url("${splashUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: '#ffffff',
                }
              : { backgroundColor: draft.primaryColor, color: onPrimary }
          }
        >
          <div className="flex items-center gap-3">
            {headerMark ? (
              // Blob previews and merchant image hosts are not in the Next image allowlist.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerMark}
                alt=""
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: splashUrl ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.18)',
                }}
              >
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">{appName}</p>
              <p className="text-xs opacity-80">Home</p>
            </div>
          </div>
          <p className="mt-6 font-heading text-2xl font-semibold tracking-tight">New this week</p>
          <p className="mt-1 max-w-[220px] text-sm leading-5 opacity-90">
            A starting home for your store. Change the layout later.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex h-9 items-center rounded-full bg-slate-100 px-3 text-xs text-slate-500" aria-hidden>
            Search
          </div>
          <div className="flex gap-2 overflow-hidden" aria-hidden>
            {categories.map((label, index) => (
              <span
                key={label}
                className="shrink-0 rounded-full px-3 py-1 text-xs"
                style={
                  index === 0
                    ? { backgroundColor: draft.primaryColor, color: onPrimary }
                    : { backgroundColor: '#f1f5f9', color: '#334155' }
                }
              >
                {label}
              </span>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{sectionTitle}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {SAMPLE_PRODUCTS.map((item) => (
                <div key={item}>
                  <div
                    className="aspect-square rounded-xl"
                    style={{ backgroundColor: item === '1' && draft.secondaryColor ? draft.secondaryColor : '#f1f5f9' }}
                  />
                  <p className="mt-2 text-xs font-medium text-slate-800">Product</p>
                  <div className="mt-1 h-2 w-10 rounded-full bg-slate-200" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        Sample layout. Real products appear after sync. Collection names shown here cannot be edited.
      </p>
    </div>
  );
}
