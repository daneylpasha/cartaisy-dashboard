import type { ShopifyCatalogBlockKind, SyncGate } from '../onboarding/types.ts';

/**
 * Merchant-facing catalog blocks from Shopify sync, overview, and collection reads.
 *
 * `shopify_reconnect_required` is the stable code from cartaisy-backend token
 * reads (HTTP 409). Billing accepts `shopify_payment_required` and
 * `shopify_store_billing_required` until backend #194 settles on one name.
 * HTTP 402 and Shopify's "Payment Required" status text are a temporary adapter
 * for responses that do not include a code yet.
 */

const RECONNECT_CODES = new Set(['shopify_reconnect_required']);

const BILLING_CODES = new Set(['shopify_payment_required', 'shopify_store_billing_required']);

const TOKEN_TEXT = /shpat_|shpss_|shpca_|shpct_|shpua_|access_token|bearer\s/i;

export function catalogBlockCopy(block: ShopifyCatalogBlockKind): { headline: string; support: string } {
  if (block === 'reconnect') {
    return {
      headline: 'Reconnect Shopify',
      support: 'Reconnect to load this catalog again.',
    };
  }
  return {
    headline: 'Shopify billing needs attention',
    support:
      'This store needs an active Shopify plan before products and collections can load. Syncing again will not change that.',
  };
}

export function normalizeShopifyErrorCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!code || code.length > 80 || !/^[a-z0-9_]+$/.test(code)) return null;
  return code;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCode(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data);
  const error = asRecord(root.error);
  return (
    normalizeShopifyErrorCode(root.code) ??
    normalizeShopifyErrorCode(root.errorCode) ??
    (data
      ? normalizeShopifyErrorCode(data.code) ?? normalizeShopifyErrorCode(data.errorCode)
      : null) ??
    (error ? normalizeShopifyErrorCode(error.code) ?? normalizeShopifyErrorCode(error.errorCode) : null)
  );
}

function readMessage(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data);
  const error = asRecord(root.error);
  const candidates = [root.error, root.message, data?.errorSummary, data?.message, data?.error, error?.message];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed || trimmed.length > 180 || TOKEN_TEXT.test(trimmed)) continue;
    return trimmed;
  }
  return null;
}

export function classifyShopifyCatalogBlock(input: {
  status?: number | null;
  code?: unknown;
  message?: unknown;
}): ShopifyCatalogBlockKind | null {
  const code = normalizeShopifyErrorCode(input.code);
  if (code && RECONNECT_CODES.has(code)) return 'reconnect';
  if (code && BILLING_CODES.has(code)) return 'billing';
  if (input.status === 402) return 'billing';

  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (!message || message.length > 180 || TOKEN_TEXT.test(message)) return null;
  if (/payment required/i.test(message)) return 'billing';
  if (/shopify access token could not be read/i.test(message)) return 'reconnect';
  return null;
}

/**
 * Reads a backend JSON body. A succeeded payload is not scanned for the
 * temporary message adapter, so a healthy catalog cannot be relabeled from
 * unrelated text. An explicit code or HTTP 402 still counts.
 */
export function catalogBlockFromPayload(
  payload: unknown,
  ok: boolean,
  status?: number
): ShopifyCatalogBlockKind | null {
  const code = readCode(payload);
  const fromCode = classifyShopifyCatalogBlock({ status, code });
  if (fromCode) return fromCode;
  if (status === 402) return 'billing';

  const data = asRecord(asRecord(payload)?.data) ?? asRecord(payload);
  const durableFailed = data?.status === 'failed';
  if (ok && !durableFailed) return null;
  return classifyShopifyCatalogBlock({ message: readMessage(payload) });
}

export function preferCatalogBlock(
  ...blocks: Array<ShopifyCatalogBlockKind | null | undefined>
): ShopifyCatalogBlockKind | null {
  if (blocks.includes('reconnect')) return 'reconnect';
  if (blocks.includes('billing')) return 'billing';
  return null;
}

/** Attaches a block from overview or collections onto a sync gate. */
export function withCatalogBlock(sync: SyncGate, extra: ShopifyCatalogBlockKind | null): SyncGate {
  const block = preferCatalogBlock(sync.block, extra);
  if (!block) return sync;
  const support = catalogBlockCopy(block).support;
  if (sync.block === block && sync.detail === support && sync.eligibleForBuild === false) return sync;
  return {
    ...sync,
    block,
    detail: support,
    eligibleForBuild: false,
    eligibilityReason:
      sync.eligibilityReason === 'shopify_not_connected' ? 'shopify_not_connected' : 'catalog_sync_not_succeeded',
  };
}
