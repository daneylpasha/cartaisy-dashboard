import { listBuildRequests, fetchCatalogSync } from '@/lib/build/client';
import { readyInstallsFromList, type ReadyInstall } from '@/lib/build/installPreview';
import { fetchCollectionsCatalogBlock } from '@/lib/api/shopifyConnection';
import { API_URL, tokenStorage } from '@/lib/api/mutator/custom-instance';
import { fetchBranding } from '@/lib/onboarding/branding';
import { normalizeCatalog, UNAVAILABLE_SYNC } from '@/lib/onboarding/normalizers';
import { catalogBlockFromPayload, withCatalogBlock } from '@/lib/shopify/catalogBlock';
import type { ShopifyCatalogBlockKind } from '@/lib/onboarding/types';
import {
  activityLine,
  brandingLooksSaved,
  catalogRow,
  describeBuild,
  formatTimeAgo,
  homePreviewBuilding,
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
  catalogBlock: ShopifyCatalogBlockKind | null;
  /** Ready platforms with a public https install URL. Empty hides the install card. */
  installs: ReadyInstall[];
  /**
   * Newest request is queued or building, and no ready public install URL exists.
   * Stays false when Scan to install is shown, and when Shopify needs reconnect or billing.
   */
  previewBuilding: boolean;
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

async function loadOverviewCounts(
  token: string
): Promise<{ productCount: number | null; orderCount: number | null; block: ShopifyCatalogBlockKind | null }> {
  try {
    const response = await fetch(`${API_URL}/shopify/overview`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const body = await readJson(response);
    return {
      ...normalizeCatalog(body, response.ok),
      block: catalogBlockFromPayload(body, response.ok, response.status),
    };
  } catch {
    return { productCount: null, orderCount: null, block: null };
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
      catalogBlock: null,
      installs: [],
      previewBuilding: false,
    };
  }

  const [syncGate, builds, counts, collectionsBlock, brandingSaved, modules, activity] = await Promise.all([
    fetchCatalogSync(token),
    listBuildRequests(token),
    loadOverviewCounts(token),
    fetchCollectionsCatalogBlock(),
    loadBrandingSaved(storeId),
    loadModuleStats(),
    loadActivity(now),
  ]);

  const gated = withCatalogBlock(withCatalogBlock(syncGate, counts.block), collectionsBlock);
  const sync = catalogRow(
    gated,
    gated.block ? null : counts.productCount,
    gated.block ? null : counts.orderCount
  );
  const buildList = builds.kind === 'ok' ? builds : { kind: 'error' as const };
  const build = describeBuild(buildList);
  const installs = buildList.kind === 'ok' ? readyInstallsFromList(buildList.requests) : [];
  const previewBuilding =
    buildList.kind === 'ok' &&
    homePreviewBuilding({ requests: buildList.requests, catalogBlocked: gated.block != null });

  return {
    syncLabel: sync.label,
    syncDetail: sync.detail,
    buildLabel: build.label,
    buildDetail: build.detail,
    buildState: build.state,
    productCount: gated.block ? null : counts.productCount,
    orderCount: gated.block ? null : counts.orderCount,
    modules,
    activity,
    next: nextSetupAction({ brandingSaved, build: build.state }),
    catalogBlock: gated.block ?? null,
    installs,
    previewBuilding,
  };
}
