import {
  ONBOARDING_STEPS,
  type BuildRequestAvailability,
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
};

export const EMPTY_CATALOG: LockedCatalog = {
  productCount: null,
  orderCount: null,
  collections: [],
};

export const UNAVAILABLE_SYNC: SyncGate = {
  state: 'unavailable',
  detail: null,
};

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
    connectedAt: readString(data.connectedAt),
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
 * Accepts today's in-memory sync payload (`inProgress`, `lastFullSync`, `errors`)
 * and a future explicit `state` / `status` string from backend #154.
 */
export function normalizeSyncStatus(payload: unknown, ok: boolean): SyncGate {
  if (!ok) return UNAVAILABLE_SYNC;
  const data = readData(payload);
  if (!data) return UNAVAILABLE_SYNC;

  const explicit =
    readString(data.state) ??
    readString(data.status) ??
    readString(data.syncState) ??
    readString(data.syncStatus);
  if (explicit) {
    const state = explicitSyncState(explicit);
    if (state) {
      return { state, detail: readString(data.message) ?? readString(data.detail) };
    }
  }

  if (typeof data.inProgress !== 'boolean' && !('errors' in data) && !('lastFullSync' in data)) {
    return UNAVAILABLE_SYNC;
  }

  const inProgress = data.inProgress === true;
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const completed = Boolean(data.lastFullSync || data.lastIncrementalSync);

  if (inProgress) return { state: 'in_progress', detail: null };
  if (errors.length > 0) return { state: 'failed', detail: null };
  if (completed) return { state: 'succeeded', detail: null };
  return { state: 'not_started', detail: null };
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

export function buildRequestAvailability(sync: SyncGate): BuildRequestAvailability {
  if (sync.state === 'succeeded') {
    return { enabled: true, reason: null };
  }
  if (sync.state === 'unavailable') {
    return {
      enabled: false,
      reason: 'Build stays off until we can confirm your store has synced.',
    };
  }
  if (sync.state === 'in_progress') {
    return {
      enabled: false,
      reason: 'Your store is still syncing. Build stays off until that finishes.',
    };
  }
  if (sync.state === 'failed') {
    return {
      enabled: false,
      reason: 'The last sync did not succeed. Build stays off until a sync succeeds.',
    };
  }
  return {
    enabled: false,
    reason: 'Build stays off until your store has synced.',
  };
}

export function formatLockedCount(count: number | null, singular: string, plural: string): string {
  if (count === null) return 'Not available yet';
  if (count === 1) return `1 ${singular}`;
  return `${count.toLocaleString('en-US')} ${plural}`;
}

export type ConnectPrimaryAction =
  | { kind: 'start'; label: 'Connect Shopify' }
  | { kind: 'continue'; label: 'Continue' };

/**
 * Live redirect stays off until dashboard #15 / backend #153 return the
 * merchant to this wizard after Shopify approval. Until then the primary
 * action is Continue, with a sync warning.
 */
export function connectPrimaryAction(input: {
  liveRedirectEnabled: boolean;
  isConnected: boolean;
}): ConnectPrimaryAction {
  if (input.liveRedirectEnabled && !input.isConnected) {
    return { kind: 'start', label: 'Connect Shopify' };
  }
  return { kind: 'continue', label: 'Continue' };
}
