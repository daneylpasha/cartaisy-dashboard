import type { BrandingDraft } from '@/lib/onboarding/types';

/** One branding read the dashboard shell is holding for a store. */
export interface ShellBrandingRequest {
  storeId: string;
  reloadKey: number;
  promise: Promise<BrandingDraft | null>;
}

/**
 * Keep the shell's branding promise for this store and reload generation.
 * A second caller, including one that starts after the promise has settled,
 * receives the same promise. A higher `reloadKey` starts a new load.
 * The token is not part of the key: sidebar and Settings JWTs can differ.
 */
export function nextShellBrandingRequest(
  current: ShellBrandingRequest | null,
  storeId: string | null,
  token: string | null,
  reloadKey: number,
  load: (storeId: string, token: string) => Promise<BrandingDraft | null>
): ShellBrandingRequest | null {
  if (!storeId || !token) return null;
  if (current && current.storeId === storeId && current.reloadKey === reloadKey) return current;
  return {
    storeId,
    reloadKey,
    promise: load(storeId, token),
  };
}
