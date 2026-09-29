/**
 * Shopper chrome mirrored from the mobile app (read 2026-09-28):
 * app/splash.tsx, components/molecules/BrandMark.tsx,
 * components/organisms/home/HomeHeader.tsx,
 * components/organisms/home/DefaultHome.tsx,
 * utils/defaultHome.ts (DEFAULT_HOME_COPY),
 * app/(tabs)/_layout.tsx,
 * app/products/[id].tsx header plus Add to Cart / Buy Now,
 * app/(tabs)/cart.tsx, translations cart.title / cart.subtitle,
 * utils/hostedCheckoutCopy.ts.
 *
 * Copy here should stay aligned with those screens. A second layout is a
 * misleading preview.
 */

/** Ink used when a store has no valid primary color. Matches mobile PRIMARY_COLOR. */
export const SHOPPER_PRIMARY_FALLBACK = '#1c1917';

export const SHOPPER_COLOR = {
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1F2937',
  textGrey: '#4B5563',
  icon: '#94A3B8',
  lightGrey: '#CBD5E1',
  line: '#E2E8F0',
} as const;

export const SHOPPER_COPY = {
  welcomeTitle: 'Welcome',
  heroSubtitle: 'Selected from the shop',
  browse: 'Browse',
  featured: 'Featured',
  collections: 'Collections',
  emptyTitle: 'Nothing to show yet',
  emptyBody: "Products will show up here once they're available.",
  address: 'Add delivery address',
  addToCart: 'Add to Cart',
  buyNow: 'Buy Now',
  cartTitle: 'Cart',
  cartEmptyTitle: 'Your cart is empty',
  cartEmptyBody: 'Browse the catalog and add something you like.',
  productUnavailableTitle: 'Product unavailable',
  productUnavailableBody: "We couldn't load this product. Please try again.",
  hostedCheckout: "Secure checkout continues on the store's page.",
  wishlistTitle: 'Wishlist',
  accountTitle: 'Account',
  sessionLater: 'This screen opens in the installed app after a shopper signs in.',
} as const;

export const SHOPPER_TABS = ['Home', 'Cart', 'Wishlist', 'Account'] as const;

export type ShopperTab = (typeof SHOPPER_TABS)[number];

export type ShopperPreviewScreen = 'opening' | 'home' | 'product' | 'cart' | 'wishlist' | 'account';

export const SHOPPER_PREVIEW_SCREENS: { id: ShopperPreviewScreen; label: string }[] = [
  { id: 'opening', label: 'Opening' },
  { id: 'home', label: 'Home' },
  { id: 'product', label: 'Product' },
  { id: 'cart', label: 'Cart' },
];

/** Trimmed display name. A blank name stays blank so the preview does not invent one. */
export function shopperDisplayName(appName: string): string | null {
  const trimmed = appName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function shopperSearchLabel(appName: string): string {
  const name = shopperDisplayName(appName);
  return name ? `Search ${name}` : 'Search';
}

export function shopperHeroTitle(appName: string): string {
  return shopperDisplayName(appName) ?? SHOPPER_COPY.welcomeTitle;
}

export function shopperCheckoutLabel(quantity: number): string {
  return `Proceed to Checkout (${quantity})`;
}

export function shopperSubtotalLabel(count: number): string {
  return `Subtotal (${count} ${count === 1 ? 'Item' : 'Items'})`;
}

/**
 * What the installable app shows for home. The phone on Brand and Preview is
 * the smart default until Publish. Module-stack edits stay off the device.
 */
export const INSTALLABLE_HOME_CAPTION =
  'The installable app shows the published home, or this smart default until you publish. Module-stack edits stay off the device until Publish.';

/**
 * Honest limits for the still preview. The installable app shows the published
 * home, or this smart default until Publish.
 */
export function shopperPreviewLimits(hasProduct: boolean): string {
  const cartLine = hasProduct
    ? ' The cart row is the first synced product at quantity one. A shopper cart starts empty.'
    : '';
  return `This follows the shopper app's opening screen, default home, product, and cart. ${INSTALLABLE_HOME_CAPTION} Collection cards use names only. Favorites, wishlist, account, and checkout open in the installed app.${cartLine}`;
}
