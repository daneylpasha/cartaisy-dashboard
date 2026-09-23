/**
 * Merchant-facing Shopify copy.
 *
 * Reason codes come from the backend OAuth return URL (`reason`) or from
 * known backend error text. The dashboard never shows tokens, HMAC details,
 * or raw provider errors.
 */

const SHOP_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

const REASON_COPY: Record<string, string> = {
  missing_parameters: "We couldn't finish connecting your store. Try again.",
  missing_params: "We couldn't finish connecting your store. Try again.",
  invalid_hmac: "We couldn't finish connecting your store. Try again.",
  invalid_state: 'That connection link expired. Start again from this page.',
  token_exchange_failed: "Shopify didn't finish connecting. Try again.",
  oauth_not_configured: "Shopify connection isn't available right now. Try again later.",
  config_error: "Shopify connection isn't available right now. Try again later.",
  invalid_shop: 'Enter your store address, like your-store.myshopify.com.',
  shop_taken: 'This Shopify store is already connected to another account.',
  shop_switch_required: 'Disconnect the current store before connecting a different one.',
  store_not_found: "We couldn't find your store. Sign in again.",
  store_required: 'Sign in again to connect your store.',
  credential_save_failed: "We couldn't finish connecting your store. Try again.",
  oauth_failed: "We couldn't finish connecting your store. Try again.",
  callback_failed: "We couldn't finish connecting your store. Try again.",
  db_connection_failed: "We couldn't finish connecting your store. Try again.",
  retired_callback: 'Start the connection again from this page.',
  revoke_failed: "We couldn't disconnect yet. Your store is still connected. Try again.",
};

export type ShopifyAction = 'status' | 'connect' | 'disconnect' | 'sync';

export type ShopifyReturnCopy = {
  tone: 'success' | 'error';
  title: string;
  body: string;
};

/**
 * Turn a typed store name into a myshopify domain.
 * Returns null when the value cannot be a Shopify shop domain.
 */
export function normalizeShopInput(input: string): string | null {
  const trimmed = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  if (!trimmed) {
    return null;
  }

  const withDomain = trimmed.includes('.') ? trimmed : `${trimmed}.myshopify.com`;
  if (!SHOP_DOMAIN_PATTERN.test(withDomain)) {
    return null;
  }

  return withDomain;
}

export function isShopifyAuthorizeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith('.myshopify.com') &&
      url.pathname === '/admin/oauth/authorize'
    );
  } catch {
    return false;
  }
}

export function copyForReason(reason: string | null | undefined): string {
  if (!reason) {
    return "We couldn't connect your store. Try again.";
  }
  return REASON_COPY[reason] ?? "We couldn't connect your store. Try again.";
}

/**
 * Copy for the browser return from `SHOPIFY_OAUTH_RETURN_URL`.
 * `shopify` is `connected` or `error`. `reason` is the backend reason code,
 * or a legacy `error` query value from the retired dashboard callback.
 */
export function shopifyReturnCopy(
  outcome: string | null,
  reason: string | null
): ShopifyReturnCopy | null {
  if (outcome === 'connected') {
    return {
      tone: 'success',
      title: 'Store connected',
      body: 'Your Shopify store is connected.',
    };
  }

  if (outcome === 'error' || (reason && !outcome)) {
    return {
      tone: 'error',
      title: "Couldn't connect",
      body: copyForReason(reason),
    };
  }

  return null;
}

export function merchantMessageForShopifyAction(
  action: ShopifyAction,
  status: number,
  backendError: string
): string {
  const text = backendError.toLowerCase();

  if (status === 401) {
    if (action === 'status') {
      return 'Sign in again to see your Shopify connection.';
    }
    if (action === 'sync') {
      return 'Sign in again to sync your store.';
    }
    if (action === 'disconnect') {
      return 'Sign in again to disconnect your store.';
    }
    return 'Sign in again to connect your store.';
  }

  if (status === 403) {
    return 'You need to be a store admin to do that.';
  }

  if (action === 'connect') {
    if (text.includes('already connected to another')) {
      return REASON_COPY.shop_taken;
    }
    if (text.includes('disconnect the current')) {
      return REASON_COPY.shop_switch_required;
    }
    if (text.includes('invalid shop') || text.includes('shop parameter')) {
      return REASON_COPY.invalid_shop;
    }
    if (text.includes('not configured')) {
      return REASON_COPY.oauth_not_configured;
    }
    if (text.includes('not found')) {
      return REASON_COPY.store_not_found;
    }
    return "We couldn't connect your store. Try again.";
  }

  if (action === 'disconnect') {
    if (text.includes('revoke') || status === 502) {
      return REASON_COPY.revoke_failed;
    }
    return "We couldn't disconnect your store. Try again.";
  }

  if (action === 'sync') {
    if (status === 409 && text.includes('not connected')) {
      return 'Connect your Shopify store first.';
    }
    if (status === 409) {
      return 'A sync is already running.';
    }
    return "We couldn't sync your store. Try again.";
  }

  return "We couldn't check your Shopify connection. Refresh and try again.";
}

export function signedOutMessage(action: ShopifyAction): string {
  return merchantMessageForShopifyAction(action, 401, '');
}

export function networkMessage(): string {
  return "We couldn't reach the server. Check your connection and try again.";
}
