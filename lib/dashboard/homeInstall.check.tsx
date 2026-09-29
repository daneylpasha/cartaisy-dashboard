import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectedHome } from '@/components/dashboard/home/ConnectedHome';
import { HomeInstallCard } from '@/components/dashboard/home/HomeInstallCard';
import type { BuildRequest, PlatformStatus } from '@/lib/build/contract';
import { readyInstallsFromList, type ReadyInstall } from '@/lib/build/installPreview';
import type { ConnectedHomeFacts } from '@/lib/dashboard/loadHome';
import { homePreviewBuilding } from '@/lib/dashboard/homeModel';
import { homeLayoutOverviewFromPayload } from '@/lib/homeLayout/publish';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const loadHomeSource = source('./loadHome.ts');
const cardSource = source('../../components/dashboard/home/HomeInstallCard.tsx');
const liveSource = source('./goLive.ts');
const stripSource = source('../../components/dashboard/home/GoLiveStrip.tsx');
const homeSource = source('../../components/dashboard/home/ConnectedHome.tsx');
const setupSource = source('../../components/dashboard/home/SetupHome.tsx');
const boardSource = source('../../components/build/InstallQrBoard.tsx');
const previewSource = source('../build/installPreview.ts');

assert.match(loadHomeSource, /readyInstallsFromList/);
assert.match(loadHomeSource, /homePreviewBuilding/);
assert.match(loadHomeSource, /fetchStoreCredentials/);
assert.match(loadHomeSource, /loadBrandRead/);
assert.match(loadHomeSource, /readShellBranding\(storeId, token, fetchBranding\)/);
assert.doesNotMatch(loadHomeSource, /await fetchBranding\(/);
assert.match(homeSource, /GoLiveStrip/);
assert.doesNotMatch(homeSource, /HomeInstallCard|HomePreviewBuildingCard|HomeSubmitCard|HomeLayoutStatus/);
assert.match(stripSource, /HomeInstallCard/);
assert.match(stripSource, /data-go-live-cta/);
assert.match(cardSource, /BUILD_MY_APP_HREF/);
assert.match(liveSource, /Your preview is building/);
assert.doesNotMatch(cardSource, /EXPO_TOKEN|easBuildId|access_token|shpat_|api\.qrserver|chart\.googleapis/);
assert.doesNotMatch(liveSource, /EXPO_TOKEN|easBuildId|access_token|shpat_|api\.qrserver|chart\.googleapis|Cartaisy|EAS/);
assert.doesNotMatch(stripSource, /EXPO_TOKEN|easBuildId|access_token|shpat_|api\.qrserver|chart\.googleapis|Cartaisy|EAS/);
assert.doesNotMatch(cardSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(liveSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(cardSource, /INSTALL_QR_WAIT_COPY|installQrSlots/);
assert.doesNotMatch(stripSource, /INSTALL_QR_WAIT_COPY|installQrSlots/);
assert.doesNotMatch(setupSource, /GoLiveStrip|data-go-live|data-home-preview-building|Scan to install/);
assert.match(boardSource, /INSTALL_QR_WAIT_COPY/);
assert.match(previewSource, /export function showsBrandMock/);

const ANDROID = 'https://expo.dev/accounts/northwind/builds/android';
const IOS = 'https://u.expo.dev/artifact/ios';

function request(
  id: string,
  android: PlatformStatus | 'unknown',
  ios: PlatformStatus | 'unknown',
  urls?: { android?: string | null; ios?: string | null }
): BuildRequest {
  return {
    id,
    platforms: {
      android: { status: android, installUrl: urls?.android ?? null },
      ios: { status: ios, installUrl: urls?.ios ?? null },
    },
    accessNotes: null,
  };
}

function facts(installs: ReadyInstall[], extra?: Partial<ConnectedHomeFacts>): ConnectedHomeFacts {
  const shown = extra?.installs ?? installs;
  const previewBuilding = extra?.previewBuilding ?? false;
  const buildState = extra?.buildState ?? 'present';
  return {
    syncLabel: 'Synced',
    syncDetail: null,
    buildLabel: 'Android · Ready',
    buildDetail: null,
    productCount: 12,
    orderCount: 3,
    modules: { kind: 'empty' },
    activity: null,
    next: null,
    catalogBlock: null,
    submitNotices: [],
    submitKnown: true,
    homeLayout: null,
    syncState: 'succeeded',
    catalogEligible: true,
    brand: { known: true, displayName: 'Northwind', hasIcon: true },
    accounts: { known: true, apple: 'missing', google: 'missing' },
    ...extra,
    installs: shown,
    previewBuilding,
    buildState,
    previewPhase:
      extra?.previewPhase ??
      (shown.length > 0 ? 'ready' : buildState === 'unknown' ? 'unknown' : previewBuilding ? 'building' : 'none'),
  };
}

function home(installs: ReadyInstall[], extra?: Partial<ConnectedHomeFacts>): string {
  return renderToStaticMarkup(
    createElement(ConnectedHome, { storeName: 'Northwind', shop: 'northwind.myshopify.com', facts: facts(installs, extra) })
  );
}

const both = readyInstallsFromList([
  request('66f1c2e0a1b2c3d4e5f60718', 'ready', 'ready', { android: ANDROID, ios: IOS }),
]);
const ready = home(both);
assert.equal((ready.match(/data-home-install/g) ?? []).length, 1);
assert.equal((ready.match(/data-install-qr/g) ?? []).length, 2);
assert.match(ready, /Scan to install/);
assert.match(ready, /Android and iOS are ready/);
assert.match(ready, /larger ones/);
assert.match(ready, /Open Build/);
assert.equal(ready.includes(`href="${BUILD_MY_APP_HREF}"`), true);
assert.match(ready, /Go live/);
assert.equal((ready.match(/data-go-live-cta/g) ?? []).length, 1);
assert.match(ready, /No home sections yet/);
assert.equal(ready.includes(ANDROID), false);
assert.equal(ready.includes(IOS), false);
assert.equal(ready.includes('Cartaisy'), false);
assert.equal(ready.includes('shpat_'), false);
assert.equal(ready.includes('access_token'), false);
assert.equal(ready.includes('EXPO_TOKEN'), false);

const androidOnly = readyInstallsFromList([
  request('66f1c2e0a1b2c3d4e5f60719', 'ready', 'building', { android: ANDROID, ios: IOS }),
]);
const one = home(androidOnly, { previewBuilding: true });
assert.equal((one.match(/data-install-qr/g) ?? []).length, 1);
assert.match(one, /Android is ready/);
assert.match(one, /Scan to install/);
assert.equal(one.includes('iOS is ready'), false);
assert.equal(one.includes(ANDROID), false);
assert.equal(one.includes('data-home-preview-building'), false);
assert.equal(one.includes('Your preview is building'), false);

const buildingRequests = [
  request('66f1c2e0a1b2c3d4e5f6071a', 'building', 'queued', { android: ANDROID }),
  request('66f1c2e0a1b2c3d4e5f6071b', 'ready', 'ready'),
  request('66f1c2e0a1b2c3d4e5f6071c', 'failed', 'waiting_on_merchant', { ios: IOS }),
];
assert.equal(homePreviewBuilding({ requests: buildingRequests, catalogBlocked: false }), true);
const building = home(readyInstallsFromList(buildingRequests), {
  previewBuilding: true,
  buildLabel: 'Android · Building',
});
assert.equal((building.match(/data-home-preview-building/g) ?? []).length, 1);
assert.match(building, /Your preview is building/);
assert.match(building, /scannable install code will appear there/);
assert.match(building, /Open Build/);
assert.equal(building.includes(`href="${BUILD_MY_APP_HREF}"`), true);
assert.equal(building.includes('data-home-install'), false);
assert.equal(building.includes('data-install-qr'), false);
assert.equal(building.includes('Scan to install'), false);
assert.equal(building.includes(ANDROID), false);
assert.equal(building.includes(IOS), false);
assert.equal(building.includes('Cartaisy'), false);
assert.equal(building.includes('EAS'), false);
assert.equal(building.includes('shpat_'), false);
assert.match(building, /Connected to northwind.myshopify.com/);
assert.match(building, /Go live/);
assert.equal((building.match(/data-go-live-cta/g) ?? []).length, 1);

const preferScan = home(both, { previewBuilding: true });
assert.equal((preferScan.match(/data-home-install/g) ?? []).length, 1);
assert.equal(preferScan.includes('data-home-preview-building'), false);
assert.match(preferScan, /Scan to install/);
assert.equal(preferScan.includes('Your preview is building'), false);

const olderReady = [
  request('66f1c2e0a1b2c3d4e5f6071d', 'building', 'queued'),
  request('66f1c2e0a1b2c3d4e5f6071e', 'ready', 'not_requested', { android: ANDROID }),
];
assert.equal(homePreviewBuilding({ requests: olderReady, catalogBlocked: false }), false);

assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60721', 'queued', 'not_requested')],
    catalogBlocked: false,
  }),
  true
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60722', 'not_requested', 'building')],
    catalogBlocked: false,
  }),
  true
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60723', 'queued', 'failed')],
    catalogBlocked: false,
  }),
  true
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60724', 'failed', 'failed')],
    catalogBlocked: false,
  }),
  false
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60725', 'waiting_on_merchant', 'not_requested')],
    catalogBlocked: false,
  }),
  false
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60726', 'ready', 'not_requested')],
    catalogBlocked: false,
  }),
  false
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f60727', 'unknown', 'unknown')],
    catalogBlocked: false,
  }),
  false
);
assert.equal(homePreviewBuilding({ requests: [], catalogBlocked: false }), false);
assert.equal(
  homePreviewBuilding({
    requests: [
      request('66f1c2e0a1b2c3d4e5f60728', 'failed', 'not_requested'),
      request('66f1c2e0a1b2c3d4e5f60729', 'building', 'queued'),
    ],
    catalogBlocked: false,
  }),
  false
);
assert.equal(
  homePreviewBuilding({
    requests: [request('66f1c2e0a1b2c3d4e5f6072a', 'queued', 'building')],
    catalogBlocked: true,
  }),
  false
);

const quiet = home([], { previewBuilding: false, buildLabel: 'Android · Failed', buildDetail: 'Android did not finish. You can request it again.' });
assert.equal(quiet.includes('data-home-preview-building'), false);
assert.equal(quiet.includes('data-home-install'), false);
assert.equal(quiet.includes('Your preview is building'), false);
assert.equal(quiet.includes('Scan to install'), false);
assert.match(quiet, /Go live/);
assert.match(quiet, /Not ready/);

const billing = home([], { previewBuilding: false, catalogBlock: 'billing', buildLabel: 'Android · Queued' });
assert.equal(billing.includes('data-home-preview-building'), false);
assert.equal(billing.includes('Your preview is building'), false);
assert.equal((billing.match(/Shopify billing needs attention/g) ?? []).length, 1);
assert.equal((billing.match(/Syncing again will not change that/g) ?? []).length, 1);
assert.equal(billing.includes('This store needs an active Shopify plan'), false);
assert.match(billing, /Reconnect Shopify/);
assert.equal(billing.includes('Sync again'), false);
assert.equal((billing.match(/data-go-live-cta/g) ?? []).length, 0);
assert.equal((billing.match(/data-go-live-step=/g) ?? []).length, 7);
assert.match(billing, /data-go-live-count="1 of 7"/);

const qaBilling = home([], {
  previewBuilding: false,
  catalogBlock: 'billing',
  buildLabel: 'Could not check',
  catalogEligible: false,
  syncState: 'failed',
  syncLabel: 'Billing needs attention',
  brand: { known: true, displayName: null, hasIcon: false },
  homeLayout: {
    status: 'published',
    label: 'Published',
    detail: 'The installed app reads this section order under the home header.',
    needsPublish: false,
  },
  previewPhase: 'none',
});
assert.deepEqual(
  [...qaBilling.matchAll(/data-go-live-step="([^"]+)"/g)].map((match) => match[1]),
  ['shopify', 'catalog', 'brand', 'home', 'preview', 'accounts', 'submit']
);
assert.match(qaBilling, /data-go-live-count="1 of 7"/);
assert.match(qaBilling, /data-home-layout="published"/);
assert.match(qaBilling, /Name and icon needed/);
assert.match(qaBilling, /Store accounts/);
assert.match(qaBilling, />Submit</);
assert.equal((qaBilling.match(/Shopify billing needs attention/g) ?? []).length, 1);
assert.equal(qaBilling.includes('This store needs an active Shopify plan'), false);

const reconnect = home([], { previewBuilding: false, catalogBlock: 'reconnect', buildLabel: 'iOS · Building' });
assert.equal(reconnect.includes('data-home-preview-building'), false);
assert.equal(reconnect.includes('Your preview is building'), false);
assert.equal((reconnect.match(/Reconnect Shopify/g) ?? []).length, 1);
assert.equal((reconnect.match(/Shopify needs to be reconnected/g) ?? []).length, 1);
assert.equal(reconnect.includes('Reconnect to load this catalog again'), false);
assert.equal(reconnect.includes('Shopify billing needs attention'), false);

const unsafe = renderToStaticMarkup(
  createElement(HomeInstallCard, {
    installs: [
      { platform: 'android', label: 'Android', url: 'http://expo.dev/accounts/northwind/builds/android' },
      { platform: 'ios', label: 'iOS', url: 'https://user:pass@expo.dev/artifact' },
    ],
  })
);
assert.equal(unsafe, '');

const secret = renderToStaticMarkup(
  createElement(HomeInstallCard, {
    installs: [{ platform: 'android', label: 'Android', url: 'https://expo.dev/accounts/northwind/builds/shpat_secret' }],
  })
);
assert.equal(secret, '');

const mixed = renderToStaticMarkup(
  createElement(HomeInstallCard, {
    installs: [
      { platform: 'android', label: 'Android', url: `  ${ANDROID}  ` },
      { platform: 'ios', label: 'iOS', url: 'https://expo.dev/a?access_token=secret' },
    ],
  })
);
assert.equal((mixed.match(/data-install-qr/g) ?? []).length, 1);
assert.match(mixed, />Android</);
assert.equal(mixed.includes('>iOS<'), false);
assert.equal(mixed.includes(ANDROID), false);
assert.equal(mixed.includes('access_token'), false);

assert.equal(quiet.includes('data-home-layout'), false);
assert.equal(quiet.includes('Not published yet'), false);
assert.equal(quiet.includes('Publish home'), false);
assert.match(loadHomeSource, /\/api\/home-layout/);
assert.match(loadHomeSource, /if \(!response\.ok\) return null/);
assert.match(loadHomeSource, /homeLayoutOverviewFromPayload/);
assert.doesNotMatch(homeSource, /Cartaisy/);

const unpublishedHome = home([], {
  homeLayout: {
    status: 'not_published',
    label: 'Not published yet',
    detail: 'Nothing is saved as the section order yet. Publish home writes the order the installed app reads under its header.',
    needsPublish: true,
  },
});
assert.match(unpublishedHome, /data-home-layout="not_published"/);
assert.match(unpublishedHome, /Not published yet/);
assert.match(unpublishedHome, /Nothing is saved/);
assert.equal(unpublishedHome.includes('href="/dashboard/app-builder#publish-home"'), true);
assert.equal((unpublishedHome.match(/>Publish home</g) ?? []).length, 1);
assert.equal((unpublishedHome.match(/data-go-live-cta/g) ?? []).length, 1);
assert.equal(unpublishedHome.includes('Cartaisy'), false);

const draftHome = home([], {
  modules: { kind: 'counts', total: 2, rows: [{ label: 'Carousels', count: 1 }] },
  homeLayout: {
    status: 'draft',
    label: 'Draft',
    detail: 'These edits are not in the section order the installed app reads. It still uses the last published layout.',
    needsPublish: true,
  },
});
assert.match(draftHome, /data-home-layout="draft"/);
assert.match(draftHome, /Draft/);
assert.match(draftHome, /last published layout/);
assert.equal(draftHome.includes('href="/dashboard/app-builder#publish-home"'), true);

const offlineOverview = homeLayoutOverviewFromPayload({
  data: {
    status: 'draft',
    sections: [{ type: 'carousel', isVisible: true, position: 0 }],
    publishedSections: [],
    publishedAt: null,
  },
});
assert.ok(offlineOverview);
const offlineHome = home([], { homeLayout: offlineOverview });
assert.match(offlineHome, /data-home-layout="draft"/);
assert.match(offlineHome, /Draft/);
assert.match(offlineHome, /smart default/);
assert.equal(offlineHome.includes('href="/dashboard/app-builder#publish-home"'), true);
assert.equal((offlineHome.match(/>Publish home</g) ?? []).length, 1);
assert.equal(offlineHome.includes('shpat_'), false);
assert.equal(offlineHome.includes('Cartaisy'), false);

const publishedHome = home([], {
  homeLayout: {
    status: 'published',
    label: 'Published',
    detail: 'The installed app reads this section order under the home header.',
    needsPublish: false,
  },
});
assert.match(publishedHome, /data-home-layout="published"/);
assert.match(publishedHome, /Published/);
assert.match(publishedHome, /home header/);
assert.equal(publishedHome.includes('#publish-home'), false);
assert.equal(publishedHome.includes('>Publish home<'), false);
assert.equal(publishedHome.includes('Cartaisy'), false);
assert.equal(publishedHome.includes('shpat_'), false);

console.log('home install checks passed');
