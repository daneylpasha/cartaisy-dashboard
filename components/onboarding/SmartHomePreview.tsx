'use client';

import { useState } from 'react';
import { previewFootnote, previewShelf, readableTextOn, safeImageUrl } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, CatalogPreviewProduct, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

interface SmartHomePreviewProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
  sync: SyncGate;
  pending?: boolean;
}

function priceColor(secondary: string): string {
  const trimmed = secondary.trim();
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(trimmed)) return '#64748b';
  return readableTextOn(trimmed) === '#ffffff' ? trimmed : '#64748b';
}

function ProductTile({ product, amountColor }: { product: CatalogPreviewProduct; amountColor: string }) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(product.imageUrl) && !broken;

  return (
    <li className="min-w-0">
      <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
        {showImage ? (
          // Merchant image hosts are not in the Next image allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl ?? ''}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium leading-4 text-slate-800">{product.title}</p>
      {product.priceLabel ? (
        <p className="mt-1 text-xs tabular-nums" style={{ color: amountColor }}>
          {product.priceLabel}
        </p>
      ) : null}
    </li>
  );
}

export function SmartHomePreview({ draft, catalog, sync, pending = false }: SmartHomePreviewProps) {
  const appName = draft.appName.trim() || 'Your app';
  const initial = appName.charAt(0).toUpperCase();
  const headerMark = safeImageUrl(draft.iconUrl) || safeImageUrl(draft.logoUrl);
  const splashUrl = safeImageUrl(draft.splashUrl);
  const onPrimary = readableTextOn(draft.primaryColor);
  const chips = catalog.collections.slice(0, 3);
  const shelf = previewShelf(sync, catalog.products, pending);
  const sectionTitle = catalog.collections[0] ?? (shelf.kind === 'products' ? 'Your products' : null);
  const amountColor = priceColor(draft.secondaryColor);
  const footnote = previewFootnote(catalog, sync, pending);

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
              <img src={headerMark} alt="" className="h-9 w-9 rounded-lg object-cover" />
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
          {chips.length > 0 ? (
            <div className="flex gap-2 overflow-hidden" aria-hidden>
              {chips.map((label, index) => (
                <span
                  key={`${label}-${index}`}
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
          ) : null}
          <div>
            {sectionTitle ? <p className="text-sm font-medium text-slate-900">{sectionTitle}</p> : null}
            {shelf.kind === 'products' ? (
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {catalog.products.map((product, index) => (
                  <ProductTile key={`${product.id}-${index}`} product={product} amountColor={amountColor} />
                ))}
              </ul>
            ) : shelf.kind === 'loading' ? (
              <div className="mt-3" aria-busy="true" aria-live="polite">
                <p className="text-xs text-slate-500">{shelf.message}</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {['a', 'b', 'c', 'd'].map((slot) => (
                    <div key={slot} aria-hidden>
                      <div className="aspect-square animate-pulse rounded-xl bg-slate-100" />
                      <div className="mt-2 h-2 w-16 animate-pulse rounded-full bg-slate-100" />
                      <div className="mt-1.5 h-2 w-10 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p
                className="mt-3 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm leading-6 text-slate-600"
                role="status"
              >
                {shelf.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500">{footnote}</p>
    </div>
  );
}
