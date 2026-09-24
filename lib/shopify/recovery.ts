import type { SyncGate } from '@/lib/onboarding/types';

export interface RecoveryControlSync {
  kind: 'sync';
  disabled: boolean;
}

export interface RecoveryControlReconnect {
  kind: 'reconnect';
}

export type RecoveryControl = RecoveryControlSync | RecoveryControlReconnect;

export interface ShopifyRecoveryView {
  tone: 'ready' | 'attention' | 'working' | 'disconnected' | 'unknown';
  headline: string;
  support: string | null;
  productCount: number | null;
  countNoun: string | null;
  lastSyncLabel: string | null;
  webhookNote: string | null;
  /** Filled recovery control. Null when the catalog is already eligible. */
  control: RecoveryControl | null;
  /** Quiet Sync again after a successful, build-eligible sync. */
  runAgain: boolean;
}

const CLEARED = {
  productCount: null,
  countNoun: null,
  lastSyncLabel: null,
  webhookNote: null,
  runAgain: false,
} as const;

/** Drops token-shaped or oversized status text. Safe to render. */
export function sanitizeStatusText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 180) return null;
  if (/shpat_|shpss_|shpca_|shpct_|shpua_|access_token|bearer\s/i.test(trimmed)) return null;
  return trimmed;
}

export function formatSyncDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function countNoun(count: number): string {
  return count === 1 ? 'product' : 'products';
}

function lastSyncLabel(sync: SyncGate, lastSyncAt: string | null | undefined): string | null {
  const formatted =
    formatSyncDate(sync.lastSucceededAt) ?? formatSyncDate(sync.finishedAt) ?? formatSyncDate(lastSyncAt);
  return formatted ? `Last synced ${formatted}` : null;
}

/**
 * One recovery control for Connect, settings, and Build.
 * Sync again when the store is connected and the catalog is not build-eligible.
 * Reconnect Shopify when the store is disconnected, or when catalog sync
 * succeeded and operational webhook registration reported an error.
 * Webhook text does not change build eligibility.
 */
export function shopifyRecoveryView(input: {
  statusKnown: boolean;
  isConnected: boolean;
  sync: SyncGate;
  productCount: number | null;
  webhookError: string | null;
  lastSyncAt?: string | null;
}): ShopifyRecoveryView {
  const webhookNote = input.isConnected ? sanitizeStatusText(input.webhookError) : null;

  if (!input.statusKnown) {
    return {
      tone: 'unknown',
      headline: 'Checking Shopify',
      support: null,
      control: null,
      ...CLEARED,
    };
  }

  if (!input.isConnected || input.sync.eligibilityReason === 'shopify_not_connected') {
    return {
      tone: 'disconnected',
      headline: 'Shopify is disconnected',
      support: 'Reconnect to sell from this store again.',
      control: { kind: 'reconnect' },
      ...CLEARED,
    };
  }

  if (input.sync.state === 'in_progress') {
    return {
      tone: 'working',
      headline: 'Syncing your catalog…',
      support: 'Not synced yet. You can continue to Brand.',
      control: { kind: 'sync', disabled: true },
      ...CLEARED,
      webhookNote,
    };
  }

  if (input.sync.state === 'failed') {
    return {
      tone: 'attention',
      headline: 'Sync failed',
      support: input.sync.detail ?? 'The last sync did not succeed. Use Sync again.',
      control: { kind: 'sync', disabled: false },
      ...CLEARED,
      webhookNote,
    };
  }

  if (input.sync.state === 'unavailable') {
    return {
      tone: 'attention',
      headline: 'Could not check sync',
      support: 'We could not confirm sync status. Use Sync again.',
      control: { kind: 'sync', disabled: false },
      ...CLEARED,
      webhookNote,
    };
  }

  if (input.sync.state === 'succeeded' && input.sync.eligibleForBuild) {
    const count = input.productCount;
    const needsReconnect = Boolean(webhookNote);
    return {
      tone: needsReconnect ? 'attention' : 'ready',
      headline: 'Synced',
      support: count === null ? 'Product count is not available yet.' : null,
      productCount: count,
      countNoun: count === null ? null : countNoun(count),
      lastSyncLabel: lastSyncLabel(input.sync, input.lastSyncAt),
      webhookNote,
      control: needsReconnect ? { kind: 'reconnect' } : null,
      runAgain: !needsReconnect,
    };
  }

  if (input.sync.state === 'succeeded') {
    const count = input.productCount;
    return {
      tone: 'attention',
      headline: 'Synced',
      support: 'The catalog is not ready for a build yet. Use Sync again.',
      productCount: count,
      countNoun: count === null ? null : countNoun(count),
      lastSyncLabel: lastSyncLabel(input.sync, input.lastSyncAt),
      webhookNote,
      control: { kind: 'sync', disabled: false },
      runAgain: false,
    };
  }

  return {
    tone: 'attention',
    headline: 'Not synced yet',
    support: 'Catalog has not synced yet. Sync again to import your products.',
    control: { kind: 'sync', disabled: false },
    ...CLEARED,
    webhookNote,
  };
}

export function recoveryStatusLine(view: ShopifyRecoveryView): string | null {
  const parts: string[] = [];
  if (view.productCount !== null && view.countNoun) {
    parts.push(`${view.productCount.toLocaleString('en-US')} ${view.countNoun}`);
  }
  if (view.lastSyncLabel) parts.push(view.lastSyncLabel);
  return parts.length > 0 ? parts.join(' · ') : null;
}
