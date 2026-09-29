import { resetShellBrandingSessions } from '@/lib/dashboard/shellBranding';

interface InflightBrandingHost {
  __cartaisyInflightBranding?: { clear: () => void };
}

/**
 * Drop store-scoped branding held for the previous app.
 * The shell map and the in-flight map both live on `globalThis` so every
 * chunk sees the clear. A full navigation then loads the active store fresh.
 */
export function clearStoreScopedClientCaches(): void {
  resetShellBrandingSessions();
  const host = globalThis as InflightBrandingHost;
  host.__cartaisyInflightBranding?.clear();
}
