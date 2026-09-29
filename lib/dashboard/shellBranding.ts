import type { BrandingDraft } from '@/lib/onboarding/types';

/**
 * One branding read for a store on this dashboard session.
 * `draft` stays on the record after the promise settles. The in-flight
 * `globalThis` map does not: it drops the store when the GET finishes,
 * which is why a second consumer can still send its own request.
 */
export interface ShellBrandingSession {
  storeId: string;
  reloadKey: number;
  promise: Promise<BrandingDraft | null>;
  draft: BrandingDraft | null;
  settled: boolean;
}

const sessions = new Map<string, ShellBrandingSession>();

/** The shell's load for this store, if this page session already started one. */
export function shellBrandingSession(storeId: string): ShellBrandingSession | null {
  return sessions.get(storeId) ?? null;
}

/**
 * One load per store for the dashboard session.
 * A later call with the same or a lower reload key returns the settled record
 * and does not call `load`. A higher reload key starts a new GET.
 * The token is not part of the key.
 */
export function ensureShellBrandingSession(
  storeId: string | null,
  token: string | null,
  reloadKey: number,
  load: (storeId: string, token: string) => Promise<BrandingDraft | null>
): ShellBrandingSession | null {
  if (!storeId || !token) return null;
  const current = sessions.get(storeId) ?? null;
  if (current && reloadKey <= current.reloadKey) return current;

  const session: ShellBrandingSession = {
    storeId,
    reloadKey,
    promise: load(storeId, token),
    draft: null,
    settled: false,
  };
  session.promise.then((draft) => {
    if (sessions.get(storeId) !== session) return;
    session.draft = draft;
    session.settled = true;
  });
  sessions.set(storeId, session);
  return session;
}

/** Test isolation. A dashboard reload clears this by loading the module again. */
export function resetShellBrandingSessions(): void {
  sessions.clear();
}
