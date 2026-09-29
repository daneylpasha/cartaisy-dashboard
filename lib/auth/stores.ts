/**
 * Merchant app list, switch, and create.
 *
 * These routes are user-scoped. The bearer token already on the session is
 * sent by `customInstance`. Responses do not include a new access token.
 * Shopify and Expo tokens are not read from the payload.
 */

import { API_URL, customInstance } from '@/lib/api/mutator/custom-instance';

export const SWITCH_APP_PATH = '/dashboard';
export const NEW_APP_PATH = '/dashboard/onboarding';

const TOKEN_SHAPED = /shpat_|shpss_|shpca_|shpct_|shpua_|access_token|bearer/i;

export interface MerchantStore {
  id: string;
  name: string;
}

export interface ActiveStoreFields {
  storeId: string;
  storeName: string;
}

export type StoreCallResult<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

export interface AppSwitcherModel {
  mode: 'name' | 'menu';
  triggerLabel: 'Switch app' | 'Add app';
  others: MerchantStore[];
  showAdd: boolean;
  showSwitchLabel: boolean;
}

export type AppNameResult = { ok: true; name: string } | { ok: false; message: string };

export function canAddApp(role: string | undefined, storeId: string | undefined | null): boolean {
  return role === 'super_admin' && Boolean(storeId && storeId.trim());
}

export function readAppName(value: string): AppNameResult {
  const name = value.trim();
  if (!name) return { ok: false, message: 'Enter an app name.' };
  if (name.length < 2) return { ok: false, message: 'Use at least 2 characters.' };
  if (name.length > 100) return { ok: false, message: 'Use 100 characters or fewer.' };
  if (TOKEN_SHAPED.test(name)) return { ok: false, message: 'Enter an app name.' };
  return { ok: true, name };
}

export function safeStoreLabel(name: unknown): string {
  if (typeof name !== 'string') return 'App';
  const trimmed = name.trim();
  if (!trimmed || TOKEN_SHAPED.test(trimmed)) return 'App';
  return trimmed;
}

export function otherApps(stores: MerchantStore[], activeStoreId: string | null | undefined): MerchantStore[] {
  const active = activeStoreId?.trim() || '';
  const seen = new Set<string>();
  const others: MerchantStore[] = [];
  for (const store of stores) {
    if (!store.id || store.id === active || seen.has(store.id)) continue;
    seen.add(store.id);
    others.push(store);
  }
  return others;
}

/**
 * Name-only when there is nothing to switch to and Add app is hidden.
 * One store plus Add app is a menu with that action only.
 */
export function appSwitcherModel(input: {
  stores: MerchantStore[] | null;
  activeStoreId: string | null | undefined;
  canAdd: boolean;
}): AppSwitcherModel {
  const others = input.stores ? otherApps(input.stores, input.activeStoreId) : [];
  const showSwitchLabel = others.length > 0;
  if (!showSwitchLabel && !input.canAdd) {
    return {
      mode: 'name',
      triggerLabel: 'Switch app',
      others: [],
      showAdd: false,
      showSwitchLabel: false,
    };
  }
  return {
    mode: 'menu',
    triggerLabel: showSwitchLabel ? 'Switch app' : 'Add app',
    others,
    showAdd: input.canAdd,
    showSwitchLabel,
  };
}

export function storeFailureMessage(status: number, action: 'list' | 'switch' | 'create'): string {
  if (action === 'list') return 'Apps could not be loaded.';
  if (action === 'create' && status === 400) {
    return 'That app could not be added. Check the name, or you may already have 10 apps.';
  }
  if (action === 'create' && status === 403) return "You can't add an app on this account.";
  if (action === 'create') return 'That app could not be added. Try again.';
  if (status === 403) return "You don't have access to that app.";
  if (status === 404) return 'That app is no longer available.';
  if (status === 409) return "That app can't be opened with this email.";
  return 'That app could not be opened. Try again.';
}

export function switchStoreBody(storeId: string): { storeId: string } | null {
  const id = storeId.trim();
  if (!id || TOKEN_SHAPED.test(id)) return null;
  return { storeId: id };
}

export function createStoreBody(name: string): { name: string } | null {
  const read = readAppName(name);
  if (!read.ok) return null;
  return { name: read.name };
}

export function sessionWithActiveStore<T extends { storeId?: string; storeName?: string }>(
  user: T,
  active: ActiveStoreFields,
): T {
  return {
    ...user,
    storeId: active.storeId,
    storeName: active.storeName,
  };
}

export function parseStoreList(body: unknown): { activeStoreId: string; stores: MerchantStore[] } | null {
  if (!body || typeof body !== 'object') return null;
  const envelope = body as { status?: unknown; data?: unknown };
  if (envelope.status !== 'success' || !envelope.data || typeof envelope.data !== 'object') return null;
  const data = envelope.data as { activeStoreId?: unknown; stores?: unknown };
  if (typeof data.activeStoreId !== 'string' || !Array.isArray(data.stores)) return null;
  const stores: MerchantStore[] = [];
  const seen = new Set<string>();
  for (const item of data.stores) {
    if (!item || typeof item !== 'object') continue;
    const id = (item as { id?: unknown }).id;
    if (typeof id !== 'string') continue;
    const storeId = id.trim();
    if (!storeId || seen.has(storeId) || TOKEN_SHAPED.test(storeId)) continue;
    seen.add(storeId);
    stores.push({ id: storeId, name: safeStoreLabel((item as { name?: unknown }).name) });
  }
  return { activeStoreId: data.activeStoreId.trim(), stores };
}

export function parseActiveStore(body: unknown, fallbackName: string): ActiveStoreFields | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const user = (data as { user?: unknown }).user;
  if (!user || typeof user !== 'object') return null;
  const storeId = (user as { storeId?: unknown }).storeId;
  if (typeof storeId !== 'string' || !storeId.trim() || TOKEN_SHAPED.test(storeId)) return null;
  const rawName = (user as { storeName?: unknown }).storeName;
  const storeName =
    typeof rawName === 'string' && rawName.trim() && !TOKEN_SHAPED.test(rawName) ? rawName.trim() : safeStoreLabel(fallbackName);
  return { storeId: storeId.trim(), storeName };
}

function createdStoreName(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return '';
  const store = (data as { store?: unknown }).store;
  if (!store || typeof store !== 'object') return '';
  const name = (store as { name?: unknown }).name;
  return typeof name === 'string' ? name : '';
}

function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export async function listMerchantStores(): Promise<
  StoreCallResult<{ activeStoreId: string; stores: MerchantStore[] }>
> {
  try {
    const response = await customInstance<{ data: unknown; status: number }>(`${API_URL}/auth/stores`, {
      method: 'GET',
    });
    if (response.status !== 200) {
      return { ok: false, status: response.status, message: storeFailureMessage(response.status, 'list') };
    }
    const parsed = parseStoreList(response.data);
    if (!parsed) {
      return { ok: false, status: response.status, message: storeFailureMessage(response.status, 'list') };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, status: 0, message: storeFailureMessage(0, 'list') };
  }
}

export async function switchActiveStore(
  storeId: string,
  fallbackName: string,
): Promise<StoreCallResult<ActiveStoreFields>> {
  const body = switchStoreBody(storeId);
  if (!body) {
    return { ok: false, status: 400, message: storeFailureMessage(400, 'switch') };
  }
  try {
    const response = await customInstance<{ data: unknown; status: number }>(`${API_URL}/auth/stores/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!isSuccessStatus(response.status)) {
      return { ok: false, status: response.status, message: storeFailureMessage(response.status, 'switch') };
    }
    const parsed = parseActiveStore(response.data, fallbackName);
    if (!parsed) {
      return { ok: false, status: response.status, message: storeFailureMessage(response.status, 'switch') };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, status: 0, message: storeFailureMessage(0, 'switch') };
  }
}

export async function createMerchantStore(name: string): Promise<StoreCallResult<ActiveStoreFields>> {
  const body = createStoreBody(name);
  if (!body) {
    const read = readAppName(name);
    return {
      ok: false,
      status: 400,
      message: read.ok ? storeFailureMessage(400, 'create') : read.message,
    };
  }
  try {
    const response = await customInstance<{ data: unknown; status: number }>(`${API_URL}/auth/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!isSuccessStatus(response.status)) {
      return { ok: false, status: response.status, message: storeFailureMessage(response.status, 'create') };
    }
    const parsed = parseActiveStore(response.data, createdStoreName(response.data) || body.name);
    if (!parsed) {
      return { ok: false, status: response.status, message: storeFailureMessage(response.status, 'create') };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, status: 0, message: storeFailureMessage(0, 'create') };
  }
}

/** Load the destination as a new document so the previous app's memory is dropped. */
export function openAppDestination(path: typeof SWITCH_APP_PATH | typeof NEW_APP_PATH): void {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}
