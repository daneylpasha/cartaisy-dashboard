'use client';

import { useState, type ReactNode } from 'react';
import { previewFootnote, previewShelf, readableTextOn, safeImageUrl } from '@/lib/onboarding/normalizers';
import {
  SHOPPER_COLOR,
  SHOPPER_COPY,
  SHOPPER_PREVIEW_SCREENS,
  SHOPPER_PRIMARY_FALLBACK,
  SHOPPER_TABS,
  shopperCheckoutLabel,
  shopperDisplayName,
  shopperHeroTitle,
  shopperPreviewLimits,
  shopperSearchLabel,
  shopperSubtotalLabel,
  type ShopperPreviewScreen,
  type ShopperTab,
} from '@/lib/onboarding/shopperChrome';
import type { BrandingDraft, CatalogPreviewProduct, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

interface SmartHomePreviewProps {
  draft: BrandingDraft;
  catalog: LockedCatalog;
  sync: SyncGate;
  pending?: boolean;
  /** First screen. Merchants can switch after that. */
  initialScreen?: ShopperPreviewScreen;
}

function normalizeHex(hex: string): string | null {
  const match = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.exec(hex.trim());
  if (!match) return null;
  const raw = match[1];
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  return `#${full.toLowerCase()}`;
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

function BrandMark({
  name,
  logoUrl,
  iconUrl,
  ink,
  compact = false,
}: {
  name: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  ink: string;
  compact?: boolean;
}) {
  const [logoBroken, setLogoBroken] = useState(false);
  const [iconBroken, setIconBroken] = useState(false);
  const showLogo = Boolean(logoUrl) && !logoBroken;
  const showIcon = !showLogo && Boolean(iconUrl) && !iconBroken;

  if (showLogo && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={compact ? 'h-7 max-w-[7.5rem] object-contain' : 'h-9 max-w-[8.5rem] object-contain'}
        onError={() => setLogoBroken(true)}
      />
    );
  }

  if (showIcon && iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        className={compact ? 'size-9 rounded-[22%] object-cover' : 'size-14 rounded-[22%] object-cover'}
        onError={() => setIconBroken(true)}
      />
    );
  }

  if (name) {
    return (
      <span
        className={`max-w-[9.5rem] truncate font-semibold tracking-tight ${compact ? 'text-sm' : 'text-2xl'}`}
        style={{ color: ink }}
      >
        {name}
      </span>
    );
  }

  return (
    <span
      aria-label="Store"
      className={`flex items-center justify-center border-[1.5px] ${compact ? 'size-5 rounded-md' : 'size-14 rounded-2xl'}`}
      style={{ borderColor: ink }}
    >
      <span className={`rounded-full ${compact ? 'size-1' : 'size-2'}`} style={{ backgroundColor: ink }} />
    </span>
  );
}

function TabGlyph({ tab }: { tab: ShopperTab }) {
  const common = 'h-[18px] w-[18px]';
  if (tab === 'Home') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tab === 'Cart') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 7Z" strokeLinejoin="round" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" strokeLinecap="round" />
      </svg>
    );
  }
  if (tab === 'Wishlist') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 19s-6.2-3.8-8.2-7.2C2.4 9.6 3.2 6.8 6 6.2 7.8 5.8 9.4 6.6 12 8.8c2.6-2.2 4.2-3 6-2.6 2.8.6 3.6 3.4 2.2 5.6C18.2 15.2 12 19 12 19Z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  );
}

function ShopperTabs({
  active,
  primary,
  onSelect,
}: {
  active: ShopperTab;
  primary: string;
  onSelect: (tab: ShopperTab) => void;
}) {
  return (
    <div className="grid shrink-0 grid-cols-4 border-t bg-white px-1 pb-1 pt-1.5" style={{ borderColor: SHOPPER_COLOR.line }}>
      {SHOPPER_TABS.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium"
            style={{ color: selected ? primary : SHOPPER_COLOR.icon }}
          >
            <TabGlyph tab={tab} />
            {tab}
          </button>
        );
      })}
    </div>
  );
}

function SearchRow({ label, secondary }: { label: string; secondary: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5">
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke={secondary} strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: SHOPPER_COLOR.textGrey }}>
        {label}
      </span>
    </div>
  );
}

function AddressRow({ ink }: { ink: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: ink }}>
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="1.6" />
      </svg>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{SHOPPER_COPY.address}</span>
      <svg viewBox="0 0 24 24" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function HomeHeader({
  name,
  logoUrl,
  iconUrl,
  primary,
  onPrimary,
  secondary,
  onCart,
}: {
  name: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  primary: string;
  onPrimary: string;
  secondary: string;
  onCart: () => void;
}) {
  return (
    <div className="shrink-0 px-3 pb-3 pt-2.5" style={{ backgroundColor: primary, color: onPrimary }}>
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center">
        <span />
        <div className="flex justify-center">
          <BrandMark name={name} logoUrl={logoUrl} iconUrl={iconUrl} ink={onPrimary} compact />
        </div>
        <button type="button" onClick={onCart} aria-label="Cart" className="justify-self-end" style={{ color: onPrimary }}>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 7Z" strokeLinejoin="round" />
            <path d="M9 7V6a3 3 0 0 1 6 0v1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="mt-3">
        <SearchRow label={shopperSearchLabel(name ?? '')} secondary={secondary} />
      </div>
      <div className="mt-2.5">
        <AddressRow ink={onPrimary} />
      </div>
    </div>
  );
}

function Hero({
  title,
  imageUrl,
  logoUrl,
  iconUrl,
  name,
  primary,
}: {
  title: string;
  imageUrl: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  name: string | null;
  primary: string;
}) {
  return (
    <div className="relative h-[9.25rem] overflow-hidden rounded-[10px]" style={{ backgroundColor: primary }}>
      {imageUrl ? <RemoteImage src={imageUrl} className="absolute inset-0 h-full w-full object-cover" /> : null}
      {imageUrl ? (
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      ) : null}
      <div className="relative flex h-full flex-col justify-between p-3">
        {logoUrl ? (
          <span className="w-fit rounded-md bg-white p-1">
            <BrandMark name={name} logoUrl={logoUrl} iconUrl={null} ink={primary} compact />
          </span>
        ) : (
          <span className="w-fit rounded-md bg-white px-2 py-1">
            <BrandMark name={name} logoUrl={null} iconUrl={iconUrl} ink={primary} compact />
          </span>
        )}
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-4 text-white">{title}</p>
          <p className="mt-0.5 text-[11px] text-white">{SHOPPER_COPY.heroSubtitle}</p>
          <span
            className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold"
            style={{ color: primary }}
          >
            {SHOPPER_COPY.browse}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: CatalogPreviewProduct;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="w-[6.4rem] shrink-0 text-left">
      <div className="relative h-[7.4rem] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/90">
        {product.imageUrl ? (
          <RemoteImage src={product.imageUrl} className="h-full w-full object-cover" />
        ) : (
          <span className="block h-full w-full" style={{ backgroundColor: SHOPPER_COLOR.line }} />
        )}
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 19s-6.2-3.8-8.2-7.2C2.4 9.6 3.2 6.8 6 6.2 7.8 5.8 9.4 6.6 12 8.8c2.6-2.2 4.2-3 6-2.6 2.8.6 3.6 3.4 2.2 5.6C18.2 15.2 12 19 12 19Z" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-4" style={{ color: SHOPPER_COLOR.text }}>
        {product.title}
      </p>
      {product.priceLabel ? (
        <p className="mt-0.5 text-[11px] font-semibold" style={{ color: SHOPPER_COLOR.text }}>
          {product.priceLabel}
        </p>
      ) : null}
    </button>
  );
}

function CatalogSkeleton({ message }: { message: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="text-[11px]" style={{ color: SHOPPER_COLOR.textGrey }}>
        {message}
      </p>
      <div className="mt-2 h-[9.25rem] animate-pulse rounded-[10px] bg-white" />
      <div className="mt-3 flex gap-2">
        <div className="h-[7.4rem] w-[6.4rem] animate-pulse rounded-2xl bg-white" />
        <div className="h-[7.4rem] w-[6.4rem] animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function EmptyCopy({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <p className="text-sm font-semibold" style={{ color: SHOPPER_COLOR.text }}>
        {title}
      </p>
      <p className="mt-1.5 text-[12px] leading-5" style={{ color: SHOPPER_COLOR.textGrey }}>
        {body}
      </p>
    </div>
  );
}

export function SmartHomePreview({
  draft,
  catalog,
  sync,
  pending = false,
  initialScreen = 'home',
}: SmartHomePreviewProps) {
  const [screen, setScreen] = useState<ShopperPreviewScreen>(initialScreen);
  const [productId, setProductId] = useState<string | null>(catalog.products[0]?.id ?? null);
  const name = shopperDisplayName(draft.appName);
  const logoUrl = safeImageUrl(draft.logoUrl);
  const iconUrl = safeImageUrl(draft.iconUrl);
  const splashUrl = safeImageUrl(draft.splashUrl);
  const primary = normalizeHex(draft.primaryColor) ?? SHOPPER_PRIMARY_FALLBACK;
  const secondary = normalizeHex(draft.secondaryColor) ?? SHOPPER_COLOR.textGrey;
  const onPrimary = readableTextOn(primary);
  const shelf = previewShelf(sync, catalog.products, pending);
  const heroImage = catalog.products.find((product) => product.imageUrl)?.imageUrl ?? null;
  const activeProduct =
    catalog.products.find((product) => product.id === productId) ?? catalog.products[0] ?? null;
  const footnote = previewFootnote(catalog, sync, pending);
  const limits = shopperPreviewLimits(shelf.kind === 'products');
  const tab: ShopperTab =
    screen === 'cart' ? 'Cart' : screen === 'wishlist' ? 'Wishlist' : screen === 'account' ? 'Account' : 'Home';

  const openProduct = (id: string) => {
    setProductId(id);
    setScreen('product');
  };

  const onTab = (next: ShopperTab) => {
    if (next === 'Home') setScreen('home');
    else if (next === 'Cart') setScreen('cart');
    else if (next === 'Wishlist') setScreen('wishlist');
    else setScreen('account');
  };

  return (
    <figure className="mx-auto w-full max-w-[17.5rem]">
      <div role="tablist" aria-label="Shopper screens" className="mb-3 flex justify-center gap-1">
        {SHOPPER_PREVIEW_SCREENS.map((item) => {
          const selected = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setScreen(item.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selected ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-[2.35rem] bg-[#16161a] px-2 pb-3 pt-2 shadow-[0_22px_44px_-28px_rgba(15,23,42,0.55)] ring-1 ring-black/10">
        <div
          data-shopper-screen
          data-preview-screen={screen}
          className="flex aspect-[9/19.5] flex-col overflow-hidden rounded-[1.85rem]"
          style={{ backgroundColor: screen === 'opening' ? SHOPPER_COLOR.white : SHOPPER_COLOR.background }}
        >
          {screen === 'opening' ? (
            <OpeningScreen name={name} logoUrl={logoUrl} iconUrl={iconUrl} splashUrl={splashUrl} primary={primary} />
          ) : null}
          {screen === 'home' || screen === 'wishlist' || screen === 'account' ? (
            <>
              <HomeHeader
                name={name}
                logoUrl={logoUrl}
                iconUrl={iconUrl}
                primary={primary}
                onPrimary={onPrimary}
                secondary={secondary}
                onCart={() => setScreen('cart')}
              />
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {screen === 'home' ? (
                  <HomeBody
                    shelfKind={shelf.kind}
                    shelfMessage={shelf.kind === 'products' ? null : shelf.message}
                    syncSucceeded={sync.state === 'succeeded' && !sync.block}
                    title={shopperHeroTitle(draft.appName)}
                    name={name}
                    logoUrl={logoUrl}
                    iconUrl={iconUrl}
                    primary={primary}
                    heroImage={heroImage}
                    products={catalog.products}
                    collections={catalog.collections}
                    onOpenProduct={openProduct}
                  />
                ) : (
                  <EmptyCopy
                    title={screen === 'wishlist' ? SHOPPER_COPY.wishlistTitle : SHOPPER_COPY.accountTitle}
                    body={SHOPPER_COPY.sessionLater}
                  />
                )}
              </div>
              <ShopperTabs active={tab} primary={primary} onSelect={onTab} />
            </>
          ) : null}
          {screen === 'product' ? (
            <ProductScreen
              product={activeProduct}
              name={name}
              logoUrl={logoUrl}
              iconUrl={iconUrl}
              primary={primary}
              onPrimary={onPrimary}
              onBack={() => setScreen('home')}
              onCart={() => setScreen('cart')}
              onAdd={() => setScreen('cart')}
            />
          ) : null}
          {screen === 'cart' ? (
            <>
              <div className="flex h-11 shrink-0 items-center justify-center" style={{ backgroundColor: primary }}>
                <p className="text-sm font-semibold" style={{ color: onPrimary }}>
                  {SHOPPER_COPY.cartTitle}
                </p>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeProduct && shelf.kind === 'products' ? (
                  <CartLine product={activeProduct} primary={primary} onPrimary={onPrimary} onOpen={() => setScreen('product')} />
                ) : (
                  <EmptyCopy title={SHOPPER_COPY.cartEmptyTitle} body={SHOPPER_COPY.cartEmptyBody} />
                )}
              </div>
              <ShopperTabs active="Cart" primary={primary} onSelect={onTab} />
            </>
          ) : null}
        </div>
        <div className="mt-1.5 flex justify-center" aria-hidden>
          <span className="h-1 w-16 rounded-full bg-white/80" />
        </div>
      </div>
      <figcaption className="mt-4 space-y-1.5 text-center text-xs leading-5 text-slate-500">
        <p>{footnote}</p>
        <p data-shopper-limits>{limits}</p>
      </figcaption>
    </figure>
  );
}

function OpeningScreen({
  name,
  logoUrl,
  iconUrl,
  splashUrl,
  primary,
}: {
  name: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  splashUrl: string | null;
  primary: string;
}) {
  const [splashBroken, setSplashBroken] = useState(false);
  const showSplash = Boolean(splashUrl) && !splashBroken;

  return (
    <div className="relative min-h-0 flex-1 bg-white">
      {showSplash && splashUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={splashUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setSplashBroken(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6">
          <BrandMark name={name} logoUrl={logoUrl} iconUrl={iconUrl} ink={primary} />
        </div>
      )}
    </div>
  );
}

function HomeBody({
  shelfKind,
  shelfMessage,
  syncSucceeded,
  title,
  name,
  logoUrl,
  iconUrl,
  primary,
  heroImage,
  products,
  collections,
  onOpenProduct,
}: {
  shelfKind: 'loading' | 'empty' | 'products';
  shelfMessage: string | null;
  syncSucceeded: boolean;
  title: string;
  name: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  primary: string;
  heroImage: string | null;
  products: readonly CatalogPreviewProduct[];
  collections: readonly string[];
  onOpenProduct: (id: string) => void;
}) {
  if (shelfKind === 'loading') {
    return <CatalogSkeleton message={shelfMessage ?? 'Loading your products'} />;
  }

  if (shelfKind === 'empty') {
    if (syncSucceeded) {
      return <EmptyCopy title={SHOPPER_COPY.emptyTitle} body={SHOPPER_COPY.emptyBody} />;
    }
    return <EmptyCopy title={SHOPPER_COPY.emptyTitle} body={shelfMessage ?? SHOPPER_COPY.emptyBody} />;
  }

  return (
    <div>
      <Hero
        title={title}
        imageUrl={heroImage}
        logoUrl={logoUrl}
        iconUrl={iconUrl}
        name={name}
        primary={primary}
      />
      <p className="mb-2 mt-4 text-[13px] font-semibold" style={{ color: SHOPPER_COLOR.text }}>
        {SHOPPER_COPY.featured}
      </p>
      <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={() => onOpenProduct(product.id)} />
        ))}
      </div>
      {collections.length > 0 ? (
        <>
          <p className="mb-2 mt-4 text-[13px] font-semibold" style={{ color: SHOPPER_COLOR.text }}>
            {SHOPPER_COPY.collections}
          </p>
          <ul className="space-y-2">
            {collections.slice(0, 6).map((label, index) => (
              <li
                key={`${label}-${index}`}
                className="flex h-[4.75rem] items-end rounded-[10px] px-3 py-2.5"
                style={{ backgroundColor: primary }}
              >
                <span className="line-clamp-2 text-[13px] font-semibold text-white">{label}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function ProductScreen({
  product,
  name,
  logoUrl,
  iconUrl,
  primary,
  onPrimary,
  onBack,
  onCart,
  onAdd,
}: {
  product: CatalogPreviewProduct | null;
  name: string | null;
  logoUrl: string | null;
  iconUrl: string | null;
  primary: string;
  onPrimary: string;
  onBack: () => void;
  onCart: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between px-3 py-3" style={{ backgroundColor: primary, color: onPrimary }}>
        <button type="button" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <BrandMark name={name} logoUrl={logoUrl} iconUrl={iconUrl} ink={onPrimary} compact />
        <button type="button" onClick={onCart} aria-label="Cart">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 7Z" strokeLinejoin="round" />
            <path d="M9 7V6a3 3 0 0 1 6 0v1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {product ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="aspect-square bg-slate-100">
              {product.imageUrl ? <RemoteImage src={product.imageUrl} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="px-3 py-3">
              <p className="text-sm font-semibold leading-5" style={{ color: SHOPPER_COLOR.text }}>
                {product.title}
              </p>
              {product.priceLabel ? (
                <p className="mt-1 text-sm font-semibold" style={{ color: SHOPPER_COLOR.text }}>
                  {product.priceLabel}
                </p>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 border-t px-3 py-3" style={{ borderColor: SHOPPER_COLOR.line }}>
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold"
              style={{ borderColor: primary, color: primary }}
            >
              {SHOPPER_COPY.addToCart}
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="mt-2 w-full rounded-lg px-3 py-2 text-[12px] font-semibold"
              style={{ backgroundColor: primary, color: onPrimary }}
            >
              {SHOPPER_COPY.buyNow}
            </button>
            <p className="mt-2 text-center text-[10px] leading-4" style={{ color: SHOPPER_COLOR.textGrey }}>
              {SHOPPER_COPY.hostedCheckout}
            </p>
          </div>
        </div>
      ) : (
        <EmptyCopy title={SHOPPER_COPY.productUnavailableTitle} body={SHOPPER_COPY.productUnavailableBody} />
      )}
    </div>
  );
}

function CartLine({
  product,
  primary,
  onPrimary,
  onOpen,
}: {
  product: CatalogPreviewProduct;
  primary: string;
  onPrimary: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <button type="button" onClick={onOpen} className="flex gap-3 px-3 pb-2 pt-4 text-left">
        <span className="size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          {product.imageUrl ? <RemoteImage src={product.imageUrl} className="h-full w-full object-cover" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[13px] font-semibold leading-4" style={{ color: SHOPPER_COLOR.text }}>
            {product.title}
          </span>
          {product.priceLabel ? (
            <span className="mt-1 block text-[13px] font-semibold" style={{ color: SHOPPER_COLOR.text }}>
              {product.priceLabel}
            </span>
          ) : null}
          <span
            className="mt-2 inline-flex items-center gap-3 rounded-md border px-2.5 py-1 text-[12px] font-medium"
            style={{ borderColor: SHOPPER_COLOR.lightGrey, color: primary }}
          >
            <span aria-hidden>−</span>
            <span style={{ color: SHOPPER_COLOR.text }}>1</span>
            <span aria-hidden>+</span>
          </span>
        </span>
      </button>
      <div className="mt-auto border-t px-3 py-3" style={{ borderColor: SHOPPER_COLOR.line }}>
        <div className="flex items-center justify-between text-[12px]" style={{ color: SHOPPER_COLOR.text }}>
          <span>{shopperSubtotalLabel(1)}</span>
          {product.priceLabel ? <span className="font-semibold">{product.priceLabel}</span> : null}
        </div>
        <div
          className="mt-2 rounded-lg px-3 py-2 text-center text-[12px] font-semibold"
          style={{ backgroundColor: primary, color: onPrimary }}
        >
          {shopperCheckoutLabel(1)}
        </div>
        <p className="mt-2 text-center text-[10px] leading-4" style={{ color: SHOPPER_COLOR.textGrey }}>
          {SHOPPER_COPY.hostedCheckout}
        </p>
      </div>
    </div>
  );
}
