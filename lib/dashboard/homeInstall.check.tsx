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
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const loadHomeSource = source('./loadHome.ts');
const cardSource = source('../../components/dashboard/home/HomeInstallCard.tsx');
const homeSource = source('../../components/dashboard/home/ConnectedHome.tsx');
const boardSource = source('../../components/build/InstallQrBoard.tsx');
const previewSource = source('../build/installPreview.ts');

assert.match(loadHomeSource, /readyInstallsFromList/);
assert.match(homeSource, /HomeInstallCard/);
assert.match(cardSource, /BUILD_MY_APP_HREF/);
assert.doesNotMatch(cardSource, /EXPO_TOKEN|easBuildId|access_token|shpat_|api\.qrserver|chart\.googleapis/);
assert.doesNotMatch(cardSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(cardSource, /INSTALL_QR_WAIT_COPY|installQrSlots/);
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

function facts(installs: ReadyInstall[]): ConnectedHomeFacts {
  return {
    syncLabel: 'Synced',
    syncDetail: null,
    buildLabel: 'Android · Ready',
    buildDetail: null,
    buildState: 'present',
    productCount: 12,
    orderCount: 3,
    modules: { kind: 'empty' },
    activity: null,
    next: null,
    catalogBlock: null,
    installs,
  };
}

function home(installs: ReadyInstall[]): string {
  return renderToStaticMarkup(createElement(ConnectedHome, { storeName: 'Northwind', shop: 'northwind.myshopify.com', facts: facts(installs) }));
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
assert.match(ready, /App build/);
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
const one = home(androidOnly);
assert.equal((one.match(/data-install-qr/g) ?? []).length, 1);
assert.match(one, /Android is ready/);
assert.equal(one.includes('iOS is ready'), false);
assert.equal(one.includes(ANDROID), false);

const none = home(
  readyInstallsFromList([
    request('66f1c2e0a1b2c3d4e5f6071a', 'building', 'queued', { android: ANDROID }),
    request('66f1c2e0a1b2c3d4e5f6071b', 'ready', 'ready'),
    request('66f1c2e0a1b2c3d4e5f6071c', 'failed', 'waiting_on_merchant', { ios: IOS }),
  ])
);
assert.equal(none.includes('data-home-install'), false);
assert.equal(none.includes('data-install-qr'), false);
assert.equal(none.includes('Scan to install'), false);
assert.match(none, /Connected to northwind.myshopify.com/);
assert.match(none, /App build/);

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

console.log('home install checks passed');
