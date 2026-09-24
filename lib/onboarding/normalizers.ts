import { shopifyRecoveryView } from '../shopify/recovery.ts';
import {
  ONBOARDING_STEPS,
  type BuildEligibilityReason,
  type BuildRequestAvailability,
  type CatalogPreviewProduct,
  type LockedCatalog,
  type OnboardingStep,
  type ShopifyConnectionSnapshot,
  type SyncGate,
  type SyncGateState,
} from './types.ts';

const EMPTY_CONNECTION: ShopifyConnectionSnapshot = {
  statusKnown: false,
  isConnected: false,
  shopDomain: null,
  shopId: null,
  connectedAt: null,
  lastSyncAt: null,
  webhookRegistrationError: null,
};

export const EMPTY_CATALOG: LockedCatalog = {
  productCount: null,
  orderCount: null,
  collections: [],
  products: [],
};

/** Preview shelf size. The phone is a two-column grid. */
export const PREVIEW_PRODUCT_LIMIT = 4;

export const UNAVAILABLE_SYNC: SyncGate = {
  state: 'unavailable',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

const CATALOG_SYNC_STATUSES = new Set(['idle', 'syncing', 'succeeded', 'failed']);

function closedGate(state: SyncGateState, detail: string | null = null): SyncGate {
  return {
    state,
    detail,
    eligibleForBuild: false,
    eligibilityReason: null,
  };
}

function eligibilityReasonOf(value: unknown): BuildEligibilityReason | null {
  if (value === 'shopify_not_connected' || value === 'catalog_sync_not_succeeded') return value;
  return null;
}

/** Drops token-shaped text. `errorSummary` from catalog sync is otherwise safe to show. */
function safeSyncDetail(value: string | null): string | null {
  if (!value || value.length > 180) return null;
  if (/shpat_|shpss_|shpca_|shpct_|shpua_|access_token|bearer\s/i.test(value)) return null;
  return value;
}

export function isOnboardingStep(value: string | null): value is OnboardingStep {
  return ONBOARDING_STEPS.some((step) => step === value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.data) ?? root;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

function readShopDomain(data: Record<string, unknown>): string | null {
  const direct = readString(data.shop) ?? readString(data.shopDomain) ?? readString(data.domain);
  if (direct && !direct.startsWith('{')) return direct;

  const shop = asRecord(data.shop);
  if (!shop) return null;
  return (
    readString(shop.myshopifyDomain) ??
    readString(shop.myshopify_domain) ??
    readString(shop.domain) ??
    readString(shop.name)
  );
}

function readShopId(data: Record<string, unknown>): string | null {
  const shop = asRecord(data.shop);
  const candidates = [data.shopId, data.shop_id, shop?.id, shop?.shopId];
  for (const candidate of candidates) {
    const asText = readString(candidate);
    if (asText) return asText;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
  }
  return null;
}

/**
 * Reads connection status from the backend payload.
 * Drops credential fields on purpose: this snapshot is rendered in the browser.
 */
export function normalizeConnectionStatus(payload: unknown, ok: boolean): ShopifyConnectionSnapshot {
  if (!ok) return EMPTY_CONNECTION;
  const data = readData(payload);
  if (!data) return EMPTY_CONNECTION;

  const connectedFlag = data.isConnected;
  const shopDomain = readShopDomain(data);
  const isConnected = connectedFlag === true || (connectedFlag !== false && Boolean(shopDomain));

  return {
    statusKnown: true,
    isConnected,
    shopDomain,
    shopId: readShopId(data),
    connectedAt: isConnected ? readString(data.connectedAt) : null,
    lastSyncAt: isConnected ? readString(data.lastSyncAt) : null,
    webhookRegistrationError: isConnected
      ? safeSyncDetail(readString(data.webhookRegistrationError))
      : null,
  };
}

function explicitSyncState(value: string): SyncGateState | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['succeeded', 'success', 'completed', 'complete'].includes(normalized)) return 'succeeded';
  if (['failed', 'failure', 'error'].includes(normalized)) return 'failed';
  if (['in_progress', 'inprogress', 'running', 'syncing', 'pending'].includes(normalized)) {
    return 'in_progress';
  }
  if (['not_started', 'idle', 'none', 'not_connected'].includes(normalized)) return 'not_started';
  if (['unavailable', 'unknown'].includes(normalized)) return 'unavailable';
  return null;
}

/**
 * Durable catalog sync from GET /api/v1/shopify/sync.
 * `eligibleForBuild` is taken only from that field, and only when status is
 * `succeeded`. `lastSyncAt` and `lastSucceededAt` do not count as success.
 * A failed HTTP response still parses when the body includes this shape
 * (for example POST sync returning 502 with `status: failed`).
 */
function normalizeDurableCatalogSync(data: Record<string, unknown>): SyncGate | null {
  const rawStatus = readString(data.status)?.toLowerCase() ?? null;
  const catalogStatus = rawStatus && CATALOG_SYNC_STATUSES.has(rawStatus) ? rawStatus : null;
  const hasEligibility = 'eligibleForBuild' in data || 'eligibilityReason' in data;
  if (!catalogStatus && !hasEligibility) return null;

  const status = catalogStatus ?? 'idle';
  const state: SyncGateState =
    status === 'succeeded'
      ? 'succeeded'
      : status === 'syncing'
        ? 'in_progress'
        : status === 'failed'
          ? 'failed'
          : 'not_started';
  const eligible = data.eligibleForBuild === true && status === 'succeeded';
  const reason = eligible ? null : eligibilityReasonOf(data.eligibilityReason);

  return {
    state,
    detail: state === 'failed' ? safeSyncDetail(readString(data.errorSummary)) : null,
    eligibleForBuild: eligible,
    eligibilityReason: reason,
    finishedAt: readString(data.finishedAt),
    lastSucceededAt: readString(data.lastSucceededAt),
  };
}

/**
 * Accepts the durable catalog sync payload (`status`, `eligibleForBuild`) and
 * the older in-memory sync payload (`inProgress`, `lastFullSync`, `errors`).
 * The in-memory shape never sets `eligibleForBuild`.
 */
export function normalizeSyncStatus(payload: unknown, ok: boolean): SyncGate {
  const data = readData(payload);
  if (data) {
    const durable = normalizeDurableCatalogSync(data);
    if (durable) return durable;
  }

  if (!ok || !data) return UNAVAILABLE_SYNC;

  const explicit =
    readString(data.state) ??
    readString(data.status) ??
    readString(data.syncState) ??
    readString(data.syncStatus);
  if (explicit) {
    const state = explicitSyncState(explicit);
    if (state) {
      return closedGate(state, readString(data.message) ?? readString(data.detail));
    }
  }

  if (typeof data.inProgress !== 'boolean' && !('errors' in data) && !('lastFullSync' in data)) {
    return UNAVAILABLE_SYNC;
  }

  const inProgress = data.inProgress === true;
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const completed = Boolean(data.lastFullSync || data.lastIncrementalSync);

  if (inProgress) return closedGate('in_progress');
  if (errors.length > 0) return closedGate('failed');
  if (completed) return closedGate('succeeded');
  return closedGate('not_started');
}

export function normalizeCatalog(payload: unknown, ok: boolean): Pick<LockedCatalog, 'productCount' | 'orderCount'> {
  if (!ok) return { productCount: null, orderCount: null };
  const data = readData(payload);
  if (!data) return { productCount: null, orderCount: null };

  const products = asRecord(data.products);
  const orders = asRecord(data.orders);

  return {
    productCount: readCount(products?.total) ?? readCount(data.productCount),
    orderCount: readCount(orders?.total) ?? readCount(data.orderCount),
  };
}

export function normalizeCollectionNames(payload: unknown, ok: boolean): string[] {
  if (!ok) return [];
  const data = readData(payload);
  if (!data) return [];

  const list = Array.isArray(data.collections)
    ? data.collections
    : Array.isArray(data)
      ? data
      : [];

  const names: string[] = [];
  for (const item of list) {
    if (typeof item === 'string') {
      const name = item.trim();
      if (name) names.push(name);
      continue;
    }
    const record = asRecord(item);
    if (!record) continue;
    const name = readString(record.title) ?? readString(record.name) ?? readString(record.handle);
    if (name) names.push(name);
  }
  return names;
}

function readAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCurrency(value: unknown): string | null {
  const text = readString(value);
  if (!text || !/^[A-Za-z]{3}$/.test(text)) return null;
  return text.toUpperCase();
}

function isKnownCurrency(code: string): boolean {
  try {
    return typeof Intl.supportedValuesOf === 'function' && Intl.supportedValuesOf('currency').includes(code);
  } catch {
    return false;
  }
}

/** Formats a preview price. Invalid currency codes fall back to a plain amount. */
export function formatPreviewPrice(amount: number, currency: string | null): string | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const code = currency && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : null;
  if (code && isKnownCurrency(code)) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount);
    } catch {
      // Unknown ISO code. Show the amount without a symbol.
    }
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function safeProductImage(value: string | null): string | null {
  const url = safeImageUrl(value);
  if (!url) return null;
  if (/shpat_|shpss_|shpca_|shpct_|shpua_|access_token|bearer\s/i.test(url)) return null;
  return url;
}

function imageFromUnknown(value: unknown): string | null {
  if (typeof value === 'string') return safeProductImage(value);
  const record = asRecord(value);
  if (!record) return null;
  return safeProductImage(
    readString(record.url) ??
      readString(record.src) ??
      readString(record.originalSrc) ??
      readString(record.srcUrl)
  );
}

function readProductImage(record: Record<string, unknown>): string | null {
  const mobile = asRecord(record.mobileDisplay);
  const direct = [
    record.imageUrl,
    record.image,
    record.featuredImage,
    record.thumbnailUrl,
    mobile?.thumbnailUrl,
    mobile?.imageUrl,
  ];
  for (const candidate of direct) {
    const url = imageFromUnknown(candidate);
    if (url) return url;
  }

  if (!Array.isArray(record.images)) return null;
  const ranked = [...record.images].sort((left, right) => {
    const leftRecord = asRecord(left);
    const rightRecord = asRecord(right);
    const leftPosition = typeof leftRecord?.position === 'number' ? leftRecord.position : 999;
    const rightPosition = typeof rightRecord?.position === 'number' ? rightRecord.position : 999;
    return leftPosition - rightPosition;
  });
  for (const item of ranked) {
    const url = imageFromUnknown(item);
    if (url) return url;
  }
  return null;
}

function readMoney(record: Record<string, unknown>): { amount: number; currency: string | null } | null {
  const currency = readCurrency(record.currency) ?? readCurrency(record.currencyCode);
  const direct = readAmount(record.price);
  if (direct !== null) return { amount: direct, currency };

  const priceObject = asRecord(record.price);
  if (priceObject) {
    const amount = readAmount(priceObject.amount) ?? readAmount(priceObject.value);
    if (amount !== null) {
      return {
        amount,
        currency: readCurrency(priceObject.currencyCode) ?? readCurrency(priceObject.currency) ?? currency,
      };
    }
  }

  const range = asRecord(record.priceRange);
  const min = asRecord(range?.minVariantPrice) ?? asRecord(range?.min);
  if (min) {
    const amount = readAmount(min.amount) ?? readAmount(min.value);
    if (amount !== null) {
      return {
        amount,
        currency: readCurrency(min.currencyCode) ?? readCurrency(min.currency) ?? currency,
      };
    }
  }

  if (!Array.isArray(record.variants)) return null;
  for (const variant of record.variants) {
    const item = asRecord(variant);
    if (!item) continue;
    const nested = asRecord(item.price);
    const amount = readAmount(item.price) ?? (nested ? readAmount(nested.amount) : null);
    if (amount === null) continue;
    return {
      amount,
      currency: readCurrency(item.currency) ?? (nested ? readCurrency(nested.currencyCode) : null) ?? currency,
    };
  }
  return null;
}

function readProductId(value: unknown): string | null {
  const text = readString(value);
  if (text) return text.length > 80 ? text.slice(0, 80) : text;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const record = asRecord(value);
  if (!record) return null;
  return readString(record.$oid) ?? readString(record.id);
}

function unwrapProductNode(item: unknown): unknown {
  const record = asRecord(item);
  const node = record ? asRecord(record.node) : null;
  return node ?? item;
}

function readProductList(payload: unknown): unknown[] {
  const root = asRecord(payload);
  const dataField = root ? (root.data ?? root) : null;
  if (Array.isArray(dataField)) return dataField.map(unwrapProductNode);

  const data = readData(payload);
  if (!data) return [];

  const listKeys = ['previewProducts', 'recentProducts', 'featuredProducts', 'products'] as const;
  const nestedKeys = ['items', 'results', 'list', 'nodes', 'edges'] as const;
  for (const key of listKeys) {
    const value = data[key];
    if (Array.isArray(value)) return value.map(unwrapProductNode);
    const record = asRecord(value);
    if (!record) continue;
    for (const nested of nestedKeys) {
      if (Array.isArray(record[nested])) return record[nested].map(unwrapProductNode);
    }
  }
  return [];
}

/**
 * Products for the preview phone.
 * Accepts GET /products (`data.products[]`) and an overview payload that
 * nests a list under `products.items` (or `recentProducts` / `featuredProducts`).
 * A count object such as `{ products: { total } }` yields no tiles.
 * Image URLs must be http(s). Token-shaped URLs are dropped.
 */
export function normalizePreviewProducts(payload: unknown, ok: boolean): CatalogPreviewProduct[] {
  if (!ok) return [];
  const products: CatalogPreviewProduct[] = [];
  for (const item of readProductList(payload)) {
    if (products.length >= PREVIEW_PRODUCT_LIMIT) break;
    const record = asRecord(item);
    if (!record) continue;
    const title = readString(record.title) ?? readString(record.name);
    if (!title) continue;
    const rawId = readProductId(record.id ?? record._id ?? record.productId ?? record.handle);
    const id =
      rawId && !/shpat_|shpss_|access_token/i.test(rawId) ? rawId : `preview-${products.length + 1}`;
    const money = readMoney(record);
    products.push({
      id,
      title: title.length > 160 ? title.slice(0, 160) : title,
      imageUrl: readProductImage(record),
      priceLabel: money ? formatPreviewPrice(money.amount, money.currency) : null,
    });
  }
  return products;
}

export type PreviewShelf =
  | { kind: 'loading'; message: string }
  | { kind: 'empty'; message: string }
  | { kind: 'products' };

/** What the preview phone should draw for the product shelf. */
export function previewShelf(
  sync: SyncGate,
  products: readonly CatalogPreviewProduct[],
  pending = false
): PreviewShelf {
  if (pending) return { kind: 'loading', message: 'Loading your products' };
  switch (sync.state) {
    case 'in_progress':
      return { kind: 'loading', message: 'Syncing your catalog' };
    case 'succeeded':
      return products.length > 0
        ? { kind: 'products' }
        : { kind: 'empty', message: 'No products in this catalog yet.' };
    case 'failed':
      return { kind: 'empty', message: 'Products show here after a successful sync.' };
    case 'unavailable':
      return { kind: 'empty', message: 'Products show here after we can confirm sync.' };
    case 'not_started':
      return { kind: 'empty', message: 'Products show here after your store syncs.' };
  }
}

/** Copy under the phone. Real products do not get a sample-catalog apology. */
export function previewFootnote(catalog: LockedCatalog, sync: SyncGate, pending = false): string {
  if (!pending && sync.state === 'succeeded' && catalog.products.length > 0) {
    if (catalog.collections.length > 0) return 'Collection names shown here cannot be edited.';
    return 'These products are from your synced catalog.';
  }
  return 'Your name, colors, and images are on this preview.';
}

/** Left-column sentence on the preview step. */
export function previewStepDetail(
  sync: SyncGate,
  products: readonly CatalogPreviewProduct[],
  pending = false
): string {
  const shelf = previewShelf(sync, products, pending);
  if (shelf.kind === 'products') return 'Featured products are from your synced catalog.';
  if (shelf.kind === 'loading') {
    return pending ? 'Loading your products.' : 'Your catalog is still syncing.';
  }
  if (sync.state === 'succeeded') return 'Your catalog synced. Nothing is on the shelf yet.';
  if (sync.state === 'failed') return 'The last sync did not succeed. Products show here after it does.';
  return 'Products show here after a successful sync.';
}

export function normalizeShopDomainInput(input: string): string | null {
  const trimmed = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!trimmed) return null;
  const domain = trimmed.includes('.') ? trimmed : `${trimmed}.myshopify.com`;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) return null;
  return domain;
}

/** Only Shopify's own authorize URLs may be used as a browser redirect. */
export function readAuthorizationUrl(payload: unknown): string | null {
  const data = readData(payload);
  const raw = readString(data?.authorizationUrl) ?? readString(data?.authorizeUrl);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname;
    const shopifyHost =
      host === 'accounts.shopify.com' ||
      host === 'admin.shopify.com' ||
      host.endsWith('.myshopify.com');
    if (url.protocol !== 'https:' || !shopifyHost) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function onboardingSyncWarning(input: {
  statusKnown: boolean;
  isConnected: boolean;
  sync: SyncGate;
}): string | null {
  if (!input.statusKnown) {
    return 'We could not check Shopify yet. You can confirm your brand. Build stays off until a sync succeeds.';
  }
  if (!input.isConnected) {
    return 'Shopify is not connected yet. You can confirm your brand. Build stays off until the store is connected and synced.';
  }
  switch (input.sync.state) {
    case 'succeeded':
      return null;
    case 'in_progress':
      return 'Your store is still syncing. You can confirm your brand. Build stays off until sync finishes.';
    case 'failed':
      return 'The last sync did not succeed. You can confirm your brand. Build stays off until a sync succeeds.';
    case 'unavailable':
      return 'We could not confirm sync status. You can confirm your brand. Build stays off until a sync succeeds.';
    case 'not_started':
      return 'Your store has not synced yet. You can confirm your brand. Build stays off until sync succeeds.';
  }
}

/** Allows only http(s) and blob image URLs into the wizard UI. */
export function safeImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('blob:')) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch {
    return null;
  }
  return null;
}

/** Picks black or white text for a hex background. */
export function readableTextOn(hex: string): '#111111' | '#ffffff' {
  const match = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.exec(hex.trim());
  if (!match) return '#ffffff';
  const raw = match[1];
  const full = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.64 ? '#111111' : '#ffffff';
}

/**
 * Submit stays off unless catalog sync succeeded and Shopify is connected.
 * Connection is the wizard snapshot from GET /shopify/status. When it is
 * omitted, eligibility follows the sync payload alone.
 */
export function buildRequestAvailability(
  sync: SyncGate,
  connection?: { isConnected: boolean; statusKnown: boolean }
): BuildRequestAvailability {
  const shopifyConfirmed = !connection || (connection.statusKnown && connection.isConnected);
  if (sync.eligibleForBuild && shopifyConfirmed) {
    return { enabled: true, reason: null, action: null };
  }

  const disconnected =
    sync.eligibilityReason === 'shopify_not_connected' ||
    (connection?.statusKnown === true && connection.isConnected === false);
  if (disconnected) {
    return {
      enabled: false,
      action: 'connect',
      reason: 'Shopify is disconnected. Reconnect before requesting a build.',
    };
  }

  if (sync.state === 'unavailable' || (connection && !connection.statusKnown && !sync.eligibilityReason)) {
    return {
      enabled: false,
      action: 'retry',
      reason: 'We could not confirm your catalog sync. Try again.',
    };
  }

  if (sync.state === 'in_progress') {
    return {
      enabled: false,
      action: 'sync',
      reason: 'Syncing your catalog…',
    };
  }

  if (sync.state === 'failed') {
    return {
      enabled: false,
      action: 'sync',
      reason: sync.detail ?? 'The last sync did not succeed. Use Sync again.',
    };
  }

  return {
    enabled: false,
    action: 'sync',
    reason: 'Your catalog has not synced yet. Use Sync again.',
  };
}

export function formatLockedCount(count: number | null, singular: string, plural: string): string {
  if (count === null) return 'Not available yet';
  if (count === 1) return `1 ${singular}`;
  return `${count.toLocaleString('en-US')} ${plural}`;
}

export type ConnectPrimaryAction =
  | { kind: 'start'; label: 'Connect Shopify' }
  | { kind: 'continue'; label: 'Continue' | 'Continue to Brand' };

/**
 * A connected store's primary action opens Brand. Connect Shopify is only
 * the primary action when live redirect is on and the store is not connected.
 */
export function connectPrimaryAction(input: {
  liveRedirectEnabled: boolean;
  isConnected: boolean;
}): ConnectPrimaryAction {
  if (input.isConnected) {
    return { kind: 'continue', label: 'Continue to Brand' };
  }
  if (input.liveRedirectEnabled) {
    return { kind: 'start', label: 'Connect Shopify' };
  }
  return { kind: 'continue', label: 'Continue' };
}

/** Auto-start Sync again once after OAuth return when nothing is running. */
export function shouldAutoStartCatalogSync(state: SyncGateState): boolean {
  return state === 'not_started' || state === 'failed';
}

export interface ConnectCatalogView {
  headline: string;
  support: string | null;
  /** Set only after a succeeded sync when the overview returned a count. */
  count: number | null;
  countNoun: string | null;
  showSyncAgain: boolean;
  busy: boolean;
}

/**
 * Merchant copy for the connect step catalog panel.
 * `idle` is `not_started`. Product count is shown only after success.
 */
export function connectCatalogView(sync: SyncGate, productCount: number | null): ConnectCatalogView {
  const view = shopifyRecoveryView({
    statusKnown: true,
    isConnected: sync.eligibilityReason !== 'shopify_not_connected',
    sync,
    productCount,
    webhookError: null,
  });
  const syncing = view.control?.kind === 'sync' && view.control.disabled;
  return {
    headline: view.headline,
    support: view.support,
    count: view.productCount,
    countNoun: view.countNoun,
    showSyncAgain: syncing ? false : view.control?.kind === 'sync' || view.runAgain,
    busy: syncing,
  };
}

/**
 * Drops the OAuth return query after the wizard has read it.
 * `shop` is removed only together with `shopify`, so an unrelated query stays.
 */
export function consumeShopifyReturnQuery(search: string): { query: string; changed: boolean } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const outcome = params.get('shopify');
  if (outcome !== 'connected' && outcome !== 'error') {
    return { query: params.toString(), changed: false };
  }
  params.delete('shopify');
  params.delete('reason');
  params.delete('shop');
  params.delete('error');
  if (!params.get('step')) params.set('step', 'connect');
  return { query: params.toString(), changed: true };
}

/** Shop domain from the OAuth return, safe to prefill. Anything else is dropped. */
export function safeReturnedShop(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 100) return null;
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(trimmed)) return null;
  return trimmed;
}
