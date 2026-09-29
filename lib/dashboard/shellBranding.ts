import type { BrandingDraft } from '@/lib/onboarding/types';

/**
 * One branding read for a store on this dashboard session.
 * `draft` stays on the record after the promise settles. The in-flight
 * `globalThis` map does not: it drops the store when the GET finishes,
 * which is why a second consumer can still send its own request.
 * This map is on `globalThis` for the same reason as that in-flight registry:
 * the shell chunk and the Home chunk can each load this module.
 */
export interface ShellBrandingSession {
  storeId: string;
  reloadKey: number;
  promise: Promise<BrandingDraft | null>;
  draft: BrandingDraft | null;
  settled: boolean;
}

interface CartaisyShellBrandingHost {
  __cartaisyShellBranding?: Map<string, ShellBrandingSession>;
}

const sessions: Map<string, ShellBrandingSession> = ((globalThis as CartaisyShellBrandingHost)
  .__cartaisyShellBranding ??= new Map());

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

/**
 * Branding for a dashboard-frame reader such as Home's Go live strip.
 * An in-flight or settled record for this store is returned and `load` is not called.
 * When this session has not started that store, this starts the same reload-key-0
 * record the shell uses, so a later shell lookup does not send a second GET.
 * Onboarding does not call this.
 */
export function readShellBranding(
  storeId: string,
  token: string,
  load: (storeId: string, token: string) => Promise<BrandingDraft | null>
): Promise<BrandingDraft | null> {
  const current = sessions.get(storeId);
  if (current) return current.promise;
  return ensureShellBrandingSession(storeId, token, 0, load)?.promise ?? load(storeId, token);
}

/** Test isolation. A dashboard reload clears this by loading the module again. */
export function resetShellBrandingSessions(): void {
  sessions.clear();
}
