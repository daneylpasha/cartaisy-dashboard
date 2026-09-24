'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { previewFootnote, previewShelf, readableTextOn, safeImageUrl } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, CatalogPreviewProduct, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

interface SmartHomePreviewProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
  sync: SyncGate;
  pending?: boolean;
}

const FALLBACK_PRIMARY = '#111111';

function normalizeHex(hex: string): string | null {
  const match = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.exec(hex.trim());
  if (!match) return null;
  const raw = match[1];
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  return `#${full.toLowerCase()}`;
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return `rgba(17,17,17,${alpha})`;
  const raw = normalized.slice(1);
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function RemoteImage({
  src,
  className,
  fallback = null,
}: {
  src: string;
  className: string;
  fallback?: ReactNode;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) return <>{fallback}</>;
  return (
    // Merchant hosts and session blob previews are outside the image allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} onError={() => setBroken(true)} />
  );
}

function HeaderMark({
  iconUrl,
  logoUrl,
  initial,
}: {
  iconUrl: string | null;
  logoUrl: string | null;
  initial: string;
}) {
  const letter = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/20 text-sm font-semibold">
      {initial}
    </span>
  );
  const mark = iconUrl || logoUrl;
  if (!mark) return letter;
  return (
    <RemoteImage
      key={mark}
      src={mark}
      className={
        iconUrl
          ? 'h-9 w-9 shrink-0 rounded-[10px] object-cover ring-1 ring-white/35'
          : 'h-9 w-9 shrink-0 rounded-[10px] bg-white object-contain p-1'
      }
      fallback={letter}
    />
  );
}

function PriceLabel({ label, secondary }: { label: string; secondary: string }) {
  const onSecondary = readableTextOn(secondary);
  if (onSecondary === '#ffffff') {
    return (
      <p className="mt-1 truncate text-[11px] font-medium tabular-nums" style={{ color: secondary }}>
        {label}
      </p>
    );
  }
  return (
    <p
      className="mt-1 inline-block max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
      style={{
        backgroundColor: secondary,
        color: onSecondary,
        boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.16)',
      }}
    >
      {label}
    </p>
  );
}

function ProductTile({ product, secondary }: { product: CatalogPreviewProduct; secondary: string }) {
  return (
    <li className="min-w-0">
      <div className="aspect-square overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
        {product.imageUrl ? (
          <RemoteImage key={product.imageUrl} src={product.imageUrl} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium leading-4 text-slate-800">{product.title}</p>
      {product.priceLabel ? <PriceLabel label={product.priceLabel} secondary={secondary} /> : null}
    </li>
  );
}

function ShopperCover({
  splashUrl,
  primary,
  onPrimary,
  children,
}: {
  splashUrl: string | null;
  primary: string;
  onPrimary: '#111111' | '#ffffff';
  children: ReactNode;
}) {
  const [splashBroken, setSplashBroken] = useState(false);
  const showSplash = Boolean(splashUrl) && !splashBroken;
  const scrim = showSplash
    ? onPrimary === '#ffffff'
      ? `linear-gradient(180deg, ${withAlpha(primary, 0.38)}, ${withAlpha(primary, 0.82)})`
      : `linear-gradient(180deg, rgba(255,255,255,0.62), ${withAlpha(primary, 0.9)})`
    : undefined;

  return (
    <div className={`relative shrink-0 ${showSplash ? 'min-h-[7.75rem]' : ''}`} style={{ color: onPrimary }}>
      {showSplash && splashUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={splashUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setSplashBroken(true)}
        />
      ) : null}
      <div
        className="relative"
        style={{
          backgroundColor: showSplash ? undefined : primary,
          backgroundImage: scrim,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SmartHomePreview({ draft, catalog, sync, pending = false }: SmartHomePreviewProps) {
  const appName = draft.appName.trim() || 'Your app';
  const initial = appName.charAt(0).toUpperCase();
  const iconUrl = safeImageUrl(draft.iconUrl);
  const logoUrl = safeImageUrl(draft.logoUrl);
  const splashUrl = safeImageUrl(draft.splashUrl);
  const primary = normalizeHex(draft.primaryColor) ?? FALLBACK_PRIMARY;
  const secondary = normalizeHex(draft.secondaryColor) ?? '#ffffff';
  const onPrimary = readableTextOn(primary);
  const onSecondary = readableTextOn(secondary);
  const chips = catalog.collections.slice(0, 3);
  const shelf = previewShelf(sync, catalog.products, pending);
  const sectionTitle = catalog.collections[0] ?? (shelf.kind === 'products' ? 'New arrivals' : null);
  const footnote = previewFootnote(catalog, sync, pending);
  const tabColor = readableTextOn(primary) === '#ffffff' ? primary : '#0f172a';
  const pillStyle: CSSProperties = {
    backgroundColor: secondary,
    color: onSecondary,
    boxShadow:
      onSecondary === '#ffffff'
        ? 'inset 0 0 0 1px rgba(255,255,255,0.28)'
        : 'inset 0 0 0 1px rgba(15,23,42,0.16)',
  };

  return (
    <figure className="mx-auto w-full max-w-[17.5rem]">
      <div className="rounded-[2.35rem] bg-[#16161a] p-2 shadow-[0_22px_44px_-28px_rgba(15,23,42,0.55)] ring-1 ring-black/10">
        <div
          data-shopper-screen
          className="flex aspect-[9/19.5] flex-col overflow-hidden rounded-[1.85rem] bg-white"
        >
          <ShopperCover key={splashUrl ?? 'solid'} splashUrl={splashUrl} primary={primary} onPrimary={onPrimary}>
            <div className="relative h-8" aria-hidden>
              <div className="flex h-full items-center justify-between px-4 text-[10px] font-semibold leading-none">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="flex items-end gap-px">
                    <span className="h-1 w-0.5 rounded-sm bg-current opacity-50" />
                    <span className="h-1.5 w-0.5 rounded-sm bg-current opacity-70" />
                    <span className="h-2 w-0.5 rounded-sm bg-current" />
                    <span className="h-2.5 w-0.5 rounded-sm bg-current" />
                  </span>
                  <span className="h-1.5 w-3.5 rounded-[2px] border border-current" />
                </span>
              </div>
              <span className="absolute left-1/2 top-1.5 h-[18px] w-14 -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/25" />
            </div>
            <div className="flex items-center gap-2.5 px-3.5 pb-4">
              <HeaderMark
                key={`${iconUrl ?? ''}|${logoUrl ?? ''}`}
                iconUrl={iconUrl}
                logoUrl={logoUrl}
                initial={initial}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[15px] font-semibold leading-5 tracking-tight">{appName}</p>
                {iconUrl && logoUrl ? (
                  <RemoteImage
                    key={logoUrl}
                    src={logoUrl}
                    className="mt-1 h-4 max-w-[6.5rem] object-contain object-left"
                  />
                ) : (
                  <p className="text-[10px] leading-4 opacity-75">Home</p>
                )}
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none" style={pillStyle}>
                Shop
              </span>
            </div>
          </ShopperCover>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3.5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex h-8 shrink-0 items-center rounded-full bg-slate-100 px-3 text-[11px] text-slate-500" aria-hidden>
              Search
            </div>
            {chips.length > 0 ? (
              <div className="mt-3 flex gap-1.5 overflow-hidden" aria-hidden>
                {chips.map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    className="max-w-[8.5rem] shrink-0 truncate rounded-full px-2.5 py-1 text-[11px]"
                    style={
                      index === 0
                        ? { backgroundColor: primary, color: onPrimary }
                        : { backgroundColor: '#f1f5f9', color: '#334155' }
                    }
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
            <div className={shelf.kind === 'empty' ? 'mt-3 flex flex-1 flex-col' : 'mt-3'}>
              {sectionTitle ? <p className="truncate text-sm font-medium text-slate-900">{sectionTitle}</p> : null}
              {shelf.kind === 'products' ? (
                <ul className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {catalog.products.map((product, index) => (
                    <ProductTile key={`${product.id}-${index}`} product={product} secondary={secondary} />
                  ))}
                </ul>
              ) : shelf.kind === 'loading' ? (
                <div className="mt-2.5" aria-busy="true" aria-live="polite">
                  <p className="text-[11px] text-slate-500">{shelf.message}</p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5">
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
                  className="my-auto rounded-2xl bg-slate-50 px-3 py-6 text-center text-[13px] leading-5 text-slate-600"
                  role="status"
                >
                  {shelf.message}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200/80 bg-white px-2 pt-2" aria-hidden>
            <div className="grid grid-cols-3 text-[10px] font-medium">
              <span className="flex flex-col items-center gap-0.5" style={{ color: tabColor }}>
                <HomeGlyph />
                Home
              </span>
              <span className="flex flex-col items-center gap-0.5 text-slate-400">
                <SearchGlyph />
                Search
              </span>
              <span className="flex flex-col items-center gap-0.5 text-slate-400">
                <BagGlyph />
                Bag
              </span>
            </div>
            <div className="flex justify-center pb-1.5 pt-2">
              <span className="h-1 w-16 rounded-full bg-slate-900" />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-xs leading-5 text-slate-500">{footnote}</figcaption>
    </figure>
  );
}

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function BagGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" strokeLinecap="round" />
    </svg>
  );
}
