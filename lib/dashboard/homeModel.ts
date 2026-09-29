import {
  outcomeCopy,
  platformStatusLabel,
  requestedPlatforms,
  shouldPollBuildRequest,
  type BuildRequest,
} from '../build/contract.ts';
import { readyInstallsFromList } from '../build/installPreview.ts';
import { catalogBlockCopy } from '../shopify/catalogBlock.ts';
import type { SyncGate } from '../onboarding/types.ts';

/** Matches `DEFAULT_PRIMARY_COLOR` in the branding helper. A saved default alone is not brand evidence. */
const UNSAVED_PRIMARY = '#ff6b6b';

export type BrandingSaved = boolean | null;

export interface BrandingEvidence {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export function brandingLooksSaved(input: BrandingEvidence | null): BrandingSaved {
  if (!input) return null;
  if (input.logoUrl) return true;
  if (input.secondaryColor.trim()) return true;
  const primary = input.primaryColor.trim().toLowerCase();
  if (primary && primary !== UNSAVED_PRIMARY) return true;
  return false;
}

export interface ChecklistStep {
  id: 'connect' | 'brand' | 'preview' | 'ready';
  title: string;
  detail: string;
  href: string;
  state: 'current' | 'done' | 'upcoming';
  action: string | null;
}

/**
 * Home checklist for a store that is not connected.
 * Connect stays the current step. Preview is never marked done (it is not stored).
 * Build is never marked done from this screen: it cannot be eligible while Shopify is disconnected.
 */
export function setupChecklist(brandingSaved: BrandingSaved): ChecklistStep[] {
  return [
    {
      id: 'connect',
      title: 'Connect Shopify',
      detail: 'The store this app sells from.',
      href: '/dashboard/onboarding?step=connect',
      state: 'current',
      action: 'Connect Shopify',
    },
    {
      id: 'brand',
      title: 'Branding',
      detail: 'Name, logo, and colors.',
      href: '/dashboard/onboarding?step=brand',
      state: brandingSaved === true ? 'done' : 'upcoming',
      action: null,
    },
    {
      id: 'preview',
      title: 'Preview',
      detail: 'A starting home screen.',
      href: '/dashboard/onboarding?step=preview',
      state: 'upcoming',
      action: null,
    },
    {
      id: 'ready',
      title: 'Build my app',
      detail: 'Android and iOS, after the catalog sync succeeds.',
      href: '/dashboard/onboarding?step=ready',
      state: 'upcoming',
      action: null,
    },
  ];
}

export interface NextSetupAction {
  title: string;
  body: string;
  action: string;
  href: string;
}

export function nextSetupAction(input: {
  brandingSaved: BrandingSaved;
  build: 'unknown' | 'none' | 'present';
}): NextSetupAction | null {
  if (input.build === 'present') return null;
  if (input.brandingSaved === false) {
    return {
      title: 'Confirm your brand',
      body: 'Name, logo, and colors are the next step in setup.',
      action: 'Continue',
      href: '/dashboard/onboarding?step=brand',
    };
  }
  if (input.brandingSaved === true && input.build === 'none') {
    return {
      title: 'Preview, then build',
      body: 'Look at the starting home, then request Android and iOS.',
      action: 'Preview',
      href: '/dashboard/onboarding?step=preview',
    };
  }
  if (input.build === 'none') {
    return {
      title: 'Continue setup',
      body: 'Branding, preview, and build are in the setup guide.',
      action: 'Open setup',
      href: '/dashboard/onboarding?step=brand',
    };
  }
  return null;
}

export function catalogSyncCopy(sync: SyncGate): { label: string; detail: string | null } {
  if (sync.block === 'reconnect') {
    return { label: 'Reconnect Shopify', detail: catalogBlockCopy('reconnect').support };
  }
  if (sync.block === 'billing') {
    return { label: 'Billing needs attention', detail: catalogBlockCopy('billing').support };
  }
  switch (sync.state) {
    case 'succeeded':
      return { label: 'Synced', detail: null };
    case 'in_progress':
      return { label: 'Syncing', detail: null };
    case 'failed':
      return { label: 'Sync did not finish', detail: sync.detail };
    case 'not_started':
      return { label: 'Not synced yet', detail: null };
    case 'unavailable':
      return { label: 'Could not check', detail: null };
  }
}

export function catalogRow(
  sync: SyncGate,
  productCount: number | null,
  orderCount: number | null
): { label: string; detail: string | null } {
  const base = catalogSyncCopy(sync);
  if (base.detail) return base;
  if (sync.state === 'succeeded' && productCount === 0 && orderCount === 0) {
    return { label: base.label, detail: 'No products or orders in the catalog yet.' };
  }
  return base;
}

/** The build Home describes: an in-flight request, otherwise the first in the list. */
export function focusBuildRequest(requests: BuildRequest[]): BuildRequest | null {
  if (requests.length === 0) return null;
  return requests.find((request) => shouldPollBuildRequest(request)) ?? requests[0] ?? null;
}

export function describeBuild(
  list: { kind: 'ok'; requests: BuildRequest[] } | { kind: 'error' }
): { state: 'unknown' | 'none' | 'present'; label: string; detail: string | null } {
  if (list.kind === 'error') {
    return { state: 'unknown', label: 'Could not check', detail: null };
  }
  const active = focusBuildRequest(list.requests);
  if (!active) {
    return { state: 'none', label: 'No build requested', detail: null };
  }
  const parts = requestedPlatforms(active).map((platform) => {
    const name = platform === 'android' ? 'Android' : 'iOS';
    return `${name} · ${platformStatusLabel(platform, active.platforms[platform].status)}`;
  });
  return {
    state: 'present',
    label: parts.length > 0 ? parts.join(' · ') : 'Build requested',
    detail: outcomeCopy(active),
  };
}

/**
 * Home card while the newest build is queued or building and nothing is ready to scan.
 * The newest request is the first list item, the same one Build my app opens.
 * A ready public install URL keeps Scan to install instead.
 * Reconnect and billing stay their own notices.
 * Failed, waiting, and ready-without-a-link do not pretend a build is moving.
 */
/** Newest request has a platform queued or building. Does not apply the Home card gates. */
export function newestPreviewBuilding(requests: BuildRequest[]): boolean {
  const latest = requests[0];
  if (!latest) return false;
  return (['android', 'ios'] as const).some((platform) => {
    const status = latest.platforms[platform].status;
    return status === 'queued' || status === 'building';
  });
}

export function homePreviewBuilding(input: { requests: BuildRequest[]; catalogBlocked: boolean }): boolean {
  if (input.catalogBlocked) return false;
  if (readyInstallsFromList(input.requests).length > 0) return false;
  return newestPreviewBuilding(input.requests);
}

export interface ModuleRow {
  label: string;
  count: number;
}

export type ModuleSummary =
  | { kind: 'unknown' }
  | { kind: 'empty' }
  | { kind: 'counts'; total: number; rows: ModuleRow[] };

const MODULE_FIELDS: { key: string; label: string }[] = [
  { key: 'carouselCount', label: 'Carousels' },
  { key: 'promoBannerCount', label: 'Promo banners' },
  { key: 'calloutBannerCount', label: 'Callout banners' },
  { key: 'categoryGridCount', label: 'Category grids' },
  { key: 'collectionDisplayCount', label: 'Collection displays' },
  { key: 'collectionShowcaseCount', label: 'Collection showcases' },
  { key: 'categoryCollectionGridCount', label: 'Category collection grids' },
];

export function moduleSummary(stats: Record<string, unknown> | null): ModuleSummary {
  if (!stats) return { kind: 'unknown' };
  const rows: ModuleRow[] = [];
  let total = 0;
  for (const field of MODULE_FIELDS) {
    const value = stats[field.key];
    const count = typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    total += count;
    if (count > 0) rows.push({ label: field.label, count });
  }
  if (total === 0) return { kind: 'empty' };
  return { kind: 'counts', total, rows };
}

export function activityLine(
  action: string,
  resourceName: string | null,
  resourceType: string | null
): string {
  const name = (resourceName || resourceType || 'item').trim() || 'item';
  switch (action) {
    case 'create':
      return `Created ${name}`;
    case 'update':
      return `Updated ${name}`;
    case 'delete':
      return `Deleted ${name}`;
    case 'activate':
      return `Activated ${name}`;
    case 'deactivate':
      return `Deactivated ${name}`;
    default:
      return name;
  }
}

export function formatTimeAgo(iso: string, now: number): string {
  const date = new Date(iso);
  const time = date.getTime();
  if (Number.isNaN(time)) return '';
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
