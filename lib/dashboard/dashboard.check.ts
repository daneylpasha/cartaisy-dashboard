import assert from 'node:assert/strict';
import { normalizeSyncStatus } from '../onboarding/normalizers.ts';
import {
  entryNeedsShopifyStatus,
  isDashboardIndex,
  refererPathname,
  resolveEntry,
  shopifyConnectedFromStatus,
} from './entry.ts';
import {
  activityLine,
  brandingLooksSaved,
  catalogRow,
  catalogSyncCopy,
  describeBuild,
  formatTimeAgo,
  moduleSummary,
  nextSetupAction,
  setupChecklist,
} from './homeModel.ts';
import { pageTitle } from './pageTitle.ts';

const disconnected = {
  pathname: '/dashboard',
  isAuthenticated: true,
  isAuthRoute: false,
  hasEntryCookie: true,
  shopifyConnected: false as boolean | null,
  refererPath: null as string | null,
};

assert.equal(
  resolveEntry({ ...disconnected, isAuthenticated: false, isAuthRoute: true, hasEntryCookie: false }).entryCookie,
  'set'
);
assert.equal(
  resolveEntry({ ...disconnected, isAuthenticated: false, isAuthRoute: true }).redirectTo,
  null
);

assert.equal(
  resolveEntry({ ...disconnected, isAuthRoute: true, hasEntryCookie: false, pathname: '/login' }).redirectTo,
  '/dashboard/onboarding'
);
assert.equal(
  resolveEntry({
    ...disconnected,
    isAuthRoute: true,
    pathname: '/login',
    shopifyConnected: true,
  }).redirectTo,
  '/dashboard'
);
assert.equal(
  resolveEntry({
    ...disconnected,
    isAuthRoute: true,
    pathname: '/signup',
    shopifyConnected: null,
  }).redirectTo,
  '/dashboard'
);

assert.equal(resolveEntry(disconnected).redirectTo, '/dashboard/onboarding');
assert.equal(resolveEntry({ ...disconnected, shopifyConnected: true }).redirectTo, null);
assert.equal(resolveEntry({ ...disconnected, shopifyConnected: true }).entryCookie, 'clear');
assert.equal(resolveEntry({ ...disconnected, shopifyConnected: null }).redirectTo, null);

assert.equal(
  resolveEntry({ ...disconnected, refererPath: '/dashboard/onboarding' }).redirectTo,
  null,
  'Exit setup must not bounce back into the wizard'
);
assert.equal(
  resolveEntry({ ...disconnected, pathname: '/dashboard/settings' }).redirectTo,
  null,
  'Deep links stay on their page'
);
assert.equal(
  resolveEntry({ ...disconnected, pathname: '/dashboard/onboarding', refererPath: '/signup' }).redirectTo,
  null
);
assert.equal(
  resolveEntry({
    ...disconnected,
    hasEntryCookie: false,
    refererPath: '/login',
  }).redirectTo,
  '/dashboard/onboarding'
);
assert.equal(
  resolveEntry({ ...disconnected, hasEntryCookie: false, refererPath: null }).redirectTo,
  null,
  'A later visit to Home stays on Home'
);

assert.equal(refererPathname('https://evil.example/dashboard/onboarding', 'https://cartaisy-dashboard.vercel.app'), null);
assert.equal(
  refererPathname('https://cartaisy-dashboard.vercel.app/login?next=/', 'https://cartaisy-dashboard.vercel.app'),
  '/login'
);
assert.equal(isDashboardIndex('/dashboard/'), true);
assert.equal(isDashboardIndex('/dashboard/settings'), false);

assert.equal(
  entryNeedsShopifyStatus({
    pathname: '/dashboard/orders',
    isAuthRoute: false,
    hasEntryCookie: true,
    refererPath: '/login',
  }),
  false
);
assert.equal(
  entryNeedsShopifyStatus({
    pathname: '/dashboard',
    isAuthRoute: false,
    hasEntryCookie: true,
    refererPath: null,
  }),
  true
);
assert.equal(
  entryNeedsShopifyStatus({
    pathname: '/dashboard',
    isAuthRoute: false,
    hasEntryCookie: true,
    refererPath: '/dashboard/onboarding',
  }),
  false
);

assert.equal(
  shopifyConnectedFromStatus({ success: true, data: { isConnected: false, shop: null } }, true),
  false
);
assert.equal(
  shopifyConnectedFromStatus(
    { success: true, data: { isConnected: true, shop: 'northline.myshopify.com', accessToken: 'shpat_secret' } },
    true
  ),
  true
);
assert.equal(shopifyConnectedFromStatus({ success: false }, true), null);
assert.equal(shopifyConnectedFromStatus(null, false), null);

const steps = setupChecklist(true);
assert.equal(steps.filter((step) => step.state === 'current').length, 1);
assert.equal(steps[0].state, 'current');
assert.equal(steps[0].action, 'Connect Shopify');
assert.equal(steps[1].state, 'done');
assert.equal(steps[2].state, 'upcoming');
assert.equal(steps[3].state, 'upcoming');
assert.equal(setupChecklist(false)[1].state, 'upcoming');
assert.equal(setupChecklist(null)[1].state, 'upcoming');

assert.equal(
  brandingLooksSaved({ logoUrl: null, primaryColor: '#FF6B6B', secondaryColor: '' }),
  false
);
assert.equal(
  brandingLooksSaved({ logoUrl: 'https://cdn.example/logo.png', primaryColor: '#FF6B6B', secondaryColor: '' }),
  true
);
assert.equal(brandingLooksSaved(null), null);

assert.equal(nextSetupAction({ brandingSaved: false, build: 'none' })?.href, '/dashboard/onboarding?step=brand');
assert.equal(nextSetupAction({ brandingSaved: true, build: 'none' })?.href, '/dashboard/onboarding?step=preview');
assert.equal(nextSetupAction({ brandingSaved: true, build: 'present' }), null);
assert.equal(nextSetupAction({ brandingSaved: false, build: 'present' }), null);
assert.equal(nextSetupAction({ brandingSaved: true, build: 'unknown' }), null);

const lastSyncOnly = normalizeSyncStatus({ data: { lastSyncAt: '2026-09-23T00:00:00.000Z' } }, true);
assert.equal(catalogSyncCopy(lastSyncOnly).label, 'Could not check');
assert.equal(catalogSyncCopy({ ...lastSyncOnly, state: 'succeeded', eligibleForBuild: true }).label, 'Synced');
assert.equal(
  catalogRow({ state: 'succeeded', detail: null, eligibleForBuild: true, eligibilityReason: null }, 0, 0).detail,
  'No products or orders in the catalog yet.'
);

assert.equal(describeBuild({ kind: 'error' }).label, 'Could not check');
assert.equal(describeBuild({ kind: 'ok', requests: [] }).label, 'No build requested');
const described = describeBuild({
  kind: 'ok',
  requests: [
    {
      id: '507f1f77bcf86cd799439011',
      platforms: {
        android: { status: 'building' },
        ios: { status: 'waiting_on_merchant' },
      },
      accessNotes: null,
    },
  ],
});
assert.equal(described.state, 'present');
assert.equal(described.label.includes('Active'), false);
assert.match(described.label, /Android · Building/);
assert.match(described.label, /Waiting on Apple/);

assert.deepEqual(moduleSummary(null), { kind: 'unknown' });
assert.deepEqual(moduleSummary({ carouselCount: 0, promoBannerCount: 0 }), { kind: 'empty' });
assert.deepEqual(moduleSummary({ carouselCount: 2, promoBannerCount: 0, categoryGridCount: 1 }), {
  kind: 'counts',
  total: 3,
  rows: [
    { label: 'Carousels', count: 2 },
    { label: 'Category grids', count: 1 },
  ],
});

assert.equal(activityLine('create', 'Summer carousel', 'carousel'), 'Created Summer carousel');
assert.equal(activityLine('update', null, 'promo'), 'Updated promo');
assert.equal(formatTimeAgo(new Date(1_700_000_000_000).toISOString(), 1_700_000_000_000 + 30_000), 'Just now');

assert.equal(pageTitle('/dashboard'), 'Home');
assert.equal(pageTitle('/dashboard/orders/abc'), 'Orders');
assert.equal(pageTitle('/dashboard/app-builder/preview'), 'App builder');
assert.equal(pageTitle('/dashboard/settings/compliance'), 'Compliance');
assert.equal(pageTitle('/dashboard/marketing/push-notifications'), 'Push notifications');
assert.equal(pageTitle('/dashboard/admin/build-requests'), 'Build requests');

console.log('dashboard checks passed');
