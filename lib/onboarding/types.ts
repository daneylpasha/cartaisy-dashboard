export type OnboardingStep = 'connect' | 'brand' | 'preview' | 'ready';

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  'connect',
  'brand',
  'preview',
  'ready',
] as const;

export type SyncGateState =
  | 'unavailable'
  | 'not_started'
  | 'in_progress'
  | 'succeeded'
  | 'failed';

export type BuildEligibilityReason = 'shopify_not_connected' | 'catalog_sync_not_succeeded';

/**
 * Normalized sync gate.
 * `eligibleForBuild` is true only when GET /shopify/sync reports
 * `eligibleForBuild` and a succeeded catalog status. `shopify.lastSyncAt`
 * is never success.
 */
export interface SyncGate {
  state: SyncGateState;
  detail: string | null;
  eligibleForBuild: boolean;
  eligibilityReason: BuildEligibilityReason | null;
  /** Present on the durable GET /shopify/sync payload. Not a success signal. */
  finishedAt?: string | null;
  /** Present on the durable GET /shopify/sync payload. Not a success signal. */
  lastSucceededAt?: string | null;
}

/**
 * Connection facts safe to render. Access tokens are never copied onto this
 * object, even if a payload includes one.
 */
export interface ShopifyConnectionSnapshot {
  statusKnown: boolean;
  isConnected: boolean;
  shopDomain: string | null;
  shopId: string | null;
  connectedAt: string | null;
  /** Written by a catalog sync. Never treated as `eligibleForBuild`. */
  lastSyncAt: string | null;
  /**
   * Short text from GET /shopify/status when operational webhook registration
   * did not finish. Null when disconnected, in flight, or token-shaped.
   */
  webhookRegistrationError: string | null;
}

/** A synced product safe to draw on the preview phone. */
export interface CatalogPreviewProduct {
  id: string;
  title: string;
  imageUrl: string | null;
  /** Present when the payload included a usable price. */
  priceLabel: string | null;
}

export interface LockedCatalog {
  productCount: number | null;
  orderCount: number | null;
  collections: string[];
  /**
   * Up to four products for the preview shelf.
   * Empty unless catalog sync succeeded.
   */
  products: CatalogPreviewProduct[];
}

export interface ShopifySnapshot {
  connection: ShopifyConnectionSnapshot;
  sync: SyncGate;
  catalog: LockedCatalog;
}

export interface BrandingDraft {
  appName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  splashUrl: string | null;
  iconUrl: string | null;
  /** False while a chosen splash is still a local preview. */
  splashPersisted: boolean;
  /** False while a chosen icon is still a local preview. */
  iconPersisted: boolean;
}

export type BuildNextAction = 'connect' | 'sync' | 'retry';

export interface BuildRequestAvailability {
  /** True only when catalog sync succeeded and Shopify is connected. */
  enabled: boolean;
  reason: string | null;
  /** Next step when the merchant cannot submit yet. */
  action: BuildNextAction | null;
}
