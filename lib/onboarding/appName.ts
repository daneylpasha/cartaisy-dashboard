/**
 * Platform wordmark. Exact match after trim, case-insensitive.
 * Shared by the wizard header, app-name save, launcher readiness, and ops APP_NAME.
 * "Cartaisy Shop" is a merchant name. " Cartaisy " is not.
 */
export const PLATFORM_WORDMARK = /^cartaisy$/i;

/** Calm rejection. No stack, store id, or platform chrome. */
export const APP_NAME_WORDMARK_MESSAGE = 'Choose the name shoppers see on the app.';

export function isPlatformWordmark(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return PLATFORM_WORDMARK.test(value.trim());
}

/**
 * Merchant display name for marks, readiness, and the ops clipboard.
 * Blank, whitespace-only, and a Cartaisy-only name stay missing.
 * Does not substitute a shop domain, a store id, or another name.
 */
export function merchantDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  if (!name || isPlatformWordmark(name)) return null;
  return name;
}
