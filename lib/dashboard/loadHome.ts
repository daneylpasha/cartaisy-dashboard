import { listBuildRequests, fetchCatalogSync } from '@/lib/build/client';
import type { BuildRequest } from '@/lib/build/contract';
import { readyInstallsFromList, type ReadyInstall } from '@/lib/build/installPreview';
import { listStoreSubmits } from '@/lib/storeSubmit/client';
import { homeSubmitNotices, type HomeSubmitNotice } from '@/lib/storeSubmit/contract';
import { fetchCollectionsCatalogBlock } from '@/lib/api/shopifyConnection';
import { API_URL, tokenStorage } from '@/lib/api/mutator/custom-instance';
import { merchantDisplayName } from '@/lib/onboarding/appName';
import { fetchBranding } from '@/lib/onboarding/branding';
import { readShellBranding } from '@/lib/dashboard/shellBranding';
import { persistedBrandImageUrl } from '@/lib/onboarding/brandAssets';
import { normalizeCatalog, UNAVAILABLE_SYNC } from '@/lib/onboarding/normalizers';
import { catalogBlockFromPayload, withCatalogBlock } from '@/lib/shopify/catalogBlock';
import type { ShopifyCatalogBlockKind } from '@/lib/onboarding/types';
import {
  activityLine,
  brandingLooksSaved,
  catalogRow,
  describeBuild,
  focusBuildRequest,
  formatTimeAgo,
  homePreviewBuilding,
  newestPreviewBuilding,
  moduleSummary,
  nextSetupAction,
  type BrandingSaved,
  type ModuleSummary,
  type NextSetupAction,
} from '@/lib/dashboard/homeModel';
import { homeLayoutOverviewFromPayload, type HomeLayoutOverview } from '@/lib/homeLayout/publish';
import { fetchStoreCredentials } from '@/lib/storeCredentials/client';
import type { SyncGateState } from '@/lib/onboarding/types';
import type { GoLiveAccountsRead, GoLiveBrandRead, GoLivePreviewPhase } from '@/lib/dashboard/goLive';

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
  /** Store submits for the focused build. Empty hides the submit notes. */
  submitNotices: HomeSubmitNotice[];
  /** False when the submit list failed. An empty list is not a failed read. */
  submitKnown: boolean;
  /**
   * Home layout publish state from GET /api/home-layout.
   * Null when that read fails or the status is unrecognized. Do not invent one.
   */
  homeLayout: HomeLayoutOverview | null;
  syncState: SyncGateState;
  /** True only for the build-eligibility contract. Null when sync could not be read. */
  catalogEligible: boolean | null;
  brand: GoLiveBrandRead;
  accounts: GoLiveAccountsRead;
  /** Ready install wins over a newer queued request. A failed list stays unknown. */
  previewPhase: GoLivePreviewPhase;
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

const UNKNOWN_BRAND: GoLiveBrandRead = { known: false, displayName: null, hasIcon: false };
const UNKNOWN_ACCOUNTS: GoLiveAccountsRead = { known: false, apple: null, google: null };

export async function loadBrandingSaved(storeId: string | undefined): Promise<BrandingSaved> {
  const read = await loadBrandRead(storeId);
  return read.saved;
}

export async function loadBrandRead(storeId: string | undefined): Promise<GoLiveBrandRead & { saved: BrandingSaved }> {
  const token = tokenStorage.getToken();
  if (!storeId || !token) return { ...UNKNOWN_BRAND, saved: null };
  // The shell already owns this store's branding GET. Reuse that record.
  const draft = await readShellBranding(storeId, token, fetchBranding);
  if (!draft) return { ...UNKNOWN_BRAND, saved: null };
  return {
    saved: brandingLooksSaved({
      logoUrl: draft.logoUrl,
      primaryColor: draft.primaryColor,
      secondaryColor: draft.secondaryColor,
    }),
    known: true,
    displayName: merchantDisplayName(draft.appName),
    hasIcon: persistedBrandImageUrl(draft.iconUrl) != null,
  };
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

async function loadHomeLayout(): Promise<HomeLayoutOverview | null> {
  try {
    const response = await fetch('/api/home-layout');
    if (!response.ok) return null;
    return homeLayoutOverviewFromPayload(await readJson(response));
  } catch {
    return null;
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
      submitNotices: [],
      submitKnown: false,
      homeLayout: null,
      syncState: 'unavailable',
      catalogEligible: null,
      brand: UNKNOWN_BRAND,
      accounts: UNKNOWN_ACCOUNTS,
      previewPhase: 'unknown',
    };
  }

  const [syncGate, builds, counts, collectionsBlock, brandRead, modules, activity, homeLayout, credentials] =
    await Promise.all([
      fetchCatalogSync(token),
      listBuildRequests(token),
      loadOverviewCounts(token),
      fetchCollectionsCatalogBlock(),
      loadBrandRead(storeId),
      loadModuleStats(),
      loadActivity(now),
      loadHomeLayout(),
      fetchStoreCredentials(token),
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
  const previewPhase: GoLivePreviewPhase =
    buildList.kind === 'ok'
      ? installs.length > 0
        ? 'ready'
        : newestPreviewBuilding(buildList.requests)
          ? 'building'
          : 'none'
      : 'unknown';
  const submit = await loadSubmitRead(token, buildList.kind === 'ok' ? buildList.requests : null);

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
    next: nextSetupAction({ brandingSaved: brandRead.saved, build: build.state }),
    catalogBlock: gated.block ?? null,
    installs,
    previewBuilding,
    submitNotices: submit.notices,
    submitKnown: submit.known,
    homeLayout,
    syncState: gated.state,
    catalogEligible: gated.state === 'unavailable' ? null : gated.eligibleForBuild,
    brand: { known: brandRead.known, displayName: brandRead.displayName, hasIcon: brandRead.hasIcon },
    accounts: credentials.ok
      ? {
          known: true,
          apple: credentials.credentials.apple.status,
          google: credentials.credentials.google.status,
        }
      : UNKNOWN_ACCOUNTS,
    previewPhase,
  };
}

async function loadSubmitRead(
  token: string,
  requests: BuildRequest[] | null
): Promise<{ known: boolean; notices: HomeSubmitNotice[] }> {
  if (!requests) return { known: false, notices: [] };
  const active = focusBuildRequest(requests);
  if (!active) return { known: true, notices: [] };
  const listed = await listStoreSubmits(token, active.id);
  if (!listed.ok) return { known: false, notices: [] };
  return { known: true, notices: homeSubmitNotices(listed.jobs) };
}
