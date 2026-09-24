import { listBuildRequests, fetchCatalogSync } from '@/lib/build/client';
import { API_URL, tokenStorage } from '@/lib/api/mutator/custom-instance';
import { fetchBranding } from '@/lib/onboarding/branding';
import { normalizeCatalog, UNAVAILABLE_SYNC } from '@/lib/onboarding/normalizers';
import {
  activityLine,
  brandingLooksSaved,
  catalogRow,
  describeBuild,
  formatTimeAgo,
  moduleSummary,
  nextSetupAction,
  type BrandingSaved,
  type ModuleSummary,
  type NextSetupAction,
} from '@/lib/dashboard/homeModel';

export interface HomeActivity {
  id: string;
  label: string;
  time: string;
}

export interface ConnectedHomeFacts {
  syncLabel: string;
  syncDetail: string | null;
  buildLabel: string;
  buildDetail: string | null;
  buildState: 'unknown' | 'none' | 'present';
  productCount: number | null;
  orderCount: number | null;
  modules: ModuleSummary;
  activity: HomeActivity[] | null;
  next: NextSetupAction | null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function loadBrandingSaved(storeId: string | undefined): Promise<BrandingSaved> {
  const token = tokenStorage.getToken();
  if (!storeId || !token) return null;
  const draft = await fetchBranding(storeId, token);
  if (!draft) return null;
  return brandingLooksSaved({
    logoUrl: draft.logoUrl,
    primaryColor: draft.primaryColor,
    secondaryColor: draft.secondaryColor,
  });
}

async function loadOverviewCounts(token: string): Promise<{ productCount: number | null; orderCount: number | null }> {
  try {
    const response = await fetch(`${API_URL}/shopify/overview`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const body = await readJson(response);
    return normalizeCatalog(body, response.ok);
  } catch {
    return { productCount: null, orderCount: null };
  }
}

async function loadModuleStats(): Promise<ModuleSummary> {
  try {
    const response = await fetch('/api/store/stats');
    const body = asRecord(await readJson(response));
    if (!response.ok || !body) return { kind: 'unknown' };
    const data = asRecord(body.data);
    return moduleSummary(data);
  } catch {
    return { kind: 'unknown' };
  }
}

async function loadActivity(now: number): Promise<HomeActivity[] | null> {
  try {
    const response = await fetch('/api/activity?limit=4');
    const body = asRecord(await readJson(response));
    if (!response.ok || !body) return null;
    const data = asRecord(body.data);
    const list = Array.isArray(data?.activities) ? data.activities : null;
    if (!list) return null;
    const lines: HomeActivity[] = [];
    list.forEach((item, index) => {
      const record = asRecord(item);
      if (!record) return;
      const action = typeof record.action === 'string' ? record.action : '';
      const resourceName = typeof record.resourceName === 'string' ? record.resourceName : null;
      const resourceType = typeof record.resourceType === 'string' ? record.resourceType : null;
      const createdAt = typeof record.createdAt === 'string' ? record.createdAt : '';
      const label = activityLine(action, resourceName, resourceType);
      const time = formatTimeAgo(createdAt, now);
      if (!label || !time) return;
      const id = typeof record.id === 'string' ? record.id : `${action}-${index}`;
      lines.push({ id, label, time });
    });
    return lines;
  } catch {
    return null;
  }
}

export async function loadConnectedHome(storeId: string | undefined): Promise<ConnectedHomeFacts> {
  const token = tokenStorage.getToken();
  const now = Date.now();
  if (!token) {
    const sync = catalogRow(UNAVAILABLE_SYNC, null, null);
    return {
      syncLabel: sync.label,
      syncDetail: sync.detail,
      buildLabel: 'Could not check',
      buildDetail: null,
      buildState: 'unknown',
      productCount: null,
      orderCount: null,
      modules: { kind: 'unknown' },
      activity: null,
      next: null,
    };
  }

  const [syncGate, builds, counts, brandingSaved, modules, activity] = await Promise.all([
    fetchCatalogSync(token),
    listBuildRequests(token),
    loadOverviewCounts(token),
    loadBrandingSaved(storeId),
    loadModuleStats(),
    loadActivity(now),
  ]);

  const sync = catalogRow(syncGate, counts.productCount, counts.orderCount);
  const build = describeBuild(builds.kind === 'ok' ? builds : { kind: 'error' });

  return {
    syncLabel: sync.label,
    syncDetail: sync.detail,
    buildLabel: build.label,
    buildDetail: build.detail,
    buildState: build.state,
    productCount: counts.productCount,
    orderCount: counts.orderCount,
    modules,
    activity,
    next: nextSetupAction({ brandingSaved, build: build.state }),
  };
}
